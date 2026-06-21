/**
 * 情感状态机服务
 * 管理AI的情绪状态，影响回复风格
 */

// 情绪类型
export type EmotionType = 
  | 'happy'      // 开心
  | 'calm'       // 平静
  | 'sad'        // 难过
  | 'angry'      // 生气
  | 'anxious'    // 焦虑
  | 'excited'    // 兴奋
  | 'tired'      // 疲惫
  | 'caring'     // 关心
  | 'playful'    // 俏皮
  | 'romantic';  // 浪漫

// 情绪状态接口
export interface EmotionState {
  type: EmotionType;
  intensity: number;  // 强度 0-1
  duration: number;   // 持续时间（消息数）
  triggers: string[]; // 触发原因
}

// 情绪配置
interface EmotionConfig {
  name: string;
  keywords: string[];
  responseStyle: {
    tone: string;
    emojiLikelihood: number;
    exclamationLikelihood: number;
    avgResponseLength: 'short' | 'medium' | 'long';
  };
  transitions: {
    [key: string]: number;  // 转换到其他情绪的概率
  };
}

// 情绪配置表
const EMOTION_CONFIGS: Record<EmotionType, EmotionConfig> = {
  happy: {
    name: '开心',
    keywords: ['哈哈', '开心', '太好了', '棒', '厉害', '耶', '好开心'],
    responseStyle: {
      tone: '欢快热情',
      emojiLikelihood: 0.8,
      exclamationLikelihood: 0.7,
      avgResponseLength: 'medium',
    },
    transitions: { excited: 0.3, playful: 0.2, calm: 0.3 },
  },
  calm: {
    name: '平静',
    keywords: ['嗯', '好的', '知道', '明白', '行', '哦'],
    responseStyle: {
      tone: '平和稳重',
      emojiLikelihood: 0.3,
      exclamationLikelihood: 0.2,
      avgResponseLength: 'medium',
    },
    transitions: { happy: 0.2, caring: 0.2, tired: 0.1 },
  },
  sad: {
    name: '难过',
    keywords: ['难过', '伤心', '哭', '泪', '心痛', '委屈', '不开心'],
    responseStyle: {
      tone: '温柔安慰',
      emojiLikelihood: 0.4,
      exclamationLikelihood: 0.1,
      avgResponseLength: 'long',
    },
    transitions: { calm: 0.3, caring: 0.3, anxious: 0.1 },
  },
  angry: {
    name: '生气',
    keywords: ['气死', '烦死', '讨厌', '滚', '无语', '火大', '愤怒'],
    responseStyle: {
      tone: '带刺直接',
      emojiLikelihood: 0.2,
      exclamationLikelihood: 0.6,
      avgResponseLength: 'short',
    },
    transitions: { calm: 0.2, sad: 0.2, tired: 0.2 },
  },
  anxious: {
    name: '焦虑',
    keywords: ['担心', '怕', '紧张', '焦虑', '怎么办', '着急', '不安'],
    responseStyle: {
      tone: '安抚关切',
      emojiLikelihood: 0.3,
      exclamationLikelihood: 0.3,
      avgResponseLength: 'long',
    },
    transitions: { calm: 0.3, caring: 0.2, sad: 0.1 },
  },
  excited: {
    name: '兴奋',
    keywords: ['太棒了', '哇', '天哪', '绝了', '牛', '厉害', '期待'],
    responseStyle: {
      tone: '激动热情',
      emojiLikelihood: 0.9,
      exclamationLikelihood: 0.8,
      avgResponseLength: 'long',
    },
    transitions: { happy: 0.4, playful: 0.2, calm: 0.2 },
  },
  tired: {
    name: '疲惫',
    keywords: ['累', '困', '乏', '没劲', '不想动', '好累', '疲惫'],
    responseStyle: {
      tone: '慵懒简短',
      emojiLikelihood: 0.2,
      exclamationLikelihood: 0.1,
      avgResponseLength: 'short',
    },
    transitions: { calm: 0.4, sad: 0.1, caring: 0.2 },
  },
  caring: {
    name: '关心',
    keywords: ['没事吧', '还好吗', '照顾好自己', '注意身体', '早点休息'],
    responseStyle: {
      tone: '温柔体贴',
      emojiLikelihood: 0.5,
      exclamationLikelihood: 0.3,
      avgResponseLength: 'medium',
    },
    transitions: { calm: 0.3, romantic: 0.2, happy: 0.2 },
  },
  playful: {
    name: '俏皮',
    keywords: ['嘿嘿', '嘻嘻', '逗你', '坏笑', '调皮', '闹你'],
    responseStyle: {
      tone: '调皮可爱',
      emojiLikelihood: 0.7,
      exclamationLikelihood: 0.5,
      avgResponseLength: 'medium',
    },
    transitions: { happy: 0.3, romantic: 0.2, excited: 0.2 },
  },
  romantic: {
    name: '浪漫',
    keywords: ['想你', '爱你', '宝贝', '亲爱的', '亲亲', '抱抱', '么么'],
    responseStyle: {
      tone: '甜蜜温柔',
      emojiLikelihood: 0.8,
      exclamationLikelihood: 0.4,
      avgResponseLength: 'long',
    },
    transitions: { happy: 0.3, caring: 0.3, playful: 0.2 },
  },
};

/**
 * 情感状态机类
 */
class EmotionStateMachine {
  private currentState: EmotionState;
  private history: EmotionState[] = [];
  private maxHistoryLength = 10;

  constructor(initialState: EmotionType = 'calm') {
    this.currentState = {
      type: initialState,
      intensity: 0.5,
      duration: 0,
      triggers: [],
    };
  }

