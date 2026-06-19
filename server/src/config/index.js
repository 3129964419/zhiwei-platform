require('dotenv').config();

module.exports = {
  // Redis 配置
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  },

  // 阿里云短信配置
  aliyun: {
    accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
    signName: process.env.ALIYUN_SIGN_NAME || '智微科技',
    templateCode: process.env.ALIYUN_TEMPLATE_CODE,
  },

  // 腾讯云短信配置 (备选)
  tencent: {
    secretId: process.env.TENCENT_SECRET_ID,
    secretKey: process.env.TENCENT_SECRET_KEY,
    smsAppId: process.env.TENCENT_SMS_APP_ID,
    templateId: process.env.TENCENT_TEMPLATE_ID,
    sign: process.env.TENCENT_SIGN || '智微科技',
  },

  // 服务配置
  server: {
    port: parseInt(process.env.PORT) || 3000,
    env: process.env.NODE_ENV || 'development',
  },

  // 验证码配置
  sms: {
    codeLength: parseInt(process.env.CODE_LENGTH) || 6,
    codeExpiry: parseInt(process.env.CODE_EXPIRY) || 300, // 5分钟
    sendInterval: parseInt(process.env.SEND_INTERVAL) || 60, // 1分钟
  },

  // 防刷配置
  security: {
    maxRequestsPerIp: parseInt(process.env.MAX_REQUESTS_PER_IP) || 10,
    maxRequestsPerDevice: parseInt(process.env.MAX_REQUESTS_PER_DEVICE) || 5,
    maxVerifyAttempts: parseInt(process.env.MAX_VERIFY_ATTEMPTS) || 5,
    lockDuration: parseInt(process.env.LOCK_DURATION) || 900, // 15分钟
  },

  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || './logs',
  },

  // 加密密钥
  encryption: {
    key: process.env.ENCRYPTION_KEY || 'your-32-character-secret-key-here!',
    iv: process.env.ENCRYPTION_IV || 'your-16-char-iv-here',
  },
};
