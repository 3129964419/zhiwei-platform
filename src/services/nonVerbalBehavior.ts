/**
 * 非语言行为模拟服务
 * 在文字中加入动作描写、表情包推荐，增强真实感
 */

import { type EmotionType } from './emotionStateMachine';

// 动作描写类型
export type ActionType = 
  | 'gesture'     // 手势动作
  | 'expression'  // 表情神态
  | 'posture'     // 姿态动作
  | 'sound'       // 声音语气
  | 'environment'; // 环境互动

// 动作描写接口
export interface ActionDescription {
  type: ActionType;
  content: string;
  position: 'prefix' | 'suffix' | 'inline';
  emotion: EmotionType;
}

// 表情包推荐接口
export interface StickerRecommendation {
  id: string;
  url?: string;
  emoji: string;
  description: string;
  emotion: EmotionType;
  usage: 'positive' | 'negative' | 'neutral';
}

// 动作描写库
const ACTION_LIBRARY: Record<EmotionType, ActionDescription[]> = {
  happy: [
    { type: 'expression', content: '眼睛弯成了月牙', position: 'suffix', emotion: 'happy' },
    { type: 'gesture', content: '开心地挥了挥手', position: 'prefix', emotion: 'happy' },
    { type: 'sound', content: '咯咯地笑了起来', position: 'suffix', emotion: 'happy' },
    { type: 'posture', content: '兴奋地跳了一下', position: 'prefix', emotion: 'happy' },
    { type: 'expression', content: '嘴角忍不住上扬', position: 'inline', emotion: 'happy' },
  ],
  calm: [
    { type: 'posture', content: '靠在椅背上', position: 'prefix', emotion: 'calm' },
    { type: 'expression', content: '微微点了点头', position: 'prefix', emotion: 'calm' },
    { type: 'sound', content: '轻声说道', position: 'prefix', emotion: 'calm' },
    { type: 'gesture', content: '慢慢地眨了眨眼', position: 'inline', emotion: 'calm' },
  ],
  sad: [
    { type: 'expression', content: '眼眶微微泛红', position: 'prefix', emotion: 'sad' },
    { type: 'sound', content: '声音有些哽咽', position: 'prefix', emotion: 'sad' },
    { type: 'posture', content: '低下了头', position: 'prefix', emotion: 'sad' },
    { type: 'gesture', content: '轻轻擦了擦眼角', position: 'suffix', emotion: 'sad' },
    { type: 'expression', content: '叹了口气', position: 'prefix', emotion: 'sad' },
  ],
  angry: [
    { type: 'expression', content: '皱起了眉头', position: 'prefix', emotion: 'angry' },
    { type: 'gesture', content: '双手抱胸', position: 'prefix', emotion: 'angry' },
    { type: 'sound', content: '语气变得生硬', position: 'prefix', emotion: 'angry' },
    { type: 'posture', content: '转过身去', position: 'suffix', emotion: 'angry' },
  ],
  anxious: [
    { type: 'gesture', content: '手指不安地敲着桌面', position: 'prefix', emotion: 'anxious' },
    { type: 'expression', content: '眉头紧锁', position: 'prefix', emotion: 'anxious' },
    { type: 'sound', content: '声音有些颤抖', position: 'prefix', emotion: 'anxious' },
    { type: 'posture', content: '来回踱步', position: 'prefix', emotion: 'anxious' },
  ],
  excited: [
    { type: 'gesture', content: '激动地拍了拍手', position: 'prefix', emotion: 'excited' },
    { type: 'expression', content: '眼睛闪闪发光', position: 'inline', emotion: 'excited' },
    { type: 'sound', content: '声音都提高了八度', position: 'prefix', emotion: 'excited' },
    { type: 'posture', content: '整个人都跳了起来', position: 'suffix', emotion: 'excited' },
  ],
  tired: [
    { type: 'expression', content: '揉了揉惺忪的睡眼', position: 'prefix', emotion: 'tired' },
    { type: 'sound', content: '打了个哈欠', position: 'prefix', emotion: 'tired' },
    { type: 'posture', content: '懒洋洋地靠在沙发上', position: 'prefix', emotion: 'tired' },
    { type: 'gesture', content: '伸了个懒腰', position: 'suffix', emotion: 'tired' },
  ],
  caring: [
    { type: 'gesture', content: '轻轻摸了摸头', position: 'prefix', emotion: 'caring' },
    { type: 'expression', content: '眼神温柔', position: 'inline', emotion: 'caring' },
    { type: 'sound', content: '柔声说道', position: 'prefix', emotion: 'caring' },
    { type: 'posture', content: '凑近了一些', position: 'prefix', emotion: 'caring' },
  ],
  playful: [
    { type: 'expression', content: '眨了眨眼', position: 'suffix', emotion: 'playful' },
    { type: 'gesture', content: '做了个鬼脸', position: 'suffix', emotion: 'playful' },
    { type: 'sound', content: '嘿嘿一笑', position: 'prefix', emotion: 'playful' },
    { type: 'posture', content: '歪着头', position: 'prefix', emotion: 'playful' },
  ],
  romantic: [
    { type: 'expression', content: '眼神深情', position: 'inline', emotion: 'romantic' },
    { type: 'gesture', content: '轻轻握住手', position: 'prefix', emotion: 'romantic' },
    { type: 'sound', content: '声音变得温柔', position: 'prefix', emotion: 'romantic' },
    { type: 'posture', content: '靠得更近了', position: 'prefix', emotion: 'romantic' },
  ],
};

