import { useEffect, useState } from 'react';
import { Smartphone, Check, X, RefreshCw, Loader2 } from 'lucide-react';
import Layout from '@/components/Layout';
import { wechatAPI } from '@/services/wechat';
import { useUIStore } from '@/store/uiStore';
import type { WechatBinding } from '@/types';

export default function WechatBind() {
  const addToast = useUIStore((s) => s.addToast);
  const [qrId, setQrId] = useState<string | null>(null);
  const [status, setStatus] = useState<'pending' | 'scanned' | 'bound' | 'expired' | 'cancelled'>('pending');
  const [binding, setBinding] = useState<WechatBinding | null>(null);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    const existing = wechatAPI.getBinding();
    if (existing) {
      setBinding(existing);
      setStatus('bound');
    }
  }, []);

  const generateQR = async () => {
    setStatus('pending');
    setBinding(null);
    const qr = await wechatAPI.generateQR();
    setQrId(qr.id);
    setPolling(true);
  };

  useEffect(() => {
    if (!qrId || !polling) return;
    const timer = setInterval(async () => {
      const state = await wechatAPI.pollStatus(qrId);
      setStatus(state.status);
      if (state.binding) {
        setBinding(state.binding);
        setPolling(false);
        addToast('success', '微信绑定成功！');
      }
      if (state.status === 'expired') {
        setPolling(false);
      }
    }, 2000);
    return () => clearInterval(timer);
  }, [qrId, polling, addToast]);

  const handleUnbind = async () => {
    if (!confirm('确定要解除微信绑定吗？')) return;
    await wechatAPI.unbind();
    setBinding(null);
    setStatus('pending');
    setQrId(null);
    addToast('success', '已解除绑定');
  };

  const handleSimulate = async () => {
    if (qrId) {
      await wechatAPI.simulateScan(qrId);
      const state = await wechatAPI.pollStatus(qrId);
      setStatus(state.status);
      if (state.binding) {
        setBinding(state.binding);
        setPolling(false);
        addToast('success', '微信绑定成功！');
      }
    }
  };

  return (
    <Layout>
      <div className="aurora-bg min-h-screen">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center mb-10">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-mint-400 to-mint-500 items-center justify-center text-white mb-4 shadow-soft">
              <Smartphone size={26} />
            </div>
            <h1 className="font-display text-4xl font-semibold mb-2">
              微信<span className="text-gradient">生态</span>集成
            </h1>
            <p className="text-ink-900/60 max-w-md mx-auto">
              绑定微信后，可在微信端同步对话，接收消息推送，享受端云一体体验
            </p>
          </div>

          {binding ? (
            <div className="max-w-md mx-auto">
              <div className="glass rounded-4xl p-8 text-center shadow-glow">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-mint-400 to-mint-500 mx-auto mb-4 flex items-center justify-center text-white text-3xl shadow-glow">
                  <Check size={36} />
                </div>
                <h2 className="font-display text-2xl font-semibold mb-2">
                  绑定成功
                </h2>
                <p className="text-sm text-ink-900/60 mb-6">
                  你的微信账号已成功关联到智微
                </p>

                <div className="glass rounded-2xl p-4 mb-6 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-mint-400 to-mint-500 flex items-center justify-center text-white text-lg font-semibold">
                    {binding.avatar}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold">{binding.nickname}</p>
                    <p className="text-xs text-ink-900/50">
                      OpenID: {binding.openid.slice(0, 16)}...
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-left mb-6">
                  {[
                    '实时同步聊天记录',
                    '微信端消息推送',
                    '"对方正在输入" 状态展示',
                    '智能表情包推荐',
                    '多端无缝切换',
                  ].map((f) => (
                    <div
                      key={f}
                      className="flex items-center gap-2 text-sm text-ink-900/70"
                    >
                      <Check size={14} className="text-mint-500" />
                      {f}
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleUnbind}
                  className="w-full text-sm text-coral-500 hover:bg-coral-400/5 py-2 rounded-full transition"
                >
                  解除绑定
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-md mx-auto">
              <div className="glass rounded-4xl p-8 text-center shadow-glow relative overflow-hidden">
                <div
                  className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-30 blur-3xl"
                  style={{ background: 'radial-gradient(circle, #6FE7B8, transparent)' }}
                />

                <div className="relative">
                  <h2 className="font-display text-2xl font-semibold mb-1">
                    扫描二维码
                  </h2>
                  <p className="text-sm text-ink-900/60 mb-6">
                    打开微信扫一扫，完成绑定
                  </p>

                  <div className="bg-white rounded-3xl p-5 inline-block mx-auto shadow-card">
                    {qrId ? (
                      <div className="w-56 h-56 relative">
                        <div
                          className="absolute inset-0 rounded-2xl"
                          style={{
                            backgroundImage: `repeating-linear-gradient(45deg, #1A1B3A 0 1px, transparent 1px 8px), repeating-linear-gradient(-45deg, #1A1B3A 0 1px, transparent 1px 8px)`,
                            backgroundColor: '#fff',
                            opacity: 0.9,
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-mint-400 to-mint-500 mx-auto mb-2 flex items-center justify-center text-white text-2xl shadow-soft">
                              微
                            </div>
                            <p className="text-[10px] text-ink-900/60">
                              微信扫码绑定
                            </p>
                          </div>
                        </div>
                        {polling && (
                          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 text-xs text-iris-500 font-medium bg-white px-3 py-1 rounded-full shadow-card whitespace-nowrap">
                            <Loader2 size={12} className="animate-spin" />
                            {status === 'pending' ? '等待扫码...' : '确认中...'}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-56 h-56 flex flex-col items-center justify-center text-ink-900/40">
                        <Smartphone size={48} className="mb-2" />
                        <button
                          onClick={generateQR}
                          className="btn-primary text-sm mt-3"
                        >
                          生成二维码
                        </button>
                      </div>
                    )}
                  </div>

                  {qrId && (
                    <div className="mt-6 space-y-2">
                      <button
                        onClick={handleSimulate}
                        className="text-xs text-iris-500 hover:underline"
                      >
                        🎭 演示环境：模拟微信扫码
                      </button>
                      <div>
                        <button
                          onClick={generateQR}
                          className="text-xs text-ink-900/50 hover:text-ink-900 inline-flex items-center gap-1"
                        >
                          <RefreshCw size={12} /> 刷新二维码
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-8 pt-6 border-t border-ink-100 grid grid-cols-2 gap-3 text-left">
                    {[
                      { icon: '⚡', text: '消息延迟<3秒' },
                      { icon: '🔁', text: '多端实时同步' },
                      { icon: '😄', text: '智能表情包' },
                      { icon: '🔒', text: '端到端加密' },
                    ].map((f) => (
                      <div
                        key={f.text}
                        className="flex items-center gap-2 text-xs text-ink-900/60"
                      >
                        <span className="text-base">{f.icon}</span>
                        {f.text}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-ink-900/40 text-center mt-6 leading-relaxed">
                智微采用端到端加密保护你的微信绑定信息
                <br />
                解除绑定后所有关联数据将被立即清除
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
