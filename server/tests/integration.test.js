/**
 * 集成测试
 * 需要运行中的 Redis 和 SMS 服务
 */

const request = require('supertest');

// 假设服务运行在 localhost:3000
const API_BASE = process.env.TEST_API_URL || 'http://localhost:3000';

describe('SMS API 集成测试', () => {
  let authToken;

  describe('POST /api/sms/send', () => {
    test('发送验证码 - 成功', async () => {
      const res = await request(API_BASE)
        .post('/api/sms/send')
        .send({ phone: '13800138000' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.expiresIn).toBe(300);
    });

    test('发送验证码 - 无效手机号', async () => {
      const res = await request(API_BASE)
        .post('/api/sms/send')
        .send({ phone: '1234567890' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    test('发送验证码 - 频率限制', async () => {
      // 连续发送多次，应该被限制
      for (let i = 0; i < 3; i++) {
        await request(API_BASE)
          .post('/api/sms/send')
          .send({ phone: '13800138001' });
      }

      const res = await request(API_BASE)
        .post('/api/sms/send')
        .send({ phone: '13800138001' })
        .expect(429);

      expect(res.body.code).toBe('SEND_RATE_LIMIT');
    });
  });

  describe('POST /api/sms/verify', () => {
    test('验证验证码 - 错误验证码', async () => {
      const res = await request(API_BASE)
        .post('/api/sms/verify')
        .send({ phone: '13800138000', code: '000000' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    test('验证验证码 - 无效格式', async () => {
      const res = await request(API_BASE)
        .post('/api/sms/verify')
        .send({ phone: '13800138000', code: '12345' })
        .expect(400);

      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/sms/health', () => {
    test('健康检查', async () => {
      const res = await request(API_BASE)
        .get('/api/sms/health')
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