// 表情包推荐库
const STICKER_LIBRARY: Record<EmotionType, StickerRecommendation[]> = {
  happy: [
    { id: 'h1', emoji: '😊', description: '开心微笑', emotion: 'happy', usage: 'positive' },
    { id: 'h2', emoji: '😄', description: '大笑', emotion: 'happy', usage: 'positive' },
    { id: 'h3', emoji: '🥰', description: '可爱开心', emotion: 'happy', usage: 'positive' },
    { id: 'h4', emoji: '✨', description: '闪闪发光', emotion: 'happy', usage: 'positive' },
    { id: 'h5', emoji: '🎉', description: '庆祝', emotion: 'happy', usage: 'positive' },
  ],
  calm: [
    { id: 'c1', emoji: '😌', description: '平静淡定', emotion: 'calm', usage: 'neutral' },
    { id: 'c2', emoji: '🙂', description: '微笑', emotion: 'calm', usage: 'positive' },
    { id: 'c3', emoji: '👌', description: '好的', emotion: 'calm', usage: 'neutral' },
    { id: 'c4', emoji: '👍', description: '点赞', emotion: 'calm', usage: 'positive' },
  ],
  sad: [
    { id: 's1', emoji: '😢', description: '难过', emotion: 'sad', usage: 'negative' },
    { id: 's2', emoji: '🥺', description: '委屈', emotion: 'sad', usage: 'negative' },
    { id: 's3', emoji: '💔', description: '心碎', emotion: 'sad', usage: 'negative' },
    { id: 's4', emoji: '🫂', description: '抱抱', emotion: 'sad', usage: 'neutral' },
  ],
  angry: [
    { id: 'a1', emoji: '😤', description: '生气', emotion: 'angry', usage: 'negative' },
    { id: 'a2', emoji: '💢', description: '愤怒', emotion: 'angry', usage: 'negative' },
    { id: 'a3', emoji: '👊', description: '拳头', emotion: 'angry', usage: 'negative' },
    { id: 'a4', emoji: '🙄', description: '翻白眼', emotion: 'angry', usage: 'negative' },
  ],
  anxious: [
    { id: 'ax1', emoji: '😰', description: '焦虑', emotion: 'anxious', usage: 'negative' },
    { id: 'ax2', emoji: '😟', description: '担心', emotion: 'anxious', usage: 'negative' },
    { id: 'ax3', emoji: '🥺', description: '紧张', emotion: 'anxious', usage: 'negative' },
    { id: 'ax4', emoji: '💪', description: '加油', emotion: 'anxious', usage: 'positive' },
  ],
  excited: [
    { id: 'e1', emoji: '🤩', description: '激动', emotion: 'excited', usage: 'positive' },
    { id: 'e2', emoji: '🎉', description: '庆祝', emotion: 'excited', usage: 'positive' },
    { id: 'e3', emoji: '✨', description: '闪亮', emotion: 'excited', usage: 'positive' },
    { id: 'e4', emoji: '🔥', description: '火热', emotion: 'excited', usage: 'positive' },
    { id: 'e5', emoji: '💯', description: '满分', emotion: 'excited', usage: 'positive' },
  ],
  tired: [
    { id: 't1', emoji: '😴', description: '困了', emotion: 'tired', usage: 'neutral' },
    { id: 't2', emoji: '🥱', description: '打哈欠', emotion: 'tired', usage: 'neutral' },
    { id: 't3', emoji: '💤', description: '睡觉', emotion: 'tired', usage: 'neutral' },
    { id: 't4', emoji: '🛋️', description: '休息', emotion: 'tired', usage: 'neutral' },
  ],
  caring: [
    { id: 'ca1', emoji: '🥰', description: '爱意', emotion: 'caring', usage: 'positive' },
    { id: 'ca2', emoji: '❤️', description: '爱心', emotion: 'caring', usage: 'positive' },
    { id: 'ca3', emoji: '🫂', description: '拥抱', emotion: 'caring', usage: 'positive' },
    { id: 'ca4', emoji: '💪', description: '鼓励', emotion: 'caring', usage: 'positive' },
    { id: 'ca5', emoji: '🌸', description: '温柔', emotion: 'caring', usage: 'positive' },
  ],
  playful: [
    { id: 'p1', emoji: '😜', description: '调皮', emotion: 'playful', usage: 'positive' },
    { id: 'p2', emoji: '🤪', description: '搞怪', emotion: 'playful', usage: 'positive' },
    { id: 'p3', emoji: '😏', description: '坏笑', emotion: 'playful', usage: 'neutral' },
    { id: 'p4', emoji: '🙈', description: '捂脸', emotion: 'playful', usage: 'positive' },
    { id: 'p5', emoji: '🤭', description: '偷笑', emotion: 'playful', usage: 'positive' },
  ],
  romantic: [
    { id: 'r1', emoji: '😍', description: '心动', emotion: 'romantic', usage: 'positive' },
    { id: 'r2', emoji: '❤️', description: '爱心', emotion: 'romantic', usage: 'positive' },
    { id: 'r3', emoji: '💕', description: '双心', emotion: 'romantic', usage: 'positive' },
    { id: 'r4', emoji: '😘', description: '亲亲', emotion: 'romantic', usage: 'positive' },
    { id: 'r5', emoji: '🌹', description: '玫瑰', emotion: 'romantic', usage: 'positive' },
  ],
};

