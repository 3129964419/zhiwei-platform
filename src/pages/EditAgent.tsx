import { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Upload, Trash2 } from 'lucide-react';
import Layout from '@/components/Layout';
import { useAgentStore } from '@/store/agentStore';
import { useUIStore } from '@/store/uiStore';
import { personalities } from '@/data/personalities';
import { relationships } from '@/data/relationships';
import type { PersonalityId, RelationshipId } from '@/types';

export default function EditAgent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const agents = useAgentStore((s) => s.agents);
  const updateAgent = useAgentStore((s) => s.updateAgent);
  const deleteAgent = useAgentStore((s) => s.deleteAgent);
  const addToast = useUIStore((s) => s.addToast);

  const agent = agents.find((a) => a.id === id);

  const [name, setName] = useState(agent?.name || '');
  const [personality, setPersonality] = useState<PersonalityId | null>(
    (agent?.personality as PersonalityId) || null
  );
  const [customPersonality, setCustomPersonality] = useState(
    agent?.customPersonality || ''
  );
  const [relationship, setRelationship] = useState<RelationshipId | null>(
    (agent?.relationship as RelationshipId) || null
  );
  const [customAvatar, setCustomAvatar] = useState<string | null>(
    agent?.customAvatar || null
  );
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  if (!agent) {
    return (
      <Layout>
        <div className="aurora-bg min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-ink-900/60 mb-4">智能体不存在</p>
            <button onClick={() => navigate('/dashboard')} className="btn-primary">
              返回仪表盘
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('error', '请上传图片文件');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      addToast('error', '图片大小不能超过 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setCustomAvatar(ev.target?.result as string);
      addToast('success', '头像已更新');
    };
    reader.onerror = () => {
      addToast('error', '头像上传失败');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!name.trim()) {
      addToast('error', '请输入智能体名称');
      return;
    }

    setSaving(true);
    try {
      updateAgent(agent.id, {
        name: name.trim(),
        personality: personality || agent.personality,
        customPersonality: personality === 'custom' ? customPersonality : undefined,
        relationship: relationship || agent.relationship,
        customAvatar: customAvatar || undefined,
      });
      addToast('success', '保存成功');
      navigate(`/agent/${agent.id}`);
    } catch (e: any) {
      addToast('error', e.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    deleteAgent(agent.id);
    addToast('success', '智能体已删除');
    navigate('/dashboard');
  };

  const selectedPersonality = personalities.find((p) => p.id === personality);

  return (
    <Layout showFooter={false}>
      <div className="aurora-bg min-h-screen">
        <div className="max-w-2xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-white hover:bg-ink-50 flex items-center justify-center text-ink-900/70 transition shadow-card"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="font-display text-2xl font-semibold">编辑智能体</h1>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              保存
            </button>
          </div>

          {/* Preview Card */}
          <div className="glass rounded-4xl p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-display text-2xl font-semibold overflow-hidden"
                  style={{
                    background: customAvatar
                      ? `url(${customAvatar}) center/cover`
                      : `linear-gradient(135deg, ${selectedPersonality?.gradient[0] || '#E5DEFF'}, ${selectedPersonality?.gradient[1] || '#B8A6FF'})`,
                  }}
                >
                  {!customAvatar && (selectedPersonality?.emoji || agent.emoji || '✨')}
                </div>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-iris-500 flex items-center justify-center text-white shadow-lg hover:bg-iris-600 transition"
                >
                  <Upload size={12} />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 12))}
                  placeholder="智能体名称"
                  className="w-full text-xl font-display font-semibold bg-transparent border-b border-transparent hover:border-ink-200 focus:border-iris-500 outline-none transition"
                  maxLength={12}
                />
                <p className="text-sm text-ink-900/50 mt-1">
                  {selectedPersonality?.name || '自定义'} · {relationships.find(r => r.id === relationship)?.name || agent.relationship}
                </p>
              </div>
            </div>
          </div>

          {/* Personality Selection */}
          <div className="glass rounded-4xl p-6 mb-4">
            <h2 className="font-semibold text-ink-900 mb-4">性格</h2>
            <div className="grid grid-cols-3 gap-2">
              {personalities.slice(0, 6).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPersonality(p.id)}
                  className={`p-3 rounded-xl text-left transition ${
                    personality === p.id
                      ? 'ring-2 ring-iris-500 bg-iris-50/50'
                      : 'hover:bg-white/50'
                  }`}
                >
                  <span className="text-lg">{p.emoji}</span>
                  <p className="text-sm font-medium mt-1">{p.name}</p>
                </button>
              ))}
            </div>
            {personality === 'custom' && (
              <input
                type="text"
                value={customPersonality}
                onChange={(e) => setCustomPersonality(e.target.value)}
                placeholder="描述自定义性格..."
                className="input-field mt-3"
              />
            )}
          </div>

          {/* Relationship Selection */}
          <div className="glass rounded-4xl p-6 mb-4">
            <h2 className="font-semibold text-ink-900 mb-4">关系</h2>
            <div className="grid grid-cols-3 gap-2">
              {relationships.slice(0, 6).map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRelationship(r.id)}
                  className={`p-3 rounded-xl text-left transition ${
                    relationship === r.id
                      ? 'ring-2 ring-iris-500 bg-iris-50/50'
                      : 'hover:bg-white/50'
                  }`}
                >
                  <span className="text-lg">{r.emoji}</span>
                  <p className="text-sm font-medium mt-1">{r.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="glass rounded-4xl p-6 border border-coral-400/30">
            <h2 className="font-semibold text-coral-500 mb-4">危险操作</h2>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-coral-500/10 text-coral-500 hover:bg-coral-500/20 transition"
            >
              <Trash2 size={16} />
              删除智能体
            </button>
            <p className="text-xs text-ink-900/40 mt-2">删除后无法恢复，请谨慎操作</p>
          </div>

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/40 backdrop-blur-sm">
              <div className="bg-white rounded-3xl shadow-glow max-w-sm w-full p-6">
                <h3 className="font-display text-xl font-semibold mb-2">确认删除</h3>
                <p className="text-ink-900/60 mb-6">
                  确定要删除「{agent.name}」吗？此操作无法撤销。
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2.5 rounded-full border border-ink-200 text-ink-900 font-medium hover:bg-ink-50 transition"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 py-2.5 rounded-full bg-coral-500 text-white font-medium hover:bg-coral-600 transition"
                  >
                    确认删除
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
