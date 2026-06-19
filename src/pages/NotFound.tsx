import { Link } from 'react-router-dom';
import { Home, Sparkles } from 'lucide-react';
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
          <Link to="/" className="btn-primary inline-flex items-center gap-2">
            <Home size={16} /> 回到首页
          </Link>
        </div>
      </div>
    </Layout>
  );
}
