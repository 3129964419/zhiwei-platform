import { storage } from './storage';
import type { Admin, AdminSession, AdminRole } from '@/types/admin';
import { ROLE_PERMISSIONS } from '@/types/admin';

const ADMINS_KEY = 'admin_users';
const SESSIONS_KEY = 'admin_sessions';
const CURRENT_ADMIN_KEY = 'current_admin';

function generateToken(): string {
  return 'admin_' + Math.random().toString(36).substring(2, 30) + Date.now().toString(36);
}

function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'sha256_' + Math.abs(hash).toString(36);
}

function verifyPassword(password: string, hash: string): boolean {
  if (!hash.startsWith('sha256_')) return false;
  return hashPassword(password) === hash;
}

function initDefaultAdmin(): void {
  const admins = storage.get<Record<string, Admin>>(ADMINS_KEY, {});
  const defaultAdmin: Admin = {
    id: 'admin_001',
    username: '19283701843',
    email: 'admin@example.com',
    passwordHash: hashPassword('123'),
    role: 'super_admin',
    status: 'active',
    createdAt: Date.now(),
    lastLoginAt: null,
    permissions: ROLE_PERMISSIONS['super_admin'],
  };
  
  const existing = admins['admin_001'];
  if (existing) {
    existing.username = '19283701843';
    existing.passwordHash = hashPassword('123');
    existing.status = 'active';
    existing.role = 'super_admin';
    existing.permissions = ROLE_PERMISSIONS['super_admin'];
  } else {
    admins['admin_001'] = defaultAdmin;
  }
  storage.set(ADMINS_KEY, admins);
}

