import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Wand2,
  MessageCircle,
  Users,
  Settings,
  HelpCircle,
  CreditCard,
  Shield,
  Download,
  Heart,
  Zap,
  ChevronRight,
  LayoutDashboard,
  UserCog,
  BarChart3,
  FileText,
  Lock,
  Menu,
  X,
} from 'lucide-react';
import Layout from '@/components/Layout';
import { useUserStore } from '@/store/userStore';
import { adminAuthService } from '@/services/adminAuth';

// 功能分类配置
interface FeatureItem {
  id: string;
  icon: React.ElementType;
  label: string;
  description: string;
  path: string;
  color: string;
  gradient: string;
  requireAuth?: boolean;
  isAdmin?: boolean;
}

const featureCategories = {
  // 核心功能 - 高频使用
  core: {
    title: '核心功能',
    description: '最常用的功能入口',
    features: [
      {
        id: 'clone',
        icon: Wand2,
        label: '智能复刻',
        description: '上传聊天记录，AI 自动复刻',
        path: '/clone',
        color: 'iris',
        gradient: 'from-iris-500 to-rose-400',
        requireAuth: true,
      },
      {
        id: 'create',
        icon: Sparkles,
        label: '创建智能体',
        description: '自定义性格和关系',
        path: '/create',
        color: 'rose',
        gradient: 'from-rose-400 to-peach-400',
        requireAuth: true,
      },
      {
        id: 'chat',
        icon: MessageCircle,
        label: '我的对话',
        description: '与智能体聊天互动',
        path: '/dashboard',
        color: 'mint',
        gradient: 'from-mint-400 to-iris-500',
        requireAuth: true,
      },
      {
        id: 'community',
        icon: Users,
        label: '社区市场',
        description: '发现热门智能体',
        path: '/community',
        color: 'peach',
        gradient: 'from-peach-400 to-coral-400',
        requireAuth: true,
      },
    ] as FeatureItem[],
  },
  // 账户管理 - 中频使用
  account: {
    title: '账户管理',
    description: '个人信息与订阅管理',
    features: [
      {
        id: 'subscription',
        icon: CreditCard,
        label: '订阅套餐',
        description: '升级获取更多额度',
        path: '/pricing',
        color: 'iris',
        gradient: 'from-iris-400 to-iris-600',
      },
      {
        id: 'settings',
        icon: Settings,
        label: '个人设置',
        description: '修改个人信息',
        path: '/settings',
        color: 'ink',
        gradient: 'from-ink-400 to-ink-600',
        requireAuth: true,
      },
      {
        id: 'export',
        icon: Download,
        label: '数据导出',
        description: '导出对话记录',
        path: '/settings',
        color: 'mint',
        gradient: 'from-mint-400 to-mint-600',
        requireAuth: true,
      },
    ] as FeatureItem[],
  },
  // 帮助支持 - 低频使用
  support: {
    title: '帮助支持',
    description: '使用指南与隐私政策',
    features: [
      {
        id: 'help',
        icon: HelpCircle,
        label: '使用帮助',
        description: '常见问题解答',
        path: '/help',
        color: 'ink',
        gradient: 'from-ink-300 to-ink-500',
      },
      {
        id: 'privacy',
        icon: Shield,
        label: '隐私政策',
        description: '数据安全说明',
        path: '/legal',
        color: 'mint',
        gradient: 'from-mint-300 to-mint-500',
      },
    ] as FeatureItem[],
  },
  // 管理后台 - 管理员专用
  admin: {
    title: '管理后台',
    description: '仅管理员可见',
    features: [
      {
        id: 'admin-dashboard',
        icon: LayoutDashboard,
        label: '管理仪表盘',
        description: '系统概览',
        path: '/admin/dashboard',
        color: 'ink',
        gradient: 'from-ink-500 to-ink-700',
        isAdmin: true,
      },
      {
        id: 'admin-users',
        icon: UserCog,
        label: '用户管理',
        description: '管理用户账户',
        path: '/admin/users',
        color: 'ink',
        gradient: 'from-ink-500 to-ink-700',
        isAdmin: true,
      },
      {
        id: 'admin-stats',
        icon: BarChart3,
        label: '数据统计',
        description: '查看运营数据',
        path: '/admin/stats',
        color: 'ink',
        gradient: 'from-ink-500 to-ink-700',
        isAdmin: true,
      },
      {
        id: 'admin-logs',
        icon: FileText,
        label: '操作日志',
        description: '系统操作记录',
        path: '/admin/logs',
        color: 'ink',
        gradient: 'from-ink-500 to-ink-700',
        isAdmin: true,
      },
    ] as FeatureItem[],
  },
};

