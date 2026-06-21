import { Link } from 'react-router-dom';
import { Home, Sparkles, Search, BookOpen, MessageCircle, Settings } from 'lucide-react';
import Layout from '@/components/Layout';

export default function NotFound() {
  return (
    <Layout showFooter={false}>
      <div className="min-h-screen aurora-bg flex items-center justify-center px-6">
        <div className="float-blob" style={{ top: '30%', left: '20%', width: 400, height: 400, background: 'radial-gradient(circle, #B8A6FF 0%, transparent 70%)' }} />
        <div className="float-blob" style={{ bottom: '20%', right: '15%', width: 350, height: 350, background: 'radial-gradient(circle, #FFB8C8 0%, transparent 70%)', animationDelay: '-3s' }} />

        <div className="relative text-center max-w-md">
          <div className="font-display text-[150px] font-semibold text-gradient leading-none">
            404
          </div>
          <Sparkles size={32} className="mx-auto text-iris-500 mb-4" />
          <h1 className="font-display text-2xl font-semibold mb-2">
            这里什么都没有
          </h1>
          <p className="text-sm text-ink-900/60 mb-6">
            你寻找的页面可能去了别的地方
            <br />
            或者从未存在过
          </p>

          <div className="relative mb-6">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-900/40" />
            <input
              type="text"
              placeholder="搜索你想要的内容..."
              className="w-full px-10 py-2.5 bg-white/80 backdrop-blur-sm border border-ink-900/10 rounded-full text-sm placeholder:text-ink-900/40 focus:outline-none focus:border-iris-500/50 focus:ring-2 focus:ring-iris-500/20 transition-all"
            />
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <Link to="/" className="btn-secondary inline-flex items-center gap-2">
              <Home size={16} /> 回到首页
            </Link>
            <Link to="/dashboard" className="btn-secondary inline-flex items-center gap-2">
              <MessageCircle size={16} /> AI对话
            </Link>
            <Link to="/help" className="btn-secondary inline-flex items-center gap-2">
              <BookOpen size={16} /> 帮助中心
            </Link>
            <Link to="/settings" className="btn-secondary inline-flex items-center gap-2">
              <Settings size={16} /> 设置
            </Link>
          </div>

          <p className="text-xs text-ink-900/40">
            找不到想要的内容？联系我们：support@3dpixel.top
          </p>
        </div>
      </div>
    </Layout>
  );
}
