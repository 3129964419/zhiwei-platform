import { storage } from './storage';
import { pricingService, type SubscriptionTier } from './pricing';

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  startDate: number;
  expireDate: number;
  autoRenew: boolean;
  paymentMethod?: 'wechat' | 'alipay';
  orderId?: string;
}

export interface MonthlyUsage {
  userId: string;
  month: string;
  tier: SubscriptionTier;
  promptTokens: number;
  completionTokens: number;
  ttsChars: number;
  voiceClones: number;
  promptCost: number;
  completionCost: number;
  ttsCost: number;
  totalAPICost: number;
  subscriptionRevenue: number;
  payAsYouGoRevenue: number;
  totalRevenue: number;
}

const SUBSCRIPTIONS_KEY = 'zhiwei:subscriptions';
const MONTHLY_USAGE_KEY = 'zhiwei:monthly-usage';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const subscriptionService = {
  getSubscription(userId: string): Subscription | null {
    const subs = storage.get<Record<string, Subscription>>(SUBSCRIPTIONS_KEY, {});
    const sub = subs[userId];
    if (!sub) return null;

    if (sub.expireDate < Date.now() && sub.status === 'active') {
      sub.status = 'expired';
      storage.set(SUBSCRIPTIONS_KEY, subs);
    }

    return sub;
  },

  getUserTier(userId: string): SubscriptionTier {
    const sub = this.getSubscription(userId);
    return sub?.status === 'active' ? sub.tier : 'free';
  },

  async subscribe(
    userId: string,
    tier: SubscriptionTier,
    duration: 'monthly' | 'yearly',
    paymentMethod: 'wechat' | 'alipay' = 'wechat'
  ): Promise<{ success: boolean; subscription?: Subscription; orderId?: string }> {
    await delay(800);

    const tierInfo = pricingService.getTier(tier);
    if (!tierInfo) {
      throw new Error('无效的套餐');
    }

    const price = duration === 'monthly' ? tierInfo.monthlyPrice : tierInfo.yearlyPrice;
    if (price === 0 && tier !== 'free') {
      throw new Error('无效的套餐价格');
    }

    const orderId = `ORD${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const now = Date.now();
    const durationMs = duration === 'yearly' ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;

    const subscription: Subscription = {
      id: `SUB${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
      userId,
      tier,
      status: 'active',
      startDate: now,
      expireDate: now + durationMs,
      autoRenew: true,
      paymentMethod,
      orderId,
    };

    const subs = storage.get<Record<string, Subscription>>(SUBSCRIPTIONS_KEY, {});
    subs[userId] = subscription;
    storage.set(SUBSCRIPTIONS_KEY, subs);

    this.recordRevenue(userId, tier === 'free' ? 0 : price);

    return { success: true, subscription, orderId };
  },

  async renewSubscription(
    userId: string,
    duration: 'monthly' | 'yearly'
  ): Promise<{ success: boolean; subscription?: Subscription }> {
    const current = this.getSubscription(userId);
    if (!current) {
      throw new Error('未找到订阅');
    }

    return this.subscribe(userId, current.tier, duration, current.paymentMethod);
  },

  async upgradeSubscription(
    userId: string,
    newTier: SubscriptionTier,
    duration: 'monthly' | 'yearly'
  ): Promise<{ success: boolean; subscription?: Subscription; refund?: number }> {
    const current = this.getSubscription(userId);
    const currentTierInfo = pricingService.getTier(current?.tier || 'free');
    const newTierInfo = pricingService.getTier(newTier);

    if (!newTierInfo) {
      throw new Error('无效的目标套餐');
    }

    let refund = 0;
    if (current && current.status === 'active') {
      const daysRemaining = Math.ceil((current.expireDate - Date.now()) / (24 * 60 * 60 * 1000));
      const totalDays = current.tier === 'resonance' ? 30 : 30;
      const dailyRate = (currentTierInfo?.monthlyPrice || 0) / totalDays;
      refund = dailyRate * daysRemaining * 0.5;
    }

    const result = await this.subscribe(userId, newTier, duration, current?.paymentMethod || 'wechat');

    return { ...result, refund };
  },

  async cancelSubscription(userId: string): Promise<{ success: boolean }> {
    const subs = storage.get<Record<string, Subscription>>(SUBSCRIPTIONS_KEY, {});
    const sub = subs[userId];

    if (!sub) {
      throw new Error('未找到订阅');
    }

    sub.status = 'cancelled';
    sub.autoRenew = false;
    storage.set(SUBSCRIPTIONS_KEY, subs);

    return { success: true };
  },

  async setAutoRenew(userId: string, enabled: boolean): Promise<void> {
    const subs = storage.get<Record<string, Subscription>>(SUBSCRIPTIONS_KEY, {});
    const sub = subs[userId];

    if (!sub) {
      throw new Error('未找到订阅');
    }

    sub.autoRenew = enabled;
    storage.set(SUBSCRIPTIONS_KEY, subs);
  },

  getMonthlyUsage(userId: string, month?: string): MonthlyUsage | null {
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const usage = storage.get<Record<string, MonthlyUsage>>(MONTHLY_USAGE_KEY, {});
    return usage[`${userId}:${targetMonth}`] || null;
  },

  recordUsage(
    userId: string,
    promptTokens: number,
    completionTokens: number,
    ttsChars: number,
    voiceClones: number
  ): void {
    const month = new Date().toISOString().slice(0, 7);
    const usageMap = storage.get<Record<string, MonthlyUsage>>(MONTHLY_USAGE_KEY, {});
    const key = `${userId}:${month}`;
    const tier = this.getUserTier(userId);

    let usage = usageMap[key];
    if (!usage) {
      usage = {
        userId,
        month,
        tier,
        promptTokens: 0,
        completionTokens: 0,
        ttsChars: 0,
        voiceClones: 0,
        promptCost: 0,
        completionCost: 0,
        ttsCost: 0,
        totalAPICost: 0,
        subscriptionRevenue: 0,
        payAsYouGoRevenue: 0,
        totalRevenue: 0,
      };
    }

    const costs = pricingService.getTokenCost();
    usage.promptTokens += promptTokens;
    usage.completionTokens += completionTokens;
    usage.ttsChars += ttsChars;
    usage.voiceClones += voiceClones;
    usage.promptCost += (promptTokens / 1000000) * costs.costPerMillionPrompt;
    usage.completionCost += (completionTokens / 1000000) * costs.costPerMillionCompletion;
    usage.ttsCost += (ttsChars / 10000) * costs.costPerTenThousandTTS;
    usage.totalAPICost = usage.promptCost + usage.completionCost + usage.ttsCost;

    usageMap[key] = usage;
    storage.set(MONTHLY_USAGE_KEY, usageMap);
  },

  recordRevenue(userId: string, amount: number, type: 'subscription' | 'pay_as_go' = 'subscription'): void {
    const month = new Date().toISOString().slice(0, 7);
    const usageMap = storage.get<Record<string, MonthlyUsage>>(MONTHLY_USAGE_KEY, {});
    const key = `${userId}:${month}`;

    let usage = usageMap[key];
    if (!usage) {
      usage = {
        userId,
        month,
        tier: this.getUserTier(userId),
        promptTokens: 0,
        completionTokens: 0,
        ttsChars: 0,
        voiceClones: 0,
        promptCost: 0,
        completionCost: 0,
        ttsCost: 0,
        totalAPICost: 0,
        subscriptionRevenue: 0,
        payAsYouGoRevenue: 0,
        totalRevenue: 0,
      };
    }

    if (type === 'subscription') {
      usage.subscriptionRevenue += amount;
    } else {
      usage.payAsYouGoRevenue += amount;
    }
    usage.totalRevenue = usage.subscriptionRevenue + usage.payAsYouGoRevenue;

    usageMap[key] = usage;
    storage.set(MONTHLY_USAGE_KEY, usageMap);
  },

  getRemainingQuota(userId: string): {
    tokens: number;
    tts: number;
    clones: number;
    isUnlimited: boolean;
  } {
    const tier = this.getUserTier(userId);
    const tierInfo = pricingService.getTier(tier);

    if (!tierInfo || tier === 'free' || tierInfo.limits.monthlyTokenQuota === -1) {
      return { tokens: -1, tts: -1, clones: -1, isUnlimited: tierInfo?.limits.monthlyTokenQuota === -1 };
    }

    const month = new Date().toISOString().slice(0, 7);
    const usage = this.getMonthlyUsage(userId, month);

    return {
      tokens: Math.max(0, tierInfo.limits.monthlyTokenQuota - (usage?.promptTokens || 0) - (usage?.completionTokens || 0)),
      tts: Math.max(0, tierInfo.limits.monthlyTTSQuota - (usage?.ttsChars || 0)),
      clones: Math.max(0, tierInfo.limits.monthlyCloneQuota - (usage?.voiceClones || 0)),
      isUnlimited: false,
    };
  },

  checkQuota(userId: string, type: 'tokens' | 'tts' | 'clones'): boolean {
    const remaining = this.getRemainingQuota(userId);

    if (remaining.isUnlimited) return true;

    switch (type) {
      case 'tokens':
        return remaining.tokens > 0;
      case 'tts':
        return remaining.tts > 0;
      case 'clones':
        return remaining.clones > 0;
      default:
        return true;
    }
  },
};