// 功能按钮组件
function FeatureButton({
  feature,
  onClick,
  isWeak = false,
}: {
  feature: FeatureItem;
  onClick: () => void;
  isWeak?: boolean;
}) {
  const Icon = feature.icon;

  return (
    <button
      onClick={onClick}
      className={`
        group relative w-full text-left rounded-2xl transition-all duration-100
        ${isWeak
          ? 'bg-ink-50/50 hover:bg-ink-100/50 p-3 sm:p-4'
          : 'bg-white hover:bg-ink-50 shadow-card hover:shadow-lg p-4 sm:p-5'
        }
        active:scale-[0.98]
      `}
      style={{ minHeight: isWeak ? '56px' : '88px' }}
    >
      {/* 背景渐变 */}
      <div
        className={`
          absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-100
          bg-gradient-to-br ${feature.gradient}
        `}
      />

      <div className="relative flex items-center gap-3 sm:gap-4">
        {/* 图标 */}
        <div
          className={`
            shrink-0 rounded-xl flex items-center justify-center
            bg-gradient-to-br ${feature.gradient}
            ${isWeak ? 'w-9 h-9 sm:w-10 sm:h-10' : 'w-11 h-11 sm:w-12 sm:h-12'}
            text-white shadow-soft
          `}
        >
          <Icon size={isWeak ? 18 : 22} strokeWidth={2} />
        </div>

        {/* 文字 */}
        <div className="flex-1 min-w-0">
          <h3
            className={`
              font-semibold truncate
              ${isWeak ? 'text-sm text-ink-900/70' : 'text-base sm:text-lg text-ink-900'}
            `}
          >
            {feature.label}
          </h3>
          <p
            className={`
              truncate
              ${isWeak ? 'text-xs text-ink-900/40' : 'text-sm text-ink-900/60'}
            `}
          >
            {feature.description}
          </p>
        </div>

        {/* 箭头 */}
        <ChevronRight
          size={isWeak ? 16 : 20}
          className={`
            shrink-0 transition-transform duration-100 group-hover:translate-x-1
            ${isWeak ? 'text-ink-900/30' : 'text-ink-900/40'}
          `}
        />
      </div>
    </button>
  );
}

