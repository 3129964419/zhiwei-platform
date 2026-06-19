import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  X,
  Image as ImageIcon,
  FileText,
  Sparkles,
  Check,
  Loader2,
  Wand2,
  Brain,
  Heart,
  Edit3,
} from 'lucide-react';
import Layout from '@/components/Layout';
import { useUserStore } from '@/store/userStore';
import { useAgentStore } from '@/store/agentStore';
import { useUIStore } from '@/store/uiStore';
import { agentAPI } from '@/services/agent';
import { pricingService } from '@/services/pricing';
import { subscriptionService } from '@/services/subscription';
import { pickRandom } from '@/utils/common';
import type { AnalysisReport, Skill } from '@/types';

const STAGES = [
  { id: 1, icon: ImageIcon, label: 'OCR 识别', desc: '识别图片中的对话内容' },
  { id: 2, icon: Brain, label: '风格与口吻', desc: '提取语言特征与称呼' },
  { id: 3, icon: Sparkles, label: '情感系统建模', desc: '分析情感表达与情绪' },
  { id: 4, icon: Heart, label: '关系构建', desc: '构建性格与互动模式' },
];

const MAX_FILES = 20;
const MAX_SIZE = 100 * 1024 * 1024;
const MAX_PREVIEW_SHOW = 9;

