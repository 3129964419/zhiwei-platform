import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  FileText,
  Clock,
  User,
  ChevronDown,
  Check,
  X,
  Trash2,
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { adminLogService } from '@/services/adminLog';
import type { AdminLog } from '@/types/admin';

const ACTION_LABELS: Record<string, string> = {
  admin_login: '登录',
  admin_logout: '退出',
  admin_create: '创建管理员',
  admin_update: '更新管理员',
  admin_delete: '删除管理员',
  user_view: '查看用户',
  user_edit: '编辑用户',
  user_delete: '删除用户',
  stats_view: '查看统计',
  config_edit: '修改配置',
  finance_view: '查看财务',
  data_export: '导出数据',
};

export default function AdminLogs() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AdminLog | null>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = () => {
    let allLogs = adminLogService.getAllLogs();
    if (searchTerm) {
      allLogs = adminLogService.searchLogs(searchTerm);
    }
    if (filterAction !== 'all') {
      allLogs = allLogs.filter(l => l.action === filterAction);
    }
    setLogs(allLogs);
  };

  const handleDelete = () => {
    if (!selectedLog) return;
    adminLogService.deleteLog(selectedLog.id);
    setShowDeleteConfirm(false);
    setSelectedLog(null);
    loadLogs();
  };

  const handleClearOld = () => {
    if (confirm('确定要删除30天前的日志吗？')) {
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      adminLogService.clearLogs(thirtyDaysAgo);
      loadLogs();
    }
  };

  const actions = [...new Set(logs.map(l => l.action))];

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">操作日志</h1>
        <p className="text-gray-500 mt-1">记录所有管理员的操作</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadLogs()}
              placeholder="搜索操作详情、管理员、IP..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-iris-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={filterAction}
                onChange={(e) => {
                  setFilterAction(e.target.value);
                  loadLogs();
                }}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-iris-500 appearance-none bg-white"
              >
                <option value="all">全部操作</option>
                {actions.map(action => (
                  <option key={action} value={action}>
                    {ACTION_LABELS[action] || action}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-iris-500 text-white rounded-lg hover:bg-iris-600 transition-colors">
              <Download size={18} />
              <span className="text-sm">导出</span>
            </button>
            <button
              onClick={handleClearOld}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <Trash2 size={18} />
              <span className="text-sm">清除旧日志</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">管理员</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">目标</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">详情</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">时间</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-medium">
                        {log.adminName[0]}
                      </div>
                      <span className="text-gray-900 font-medium">{log.adminName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-600">{ACTION_LABELS[log.action] || log.action}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-500 text-sm capitalize">{log.target}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-600 text-sm max-w-xs truncate" title={log.detail}>
                      {log.detail}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {log.status === 'success' ? (
                      <span className="flex items-center gap-1 text-green-600 text-sm">
                        <Check size={14} /> 成功
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-500 text-sm">
                        <X size={14} /> 失败
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-500 text-sm">
                      {new Date(log.createdAt).toLocaleString('zh-CN')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-500 text-sm font-mono">
                      {log.ipAddress || '-'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {logs.length === 0 && (
          <div className="text-center py-12">
            <FileText size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">暂无操作日志</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}