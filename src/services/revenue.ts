import { storage } from './storage';

export interface RevenueReport {
  date: string;
  totalRevenue: number;
  subscriptionRevenue: number;
  payAsYouGoRevenue: number;
  totalCost: number;
  promptCost: number;
  completionCost: number;
  ttsCost: number;
  profit: number;
  profitMargin: number;
  userCount: number;
  activeUsers: number;
  newUsers: number;
  totalTokens: number;
  totalTTS: number;
  totalClones: number;
}

export interface DailyMetrics {
  date: string;
  revenue: number;
  cost: number;
  users: number;
  tokens: number;
}

export interface MarginAlert {
  type: 'low_margin' | 'high_cost' | 'quota_exceeded';
  severity: 'warning' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
}

const REVENUE_KEY = 'zhiwei:revenue';
const METRICS_KEY = 'zhiwei:metrics';
const ALERTS_KEY = 'zhiwei:alerts';
const ALERT_THRESHOLDS = {
  lowMarginWarning: 30,
  lowMarginCritical: 15,
  highCostWarning: 100,
  highCostCritical: 500,
};

export const revenueService = {
  recordDailyMetrics(): void {
    const today = new Date().toISOString().split('T')[0];
    const usageMap = storage.get<Record<string, any>>('zhiwei:monthly-usage', {});
    const usersMap = storage.get<Record<string, any>>('zhiwei:subscriptions', {});

    let totalRevenue = 0;
    let totalCost = 0;
    let totalTokens = 0;
    let totalTTS = 0;
    let userCount = 0;

    Object.values(usageMap).forEach((usage: any) => {
      if (usage.month === today.slice(0, 7)) {
        totalRevenue += usage.totalRevenue || 0;
        totalCost += usage.totalAPICost || 0;
        totalTokens += (usage.promptTokens || 0) + (usage.completionTokens || 0);
        totalTTS += usage.ttsChars || 0;
      }
    });

    Object.values(usersMap).forEach((sub: any) => {
      if (sub.status === 'active') {
        userCount++;
      }
    });

    const metrics: DailyMetrics = {
      date: today,
      revenue: totalRevenue,
      cost: totalCost,
      users: userCount,
      tokens: totalTokens,
    };

    const allMetrics = storage.get<Record<string, DailyMetrics>>(METRICS_KEY, {});
    allMetrics[today] = metrics;
    storage.set(METRICS_KEY, allMetrics);

    this.checkMarginAlert(totalRevenue, totalCost);
  },

  getReport(month?: string): RevenueReport {
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const usageMap = storage.get<Record<string, any>>('zhiwei:monthly-usage', {});
    const usersMap = storage.get<Record<string, any>>('zhiwei:subscriptions', {});

    let totalRevenue = 0;
    let subscriptionRevenue = 0;
    let payAsYouGoRevenue = 0;
    let totalCost = 0;
    let promptCost = 0;
    let completionCost = 0;
    let ttsCost = 0;
    let totalTokens = 0;
    let totalTTS = 0;
    let totalClones = 0;
    let userCount = 0;
    let activeUsers = 0;

    Object.values(usageMap).forEach((usage: any) => {
      if (usage.month === targetMonth) {
        totalRevenue += usage.totalRevenue || 0;
        subscriptionRevenue += usage.subscriptionRevenue || 0;
        payAsYouGoRevenue += usage.payAsYouGoRevenue || 0;
        promptCost += usage.promptCost || 0;
        completionCost += usage.completionCost || 0;
        ttsCost += usage.ttsCost || 0;
        totalCost += usage.totalAPICost || 0;
        totalTokens += (usage.promptTokens || 0) + (usage.completionTokens || 0);
        totalTTS += usage.ttsChars || 0;
        totalClones += usage.voiceClones || 0;
      }
    });

    Object.values(usersMap).forEach((sub: any) => {
      userCount++;
      if (sub.status === 'active') {
        activeUsers++;
      }
    });

    const profit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    return {
      date: targetMonth,
      totalRevenue,
      subscriptionRevenue,
      payAsYouGoRevenue,
      totalCost,
      promptCost,
      completionCost,
      ttsCost,
      profit,
      profitMargin,
      userCount,
      activeUsers,
      newUsers: 0,
      totalTokens,
      totalTTS,
      totalClones,
    };
  },

  getDailyMetrics(days: number = 7): DailyMetrics[] {
    const metrics = storage.get<Record<string, DailyMetrics>>(METRICS_KEY, {});
    const result: DailyMetrics[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      result.push(metrics[dateStr] || {
        date: dateStr,
        revenue: 0,
        cost: 0,
        users: 0,
        tokens: 0,
      });
    }

    return result.reverse();
  },

  getProfitTrend(days: number = 7): { date: string; profit: number }[] {
    const dailyMetrics = this.getDailyMetrics(days);
    return dailyMetrics.map(m => ({
      date: m.date,
      profit: m.revenue - m.cost,
    }));
  },

  getRevenueBreakdown(): {
    byTier: Record<string, number>;
    byType: { subscription: number; payAsYouGo: number };
  } {
    const report = this.getReport();
    return {
      byTier: {},
      byType: {
        subscription: report.subscriptionRevenue,
        payAsYouGo: report.payAsYouGoRevenue,
      },
    };
  },

  checkMarginAlert(revenue: number, cost: number): void {
    const margin = revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0;
    const alerts = storage.get<MarginAlert[]>(ALERTS_KEY, []);
    const now = Date.now();

    if (margin < ALERT_THRESHOLDS.lowMarginCritical) {
      alerts.push({
        type: 'low_margin',
        severity: 'critical',
        message: `利润率过低: ${margin.toFixed(1)}%`,
        value: margin,
        threshold: ALERT_THRESHOLDS.lowMarginCritical,
        timestamp: now,
      });
    } else if (margin < ALERT_THRESHOLDS.lowMarginWarning) {
      alerts.push({
        type: 'low_margin',
        severity: 'warning',
        message: `利润率偏低: ${margin.toFixed(1)}%`,
        value: margin,
        threshold: ALERT_THRESHOLDS.lowMarginWarning,
        timestamp: now,
      });
    }

    if (cost > ALERT_THRESHOLDS.highCostCritical) {
      alerts.push({
        type: 'high_cost',
        severity: 'critical',
        message: `日成本过高: ¥${cost.toFixed(2)}`,
        value: cost,
        threshold: ALERT_THRESHOLDS.highCostCritical,
        timestamp: now,
      });
    } else if (cost > ALERT_THRESHOLDS.highCostWarning) {
      alerts.push({
        type: 'high_cost',
        severity: 'warning',
        message: `日成本偏高: ¥${cost.toFixed(2)}`,
        value: cost,
        threshold: ALERT_THRESHOLDS.highCostWarning,
        timestamp: now,
      });
    }

    const recentAlerts = alerts.filter(a => now - a.timestamp < 24 * 60 * 60 * 1000);
    storage.set(ALERTS_KEY, recentAlerts);
  },

  getAlerts(): MarginAlert[] {
    const alerts = storage.get<MarginAlert[]>(ALERTS_KEY, []);
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return alerts.filter(a => a.timestamp > oneDayAgo);
  },

  clearAlerts(): void {
    storage.set(ALERTS_KEY, []);
  },

  getSummary(): {
    today: { revenue: number; cost: number; profit: number };
    thisMonth: { revenue: number; cost: number; profit: number };
    totalUsers: number;
    activeSubscriptions: number;
    averageMargin: number;
  } {
    const today = new Date().toISOString().split('T')[0];
    const todayMetrics = storage.get<Record<string, DailyMetrics>>(METRICS_KEY, {})[today] || {
      revenue: 0,
      cost: 0,
      users: 0,
      tokens: 0,
    };

    const monthReport = this.getReport();
    const usersMap = storage.get<Record<string, any>>('zhiwei:subscriptions', {});
    let activeSubscriptions = 0;
    Object.values(usersMap).forEach((sub: any) => {
      if (sub.status === 'active') activeSubscriptions++;
    });

    const dailyMetrics = this.getDailyMetrics(30);
    const avgRevenue = dailyMetrics.reduce((sum, m) => sum + m.revenue, 0) / Math.max(1, dailyMetrics.length);
    const avgCost = dailyMetrics.reduce((sum, m) => sum + m.cost, 0) / Math.max(1, dailyMetrics.length);
    const averageMargin = avgRevenue > 0 ? ((avgRevenue - avgCost) / avgRevenue) * 100 : 0;

    return {
      today: {
        revenue: todayMetrics.revenue,
        cost: todayMetrics.cost,
        profit: todayMetrics.revenue - todayMetrics.cost,
      },
      thisMonth: {
        revenue: monthReport.totalRevenue,
        cost: monthReport.totalCost,
        profit: monthReport.profit,
      },
      totalUsers: Object.keys(usersMap).length,
      activeSubscriptions,
      averageMargin,
    };
  },

  exportReport(format: 'json' | 'csv' = 'json'): string {
    const report = this.getReport();
    const dailyMetrics = this.getDailyMetrics(30);
    const alerts = this.getAlerts();

    if (format === 'csv') {
      const headers = [
        '日期',
        '总收入',
        '订阅收入',
        '按量付费收入',
        '总成本',
        'Prompt成本',
        'Completion成本',
        'TTS成本',
        '利润',
        '利润率',
        '用户数',
        '活跃用户',
        'Token用量',
        'TTS用量',
        '克隆次数',
      ];

      const rows = dailyMetrics.map(m => [
        m.date,
        m.revenue.toFixed(2),
        '0',
        '0',
        m.cost.toFixed(2),
        '0',
        '0',
        '0',
        (m.revenue - m.cost).toFixed(2),
        m.revenue > 0 ? (((m.revenue - m.cost) / m.revenue) * 100).toFixed(1) : '0',
        m.users.toString(),
        m.users.toString(),
        m.tokens.toString(),
        '0',
        '0',
      ]);

      return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }

    return JSON.stringify({
      report,
      dailyMetrics,
      alerts,
      exportedAt: new Date().toISOString(),
    }, null, 2);
  },
};