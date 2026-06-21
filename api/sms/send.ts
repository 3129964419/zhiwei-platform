export default async function handler(req, res) {
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

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: '请输入正确的手机号',
        code: 'INVALID_PHONE',
      });
    }

    const { createClient } = await import('@vercel/kv');
    const kv = createClient({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });

    const isLocked = await kv.get(`phone:lock:${phone}`);
    if (isLocked) {
      return res.status(429).json({
        success: false,
        message: '账号已被锁定，请15分钟后再试',
        code: 'PHONE_LOCKED',
      });
    }

    const lastSend = await kv.get(`sms:send:${phone}`);
    if (lastSend) {
      const elapsed = (Date.now() - parseInt(lastSend)) / 1000;
      if (elapsed < 60) {
        return res.status(429).json({
          success: false,
          message: `请${Math.ceil(60 - elapsed)}秒后再试`,
          code: 'SEND_RATE_LIMIT',
          remainingTime: Math.ceil(60 - elapsed),
        });
      }
    }

    const code = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');

    await kv.set(`sms:code:${phone}`, code, { ex: 300 });
    await kv.set(`sms:send:${phone}`, Date.now().toString(), { ex: 60 });

    return res.status(200).json({
      success: true,
      message: '验证码已发送',
      expiresIn: 300,
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
