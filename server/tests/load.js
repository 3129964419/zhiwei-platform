/**
 * 压力测试
 * 运行: npm run load-test
 * 需要安装 k6: https://k6.io/docs/getting-started/installation/
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// 自定义指标
const errorRate = new Rate('errors');
const sendDuration = new Trend('send_duration');
const verifyDuration = new Trend('verify_duration');

// 测试配置
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const TEST_PHONE_PREFIX = '1380013';

export const options = {
  scenarios: {
    // 常规压力测试
    steady_state: {
      executor: 'constant-vus',
      vus: 50,
      duration: '2m',
    },
    // 峰值测试
    spike: {
      executor: 'spike',
      stages: [
        { duration: '30s', target: 100 },
        { duration: '1m', target: 100 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],
    errors: ['rate<0.1'],
  },
};

// 随机生成手机号
function generatePhone() {
  return TEST_PHONE_PREFIX + String(Math.floor(Math.random() * 9000 + 1000));
}

export default function () {
  const phone = generatePhone();
  const deviceId = `device_${__VU}_${__ITER}`;

  // 测试发送验证码
  const sendRes = http.post(
    `${BASE_URL}/api/sms/send`,
    JSON.stringify({ phone }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'send_sms' },
    }
  );

  sendDuration.add(sendRes.timings.duration);

  check(sendRes, {
    'send status 200 or 429': (r) => r.status === 200 || r.status === 429,
    'send has success field': (r) => JSON.parse(r.body).success !== undefined,
  }) || errorRate.add(1);

  sleep(1);

  // 测试验证接口（即使没有真实验证码）
  const verifyRes = http.post(
    `${BASE_URL}/api/sms/verify`,
    JSON.stringify({ phone, code: '123456' }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'verify_sms' },
    }
  );

  verifyDuration.add(verifyRes.timings.duration);

  check(verifyRes, {
    'verify status 200 or 400': (r) => r.status === 200 || r.status === 400,
  }) || errorRate.add(1);

  sleep(1);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data),
  };
}

function textSummary(data, options) {
  const { metrics } = data;
  
  let summary = '\n';
  summary += '='.repeat(60) + '\n';
  summary += '  压力测试报告\n';
  summary += '='.repeat(60) + '\n\n';
  
  summary += `总请求数: ${metrics.http_reqs.values.count}\n`;
  summary += `请求速率: ${metrics.http_reqs.values.rate.toFixed(2)} req/s\n`;
  summary += `平均响应时间: ${metrics.http_req_duration.values.avg.toFixed(2)} ms\n`;
  summary += `P95 响应时间: ${metrics.http_req_duration.values['p(95)'].toFixed(2)} ms\n`;
  summary += `错误率: ${(metrics.errors.values.rate * 100).toFixed(2)}%\n`;
  
  summary += '\n' + '='.repeat(60) + '\n';
  
  return summary;
}
