import type { PricingPlan } from '@/types';

export const pricingPlans: PricingPlan[] = [
  {
    tier: 'free',
    name: '免费版',
    price: 0,
    period: '永久',
    highlight: false,
    features: [
      { text: '创建最多 3 个普通智能体', included: true },
      { text: '基础对话功能', included: true },
      { text: '角色复刻', included: false },
      { text: '高级性格定制', included: false },
      { text: '数据备份', included: false },
    ],
  },
  {
    tier: 'gravity',
    name: '引力套餐',
    price: 29,
    period: '月',
    highlight: false,
    features: [
      { text: '创建无限个智能体', included: true },
      { text: '每月 30 次免费复刻', included: true },
      { text: '高级性格定制', included: true },
      { text: '优先技术支持', included: true },
      { text: '数据备份', included: false },
    ],
  },
  {
    tier: 'resonance',
    name: '共振套餐',
    price: 99,
    period: '月',
    highlight: true,
    badge: '最受欢迎',
    features: [
      { text: '所有引力套餐特权', included: true },
      { text: '无限次角色复刻', included: true },
      { text: '专属 AI 训练师', included: true },
      { text: '数据定期备份与恢复', included: true },
      { text: '新功能优先体验', included: true },
    ],
  },
];

export const singleClonePrice = 9.9;
