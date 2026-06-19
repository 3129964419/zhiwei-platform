import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Save, Sparkles } from 'lucide-react';
import type { Agent, PersonalityId, RelationshipId } from '@/types';
import { personalities } from '@/data/personalities';
import { relationships } from '@/data/relationships';
import { agentAPI } from '@/services/agent';
import { useAgentStore } from '@/store/agentStore';
import { useUIStore } from '@/store/uiStore';
import { debounce } from '@/utils/debounce';

interface EditAgentModalProps {
  agent: Agent;
  onClose: () => void;
}

export default function EditAgentModal({ agent, onClose }: EditAgentModalProps) {
  const [name, setName] = useState(agent.name);
  const [personality, setPersonality] = useState<PersonalityId | string>(agent.personality);
  const [relationship, setRelationship] = useState<RelationshipId | string>(agent.relationship);
  const [customPersonality, setCustomPersonality] = useState(agent.customPersonality || '');
  const [background, setBackground] = useState(agent.background);
  const [saving, setSaving] = useState(false);

  const replaceAgent = useAgentStore((s) => s.replaceAgent);
  const addToast = useUIStore((s) => s.addToast);

  // 使用 ref 防止重复提交
  const isSavingRef = useRef(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // 防抖保存函数
  const debouncedSave = useCallback(
    debounce(async () => {
      if (isSavingRef.current) return;
      if (!name.trim()) {
        addToast('error', '请输入智能体名称');
        return;
      }

      isSavingRef.current = true;
      setSaving(true);

      try {
        const updated = await agentAPI.update(agent.id, {
          name: name.trim(),
          personality,
          relationship,
          customPersonality: customPersonality.trim() || undefined,
          background: background.trim(),
        });
        replaceAgent(updated);
        addToast('success', '修改已保存');
        onClose();
      } catch (e: any) {
        addToast('error', e.message || '保存失败');
      } finally {
        setSaving(false);
        isSavingRef.current = false;
      }
    }, 300),
    [name, personality, relationship, customPersonality, background, agent.id, replaceAgent, addToast, onClose]
  );

  const handleSave = () => {
    debouncedSave();
  };

  const isCustom = personality === 'custom';

  return (
    <>
      <div className="fixed inset-0 z-50 bg-ink-900/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-white rounded-4xl shadow-glow overflow-hidden animate-fade-in-up">
          <div className="flex items-center justify-between p-5 border-b border-ink-100">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-display text-lg font-semibold"
                style={{
                  background: `linear-gradient(135deg, ${agent.avatarGradient[0]}, ${agent.avatarGradient[1]})`,
                }}
              >
                {agent.avatar}
              </div>
              <div>
                <h2 className="font-semibold text-ink-900">编辑智能体</h2>
                <p className="text-xs text-ink-900/50">{agent.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-ink-100 flex items-center justify-center text-ink-900/50 transition"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-5 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-ink-900/80 mb-2">
                名称
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入智能体名称"
                className="input-field w-full"
                maxLength={20}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-900/80 mb-2">
                性格类型
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {personalities.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setPersonality(p.id);
                      if (p.id !== 'custom') setCustomPersonality('');
                    }}
                    className={`p-3 rounded-2xl border transition-all text-left ${
                      personality === p.id
                        ? 'border-iris-400 bg-iris-400/10'
                        : 'border-ink-100 hover:border-ink-200 bg-white'
                    }`}
                  >
                    <span className="text-xl">{p.emoji}</span>
                    <p className="text-xs font-medium text-ink-900 mt-1">{p.name}</p>
                  </button>
                ))}
              </div>
              {isCustom && (
                <textarea
                  value={customPersonality}
                  onChange={(e) => setCustomPersonality(e.target.value)}
                  placeholder="描述自定义性格特征..."
                  className="input-field w-full mt-3 h-24 resize-none"
                  maxLength={200}
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-900/80 mb-2">
                关系类型
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {relationships.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setRelationship(r.id)}
                    className={`px-4 py-2 rounded-full text-sm transition-all ${
                      relationship === r.id
                        ? 'bg-ink-900 text-white'
                        : 'bg-ink-50 text-ink-900/70 hover:bg-ink-100'
                    }`}
                  >
                    {r.emoji} {r.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-900/80 mb-2">
                背景故事
              </label>
              <textarea
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                placeholder="描述智能体的背景故事..."
                className="input-field w-full h-32 resize-none"
                maxLength={500}
              />
            </div>
          </div>

          <div className="flex gap-3 p-5 border-t border-ink-100">
            <button
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Sparkles size={16} className="animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save size={16} />
                  保存
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
