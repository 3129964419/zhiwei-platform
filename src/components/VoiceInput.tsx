import { useState, useCallback, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Loader2 } from 'lucide-react';
import { voiceService } from '@/services/voice';
import { useUIStore } from '@/store/uiStore';

interface VoiceInputProps {
  onResult: (text: string) => void;
  placeholder?: string;
}

export default function VoiceInput({ onResult, placeholder = '按住说话' }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const addToast = useUIStore((s) => s.addToast);

  // 使用 ref 跟踪组件挂载状态和处理状态
  const isMountedRef = useRef(true);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    setIsSupported(voiceService.isRecognitionSupported());

    return () => {
      isMountedRef.current = false;
      voiceService.stopListening();
    };
  }, []);

  const handleStart = useCallback(() => {
    if (!isSupported) {
      addToast('error', '当前浏览器不支持语音识别');
      return;
    }

    // 重置状态
    setErrorMessage(null);
    setIsRecording(true);
    setTranscript('');
    isProcessingRef.current = false;

    try {
      voiceService.startListening(
        { lang: 'zh-CN' },
        {
          onResult: (result) => {
            if (!isMountedRef.current) return;

            setTranscript(result.transcript);
            if (result.isFinal) {
              isProcessingRef.current = true;
              setIsProcessing(true);

              setTimeout(() => {
                if (!isMountedRef.current) return;

                if (result.transcript.trim()) {
                  onResult(result.transcript.trim());
                }
                setIsProcessing(false);
                setIsRecording(false);
                setTranscript('');
                isProcessingRef.current = false;
              }, 500);
            }
          },
          onError: (error) => {
            if (!isMountedRef.current) return;

            const errorMsg = error instanceof Error ? error.message : String(error);

            // 根据错误类型提供更友好的提示
            let friendlyMsg = errorMsg;
            if (errorMsg.includes('not-allowed') || errorMsg.includes('permission')) {
              friendlyMsg = '请允许麦克风权限后重试';
            } else if (errorMsg.includes('no-speech')) {
              friendlyMsg = '未检测到语音，请重试';
            } else if (errorMsg.includes('network')) {
              friendlyMsg = '网络错误，请检查网络连接';
            } else if (errorMsg.includes('aborted')) {
              friendlyMsg = '语音识别已取消';
            }

            setErrorMessage(friendlyMsg);
            addToast('error', friendlyMsg);
            setIsRecording(false);
            setTranscript('');
            isProcessingRef.current = false;
          },
          onEnd: () => {
            if (!isMountedRef.current) return;

            // 只有在不处于处理状态时才重置录制状态
            if (!isProcessingRef.current) {
              setIsRecording(false);
            }
          },
        }
      );
    } catch (error) {
      if (!isMountedRef.current) return;

      const errorMsg = error instanceof Error ? error.message : String(error);
      addToast('error', `启动语音识别失败: ${errorMsg}`);
      setIsRecording(false);
    }
  }, [isSupported, onResult, addToast]);

  const handleStop = useCallback(() => {
    if (isRecording) {
      voiceService.stopListening();
    }
  }, [isRecording]);

  if (!isSupported) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onMouseDown={handleStart}
        onMouseUp={handleStop}
        onMouseLeave={handleStop}
        onTouchStart={handleStart}
        onTouchEnd={handleStop}
        disabled={isProcessing}
        className={`flex items-center justify-center gap-2 px-5 py-3 rounded-full transition-all duration-200 ${
          isRecording
            ? 'bg-coral-500 text-white shadow-lg shadow-coral-500/30 scale-105'
            : isProcessing
            ? 'bg-ink-200 text-ink-500 cursor-not-allowed'
            : errorMessage
            ? 'bg-coral-400/10 text-coral-500 hover:bg-coral-400/20'
            : 'bg-iris-500/10 text-iris-500 hover:bg-iris-500/20'
        }`}
      >
        {isProcessing ? (
          <Loader2 size={18} className="animate-spin" />
        ) : isRecording ? (
          <MicOff size={18} />
        ) : (
          <Mic size={18} />
        )}
        <span className="text-sm font-medium">
          {isProcessing ? '处理中...' : isRecording ? '松开结束' : placeholder}
        </span>
      </button>

      {transcript && (
        <div className="absolute bottom-full left-0 mb-2 max-w-xs glass rounded-xl p-3 shadow-card">
          <p className="text-sm text-ink-900/80">{transcript}</p>
          <div className="flex items-center gap-1 mt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-coral-400 animate-pulse" />
            <span className="text-[10px] text-ink-900/40">正在识别...</span>
          </div>
        </div>
      )}

      {errorMessage && !transcript && (
        <div className="absolute bottom-full left-0 mb-2 max-w-xs glass rounded-xl p-3 shadow-card border border-coral-400/30">
          <p className="text-sm text-coral-500">{errorMessage}</p>
        </div>
      )}
    </div>
  );
}