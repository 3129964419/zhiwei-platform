export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const kvUrl = process.env.KV_URL || '';
    const kvRestApiUrl = process.env.KV_REST_API_URL || '';
    const kvRestApiToken = process.env.KV_REST_API_TOKEN || '';
    
    const regex = /^rediss?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)$/;
    const match = kvUrl.match(regex);
    
    let url = '';
    let token = '';
    
    if (match) {
      const [, username, password, host, port] = match;
      url = `https://${host}:${port}`;
      token = password;
    }
    
    return res.status(200).json({
      success: true,
      message: '环境变量调试',
      envVars: {
        KV_URL: kvUrl.substring(0, 50) + '...',
        KV_REST_API_URL: kvRestApiUrl.substring(0, 50) + '...',
        KV_REST_API_TOKEN: kvRestApiToken.substring(0, 20) + '...',
      },
      regexMatch: {
        matched: !!match,
        parts: match ? {
          username: match[1],
          password: match[2].substring(0, 20) + '...',
          host: match[3],
          port: match[4],
        } : null,
      },
      constructed: {
        url,
        token: token.substring(0, 20) + '...',
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '调试失败',
      error: error.message,
    });
  }
}
