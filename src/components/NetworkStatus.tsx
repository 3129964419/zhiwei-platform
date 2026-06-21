import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOffline, setShowOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOffline(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500/95 backdrop-blur-sm text-white py-2 px-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
        <WifiOff size={16} />
        <span className="text-sm font-medium">
          网络连接已断开，请检查您的网络设置
        </span>
        <button
          onClick={() => {
            if (navigator.onLine) {
              setShowOffline(false);
            }
          }}
          className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 transition text-sm"
        >
          <RefreshCw size={14} />
          重试
        </button>
        <button
          onClick={() => setShowOffline(false)}
          className="text-white/70 hover:text-white transition ml-2"
        >
          ✕
        </button>
      </div>
    </div>
  );
}