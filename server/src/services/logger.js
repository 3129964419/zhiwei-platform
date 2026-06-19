const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../config');

// 确保日志目录存在
const logDir = path.resolve(config.logging.dir);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 自定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    let log = `${timestamp} [${level.toUpperCase()}] ${message}`;
    if (Object.keys(metadata).length > 0) {
      log += ` ${JSON.stringify(metadata)}`;
    }
    return log;
  })
);

// 创建日志实例
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports: [
    // 控制台输出
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      ),
    }),
    // 文件输出 - 所有日志
    new winston.transports.File({
      filename: path.join(logDir, 'sms.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 30,
    }),
    // 文件输出 - 错误日志
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 30,
    }),
  ],
});

// 专门的日志记录函数
const logSmsEvent = {
  // 验证码发送
  send: (phone, ip, deviceId, success, message) => {
    logger.info('SMS_SEND', {
      event: 'SEND',
      phone: maskPhone(phone),
      ip,
      deviceId,
      success,
      message,
      timestamp: new Date().toISOString(),
    });
  },

  // 验证码验证
  verify: (phone, ip, deviceId, success, reason) => {
    logger.info('SMS_VERIFY', {
      event: 'VERIFY',
      phone: maskPhone(phone),
      ip,
      deviceId,
      success,
      reason,
      timestamp: new Date().toISOString(),
    });
  },

  // 验证码过期
  expire: (phone, ip, deviceId) => {
    logger.info('SMS_EXPIRE', {
      event: 'EXPIRE',
      phone: maskPhone(phone),
      ip,
      deviceId,
      timestamp: new Date().toISOString(),
    });
  },

  // 防刷拦截
  blocked: (phone, ip, deviceId, reason) => {
    logger.warn('SMS_BLOCKED', {
      event: 'BLOCKED',
      phone: maskPhone(phone),
      ip,
      deviceId,
      reason,
      timestamp: new Date().toISOString(),
    });
  },

  // 系统错误
  error: (error, context) => {
    logger.error('SMS_ERROR', {
      event: 'ERROR',
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    });
  },
};

// 手机号脱敏
function maskPhone(phone) {
  if (!phone || phone.length !== 11) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-4);
}

module.exports = {
  logger,
  logSmsEvent,
};
