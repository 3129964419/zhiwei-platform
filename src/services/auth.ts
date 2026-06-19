import type { User } from '@/types';
import { storage } from './storage';
import { delay, generateId } from '@/utils/common';
import { csrf } from '@/utils/security';
import { session } from './session';

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
  async sendCode(phone: string): Promise<{ success: boolean; message?: string }> {
    await delay(600);
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return { success: false, message: '请输入正确的手机号' };
    }
    return { success: true, message: '验证码已发送（演示：123456）' };
  },

  async loginByCode(phone: string, code: string): Promise<User> {
    await delay(800);
    if (code !== '123456' && code !== '000000') {
      throw new Error('验证码错误，演示请使用 123456');
    }
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

  async loginByPassword(phone: string, password: string): Promise<User> {
    await delay(800);
    if (password.length < 6) throw new Error('密码长度至少 6 位');
    return this.loginByCode(phone, '123456');
  },

  async wechatLogin(): Promise<User> {
    await delay(1200);
    const user: User = {
      id: generateId('user'),
      phone: '13900139000',
      nickname: '微信用户',
      avatar: '微',
      wechatOpenid: generateId('wx'),
      createdAt: Date.now(),
    };
    storage.set(USER_KEY, user);
    csrf.refreshToken();
    session.setExpiry(24);
    return user;
  },

  getCurrent(): User | null {
    if (session.isExpired()) {
      this.logout();
      return null;
    }
    return storage.get<User | null>(USER_KEY, null);
  },

  logout(): void {
    storage.remove(USER_KEY);
    csrf.clearToken();
    session.clear();
  },

  updateUser(user: User): void {
    storage.set(USER_KEY, user);
  },

  getAll(): User[] {
    return [storage.get<User | null>(USER_KEY, null)].filter(Boolean) as User[];
  },
};
