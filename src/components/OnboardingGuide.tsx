import { useState } from 'react';
import { Sparkles, Heart, MessageCircle, Shield, ArrowRight, X } from 'lucide-react';

interface OnboardingGuideProps {
  onComplete: () => void;
}

const steps = [
  {
    icon: Sparkles,
    title: '欢迎来到智微',
    description: 'AI 驱动的对话角色复刻平台，让 AI 复刻陪伴你的每一段关系',
    gradient: 'from-iris-500 to-rose-400',
  },
  {
    icon: Heart,
    title: '创建你的智能体',
    description: '选择性格、设定关系、定义互动方式，AI 会根据你的设定生成独一无二的陪伴伙伴',
    gradient: 'from-rose-400 to-peach-400',
  },
  {
    icon: MessageCircle,
    title: '开始对话',
    description: '与智能体进行自然对话，TA 会记住你们的每一次交流，越来越懂你',
    gradient: 'from-mint-400 to-iris-500',
  },
  {
    icon: Shield,
    title: '隐私安全',
    description: '你的对话数据仅存储在本地，我们承诺不会用于任何商业目的',
    gradient: 'from-iris-500 to-ink-900',
  },
];

export default function OnboardingGuide({ onComplete }: OnboardingGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = steps[currentStep];
  const Icon = step.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-white rounded-4xl shadow-glow overflow-hidden">
        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-ink-50 hover:bg-ink-100 flex items-center justify-center text-ink-900/50 hover:text-ink-900 transition"
        >
          <X size={16} />
        </button>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 pt-8 pb-4">
          {steps.map((_, index) => (
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

        {/* Content */}
        <div className="px-8 pb-8 text-center">
          <div
            className={`w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center bg-gradient-to-br ${step.gradient} shadow-soft`}
          >
            <Icon size={36} className="text-white" />
          </div>

          <h2 className="font-display text-2xl font-semibold text-ink-900 mb-3">
            {step.title}
          </h2>
          <p className="text-ink-900/60 leading-relaxed mb-8">
            {step.description}
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex-1 py-3 rounded-full border border-ink-200 text-ink-900 font-medium hover:bg-ink-50 transition"
              >
                上一步
              </button>
            )}
            <button
              onClick={handleNext}
              className={`flex-1 py-3 rounded-full bg-gradient-to-r from-iris-500 to-rose-400 text-white font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 ${
                currentStep === 0 ? 'w-full' : ''
              }`}
            >
              {currentStep === steps.length - 1 ? (
                '开始使用'
              ) : (
                <>
                  下一步
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bottom decoration */}
        <div className="h-1 bg-gradient-to-r from-iris-500 via-rose-400 to-peach-400" />
      </div>
    </div>
  );
}
