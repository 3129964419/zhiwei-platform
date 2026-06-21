import { useState, useRef } from 'react';
import { Send, Smile } from 'lucide-react';
import { stickerCategories, detectStickerMood } from '@/data/stickers';
import VoiceInput from './VoiceInput';

interface ChatInputProps {
  onSend: (content: string, type: 'text' | 'sticker' | 'voice') => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({ onSend, disabled, placeholder = '说点什么吧...' }: ChatInputProps) {
  const [text, setText] = useState('');
  const [stickerPanelOpen, setStickerPanelOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(stickerCategories[0].id);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text.trim(), 'text');
    setText('');
    textareaRef.current?.focus();
  };

  const handleStickerClick = (emoji: string) => {
    onSend(emoji, 'sticker');
    setStickerPanelOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const currentCategory =
    stickerCategories.find((c) => c.id === activeCategory) || stickerCategories[0];

  return (
    <div className="relative">
      {stickerPanelOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setStickerPanelOpen(false)}
          />
          <div className="absolute bottom-full left-0 right-0 mb-2 z-40 glass rounded-3xl shadow-card p-4">
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
              {stickerCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                    activeCategory === cat.id
                      ? 'bg-gradient-to-r from-iris-500 to-rose-400 text-white shadow-soft'
                      : 'bg-ink-100 text-ink-900/70 hover:bg-ink-200'
                  }`}
                >
                  <span className="text-sm">{cat.emoji}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 max-h-64 overflow-y-auto">
              {currentCategory.items.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleStickerClick(item.emoji)}
                  className="aspect-square rounded-2xl flex items-center justify-center text-3xl hover:scale-110 transition"
                  style={{
                    background: `linear-gradient(135deg, ${item.gradient[0]}50, ${item.gradient[1]}50)`,
                  }}
                >
                  {item.emoji}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-ink-900/40 text-center mt-3">
              智能推荐：检测到你的对话情绪
            </p>
          </div>
        </>
      )}

      <div className="glass rounded-3xl p-2 flex items-end gap-2">
        <button
          onClick={() => setStickerPanelOpen(!stickerPanelOpen)}
          className="w-9 h-9 rounded-2xl flex items-center justify-center hover:bg-iris-50 text-ink-900/60 hover:text-iris-500 transition shrink-0"
          aria-label="表情包"
        >
          <Smile size={20} />
        </button>

        <VoiceInput onResult={(text) => onSend(text, 'voice')} />

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent border-0 outline-none resize-none px-2 py-2 text-sm text-ink-900 placeholder:text-ink-900/40 max-h-32"
        />

        <button
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          className="w-9 h-9 rounded-2xl flex items-center justify-center bg-gradient-to-br from-iris-500 to-rose-400 text-white shadow-soft hover:shadow-glow transition shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="发送"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
