const config = require('../config');
const { logger } = require('./logger');

// 短信服务提供商
const PROVIDERS = {
  ALIYUN: 'aliyun',
  TENCENT: 'tencent',
};

/**
 * 发送短信 - 阿里云版本
 */
async function sendSmsAliyun(phone, code) {
  try {
    // 动态导入阿里云 SDK
    const Dysmsapi = require('@alicloud/dysmsapi20170525');
    
    const client = new Dysmsapi({
      accessKeyId: config.aliyun.accessKeyId,
      accessKeySecret: config.aliyun.accessKeySecret,
      endpoint: 'dysmsapi.aliyuncs.com',
    });

    const response = await client.sendSms({
      phoneNumbers: phone,
      signName: config.aliyun.signName,
      templateCode: config.aliyun.templateCode,
      templateParam: JSON.stringify({ code }),
    });

    if (response.body.code === 'OK') {
      logger.info(`SMS sent via Aliyun to ${maskPhone(phone)}`);
      return { success: true, message: '发送成功' };
    } else {
      logger.error(`SMS send failed: ${response.body.message}`);
      return { success: false, message: response.body.message };
    }
  } catch (error) {
    logger.error('Aliyun SMS error:', error);
    return { success: false, message: '短信服务异常' };
  }
}

/**
 * 发送短信 - 腾讯云版本 (备选)
 */
async function sendSmsTencent(phone, code) {
  try {
    // 腾讯云短信 SDK
    const tencentcloud = require('tencentcloud-sdk-nodejs');
    const SmsClient = tencentcloud.sms.v20210111.Client;

    const client = new SmsClient({
      credential: {
        secretId: config.tencent.secretId,
        secretKey: config.tencent.secretKey,
      },
      region: 'ap-guangzhou',
    });

    const response = await client.SendSms({
      SmsSdkAppId: config.tencent.smsAppId,
      SignName: config.tencent.sign,
      TemplateId: config.tencent.templateId,
      PhoneNumberSet: [`+86${phone}`],
      TemplateParamSet: [code],
    });

    const result = response.SendStatusSet[0];
    if (result.code === 'Ok') {
      logger.info(`SMS sent via Tencent to ${maskPhone(phone)}`);
      return { success: true, message: '发送成功' };
    } else {
      logger.error(`SMS send failed: ${result.message}`);
      return { success: false, message: result.message };
    }
  } catch (error) {
    logger.error('Tencent SMS error:', error);
    return { success: false, message: '短信服务异常' };
  }
}

/**
 * 发送短信 - 模拟版本 (开发环境)
 */
async function sendSmsMock(phone, code) {
  logger.info(`[MOCK] SMS would be sent to ${maskPhone(phone)} with code: ${code}`);
  
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return { success: true, message: '发送成功(模拟)' };
}

/**
 * 发送短信 - 根据配置选择服务商
 */
async function sendSms(phone, code) {
  const isProduction = config.server.env === 'production';
  
  if (!isProduction) {
    // 开发环境使用模拟发送
    return sendSmsMock(phone, code);
  }
  
  // 生产环境优先使用阿里云
  if (config.aliyun.accessKeyId && config.aliyun.accessKeySecret) {
    return sendSmsAliyun(phone, code);
  }
  
  // 备选腾讯云
  if (config.tencent.secretId && config.tencent.secretKey) {
    return sendSmsTencent(phone, code);
  }
  
  // 如果都没有配置，使用模拟发送
  logger.warn('No SMS provider configured, using mock');
  return sendSmsMock(phone, code);
}

/**
 * 验证手机号格式
 */
function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, message: '手机号不能为空' };
  }
  
  // 中国大陆手机号格式
  const phoneRegex = /^1[3-9]\d{9}$/;
  
  if (!phoneRegex.test(phone)) {
    return { valid: false, message: '手机号格式不正确' };
  }
  
  return { valid: true };
}

/**
 * 手机号脱敏
 */
function maskPhone(phone) {
  if (!phone || phone.length !== 11) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-4);
}

module.exports = {
  sendSms,
  validatePhone,
  maskPhone,
  PROVIDERS,
};
