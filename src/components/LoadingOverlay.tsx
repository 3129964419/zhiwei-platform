import { useEffect, useState, useRef } from 'react';

interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
  /** 最小显示时间，避免闪烁 */
  minDisplayTime?: number;
  /** 延迟显示时间，避免快速加载时闪烁 */
  delay?: number;
}

export function LoadingOverlay({
  isLoading,
  text = '加载中...',
  minDisplayTime = 300,
  delay = 150,
}: LoadingOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  // 使用 ref 跟踪显示开始时间
  const showStartTimeRef = useRef<number | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // 清理之前的定时器
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    if (isLoading) {
      // 延迟显示，避免快速加载时闪烁
      showTimeoutRef.current = setTimeout(() => {
        setVisible(true);
        setFadeOut(false);
        showStartTimeRef.current = Date.now();
      }, delay);
    } else if (visible) {
      // 确保最小显示时间
      const elapsed = showStartTimeRef.current ? Date.now() - showStartTimeRef.current : 0;
      const remainingTime = Math.max(0, minDisplayTime - elapsed);

      if (remainingTime > 0) {
        hideTimeoutRef.current = setTimeout(() => {
          setFadeOut(true);
          hideTimeoutRef.current = setTimeout(() => {
            setVisible(false);
            showStartTimeRef.current = null;
          }, 300); // 淡出动画时间
        }, remainingTime);
      } else {
        setFadeOut(true);
        hideTimeoutRef.current = setTimeout(() => {
          setVisible(false);
          showStartTimeRef.current = null;
        }, 300);
      }
    }

    return () => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [isLoading, visible, delay, minDisplayTime]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-sm transition-opacity duration-300 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-iris-200" />
          <div className="w-12 h-12 rounded-full border-4 border-iris-500 border-t-transparent animate-spin absolute inset-0" />
          <div className="w-12 h-12 rounded-full border-2 border-iris-300 border-b-transparent animate-spin absolute inset-0" style={{ animationDuration: '1.5s' }} />
        </div>
        <p className="text-ink-900/70 font-medium">{text}</p>
      </div>
    </div>
  );
}

export function PageTransition() {
  return (
    <div className="fixed inset-0 z-[99] pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-white via-ink-50 to-white opacity-0 animate-fade-in" />
    </div>
  );
}
