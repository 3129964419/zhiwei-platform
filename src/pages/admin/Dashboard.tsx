import { useState, useEffect } from 'react';
import {
  Users,
  MessageCircle,
  BarChart3,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
} from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { authAPI } from '@/services/auth';
import { agentAPI } from '@/services/agent';
import { billingService } from '@/services/billing';
import { revenueService } from '@/services/revenue';
import type { SystemStats } from '@/types/admin';
import type { User } from '@/types';

function StatCard({ icon: Icon, label, value, trend, trendUp, color }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colorClasses = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', iconBg: 'bg-blue-100' },
    green: { bg: 'bg-green-50', icon: 'text-green-600', iconBg: 'bg-green-100' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', iconBg: 'bg-purple-100' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600', iconBg: 'bg-orange-100' },
  };
  
  const classes = colorClasses[color];
  
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div className={`w-12 h-12 rounded-lg ${classes.iconBg} flex items-center justify-center`}>
          <Icon className={classes.icon} size={24} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
            {trendUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {trend}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 mt-4">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    activeUsers: 0,
    newUsersToday: 0,
    totalAgents: 0,
    totalMessages: 0,
    totalTokensUsed: 0,
    totalRevenue: 0,
    subscriptionRevenue: 0,
    payAsYouGoRevenue: 0,
    avgDailyTokens: 0,
    userGrowthRate: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      const allUsers = authAPI.getAll();
      const allAgents = await agentAPI.getAll();
      const today = new Date().setHours(0, 0, 0, 0);
      
      const newUsers = allUsers.filter((u: User) => u.createdAt >= today).length;
      const activeUsers = Math.floor(allUsers.length * 0.6);
      
      const report = revenueService.getReport();
      
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
        avgDailyTokens: Math.floor(billingService.getTotalTokensUsed() / 30),
        userGrowthRate: newUsers > 0 ? 25 : 0,
      });
    };
    loadData();
  }, []);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>
        <p className="text-gray-500 mt-1">欢迎回来，查看系统概览</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Users}
          label="总用户数"
          value={stats.totalUsers.toLocaleString()}
          trend="25%"
          trendUp
          color="blue"
        />
        <StatCard
          icon={MessageCircle}
          label="活跃用户"
          value={stats.activeUsers.toLocaleString()}
          trend="12%"
          trendUp
          color="green"
        />
        <StatCard
          icon={BarChart3}
          label="总智能体"
          value={stats.totalAgents.toLocaleString()}
          trend="18%"
          trendUp
          color="purple"
        />
        <StatCard
          icon={DollarSign}
          label="总收入"
          value={`¥${stats.totalRevenue.toFixed(2)}`}
          trend="35%"
          trendUp
          color="orange"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">今日数据</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-xl font-bold text-gray-900">{stats.newUsersToday}</p>
              <p className="text-sm text-gray-500">新用户</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-xl font-bold text-gray-900">{stats.totalMessages.toLocaleString()}</p>
              <p className="text-sm text-gray-500">总消息数</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-xl font-bold text-gray-900">{(stats.totalTokensUsed / 1000).toFixed(0)}K</p>
              <p className="text-sm text-gray-500">Token 消耗</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-xl font-bold text-gray-900">{stats.avgDailyTokens.toLocaleString()}</p>
              <p className="text-sm text-gray-500">日均 Token</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">收入明细</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">订阅收入</span>
              <span className="font-medium">¥{stats.subscriptionRevenue.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">按量付费</span>
              <span className="font-medium">¥{stats.payAsYouGoRevenue.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-100 pt-3 mt-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">总收入</span>
                <span className="font-bold text-lg">¥{stats.totalRevenue.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">最近活动</h2>
          <button className="text-sm text-iris-500 hover:text-iris-600">查看全部</button>
        </div>
        <div className="space-y-3">
          {[
            { time: '5分钟前', action: '新用户注册', detail: '用户 138****5678 注册成功' },
            { time: '12分钟前', action: '套餐升级', detail: '用户升级至专业版' },
            { time: '28分钟前', action: '智能体创建', detail: '用户创建了新智能体"小助手"' },
            { time: '1小时前', action: 'Token 消耗', detail: '消耗 1,250 Token' },
            { time: '2小时前', action: '登录', detail: '管理员 admin 登录系统' },
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <div className="w-2 h-2 rounded-full bg-iris-500" />
              <div className="flex-1">
                <span className="font-medium text-gray-900">{item.action}</span>
                <span className="text-gray-500 text-sm ml-2">{item.detail}</span>
              </div>
              <span className="text-xs text-gray-400">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}