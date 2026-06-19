import { useLocation } from 'react-router-dom';
import { Home, MessageCircle, Plus, User, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';

const tabs = [
  { path: '/dashboard', icon: Home, label: '首页' },
  { path: '/create', icon: Plus, label: '创建' },
  { path: '/pricing', icon: Crown, label: '套餐' },
  { path: '/settings', icon: User, label: '我的' },
];

export default function MobileTabBar() {
  const location = useLocation();
  if (location.pathname === '/' || location.pathname === '/login') return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-ink-50/90 backdrop-blur-xl border-t border-ink-100 pb-safe">
      <div className="grid grid-cols-4 px-2">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path ||
            (tab.path === '/dashboard' && location.pathname.startsWith('/agent'));
          const Icon = tab.icon;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center gap-1 py-3 transition ${
                active ? 'text-iris-500' : 'text-ink-900/50'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              <span className={`text-[10px] ${active ? 'font-semibold' : ''}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
