import { useNetworkStatus, useOfflineQueue } from '@/services/offline';
import { Wifi, WifiOff, AlertCircle, CloudOff, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * 网络状态指示器
 */
export function NetworkStatusIndicator() {
  const status = useNetworkStatus();
  const { count } = useOfflineQueue();
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);

  useEffect(() => {
    if (status === 'offline') {
      setShowOfflineBanner(true);
    } else {
      // 延迟隐藏，让用户看到恢复提示
      if (showOfflineBanner) {
        const timer = setTimeout(() => {
          setShowOfflineBanner(false);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [status]);

  if (!showOfflineBanner && status === 'online' && count === 0) {
    return null;
  }

  return (
    <>
      {/* 离线横幅 */}
      {showOfflineBanner && (
        <div
          className={`fixed top-0 left-0 right-0 z-[200] px-4 py-2 text-center text-sm font-medium transition-all duration-300 ${
            status === 'offline'
              ? 'bg-coral-500 text-white'
              : 'bg-mint-500 text-white'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            {status === 'offline' ? (
              <>
                <WifiOff size={16} />
                <span>网络已断开，部分功能暂不可用</span>
              </>
            ) : (
              <>
                <Wifi size={16} />
                <span>网络已恢复</span>
                {count > 0 && (
                  <span className="ml-2">
                    · 正在发送 {count} 条待发送消息...
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* 慢速连接提示 */}
      {status === 'slow' && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[200] px-4 py-2 bg-peach-400/90 text-white rounded-full text-sm font-medium shadow-lg flex items-center gap-2">
          <AlertCircle size={14} />
          <span>网络较慢，请耐心等待</span>
        </div>
      )}
    </>
  );
}

/**
 * 离线队列指示器
 */
export function OfflineQueueIndicator() {
  const { count, retry } = useOfflineQueue();
  const status = useNetworkStatus();
  const [isRetrying, setIsRetrying] = useState(false);

  if (count === 0 || status === 'offline') {
    return null;
  }

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await retry();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] px-4 py-2 bg-ink-900/90 text-white rounded-xl text-sm font-medium shadow-lg flex items-center gap-3">
      <CloudOff size={16} />
      <span>{count} 条消息待发送</span>
      <button
        onClick={handleRetry}
        disabled={isRetrying}
        className="flex items-center gap-1 px-2 py-1 bg-white/20 rounded-lg hover:bg-white/30 transition disabled:opacity-50"
      >
        <RefreshCw size={12} className={isRetrying ? 'animate-spin' : ''} />
        {isRetrying ? '发送中...' : '重试'}
      </button>
    </div>
  );
}

/**
 * 离线状态组件（包含所有离线相关 UI）
 */
export function OfflineStatus() {
  return (
    <>
      <NetworkStatusIndicator />
      <OfflineQueueIndicator />
    </>
  );
}