/**
 * 非语言行为模拟服务类
 */
class NonVerbalBehaviorService {
  /**
   * 为消息添加动作描写
   */
  addActionDescription(
    message: string,
    emotion: EmotionType,
    probability: number = 0.3
  ): string {
    // 根据概率决定是否添加动作
    if (Math.random() > probability) {
      return message;
    }

    const actions = ACTION_LIBRARY[emotion] || ACTION_LIBRARY.calm;
    const action = actions[Math.floor(Math.random() * actions.length)];

    // 根据位置插入动作描写
    switch (action.position) {
      case 'prefix':
        return `（${action.content}）${message}`;
      case 'suffix':
        return `${message}（${action.content}）`;
      case 'inline':
        // 在合适的位置插入（比如句号后）
        const sentences = message.split(/([。！？\n])/);
        if (sentences.length >= 2) {
          sentences.splice(2, 0, `（${action.content}）`);
          return sentences.join('');
        }
        return `（${action.content}）${message}`;
      default:
        return message;
    }
  }

  /**
   * 获取推荐的表情包
   */
  getRecommendedStickers(
    emotion: EmotionType,
    count: number = 3
  ): StickerRecommendation[] {
    const stickers = STICKER_LIBRARY[emotion] || STICKER_LIBRARY.calm;
    
    // 随机选择指定数量的表情包
    const shuffled = [...stickers].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * 为消息添加表情
   */
  addEmoji(
    message: string,
    emotion: EmotionType,
    probability: number = 0.5
  ): string {
    if (Math.random() > probability) {
      return message;
    }

    const stickers = STICKER_LIBRARY[emotion] || STICKER_LIBRARY.calm;
    const sticker = stickers[Math.floor(Math.random() * stickers.length)];

    // 避免重复添加相同的表情
    if (message.includes(sticker.emoji)) {
      return message;
    }

    // 根据消息结尾决定添加位置
    const lastChar = message.slice(-1);
    if (/[。！？.!?]/.test(lastChar)) {
      return `${message} ${sticker.emoji}`;
    } else {
      return `${message} ${sticker.emoji}`;
    }
  }

  /**
   * 完整增强消息
   */
  enhanceMessage(
    message: string,
    emotion: EmotionType,
    options: {
      addAction?: boolean;
      addEmoji?: boolean;
      actionProbability?: number;
      emojiProbability?: number;
    } = {}
  ): {
    enhancedMessage: string;
    actions: ActionDescription[];
    stickers: StickerRecommendation[];
  } {
    const {
      addAction = true,
      addEmoji = true,
      actionProbability = 0.3,
      emojiProbability = 0.5,
    } = options;

    let enhancedMessage = message;
    const appliedActions: ActionDescription[] = [];
    const recommendedStickers: StickerRecommendation[] = [];

    // 添加动作描写
    if (addAction) {
      const actions = ACTION_LIBRARY[emotion] || ACTION_LIBRARY.calm;
      const action = actions[Math.floor(Math.random() * actions.length)];
      
      if (Math.random() < actionProbability) {
        enhancedMessage = this.addActionDescription(enhancedMessage, emotion, 1);
        appliedActions.push(action);
      }
    }

    // 添加表情
    if (addEmoji) {
      enhancedMessage = this.addEmoji(enhancedMessage, emotion, emojiProbability);
    }

    // 获取推荐表情包
    recommendedStickers.push(...this.getRecommendedStickers(emotion));

    return {
      enhancedMessage,
      actions: appliedActions,
      stickers: recommendedStickers,
    };
  }

  /**
   * 根据消息内容判断是否适合添加动作
   */
  shouldAddAction(message: string): boolean {
    // 太短的消息不适合添加动作
    if (message.length < 5) return false;
    
    // 已经有动作描写的消息不再添加
    if (/[（(].*[）)]/.test(message)) return false;
    
    return true;
  }

  /**
   * 生成动作描写（用于UI展示）
   */
  generateActionPreview(emotion: EmotionType): string[] {
    const actions = ACTION_LIBRARY[emotion] || ACTION_LIBRARY.calm;
    return actions.slice(0, 3).map(a => a.content);
  }
}

export const nonVerbalBehaviorService = new NonVerbalBehaviorService();
