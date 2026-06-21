export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { createClient } = await import('@vercel/kv');
    
    const kv = createClient({
      url: process.env.KV_URL || process.env.KV_REST_API_URL,
      token: process.env.KV_TOKEN || process.env.KV_REST_API_TOKEN,
    });

    const testKey = 'test:kv:connection';
    const testValue = `test-${Date.now()}`;
    
    await kv.set(testKey, testValue, { ex: 60 });
    const retrievedValue = await kv.get(testKey);
    
    return res.status(200).json({
      success: true,
      message: 'KV存储测试成功',
      envVars: {
        KV_URL: process.env.KV_URL ? '配置了' : '未配置',
        KV_REST_API_URL: process.env.KV_REST_API_URL ? '配置了' : '未配置',
        KV_TOKEN: process.env.KV_TOKEN ? '配置了' : '未配置',
        KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN ? '配置了' : '未配置',
      },
      testResult: {
        setValue: testValue,
        getValue: retrievedValue,
        match: testValue === retrievedValue,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'KV存储测试失败',
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5),
    });
  }
}
