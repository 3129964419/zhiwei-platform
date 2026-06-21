import { useState, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  isTyping?: boolean;
}

const demoResponses = [
  {
    userInput: '你好',
    assistantResponse: '你好呀！我是智微AI，很高兴认识你😊 我可以帮你复刻你的语言风格和情感，创建专属的AI分身。想了解更多吗？',
  },
  {
    userInput: '什么是情感复刻？',
    assistantResponse: '情感复刻是我们的核心技术，通过分析你的聊天记录、语音语调、表达方式等，AI可以学习并模仿你的情感风格，让AI分身拥有与你相似的"灵魂"✨',
  },
  {
    userInput: '安全吗？',
    assistantResponse: '绝对安全！我们采用端到端加密技术，你的数据仅在本地处理，不会上传到云端存储。而且支持"阅后即焚"模式，让你完全掌控自己的隐私🔒',
  },
  {
    userInput: '怎么开始？',
    assistantResponse: '只需3分钟！上传一些聊天记录或语音，AI自动分析学习，然后你就可以拥有一个与你情感相似的AI分身了。现在就来试试吧🚀',
  },
];

export default function DemoChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'assistant',
      content: '你好！我是智微AI，你的专属情感复刻助手😊 我们可以先聊几句，感受一下我的陪伴~',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showDemo, setShowDemo] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowDemo(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleSend = () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage: Message = {
      id: messages.length + 1,
      role: 'user',
      content: inputValue.trim(),
    };
    setMessages([...messages, userMessage]);
    setInputValue('');
    setIsTyping(true);

    const matchedResponse = demoResponses.find(
      (r) =>
        inputValue.toLowerCase().includes(r.userInput.toLowerCase()) ||
        r.userInput.toLowerCase().includes(inputValue.toLowerCase())
    );

    setTimeout(() => {
      const assistantMessage: Message = {
        id: messages.length + 2,
        role: 'assistant',
        content:
          matchedResponse?.assistantResponse ||
          '谢谢你的提问！这是一个很好的问题。要了解更多细节，欢迎注册体验完整功能~',
      };
      setMessages([...messages, userMessage, assistantMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="mt-8 sm:mt-12">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-2">
          <Sparkles size={14} className="text-iris-500" />
          <span className="text-xs font-medium text-ink-900/80">体验AI对话</span>
        </div>
        <h3 className="font-display text-lg sm:text-xl font-semibold text-ink-900">
          无需注册，直接体验
        </h3>
        <p className="text-xs sm:text-sm text-ink-900/50 mt-1">
          感受AI的情感陪伴能力
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-ink-100/50 overflow-hidden">
          {/* 聊天头部 */}
          <div className="px-4 py-3 bg-gradient-to-r from-iris-500/10 to-rose-400/10 border-b border-ink-100/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-iris-500 to-rose-400 flex items-center justify-center">
                <Bot size={16} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-ink-900">智微AI</p>
                <p className="text-[10px] text-ink-900/50 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-mint-400 animate-pulse" />
                  在线
                </p>
              </div>
              {showDemo && (
                <div className="ml-auto px-3 py-1 rounded-full bg-amber-100 text-amber-600 text-xs animate-pulse">
                  演示模式
                </div>
              )}
            </div>
          </div>

          {/* 聊天内容 */}
          <div className="h-64 sm:h-80 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-iris-500 to-rose-400'
                      : 'bg-ink-100'
                  }`}
                >
                  {message.role === 'user' ? (
                    <User size={12} className="text-white" />
                  ) : (
                    <Bot size={12} className="text-iris-500" />
                  )}
                </div>
                <div
                  className={`max-w-[75%] ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-iris-500 to-rose-400 text-white rounded-2xl rounded-br-md'
                      : 'bg-ink-100 text-ink-900 rounded-2xl rounded-bl-md'
                  } px-4 py-2.5 text-sm leading-relaxed`}
                >
                  {message.isTyping ? (
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-ink-400 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-ink-400 animate-bounce delay-75" />
                      <span className="w-1.5 h-1.5 rounded-full bg-ink-400 animate-bounce delay-150" />
                    </div>
                  ) : (
                    message.content
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-ink-100 flex-shrink-0 flex items-center justify-center">
                  <Bot size={12} className="text-iris-500" />
                </div>
                <div className="bg-ink-100 text-ink-900 rounded-2xl rounded-bl-md px-4 py-2.5">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-ink-400 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-ink-400 animate-bounce delay-75" />
                    <span className="w-1.5 h-1.5 rounded-full bg-ink-400 animate-bounce delay-150" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 输入框 */}
          <div className="px-4 py-3 bg-ink-50/50 border-t border-ink-100/50">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入消息，体验AI对话..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-ink-200 focus:border-iris-400 focus:ring-2 focus:ring-iris-400/20 outline-none text-sm transition-all"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isTyping}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-iris-500 to-rose-400 text-white hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="text-[10px] text-ink-900/40 text-center mt-2">
              提示：试试问"什么是情感复刻？"或"安全吗？"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}