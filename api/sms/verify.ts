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
    const { phone, code } = req.body || {};

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: '请输入正确的手机号',
        code: 'INVALID_PHONE',
      });
    }

    if (!code || !/^\d{6}$/.test(code)) {
      return res.status(400).json({
        success: false,
        message: '验证码应为6位数字',
        code: 'INVALID_CODE_FORMAT',
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

    const storedCode = await kv.get(`sms:code:${phone}`);
    if (!storedCode) {
      return res.status(400).json({
        success: false,
        message: '验证码已过期，请重新获取',
        code: 'CODE_EXPIRED',
      });
    }

    if (storedCode.toString() !== code) {
      const attempts = await kv.get(`sms:attempts:${phone}`);
      const newAttempts = attempts ? parseInt(attempts) + 1 : 1;
      
      if (newAttempts >= 5) {
        await kv.set(`phone:lock:${phone}`, '1', { ex: 900 });
        await kv.del(`sms:code:${phone}`);
        return res.status(429).json({
          success: false,
          message: '验证码错误次数过多，账号已被锁定',
          code: 'PHONE_LOCKED',
        });
      }
      
      await kv.set(`sms:attempts:${phone}`, newAttempts.toString(), { ex: 300 });
      return res.status(400).json({
        success: false,
        message: `验证码错误，还剩${5 - newAttempts}次机会`,
        code: 'INVALID_CODE',
        remainingAttempts: 5 - newAttempts,
      });
    }

    await kv.del(`sms:code:${phone}`);
    await kv.del(`sms:attempts:${phone}`);

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
