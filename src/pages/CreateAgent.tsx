import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Sparkles, Loader2, Check, Heart, Edit3, Upload } from 'lucide-react';
import Layout from '@/components/Layout';
import { personalities } from '@/data/personalities';
import { relationships } from '@/data/relationships';
import { useUserStore } from '@/store/userStore';
import { useAgentStore } from '@/store/agentStore';
import { useUIStore } from '@/store/uiStore';
import { agentAPI } from '@/services/agent';
import type { InteractionMode, PersonalityId, RelationshipId } from '@/types';

const steps = [
  { id: 1, title: '选择性格' },
  { id: 2, title: '选择关系' },
  { id: 3, title: '设定互动' },
  { id: 4, title: '命名生成' },
];

export default function CreateAgent() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const addAgent = useAgentStore((s) => s.addAgent);
  const addToast = useUIStore((s) => s.addToast);

  const [step, setStep] = useState(1);
  const [personality, setPersonality] = useState<PersonalityId | null>(null);
  const [customPersonality, setCustomPersonality] = useState('');
  const [relationship, setRelationship] = useState<RelationshipId | null>(null);
  const [relationshipDepth, setRelationshipDepth] = useState(50);
  const [modes, setModes] = useState<InteractionMode[]>(['text']);
  const [name, setName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

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

    setUploadingAvatar(true);
    try {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setCustomAvatar(ev.target?.result as string);
        addToast('success', '头像已上传');
      };
      reader.onerror = () => {
        addToast('error', '头像上传失败');
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleNext = () => {
    if (step === 1 && !personality && !customPersonality.trim()) {
      addToast('error', '请选择或自定义一个性格');
      return;
    }
    if (step === 2 && !relationship) {
      addToast('error', '请选择一种关系');
      return;
    }
    if (step === 3 && modes.length === 0) {
      addToast('error', '请选择至少一种互动方式');
      return;
    }
    if (step === 4 && !name.trim()) {
      addToast('error', '请为你的智能体起个名字');
      return;
    }
    if (step === 4) {
      handleGenerate();
      return;
    }
    setStep(step + 1);
  };

  const handleGenerate = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const personalityName =
        personality === 'custom'
          ? customPersonality
          : personalities.find((p) => p.id === personality)?.name || '温柔';

      const relationshipName =
        relationships.find((r) => r.id === relationship)?.name || '朋友';

      const depthDesc =
        relationshipDepth < 33
          ? '保持一定距离'
          : relationshipDepth < 66
          ? '关系较为亲近'
          : '关系深度亲密';

      const background = `一位${personalityName}的${relationshipName}，${depthDesc}。${
        personality === 'custom' ? `性格特点：${customPersonality}。` : ''
      }${
        personalities.find((p) => p.id === personality)?.description || ''
      }`;

      const agent = await agentAPI.createNormal({
        userId: user.id,
        name: name.trim(),
        personality: personality || 'custom',
        relationship: relationship || 'friend',
        interactionMode: modes,
        background,
        customPersonality: personality === 'custom' ? customPersonality : undefined,
        customAvatar: customAvatar || undefined,
      });
      addAgent(agent);
      addToast('success', `${name} 已诞生，去打个招呼吧`);
      navigate(`/agent/${agent.id}`);
    } catch (e: any) {
      addToast('error', e.message || '生成失败');
    } finally {
      setGenerating(false);
    }
  };

  const toggleMode = (mode: InteractionMode) => {
    setModes((m) => (m.includes(mode) ? m.filter((x) => x !== mode) : [...m, mode]));
  };

  const selectedPersonality = personalities.find((p) => p.id === personality);

  return (
    <Layout showFooter={false}>
      <div className="aurora-bg min-h-screen">
        <div className="max-w-3xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => (step > 1 ? setStep(step - 1) : navigate(-1))}
              className="w-10 h-10 rounded-full bg-white hover:bg-ink-50 flex items-center justify-center text-ink-900/70 transition shadow-card"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="font-display text-2xl font-semibold">创建智能体</h1>
            <div className="w-10" />
          </div>

          {/* 进度 */}
          <div className="flex items-center gap-2 mb-10">
            {steps.map((s) => (
              <div key={s.id} className="flex-1 flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition ${
                    step > s.id
                      ? 'bg-gradient-to-br from-iris-500 to-rose-400 text-white'
                      : step === s.id
                      ? 'bg-white text-iris-500 border-2 border-iris-500 shadow-glow'
                      : 'bg-ink-100 text-ink-900/40'
                  }`}
                >
                  {step > s.id ? <Check size={14} /> : s.id}
                </div>
                <span
                  className={`text-xs font-medium hidden sm:inline ${
                    step >= s.id ? 'text-ink-900' : 'text-ink-900/40'
                  }`}
                >
                  {s.title}
                </span>
                {s.id < steps.length && (
                  <div
                    className={`flex-1 h-0.5 ${
                      step > s.id ? 'bg-gradient-to-r from-iris-500 to-rose-400' : 'bg-ink-100'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* 步骤内容 */}
          {generating ? (
            <div className="text-center py-20">
              <div className="relative w-32 h-32 mx-auto mb-8">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      'conic-gradient(from 0deg, #7C5CFF, #FF8FB1, #FFB088, #7C5CFF)',
                    animation: 'spin 2s linear infinite',
                  }}
                />
                <div className="absolute inset-2 rounded-full bg-ink-50 flex items-center justify-center">
                  <Sparkles size={36} className="text-iris-500" />
                </div>
              </div>
              <h2 className="font-display text-2xl font-semibold mb-2">
                AI 正在构建灵魂...
              </h2>
              <p className="text-sm text-ink-900/60">分析性格特征，生成对话风格</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : (
            <div className="glass rounded-4xl p-6 md:p-8 min-h-[400px]">
              {step === 1 && (
                <div>
                  <h2 className="font-display text-2xl font-semibold mb-2">
                    选择智能体的性格
                  </h2>
                  <p className="text-sm text-ink-900/60 mb-6">
                    性格决定了 TA 的说话方式、情感反应与互动风格
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {personalities.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setPersonality(p.id)}
                        className={`relative p-4 rounded-2xl text-left transition ${
                          personality === p.id
                            ? 'ring-2 ring-iris-500 shadow-glow'
                            : 'hover:shadow-card'
                        }`}
                        style={{
                          background: `linear-gradient(135deg, ${p.gradient[0]}30, ${p.gradient[1]}30)`,
                        }}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3"
                          style={{
                            background: `linear-gradient(135deg, ${p.gradient[0]}, ${p.gradient[1]})`,
                          }}
                        >
                          {p.emoji}
                        </div>
                        <p className="text-sm font-semibold text-ink-900 mb-0.5">
                          {p.name}
                        </p>
                        <p className="text-[10px] text-ink-900/60 line-clamp-2">
                          {p.description}
                        </p>
                        {personality === p.id && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-iris-500 text-white flex items-center justify-center">
                            <Check size={12} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="mt-5">
                    <button
                      onClick={() => setPersonality('custom')}
                      className={`w-full text-left p-4 rounded-2xl border-2 border-dashed transition ${
                        personality === 'custom'
                          ? 'border-iris-500 bg-iris-50/50'
                          : 'border-ink-200 hover:border-iris-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Edit3 size={18} className="text-iris-500" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold mb-1">自定义性格</p>
                          <input
                            type="text"
                            placeholder="例如：毒舌但关心人，外冷内热..."
                            value={customPersonality}
                            onChange={(e) => {
                              setCustomPersonality(e.target.value);
                              if (e.target.value) setPersonality('custom');
                            }}
                            onClick={() => setPersonality('custom')}
                            className="w-full bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-900/30"
                          />
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className="font-display text-2xl font-semibold mb-2">
                    你们是什么关系？
                  </h2>
                  <p className="text-sm text-ink-900/60 mb-6">
                    关系类型影响互动模式、称呼方式与情感边界
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {relationships.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => setRelationship(r.id)}
                        className={`relative p-4 rounded-2xl text-left transition glass ${
                          relationship === r.id
                            ? 'ring-2 ring-iris-500 shadow-glow'
                            : 'hover:shadow-card'
                        }`}
                      >
                        <div className="text-2xl mb-2">{r.emoji}</div>
                        <p className="text-sm font-semibold text-ink-900 mb-0.5">
                          {r.name}
                        </p>
                        <p className="text-[10px] text-ink-900/60 line-clamp-2">
                          {r.description}
                        </p>
                        {relationship === r.id && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-iris-500 text-white flex items-center justify-center">
                            <Check size={12} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 glass rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">关系深度</span>
                      <span className="text-xs text-iris-500 font-medium">
                        {relationshipDepth < 33
                          ? '熟悉'
                          : relationshipDepth < 66
                          ? '亲密'
                          : '深度羁绊'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={relationshipDepth}
                      onChange={(e) => setRelationshipDepth(Number(e.target.value))}
                      className="w-full accent-iris-500"
                    />
                    <div className="flex justify-between text-[10px] text-ink-900/40 mt-1">
                      <span>陌生</span>
                      <span>熟悉</span>
                      <span>亲密</span>
                      <span>羁绊</span>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h2 className="font-display text-2xl font-semibold mb-2">
                    选择互动方式
                  </h2>
                  <p className="text-sm text-ink-900/60 mb-6">
                    多种互动方式，让陪伴更立体
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { id: 'text' as const, name: '文字对话', desc: '智能文字回复', emoji: '💬', gradient: ['#E5DEFF', '#B8A6FF'] },
                      { id: 'sticker' as const, name: '表情包', desc: '上下文推荐表情', emoji: '😊', gradient: ['#FFD3E0', '#FF8FB1'] },
                      { id: 'voice' as const, name: '语音消息', desc: '声音合成（即将上线）', emoji: '🎤', gradient: ['#FFD3B6', '#FFB088'] },
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => toggleMode(m.id)}
                        className={`relative p-6 rounded-3xl text-left transition ${
                          modes.includes(m.id)
                            ? 'ring-2 ring-iris-500 shadow-glow'
                            : ''
                        }`}
                        style={{
                          background: `linear-gradient(135deg, ${m.gradient[0]}40, ${m.gradient[1]}40)`,
                        }}
                      >
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-3"
                          style={{
                            background: `linear-gradient(135deg, ${m.gradient[0]}, ${m.gradient[1]})`,
                          }}
                        >
                          {m.emoji}
                        </div>
                        <p className="text-base font-semibold mb-1">{m.name}</p>
                        <p className="text-xs text-ink-900/60">{m.desc}</p>
                        {modes.includes(m.id) && (
                          <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-iris-500 text-white flex items-center justify-center">
                            <Check size={14} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 glass rounded-2xl p-4 flex items-start gap-3">
                    <Heart size={18} className="text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold mb-1">小贴士</p>
                      <p className="text-xs text-ink-900/60 leading-relaxed">
                        开启「表情包」后，AI 会根据对话上下文自动推荐合适的表情，让聊天更有温度。
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div>
                  <h2 className="font-display text-2xl font-semibold mb-2">
                    最后，给 TA 起个名字
                  </h2>
                  <p className="text-sm text-ink-900/60 mb-6">
                    根据你的设定，AI 正在构建专属智能体
                  </p>

                  {/* 预览卡片 */}
                  <div className="glass rounded-3xl p-5 mb-5 flex items-center gap-4">
                    <div className="relative">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-display text-2xl font-semibold overflow-hidden"
                        style={{
                          background: customAvatar
                            ? `url(${customAvatar}) center/cover`
                            : `linear-gradient(135deg, ${selectedPersonality?.gradient[0] || '#E5DEFF'}, ${selectedPersonality?.gradient[1] || '#B8A6FF'})`,
                        }}
                      >
                        {!customAvatar && (selectedPersonality?.emoji || '✨')}
                      </div>
                      <button
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-iris-500 flex items-center justify-center text-white shadow-lg hover:bg-iris-600 transition"
                      >
                        {uploadingAvatar ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Upload size={12} />
                        )}
                      </button>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-ink-900/50">预览</p>
                      <p className="font-display text-xl font-semibold truncate">
                        {name || '未命名'}
                      </p>
                      <p className="text-xs text-ink-900/60 mt-1">
                        {selectedPersonality?.name} ·{' '}
                        {relationships.find((r) => r.id === relationship)?.name} ·{' '}
                        {modes.length} 种互动
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      智能体名称
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value.slice(0, 12))}
                      placeholder="例如：温柔的小鹿、傲娇学长..."
                      className="input-field"
                      maxLength={12}
                    />
                    <p className="text-[10px] text-ink-900/40 mt-1.5">
                      {name.length}/12 字
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 操作按钮 */}
          {!generating && (
            <div className="flex justify-between mt-6">
              <button
                onClick={() => (step > 1 ? setStep(step - 1) : navigate(-1))}
                className="btn-ghost"
              >
                <ArrowLeft size={16} className="inline mr-1" /> 上一步
              </button>
              <button onClick={handleNext} className="btn-primary flex items-center gap-2">
                {step === 4 ? (
                  <>
                    <Sparkles size={16} /> 生成智能体
                  </>
                ) : (
                  <>
                    下一步 <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
