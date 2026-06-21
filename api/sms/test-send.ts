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
    const { phone } = req.body || {};
    
    if (!phone) {
      return res.status(400).json({ success: false, message: '手机号不能为空' });
    }
    
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ success: false, message: '请输入正确的手机号' });
    }

    const { createClient } = await import('@vercel/kv');
    const kv = createClient({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });

    const code = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    
    await kv.set(`sms:code:${phone}`, code, { ex: 300 });
    await kv.set(`sms:send:${phone}`, Date.now().toString(), { ex: 60 });
    
    const storedCode = await kv.get(`sms:code:${phone}`);
    
    return res.status(200).json({
      success: true,
      message: '验证码已发送',
      demoCode: code,
      storedCode,
      match: code === storedCode,
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
