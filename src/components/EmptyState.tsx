import { useNavigate } from 'react-router-dom';
import { Sparkles, Plus, ArrowRight } from 'lucide-react';

interface EmptyStateProps {
  type?: 'agents' | 'messages' | 'history';
}

export default function EmptyState({ type = 'agents' }: EmptyStateProps) {
  const navigate = useNavigate();

  const content = {
    agents: {
      icon: Sparkles,
      title: '还没有智能体',
      description: '创建你的第一个 AI 陪伴伙伴，开始一段独特的对话体验',
      action: '创建智能体',
      actionPath: '/create',
    },
    messages: {
      icon: Sparkles,
      title: '开始对话吧',
      description: '发送第一条消息，TA 会记住你们的每一次交流',
      action: '开始对话',
      actionPath: '',
    },
    history: {
      icon: Sparkles,
      title: '暂无历史记录',
      description: '你的对话历史会显示在这里',
      action: '',
      actionPath: '',
    },
  };

  const { icon: Icon, title, description, action, actionPath } = content[type];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      {/* Animated background */}
      <div className="relative mb-6">
        <div className="absolute inset-0 animate-pulse">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-iris-500/20 to-rose-400/20 blur-xl" />
        </div>
        <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-iris-500 to-rose-400 flex items-center justify-center shadow-glow">
          <Icon size={40} className="text-white" />
        </div>
      </div>

      <h3 className="font-display text-xl font-semibold text-ink-900 mb-2">
        {title}
      </h3>
      <p className="text-ink-900/60 text-center max-w-xs mb-6">
        {description}
      </p>

      {action && (
        <button
          onClick={() => navigate(actionPath)}
          className="group flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-iris-500 to-rose-400 text-white font-semibold shadow-soft hover:shadow-glow transition-all"
        >
          <Plus size={18} />
          {action}
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      )}

      {/* Quick tips */}
      {type === 'agents' && (
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-lg">
          {[
            { emoji: '🎭', text: '选择性格' },
            { emoji: '💕', text: '设定关系' },
            { emoji: '💬', text: '开始对话' },
          ].map((tip, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/60 backdrop-blur border border-white/40"
            >
              <span className="text-xl">{tip.emoji}</span>
              <span className="text-sm text-ink-900/70">{tip.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
