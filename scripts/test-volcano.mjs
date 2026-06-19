/**
 * 火山引擎 API Token 调用测试脚本
 * 运行方式: node scripts/test-volcano.mjs
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
};

function log(color, ...args) {
  console.log(colors[color], ...args, colors.reset);
}

// 火山引擎 Token 成本配置 (¥/MTok)
const TOKEN_COST = {
  'doubao-seed-2.0-pro': { input: 4.8, output: 24.0 },
  'doubao-seed-2.0-lite': { input: 0.9, output: 5.4 },
  'doubao-seed-2.0-mini': { input: 0.4, output: 4.0 },
  'doubao-seed-1.6-flash': { input: 0.15, output: 1.5 },
  'doubao-1.5-lite-32k': { input: 0.3, output: 0.6 },
  'deepseek-r1': { input: 4.0, output: 16.0 },
};

// 用户售价配置 (¥/MTok) - 在成本基础上加价
const SELLING_PRICE_MULTIPLIER = 2.0; // 2倍定价

function getPricing(model) {
  const cost = TOKEN_COST[model] || TOKEN_COST['doubao-seed-2.0-lite'];
  return {
    inputCost: cost.input,
    outputCost: cost.output,
    inputPrice: cost.input * SELLING_PRICE_MULTIPLIER,
    outputPrice: cost.output * SELLING_PRICE_MULTIPLIER,
  };
}

function calculateCost(promptTokens, completionTokens, model) {
  const pricing = getPricing(model);
  const promptCost = (promptTokens / 1000000) * pricing.inputCost;
  const completionCost = (completionTokens / 1000000) * pricing.outputCost;
  return {
    promptCost,
    completionCost,
    totalCost: promptCost + completionCost,
  };
}

function calculateRevenue(promptTokens, completionTokens, model) {
  const pricing = getPricing(model);
  const promptRevenue = (promptTokens / 1000000) * pricing.inputPrice;
  const completionRevenue = (completionTokens / 1000000) * pricing.outputPrice;
  return {
    promptRevenue,
    completionRevenue,
    totalRevenue: promptRevenue + completionRevenue,
  };
}

function calculateProfit(promptTokens, completionTokens, model) {
  const cost = calculateCost(promptTokens, completionTokens, model);
  const revenue = calculateRevenue(promptTokens, completionTokens, model);
  const profit = revenue.totalRevenue - cost.totalCost;
  const margin = revenue.totalRevenue > 0 ? (profit / revenue.totalRevenue) * 100 : 0;
  return { cost, revenue, profit, margin };
}

async function testVolcanoAPI() {
  log('cyan', '\n========================================');
  log('cyan', '  火山引擎 (Doubao) API 测试');
  log('cyan', '========================================\n');

  // 检查配置
  log('yellow', '📋 配置检查:');
  console.log(`  API Key: ${API_KEY ? API_KEY.slice(0, 10) + '...' + API_KEY.slice(-4) : '未配置'}`);
  console.log(`  Base URL: ${BASE_URL}`);
  console.log(`  Endpoint ID: ${ENDPOINT_ID || '未配置 (可选)'}`);
  console.log(`  Model: ${MODEL}`);
  console.log();

  if (!API_KEY || API_KEY === 'your_volcano_api_key_here') {
    log('red', '❌ 错误: 请先在 .env 文件中配置 VITE_VOLCANO_API_KEY');
    log('yellow', '\n配置步骤:');
    console.log('  1. 访问 https://console.volcengine.com/ark/ 注册火山引擎账号');
    console.log('  2. 国内版需要手机号+实名认证，国际版可用邮箱');
    console.log('  3. 创建 Endpoint 并获取 API Key');
    console.log('  4. 编辑 .env 文件，填入实际配置');
    console.log();
    return;
  }

  // 显示模型定价
  const pricing = getPricing(MODEL);
  log('cyan', '💰 模型定价参考:');
  console.log(`  模型: ${MODEL}`);
  console.log('  ┌─────────────────────────────────────────────────────────────┐');
  console.log('  │           │   成本(¥/MTok)   │   售价(¥/MTok)   │   加价率  │');
  console.log('  ├─────────────────────────────────────────────────────────────┤');
  console.log(`  │ Input     │     ¥${pricing.inputCost.toFixed(2).padEnd(10)}│     ¥${pricing.inputPrice.toFixed(2).padEnd(12)}│   ${((SELLING_PRICE_MULTIPLIER - 1) * 100).toFixed(0)}%    │`);
  console.log(`  │ Output    │     ¥${pricing.outputCost.toFixed(2).padEnd(10)}│     ¥${pricing.outputPrice.toFixed(2).padEnd(12)}│   ${((SELLING_PRICE_MULTIPLIER - 1) * 100).toFixed(0)}%    │`);
  console.log('  └─────────────────────────────────────────────────────────────┘');
  console.log();

  // 测试 API 调用
  log('yellow', '🚀 开始测试 API 调用...\n');

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
          { role: 'system', content: '你是一个友好的AI助手，请用简洁的语言回答问题。' },
          { role: 'user', content: '你好，请用一句话介绍你自己。' },
        ],
        temperature: 0.7,
        max_tokens: 100,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    log('green', '✅ API 调用成功!\n');

    // 显示响应
    log('cyan', '📝 响应内容:');
    console.log(`  ${data.choices[0].message.content}`);
    console.log();

    // 显示 Token 使用量
    const usage = data.usage;
    log('cyan', '📊 Token 使用统计:');
    console.log(`  Prompt Tokens:     ${usage.prompt_tokens}`);
    console.log(`  Completion Tokens: ${usage.completion_tokens}`);
    console.log(`  Total Tokens:      ${usage.total_tokens}`);
    console.log();

    // 计算成本和收益
    const analysis = calculateProfit(usage.prompt_tokens, usage.completion_tokens, MODEL);

    log('cyan', '💰 成本与收益分析:');
    console.log('  ┌───────────────────────────────────────────────┐');
    console.log(`  │ API 成本:                                   │`);
    console.log(`  │   Prompt:     ¥${analysis.cost.promptCost.toFixed(6).padEnd(23)}│`);
    console.log(`  │   Completion: ¥${analysis.cost.completionCost.toFixed(6).padEnd(23)}│`);
    console.log(`  │   总成本:     ¥${analysis.cost.totalCost.toFixed(6).padEnd(23)}│`);
    console.log(`  │                                           │`);
    console.log(`  │ 用户收费:                               │`);
    console.log(`  │   Prompt:     ¥${analysis.revenue.promptRevenue.toFixed(6).padEnd(23)}│`);
    console.log(`  │   Completion: ¥${analysis.revenue.completionRevenue.toFixed(6).padEnd(23)}│`);
    console.log(`  │   总收费:     ¥${analysis.revenue.totalRevenue.toFixed(6).padEnd(23)}│`);
    console.log(`  │                                           │`);
    console.log(`  │ 利润: ¥${analysis.profit.toFixed(6)} (利润率: ${analysis.margin.toFixed(1)}%)`.padEnd(48) + '│');
    console.log('  └───────────────────────────────────────────────┘');
    console.log();

    // 免费额度说明
    log('cyan', '🎁 免费额度:');
    console.log('  新用户注册送 50 万 Tokens 体验包');
    console.log('  每月免费额度视模型而定');
    console.log();

    log('green', '✅ 测试完成! 火山引擎 API 配置正确。');

  } catch (error) {
    log('red', `❌ API 调用失败: ${error.message}`);
    console.log();
    log('yellow', '可能的原因:');
    console.log('  1. API Key 无效或已过期');
    console.log('  2. 网络连接问题');
    console.log('  3. API 端点地址错误');
    console.log('  4. 账户余额不足');
    console.log('  5. 国内版需要手机号+实名认证');
  }
}

// 运行测试
testVolcanoAPI();
