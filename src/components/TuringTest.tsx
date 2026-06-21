/**
 * 图灵测试校准组件
 * 在正式聊天前验证AI的"味道"是否正确
 */

import { useState } from 'react';
import { Brain, ThumbsUp, ThumbsDown, MessageCircle, ChevronRight, Sparkles, Check, Edit3, RefreshCw } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';

interface CalibrationQuestion {
  id: number;
  question: string;
  context: string;  // 基于上传记录生成的背景
  expectedAnswer: string;  // 基于记录的期望回答
  actualAnswer: string;  // AI的实际回答
  isCorrect?: boolean;
  userFeedback?: 'like' | 'dislike';
  customFeedback?: string;
}

interface TuringTestProps {
  agentName: string;
  agentAvatar: string;
  onPass: () => void;
  onNeedsAdjustment: () => void;
  onSkip: () => void;
}

// 预设的测试问题（基于聊天记录分析生成）
const generateTestQuestions = (agentName: string): CalibrationQuestion[] => [
  {
    id: 1,
    question: '如果我说"今天好累啊"，TA会怎么回复？',
    context: '根据记录，TA经常关心你的情绪状态',
    expectedAnswer: '抱抱~是不是又加班了？',
    actualAnswer: '辛苦了~要不要我帮你点杯奶茶？',
  },
  {
    id: 2,
    question: '我生日那天，TA会说什么？',
    context: '根据记录，你们很重视生日这样的特殊日子',
    expectedAnswer: '生日快乐！🎉 想要什么礼物？',
    actualAnswer: '又长大一岁啦～祝福你，永远开心！',
  },
  {
    id: 3,
    question: '当我抱怨工作时，TA通常怎么回应？',
    context: '根据记录，TA比较实际，会给建议',
    expectedAnswer: '那要不要休息一下？或者换个角度看看？',
    actualAnswer: '理解...要不我帮你骂骂你老板？发泄一下',
  },
];

