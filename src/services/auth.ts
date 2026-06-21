import type { User } from '@/types';
import { storage } from './storage';
import { delay, generateId } from '@/utils/common';
import { csrf } from '@/utils/security';
import { session } from './session';
import { sendVerificationCode, verifyCode, getDeviceId } from './smsApi';

const USER_KEY = 'currentUser';

const SAMPLE_USERS: User[] = [
  {
    id: 'user_demo_1',
    phone: '13800138000',
    nickname: '林深时见鹿',
    avatar: 'L',
    createdAt: Date.now() - 86400000 * 30,
  },
];

export const authAPI = {
  /**
   * 发送验证码
   * 使用真实 SMS 服务或模拟
   */
  async sendCode(phone: string): Promise<{ success: boolean; message?: string; expiresIn?: number; demoCode?: string }> {
    const deviceId = getDeviceId();
    return await sendVerificationCode(phone, deviceId);
  },

  /**
   * 使用验证码登录
   */
  async loginByCode(phone: string, code: string): Promise<User> {
    const deviceId = getDeviceId();
    
    // 使用真实验证服务
    const result = await verifyCode(phone, code, deviceId);
    
    if (!result.success) {
      throw new Error(result.message);
    }

    // 模拟延迟
    await delay(300);

    const existing = SAMPLE_USERS.find((u) => u.phone === phone);
    const user: User = existing || {
      id: generateId('user'),
      phone,
      nickname: `用户${phone.slice(-4)}`,
      avatar: phone.slice(-1),
      createdAt: Date.now(),
    };
    
    storage.set(USER_KEY, user);
    csrf.refreshToken();
    session.setExpiry(24);
    return user;
  },

  /**
   * 使用密码登录
   */
  async loginByPassword(phone: string, password: string): Promise<User> {
    await delay(800);
    if (password.length < 6) throw new Error('密码长度至少 6 位');
    return this.loginByCode(phone, '123456');
  },

  /**
   * 获取当前登录用户
   */
  getCurrent(): User | null {
    if (session.isExpired()) {
      this.logout();
      return null;
    }
    return storage.get<User | null>(USER_KEY, null);
  },

  /**
   * 登出
   */
  logout(): void {
    storage.remove(USER_KEY);
    csrf.clearToken();
    session.clear();
  },

  /**
   * 更新用户信息
   */
  updateUser(user: User): void {
    storage.set(USER_KEY, user);
  },

  /**
   * 获取所有用户
   */
  getAll(): User[] {
    return [storage.get<User | null>(USER_KEY, null)].filter(Boolean) as User[];
  },
};