export default function CloneAgent() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const addAgent = useAgentStore((s) => s.addAgent);
  const addToast = useUIStore((s) => s.addToast);

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [stageLabel, setStageLabel] = useState('');
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [skill, setSkill] = useState<Skill | null>(null);
  const [name, setName] = useState('TA');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      previews.forEach((url) => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const arr = Array.from(newFiles);
    const valid: File[] = [];
    for (const f of arr) {
      if (files.length + valid.length >= MAX_FILES) {
        addToast('error', `最多上传 ${MAX_FILES} 张`);
        break;
      }
      if (f.size > MAX_SIZE / MAX_FILES) {
        addToast('error', `${f.name} 文件过大`);
        continue;
      }
      if (!/image\/(jpeg|png)|application\/pdf/.test(f.type)) {
        addToast('error', `${f.name} 格式不支持`);
        continue;
      }
      valid.push(f);
    }
    if (valid.length === 0) return;
    setFiles((prev) => [...prev, ...valid]);
    const newPreviews: string[] = [];
    valid.forEach((f) => {
      if (f.type.startsWith('image/')) {
        const url = URL.createObjectURL(f);
        newPreviews.push(url);
      } else {
        newPreviews.push('');
      }
    });
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (idx: number) => {
    if (previews[idx] && previews[idx].startsWith('blob:')) {
      URL.revokeObjectURL(previews[idx]);
    }
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const clearAllFiles = () => {
    previews.forEach((url) => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    setFiles([]);
    setPreviews([]);
  };

  const startAnalysis = async () => {
    if (files.length === 0) {
      addToast('error', '请先上传聊天截图');
      return;
    }
    if (!user) return;

    const remaining = subscriptionService.getRemainingQuota(user.id);
    if (remaining.clones <= 0 && !remaining.isUnlimited) {
      addToast('error', '复刻次数不足，请购买套餐或单次复刻');
      return;
    }

    setAnalyzing(true);
    setCurrentStage(0);
    setProgress(0);
    setReport(null);

    const onProgress = (step: number, label: string) => {
      setCurrentStage(step);
      setStageLabel(label);
      setProgress((step / STAGES.length) * 100);
    };

    try {
      const { report, agent, skill } = await agentAPI.cloneFromScreenshots(
        files,
        user.id,
        name,
        onProgress
      );
      setReport(report);
      setSkill(skill);
      addAgent(agent);
      addToast('success', `${name} 已成功复刻！`);
      setTimeout(() => {
        clearAllFiles();
        navigate(`/agent/${agent.id}`);
      }, 1500);
    } catch (e: any) {
      addToast('error', e.message || '分析失败');
      setAnalyzing(false);
    }
  };

  return (
    <Layout showFooter={false}>
      <div className="aurora-bg min-h-screen">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-white hover:bg-ink-50 flex items-center justify-center text-ink-900/70 transition shadow-card"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
              <Wand2 size={22} className="text-iris-500" /> 角色复刻
            </h1>
            <div className="w-10" />
          </div>

          {analyzing ? (
            <div className="glass rounded-4xl p-8">
              <div className="text-center mb-8">
                <h2 className="font-display text-2xl font-semibold mb-2">
                  AI 正在分析对话
                </h2>
                <p className="text-sm text-ink-900/60">
                  {stageLabel || '准备中...'}
                </p>
              </div>

              <div className="mb-8">
                <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-iris-500 to-rose-400 transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-ink-900/40 text-center mt-2">
                  {Math.round(progress)}%
                </p>
              </div>

              <div className="space-y-3">
                {STAGES.map((stage) => {
                  const Icon = stage.icon;
                  const isActive = currentStage === stage.id;
                  const isDone = currentStage > stage.id;
                  return (
                    <div
                      key={stage.id}
                      className={`flex items-center gap-4 p-4 rounded-2xl transition ${
                        isActive
                          ? 'bg-gradient-to-r from-iris-50 to-rose-50 border border-iris-200'
                          : isDone
                          ? 'bg-mint-400/5'
                          : 'bg-ink-50/50'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${
                          isActive
                            ? 'bg-gradient-to-br from-iris-500 to-rose-400 text-white'
                            : isDone
                            ? 'bg-gradient-to-br from-mint-400 to-mint-500 text-white'
                            : 'bg-ink-100 text-ink-900/30'
                        }`}
                      >
                        {isDone ? <Check size={18} /> : isActive ? <Loader2 size={18} className="animate-spin" /> : <Icon size={18} />}
                      </div>
                      <div className="flex-1">
                        <p
                          className={`text-sm font-semibold ${
                            isActive || isDone ? 'text-ink-900' : 'text-ink-900/40'
                          }`}
                        >
                          {stage.label}
                        </p>
                        <p className="text-xs text-ink-900/50">{stage.desc}</p>
                      </div>
                      {isActive && (
                        <div className="text-xs text-iris-500 font-medium animate-pulse">
                          进行中
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {report && (
                <div className="mt-8 p-5 rounded-2xl bg-gradient-to-br from-mint-400/10 to-iris-500/10 border border-mint-400/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={16} className="text-mint-500" />
                    <p className="text-sm font-semibold">分析完成</p>
                  </div>
                  <p className="text-xs text-ink-900/70 leading-relaxed mb-3">
                    {report.summary}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {report.catchphrases.slice(0, 4).map((c) => (
                      <span
                        key={c}
                        className="text-[10px] px-2 py-1 rounded-full bg-white text-ink-900/70"
                      >
                        "{c}"
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="glass rounded-3xl p-5 mb-5 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-iris-500 to-rose-400 flex items-center justify-center text-white shrink-0">
                  <Wand2 size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">智能角色复刻</p>
                  <p className="text-xs text-ink-900/60 leading-relaxed">
                    上传聊天记录截图，AI 将自动提取对方的性格特征、口头禅、情感模式，
                    生成专属的"复刻版"智能体。
                  </p>
                </div>
              </div>

              <div className="glass rounded-3xl p-5 mb-5">
                <label className="text-sm font-medium mb-2 block">给 TA 起个名字</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 12))}
                  placeholder="例如：女友、前任、同事小林..."
                  className="input-field"
                />
              </div>

              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => inputRef.current?.click()}
                className="glass rounded-3xl p-8 border-2 border-dashed border-iris-300/50 hover:border-iris-500 transition cursor-pointer text-center"
              >
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,application/pdf"
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-iris-500/20 to-rose-400/20 mx-auto mb-3 flex items-center justify-center">
                  <Upload size={24} className="text-iris-500" />
                </div>
                <p className="text-sm font-semibold mb-1">
                  拖拽聊天截图到此处
                </p>
                <p className="text-xs text-ink-900/50">
                  或点击选择文件 · 支持 JPG/PNG/PDF · 最多 {MAX_FILES} 张
                </p>
              </div>

              {files.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <p className="text-xs text-ink-900/60">
                      已选择 {files.length} / {MAX_FILES} 张
                    </p>
                    <button
                      onClick={clearAllFiles}
                      className="text-xs text-coral-500 hover:underline"
                    >
                      清空
                    </button>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {previews.slice(0, MAX_PREVIEW_SHOW).map((preview, i) => (
                      <div
                        key={i}
                        className="relative aspect-square rounded-xl overflow-hidden group bg-ink-100"
                      >
                        {preview ? (
                          <img
                            src={preview}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-ink-900/40">
                            <FileText size={20} />
                            <span className="text-[9px] mt-1">PDF</span>
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(i);
                          }}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-ink-900/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {files.length > MAX_PREVIEW_SHOW && (
                      <div className="relative aspect-square rounded-xl overflow-hidden bg-ink-100 flex items-center justify-center">
                        <span className="text-xs text-ink-900/40">
                          +{files.length - MAX_PREVIEW_SHOW}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={startAnalysis}
                  disabled={files.length === 0}
                  className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Sparkles size={16} /> 开始智能分析
                </button>
              </div>

              <div className="mt-6 text-center text-[10px] text-ink-900/40 leading-relaxed">
                上传的图片仅在本地处理，AI 分析完成后可立即清除
                <br />
                我们承诺不保存、不上传、不分享您的聊天记录
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