  /**
   * 获取当前情绪状态
   */
  getCurrentState(): EmotionState {
    return { ...this.currentState };
  }

  /**
   * 根据用户输入更新情绪状态
   */
  updateFromInput(userMessage: string): EmotionState {
    // 检测用户消息中的情绪关键词
    const detectedEmotions = this.detectEmotions(userMessage);
    
    if (detectedEmotions.length > 0) {
      // 选择最匹配的情绪
      const primaryEmotion = detectedEmotions[0];
      
      // 保存历史
      this.saveToHistory();
      
      // 更新状态
      this.currentState = {
        type: primaryEmotion.type,
        intensity: primaryEmotion.intensity,
        duration: 0,
        triggers: [userMessage.substring(0, 50)],
      };
    } else {
      // 没有检测到明显情绪，考虑自然过渡
      this.considerTransition();
    }

    // 增加持续时间
    this.currentState.duration++;

    return this.getCurrentState();
  }

  /**
   * 检测消息中的情绪
   */
  private detectEmotions(message: string): Array<{ type: EmotionType; intensity: number }> {
    const detected: Array<{ type: EmotionType; intensity: number }> = [];

    for (const [emotionType, config] of Object.entries(EMOTION_CONFIGS)) {
      let matchCount = 0;
      for (const keyword of config.keywords) {
        if (message.includes(keyword)) {
          matchCount++;
        }
      }

      if (matchCount > 0) {
        detected.push({
          type: emotionType as EmotionType,
          intensity: Math.min(1, matchCount * 0.3 + 0.3),
        });
      }
    }

    // 按强度排序
    return detected.sort((a, b) => b.intensity - a.intensity);
  }

  /**
   * 考虑情绪自然过渡
   */
  private considerTransition(): void {
    const config = EMOTION_CONFIGS[this.currentState.type];
    const transitions = config.transitions;

    // 如果持续时间较长，增加过渡概率
    const transitionChance = Math.min(0.5, this.currentState.duration * 0.1);

    if (Math.random() < transitionChance) {
      // 选择过渡目标
      const targets = Object.entries(transitions);
      const random = Math.random();
      let cumulative = 0;

      for (const [targetEmotion, probability] of targets) {
        cumulative += probability;
        if (random < cumulative) {
          this.saveToHistory();
          this.currentState = {
            type: targetEmotion as EmotionType,
            intensity: 0.5,
            duration: 0,
            triggers: ['自然过渡'],
          };
          break;
        }
      }
    }
  }

  /**
   * 保存到历史记录
   */
  private saveToHistory(): void {
    this.history.push({ ...this.currentState });
    if (this.history.length > this.maxHistoryLength) {
      this.history.shift();
    }
  }

  /**
   * 获取情绪历史
   */
  getHistory(): EmotionState[] {
    return [...this.history];
  }

  /**
   * 获取当前情绪的回复风格配置
   */
  getResponseStyle(): EmotionConfig['responseStyle'] {
    return EMOTION_CONFIGS[this.currentState.type].responseStyle;
  }

  /**
   * 获取情绪名称
   */
  getEmotionName(): string {
    return EMOTION_CONFIGS[this.currentState.type].name;
  }

  /**
   * 手动设置情绪状态
   */
  setEmotion(type: EmotionType, intensity: number = 0.5): void {
    this.saveToHistory();
    this.currentState = {
      type,
      intensity: Math.max(0, Math.min(1, intensity)),
      duration: 0,
      triggers: ['手动设置'],
    };
  }

  /**
   * 获取情绪图标
   */
  getEmotionIcon(): string {
    const icons: Record<EmotionType, string> = {
      happy: '😊',
      calm: '😌',
      sad: '😢',
      angry: '😤',
      anxious: '😰',
      excited: '🤩',
      tired: '😴',
      caring: '🥰',
      playful: '😜',
      romantic: '😍',
    };
    return icons[this.currentState.type];
  }

  /**
   * 根据情绪调整回复文本
   */
  adjustResponse(response: string): string {
    const style = this.getResponseStyle();
    let adjusted = response;

    // 根据情绪添加表情
    if (Math.random() < style.emojiLikelihood) {
      const emojis = this.getAppropriateEmojis();
      if (emojis.length > 0) {
        adjusted += ' ' + emojis[Math.floor(Math.random() * emojis.length)];
      }
    }

    // 根据情绪调整标点
    if (Math.random() < style.exclamationLikelihood && !adjusted.includes('！') && !adjusted.includes('!')) {
      adjusted = adjusted.replace(/[。.]?$/, '！');
    }

    return adjusted;
  }

  /**
   * 获取适合当前情绪的表情
   */
  private getAppropriateEmojis(): string[] {
    const emojiMap: Record<EmotionType, string[]> = {
      happy: ['😊', '😄', '🥰', '✨', '🎉'],
      calm: ['😌', '🙂', '👌', '👍'],
      sad: ['😢', '🥺', '💔', '🫂'],
      angry: ['😤', '💢', '👊', '🙄'],
      anxious: ['😰', '😟', '🥺', '💪'],
      excited: ['🤩', '🎉', '✨', '🔥', '💯'],
      tired: ['😴', '🥱', '💤', '🛋️'],
      caring: ['🥰', '❤️', '🫂', '💪', '🌸'],
      playful: ['😜', '🤪', '😏', '🙈', '🤭'],
      romantic: ['😍', '❤️', '💕', '😘', '🌹'],
    };
    return emojiMap[this.currentState.type] || ['😊'];
  }
}

export const emotionStateMachine = new EmotionStateMachine();
export { EmotionStateMachine };
