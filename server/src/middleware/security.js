const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { generateRequestId } = require('../services/codeGenerator');

/**
 * 安全中间件
 */
const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
});

/**
 * 请求 ID 中间件
 */
const requestIdMiddleware = (req, res, next) => {
  req.requestId = generateRequestId();
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

/**
 * IP 频率限制 - 通用请求
 */
const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 60, // 最多60次请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试',
    code: 'RATE_LIMIT',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for'] || 'unknown';
  },
});

/**
 * 验证码发送频率限制
 */
const smsSendRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 3, // 最多3次
  message: {
    success: false,
    message: '发送过于频繁，请稍后再试',
    code: 'SMS_RATE_LIMIT',
    remainingTime: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `sms:send:${req.ip}:${req.body?.phone || 'unknown'}`;
  },
});

/**
 * 验证码验证频率限制
 */
const smsVerifyRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 10, // 最多10次
  message: {
    success: false,
    message: '验证过于频繁',
    code: 'VERIFY_RATE_LIMIT',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `sms:verify:${req.ip}:${req.body?.phone || 'unknown'}`;
  },
});

/**
 * CORS 配置
 */
const corsMiddleware = (req, res, next) => {
  // 允许的域名列表
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'https://3dpixel.top',
    'https://*.vercel.app',
  ];

  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin) || !origin) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Device-ID, X-Request-ID');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
};

/**
 * 请求体大小限制
 */
const bodyParserMiddleware = (req, res, next) => {
  const contentLength = parseInt(req.headers['content-length'] || '0');
  
  if (contentLength > 1024) { // 1KB
    return res.status(400).json({
      success: false,
      message: '请求体过大',
      code: 'BODY_TOO_LARGE',
    });
  }
  
  next();
};

/**
 * 错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误',
    code: err.code || 'INTERNAL_ERROR',
    requestId: req.requestId,
  });
};

module.exports = {
  securityMiddleware,
  requestIdMiddleware,
  generalRateLimiter,
  smsSendRateLimiter,
  smsVerifyRateLimiter,
  corsMiddleware,
  bodyParserMiddleware,
  errorHandler,
};
