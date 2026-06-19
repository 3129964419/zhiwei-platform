export interface Admin {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: 'super_admin' | 'admin' | 'moderator';
  status: 'active' | 'inactive';
  createdAt: number;
  lastLoginAt: number | null;
  permissions: string[];
}

export interface AdminSession {
  adminId: string;
  token: string;
  expiresAt: number;
  ipAddress: string;
  userAgent: string;
  createdAt: number;
}

export interface AdminLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  target: string;
  detail: string;
  ipAddress: string;
  userAgent: string;
  createdAt: number;
  status: 'success' | 'failed';
}

export interface AdminPermission {
  id: string;
  name: string;
  description: string;
  category: 'user' | 'admin' | 'system' | 'data' | 'finance';
}

export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  totalAgents: number;
  totalMessages: number;
  totalTokensUsed: number;
  totalRevenue: number;
  subscriptionRevenue: number;
  payAsYouGoRevenue: number;
  avgDailyTokens: number;
  userGrowthRate: number;
}

export type AdminRole = 'super_admin' | 'admin' | 'moderator';

export const ADMIN_PERMISSIONS: AdminPermission[] = [
  { id: 'user_view', name: '查看用户', description: '查看所有用户信息', category: 'user' },
  { id: 'user_edit', name: '编辑用户', description: '编辑用户信息', category: 'user' },
  { id: 'user_delete', name: '删除用户', description: '删除用户', category: 'user' },
  { id: 'user_export', name: '导出用户', description: '导出用户数据', category: 'user' },
  { id: 'admin_view', name: '查看管理员', description: '查看所有管理员', category: 'admin' },
  { id: 'admin_create', name: '创建管理员', description: '创建新管理员', category: 'admin' },
  { id: 'admin_edit', name: '编辑管理员', description: '编辑管理员信息', category: 'admin' },
  { id: 'admin_delete', name: '删除管理员', description: '删除管理员', category: 'admin' },
  { id: 'log_view', name: '查看日志', description: '查看操作日志', category: 'system' },
  { id: 'log_export', name: '导出日志', description: '导出操作日志', category: 'system' },
  { id: 'stats_view', name: '查看统计', description: '查看系统统计数据', category: 'data' },
  { id: 'config_edit', name: '编辑配置', description: '编辑系统配置', category: 'system' },
  { id: 'finance_view', name: '查看财务', description: '查看财务数据', category: 'finance' },
  { id: 'finance_export', name: '导出财务', description: '导出财务数据', category: 'finance' },
];

export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  super_admin: ADMIN_PERMISSIONS.map(p => p.id),
  admin: ADMIN_PERMISSIONS.filter(p => p.id !== 'admin_create' && p.id !== 'admin_delete').map(p => p.id),
  moderator: ['user_view', 'user_edit', 'log_view', 'stats_view'],
};