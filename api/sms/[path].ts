/**
 * Vercel Serverless SMS API
 * 
 * 部署说明：
 * 1. 在 Vercel 项目中启用 KV 存储
 * 2. 配置环境变量
 * 3. 部署后即可使用
 */

// 存储服务 (使用 Vercel KV)
let kv = null;

async function getKV() {
  if (!kv) {
    const { createClient } = await import('@vercel/kv');
    kv = createClient({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
  }
  return kv;
}

// 存储 Key 前缀
const KEYS = {
  smsCode: (phone) => `sms:code:${phone}`,
  smsSendTime: (phone) => `sms:send:${phone}`,
  smsAttempts: (phone) => `sms:attempts:${phone}`,
  phoneLock: (phone) => `phone:lock:${phone}`,
};

// 配置
const CONFIG = {
  codeLength: 6,
  codeExpiry: 300,
  sendInterval: 60,
  maxVerifyAttempts: 5,
  lockDuration: 900,
};

/**
 * 生成6位验证码
 */
function generateCode() {
  return Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
}

/**
 * 验证手机号格式
 */
function validatePhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone);
}

/**
 * 获取客户端 IP
 */
function getClientIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

/**
 * 发送验证码 API
 */
export async function sendCode(req, res) {
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
    const { phone } = req.body || {};

    // 验证手机号
    if (!phone || !validatePhone(phone)) {
      return res.status(400).json({
        success: false,
        message: '请输入正确的手机号',
        code: 'INVALID_PHONE',
      });
    }

    const ip = getClientIP(req);

    // 检查手机号是否被锁定
    const storage = await getKV();
    const isLocked = await storage.get(KEYS.phoneLock(phone));
    if (isLocked) {
      return res.status(429).json({
        success: false,
        message: '账号已被锁定，请15分钟后再试',
        code: 'PHONE_LOCKED',
      });
    }

    // 检查发送频率
    const lastSend = await storage.get(KEYS.smsSendTime(phone));
    if (lastSend) {
      const elapsed = (Date.now() - parseInt(lastSend)) / 1000;
      if (elapsed < CONFIG.sendInterval) {
        return res.status(429).json({
          success: false,
          message: `请${Math.ceil(CONFIG.sendInterval - elapsed)}秒后再试`,
          code: 'SEND_RATE_LIMIT',
          remainingTime: Math.ceil(CONFIG.sendInterval - elapsed),
        });
      }
    }

    // 生成验证码
    const code = generateCode();

    // 存储验证码 (5分钟有效期)
    await storage.set(KEYS.smsCode(phone), code, { ex: CONFIG.codeExpiry });
    await storage.set(KEYS.smsSendTime(phone), Date.now().toString(), { ex: CONFIG.sendInterval });

    // 模拟发送短信 (实际项目中调用短信服务商 API)
    console.log(`[SMS] 发送验证码 ${code} 到 ${phone}`);

    return res.status(200).json({
      success: true,
      message: '验证码已发送',
      expiresIn: CONFIG.codeExpiry,
      // 演示模式：返回验证码方便测试
      ...(process.env.NODE_ENV !== 'production' && { demoCode: code }),
    });
  } catch (error) {
    console.error('Send code error:', error);
    return res.status(500).json({
      success: false,
      message: '服务异常，请稍后重试',
      code: 'SERVER_ERROR',
    });
  }
}

/**
 * 验证验证码 API
 */
export async function verifyCode(req, res) {
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

/**
 * Vercel Serverless Function Handler
 */
export default async function handler(req, res) {
  const path = req.query.path || [];

  if (path[0] === 'send') {
    return sendCode(req, res);
  } else if (path[0] === 'verify') {
    return verifyCode(req, res);
  }

  return res.status(404).json({
    success: false,
    message: 'API not found',
  });
}

// 禁用 body parsing，使用原始请求
export const config = {
  api: {
    bodyParser: true,
  },
};
