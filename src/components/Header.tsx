import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import { useDarkModeStore } from '@/store/darkModeStore';
import { Sparkles, User, LogOut, Crown, Moon, Sun } from 'lucide-react';

interface HeaderProps {
  variant?: 'transparent' | 'solid';
}

export default function Header({ variant = 'transparent' }: HeaderProps) {
  const user = useUserStore((s) => s.user);
  const logout = useUserStore((s) => s.logout);
  const toggleDarkMode = useDarkModeStore((s) => s.toggle);
  const isDark = useDarkModeStore((s) => s.isDark);
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header
      className={`relative z-30 ${
        variant === 'solid' || !isHome
          ? 'bg-ink-50/80 backdrop-blur-md border-b border-ink-100'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-iris-500 to-rose-400 flex items-center justify-center text-white font-display font-semibold shadow-soft group-hover:shadow-glow transition">
            智
          </div>
          <span className="font-display text-xl font-semibold tracking-wide text-ink-900">
            智微
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Link
            to="/"
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              location.pathname === '/'
                ? 'text-iris-700 bg-iris-50'
                : 'text-ink-900/70 hover:text-ink-900 hover:bg-ink-100/50'
            }`}
          >
            首页
          </Link>
          <Link
            to="/dashboard"
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              location.pathname.startsWith('/dashboard') ||
              location.pathname.startsWith('/agent')
                ? 'text-iris-700 bg-iris-50'
                : 'text-ink-900/70 hover:text-ink-900 hover:bg-ink-100/50'
            }`}
          >
            我的智能体
          </Link>
          <Link
            to="/pricing"
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              location.pathname === '/pricing'
                ? 'text-iris-700 bg-iris-50'
                : 'text-ink-900/70 hover:text-ink-900 hover:bg-ink-100/50'
            }`}
          >
            套餐
          </Link>
          <Link
            to="/help"
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              location.pathname === '/help'
                ? 'text-iris-700 bg-iris-50'
                : 'text-ink-900/70 hover:text-ink-900 hover:bg-ink-100/50'
            }`}
          >
            帮助
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <button
                onClick={toggleDarkMode}
                className="w-9 h-9 rounded-full bg-ink-100/50 flex items-center justify-center text-ink-900/70 hover:bg-ink-100 hover:text-ink-900 transition"
                title={isDark ? '切换到浅色模式' : '切换到深色模式'}
              >
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <Link
                to="/pricing"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-iris-500/10 to-rose-400/10 text-iris-700 text-xs font-medium hover:from-iris-500/15 hover:to-rose-400/15 transition"
              >
                <Crown size={14} />
                升级套餐
                <span className="text-iris-500/70">¥29/月起</span>
              </Link>
              <div className="relative group">
                <button className="w-9 h-9 rounded-full bg-gradient-to-br from-iris-500 to-rose-400 flex items-center justify-center text-white font-semibold text-sm shadow-soft hover:shadow-glow transition">
                  {user.avatar || user.nickname.slice(0, 1)}
                </button>
                <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-2xl shadow-card opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2 border border-ink-100">
                  <div className="px-4 py-2 border-b border-ink-100">
                    <p className="text-sm font-medium text-ink-900 truncate">
                      {user.nickname}
                    </p>
                    <p className="text-xs text-ink-900/50">{user.phone}</p>
                  </div>
                  <Link
                    to="/settings"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-ink-900/80 hover:bg-ink-50"
                  >
                    <User size={14} /> 个人设置
                  </Link>
                  <Link
                    to="/wechat-bind"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-ink-900/80 hover:bg-ink-50"
                  >
                    <Sparkles size={14} /> 微信绑定
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-coral-500 hover:bg-coral-400/5"
                  >
                    <LogOut size={14} /> 退出登录
                  </button>
                </div>
              </div>
            </>
          ) : (
            <Link to="/login" className="btn-primary text-sm">
              立即开始
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