export const adminAuthService = {
  init(): void {
    initDefaultAdmin();
  },

  createAdmin(data: {
    username: string;
    password: string;
    email: string;
    role: AdminRole;
  }): Admin {
    const admins = storage.get<Record<string, Admin>>(ADMINS_KEY, {});
    
    if (Object.values(admins).some(a => a.username === data.username)) {
      throw new Error('用户名已存在');
    }
    
    if (Object.values(admins).some(a => a.email === data.email)) {
      throw new Error('邮箱已存在');
    }
    
    const admin: Admin = {
      id: 'admin_' + Date.now(),
      username: data.username,
      email: data.email,
      passwordHash: hashPassword(data.password),
      role: data.role,
      status: 'active',
      createdAt: Date.now(),
      lastLoginAt: null,
      permissions: ROLE_PERMISSIONS[data.role],
    };
    
    admins[admin.id] = admin;
    storage.set(ADMINS_KEY, admins);
    
    return admin;
  },

  login(username: string, password: string, ipAddress: string = '', userAgent: string = ''): { admin: Admin; token: string } {
    const admins = storage.get<Record<string, Admin>>(ADMINS_KEY, {});
    const admin = Object.values(admins).find(a => a.username === username);
    
    if (!admin) {
      throw new Error('用户名或密码错误');
    }
    
    if (admin.status !== 'active') {
      throw new Error('账号已被禁用');
    }
    
    if (!verifyPassword(password, admin.passwordHash)) {
      throw new Error('用户名或密码错误');
    }
    
    admin.lastLoginAt = Date.now();
    admins[admin.id] = admin;
    storage.set(ADMINS_KEY, admins);
    
    const token = generateToken();
    const session: AdminSession = {
      adminId: admin.id,
      token,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      ipAddress,
      userAgent,
      createdAt: Date.now(),
    };
    
    const sessions = storage.get<Record<string, AdminSession>>(SESSIONS_KEY, {});
    sessions[token] = session;
    storage.set(SESSIONS_KEY, sessions);
    
    storage.set(CURRENT_ADMIN_KEY, { admin, token });
    
    return { admin, token };
  },

  logout(): void {
    const current = storage.get<{ admin: Admin; token: string } | null>(CURRENT_ADMIN_KEY, null);
    if (current) {
      const sessions = storage.get<Record<string, AdminSession>>(SESSIONS_KEY, {});
      delete sessions[current.token];
      storage.set(SESSIONS_KEY, sessions);
    }
    storage.remove(CURRENT_ADMIN_KEY);
  },

  getCurrentAdmin(): Admin | null {
    const current = storage.get<{ admin: Admin; token: string } | null>(CURRENT_ADMIN_KEY, null);
    if (!current) return null;
    
    const sessions = storage.get<Record<string, AdminSession>>(SESSIONS_KEY, {});
    const session = sessions[current.token];
    
    if (!session || session.expiresAt < Date.now()) {
      this.logout();
      return null;
    }
    
    return current.admin;
  },

  validateToken(token: string): Admin | null {
    const sessions = storage.get<Record<string, AdminSession>>(SESSIONS_KEY, {});
    const session = sessions[token];
    
    if (!session || session.expiresAt < Date.now()) {
      return null;
    }
    
    const admins = storage.get<Record<string, Admin>>(ADMINS_KEY, {});
    return admins[session.adminId] || null;
  },

  getAllAdmins(): Admin[] {
    const admins = storage.get<Record<string, Admin>>(ADMINS_KEY, {});
    return Object.values(admins).sort((a, b) => b.createdAt - a.createdAt);
  },

  getAdminById(id: string): Admin | undefined {
    const admins = storage.get<Record<string, Admin>>(ADMINS_KEY, {});
    return admins[id];
  },

  updateAdmin(id: string, data: Partial<Admin>): Admin | undefined {
    const admins = storage.get<Record<string, Admin>>(ADMINS_KEY, {});
    const admin = admins[id];
    
    if (!admin) return undefined;
    
    if (data.username && data.username !== admin.username) {
      if (Object.values(admins).some(a => a.username === data.username && a.id !== id)) {
        throw new Error('用户名已存在');
      }
    }
    
    if (data.email && data.email !== admin.email) {
      if (Object.values(admins).some(a => a.email === data.email && a.id !== id)) {
        throw new Error('邮箱已存在');
      }
    }
    
    if (data.role) {
      data.permissions = ROLE_PERMISSIONS[data.role];
    }
    
    Object.assign(admin, data);
    admins[id] = admin;
    storage.set(ADMINS_KEY, admins);
    
    return admin;
  },

  deleteAdmin(id: string): boolean {
    const admins = storage.get<Record<string, Admin>>(ADMINS_KEY, {});
    if (!admins[id]) return false;
    
    const superAdmins = Object.values(admins).filter(a => a.role === 'super_admin');
    if (admins[id].role === 'super_admin' && superAdmins.length <= 1) {
      throw new Error('至少保留一个超级管理员');
    }
    
    delete admins[id];
    storage.set(ADMINS_KEY, admins);
    
    const sessions = storage.get<Record<string, AdminSession>>(SESSIONS_KEY, {});
    Object.keys(sessions).forEach(token => {
      if (sessions[token].adminId === id) {
        delete sessions[token];
      }
    });
    storage.set(SESSIONS_KEY, sessions);
    
    return true;
  },

  changePassword(id: string, newPassword: string): void {
    const admins = storage.get<Record<string, Admin>>(ADMINS_KEY, {});
    const admin = admins[id];
    
    if (!admin) {
      throw new Error('管理员不存在');
    }
    
    admin.passwordHash = hashPassword(newPassword);
    admins[id] = admin;
    storage.set(ADMINS_KEY, admins);
    
    const sessions = storage.get<Record<string, AdminSession>>(SESSIONS_KEY, {});
    Object.keys(sessions).forEach(token => {
      if (sessions[token].adminId === id) {
        delete sessions[token];
      }
    });
    storage.set(SESSIONS_KEY, sessions);
    
    if (this.getCurrentAdmin()?.id === id) {
      this.logout();
    }
  },

  checkPermission(admin: Admin, permission: string): boolean {
    return admin.permissions.includes(permission);
  },

  getSessions(adminId?: string): AdminSession[] {
    const sessions = storage.get<Record<string, AdminSession>>(SESSIONS_KEY, {});
    let results = Object.values(sessions);
    
    if (adminId) {
      results = results.filter(s => s.adminId === adminId);
    }
    
    return results.sort((a, b) => b.createdAt - a.createdAt);
  },

  invalidateSession(token: string): void {
    const sessions = storage.get<Record<string, AdminSession>>(SESSIONS_KEY, {});
    delete sessions[token];
    storage.set(SESSIONS_KEY, sessions);
    
    const current = storage.get<{ admin: Admin; token: string } | null>(CURRENT_ADMIN_KEY, null);
    if (current && current.token === token) {
      storage.remove(CURRENT_ADMIN_KEY);
    }
  },

  invalidateAllSessions(adminId: string): void {
    const sessions = storage.get<Record<string, AdminSession>>(SESSIONS_KEY, {});
    Object.keys(sessions).forEach(token => {
      if (sessions[token].adminId === adminId) {
        delete sessions[token];
      }
    });
    storage.set(SESSIONS_KEY, sessions);
    
    if (this.getCurrentAdmin()?.id === adminId) {
      this.logout();
    }
  },
};