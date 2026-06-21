import { Link } from 'react-router-dom';
import { MessageCircle, MoreHorizontal, Copy, Trash2, Edit3 } from 'lucide-react';
import type { Agent } from '@/types';
import { personalities } from '@/data/personalities';
import { relationships } from '@/data/relationships';
import { formatTime } from '@/utils/format';
import { useState } from 'react';
import { useAgentStore } from '@/store/agentStore';
import { useUIStore } from '@/store/uiStore';
import EditAgentModal from './EditAgentModal';

interface AgentCardProps {
  agent: Agent;
  compact?: boolean;
}

export default function AgentCard({ agent, compact = false }: AgentCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const deleteAgent = useAgentStore((s) => s.deleteAgent);
  const duplicateAgent = useAgentStore((s) => s.duplicateAgent);
  const addToast = useUIStore((s) => s.addToast);

  const personality = personalities.find((p) => p.id === agent.personality);
  const relationship = relationships.find((r) => r.id === agent.relationship);

  const handleDelete = async () => {
    if (confirm(`确定要删除「${agent.name}」吗？此操作无法撤销。`)) {
      await deleteAgent(agent.id);
      addToast('success', '智能体已删除');
    }
    setMenuOpen(false);
  };

  const handleDuplicate = async () => {
    const copy = await duplicateAgent(agent.id);
    if (copy) addToast('success', '已复制');
    setMenuOpen(false);
  };

  const handleEdit = () => {
    setMenuOpen(false);
    setShowEditModal(true);
  };

  return (
    <div className="group relative">
      <Link
        to={`/agent/${agent.id}`}
        className="block glass rounded-3xl p-5 hover-lift overflow-hidden relative"
      >
        <div
          className="absolute inset-0 opacity-20 group-hover:opacity-30 transition"
          style={{
            background: `linear-gradient(135deg, ${agent.avatarGradient[0]}, ${agent.avatarGradient[1]})`,
          }}
        />

        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-display text-2xl font-semibold shadow-soft"
              style={{
                background: `linear-gradient(135deg, ${agent.avatarGradient[0]}, ${agent.avatarGradient[1]})`,
              }}
            >
              {agent.avatar}
            </div>
            <div className="flex items-center gap-1">
              {personality && (
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{
                    background: `${personality.color}30`,
                    color: personality.gradient[1],
                  }}
                >
                  {personality.emoji} {personality.name}
                </span>
              )}
            </div>
          </div>

          <h3 className="font-display text-xl font-semibold text-ink-900 mb-1 truncate">
            {agent.name}
          </h3>

          {relationship && !compact && (
            <p className="text-xs text-ink-900/60 mb-3">
              {relationship.emoji} {relationship.name}
            </p>
          )}

          <p className="text-sm text-ink-900/70 line-clamp-2 mb-4 min-h-[2.5em]">
            {agent.background}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-ink-900/50">
              <MessageCircle size={12} />
              <span>{formatTime(agent.lastUsedAt)}</span>
            </div>
            <div className="text-xs text-iris-500 font-medium opacity-0 group-hover:opacity-100 transition">
              开始聊天 →
            </div>
          </div>
        </div>
      </Link>

      <div className="absolute top-3 right-3 z-10">
        <button
          onClick={(e) => {
            e.preventDefault();
            setMenuOpen(!menuOpen);
          }}
          className="w-7 h-7 rounded-full bg-white/80 backdrop-blur flex items-center justify-center opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition hover:bg-white"
          aria-label="更多操作"
        >
          <MoreHorizontal size={14} className="text-ink-900" />
        </button>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-20"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 top-9 z-30 w-40 bg-white rounded-2xl shadow-card border border-ink-100 py-1.5">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleDuplicate();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-900/80 hover:bg-ink-50"
              >
                <Copy size={14} /> 复制
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleEdit();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-900/80 hover:bg-ink-50"
              >
                <Edit3 size={14} /> 编辑
              </button>
              <div className="h-px bg-ink-100 my-1" />
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-coral-500 hover:bg-coral-400/5"
              >
                <Trash2 size={14} /> 删除
              </button>
            </div>
          </>
        )}
      </div>

      {showEditModal && (
        <EditAgentModal agent={agent} onClose={() => setShowEditModal(false)} />
      )}
    </div>
  );
}
