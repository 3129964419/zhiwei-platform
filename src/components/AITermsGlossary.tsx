import { useState } from 'react';
import { Sparkles, HelpCircle, X } from 'lucide-react';

interface Term {
  term: string;
  definition: string;
  example?: string;
}

const aiTerms: Term[] = [
  {
    term: '智能体 (Agent)',
    definition: '一种能够自主理解、规划、执行任务的AI程序。它可以像人一样思考和决策，完成复杂的工作流程。',
    example: '例如：AI客服、AI助手、AI写作机器人等',
  },
  {
    term: '情感复刻',
    definition: '通过分析目标人物的语言风格、表达习惯、思维方式等特征，创建一个具有相似"人格"的AI分身。',
    example: '复刻你的说话风格，创建一个24小时陪伴你的AI分身',
  },
  {
    term: '大语言模型 (LLM)',
    definition: '基于海量数据训练的人工智能模型，能够理解和生成人类语言，是智能体的"大脑"。',
    example: 'GPT、Claude、智谱等都是大语言模型',
  },
  {
    term: '提示词 (Prompt)',
    definition: '用户向AI发送的指令或问题，好的提示词能让AI更准确地理解需求并给出更好的回答。',
    example: '"请用专业但亲切的语气写一封道歉邮件"',
  },
  {
    term: 'RAG (检索增强生成)',
    definition: '让AI能够"阅读"你提供的文档或资料，然后基于这些内容回答问题。',
    example: '上传一份产品手册，AI就能回答关于产品的任何问题',
  },
  {
    term: '记忆 (Memory)',
    definition: '智能体记住对话内容和用户信息的能力，让它能够进行连续对话，像老朋友一样了解你。',
    example: '记住你喜欢的咖啡口味，下次直接推荐',
  },
];

export default function AITermsGlossary() {
  const [showGlossary, setShowGlossary] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);

  return (
    <>
      <button
        onClick={() => setShowGlossary(true)}
        className="fixed bottom-20 right-6 z-40 w-12 h-12 rounded-full bg-gradient-to-br from-iris-500 to-rose-400 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center"
        title="AI术语解释"
      >
        <HelpCircle size={20} />
      </button>

      {showGlossary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm"
            onClick={() => setShowGlossary(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-ink-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-iris-500 to-rose-400 flex items-center justify-center text-white">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h2 className="font-display text-xl font-semibold text-ink-900">AI术语解释</h2>
                  <p className="text-xs text-ink-900/50">点击术语查看详细说明</p>
                </div>
              </div>
              <button
                onClick={() => setShowGlossary(false)}
                className="w-8 h-8 rounded-full bg-ink-100 flex items-center justify-center text-ink-900/60 hover:bg-ink-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              <div className="grid gap-4">
                {aiTerms.map((term, index) => (
                  <div
                    key={index}
                    className="bg-ink-50/50 rounded-2xl p-4 hover:bg-iris-50/30 transition-colors cursor-pointer border border-transparent hover:border-iris-500/20"
                    onClick={() => setSelectedTerm(term)}
                  >
                    <h3 className="font-medium text-ink-900 mb-1">{term.term}</h3>
                    <p className="text-sm text-ink-900/60 line-clamp-2">{term.definition}</p>
                  </div>
                ))}
              </div>
            </div>

            {selectedTerm && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-xl font-semibold text-ink-900">
                      {selectedTerm.term}
                    </h3>
                    <button
                      onClick={() => setSelectedTerm(null)}
                      className="w-8 h-8 rounded-full bg-ink-100 flex items-center justify-center text-ink-900/60 hover:bg-ink-200 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <p className="text-sm text-ink-900/80 leading-relaxed mb-4">
                    {selectedTerm.definition}
                  </p>
                  {selectedTerm.example && (
                    <div className="bg-iris-50/50 rounded-xl p-4">
                      <p className="text-xs text-iris-600 font-medium mb-1">💡 举例</p>
                      <p className="text-sm text-iris-700">{selectedTerm.example}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}