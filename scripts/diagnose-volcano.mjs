/**
 * 火山引擎 API 详细诊断测试脚本
 * 运行方式: node scripts/diagnose-volcano.mjs
 */

import 'dotenv/config';

const API_KEY = process.env.VITE_VOLCANO_API_KEY;
const BASE_URL = process.env.VITE_VOLCANO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';
const ENDPOINT_ID = process.env.VITE_VOLCANO_ENDPOINT_ID;
const MODEL = process.env.VITE_VOLCANO_MODEL || 'doubao-seed-2.0-lite';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
};

function log(color, ...args) {
  console.log(colors[color], ...args, colors.reset);
}

function logSection(title) {
  console.log();
  log('bold', `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  log('bold', ` ${title}`);
  log('bold', `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log();
}

// =============================================
// 检测步骤
// =============================================

let passedCount = 0;
let failedCount = 0;

function checkResult(name, passed, details = '') {
  if (passed) {
    log('green', `✅ 通过: ${name}`);
    passedCount++;
  } else {
    log('red', `❌ 失败: ${name}`);
    failedCount++;
  }
  if (details) {
    console.log(`   ${details}`);
  }
}

// 步骤 1: 检查 API 请求参数
function checkAPIParameters() {
  logSection('步骤 1: 检查 API 请求参数完整性');

  // 检查 API Key
  const hasApiKey = API_KEY && API_KEY.length > 0 && API_KEY !== 'your_volcano_api_key_here';
  checkResult('API Key 已配置', hasApiKey, hasApiKey ? `Key: ${API_KEY.slice(0, 15)}...` : 'API Key 未配置或为占位符');

  // 检查 Key 格式 (火山引擎的 key 通常以 ark- 开头)
  const validKeyFormat = API_KEY && API_KEY.startsWith('ark-');
  checkResult('API Key 格式正确', validKeyFormat, validKeyFormat ? 'Key 以 ark- 开头' : 'Key 格式可能不正确');

  // 检查 Base URL
  const validBaseUrl = BASE_URL && BASE_URL.includes('volces.com/api');
  checkResult('Base URL 格式正确', validBaseUrl, `URL: ${BASE_URL}`);

  // 检查 Endpoint ID
  const hasEndpointId = ENDPOINT_ID && ENDPOINT_ID.length > 0;
  checkResult('Endpoint ID 已配置', hasEndpointId, hasEndpointId ? `ID: ${ENDPOINT_ID}` : 'Endpoint ID 未配置');

  // 检查 Model
  const validModel = MODEL && MODEL.length > 0;
  checkResult('模型名称已配置', validModel, `Model: ${MODEL}`);

  // 检查必需的头信息
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY || ''}`
  };
  log('dim', `   请求头将包含:`);
  log('dim', `   - Content-Type: ${headers['Content-Type']}`);
  log('dim', `   - Authorization: Bearer ${API_KEY ? API_KEY.slice(0, 15) + '...' : '未配置'}`);

  return hasApiKey && validBaseUrl && validModel;
}

// 步骤 2: 验证网络连接
async function checkNetworkConnection() {
  logSection('步骤 2: 验证网络连接与端点可达性');

  // 测试 DNS 解析
  try {
    const url = new URL(BASE_URL);
    log('dim', `   主机名: ${url.hostname}`);

    // 测试基础连接 (使用 fetch)
    const startTime = Date.now();
    try {
      const response = await fetch(BASE_URL, {
        method: 'HEAD',
        headers: { 'Authorization': `Bearer ${API_KEY}` }
      });
      const latency = Date.now() - startTime;
      checkResult('API 端点可达', true, `延迟: ${latency}ms, 状态: ${response.status}`);
    } catch (netError) {
      checkResult('API 端点可达', false, `错误: ${netError.message}`);
    }
  } catch (e) {
    checkResult('URL 格式正确', false, `错误: ${e.message}`);
  }

  // 测试 API 端点响应
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${BASE_URL}/models`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${API_KEY}` },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    checkResult('API 端点响应正常', response.ok, `HTTP ${response.status}`);
  } catch (netError) {
    if (netError.name === 'AbortError') {
      checkResult('API 端点响应正常', false, '请求超时 (10秒)');
    } else {
      checkResult('API 端点响应正常', false, `错误: ${netError.message}`);
    }
  }
}

// 步骤 3: 分析 API 错误响应
async function analyzeAPIError() {
  logSection('步骤 3: 分析 API 错误响应');

  // 尝试发送一个简单请求获取错误详情
  try {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'user', content: '你好' }
        ],
        max_tokens: 10,
      }),
    });

    if (!response.ok) {
      let errorBody;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text();
      }

      log('red', `   HTTP 状态码: ${response.status}`);
      log('red', `   错误响应: ${JSON.stringify(errorBody, null, 2)}`);

      // 解析常见错误
      const errorCode = errorBody?.error?.code || errorBody?.code;
      const errorMessage = errorBody?.error?.message || errorBody?.message || errorBody?.msg;

      if (errorCode) {
        log('yellow', `   错误码: ${errorCode}`);
      }
      if (errorMessage) {
        log('yellow', `   错误信息: ${errorMessage}`);
      }

      // 火山引擎常见错误码解读
      const errorMappings = {
        'invalid_api_key': 'API Key 无效或已过期，请检查控制台',
        'authentication_failed': '认证失败，请检查 API Key 是否正确',
        'permission_denied': '权限不足，当前 Key 没有访问该模型的权限',
        'rate_limit_exceeded': '请求频率超限，请降低调用频率或申请提升配额',
        'quota_exceeded': '配额已用完，请检查账户余额或申请提升配额',
        'invalid_parameter': '请求参数无效，请检查参数格式',
        'invalid_model': '指定的模型不可用，请确认模型名称',
        'context_length_exceeded': '输入长度超过模型支持的最大上下文',
        'internal_error': '服务器内部错误，请稍后重试',
      };

      if (errorCode && errorMappings[errorCode]) {
        log('cyan', `   💡 建议: ${errorMappings[errorCode]}`);
      }

      checkResult('API 返回错误详情', true, `错误码: ${errorCode || 'unknown'}`);
    } else {
      checkResult('API 返回错误详情', false, 'API 请求成功，未返回错误');
    }
  } catch (e) {
    checkResult('API 返回错误详情', false, `无法获取错误详情: ${e.message}`);
  }
}

// 步骤 4: 检查 API 版本和端点 URL
function checkAPIEndpoint() {
  logSection('步骤 4: 验证 API 版本和端点 URL');

  // 检查是否为正确的 API 版本
  const isV3 = BASE_URL.includes('/v3');
  checkResult('使用 API v3 版本', isV3, isV3 ? '正确使用 v3 版本' : '建议使用 v3 版本');

  // 检查是否为正确的区域端点
  const isBeijing = BASE_URL.includes('cn-beijing');
  const isShanghai = BASE_URL.includes('cn-shanghai');
  const isGuangzhou = BASE_URL.includes('cn-guangzhou');
  const isCorrectRegion = isBeijing || isShanghai || isGuangzhou;

  checkResult('使用正确的区域端点', isCorrectRegion, `区域: ${isBeijing ? '北京' : isShanghai ? '上海' : isGuangzhou ? '广州' : '未知'}`);

  // 列出正确的端点格式
  log('dim', '   正确的端点格式:');
  log('dim', '   - https://ark.cn-beijing.volces.com/api/v3 (北京)');
  log('dim', '   - https://ark.cn-shanghai.volces.com/api/v3 (上海)');
  log('dim', '   - https://ark.cn-guangzhou.volces.com/api/v3 (广州)');
  log('dim', '   - https://ark.ap-singapore.volces.com/api/v3 (新加坡)');
}

// 步骤 5: 检查账户状态和配额
async function checkAccountStatus() {
  logSection('步骤 5: 检查账户状态和配额');

  // 尝试获取账户信息
  try {
    const response = await fetch('https://console.volcengine.com/api/account', {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });

    if (response.status === 401) {
      checkResult('账户认证状态', false, 'API Key 可能已失效');
    } else if (response.status === 403) {
      checkResult('账户认证状态', false, '权限不足，无法访问账户信息');
    } else {
      checkResult('账户认证状态', true, `HTTP ${response.status}`);
    }
  } catch (e) {
    log('dim', `   无法直接检查账户状态: ${e.message}`);
    log('yellow', '   💡 建议: 登录控制台 https://console.volcengine.com 检查账户余额');
  }

  // 建议用户检查的事项
  log('yellow', '   请在控制台检查:');
  log('yellow', '   1. 账户余额是否充足');
  log('yellow', '   2. API Key 是否已激活');
  log('yellow', '   3. 是否已创建 Endpoint');
  log('yellow', '   4. 模型调用配额是否充足');
}

// 步骤 6: 测试不同输入
async function testDifferentInputs() {
  logSection('步骤 6: 测试不同输入内容');

  const testCases = [
    { name: '简短中文', content: '你好' },
    { name: '简短英文', content: 'Hello' },
    { name: '空内容', content: '' },
  ];

  for (const testCase of testCases) {
    try {
      const response = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: 'user', content: testCase.content }],
          max_tokens: 10,
        }),
      });

      const status = response.ok ? '✅' : '❌';
      const statusText = response.ok ? 'green' : 'red';
      log(status, `${testCase.name} (${testCase.content || '(空)'}): HTTP ${response.status}`);

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        if (error?.error?.message) {
          log('dim', `   错误: ${error.error.message}`);
        }
      }
    } catch (e) {
      log('red', `   ${testCase.name}: 网络错误 - ${e.message}`);
    }
  }
}

// =============================================
// 主诊断流程
// =============================================

async function runDiagnosis() {
  console.clear();
  log('bold', '\n');
  log('bold', '███████╗██╗   ██╗███████╗████████╗███████╗███╗   ███╗');
  log('bold', '██╔══██╗╚██╗ ██╔╝██╔════╝╚══██╔══╝██╔════╝████╗ ████║');
  log('bold', '██████╔╝ ╚████╔╝ ███████╗   ██║   █████╗  ██╔████╔██║');
  log('bold', '██╔══██╗  ╚██╔╝  ╚════██║   ██║   ██╔══╝  ██║╚██╔╝██║');
  log('bold', '██║  ██║   ██║   ███████║   ██║   ███████╗██║ ╚═╝ ██║');
  log('bold', '╚═╝  ╚═╝   ╚═╝   ╚══════╝   ╚═╝   ╚══════╝╚═╝     ╚═╝');
  log('bold', '                    诊断测试 v1.0');
  log('reset', '\n');

  logSection('火山引擎 API 诊断报告');
  log('dim', `   诊断时间: ${new Date().toLocaleString('zh-CN')}`);
  log('dim', `   API Key: ${API_KEY ? API_KEY.slice(0, 20) + '...' : '未配置'}`);
  log('dim', `   Base URL: ${BASE_URL}`);
  log('dim', `   Endpoint ID: ${ENDPOINT_ID || '未配置'}`);
  log('dim', `   Model: ${MODEL}`);

  // 执行各项检测
  const paramsOk = checkAPIParameters();
  await checkNetworkConnection();
  checkAPIEndpoint();
  await analyzeAPIError();
  await checkAccountStatus();
  await testDifferentInputs();

  // 输出总结
  logSection('诊断总结');

  console.log(`   检测项目: ${passedCount + failedCount}`);
  log('green', `   ✅ 通过: ${passedCount}`);
  log('red', `   ❌ 失败: ${failedCount}`);
  console.log();

  if (failedCount > 0) {
    log('bold', '   🔧 建议操作:');
    console.log();
    log('yellow', '   1. 确认 API Key 已正确复制，没有多余空格或字符');
    log('yellow', '   2. 登录控制台检查账户余额和配额');
    log('yellow', '   3. 确认已创建 Endpoint 并获取 Endpoint ID');
    log('yellow', '   4. 尝试使用不同的模型名称');
    log('yellow', '   5. 检查网络防火墙设置');
    console.log();
    log('cyan', '   📖 文档参考:');
    log('cyan', '   - 官方文档: https://www.volcengine.com/docs/82379/1263512');
    log('cyan', '   - 控制台: https://console.volcengine.com/ark/');
    log('cyan', '   - API 调试: https://www.volcengine.com/docs/82379/1263512');
  } else {
    log('green', '   🎉 所有检测通过，API 应该可以正常使用');
  }

  console.log();
}

// 运行诊断
runDiagnosis().catch(console.error);
