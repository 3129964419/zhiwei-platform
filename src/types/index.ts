// 类型定义

export type PersonalityId =
  | 'gentle'
  | 'tsundere'
  | 'domineering'
  | 'intellectual'
  | 'energetic'
  | 'cool'
  | 'neighbor'
  | 'mysterious'
  | 'custom';

export type RelationshipId =
  | 'friend'
  | 'lover'
  | 'family'
  | 'mentor'
  | 'colleague'
  | 'idol'
  | 'stranger'
  | 'rival'
  | 'soulmate'
  | 'pet';

export type SubscriptionTier = 'free' | 'gravity' | 'resonance';
export type InteractionMode = 'text' | 'voice' | 'sticker';
export type MessageRole = 'user' | 'agent';
export type MessageType = 'text' | 'sticker' | 'voice';
export type AgentStatus = 'active' | 'archived';
export type PaymentMethod = 'wechat' | 'alipay';
export type OrderStatus = 'pending' | 'paid' | 'cancelled' | 'refunded';

export interface User {
  id: string;
  phone: string;
  nickname: string;
  avatar: string;
  wechatOpenid?: string;
  createdAt: number;
}

export interface Agent {
  id: string;
  userId: string;
  name: string;
  emoji?: string;
  personality: PersonalityId | string;
  relationship: RelationshipId | string;
  interactionMode: InteractionMode[];
  background: string;
  avatar: string;
  avatarGradient: [string, string];
  status: AgentStatus;
  skillId?: string;
  customPersonality?: string;
  customAvatar?: string;
  voiceId?: string;
  createdAt: number;
  lastUsedAt: number;
}

export interface Skill {
  id: string;
  agentId: string;
  greetingHabits: string[];
  catchphrases: string[];
  emotionPatterns: string[];
  knowledgePreference: string[];
  styleVector: {
    warmth: number;
    formality: number;
    humor: number;
    intimacy: number;
  };
  systemPrompt?: string;
}

export interface Message {
  id: string;
  agentId: string;
  role: MessageRole;
  content: string;
  type: MessageType;
  timestamp: number;
}

export interface Subscription {
  tier: SubscriptionTier;
  remainingClones: number;
  expireAt: number;
  status: 'active' | 'expired';
  autoRenew: boolean;
}

export interface Order {
  id: string;
  userId: string;
  packageType: SubscriptionTier | 'single';
  amount: number;
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  createdAt: number;
}

export interface WechatBinding {
  openid: string;
  unionid?: string;
  nickname: string;
  avatar: string;
  boundAt: number;
}

export interface UserSettings {
  stickerAutoReply: boolean;
  replySpeed: 'slow' | 'normal' | 'fast';
  voice: {
    autoPlay: boolean;
    rate: number;
    volume: number;
  };
  notification: {
    sound: boolean;
    desktop: boolean;
    email: boolean;
  };
  privacy: {
    showOnlineStatus: boolean;
    allowDataAnalytics: boolean;
  };
}

export interface AnalysisReport {
  greetingHabits: string[];
  catchphrases: string[];
  emotionPatterns: string[];
  knowledgePreference: string[];
  styleVector: Skill['styleVector'];
  summary: string;
  fileCount: number;
}

export interface Personality {
  id: PersonalityId;
  name: string;
  description: string;
  emoji: string;
  color: string;
  gradient: [string, string];
}

export interface Relationship {
  id: RelationshipId;
  name: string;
  description: string;
  emoji: string;
}

export interface PricingPlan {
  tier: SubscriptionTier;
  name: string;
  price: number;
  period: string;
  highlight: boolean;
  features: { text: string; included: boolean }[];
  badge?: string;
}
