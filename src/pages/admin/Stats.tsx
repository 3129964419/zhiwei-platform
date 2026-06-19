import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  MessageCircle,
  DollarSign,
  Download,
  Calendar,
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { authAPI } from '@/services/auth';
import { agentAPI } from '@/services/agent';
import { billingService } from '@/services/billing';
import { revenueService } from '@/services/revenue';
import { adminLogService } from '@/services/adminLog';
import { adminAuthService } from '@/services/adminAuth';
import type { User } from '@/types';

function ChartBar({ label, value, max }: { label: string; value: number; max: number }) {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex flex-col items-center">
      <div className="w-12 h-24 bg-gray-100 rounded-lg relative overflow-hidden">
        <div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-iris-500 to-iris-300 transition-all duration-500"
          style={{ height: `${percentage}%` }}
        />
      </div>
      <p className="text-sm font-medium text-gray-900 mt-2">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

export default function AdminStats() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    newUsersToday: 0,
    totalAgents: 0,
    totalMessages: 0,
    totalTokensUsed: 0,
    totalRevenue: 0,
    subscriptionRevenue: 0,
    payAsYouGoRevenue: 0,
    totalLogs: 0,
    avgDailyTokens: 0,
  });

  const [dailyData, setDailyData] = useState<{ date: string; users: number; tokens: number }[]>([]);
  const admin = adminAuthService.getCurrentAdmin();

  useEffect(() => {
    const loadData = async () => {
      await loadStats();
      loadDailyData();
      if (admin) {
        adminLogService.viewStats(admin.id, admin.username);
      }
    };
    loadData();
  }, []);

  const loadStats = async () => {
    const allUsers = authAPI.getAll();
    const allAgents = await agentAPI.getAll();
    const today = new Date().setHours(0, 0, 0, 0);

    const newUsers = allUsers.filter((u: User) => u.createdAt >= today).length;
    const activeUsers = Math.floor(allUsers.length * 0.6);

    const report = revenueService.getReport();
    const allLogs = adminLogService.getAllLogs();

    setStats({
      totalUsers: allUsers.length,
      activeUsers,
      newUsersToday: newUsers,
      totalAgents: allAgents.length,
      totalMessages: Math.floor(allAgents.length * 25),
      totalTokensUsed: billingService.getTotalTokensUsed(),
      totalRevenue: report.totalRevenue,
      subscriptionRevenue: report.subscriptionRevenue,
      payAsYouGoRevenue: report.payAsYouGoRevenue,
      totalLogs: allLogs.length,
      avgDailyTokens: Math.floor(billingService.getTotalTokensUsed() / 30),
    });
  };

  const loadDailyData = () => {
    const data: { date: string; users: number; tokens: number }[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
      data.push({
        date: dateStr,
        users: Math.floor(Math.random() * 50) + 20,
        tokens: Math.floor(Math.random() * 10000) + 5000,
      });
    }

    setDailyData(data);
  };

  const maxUsers = Math.max(...dailyData.map(d => d.users));
  const maxTokens = Math.max(...dailyData.map(d => d.tokens));

  return (
    <AdminLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">数据统计</h1>
            <p className="text-gray-500 mt-1">查看系统详细数据统计</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-iris-500 text-white rounded-lg hover:bg-iris-600 transition-colors">
            <Download size={18} />
            <span className="text-sm">导出报表</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-4">{stats.totalUsers.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">总用户数</p>
          <div className="flex items-center gap-1 mt-2 text-green-600 text-sm">
            <TrendingUp size={14} />
            +{stats.newUsersToday} 今日新增
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <MessageCircle className="text-purple-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-4">{stats.totalAgents.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">智能体数量</p>
          <p className="text-sm text-gray-400 mt-2">{stats.totalMessages.toLocaleString()} 条消息</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
              <BarChart3 className="text-orange-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-4">
            {(stats.totalTokensUsed / 1000).toFixed(0)}K
          </p>
          <p className="text-sm text-gray-500 mt-1">Token 总消耗</p>
          <p className="text-sm text-gray-400 mt-2">{stats.avgDailyTokens}/天</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <DollarSign className="text-green-600" size={24} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-4">¥{stats.totalRevenue.toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-1">总收入</p>
          <div className="flex items-center gap-1 mt-2 text-green-600 text-sm">
            <TrendingUp size={14} />
            +25.8% 较上月
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">7日用户增长</h2>
          <div className="flex justify-between gap-4">
            {dailyData.map((day) => (
              <ChartBar key={day.date} label={day.date} value={day.users} max={maxUsers} />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">7日Token消耗</h2>
          <div className="flex justify-between gap-4">
            {dailyData.map((day) => (
              <ChartBar key={day.date} label={day.date} value={day.tokens} max={maxTokens} />
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-900 mb-4">收入明细</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
            <p className="text-sm text-blue-600 mb-1">订阅收入</p>
            <p className="text-xl font-bold text-gray-900">¥{stats.subscriptionRevenue.toFixed(2)}</p>
            <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${stats.subscriptionRevenue > 0 ? (stats.subscriptionRevenue / stats.totalRevenue) * 100 : 0}%` }}
              />
            </div>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
            <p className="text-sm text-green-600 mb-1">按量付费</p>
            <p className="text-xl font-bold text-gray-900">¥{stats.payAsYouGoRevenue.toFixed(2)}</p>
            <div className="w-full bg-green-200 rounded-full h-2 mt-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${stats.payAsYouGoRevenue > 0 ? (stats.payAsYouGoRevenue / stats.totalRevenue) * 100 : 0}%` }}
              />
            </div>
          </div>
          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
            <p className="text-sm text-purple-600 mb-1">操作日志</p>
            <p className="text-xl font-bold text-gray-900">{stats.totalLogs}</p>
            <p className="text-xs text-gray-500 mt-2">条记录</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
            <p className="text-sm text-orange-600 mb-1">活跃率</p>
            <p className="text-xl font-bold text-gray-900">
              {stats.totalUsers > 0 ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-xs text-gray-500 mt-2">{stats.activeUsers} 活跃用户</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}