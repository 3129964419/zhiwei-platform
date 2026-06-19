import { storage } from './storage';

const USAGE_KEY = 'zhiwei:usage';

interface DailyUsage {
  date: string;
  promptTokens: number;
  completionTokens: number;
  ttsChars: number;
  voiceClones: number;
}

interface UsageData {
  daily: DailyUsage[];
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTTSChars: number;
  totalVoiceClones: number;
  lastResetDate: string;
}

const FREE_DAILY_LIMITS = {
  promptTokens: 100000,
  completionTokens: 100000,
  ttsChars: 10000,
  voiceClones: 1,
};

const PRICING = {
  promptTokens: 2.1 / 1000000,
  completionTokens: 8.4 / 1000000,
  ttsCharsTurbo: 2 / 10000,
  ttsCharsHD: 3.5 / 10000,
  voiceClone: 9.9,
};

export const billingService = {
  getUsage(): UsageData {
    const data = storage.get<UsageData>(USAGE_KEY, {
      daily: [],
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
      totalTTSChars: 0,
      totalVoiceClones: 0,
      lastResetDate: '',
    });

    const today = new Date().toISOString().split('T')[0];
    if (data.lastResetDate !== today) {
      return this.resetDailyUsage(data);
    }

    return data;
  },

  resetDailyUsage(data: UsageData): UsageData {
    const today = new Date().toISOString().split('T')[0];
    const resetData: UsageData = {
      ...data,
      daily: [{ date: today, promptTokens: 0, completionTokens: 0, ttsChars: 0, voiceClones: 0 }],
      lastResetDate: today,
    };
    storage.set(USAGE_KEY, resetData);
    return resetData;
  },

  recordPromptTokens(tokens: number): void {
    const data = this.getUsage();
    const today = new Date().toISOString().split('T')[0];
    let todayData = data.daily.find((d) => d.date === today);
    
    if (!todayData) {
      todayData = { date: today, promptTokens: 0, completionTokens: 0, ttsChars: 0, voiceClones: 0 };
      data.daily.push(todayData);
    }

    todayData.promptTokens += tokens;
    data.totalPromptTokens += tokens;

    storage.set(USAGE_KEY, data);
  },

  recordCompletionTokens(tokens: number): void {
    const data = this.getUsage();
    const today = new Date().toISOString().split('T')[0];
    let todayData = data.daily.find((d) => d.date === today);
    
    if (!todayData) {
      todayData = { date: today, promptTokens: 0, completionTokens: 0, ttsChars: 0, voiceClones: 0 };
      data.daily.push(todayData);
    }

    todayData.completionTokens += tokens;
    data.totalCompletionTokens += tokens;

    storage.set(USAGE_KEY, data);
  },

  recordTTSChars(chars: number): void {
    const data = this.getUsage();
    const today = new Date().toISOString().split('T')[0];
    let todayData = data.daily.find((d) => d.date === today);
    
    if (!todayData) {
      todayData = { date: today, promptTokens: 0, completionTokens: 0, ttsChars: 0, voiceClones: 0 };
      data.daily.push(todayData);
    }

    todayData.ttsChars += chars;
    data.totalTTSChars += chars;

    storage.set(USAGE_KEY, data);
  },

  recordVoiceClone(): void {
    const data = this.getUsage();
    const today = new Date().toISOString().split('T')[0];
    let todayData = data.daily.find((d) => d.date === today);
    
    if (!todayData) {
      todayData = { date: today, promptTokens: 0, completionTokens: 0, ttsChars: 0, voiceClones: 0 };
      data.daily.push(todayData);
    }

    todayData.voiceClones += 1;
    data.totalVoiceClones += 1;

    storage.set(USAGE_KEY, data);
  },

  getDailyUsage(): DailyUsage | null {
    const data = this.getUsage();
    const today = new Date().toISOString().split('T')[0];
    return data.daily.find((d) => d.date === today) || null;
  },

  getRemainingDailyLimits(): {
    promptTokens: number;
    completionTokens: number;
    ttsChars: number;
    voiceClones: number;
  } {
    const dailyUsage = this.getDailyUsage();
    if (!dailyUsage) {
      return FREE_DAILY_LIMITS;
    }

    return {
      promptTokens: Math.max(0, FREE_DAILY_LIMITS.promptTokens - dailyUsage.promptTokens),
      completionTokens: Math.max(0, FREE_DAILY_LIMITS.completionTokens - dailyUsage.completionTokens),
      ttsChars: Math.max(0, FREE_DAILY_LIMITS.ttsChars - dailyUsage.ttsChars),
      voiceClones: Math.max(0, FREE_DAILY_LIMITS.voiceClones - dailyUsage.voiceClones),
    };
  },

  isDailyLimitExceeded(): boolean {
    const remaining = this.getRemainingDailyLimits();
    return (
      remaining.promptTokens === 0 &&
      remaining.completionTokens === 0
    );
  },

  getTotalTokensUsed(): number {
    const data = this.getUsage();
    return data.totalPromptTokens + data.totalCompletionTokens;
  },

  canMakeRequest(type: 'chat' | 'tts' | 'clone'): boolean {
    const remaining = this.getRemainingDailyLimits();
    switch (type) {
      case 'chat':
        return remaining.promptTokens > 0 || remaining.completionTokens > 0;
      case 'tts':
        return remaining.ttsChars > 0;
      case 'clone':
        return remaining.voiceClones > 0;
      default:
        return true;
    }
  },

  calculateCost(
    promptTokens?: number,
    completionTokens?: number,
    ttsChars?: number,
    isHD: boolean = false
  ): number {
    let cost = 0;
    if (promptTokens) cost += promptTokens * PRICING.promptTokens;
    if (completionTokens) cost += completionTokens * PRICING.completionTokens;
    if (ttsChars) cost += ttsChars * (isHD ? PRICING.ttsCharsHD : PRICING.ttsCharsTurbo);
    return cost;
  },

  getTotalCost(): number {
    const data = this.getUsage();
    return this.calculateCost(
      data.totalPromptTokens,
      data.totalCompletionTokens,
      data.totalTTSChars
    ) + data.totalVoiceClones * PRICING.voiceClone;
  },

  getDailyCost(): number {
    const daily = this.getDailyUsage();
    if (!daily) return 0;
    return this.calculateCost(
      daily.promptTokens,
      daily.completionTokens,
      daily.ttsChars
    ) + daily.voiceClones * PRICING.voiceClone;
  },

  getUsagePercentages(): {
    promptTokens: number;
    completionTokens: number;
    ttsChars: number;
    voiceClones: number;
  } {
    const daily = this.getDailyUsage();
    if (!daily) {
      return { promptTokens: 0, completionTokens: 0, ttsChars: 0, voiceClones: 0 };
    }

    return {
      promptTokens: Math.min(100, (daily.promptTokens / FREE_DAILY_LIMITS.promptTokens) * 100),
      completionTokens: Math.min(100, (daily.completionTokens / FREE_DAILY_LIMITS.completionTokens) * 100),
      ttsChars: Math.min(100, (daily.ttsChars / FREE_DAILY_LIMITS.ttsChars) * 100),
      voiceClones: Math.min(100, (daily.voiceClones / FREE_DAILY_LIMITS.voiceClones) * 100),
    };
  },
};