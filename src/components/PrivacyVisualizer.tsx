/**
 * 隐私计算可视化组件
 * 展示数据处理过程的动画，增强用户信任感
 */

import { useState, useEffect } from 'react';
import { Shield, Lock, Eye, Trash2, CheckCircle2, Sparkles, ChevronRight } from 'lucide-react';

interface ProcessingStep {
  id: string;
  icon: typeof Shield;
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  progress?: number;
}

interface PrivacyVisualizerProps {
  isProcessing?: boolean;
  onComplete?: () => void;
  autoStart?: boolean;
}

const DEFAULT_STEPS: ProcessingStep[] = [
  {
    id: 'upload',
    icon: Sparkles,
    title: '接收数据',
    description: '安全接收您的聊天记录',
    status: 'pending',
  },
  {
    id: 'sanitize',
    icon: Eye,
    title: '脱敏处理',
    description: '移除敏感个人信息（身份证号、银行卡等）',
    status: 'pending',
  },
  {
    id: 'encrypt',
    icon: Lock,
    title: '本地加密',
    description: '使用AES-256加密算法保护数据',
    status: 'pending',
  },
  {
    id: 'analyze',
    icon: Shield,
    title: 'AI分析',
    description: '提取性格特征与语言模式',
    status: 'pending',
  },
  {
    id: 'cleanup',
    icon: Trash2,
    title: '安全清除',
    description: '原始数据阅后即焚，仅保留分析结果',
    status: 'pending',
  },
];

export default function PrivacyVisualizer({ 
  isProcessing: externalProcessing,
  onComplete,
  autoStart = false 
}: PrivacyVisualizerProps) {
  const [steps, setSteps] = useState<ProcessingStep[]>(DEFAULT_STEPS);
  const [isProcessing, setIsProcessing] = useState(autoStart);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (externalProcessing !== undefined) {
      setIsProcessing(externalProcessing);
    }
  }, [externalProcessing]);

  useEffect(() => {
    if (!isProcessing || isComplete) return;

    let currentIndex = 0;

    const processStep = () => {
      if (currentIndex >= steps.length) {
        setIsComplete(true);
        onComplete?.();
        return;
      }

      // 更新当前步骤为处理中
      setSteps(prev => prev.map((step, i) => 
        i === currentIndex ? { ...step, status: 'processing' as const, progress: 0 } : step
      ));

      // 模拟进度
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 30 + 10;
        if (progress >= 100) {
          progress = 100;
          clearInterval(progressInterval);
          
          // 完成当前步骤，进入下一步
          setSteps(prev => prev.map((step, i) => 
            i === currentIndex ? { ...step, status: 'complete' as const, progress: 100 } : step
          ));
          
          currentIndex++;
          setTimeout(processStep, 300);
        } else {
          setSteps(prev => prev.map((step, i) => 
            i === currentIndex ? { ...step, progress } : step
          ));
        }
      }, 150);
    };

    processStep();
  }, [isProcessing, isComplete, onComplete]);

  const startProcessing = () => {
    setIsProcessing(true);
    setIsComplete(false);
    setSteps(DEFAULT_STEPS.map(s => ({ ...s, status: 'pending' as const, progress: 0 })));
  };

  return (
    <div className="space-y-4">
      {/* 步骤列表 */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isLast = index === steps.length - 1;
          const isActive = step.status === 'processing';
          const isDone = step.status === 'complete';

          return (
            <div key={step.id} className="relative">
              {/* 连接线 */}
              {!isLast && (
                <div 
                  className={`absolute left-[18px] top-full w-0.5 h-3 transition-colors ${
                    isDone ? 'bg-mint-400' : 'bg-ink-200'
                  }`}
                />
              )}

              <div className="flex items-start gap-3">
                {/* 图标 */}
                <div 
                  className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    isDone 
                      ? 'bg-gradient-to-br from-mint-400 to-mint-500 text-white shadow-soft'
                      : isActive
                        ? 'bg-gradient-to-br from-iris-500 to-rose-400 text-white shadow-soft animate-pulse'
                        : 'bg-ink-100 text-ink-900/40'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 size={18} />
                  ) : isActive ? (
                    <Icon size={18} className="animate-pulse" />
                  ) : (
                    <Icon size={18} />
                  )}

                  {/* 进度环 */}
                  {isActive && step.progress !== undefined && (
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        stroke="rgba(255,255,255,0.3)"
                        strokeWidth="2"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeDasharray={`${(step.progress / 100) * 100} 100`}
                        className="transition-all duration-150"
                      />
                    </svg>
                  )}
                </div>

                {/* 内容 */}
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${
                      isDone || isActive ? 'text-ink-900' : 'text-ink-900/40'
                    }`}>
                      {step.title}
                    </span>
                    {isActive && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-iris-100 text-iris-600">
                        {Math.round(step.progress || 0)}%
                      </span>
                    )}
                    {isDone && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-mint-100 text-mint-600">
                        完成
                      </span>
                    )}
                  </div>
                  <p className={`text-xs mt-0.5 ${
                    isDone || isActive ? 'text-ink-900/60' : 'text-ink-900/30'
                  }`}>
                    {step.description}
                  </p>

                  {/* 进度条 */}
                  {isActive && step.progress !== undefined && (
                    <div className="mt-2 h-1.5 bg-iris-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-iris-500 to-rose-400 rounded-full transition-all duration-150"
                        style={{ width: `${step.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 完成状态 */}
      {isComplete && (
        <div className="p-4 rounded-2xl bg-gradient-to-br from-mint-50/80 to-iris-50/80 border border-mint-200/50 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-mint-400 to-mint-500 flex items-center justify-center shadow-soft">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <p className="font-medium text-mint-700">处理完成</p>
              <p className="text-xs text-mint-600/80">您的数据已安全处理，原始文件已清除</p>
            </div>
          </div>
        </div>
      )}

      {/* 手动触发按钮 */}
      {!isProcessing && !isComplete && (
        <button
          onClick={startProcessing}
          className="w-full py-2.5 rounded-xl border-2 border-dashed border-iris-200 text-iris-600 text-sm font-medium hover:border-iris-400 hover:bg-iris-50/30 transition flex items-center justify-center gap-2"
        >
          <Sparkles size={16} />
          预览处理流程
        </button>
      )}
    </div>
  );
}

// 简化版本 - 用于内联展示
export function PrivacyIndicator({ showDetails = false }: { showDetails?: boolean }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-mint-50 border border-mint-200/50">
        <Shield size={12} className="text-mint-600" />
        <span className="text-[10px] text-mint-700 font-medium">隐私保护中</span>
      </div>

      {/* 悬停详情 */}
      {showDetails && isHovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-white rounded-xl shadow-lg border border-ink-100 animate-fade-in">
          <div className="text-xs space-y-2">
            <div className="flex items-center gap-2 text-ink-900">
              <CheckCircle2 size={14} className="text-mint-500" />
              <span>端到端加密传输</span>
            </div>
            <div className="flex items-center gap-2 text-ink-900">
              <CheckCircle2 size={14} className="text-mint-500" />
              <span>本地处理，不上传云端</span>
            </div>
            <div className="flex items-center gap-2 text-ink-900">
              <CheckCircle2 size={14} className="text-mint-500" />
              <span>阅后即焚，数据可控</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-white border-r border-b border-ink-100" />
        </div>
      )}
    </div>
  );
}
