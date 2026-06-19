import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Wand2,
  Settings as SettingsIcon,
  Crown,
  Sparkles,
  Search,
  Clock,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import Layout from '@/components/Layout';
import AgentCard from '@/components/AgentCard';
import EmptyState from '@/components/EmptyState';
import { useUserStore } from '@/store/userStore';
import { useAgentStore } from '@/store/agentStore';
import { pricingService } from '@/services/pricing';
import { subscriptionService, type Subscription } from '@/services/subscription';
import { wechatAPI } from '@/services/wechat';
import { formatTime } from '@/utils/format';

type SortType = 'time' | 'usage';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const agents = useAgentStore((s) => s.agents);
  const loadAgents = useAgentStore((s) => s.loadAgents);
  const [sort, setSort] = useState<SortType>('time');
  const [search, setSearch] = useState('');
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [wechatBound, setWechatBound] = useState(false);

  useEffect(() => {
    if (user) {
      loadAgents(user.id);
      setSubscription(subscriptionService.getSubscription(user.id));
      setWechatBound(!!wechatAPI.getBinding());
    }
  }, [user, loadAgents]);

  if (!user) return null;

  const filtered = agents
    .filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) =>
      sort === 'time' ? b.createdAt - a.createdAt : b.lastUsedAt - a.lastUsedAt
    );

  return (
    <Layout showFooter={false}>
      <div className="aurora-bg min-h-screen">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* 顶部欢迎 */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 reveal-text">
            <div>
              <p className="text-sm text-ink-900/60 mb-1">
                欢迎回来，{formatTime(user.createdAt)} 加入的伙伴
              </p>
              <h1 className="font-display text-4xl font-semibold">
                <span className="text-gradient">{user.nickname}</span>
                <span className="text-ink-900">，今天想创造什么？</span>
              </h1>
            </div>
            <div className="flex gap-2">
              <Link to="/create" className="btn-secondary flex items-center gap-2 text-sm">
                <Plus size={16} /> 普通创建
              </Link>
              <Link
                to="/clone"
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <Wand2 size={16} /> 角色复刻
              </Link>
            </div>
          </div>

          {/* 状态卡片 */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {/* 套餐状态 */}
            <div className="md:col-span-2 glass rounded-3xl p-5 hover-lift relative overflow-hidden">
              <div
                className="absolute -right-10 -top-10 w-40 h-40 rounded-full opacity-30 blur-3xl"
                style={{
                  background:
                    subscription?.tier === 'resonance'
                      ? 'radial-gradient(circle, #FFD3B6, transparent)'
                      : 'radial-gradient(circle, #B8A6FF, transparent)',
                }}
              />
              <div className="relative flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                    style={{
                      background:
                        subscription?.tier === 'resonance'
                          ? 'linear-gradient(135deg, #FFD3B6, #FF945A)'
                          : subscription?.tier === 'gravity'
                          ? 'linear-gradient(135deg, #E5DEFF, #7C5CFF)'
                          : 'linear-gradient(135deg, #E2D8C6, #B8A6FF)',
                    }}
                  >
                    <Crown size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-ink-900/50">当前套餐</p>
                    <p className="text-base font-semibold">
                      {subscription?.tier === 'resonance'
                        ? '共振会员'
                        : subscription?.tier === 'gravity'
                        ? '引力会员'
                        : '免费版'}
                    </p>
                  </div>
                </div>
                <Link
                  to="/pricing"
                  className="text-xs text-iris-500 font-medium hover:underline flex items-center gap-1"
                >
                  {subscription?.tier === 'free' ? '升级' : '管理'} <ArrowRight size={12} />
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-ink-900/50">剩余复刻</p>
                  <p className="text-2xl font-display font-semibold text-gradient">
                    {user ? (subscriptionService.getRemainingQuota(user.id).clones < 0 ? '∞' : subscriptionService.getRemainingQuota(user.id).clones) : 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink-900/50">智能体</p>
                  <p className="text-2xl font-display font-semibold">
                    {agents.length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink-900/50">到期时间</p>
                  <p className="text-sm font-medium mt-1">
                    {subscription?.expireDate
                      ? new Date(subscription.expireDate).toLocaleDateString('zh-CN', {
                          month: '2-digit',
                          day: '2-digit',
                        })
                      : '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* 微信绑定 */}
            <Link
              to="/wechat-bind"
              className="glass rounded-3xl p-5 hover-lift block relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-white ${
                      wechatBound
                        ? 'bg-gradient-to-br from-mint-400 to-mint-500'
                        : 'bg-gradient-to-br from-ink-200 to-ink-100'
                    }`}
                  >
                    {wechatBound ? '✓' : '微'}
                  </div>
                  <div>
                    <p className="text-xs text-ink-900/50">微信</p>
                    <p className="text-sm font-semibold">
                      {wechatBound ? '已绑定' : '未绑定'}
                    </p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-ink-900/40" />
              </div>
              <p className="text-xs text-ink-900/60 leading-relaxed">
                {wechatBound
                  ? '聊天记录实时同步到微信端'
                  : '绑定后可使用微信端收发消息'}
              </p>
            </Link>
          </div>

          {/* 工具栏 */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-900/40"
              />
              <input
                type="text"
                placeholder="搜索智能体..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <div className="flex gap-1 p-1 bg-ink-100 rounded-full">
              <button
                onClick={() => setSort('time')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition ${
                  sort === 'time'
                    ? 'bg-white text-ink-900 shadow-card'
                    : 'text-ink-900/60'
                }`}
              >
                <Clock size={14} /> 创建时间
              </button>
              <button
                onClick={() => setSort('usage')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition ${
                  sort === 'usage'
                    ? 'bg-white text-ink-900 shadow-card'
                    : 'text-ink-900/60'
                }`}
              >
                <TrendingUp size={14} /> 使用频率
              </button>
            </div>
            <Link
              to="/settings"
              className="w-10 h-10 rounded-full bg-ink-100 hover:bg-ink-200 flex items-center justify-center text-ink-900/60 hover:text-ink-900 transition shrink-0"
              aria-label="设置"
            >
              <SettingsIcon size={16} />
            </Link>
          </div>

          {/* 智能体列表 */}
          {filtered.length === 0 ? (
            search ? (
              <div className="glass rounded-4xl p-12 text-center">
                <p className="text-ink-900/60 mb-4">没找到匹配的智能体</p>
                <p className="text-sm text-ink-900/40">试试其他关键词，或创建一个新的智能体</p>
              </div>
            ) : (
              <div className="glass rounded-4xl">
                <EmptyState type="agents" />
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
