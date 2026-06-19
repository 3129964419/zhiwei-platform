/**
 * 验证码 API 服务
 * 与后端 SMS 服务对接
 */

// SMS 服务基础 URL
// 使用相对路径，因为 API 和前端部署在同一域名
const SMS_API_BASE = import.meta.env.VITE_SMS_API_URL || '/api/sms';

// 模拟模式 (开发环境)
const MOCK_MODE = import.meta.env.DEV;

/**
 * 发送验证码
 */
export async function sendVerificationCode(
  phone: string,
  deviceId?: string
): Promise<{ success: boolean; message: string; expiresIn?: number; remainingTime?: number; demoCode?: string }> {
  // 手机号格式验证
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    return { success: false, message: '请输入正确的手机号' };
  }

  if (MOCK_MODE) {
    // 模拟模式
    await new Promise((resolve) => setTimeout(resolve, 600));
    const demoCode = '123456';
    console.log(`[SMS Mock] 验证码: ${demoCode}`);
    return {
      success: true,
      message: '验证码已发送（演示：123456）',
      expiresIn: 300,
      demoCode,
    };
  }

  try {
    const response = await fetch(`${SMS_API_BASE}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-ID': deviceId || generateDeviceId(),
      },
      body: JSON.stringify({ phone }),
    });

    const data = await response.json();

    return {
      success: data.success,
      message: data.message,
      expiresIn: data.expiresIn,
      remainingTime: data.remainingTime,
      demoCode: data.demoCode,
    };
  } catch (error) {
    console.error('Send code error:', error);
    return { success: false, message: '网络错误，请稍后重试' };
  }
}

/**
 * 验证验证码
 */
export async function verifyCode(
  phone: string,
  code: string,
  deviceId?: string
): Promise<{ success: boolean; message: string; token?: string }> {
  // 验证码格式验证
  if (!/^\d{6}$/.test(code)) {
    return { success: false, message: '验证码应为6位数字' };
  }

  if (MOCK_MODE) {
    // 模拟模式
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    if (code === '123456' || code === '000000') {
      return {
        success: true,
        message: '验证成功',
        token: btoa(`${phone}:${Date.now()}`),
      };
    }
    
    return { success: false, message: '验证码错误（演示请使用123456）' };
  }

  try {
    const response = await fetch(`${SMS_API_BASE}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-ID': deviceId || generateDeviceId(),
      },
      body: JSON.stringify({ phone, code }),
    });

    const data = await response.json();

    return {
      success: data.success,
      message: data.message,
      token: data.token,
    };
  } catch (error) {
    console.error('Verify code error:', error);
    return { success: false, message: '网络错误，请稍后重试' };
  }
}

/**
 * 生成设备ID
 */
function generateDeviceId(): string {
  const storageKey = 'zhiwei:device-id';
  
  let deviceId = localStorage.getItem(storageKey);
  
  if (!deviceId) {
    deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);
    localStorage.setItem(storageKey, deviceId);
  }
  
  return deviceId;
}

/**
 * 获取设备ID
 */
export function getDeviceId(): string {
  return generateDeviceId();
}