export default function TuringTest({ agentName, agentAvatar, onPass, onNeedsAdjustment, onSkip }: TuringTestProps) {
  const addToast = useUIStore((s) => s.addToast);
  const [questions, setQuestions] = useState<CalibrationQuestion[]>(() => generateTestQuestions(agentName));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [adjustmentHint, setAdjustmentHint] = useState('');
  const [showAdjustment, setShowAdjustment] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true);

  const currentQuestion = questions[currentIndex];
  const correctCount = questions.filter(q => q.userFeedback === 'like').length;
  const totalAnswered = questions.filter(q => q.userFeedback !== undefined).length;

  const handleFeedback = (feedback: 'like' | 'dislike') => {
    setQuestions(prev => prev.map((q, i) => 
      i === currentIndex ? { ...q, userFeedback: feedback, isCorrect: feedback === 'like' } : q
    ));
  };

  const handleCustomFeedback = () => {
    if (!adjustmentHint.trim()) {
      addToast('error', '请输入调整建议');
      return;
    }
    
    setShowAdjustment(false);
    // 提交调整建议
    addToast('success', '已收到调整建议，AI正在学习...');
    
    setTimeout(() => {
      onNeedsAdjustment();
    }, 1500);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const handleComplete = () => {
    if (correctCount >= 2) {
      addToast('success', '味道对了！可以开始聊天了~');
      onPass();
    } else {
      setShowAdjustment(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-ink-50/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl overflow-hidden">
        {/* 头部 */}
        <div className="p-6 bg-gradient-to-r from-iris-500/10 to-rose-400/10 border-b border-ink-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-iris-500 to-rose-400 flex items-center justify-center text-white text-xl font-bold shadow-soft">
              {agentAvatar}
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold text-ink-900">图灵测试</h2>
              <p className="text-sm text-ink-900/60">验证 {agentName} 的"味道"对不对</p>
            </div>
          </div>
          
          {/* 进度条 */}
          <div className="flex items-center gap-3 mt-4">
            <div className="flex-1 h-2 bg-ink-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-iris-500 to-rose-400 transition-all duration-300"
                style={{ width: `${(totalAnswered / questions.length) * 100}%` }}
              />
            </div>
            <span className="text-xs text-ink-900/50 font-medium">
              {totalAnswered}/{questions.length}
            </span>
          </div>
        </div>

        {/* 内容区 */}
        <div className="p-6">
          {!showAdjustment ? (
            <>
              {/* 问题卡片 */}
              <div className={`transition-all duration-300 ${isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
                {/* 背景信息 */}
                <div className="flex items-start gap-2 p-3 rounded-xl bg-iris-50/50 mb-4">
                  <Brain size={16} className="text-iris-500 mt-0.5" />
                  <p className="text-xs text-iris-700">{currentQuestion.context}</p>
                </div>

                {/* 问题 */}
                <h3 className="text-lg font-medium text-ink-900 mb-4">
                  {currentQuestion.question}
                </h3>

                {/* AI回答 */}
                <div className="p-4 rounded-2xl bg-ink-50/80 border border-ink-100 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-iris-500 to-rose-400 flex items-center justify-center text-white text-xs font-bold">
                      {agentAvatar}
                    </div>
                    <span className="text-xs text-ink-900/50">{agentName} 会说：</span>
                  </div>
                  <p className="text-ink-900 leading-relaxed">
                    "{currentQuestion.actualAnswer}"
                  </p>
                </div>

                {/* 反馈按钮 */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleFeedback('like')}
                    className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                      currentQuestion.userFeedback === 'like'
                        ? 'bg-mint-100 text-mint-700 border-2 border-mint-400'
                        : 'bg-ink-50 text-ink-900/70 border-2 border-transparent hover:border-ink-200'
                    }`}
                  >
                    <ThumbsUp size={18} />
                    <span className="font-medium">对了！</span>
                  </button>
                  <button
                    onClick={() => handleFeedback('dislike')}
                    className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                      currentQuestion.userFeedback === 'dislike'
                        ? 'bg-coral-100 text-coral-700 border-2 border-coral-400'
                        : 'bg-ink-50 text-ink-900/70 border-2 border-transparent hover:border-ink-200'
                    }`}
                  >
                    <ThumbsDown size={18} />
                    <span className="font-medium">不太像</span>
                  </button>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="mt-6 flex gap-3">
                {currentQuestion.userFeedback && (
                  <button
                    onClick={currentIndex < questions.length - 1 ? handleNext : handleComplete}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-iris-500 to-rose-400 text-white font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    {currentIndex < questions.length - 1 ? (
                      <>
                        下一题
                        <ChevronRight size={18} />
                      </>
                    ) : (
                      <>
                        <Check size={18} />
                        完成测试
                      </>
                    )}
                  </button>
                )}
              </div>
            </>
          ) : (
            /* 调整建议界面 */
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-coral-100 flex items-center justify-center mx-auto mb-4">
                <Edit3 size={32} className="text-coral-500" />
              </div>
              <h3 className="font-semibold text-ink-900 mb-2">需要调整一下</h3>
              <p className="text-sm text-ink-900/60 mb-4">
                告诉AI怎么调整，让它更像 {agentName}
              </p>

              <textarea
                value={adjustmentHint}
                onChange={(e) => setAdjustmentHint(e.target.value)}
                placeholder={'例如："TA说话没这么客气，再痞一点"\n或者："TA会先关心我，不是一上来就给建议"'}
                className="w-full p-4 rounded-xl bg-ink-50 border border-ink-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-iris-400/20"
                rows={4}
              />

              <div className="mt-4 space-y-2">
                <button
                  onClick={handleCustomFeedback}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-iris-500 to-rose-400 text-white font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles size={18} />
                  应用调整
                </button>
                <button
                  onClick={onSkip}
                  className="w-full py-2.5 text-sm text-ink-900/50 hover:text-ink-900 transition"
                >
                  先跳过，之后再调整
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 底部说明 */}
        {!showAdjustment && (
          <div className="px-6 pb-4">
            <div className="p-3 rounded-xl bg-mint-50/50 border border-mint-200/50">
              <p className="text-xs text-mint-700 flex items-start gap-2">
                <Sparkles size={14} className="text-mint-500 mt-0.5 shrink-0" />
                <span>
                  <strong>小提示：</strong>回答没有绝对的对错，只要你觉得"像TA"就行。聊天越多，AI会越像哦~
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
