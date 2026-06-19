const express = require('express');
const Joi = require('joi');
const {
  storeCode,
  getCode,
  deleteCode,
  checkSendRate,
  recordSendTime,
  checkIpRate,
  checkDeviceRate,
  incrementAttempts,
  getAttempts,
  clearAttempts,
  lockPhone,
  isPhoneLocked,
} = require('../services/redisService');
const { sendSms, validatePhone } = require('../services/smsService');
const {
  generateCode,
  encryptCode,
  decryptCode,
  validateCodeFormat,
  generateDeviceId,
} = require('../services/codeGenerator');
const { logSmsEvent } = require('../services/logger');
const config = require('../config');

const router = express.Router();

// 请求验证 schema
const sendSchema = Joi.object({
  phone: Joi.string().pattern(/^1[3-9]\d{9}$/).required(),
  deviceId: Joi.string().optional(),
});

const verifySchema = Joi.object({
  phone: Joi.string().pattern(/^1[3-9]\d{9}$/).required(),
  code: Joi.string().length(6).pattern(/^\d+$/).required(),
  deviceId: Joi.string().optional(),
});

/**
 * POST /api/sms/send
 * 发送验证码
 */
router.post('/send', async (req, res, next) => {
  try {
    // 验证请求体
    const { error, value } = sendSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        code: 'VALIDATION_ERROR',
      });
    }

    const { phone, deviceId } = value;
    const ip = req.ip || req.headers['x-forwarded-for'];
    const generatedDeviceId = deviceId || generateDeviceId(req);

    // 1. 检查手机号是否被锁定
    if (await isPhoneLocked(phone)) {
      logSmsEvent.blocked(phone, ip, generatedDeviceId, 'PHONE_LOCKED');
      return res.status(429).json({
        success: false,
        message: '账号已被锁定，请15分钟后再试',
        code: 'PHONE_LOCKED',
      });
    }

    // 2. 检查 IP 请求频率
    const ipCheck = await checkIpRate(ip);
    if (!ipCheck.allowed) {
      logSmsEvent.blocked(phone, ip, generatedDeviceId, 'IP_RATE_LIMIT');
      return res.status(429).json({
        success: false,
        message: '请求过于频繁，请稍后再试',
        code: 'IP_RATE_LIMIT',
      });
    }

    // 3. 检查设备请求频率
    if (deviceId) {
      const deviceCheck = await checkDeviceRate(deviceId);
      if (!deviceCheck.allowed) {
        logSmsEvent.blocked(phone, ip, generatedDeviceId, 'DEVICE_RATE_LIMIT');
        return res.status(429).json({
          success: false,
          message: '设备请求过于频繁',
          code: 'DEVICE_RATE_LIMIT',
        });
      }
    }

    // 4. 检查手机号发送频率
    const sendCheck = await checkSendRate(phone);
    if (!sendCheck.allowed) {
      logSmsEvent.blocked(phone, ip, generatedDeviceId, 'SEND_RATE_LIMIT');
      return res.status(429).json({
        success: false,
        message: `请${sendCheck.remainingTime}秒后再试`,
        code: 'SEND_RATE_LIMIT',
        remainingTime: sendCheck.remainingTime,
      });
    }

    // 5. 生成验证码
    const code = generateCode();
    const encryptedCode = encryptCode(code);

    // 6. 存储验证码
    await storeCode(phone, encryptedCode, config.sms.codeExpiry);
    await recordSendTime(phone);

    // 7. 发送短信
    const result = await sendSms(phone, code);

    if (result.success) {
      logSmsEvent.send(phone, ip, generatedDeviceId, true, result.message);
      res.json({
        success: true,
        message: '验证码已发送',
        expiresIn: config.sms.codeExpiry,
      });
    } else {
      logSmsEvent.send(phone, ip, generatedDeviceId, false, result.message);
      res.status(500).json({
        success: false,
        message: result.message,
        code: 'SMS_SEND_FAILED',
      });
    }
  } catch (error) {
    logSmsEvent.error(error, { context: 'send_sms' });
    next(error);
  }
});

/**
 * POST /api/sms/verify
 * 验证验证码
 */
router.post('/verify', async (req, res, next) => {
  try {
    // 验证请求体
    const { error, value } = verifySchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        code: 'VALIDATION_ERROR',
      });
    }

    const { phone, code, deviceId } = value;
    const ip = req.ip || req.headers['x-forwarded-for'];
    const generatedDeviceId = deviceId || generateDeviceId(req);

    // 1. 检查手机号是否被锁定
    if (await isPhoneLocked(phone)) {
      logSmsEvent.blocked(phone, ip, generatedDeviceId, 'PHONE_LOCKED');
      return res.status(429).json({
        success: false,
        message: '账号已被锁定，请15分钟后再试',
        code: 'PHONE_LOCKED',
      });
    }

    // 2. 检查验证码格式
    if (!validateCodeFormat(code)) {
      logSmsEvent.verify(phone, ip, generatedDeviceId, false, 'INVALID_FORMAT');
      return res.status(400).json({
        success: false,
        message: '验证码格式错误',
        code: 'INVALID_FORMAT',
      });
    }

    // 3. 获取存储的验证码
    const storedEncryptedCode = await getCode(phone);
    
    if (!storedEncryptedCode) {
      logSmsEvent.verify(phone, ip, generatedDeviceId, false, 'CODE_NOT_FOUND');
      return res.status(400).json({
        success: false,
        message: '验证码已过期，请重新获取',
        code: 'CODE_EXPIRED',
      });
    }

    // 4. 解密并比对验证码
    const decryptedCode = decryptCode(storedEncryptedCode);
    
    if (!decryptedCode || decryptedCode !== code) {
      // 增加错误尝试次数
      const attempts = await incrementAttempts(phone);
      
      logSmsEvent.verify(phone, ip, generatedDeviceId, false, `WRONG_CODE_ATTEMPTS:${attempts}`);
      
      // 如果连续5次错误，锁定手机号
      if (attempts >= config.security.maxVerifyAttempts) {
        await lockPhone(phone);
        await deleteCode(phone);
        logSmsEvent.blocked(phone, ip, generatedDeviceId, 'MAX_ATTEMPTS_EXCEEDED');
        
        return res.status(429).json({
          success: false,
          message: '验证码错误次数过多，账号已锁定15分钟',
          code: 'MAX_ATTEMPTS_EXCEEDED',
          lockedUntil: Date.now() + config.security.lockDuration * 1000,
        });
      }

      return res.status(400).json({
        success: false,
        message: `验证码错误，剩余${config.security.maxVerifyAttempts - attempts}次机会`,
        code: 'WRONG_CODE',
        remainingAttempts: config.security.maxVerifyAttempts - attempts,
      });
    }

    // 5. 验证成功
    await clearAttempts(phone);
    await deleteCode(phone);

    logSmsEvent.verify(phone, ip, generatedDeviceId, true, 'SUCCESS');
    
    // 生成临时 token 用于后续登录
    const token = Buffer.from(`${phone}:${Date.now()}`).toString('base64');

    res.json({
      success: true,
      message: '验证成功',
      token,
      expiresIn: 300, // token 5分钟有效期
    });
  } catch (error) {
    logSmsEvent.error(error, { context: 'verify_sms' });
    next(error);
  }
});

/**
 * GET /api/sms/health
 * 健康检查
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'SMS service is running',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
