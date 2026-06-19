import { useUIStore } from '@/store/uiStore';
import { CheckCircle2, XCircle, Info } from 'lucide-react';

const iconMap = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const colorMap = {
  success: 'text-mint-500',
  error: 'text-coral-500',
  info: 'text-iris-500',
};

export default function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);
  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        const Icon = iconMap[t.type];
        return (
          <div
            key={t.id}
            className="glass rounded-2xl shadow-card px-5 py-3 flex items-center gap-3 animate-in pointer-events-auto"
            style={{
              animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              minWidth: 240,
            }}
          >
            <Icon size={20} className={colorMap[t.type]} />
            <span className="text-sm font-medium text-ink-900">{t.message}</span>
          </div>
        );
      })}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
