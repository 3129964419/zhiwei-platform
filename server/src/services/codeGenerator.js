const crypto = require('crypto');
const config = require('../config');

/**
 * 生成6位数字验证码
 */
function generateCode(length = config.sms.codeLength) {
  const code = Math.floor(
    Math.random() * Math.pow(10, length)
  ).toString().padStart(length, '0');
  
  return code;
}

/**
 * 加密验证码
 */
function encryptCode(code) {
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(config.encryption.key),
    Buffer.from(config.encryption.iv)
  );
  
  let encrypted = cipher.update(code, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return encrypted;
}

/**
 * 解密验证码
 */
function decryptCode(encryptedCode) {
  try {
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(config.encryption.key),
      Buffer.from(config.encryption.iv)
    );
    
    let decrypted = decipher.update(encryptedCode, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    return null;
  }
}

/**
 * 验证验证码格式
 */
function validateCodeFormat(code) {
  if (!code || typeof code !== 'string') {
    return false;
  }
  
  // 必须是6位数字
  return /^\d{6}$/.test(code);
}

/**
 * 生成设备ID (如果未提供)
 */
function generateDeviceId(req) {
  // 优先使用请求头中的设备标识
  const deviceId = 
    req.headers['x-device-id'] ||
    req.headers['x-request-id'] ||
    req.headers['x-forwarded-for'] ||
    req.ip ||
    'unknown';
  
  // 哈希处理以保护隐私
  return crypto.createHash('sha256').update(deviceId).digest('hex').slice(0, 32);
}

/**
 * 生成请求ID (用于日志追踪)
 */
function generateRequestId() {
  return crypto.randomUUID();
}

module.exports = {
  generateCode,
  encryptCode,
  decryptCode,
  validateCodeFormat,
  generateDeviceId,
  generateRequestId,
};
