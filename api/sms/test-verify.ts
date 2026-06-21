export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { phone, code } = req.body || {};
    
    if (!phone) {
      return res.status(400).json({ success: false, message: '手机号不能为空' });
    }
    
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ success: false, message: '请输入正确的手机号' });
    }
    
    if (!code) {
      return res.status(400).json({ success: false, message: '验证码不能为空' });
    }
    
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ success: false, message: '验证码应为6位数字' });
    }

    const { createClient } = await import('@vercel/kv');
    const kv = createClient({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });

    const storedCode = await kv.get(`sms:code:${phone}`);
    
    if (!storedCode) {
      return res.status(400).json({ success: false, message: '验证码已过期，请重新获取' });
    }
    
    if (storedCode.toString() !== code) {
      return res.status(400).json({ success: false, message: '验证码错误' });
    }
    
    await kv.del(`sms:code:${phone}`);
    
    const token = Buffer.from(`${phone}:${Date.now()}`).toString('base64');
    
    return res.status(200).json({
      success: true,
      message: '验证成功',
      token,
      expiresIn: 300,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '服务异常',
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5),
    });
  }
}
