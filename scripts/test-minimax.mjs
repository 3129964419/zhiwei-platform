/**
 * MiniMax API Token 调用测试脚本
 * 运行方式: node scripts/test-minimax.mjs
 */

import 'dotenv/config';

const API_KEY = process.env.VITE_MINIMAX_API_KEY;
const BASE_URL = process.env.VITE_MINIMAX_BASE_URL || 'https://api.minimaxi.chat/v1';
const GROUP_ID = process.env.VITE_MINIMAX_GROUP_ID;

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

// 模拟定价计算
const PRICING = {
  // API 成本 (MiniMax 实际收费)
  costPerMillionPrompt: 0.015,      // $0.015 / 1M prompt tokens
  costPerMillionCompletion: 0.08,   // $0.08 / 1M completion tokens
  costPerTenThousandTTS: 0.4,       // $0.4 / 10k TTS chars

  // 用户售价 (向用户收费)
  pricePerMillionPrompt: 0.05,      // $0.05 / 1M prompt tokens
  pricePerMillionCompletion: 0.15,  // $0.15 / 1M completion tokens
  pricePerTenThousandTTS: 1.5,      // $1.5 / 10k TTS chars
};

function calculateCost(promptTokens, completionTokens) {
  const promptCost = (promptTokens / 1000000) * PRICING.costPerMillionPrompt;
  const completionCost = (completionTokens / 1000000) * PRICING.costPerMillionCompletion;
  return {
    promptCost,
    completionCost,
    totalCost: promptCost + completionCost,
  };
}

function calculateRevenue(promptTokens, completionTokens) {
  const promptRevenue = (promptTokens / 1000000) * PRICING.pricePerMillionPrompt;
  const completionRevenue = (completionTokens / 1000000) * PRICING.pricePerMillionCompletion;
  return {
    promptRevenue,
    completionRevenue,
    totalRevenue: promptRevenue + completionRevenue,
  };
}

function calculateProfit(promptTokens, completionTokens) {
  const cost = calculateCost(promptTokens, completionTokens);
  const revenue = calculateRevenue(promptTokens, completionTokens);
  const profit = revenue.totalRevenue - cost.totalCost;
  const margin = revenue.totalRevenue > 0 ? (profit / revenue.totalRevenue) * 100 : 0;
  return { cost, revenue, profit, margin };
}

async function testMiniMaxAPI() {
  log('cyan', '\n========================================');
  log('cyan', '  MiniMax API Token 调用测试');
  log('cyan', '========================================\n');

  // 检查配置
  log('yellow', '📋 配置检查:');
  console.log(`  API Key: ${API_KEY ? API_KEY.slice(0, 10) + '...' + API_KEY.slice(-4) : '未配置'}`);
  console.log(`  Base URL: ${BASE_URL}`);
  console.log(`  Group ID: ${GROUP_ID || '未配置'}`);
  console.log();

  if (!API_KEY || API_KEY === 'your_minimax_api_key_here') {
    log('red', '❌ 错误: 请先在 .env 文件中配置 VITE_MINIMAX_API_KEY');
    log('yellow', '\n配置步骤:');
    console.log('  1. 访问 https://www.minimaxi.com/ 注册账号');
    console.log('  2. 在控制台获取 API Key');
    console.log('  3. 编辑 .env 文件，填入实际的 API Key');
    console.log();
    return;
  }

  // 测试 API 调用
  log('yellow', '🚀 开始测试 API 调用...\n');

  try {
    const response = await fetch(`${BASE_URL}/text/chatcompletion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.7',
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
    console.log(`  Prompt Tokens:  ${usage.prompt_tokens}`);
    console.log(`  Completion Tokens: ${usage.completion_tokens}`);
    console.log(`  Total Tokens:   ${usage.total_tokens}`);
    console.log();

    // 计算成本和收益
    const analysis = calculateProfit(usage.prompt_tokens, usage.completion_tokens);

    log('cyan', '💰 成本与收益分析:');
    console.log('  ┌─────────────────────────────────────────┐');
    console.log(`  │ API 成本:                               │`);
    console.log(`  │   Prompt:     $${analysis.cost.promptCost.toFixed(6).padEnd(20)}│`);
    console.log(`  │   Completion: $${analysis.cost.completionCost.toFixed(6).padEnd(20)}│`);
    console.log(`  │   总成本:     $${analysis.cost.totalCost.toFixed(6).padEnd(20)}│`);
    console.log(`  │                                         │`);
    console.log(`  │ 用户收费:                               │`);
    console.log(`  │   Prompt:     $${analysis.revenue.promptRevenue.toFixed(6).padEnd(20)}│`);
    console.log(`  │   Completion: $${analysis.revenue.completionRevenue.toFixed(6).padEnd(20)}│`);
    console.log(`  │   总收费:     $${analysis.revenue.totalRevenue.toFixed(6).padEnd(20)}│`);
    console.log(`  │                                         │`);
    console.log(`  │ 利润: $${analysis.profit.toFixed(6)} (利润率: ${analysis.margin.toFixed(1)}%)`.padEnd(43) + '│');
    console.log('  └─────────────────────────────────────────┘');
    console.log();

    // 定价策略展示
    log('cyan', '📈 当前定价策略:');
    console.log('  ┌────────────────────────────────────────────────────────┐');
    console.log('  │           │   成本($/1M)   │   售价($/1M)   │  加价率  │');
    console.log('  ├────────────────────────────────────────────────────────┤');
    console.log(`  │ Prompt    │     $0.015     │     $0.05      │  +233%   │`);
    console.log(`  │ Completion│     $0.08      │     $0.15      │  +88%    │`);
    console.log(`  │ TTS       │     $0.4/10k   │     $1.5/10k   │  +275%   │`);
    console.log('  └────────────────────────────────────────────────────────┘');
    console.log();

    log('green', '✅ 测试完成! API 配置正确，定价系统运行正常。');

  } catch (error) {
    log('red', `❌ API 调用失败: ${error.message}`);
    console.log();
    log('yellow', '可能的原因:');
    console.log('  1. API Key 无效或已过期');
    console.log('  2. 网络连接问题');
    console.log('  3. API 端点地址错误');
    console.log('  4. 账户余额不足');
  }
}

// 运行测试
testMiniMaxAPI();
