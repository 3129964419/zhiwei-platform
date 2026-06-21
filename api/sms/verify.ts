import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getKV, KEYS, CONFIG, validatePhone, getClientIP } from './utils';

/**
 * 验证验证码 API
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 设置 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { phone, code } = req.body || {};

    // 验证手机号
    if (!phone || !validatePhone(phone)) {
      return res.status(400).json({
        success: false,
        message: '请输入正确的手机号',
        code: 'INVALID_PHONE',
      });
    }

    // 验证验证码格式
    if (!code || !/^\d{6}$/.test(code)) {
      return res.status(400).json({
        success: false,
        message: '验证码应为6位数字',
        code: 'INVALID_CODE_FORMAT',
      });
    }

    const ip = getClientIP(req);
    const storage = await getKV();

    // 检查手机号是否被锁定
    const isLocked = await storage.get(KEYS.phoneLock(phone));
    if (isLocked) {
      return res.status(429).json({
        success: false,
        message: '账号已被锁定，请15分钟后再试',
        code: 'PHONE_LOCKED',
      });
    }

    // 获取存储的验证码
    const storedCode = await storage.get(KEYS.smsCode(phone));

    if (!storedCode) {
      return res.status(400).json({
        success: false,
        message: '验证码已过期，请重新获取',
        code: 'CODE_EXPIRED',
      });
    }

    // 验证验证码
    if (storedCode !== code) {
      // 增加错误次数
      const attemptsKey = KEYS.smsAttempts(phone);
      let attempts = (await storage.get(attemptsKey)) || 0;
      attempts = parseInt(attempts) + 1;
      await storage.set(attemptsKey, attempts.toString(), { ex: CONFIG.lockDuration });

      // 超过5次错误，锁定手机号
      if (attempts >= CONFIG.maxVerifyAttempts) {
        await storage.set(KEYS.phoneLock(phone), 'locked', { ex: CONFIG.lockDuration });
        await storage.del(KEYS.smsCode(phone));
        
        return res.status(429).json({
          success: false,
          message: '验证码错误次数过多，账号已锁定15分钟',
          code: 'MAX_ATTEMPTS_EXCEEDED',
          lockedUntil: Date.now() + CONFIG.lockDuration * 1000,
        });
      }

      return res.status(400).json({
        success: false,
        message: `验证码错误，剩余${CONFIG.maxVerifyAttempts - attempts}次机会`,
        code: 'WRONG_CODE',
        remainingAttempts: CONFIG.maxVerifyAttempts - attempts,
      });
    }

    // 验证成功
    await storage.del(KEYS.smsCode(phone));
    await storage.del(KEYS.smsAttempts(phone));

    // 生成临时 token
    const token = Buffer.from(`${phone}:${Date.now()}`).toString('base64');

    return res.status(200).json({
      success: true,
      message: '验证成功',
      token,
      expiresIn: 300,
    });
  } catch (error) {
    console.error('Verify code error:', error);
    return res.status(500).json({
      success: false,
      message: '服务异常，请稍后重试',
      code: 'SERVER_ERROR',
    });
  }
}
