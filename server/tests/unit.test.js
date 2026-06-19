/**
 * 单元测试
 * 运行: npm test
 */

const { generateCode, encryptCode, decryptCode, validateCodeFormat } = require('../src/services/codeGenerator');
const { validatePhone, maskPhone } = require('../src/services/smsService');

describe('验证码生成服务', () => {
  test('生成6位数字验证码', () => {
    const code = generateCode();
    expect(code).toHaveLength(6);
    expect(/^\d{6}$/.test(code)).toBe(true);
  });

  test('加密解密一致性', () => {
    const code = '123456';
    const encrypted = encryptCode(code);
    const decrypted = decryptCode(encrypted);
    expect(decrypted).toBe(code);
  });

  test('验证码格式验证', () => {
    expect(validateCodeFormat('123456')).toBe(true);
    expect(validateCodeFormat('12345')).toBe(false);
    expect(validateCodeFormat('1234567')).toBe(false);
    expect(validateCodeFormat('abcdef')).toBe(false);
    expect(validateCodeFormat('')).toBe(false);
  });
});

describe('短信服务', () => {
  test('手机号格式验证', () => {
    expect(validatePhone('13800138000').valid).toBe(true);
    expect(validatePhone('1380013800').valid).toBe(false);
    expect(validatePhone('138001380001').valid).toBe(false);
    expect(validatePhone('23800138000').valid).toBe(false);
    expect(validatePhone('').valid).toBe(false);
  });

  test('手机号脱敏', () => {
    expect(maskPhone('13800138000')).toBe('138****8000');
    expect(maskPhone('123')).toBe('123');
  });
});
