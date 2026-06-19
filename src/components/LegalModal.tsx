import { useUIStore } from '@/store/uiStore';
import { X, ShieldCheck, Lock, FileCheck } from 'lucide-react';

export default function LegalModal() {
  const closeLegal = useUIStore((s) => s.closeLegal);
  const acceptLegal = useUIStore((s) => s.acceptLegal);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-6 bg-ink-950/40 backdrop-blur-sm">
      <div className="relative bg-ink-50 rounded-4xl shadow-glow max-w-2xl w-full max-h-[88vh] flex flex-col overflow-hidden">
        <button
          onClick={closeLegal}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center hover:bg-ink-100 transition"
          aria-label="关闭"
        >
          <X size={18} />
        </button>

        <div className="px-8 pt-10 pb-4 text-center border-b border-ink-100">
          <div className="inline-flex w-14 h-14 rounded-2xl items-center justify-center bg-gradient-to-br from-iris-500 to-rose-400 text-white shadow-glow mb-4">
            <ShieldCheck size={28} strokeWidth={2.2} />
          </div>
          <h2 className="font-display text-3xl font-semibold text-ink-900 mb-2">
            欢迎来到智微
          </h2>
          <p className="text-sm text-ink-900/60">
            在开始之前，请阅读并同意我们的协议
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5 text-sm text-ink-900/80 leading-relaxed">
          <section>
            <div className="flex items-center gap-2 mb-2">
              <FileCheck size={16} className="text-iris-500" />
              <h3 className="font-semibold text-ink-900">用户协议</h3>
            </div>
            <p>
              智微是一个 AI 驱动的对话角色复刻平台。您需年满 18 周岁方可使用本服务。
              平台仅供个人学习、情感陪伴与创意探索使用，请勿用于商业盈利、欺诈或骚扰他人。
            </p>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-2">
              <Lock size={16} className="text-iris-500" />
              <h3 className="font-semibold text-ink-900">隐私保护</h3>
            </div>
            <p>
              我们采用端到端加密保护您的数据。您的聊天记录、智能体配置仅存储于您的设备本地，
              不会上传至服务器。您随时可导出或清除所有数据，账号注销后 72 小时内完全清除。
            </p>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={16} className="text-iris-500" />
              <h3 className="font-semibold text-ink-900">内容审核</h3>
            </div>
            <p>
              平台禁止创建涉及政治敏感、色情低俗、暴力血腥、侵犯他人权益的智能体。
              我们已集成 AI 内容审核系统，违规内容将被拦截。请尊重他人，文明使用。
            </p>
          </section>

          <section className="bg-iris-50 rounded-2xl p-4 text-ink-900">
            <p className="font-medium mb-1">💡 温馨提示</p>
            <p className="text-xs">
              智微复刻的是对话风格与性格特征，并非真实人物。所有智能体的回复均由 AI 生成，
              请理性对待并遵守相关法律法规。
            </p>
          </section>
        </div>

        <div className="px-8 py-5 border-t border-ink-100 flex items-center justify-between gap-4">
          <button
            onClick={closeLegal}
            className="text-sm text-ink-900/60 hover:text-ink-900 transition"
          >
            再看看
          </button>
          <button onClick={acceptLegal} className="btn-primary text-sm">
            我已阅读并同意
          </button>
        </div>
      </div>
    </div>
  );
}
