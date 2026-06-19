import { useState, useCallback, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Pause, Play } from 'lucide-react';
import { voiceService } from '@/services/voice';
import { useUIStore } from '@/store/uiStore';
import { useUserStore } from '@/store/userStore';

interface VoiceOutputProps {
  text: string;
  autoPlay?: boolean;
  onEnd?: () => void;
  voiceId?: string;
}

export default function VoiceOutput({ text, autoPlay = false, onEnd, voiceId }: VoiceOutputProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const addToast = useUIStore((s) => s.addToast);
  const voiceSettings = useUserStore((s) => s.settings.voice);
  const [useExternal, setUseExternal] = useState(false);

  // 使用 ref 跟踪组件挂载状态和取消控制器
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    setIsSupported(voiceService.isSynthesisSupported());
    setUseExternal(voiceService.isExternalVoiceAvailable());

    return () => {
      isMountedRef.current = false;
      // 清理：停止语音播放
      voiceService.stopSpeaking();
      // 取消任何进行中的异步请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  // 自动播放逻辑
  useEffect(() => {
    if (autoPlay && text && !isPlaying && !isPaused) {
      handlePlay();
    }
  }, [autoPlay, text]); // 移除 isPlaying, isPaused 依赖，避免循环

  const handlePlay = useCallback(async () => {
    if (!isSupported) {
      addToast('error', '当前浏览器不支持语音合成');
      return;
    }

    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsPlaying(true);
    setIsPaused(false);

    try {
      if (useExternal) {
        await voiceService.speakWithMinimax(text, {
          lang: 'zh-CN',
          rate: voiceSettings.rate,
          pitch: 1,
          volume: voiceSettings.volume,
          voiceId: voiceId,
        });
      } else {
        await voiceService.speak(text, {
          lang: 'zh-CN',
          rate: voiceSettings.rate,
          pitch: 1,
          volume: voiceSettings.volume,
        });
      }

      // 检查组件是否仍然挂载
      if (isMountedRef.current) {
        setIsPlaying(false);
        onEnd?.();
      }
    } catch (error) {
      // 忽略取消错误
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      if (isMountedRef.current) {
        if (useExternal) {
          addToast('info', '外部语音服务不可用，已切换至本地语音');
          try {
            await voiceService.speak(text, {
              lang: 'zh-CN',
              rate: voiceSettings.rate,
              pitch: 1,
              volume: voiceSettings.volume,
            });
          } catch {
            if (isMountedRef.current) {
              addToast('error', '语音播放失败');
            }
          }
        } else {
          addToast('error', error instanceof Error ? error.message : String(error));
        }
        setIsPlaying(false);
      }
    }
  }, [isSupported, text, addToast, onEnd, voiceSettings, useExternal, voiceId]);

  const handlePause = useCallback(() => {
    voiceService.stopSpeaking();
    setIsPaused(true);
    setIsPlaying(false);
  }, []);

  if (!isSupported) {
    return null;
  }

  return (
    <button
      onClick={isPlaying ? handlePause : handlePlay}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
        isPlaying
          ? 'bg-coral-400/10 text-coral-500'
          : 'bg-mint-400/10 text-mint-500 hover:bg-mint-400/20'
      }`}
    >
      {isPlaying ? (
        <Pause size={14} />
      ) : isPaused ? (
        <Play size={14} />
      ) : (
        <Volume2 size={14} />
      )}
      <span className="text-[10px] font-medium">
        {isPlaying ? '暂停' : isPaused ? '继续' : '朗读'}
      </span>
    </button>
  );
}