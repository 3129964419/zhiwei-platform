import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Edit,
  Shield,
  Mail,
  Calendar,
  ChevronDown,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { adminAuthService } from '@/services/adminAuth';
import { adminLogService } from '@/services/adminLog';
import type { Admin, AdminRole } from '@/types/admin';

const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: '超级管理员',
  admin: '管理员',
  moderator: '审核员',
};

const ROLE_COLORS: Record<AdminRole, string> = {
  super_admin: 'bg-red-100 text-red-600',
  admin: 'bg-blue-100 text-blue-600',
  moderator: 'bg-green-100 text-green-600',
};

export default function AdminAdmins() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(false);

  const currentAdmin = adminAuthService.getCurrentAdmin();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'admin' as AdminRole,
  });

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = () => {
    let allAdmins = adminAuthService.getAllAdmins();
    if (searchTerm) {
      allAdmins = allAdmins.filter(a =>
        a.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setAdmins(allAdmins);
  };

  const handleAdd = async () => {
    if (!currentAdmin) return;
    setLoading(true);
    try {
      adminAuthService.createAdmin(formData);
      adminLogService.createAdmin(currentAdmin.id, currentAdmin.username, formData.username);
      setShowAddModal(false);
      setFormData({ username: '', email: '', password: '', role: 'admin' });
      loadAdmins();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!currentAdmin || !selectedAdmin) return;
    setLoading(true);
    try {
      adminAuthService.updateAdmin(selectedAdmin.id, {
        username: formData.username,
        email: formData.email,
        role: formData.role,
      });
      adminLogService.updateAdmin(currentAdmin.id, currentAdmin.username, selectedAdmin.id);
      setShowEditModal(false);
      setSelectedAdmin(null);
      loadAdmins();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!currentAdmin || !selectedAdmin) return;
    try {
      adminAuthService.deleteAdmin(selectedAdmin.id);
      adminLogService.deleteAdmin(currentAdmin.id, currentAdmin.username, selectedAdmin.id);
      setShowDeleteConfirm(false);
      setSelectedAdmin(null);
      loadAdmins();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const openEditModal = (admin: Admin) => {
    setSelectedAdmin(admin);
    setFormData({
      username: admin.username,
      email: admin.email,
      password: '',
      role: admin.role,
    });
    setShowEditModal(true);
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">管理员管理</h1>
        <p className="text-gray-500 mt-1">管理系统管理员账号</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadAdmins()}
              placeholder="搜索用户名或邮箱..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-iris-500"
            />
          </div>
          <button
            onClick={() => {
              setFormData({ username: '', email: '', password: '', role: 'admin' });
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-iris-500 text-white rounded-lg hover:bg-iris-600 transition-colors"
          >
            <Plus size={18} />
            <span className="text-sm">添加管理员</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">管理员</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">邮箱</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">角色</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">创建时间</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-white font-semibold">
                        {admin.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{admin.username}</p>
                        <p className="text-sm text-gray-500">ID: {admin.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-600">{admin.email}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${ROLE_COLORS[admin.role]}`}>
                      {ROLE_LABELS[admin.role]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {admin.status === 'active' ? (
                      <span className="flex items-center gap-1 text-green-600 text-sm">
                        <Check size={14} /> 活跃
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-gray-400 text-sm">
                        <X size={14} /> 禁用
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-500 text-sm">
                      {new Date(admin.createdAt).toLocaleString('zh-CN')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(admin)}
                        className="p-2 text-gray-400 hover:text-iris-500 hover:bg-iris-50 rounded-lg transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedAdmin(admin);
                          setShowDeleteConfirm(true);
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        disabled={admin.id === currentAdmin?.id}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {admins.length === 0 && (
          <div className="text-center py-12">
            <Shield size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">暂无管理员</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">添加管理员</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-iris-500"
                  placeholder="请输入用户名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-iris-500"
                  placeholder="请输入邮箱"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-iris-500"
                  placeholder="请输入密码"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as AdminRole })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-iris-500"
                >
                  <option value="super_admin">超级管理员</option>
                  <option value="admin">管理员</option>
                  <option value="moderator">审核员</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleAdd}
                disabled={loading || !formData.username || !formData.email || !formData.password}
                className="flex-1 px-4 py-2 bg-iris-500 text-white rounded-lg hover:bg-iris-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    保存中...
                  </>
                ) : (
                  '添加'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">编辑管理员</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-iris-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-iris-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as AdminRole })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-iris-500"
                >
                  <option value="super_admin">超级管理员</option>
                  <option value="admin">管理员</option>
                  <option value="moderator">审核员</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedAdmin(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleEdit}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-iris-500 text-white rounded-lg hover:bg-iris-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    保存中...
                  </>
                ) : (
                  '保存'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && selectedAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">确认删除</h3>
              <p className="text-gray-500 mb-6">
                确定要删除管理员 <span className="font-medium">{selectedAdmin.username}</span> 吗？此操作不可撤销。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setSelectedAdmin(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}