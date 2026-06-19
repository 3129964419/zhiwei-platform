import { storage } from './storage';

export type SubscriptionTier = 'free' | 'lite' | 'gravity' | 'pro' | 'resonance';

export interface PricingTier {
  id: SubscriptionTier;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  limits: {
    monthlyTokenQuota: number;
    monthlyTTSQuota: number;
    monthlyCloneQuota: number;
    maxAgents: number;
    voiceCloneEnabled: boolean;
    prioritySupport: boolean;
    dataBackup: boolean;
  };
}

export interface TokenPricing {
  costPerMillionPrompt: number;
  costPerMillionCompletion: number;
  costPerTenThousandTTS: number;
  voiceCloneCost: number;
}

export interface SellingPrice {
  pricePerMillionPrompt: number;
  pricePerMillionCompletion: number;
  pricePerTenThousandTTS: number;
  voiceClonePrice: number;
}

export interface PricingConfig {
  tiers: PricingTier[];
  tokenCost: TokenPricing;
  tokenSelling: SellingPrice;
  margin: {
    promptMargin: number;
    completionMargin: number;
    ttsMargin: number;
    voiceCloneMargin: number;
  };
  payAsYouGoEnabled: boolean;
  payAsYouGoPromptPrice: number;
  payAsYouGoCompletionPrice: number;
  freeTier: {
    dailyTokens: number;
    monthlyTokens: number;
    dailyTTS: number;
    requiresPhoneVerification: boolean;
  };
  antiAbuse: {
    rateLimitFree: number;
    rateLimitPaid: number;
    maxTokensPerRequestFree: number;
    maxTokensPerRequestPaid: number;
    dailyLimitEnabled: boolean;
  };
  valueAddedServices: {
    extraTokenPack: number;
    extraTokenPackSize: number;
    extraTTSQuota: number;
    extraClonePrice: number;
    apiAccessPrice: number;
    dataExportPrice: number;
    contextExtensionPrice: number;
    customTrainingPrice: number;
  };
}

const DEFAULT_PRICING_CONFIG: PricingConfig = {
  tiers: [
    {
      id: 'free',
      name: '免费版',
      description: '适合轻度体验',
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        '每日免费 Token 额度',
        '基础对话功能',
        '最多创建 2 个智能体',
        '本机语音合成',
      ],
      limits: {
        monthlyTokenQuota: 60000,
        monthlyTTSQuota: 10000,
        monthlyCloneQuota: 0,
        maxAgents: 2,
        voiceCloneEnabled: false,
        prioritySupport: false,
        dataBackup: false,
      },
    },
    {
      id: 'lite',
      name: '轻量版',
      description: '适合轻度使用',
      monthlyPrice: 19.9,
      yearlyPrice: 189,
      features: [
        '每月 30 万 Token 额度',
        '每日上限 1 万 Token',
        '基础语音合成',
        '最多创建 5 个智能体',
        '优先响应支持',
      ],
      limits: {
        monthlyTokenQuota: 300000,
        monthlyTTSQuota: 100000,
        monthlyCloneQuota: 1,
        maxAgents: 5,
        voiceCloneEnabled: false,
        prioritySupport: true,
        dataBackup: false,
      },
    },
    {
      id: 'gravity',
      name: '标准版',
      description: '适合日常使用',
      monthlyPrice: 29.9,
      yearlyPrice: 287,
      features: [
        '每月 100 万 Token 额度',
        '每日上限 5 万 Token',
        '每月 20 万字语音合成',
        '每月 3 次语音克隆',
        '最多创建 10 个智能体',
        '128K 超长上下文',
        '优先技术支持',
      ],
      limits: {
        monthlyTokenQuota: 1000000,
        monthlyTTSQuota: 200000,
        monthlyCloneQuota: 3,
        maxAgents: 10,
        voiceCloneEnabled: true,
        prioritySupport: true,
        dataBackup: false,
      },
    },
    {
      id: 'pro',
      name: '专业版',
      description: '适合深度用户',
      monthlyPrice: 99.9,
      yearlyPrice: 959,
      features: [
        '每月 500 万 Token 额度',
        '每日上限 20 万 Token',
        '每月 100 万字语音合成',
        '每月 10 次语音克隆',
        '最多创建 50 个智能体',
        '256K 超长上下文',
        'API 访问权限',
        '数据备份特权',
        '优先技术支持',
      ],
      limits: {
        monthlyTokenQuota: 5000000,
        monthlyTTSQuota: 1000000,
        monthlyCloneQuota: 10,
        maxAgents: 50,
        voiceCloneEnabled: true,
        prioritySupport: true,
        dataBackup: true,
      },
    },
    {
      id: 'resonance',
      name: '企业版',
      description: '适合团队和企业',
      monthlyPrice: 499,
      yearlyPrice: 4799,
      features: [
        '每月 2000 万 Token 额度',
        '每日无上限',
        '每月无限语音合成',
        '每月 50 次语音克隆',
        '无智能体数量限制',
        '256K 超长上下文',
        'API 访问权限',
        '数据备份特权',
        '7x24 小时专属客服',
        '定制化训练服务',
        '优先资源调度',
      ],
      limits: {
        monthlyTokenQuota: 20000000,
        monthlyTTSQuota: -1,
        monthlyCloneQuota: 50,
        maxAgents: -1,
        voiceCloneEnabled: true,
        prioritySupport: true,
        dataBackup: true,
      },
    },
  ],
  tokenCost: {
    costPerMillionPrompt: 1.5,
    costPerMillionCompletion: 5.4,
    costPerTenThousandTTS: 0.4,
    voiceCloneCost: 9.9,
  },
  tokenSelling: {
    pricePerMillionPrompt: 3.5,
    pricePerMillionCompletion: 12.9,
    pricePerTenThousandTTS: 1.0,
    voiceClonePrice: 29.9,
  },
  margin: {
    promptMargin: 2.0,
    completionMargin: 7.5,
    ttsMargin: 0.6,
    voiceCloneMargin: 20.0,
  },
  payAsYouGoEnabled: true,
  payAsYouGoPromptPrice: 3.5,
  payAsYouGoCompletionPrice: 12.9,
  freeTier: {
    dailyTokens: 2000,
    monthlyTokens: 60000,
    dailyTTS: 500,
    requiresPhoneVerification: false,
  },
  antiAbuse: {
    rateLimitFree: 60,
    rateLimitPaid: 300,
    maxTokensPerRequestFree: 2000,
    maxTokensPerRequestPaid: 32000,
    dailyLimitEnabled: true,
  },
  valueAddedServices: {
    extraTokenPack: 5,
    extraTokenPackSize: 100000,
    extraTTSQuota: 3,
    extraClonePrice: 15,
    apiAccessPrice: 29.9,
    dataExportPrice: 19.9,
    contextExtensionPrice: 9.9,
    customTrainingPrice: 199,
  },
};

