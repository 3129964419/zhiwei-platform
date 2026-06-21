let kv = null;

export async function getKV() {
  if (!kv) {
    const { createClient } = await import('@vercel/kv');
    kv = createClient({
      url: process.env.KV_URL || process.env.KV_REST_API_URL,
      token: process.env.KV_TOKEN || process.env.KV_REST_API_TOKEN,
    });
  }
  return kv;
}

export const KEYS = {
  smsCode: (phone) => `sms:code:${phone}`,
  smsSendTime: (phone) => `sms:send:${phone}`,
  smsAttempts: (phone) => `sms:attempts:${phone}`,
  phoneLock: (phone) => `phone:lock:${phone}`,
};

export const CONFIG = {
  codeLength: 6,
  codeExpiry: 300,
  sendInterval: 60,
  maxVerifyAttempts: 5,
  lockDuration: 900,
};

export function generateCode() {
  return Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
}

export function validatePhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone);
}

export function getClientIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}
