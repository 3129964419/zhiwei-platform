import { useState } from 'react';
import { Check, Crown, Sparkles, Loader2, CreditCard, Smartphone } from 'lucide-react';
import Layout from '@/components/Layout';
import { pricingService } from '@/services/pricing';
import { subscriptionService } from '@/services/subscription';
import { useUserStore } from '@/store/userStore';
import { useUIStore } from '@/store/uiStore';
import type { PaymentMethod } from '@/types';

export default function Pricing() {
  const user = useUserStore((s) => s.user);
  const addToast = useUIStore((s) => s.addToast);
  const [selectedTier, setSelectedTier] = useState<string>('gravity');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [purchasing, setPurchasing] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const tiers = pricingService.getAllTiers();
  const currentTier = user ? subscriptionService.getUserTier(user.id) : 'free';

  const handleSelectPlan = async (tierId: string) => {
    if (tierId === currentTier) {
      addToast('info', '你当前已使用此套餐');
      return;
    }

    const tier = tiers.find(t => t.id === tierId);
    if (!tier) return;

    if (tier.monthlyPrice === 0 && tierId === 'free') {
      addToast('info', '你已是免费用户');
      return;
    }

    setSelectedTier(tierId);
    setShowPayment(true);
  };

  const handlePurchase = async (method: PaymentMethod) => {
    if (!user) return;
    setPurchasing(true);
    try {
      await subscriptionService.subscribe(user.id, selectedTier as any, billingCycle, method);
      addToast('success', '订阅成功！');
      setShowPayment(false);
    } catch (e: any) {
      addToast('error', e.message || '支付失败');
    } finally {
      setPurchasing(false);
    }
  };

  const getPrice = (tier: any) => {
    if (tier.monthlyPrice === 0) return 0;
    return billingCycle === 'monthly' ? tier.monthlyPrice : tier.yearlyPrice;
  };

  const getPeriod = (tier: any) => {
    if (tier.monthlyPrice === 0) return '永久';
    return billingCycle === 'monthly' ? '月' : '年';
  };

  const getSavings = (tier: any) => {
    if (tier.monthlyPrice === 0 || !tier.yearlyPrice) return 0;
    return Math.round((tier.monthlyPrice * 12 - tier.yearlyPrice) / (tier.monthlyPrice * 12) * 100);
  };

  return (
    <Layout>
      <div className="aurora-bg min-h-screen">
        <div className="max-w-6xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="text-center mb-12 reveal-text">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-4">
              <Crown size={14} className="text-peach-500" />
              <span className="text-xs font-medium text-ink-900/80">
                套餐订阅
              </span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-semibold mb-4">
              选择适合你的
              <span className="text-gradient mx-2">套餐</span>
            </h1>
            <p className="text-ink-900/60 max-w-xl mx-auto">
              从免费体验到无限复刻
              <br />
              让 AI 复刻陪伴你的每一段关系
            </p>
          </div>

          {/* 计费周期切换 */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-1 p-1 bg-white/60 backdrop-blur rounded-full">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition ${
                  billingCycle === 'monthly'
                    ? 'bg-iris-500 text-white shadow-soft'
                    : 'text-ink-900/60 hover:text-ink-900'
                }`}
              >
                月付
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition ${
                  billingCycle === 'yearly'
                    ? 'bg-iris-500 text-white shadow-soft'
                    : 'text-ink-900/60 hover:text-ink-900'
                }`}
              >
                年付
                <span className="ml-1 text-xs text-coral-400">省20%</span>
              </button>
            </div>
          </div>

          {/* 套餐卡片 */}
          <div className="grid md:grid-cols-3 gap-5 mb-12">
            {tiers.map((tier) => {
              const isCurrentTier = tier.id === currentTier;
              const price = getPrice(tier);
              const savings = getSavings(tier);
              
              return (
                <div
                  key={tier.id}
                  className={`relative rounded-4xl p-7 ${
                    tier.id === 'resonance'
                      ? 'gradient-border shadow-glow bg-white'
                      : isCurrentTier
                      ? 'bg-iris-50 border-2 border-iris-300'
                      : 'glass'
                  } hover-lift transition-all`}
                >
                  {tier.id === 'resonance' && !isCurrentTier && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-iris-500 to-rose-400 text-white text-xs font-semibold shadow-soft whitespace-nowrap">
                      最受欢迎
                    </div>
                  )}

                  {isCurrentTier && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-iris-500 text-white text-xs font-semibold shadow-soft whitespace-nowrap">
                      当前套餐
                    </div>
                  )}

                  <div className="flex items-baseline gap-2 mb-1">
                    <h3 className="font-display text-2xl font-semibold">{tier.name}</h3>
                    {savings > 0 && !isCurrentTier && (
                      <span className="text-xs text-coral-500 font-medium">省{savings}%</span>
                    )}
                  </div>

                  <p className="text-sm text-ink-900/50 mb-3">{tier.description}</p>

                  <div className="flex items-baseline gap-1 mb-5 mt-3">
                    <span className="font-display text-5xl font-semibold text-gradient">
                      {price === 0 ? '免费' : `¥${price}`}
                    </span>
                    {price > 0 && (
                      <span className="text-sm text-ink-900/50">/{getPeriod(tier)}</span>
                    )}
                  </div>

                  <button
                    onClick={() => handleSelectPlan(tier.id)}
                    disabled={isCurrentTier}
                    className={`w-full py-2.5 rounded-full text-sm font-semibold transition mb-6 ${
                      isCurrentTier
                        ? 'bg-ink-100 text-ink-900/40 cursor-not-allowed'
                        : tier.id === 'resonance'
                        ? 'bg-gradient-to-r from-iris-500 to-rose-400 text-white shadow-soft hover:shadow-glow'
                        : 'bg-white border border-iris-200 text-iris-500 hover:bg-iris-50'
                    }`}
                  >
                    {isCurrentTier ? '当前版本' : '立即订阅'}
                  </button>

                  <div className="space-y-3">
                    {tier.features.map((feature, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-sm text-ink-900/80"
                      >
                        <Check
                          size={16}
                          className="shrink-0 mt-0.5 text-mint-500"
                        />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 信任标识 */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: '🔒', text: '支付安全' },
              { icon: '↩️', text: '随时取消' },
              { icon: '💎', text: '等保三级' },
              { icon: '🎁', text: '首月优惠' },
            ].map((b) => (
              <div
                key={b.text}
                className="glass rounded-2xl py-4 text-center text-sm text-ink-900/70"
              >
                <div className="text-2xl mb-1">{b.icon}</div>
                <div className="text-xs">{b.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 支付弹窗 */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/40 backdrop-blur-sm">
          <div className="bg-white rounded-4xl shadow-glow max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowPayment(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-ink-50 flex items-center justify-center"
            >
              ✕
            </button>

            <h3 className="font-display text-2xl font-semibold mb-1 text-center">
              选择支付方式
            </h3>
            <p className="text-sm text-ink-900/60 text-center mb-6">
              {tiers.find(t => t.id === selectedTier)?.name} · 
              ¥{getPrice(tiers.find(t => t.id === selectedTier)!)}/{getPeriod(tiers.find(t => t.id === selectedTier)!)}
            </p>

            <div className="space-y-3 mb-4">
              <button
                onClick={() => handlePurchase('wechat')}
                disabled={purchasing}
                className="w-full flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-mint-400/10 to-mint-500/10 border border-mint-400/20 hover:border-mint-400/40 transition disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-mint-400 to-mint-500 flex items-center justify-center text-white">
                  微
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold">微信支付</p>
                  <p className="text-xs text-ink-900/50">推荐 · 5 秒到账</p>
                </div>
                {purchasing ? <Loader2 className="animate-spin" size={18} /> : <CreditCard size={18} className="text-mint-500" />}
              </button>

              <button
                onClick={() => handlePurchase('alipay')}
                disabled={purchasing}
                className="w-full flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-iris-500/10 to-iris-500/5 border border-iris-500/20 hover:border-iris-500/40 transition disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-iris-500 to-iris-700 flex items-center justify-center text-white">
                  支
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold">支付宝</p>
                  <p className="text-xs text-ink-900/50">便捷 · 花呗可分期</p>
                </div>
                {purchasing ? <Loader2 className="animate-spin" size={18} /> : <Smartphone size={18} className="text-iris-500" />}
              </button>
            </div>

            <p className="text-[10px] text-ink-900/40 text-center">
              演示环境：点击任一支付方式即可完成
            </p>
          </div>
        </div>
      )}
    </Layout>
  );
}