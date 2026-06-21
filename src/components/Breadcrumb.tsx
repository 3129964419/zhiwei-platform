import { useLocation, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const breadcrumbMap: Record<string, { label: string; path?: string }> = {
  '/': { label: '首页' },
  '/dashboard': { label: '仪表盘', path: '/' },
  '/chat': { label: 'AI对话', path: '/dashboard' },
  '/agents': { label: '智能体', path: '/dashboard' },
  '/create': { label: '创建智能体', path: '/agents' },
  '/edit': { label: '编辑智能体', path: '/agents' },
  '/clone': { label: '克隆智能体', path: '/agents' },
  '/settings': { label: '设置', path: '/' },
  '/profile': { label: '个人中心', path: '/settings' },
  '/subscription': { label: '订阅管理', path: '/settings' },
  '/help': { label: '帮助中心', path: '/' },
  '/legal': { label: '法律条款', path: '/' },
  '/community': { label: '社区', path: '/' },
  '/pricing': { label: '定价', path: '/' },
};

export default function Breadcrumb() {
  const location = useLocation();
  const paths = location.pathname.split('/').filter((p) => p);
  
  const breadcrumbs = paths.map((path, index) => {
    const fullPath = '/' + paths.slice(0, index + 1).join('/');
    const item = breadcrumbMap[fullPath] || { label: path };
    return {
      label: item.label,
      path: item.path,
      current: index === paths.length - 1,
    };
  });

  if (breadcrumbs.length === 0) return null;

  return (
    <div className="px-6 py-3 bg-white/50 backdrop-blur-sm border-b border-ink-900/5">
      <div className="max-w-6xl mx-auto flex items-center gap-1 text-sm">
        <Link to="/" className="text-ink-900/60 hover:text-iris-500 transition-colors">
          首页
        </Link>
        <ChevronRight size={14} className="text-ink-900/30" />
        {breadcrumbs.map((crumb, index) => (
          <span key={index}>
            {crumb.path && !crumb.current ? (
              <Link to={crumb.path} className="text-ink-900/60 hover:text-iris-500 transition-colors">
                {crumb.label}
              </Link>
            ) : (
              <span className={crumb.current ? 'text-ink-900 font-medium' : 'text-ink-900/60'}>
                {crumb.label}
              </span>
            )}
            {index < breadcrumbs.length - 1 && (
              <ChevronRight size={14} className="text-ink-900/30 mx-1" />
            )}
          </span>
        ))}
      </div>
    </div>
  );
}