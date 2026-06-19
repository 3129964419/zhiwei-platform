import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Shield,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { adminAuthService } from '@/services/adminAuth';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: '仪表盘' },
  { id: 'users', icon: Users, label: '用户管理' },
  { id: 'admins', icon: Shield, label: '管理员' },
  { id: 'logs', icon: FileText, label: '操作日志' },
  { id: 'stats', icon: BarChart3, label: '数据统计' },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const admin = adminAuthService.getCurrentAdmin();

  const handleLogout = () => {
    adminAuthService.logout();
    window.location.href = '/admin/login';
  };

  if (!admin) {
    window.location.href = '/admin/login';
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gray-900 text-white flex flex-col transition-all duration-300`}
      >
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-iris-500 to-rose-400 flex items-center justify-center">
              <Shield size={20} />
            </div>
            {sidebarOpen && (
              <span className="font-semibold text-lg">管理后台</span>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <a
              key={item.id}
              href={`/admin/${item.id}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <item.icon size={20} />
              {sidebarOpen && <span>{item.label}</span>}
            </a>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors w-full"
          >
            <LogOut size={20} />
            {sidebarOpen && <span>退出登录</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-medium text-gray-900">{admin.username}</p>
              <p className="text-sm text-gray-500">
                {admin.role === 'super_admin' ? '超级管理员' : admin.role === 'admin' ? '管理员' : '审核员'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-iris-500 to-rose-400 flex items-center justify-center text-white font-semibold">
              {admin.username[0].toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}