import { Link } from 'react-router-dom';
import { Sparkles, HelpCircle, Shield, FileText, MessageCircle, Zap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-ink-100 bg-ink-50/50 backdrop-blur-sm mt-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-iris-500 to-rose-400 flex items-center justify-center text-white font-display font-semibold">
                智
              </div>
              <span className="font-display text-lg font-semibold">智微</span>
            </div>
            <p className="text-sm text-ink-900/60 leading-relaxed">
              AI 驱动的对话角色复刻平台
              <br />
              让每一份陪伴都不再缺席
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-ink-900 mb-3">产品</h4>
            <ul className="space-y-2 text-sm text-ink-900/60">
              <li>
                <Link to="/create" className="hover:text-iris-500 transition">
                  创建智能体
                </Link>
              </li>
              <li>
                <Link to="/clone" className="hover:text-iris-500 transition">
                  角色复刻
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-iris-500 transition">
                  套餐价格
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-ink-900 mb-3">支持</h4>
            <ul className="space-y-2 text-sm text-ink-900/60">
              <li>
                <Link to="/help" className="flex items-center gap-2 hover:text-iris-500 transition">
                  <HelpCircle size={14} />
                  帮助中心
                </Link>
              </li>
              <li>
                <Link to="/wechat-bind" className="flex items-center gap-2 hover:text-iris-500 transition">
                  <Zap size={14} />
                  微信集成
                </Link>
              </li>
              <li>
                <Link to="/help" className="flex items-center gap-2 hover:text-iris-500 transition">
                  <MessageCircle size={14} />
                  联系客服
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-ink-900 mb-3">法律</h4>
            <ul className="space-y-2 text-sm text-ink-900/60">
              <li>
                <Link to="/legal" className="flex items-center gap-2 hover:text-iris-500 transition">
                  <Shield size={14} />
                  隐私政策
                </Link>
              </li>
              <li>
                <Link to="/legal" className="flex items-center gap-2 hover:text-iris-500 transition">
                  <FileText size={14} />
                  用户协议
                </Link>
              </li>
              <li>
                <Link to="/legal" className="flex items-center gap-2 hover:text-iris-500 transition">
                  <FileText size={14} />
                  内容规范
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-ink-100 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-ink-900/50">
          <p>© 2026 智微 ZhiWei · 用 AI 复刻灵魂的温度</p>
          <div className="flex items-center gap-1.5">
            <Sparkles size={12} className="text-iris-500" />
            <span>通过国家信息安全等级保护三级认证</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
