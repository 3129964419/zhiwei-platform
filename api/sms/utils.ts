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
export const KEYS = {
  smsCode: (phone: string) => `sms:code:${phone}`,
  smsSendTime: (phone: string) => `sms:send:${phone}`,
  smsAttempts: (phone: string) => `sms:attempts:${phone}`,
  phoneLock: (phone: string) => `phone:lock:${phone}`,
};

// 配置
export const CONFIG = {
  codeLength: 6,
  codeExpiry: 300,
  sendInterval: 60,
  maxVerifyAttempts: 5,
  lockDuration: 900,
};

/**
 * 生成6位验证码
 */
export function generateCode() {
  return Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
}

/**
 * 验证手机号格式
 */
export function validatePhone(phone: string) {
  return /^1[3-9]\d{9}$/.test(phone);
}

/**
 * 获取客户端 IP
 */
export function getClientIP(req: any) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}
