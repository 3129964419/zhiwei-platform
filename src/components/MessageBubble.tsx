import type { Message } from '@/types';
import { formatTime } from '@/utils/format';
import { stickerCategories } from '@/data/stickers';
import { CheckCheck, Check, Volume2 } from 'lucide-react';
import VoiceOutput from './VoiceOutput';
import { useUserStore } from '@/store/userStore';

interface MessageBubbleProps {
  message: Message;
  agentAvatar?: string;
  agentGradient?: [string, string];
  isRead?: boolean;
  voiceId?: string;
}

export default function MessageBubble({ message, agentAvatar, agentGradient, isRead = true, voiceId }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const voiceSettings = useUserStore((s) => s.settings.voice);

  if (message.type === 'sticker') {
    const category = stickerCategories.find((c) =>
      c.items.some((i) => i.emoji === message.content)
    );
    const item = category?.items.find((i) => i.emoji === message.content);
    return (
      <div className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
        {!isUser && agentAvatar && (
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-semibold shrink-0"
            style={{
              background: `linear-gradient(135deg, ${agentGradient?.[0] || '#7C5CFF'}, ${agentGradient?.[1] || '#FF8FB1'})`,
            }}
          >
            {agentAvatar}
          </div>
        )}
        <div
          className="rounded-3xl px-2 py-2 shadow-soft"
          style={{
            background: item
              ? `linear-gradient(135deg, ${item.gradient[0]}40, ${item.gradient[1]}40)`
              : 'rgba(255, 255, 255, 0.6)',
            fontSize: 48,
            lineHeight: 1,
            width: 80,
            height: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {message.content}
        </div>
        {isUser && (
          <div className="w-8 h-8 rounded-xl bg-ink-900 flex items-center justify-center text-white text-sm font-semibold shrink-0">
            我
          </div>
        )}
        <div className="flex flex-col justify-end">
          <span className="text-[10px] text-ink-900/40">{formatTime(message.timestamp)}</span>
          {isUser && (
            <div className="flex items-center justify-end mt-0.5">
              {isRead ? (
                <CheckCheck size={10} className="text-iris-500" />
              ) : (
                <Check size={10} className="text-ink-900/30" />
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      {!isUser && agentAvatar && (
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-semibold shrink-0"
          style={{
            background: `linear-gradient(135deg, ${agentGradient?.[0] || '#7C5CFF'}, ${agentGradient?.[1] || '#FF8FB1'})`,
          }}
        >
          {agentAvatar}
        </div>
      )}
      <div className={`${isUser ? 'bubble-user' : 'bubble-agent'} relative`}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {message.content}
        </p>
        <div className={`flex items-center justify-end gap-1 mt-1 ${isUser ? 'text-ink-900/40' : 'text-ink-900/30'}`}>
          <span className="text-[10px]">{formatTime(message.timestamp)}</span>
          {!isUser && <VoiceOutput text={message.content} autoPlay={voiceSettings.autoPlay} voiceId={voiceId} />}
          {isUser && (
            isRead ? (
              <CheckCheck size={10} className="text-iris-500" />
            ) : (
              <Check size={10} />
            )
          )}
        </div>
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-ink-900 flex items-center justify-center text-white text-sm font-semibold shrink-0">
          我
        </div>
      )}
    </div>
  );
}