const PRICING_CONFIG_KEY = 'zhiwei:pricing-config';

export const pricingService = {
  getConfig(): PricingConfig {
    const saved = storage.get<PricingConfig | null>(PRICING_CONFIG_KEY, null);
    return saved || DEFAULT_PRICING_CONFIG;
  },

  saveConfig(config: Partial<PricingConfig>): void {
    const current = this.getConfig();
    storage.set(PRICING_CONFIG_KEY, { ...current, ...config });
  },

  getTier(tierId: SubscriptionTier): PricingTier | undefined {
    const config = this.getConfig();
    return config.tiers.find((t) => t.id === tierId);
  },

  getAllTiers(): PricingTier[] {
    return this.getConfig().tiers;
  },

  getTokenCost(): TokenPricing {
    return this.getConfig().tokenCost;
  },

  getTokenSelling(): SellingPrice {
    return this.getConfig().tokenSelling;
  },

  calculateAPICost(promptTokens: number, completionTokens: number, ttsChars: number = 0): number {
    const cost = this.getTokenCost();
    const promptCost = (promptTokens / 1000000) * cost.costPerMillionPrompt;
    const completionCost = (completionTokens / 1000000) * cost.costPerMillionCompletion;
    const ttsCost = (ttsChars / 10000) * cost.costPerTenThousandTTS;
    return promptCost + completionCost + ttsCost;
  },

  calculateSellingPrice(promptTokens: number, completionTokens: number, ttsChars: number = 0): number {
    const selling = this.getTokenSelling();
    const promptPrice = (promptTokens / 1000000) * selling.pricePerMillionPrompt;
    const completionPrice = (completionTokens / 1000000) * selling.pricePerMillionCompletion;
    const ttsPrice = (ttsChars / 10000) * selling.pricePerTenThousandTTS;
    return promptPrice + completionPrice + ttsPrice;
  },

  calculateMargin(promptTokens: number, completionTokens: number, ttsChars: number = 0): number {
    return this.calculateSellingPrice(promptTokens, completionTokens, ttsChars) - this.calculateAPICost(promptTokens, completionTokens, ttsChars);
  },

  calculateProfitMarginPercent(): number {
    const config = this.getConfig();
    const promptMarginPercent = ((config.tokenSelling.pricePerMillionPrompt - config.tokenCost.costPerMillionPrompt) / config.tokenSelling.pricePerMillionPrompt) * 100;
    const completionMarginPercent = ((config.tokenSelling.pricePerMillionCompletion - config.tokenCost.costPerMillionCompletion) / config.tokenSelling.pricePerMillionCompletion) * 100;
    const ttsMarginPercent = ((config.tokenSelling.pricePerTenThousandTTS - config.tokenCost.costPerTenThousandTTS) / config.tokenSelling.pricePerTenThousandTTS) * 100;
    const voiceCloneMarginPercent = ((config.tokenSelling.voiceClonePrice - config.tokenCost.voiceCloneCost) / config.tokenSelling.voiceClonePrice) * 100;

    return {
      prompt: promptMarginPercent,
      completion: completionMarginPercent,
      tts: ttsMarginPercent,
      voiceClone: voiceCloneMarginPercent,
    } as any;
  },

  getPayAsYouGoPrice(type: 'prompt' | 'completion'): number {
    const config = this.getConfig();
    if (!config.payAsYouGoEnabled) return 0;
    return type === 'prompt' ? config.payAsYouGoPromptPrice : config.payAsYouGoCompletionPrice;
  },

  isPayAsYouGoEnabled(): boolean {
    return this.getConfig().payAsYouGoEnabled;
  },

  getFreeTierConfig(): { dailyTokens: number; monthlyTokens: number; dailyTTS: number; requiresPhoneVerification: boolean } {
    return this.getConfig().freeTier;
  },

  getAntiAbuseConfig(): { rateLimitFree: number; rateLimitPaid: number; maxTokensPerRequestFree: number; maxTokensPerRequestPaid: number; dailyLimitEnabled: boolean } {
    return this.getConfig().antiAbuse;
  },

  getValueAddedServices(): { extraTokenPack: number; extraTokenPackSize: number; extraTTSQuota: number; extraClonePrice: number; apiAccessPrice: number; dataExportPrice: number; contextExtensionPrice: number; customTrainingPrice: number } {
    return this.getConfig().valueAddedServices;
  },

  getRateLimit(tier: SubscriptionTier): number {
    const config = this.getAntiAbuseConfig();
    return tier === 'free' ? config.rateLimitFree : config.rateLimitPaid;
  },

  getMaxTokensPerRequest(tier: SubscriptionTier): number {
    const config = this.getAntiAbuseConfig();
    return tier === 'free' ? config.maxTokensPerRequestFree : config.maxTokensPerRequestPaid;
  },

  getTokenMargin(): { prompt: number; completion: number; tts: number; voiceClone: number } {
    const config = this.getConfig();
    return {
      prompt: ((config.tokenSelling.pricePerMillionPrompt - config.tokenCost.costPerMillionPrompt) / config.tokenCost.costPerMillionPrompt) * 100,
      completion: ((config.tokenSelling.pricePerMillionCompletion - config.tokenCost.costPerMillionCompletion) / config.tokenCost.costPerMillionCompletion) * 100,
      tts: ((config.tokenSelling.pricePerTenThousandTTS - config.tokenCost.costPerTenThousandTTS) / config.tokenCost.costPerTenThousandTTS) * 100,
      voiceClone: ((config.tokenSelling.voiceClonePrice - config.tokenCost.voiceCloneCost) / config.tokenCost.voiceCloneCost) * 100,
    };
  },

  updateTokenPrices(
    promptPrice: number,
    completionPrice: number,
    ttsPrice: number,
    voiceClonePrice: number
  ): void {
    const config = this.getConfig();
    this.saveConfig({
      tokenSelling: {
        pricePerMillionPrompt: promptPrice,
        pricePerMillionCompletion: completionPrice,
        pricePerTenThousandTTS: ttsPrice,
        voiceClonePrice: voiceClonePrice,
      },
      margin: {
        promptMargin: promptPrice - config.tokenCost.costPerMillionPrompt,
        completionMargin: completionPrice - config.tokenCost.costPerMillionCompletion,
        ttsMargin: ttsPrice - config.tokenCost.costPerTenThousandTTS,
        voiceCloneMargin: voiceClonePrice - config.tokenCost.voiceCloneCost,
      },
    });
  },

  resetToDefault(): void {
    storage.set(PRICING_CONFIG_KEY, DEFAULT_PRICING_CONFIG);
  },
};