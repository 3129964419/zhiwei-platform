import { storage } from './storage';
import type { AdminLog } from '@/types/admin';

const LOGS_KEY = 'admin_logs';

function generateId(): string {
  return 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

export const adminLogService = {
  record(log: Omit<AdminLog, 'id' | 'createdAt'>): AdminLog {
    const logs = storage.get<Record<string, AdminLog>>(LOGS_KEY, {});
    
    const newLog: AdminLog = {
      ...log,
      id: generateId(),
      createdAt: Date.now(),
    };
    
    logs[newLog.id] = newLog;
    storage.set(LOGS_KEY, logs);
    
    return newLog;
  },

  login(adminId: string, adminName: string, ipAddress: string, userAgent: string, success: boolean): void {
    this.record({
      adminId,
      adminName,
      action: 'admin_login',
      target: 'admin',
      detail: success ? '管理员登录成功' : '管理员登录失败',
      ipAddress,
      userAgent,
      status: success ? 'success' : 'failed',
    });
  },

  logout(adminId: string, adminName: string, ipAddress: string, userAgent: string): void {
    this.record({
      adminId,
      adminName,
      action: 'admin_logout',
      target: 'admin',
      detail: '管理员退出登录',
      ipAddress,
      userAgent,
      status: 'success',
    });
  },

  createAdmin(adminId: string, adminName: string, targetName: string): void {
    this.record({
      adminId,
      adminName,
      action: 'admin_create',
      target: 'admin',
      detail: `创建管理员: ${targetName}`,
      ipAddress: '',
      userAgent: '',
      status: 'success',
    });
  },

  updateAdmin(adminId: string, adminName: string, targetId: string): void {
    this.record({
      adminId,
      adminName,
      action: 'admin_update',
      target: 'admin',
      detail: `更新管理员: ${targetId}`,
      ipAddress: '',
      userAgent: '',
      status: 'success',
    });
  },

  deleteAdmin(adminId: string, adminName: string, targetId: string): void {
    this.record({
      adminId,
      adminName,
      action: 'admin_delete',
      target: 'admin',
      detail: `删除管理员: ${targetId}`,
      ipAddress: '',
      userAgent: '',
      status: 'success',
    });
  },

  viewUsers(adminId: string, adminName: string): void {
    this.record({
      adminId,
      adminName,
      action: 'user_view',
      target: 'users',
      detail: '查看用户列表',
      ipAddress: '',
      userAgent: '',
      status: 'success',
    });
  },

  editUser(adminId: string, adminName: string, userId: string): void {
    this.record({
      adminId,
      adminName,
      action: 'user_edit',
      target: 'user',
      detail: `编辑用户: ${userId}`,
      ipAddress: '',
      userAgent: '',
      status: 'success',
    });
  },

  deleteUser(adminId: string, adminName: string, userId: string): void {
    this.record({
      adminId,
      adminName,
      action: 'user_delete',
      target: 'user',
      detail: `删除用户: ${userId}`,
      ipAddress: '',
      userAgent: '',
      status: 'success',
    });
  },

  viewStats(adminId: string, adminName: string): void {
    this.record({
      adminId,
      adminName,
      action: 'stats_view',
      target: 'stats',
      detail: '查看系统统计',
      ipAddress: '',
      userAgent: '',
      status: 'success',
    });
  },

  editConfig(adminId: string, adminName: string, configKey: string): void {
    this.record({
      adminId,
      adminName,
      action: 'config_edit',
      target: 'config',
      detail: `修改配置: ${configKey}`,
      ipAddress: '',
      userAgent: '',
      status: 'success',
    });
  },

  viewFinance(adminId: string, adminName: string): void {
    this.record({
      adminId,
      adminName,
      action: 'finance_view',
      target: 'finance',
      detail: '查看财务数据',
      ipAddress: '',
      userAgent: '',
      status: 'success',
    });
  },

  exportData(adminId: string, adminName: string, dataType: string): void {
    this.record({
      adminId,
      adminName,
      action: 'data_export',
      target: dataType,
      detail: `导出数据: ${dataType}`,
      ipAddress: '',
      userAgent: '',
      status: 'success',
    });
  },

  getAllLogs(): AdminLog[] {
    const logs = storage.get<Record<string, AdminLog>>(LOGS_KEY, {});
    return Object.values(logs).sort((a, b) => b.createdAt - a.createdAt);
  },

  getLogsByAdmin(adminId: string): AdminLog[] {
    const logs = storage.get<Record<string, AdminLog>>(LOGS_KEY, {});
    return Object.values(logs)
      .filter(l => l.adminId === adminId)
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  getLogsByAction(action: string): AdminLog[] {
    const logs = storage.get<Record<string, AdminLog>>(LOGS_KEY, {});
    return Object.values(logs)
      .filter(l => l.action === action)
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  getLogsByTime(startTime: number, endTime: number): AdminLog[] {
    const logs = storage.get<Record<string, AdminLog>>(LOGS_KEY, {});
    return Object.values(logs)
      .filter(l => l.createdAt >= startTime && l.createdAt <= endTime)
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  searchLogs(keyword: string): AdminLog[] {
    const logs = storage.get<Record<string, AdminLog>>(LOGS_KEY, {});
    const lowerKeyword = keyword.toLowerCase();
    return Object.values(logs)
      .filter(l => 
        l.adminName.toLowerCase().includes(lowerKeyword) ||
        l.detail.toLowerCase().includes(lowerKeyword) ||
        l.target.toLowerCase().includes(lowerKeyword) ||
        l.ipAddress.includes(keyword)
      )
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  deleteLog(id: string): boolean {
    const logs = storage.get<Record<string, AdminLog>>(LOGS_KEY, {});
    if (!logs[id]) return false;
    
    delete logs[id];
    storage.set(LOGS_KEY, logs);
    return true;
  },

  clearLogs(beforeTime: number): number {
    const logs = storage.get<Record<string, AdminLog>>(LOGS_KEY, {});
    let deleted = 0;
    
    Object.keys(logs).forEach(id => {
      if (logs[id].createdAt < beforeTime) {
        delete logs[id];
        deleted++;
      }
    });
    
    storage.set(LOGS_KEY, logs);
    return deleted;
  },
};