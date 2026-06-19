const Redis = require('ioredis');
const config = require('../config');
const { logger } = require('./logger');

// Redis 客户端
let redis = null;

/**
 * 初始化 Redis 连接
 */
async function initRedis() {
  if (redis) return redis;

  redis = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password || undefined,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

  redis.on('connect', () => {
    logger.info('Redis connected successfully');
  });

  redis.on('error', (err) => {
    logger.error('Redis connection error:', err);
  });

  await redis.connect();
  return redis;
}

/**
 * 获取 Redis 客户端
 */
function getRedis() {
  if (!redis) {
    throw new Error('Redis not initialized. Call initRedis() first.');
  }
  return redis;
}

// 验证码相关 Key
const KEYS = {
  smsCode: (phone) => `sms:code:${phone}`,
  smsSendTime: (phone) => `sms:send:${phone}`,
  smsAttempts: (phone) => `sms:attempts:${phone}`,
  ipRequests: (ip) => `ip:requests:${ip}`,
  deviceRequests: (deviceId) => `device:requests:${deviceId}`,
  phoneLock: (phone) => `phone:lock:${phone}`,
};

/**
 * 存储验证码
 */
async function storeCode(phone, encryptedCode, expirySeconds) {
  const key = KEYS.smsCode(phone);
  await redis.setex(key, expirySeconds, encryptedCode);
}

/**
 * 获取验证码
 */
async function getCode(phone) {
  const key = KEYS.smsCode(phone);
  return await redis.get(key);
}

/**
 * 删除验证码
 */
async function deleteCode(phone) {
  const key = KEYS.smsCode(phone);
  await redis.del(key);
}

/**
 * 检查手机号发送频率
 */
async function checkSendRate(phone) {
  const key = KEYS.smsSendTime(phone);
  const lastSend = await redis.get(key);
  
  if (lastSend) {
    const elapsed = (Date.now() - parseInt(lastSend)) / 1000;
    if (elapsed < config.sms.sendInterval) {
      return {
        allowed: false,
        remainingTime: Math.ceil(config.sms.sendInterval - elapsed),
      };
    }
  }
  
  return { allowed: true };
}

/**
 * 记录发送时间
 */
async function recordSendTime(phone) {
  const key = KEYS.smsSendTime(phone);
  await redis.setex(key, config.sms.sendInterval, Date.now().toString());
}

/**
 * 增加验证尝试次数
 */
async function incrementAttempts(phone) {
  const key = KEYS.smsAttempts(phone);
  const attempts = await redis.incr(key);
  
  // 设置过期时间
  if (attempts === 1) {
    await redis.expire(key, config.security.lockDuration);
  }
  
  return attempts;
}

/**
 * 获取验证尝试次数
 */
async function getAttempts(phone) {
  const key = KEYS.smsAttempts(phone);
  const attempts = await redis.get(key);
  return parseInt(attempts) || 0;
}

/**
 * 清除验证尝试次数
 */
async function clearAttempts(phone) {
  const key = KEYS.smsAttempts(phone);
  await redis.del(key);
}

/**
 * 检查 IP 请求频率
 */
async function checkIpRate(ip) {
  const key = KEYS.ipRequests(ip);
  const count = await redis.incr(key);
  
  if (count === 1) {
    await redis.expire(key, 60); // 1分钟内
  }
  
  return {
    allowed: count <= config.security.maxRequestsPerIp,
    count,
  };
}

/**
 * 检查设备请求频率
 */
async function checkDeviceRate(deviceId) {
  if (!deviceId) return { allowed: true };
  
  const key = KEYS.deviceRequests(deviceId);
  const count = await redis.incr(key);
  
  if (count === 1) {
    await redis.expire(key, 60);
  }
  
  return {
    allowed: count <= config.security.maxRequestsPerDevice,
    count,
  };
}

/**
 * 锁定手机号
 */
async function lockPhone(phone, duration = config.security.lockDuration) {
  const key = KEYS.phoneLock(phone);
  await redis.setex(key, duration, 'locked');
}

/**
 * 检查手机号是否被锁定
 */
async function isPhoneLocked(phone) {
  const key = KEYS.phoneLock(phone);
  const locked = await redis.get(key);
  return !!locked;
}

/**
 * 关闭 Redis 连接
 */
async function closeRedis() {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

module.exports = {
  initRedis,
  getRedis,
  KEYS,
  storeCode,
  getCode,
  deleteCode,
  checkSendRate,
  recordSendTime,
  incrementAttempts,
  getAttempts,
  clearAttempts,
  checkIpRate,
  checkDeviceRate,
  lockPhone,
  isPhoneLocked,
  closeRedis,
};
