export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    return res.status(200).json({
      success: true,
      message: '测试API正常工作',
      method: req.method,
      envVars: {
        KV_URL: process.env.KV_REST_API_URL ? '配置了' : '未配置',
        KV_TOKEN: process.env.KV_REST_API_TOKEN ? '配置了' : '未配置',
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '服务异常',
      error: error.message,
    });
  }
}
