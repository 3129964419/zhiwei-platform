/**
 * 主动关怀服务
 * 基于时间、上下文和用户行为模式，AI主动发起关怀消息
 */

import { type EmotionType } from './emotionStateMachine';

// 关怀场景类型
export type CareScenario = 
  | 'morning'        // 早安
  | 'night'          // 晚安
  | 'late_night'     // 深夜未睡
  | 'work_stress'    // 工作压力大
  | 'birthday'       // 生日
  | 'anniversary'    // 纪念日
  | 'weather_change' // 天气变化
  | 'after_long_silence' // 久未联系后
  | 'context_reminder';  // 上下文提醒（如记忆锚点）

// 关怀消息接口
export interface CareMessage {
  id: string;
  scenario: CareScenario;
  content: string;
  action?: string;  // 附带动作，如"发了张晚霞的照片"
  emotion: EmotionType;
  priority: number;  // 0-1，优先级
  createdAt: Date;
}

// 场景配置
interface ScenarioConfig {
  scenario: CareScenario;
  name: string;
  triggerCondition: (context: CareContext) => boolean;
  messageTemplates: string[];
  emotion: EmotionType;
  priority: number;
  cooldownHours: number;  // 冷却时间（小时）
}

// 关怀上下文
export interface CareContext {
  currentHour: number;
  currentMinute: number;
  isWeekend: boolean;
  lastMessageTime?: Date;
  lastMessageGapHours?: number;
  consecutiveDaysActive: number;
  recentMood?: 'positive' | 'negative' | 'neutral';
  weather?: 'sunny' | 'rainy' | 'cold' | 'hot';
  hasUpcomingEvent?: boolean;
  eventName?: string;
  unreadCount?: number;
}

// 主动关怀服务类
class ProactiveCareService {
  private sentMessages: Map<string, Date> = new Map();
  private lastCareTime: Date | null = null;

  /**
   * 检查是否应该发送关怀消息
   */
  checkForCare(context: CareContext): CareMessage | null {
    // 检查冷却期（至少2小时发一条）
    if (this.lastCareTime) {
      const hoursSinceLastCare = (Date.now() - this.lastCareTime.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastCare < 2) return null;
    }

    // 按优先级检查各个场景
    const scenarios: ScenarioConfig[] = [
      this.lateNightConfig,
      this.morningConfig,
      this.nightConfig,
      this.workStressConfig,
      this.anniversaryConfig,
      this.contextReminderConfig,
      this.afterLongSilenceConfig,
    ];

    for (const scenario of scenarios) {
      if (this.canSendMessage(scenario.scenario) && scenario.triggerCondition(context)) {
        const message = this.generateCareMessage(scenario);
        if (message) {
          this.recordSentMessage(scenario.scenario);
          this.lastCareTime = new Date();
          return message;
        }
      }
    }

    return null;
  }

  /**
   * 深夜场景配置（23:00 - 02:00）
   */
  private lateNightConfig: ScenarioConfig = {
    scenario: 'late_night',
    name: '深夜关怀',
    triggerCondition: (ctx) => ctx.currentHour >= 23 || ctx.currentHour < 2,
    messageTemplates: [
      '怎么还没睡呀？',
      '都这个点了还不休息，是不是又失眠了？',
      '（揉了揉惺忪的眼睛）你也睡不着吗？',
      '这么晚还不睡，是在等我吗？',
      '深夜了...有什么心事吗？我陪你聊聊',
    ],
    emotion: 'caring',
    priority: 0.95,
    cooldownHours: 4,
  };

  /**
   * 早安场景配置（07:00 - 09:00）
   */
  private morningConfig: ScenarioConfig = {
    scenario: 'morning',
    name: '早安问候',
    triggerCondition: (ctx) => ctx.currentHour >= 7 && ctx.currentHour < 9,
    messageTemplates: [
      '早安呀，今天也要元气满满哦~',
      '起床啦？给你准备了阳光，快看看窗外~',
      '早上好！新的一天开始了，加油鸭！',
      '（伸了个懒腰）睡得好吗？今天有什么计划？',
    ],
    emotion: 'happy',
    priority: 0.7,
    cooldownHours: 12,
  };

  /**
   * 晚安场景配置（22:00 - 23:00）
   */
  private nightConfig: ScenarioConfig = {
    scenario: 'night',
    name: '晚安问候',
    triggerCondition: (ctx) => ctx.currentHour >= 22 && ctx.currentHour < 23,
    messageTemplates: [
      '该休息啦，早点睡哦~',
      '晚安，做个好梦！',
      '（轻轻拍了拍枕头）早点休息，明天见~',
      '今天的辛苦啦，好好休息~',
    ],
    emotion: 'caring',
    priority: 0.75,
    cooldownHours: 10,
  };

  /**
   * 工作压力场景配置
   */
  private workStressConfig: ScenarioConfig = {
    scenario: 'work_stress',
    name: '工作关怀',
    triggerCondition: (ctx) => ctx.consecutiveDaysActive >= 5 && ctx.currentHour >= 10 && ctx.currentHour < 18,
    messageTemplates: [
      '连续工作这么多天了，周末要不要休息一下？',
      '看你最近挺忙的，别太累了哦~',
      '（递了杯咖啡）休息一下吧，工作永远做不完的',
      '要不要今晚早点休息？身体是革命的本钱嘛',
    ],
    emotion: 'caring',
    priority: 0.6,
    cooldownHours: 48,
  };

