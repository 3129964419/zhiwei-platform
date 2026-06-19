import { useState, useEffect } from 'react';
import { Cookie, X, Check } from 'lucide-react';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

const STORAGE_KEY = 'zhiwei:cookie-consent';

export default function CookieConsent() {
  const [show, setShow] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      setTimeout(() => setShow(true), 1000);
    } else {
      try {
        setPreferences(JSON.parse(saved));
      } catch {
        setTimeout(() => setShow(true), 1000);
      }
    }
  }, []);

  const savePreferences = (newPrefs: CookiePreferences) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs));
    setPreferences(newPrefs);
    setShow(false);
  };

  const handleAcceptAll = () => {
    savePreferences({ necessary: true, analytics: true, marketing: true });
  };

  const handleRejectAll = () => {
    savePreferences({ necessary: true, analytics: false, marketing: false });
  };

  const handleSave = () => {
    savePreferences(preferences);
  };

  const handleToggle = (key: keyof CookiePreferences) => {
    if (key === 'necessary') return;
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[80] px-4 pb-safe">
      <div className="max-w-4xl mx-auto glass rounded-3xl p-5 shadow-glow">
        <button
          onClick={() => setShow(false)}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-ink-100 transition"
          aria-label="关闭"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-iris-500/10 text-iris-500 flex items-center justify-center shrink-0">
            <Cookie size={18} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">Cookie 设置</h3>
            <p className="text-xs text-ink-900/60 mb-3">
              我们使用 Cookie 来改善你的使用体验。你可以选择接受或拒绝非必要的 Cookie。
            </p>

            <div className="space-y-2 mb-4">
              {[
                { key: 'necessary', label: '必要 Cookie', desc: '保证网站核心功能正常运行', disabled: true },
                { key: 'analytics', label: '分析 Cookie', desc: '帮助我们了解用户行为', disabled: false },
                { key: 'marketing', label: '营销 Cookie', desc: '提供个性化推荐', disabled: false },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-2 rounded-xl bg-ink-50/50"
                >
                  <div>
                    <p className="text-xs font-medium">{item.label}</p>
                    <p className="text-[10px] text-ink-900/50">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => handleToggle(item.key as keyof CookiePreferences)}
                    disabled={item.disabled}
                    className={`w-9 h-5 rounded-full transition relative ${
                      preferences[item.key as keyof CookiePreferences] ? 'bg-iris-500' : 'bg-ink-200'
                    } ${item.disabled ? 'cursor-not-allowed opacity-60' : ''}`}
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                        preferences[item.key as keyof CookiePreferences] ? 'left-4' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleRejectAll}
                className="flex-1 py-2 rounded-xl bg-ink-100 text-sm font-medium hover:bg-ink-200 transition"
              >
                拒绝非必要
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2 rounded-xl bg-iris-500/10 text-iris-500 text-sm font-medium hover:bg-iris-500/20 transition flex items-center justify-center gap-1"
              >
                <Check size={14} /> 保存设置
              </button>
              <button
                onClick={handleAcceptAll}
                className="flex-1 py-2 rounded-xl bg-iris-500 text-white text-sm font-medium hover:bg-iris-600 transition"
              >
                接受全部
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}