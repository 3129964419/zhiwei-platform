import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  Trash2,
  Edit,
  User,
  Mail,
  Phone,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { authAPI } from '@/services/auth';
import { adminLogService } from '@/services/adminLog';
import { adminAuthService } from '@/services/adminAuth';
import type { User as UserType } from '@/types';

export default function AdminUsers() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const admin = adminAuthService.getCurrentAdmin();

  useEffect(() => {
    loadUsers();
    if (admin) {
      adminLogService.viewUsers(admin.id, admin.username);
    }
  }, []);

  const loadUsers = () => {
    let allUsers = authAPI.getAll();
    if (searchTerm) {
      allUsers = allUsers.filter((u: UserType) =>
        u.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.phone.includes(searchTerm)
      );
    }
    setUsers(allUsers);
  };

  const handleDelete = () => {
    if (!selectedUser || !admin) return;
    authAPI.logout();
    adminLogService.deleteUser(admin.id, admin.username, selectedUser.id);
    setShowDeleteConfirm(false);
    setSelectedUser(null);
    loadUsers();
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
        <p className="text-gray-500 mt-1">管理平台所有用户</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
              placeholder="搜索用户名或手机号..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-iris-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                <Filter size={18} className="text-gray-400" />
                <span className="text-sm">{filterTier === 'all' ? '全部' : filterTier}</span>
                <ChevronDown size={14} />
              </button>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-iris-500 text-white rounded-lg hover:bg-iris-600 transition-colors">
              <Download size={18} />
              <span className="text-sm">导出</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">用户</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">手机号</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">注册时间</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-iris-500 to-rose-400 flex items-center justify-center text-white font-semibold">
                        {user.avatar.length === 1 ? user.avatar : user.nickname[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.nickname}</p>
                        <p className="text-sm text-gray-500">ID: {user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-600">{user.phone}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-500 text-sm">
                      {new Date(user.createdAt).toLocaleString('zh-CN')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-gray-400 hover:text-iris-500 hover:bg-iris-50 rounded-lg transition-colors">
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowDeleteConfirm(true);
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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

        {users.length === 0 && (
          <div className="text-center py-12">
            <User size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">暂无用户</p>
          </div>
        )}
      </div>

      {showDeleteConfirm && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">确认删除</h3>
              <p className="text-gray-500 mb-6">
                确定要删除用户 <span className="font-medium">{selectedUser.nickname}</span> 吗？此操作不可撤销。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setSelectedUser(null);
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