// 分类区块组件
function FeatureSection({
  title,
  description,
  features,
  user,
  onNavigate,
  isWeak = false,
}: {
  title: string;
  description: string;
  features: FeatureItem[];
  user: any;
  onNavigate: (path: string, requireAuth?: boolean) => void;
  isWeak?: boolean;
}) {
  return (
    <div className={isWeak ? 'opacity-60 hover:opacity-100 transition-opacity' : ''}>
      <div className="mb-4">
        <h2 className={`font-semibold ${isWeak ? 'text-sm text-ink-900/50' : 'text-lg text-ink-900'}`}>
          {title}
        </h2>
        <p className={`text-xs ${isWeak ? 'text-ink-900/30' : 'text-ink-900/50'}`}>
          {description}
        </p>
      </div>
      <div className={`grid gap-3 ${isWeak ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {features.map((feature) => (
          <FeatureButton
            key={feature.id}
            feature={feature}
            onClick={() => onNavigate(feature.path, feature.requireAuth)}
            isWeak={isWeak}
          />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const [showAdminMenu, setShowAdminMenu] = useState(false);

  // 检查是否为管理员
  const isAdmin = adminAuthService.getCurrentAdmin() !== null;

  // 导航处理 - 300ms 平滑过渡
  const handleNavigate = useCallback((path: string, requireAuth?: boolean) => {
    if (requireAuth && !user) {
      navigate('/login');
      return;
    }
    // 添加短暂延迟实现平滑过渡
    setTimeout(() => {
      navigate(path);
    }, 50);
  }, [user, navigate]);

  return (
    <Layout showFooter={true}>
      <div className="aurora-bg min-h-screen">
        {/* 浮动光斑 */}
        <div
          className="float-blob"
          style={{
            top: '10%',
            left: '5%',
            width: 300,
            height: 300,
            background: 'radial-gradient(circle, #B8A6FF 0%, transparent 70%)',
          }}
        />
        <div
          className="float-blob"
          style={{
            top: '40%',
            right: '5%',
            width: 250,
            height: 250,
            background: 'radial-gradient(circle, #FFB8C8 0%, transparent 70%)',
            animationDelay: '-4s',
          }}
        />

        {/* 主内容区 */}
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* 页面标题 */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-4">
              <Sparkles size={14} className="text-iris-500" />
              <span className="text-xs font-medium text-ink-900/80">智微 · AI 情感复刻</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold mb-3">
              功能<span className="text-gradient mx-1">中心</span>
            </h1>
            <p className="text-sm sm:text-base text-ink-900/60 max-w-md mx-auto">
              所有功能入口一目了然，快速开始你的 AI 陪伴之旅
            </p>
          </div>

          {/* 功能区块 */}
          <div className="space-y-8 sm:space-y-10">
            {/* 核心功能 */}
            <FeatureSection
              title={featureCategories.core.title}
              description={featureCategories.core.description}
              features={featureCategories.core.features}
              user={user}
              onNavigate={handleNavigate}
            />

            {/* 账户管理 */}
            <FeatureSection
              title={featureCategories.account.title}
              description={featureCategories.account.description}
              features={featureCategories.account.features}
              user={user}
              onNavigate={handleNavigate}
            />

            {/* 帮助支持 */}
            <FeatureSection
              title={featureCategories.support.title}
              description={featureCategories.support.description}
              features={featureCategories.support.features}
              user={user}
              onNavigate={handleNavigate}
            />

            {/* 用户案例 */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 shadow-card">
              <div className="text-center mb-6">
                <h2 className="font-display text-xl sm:text-2xl font-semibold text-ink-900 mb-2">
                  用户<span className="text-gradient">案例</span>
                </h2>
                <p className="text-sm text-ink-900/50">听听他们怎么说</p>
              </div>
              <div className="grid gap-4">
                {[
                  {
                    name: '张先生',
                    role: 'AI开发者',
                    avatar: '张',
                    content: '智微帮我快速复刻了一位虚拟助手，效率提升了300%，现在可以专注于更核心的业务逻辑。',
                    rating: 5,
                  },
                  {
                    name: '李女士',
                    role: '心理咨询师',
                    avatar: '李',
                    content: '通过情感复刻功能，我能够创建个性化的AI心理陪伴，为客户提供更贴心的服务。',
                    rating: 5,
                  },
                  {
                    name: '王同学',
                    role: '大学生',
                    avatar: '王',
                    content: '用智微创建了专属的学习助手，24小时陪伴学习，再也不怕一个人学习了。',
                    rating: 5,
                  },
                ].map((caseItem, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-2xl p-4 border border-ink-100/50 hover:border-iris-500/20 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-iris-500 to-rose-400 flex items-center justify-center text-white font-semibold text-sm">
                        {caseItem.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-ink-900">{caseItem.name}</span>
                          <span className="text-xs text-ink-900/40 px-2 py-0.5 rounded-full bg-ink-100">
                            {caseItem.role}
                          </span>
                        </div>
                        <p className="text-sm text-ink-900/70 leading-relaxed">{caseItem.content}</p>
                        <div className="flex gap-0.5 mt-2">
                          {Array.from({ length: caseItem.rating }).map((_, i) => (
                            <svg key={i} className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 管理后台入口 - 隐蔽设计 */}
          {isAdmin && (
            <div className="mt-12 pt-8 border-t border-ink-100">
              {/* 隐藏的管理入口触发器 */}
              <button
                onClick={() => setShowAdminMenu(!showAdminMenu)}
                className="group flex items-center gap-2 text-ink-900/30 hover:text-ink-900/50 transition-colors"
              >
                <Lock size={14} />
                <span className="text-xs">管理入口</span>
              </button>

              {/* 展开的管理菜单 */}
              {showAdminMenu && (
                <div className="mt-4 animate-fadeIn">
                  <FeatureSection
                    title={featureCategories.admin.title}
                    description={featureCategories.admin.description}
                    features={featureCategories.admin.features}
                    user={user}
                    onNavigate={handleNavigate}
                    isWeak={true}
                  />
                </div>
              )}
            </div>
          )}

          {/* 快速操作栏 - 移动端底部固定 */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-lg border-t border-ink-100 sm:hidden safe-area-pb">
            <div className="flex justify-around gap-2">
              {featureCategories.core.features.slice(0, 4).map((feature) => {
                const Icon = feature.icon;
                return (
                  <button
                    key={feature.id}
                    onClick={() => handleNavigate(feature.path, feature.requireAuth)}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl active:bg-ink-100 transition-colors"
                    style={{ minWidth: '60px', minHeight: '44px' }}
                  >
                    <div
                      className={`
                        w-10 h-10 rounded-xl flex items-center justify-center
                        bg-gradient-to-br ${feature.gradient} text-white
                      `}
                    >
                      <Icon size={18} />
                    </div>
                    <span className="text-[10px] text-ink-900/70">{feature.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 底部间距 - 为移动端固定栏留空间 */}
          <div className="h-20 sm:hidden" />
        </div>

        {/* 品牌水印 */}
        <div className="text-center py-8 text-ink-900/20 text-xs">
          <Heart size={12} className="inline-block mr-1" fill="currentColor" />
          智微 · 让 AI 陪伴你的每一段关系
        </div>
      </div>

      {/* CSS 动画 */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .safe-area-pb {
          padding-bottom: max(1rem, env(safe-area-inset-bottom));
        }
      `}</style>
    </Layout>
  );
}