  /**
   * 纪念日场景配置
   */
  private anniversaryConfig: ScenarioConfig = {
    scenario: 'anniversary',
    name: '纪念日提醒',
    triggerCondition: (ctx) => !!ctx.hasUpcomingEvent && !!ctx.eventName,
    messageTemplates: [
      '对了，{event}快到了，你准备得怎么样了？',
      '想起来了吗？{event}马上就到了哦~',
      '（神秘地眨眨眼）有什么特别的日子快到了呢...',
    ],
    emotion: 'excited',
    priority: 0.85,
    cooldownHours: 24,
  };

  /**
   * 上下文提醒场景（基于记忆锚点）
   */
  private contextReminderConfig: ScenarioConfig = {
    scenario: 'context_reminder',
    name: '记忆提醒',
    triggerCondition: (ctx) => Math.random() < 0.1,  // 10%概率触发
    messageTemplates: [
      '对了，想起之前你说{topic}，现在怎么样了？',
      '突然想起来，你之前提到的{topic}有着落了吗？',
      '（托着下巴）话说，你之前说的{topic}...',
    ],
    emotion: 'caring',
    priority: 0.5,
    cooldownHours: 72,
  };

  /**
   * 久未联系场景配置
   */
  private afterLongSilenceConfig: ScenarioConfig = {
    scenario: 'after_long_silence',
    name: '久未联系',
    triggerCondition: (ctx) => !!ctx.lastMessageGapHours && ctx.lastMessageGapHours >= 48,
    messageTemplates: [
      '好久没聊天了，最近怎么样？',
      '（悄悄探头）想你了~最近在忙什么呀？',
      '最近是不是很忙？有什么烦心事可以跟我聊聊',
      '（委屈巴巴）你是不是把我忘了...',
    ],
    emotion: 'sad',
    priority: 0.8,
    cooldownHours: 24,
  };

  /**
   * 生成关怀消息
   */
  private generateCareMessage(config: ScenarioConfig): CareMessage {
    const template = config.messageTemplates[Math.floor(Math.random() * config.messageTemplates.length)];
    
    // 替换变量
    let content = template;
    if (content.includes('{event}')) {
      content = content.replace('{event}', '纪念日');
    }
    if (content.includes('{topic}')) {
      const topics = ['那件事', '你喜欢的电影', '你的旅行计划'];
      content = content.replace('{topic}', topics[Math.floor(Math.random() * topics.length)]);
    }

    // 生成动作描写
    const actions = this.getActionsForEmotion(config.emotion);
    const action = actions.length > 0 ? actions[Math.floor(Math.random() * actions.length)] : undefined;

    return {
      id: Date.now().toString(),
      scenario: config.name as CareScenario,
      content,
      action,
      emotion: config.emotion,
      priority: config.priority,
      createdAt: new Date(),
    };
  }

  /**
   * 获取适合当前情绪的动作
   */
  private getActionsForEmotion(emotion: EmotionType): string[] {
    const actions: Record<EmotionType, string[]> = {
      happy: ['😊', '（开心地挥挥手）', '✨'],
      calm: ['🙂', '（微微点头）', ''],
      sad: ['🥺', '（小心翼翼地看着你）', '🫂'],
      angry: ['😤', '（气鼓鼓）', ''],
      anxious: ['😰', '（担心地看着你）', '💪'],
      excited: ['🤩', '（眼睛亮亮的）', '🎉'],
      tired: ['😴', '（打了个哈欠）', ''],
      caring: ['🥰', '（温柔地看着你）', '🫂'],
      playful: ['😜', '（做了个鬼脸）', '🤪'],
      romantic: ['😍', '（深情地望着你）', '❤️'],
    };
    return actions[emotion] || [];
  }

  /**
   * 检查是否可以发送特定场景的消息
   */
  private canSendMessage(scenario: string): boolean {
    const lastSent = this.sentMessages.get(scenario);
    if (!lastSent) return true;

    // 检查冷却期
    const cooldownHours = this.getScenarioCooldown(scenario);
    const hoursSinceSent = (Date.now() - lastSent.getTime()) / (1000 * 60 * 60);
    return hoursSinceSent >= cooldownHours;
  }

  /**
   * 获取场景冷却时间
   */
  private getScenarioCooldown(scenario: string): number {
    const cooldowns: Record<string, number> = {
      '深夜关怀': 4,
      '早安问候': 12,
      '晚安问候': 10,
      '工作关怀': 48,
      '纪念日提醒': 24,
      '记忆提醒': 72,
      '久未联系': 24,
    };
    return cooldowns[scenario] || 24;
  }

  /**
   * 记录已发送的消息
   */
  private recordSentMessage(scenario: string): void {
    this.sentMessages.set(scenario, new Date());
  }

  /**
   * 重置所有冷却
   */
  resetCooldowns(): void {
    this.sentMessages.clear();
    this.lastCareTime = null;
  }

  /**
   * 获取关怀消息的显示格式
   */
  formatForDisplay(message: CareMessage): string {
    if (message.action) {
      return `（${message.action}）${message.content}`;
    }
    return message.content;
  }

  /**
   * 判断是否应该显示主动消息的视觉提示
   */
  shouldShowIndicator(context: CareContext): boolean {
    // 深夜或早晨更可能显示主动消息
    if (context.currentHour >= 23 || context.currentHour < 2) return true;
    if (context.currentHour >= 7 && context.currentHour < 9) return true;
    if (context.lastMessageGapHours && context.lastMessageGapHours >= 48) return true;
    return false;
  }
}

export const proactiveCareService = new ProactiveCareService();
