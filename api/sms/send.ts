import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getKV, KEYS, CONFIG, validatePhone, getClientIP, generateCode } from './utils';

/**
 * 发送验证码 API
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
