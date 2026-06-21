import { useState, useEffect } from 'react';
import { Sparkles, X, ChevronRight, BookOpen, MessageSquare, Users, Wand2 } from 'lucide-react';

interface GuideStep {
  target: string;
  title: string;
  description: string;
  icon: React.ElementType;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const guideSteps: GuideStep[] = [
  {
    target: 'logo',
    title: '欢迎使用智微AI',
    description: '这里是您的AI智能助手平台，让我们快速了解主要功能',
    icon: Sparkles,
    position: 'bottom',
  },
  {
    target: 'nav-dashboard',
    title: 'AI对话',
    description: '与AI进行自然对话，获取智能问答和创作辅助',
    icon: MessageSquare,
    position: 'bottom',
  },
  {
    target: 'nav-agents',
    title: '智能体管理',
    description: '创建、编辑和管理您的专属AI智能体',
    icon: Users,
    position: 'bottom',
  },
  {
    target: 'nav-create',
    title: '智能复刻',
    description: '快速复刻一个AI分身，复制您的语言风格和思维方式',
    icon: Wand2,
    position: 'right',
  },
  {
    target: 'help-button',
    title: 'AI术语解释',
    description: '点击这里查看AI相关术语的详细解释',
    icon: BookOpen,
    position: 'left',
  },
];

export default function NewUserGuide() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('hasSeenGuide');
    if (!hasSeenGuide) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('hasSeenGuide', 'true');
  };

  const handleNext = () => {
    if (currentStep < guideSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handleSkip = () => {
    handleClose();
  };

  if (!isVisible) return null;

  const currentStepData = guideSteps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <div className="fixed inset-0 z-50">
      {/* 半透明遮罩 */}
      <div className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm" />

      {/* 引导卡片 */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden animate-fadeIn">
          {/* 头部 */}
          <div className="bg-gradient-to-r from-iris-500 to-rose-400 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Icon size={24} />
                </div>
                <div>
                  <p className="text-xs opacity-80">新手引导</p>
                  <h3 className="font-display text-xl font-semibold">{currentStepData.title}</h3>
                </div>
              </div>
              <button
                onClick={handleSkip}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-sm opacity-90 leading-relaxed">
              {currentStepData.description}
            </p>
          </div>

          {/* 步骤指示器 */}
          <div className="flex items-center justify-center gap-2 p-4 bg-ink-50/50">
            {guideSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-6 bg-gradient-to-r from-iris-500 to-rose-400'
                    : index < currentStep
                    ? 'bg-iris-500'
                    : 'bg-ink-200'
                }`}
              />
            ))}
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3 p-4">
            <button
              onClick={handleSkip}
              className="flex-1 py-2.5 rounded-xl text-ink-900/60 hover:bg-ink-50 transition font-medium"
            >
              跳过
            </button>
            <button
              onClick={handleNext}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-iris-500 to-rose-400 text-white font-medium hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              {currentStep < guideSteps.length - 1 ? (
                <>
                  下一步
                  <ChevronRight size={16} />
                </>
              ) : (
                '开始体验'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 跳过提示 */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-xs">
        按 ESC 键也可关闭引导
      </div>
    </div>
  );
}