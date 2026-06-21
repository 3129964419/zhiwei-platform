/**
 * 思维链(CoT)服务
 * 让AI在回复前先生成"内心独白"，提升回复的情感真实度
 */

import { emotionStateMachine, type EmotionType } from './emotionStateMachine';
import type { PersonalityProfile, MemoryAnchor } from './personalityAnalysis';

// 思维链步骤
export interface ThoughtStep {
  type: 'observation' | 'emotion' | 'memory' | 'reasoning' | 'decision';
  content: string;
}

// 思维链结果
export interface ThoughtChain {
  steps: ThoughtStep[];
  finalThought: string;
  suggestedResponse: string;
  emotionContext: {
    current: EmotionType;
    intensity: number;
  };
}

// 思维模板
interface ThoughtTemplate {
  observation: string[];
  emotion: string[];
  memory: string[];
  reasoning: string[];
  decision: string[];
}

// 不同场景的思维模板
const THOUGHT_TEMPLATES: Record<string, ThoughtTemplate> = {
  greeting: {
    observation: ['用户主动打招呼', '用户可能想聊天', '这是一个新的对话开始'],
    emotion: ['当前情绪是{emotion}', '应该保持友好', '可以稍微热情一点'],
    memory: ['我们之前聊过{topic}', '用户喜欢{preference}', '上次提到{event}'],
    reasoning: ['用户可能只是想聊聊天', '应该主动引导话题', '可以关心一下近况'],
    decision: ['用轻松的语气回复', '可以问问最近怎么样', '保持温暖的态度'],
  },
  complaint: {
    observation: ['用户在抱怨/吐槽', '用户情绪可能不太好', '需要倾听和理解'],
    emotion: ['应该表现出关心', '不能讲大道理', '要给情绪价值'],
    memory: ['用户之前也提过类似的事', '这件事对用户很重要', '用户需要的是支持'],
    reasoning: ['用户需要的是被理解', '不能急着给建议', '先认同用户的感受'],
    decision: ['先表示理解', '可以适当吐槽对方', '给用户情绪支持'],
  },
  question: {
    observation: ['用户在问问题', '用户需要信息或建议', '要认真对待'],
    emotion: ['保持耐心', '认真思考', '给出有价值的回答'],
    memory: ['用户之前问过类似的问题', '用户对这个领域感兴趣', '可以结合之前的对话'],
    reasoning: ['用户是真心想知道', '应该给出详细的回答', '可以举例子'],
    decision: ['认真回答问题', '可以补充相关建议', '问问是否还有疑问'],
  },
  sharing: {
    observation: ['用户在分享事情', '用户想让我知道这件事', '可能是开心或难过的事'],
    emotion: ['应该表现出兴趣', '跟着用户的情绪走', '给予适当的反应'],
    memory: ['这和之前的{event}有关', '用户一直很关注这个', '这是我们共同的回忆'],
    reasoning: ['用户分享是因为信任我', '应该认真回应', '可以表达自己的感受'],
    decision: ['表现出兴趣和关心', '给出真诚的反应', '可以追问细节'],
  },
  silence: {
    observation: ['用户回复很短', '可能在忙', '可能情绪不高'],
    emotion: ['不要太粘人', '保持适度关心', '给用户空间'],
    memory: ['用户有时候就这样', '可能最近比较累', '不需要太担心'],
    reasoning: ['短回复不代表不感兴趣', '可能只是暂时没话说', '保持轻松'],
    decision: ['简短回复就好', '可以发个可爱的表情', '不要追问太多'],
  },
};

/**
 * 思维链服务类
 */
class ChainOfThoughtService {
  /**
   * 生成思维链
   */
  generateThoughtChain(
    userMessage: string,
    personality?: PersonalityProfile,
    recentMemories?: MemoryAnchor[]
  ): ThoughtChain {
    const steps: ThoughtStep[] = [];
    const currentEmotion = emotionStateMachine.getCurrentState();

    // 第一步：观察用户输入
    const observation = this.generateObservation(userMessage);
    steps.push({ type: 'observation', content: observation });

    // 第二步：分析情绪
    const emotionThought = this.generateEmotionThought(currentEmotion.type, userMessage);
    steps.push({ type: 'emotion', content: emotionThought });

    // 第三步：回忆相关信息
    const memoryThought = this.generateMemoryThought(personality, recentMemories, userMessage);
    steps.push({ type: 'memory', content: memoryThought });

    // 第四步：推理最佳回应方式
    const reasoning = this.generateReasoning(observation, emotionThought, memoryThought);
    steps.push({ type: 'reasoning', content: reasoning });

    // 第五步：决定回复策略
    const decision = this.generateDecision(reasoning, currentEmotion.type);
    steps.push({ type: 'decision', content: decision });

    // 生成最终内心独白
    const finalThought = this.combineThoughts(steps);

    // 生成建议回复
    const suggestedResponse = this.generateSuggestedResponse(decision, currentEmotion.type, personality);

    return {
      steps,
      finalThought,
      suggestedResponse,
      emotionContext: {
        current: currentEmotion.type,
        intensity: currentEmotion.intensity,
      },
    };
  }

  /**
   * 生成观察步骤
   */
  private generateObservation(message: string): string {
    const length = message.length;
    const hasQuestion = /[？?]/.test(message);
    const hasExclamation = /[！!]/.test(message);
    const hasEmoji = /[\u{1F600}-\u{1F64F}]/u.test(message);

    let observation = '';

    // 分析消息长度
    if (length <= 5) {
      observation = '用户回复很短，只有几个字';
    } else if (length <= 20) {
      observation = '用户发了一段简短的话';
    } else if (length <= 50) {
      observation = '用户发了一段中等长度的话，比较认真';
    } else {
      observation = '用户发了一大段话，很认真地表达';
    }

    // 分析标点
    if (hasQuestion) {
      observation += '，并且在问问题';
    }
    if (hasExclamation) {
      observation += '，情绪比较强烈';
    }
    if (hasEmoji) {
      observation += '，还用了表情';
    }

    return observation;
  }

  /**
   * 生成情绪思考步骤
   */
  private generateEmotionThought(emotion: EmotionType, message: string): string {
    const emotionNames: Record<EmotionType, string> = {
      happy: '开心',
      calm: '平静',
      sad: '难过',
      angry: '生气',
      anxious: '焦虑',
      excited: '兴奋',
      tired: '疲惫',
      caring: '关心',
      playful: '俏皮',
      romantic: '浪漫',
    };

    // 根据用户消息调整情绪思考
    if (/累|困|乏/.test(message)) {
      return `用户看起来很累，我应该温柔一点，不要太吵`;
    }
    if (/难过|伤心|哭/.test(message)) {
      return `用户心情不好，我要安慰ta，不能讲大道理`;
    }
    if (/哈哈|嘿嘿|开心/.test(message)) {
      return `用户很开心，我可以跟着一起开心，保持轻松愉快的氛围`;
    }
    if (/气死|烦|讨厌/.test(message)) {
      return `用户在生气或抱怨，我要站在ta这边，一起吐槽`;
    }

    return `当前我的情绪是${emotionNames[emotion]}，应该用相应的语气回复`;
  }

  /**
   * 生成记忆思考步骤
   */
  private generateMemoryThought(
    personality?: PersonalityProfile,
    memories?: MemoryAnchor[],
    message?: string
  ): string {
    if (!personality && !memories) {
      return '暂时没有相关的记忆信息';
    }

    const thoughts: string[] = [];

    // 从性格画像中提取信息
    if (personality?.languageFingerprint) {
      const { catchphrases, toneStyle } = personality.languageFingerprint;
      if (catchphrases.length > 0) {
        thoughts.push(`ta喜欢说"${catchphrases[0]}"这样的话`);
      }
      if (toneStyle.warmth > 0.7) {
        thoughts.push('ta是一个很温暖的人');
      }
    }

    // 从记忆锚点中提取信息
    if (memories && memories.length > 0) {
      const relevantMemory = memories.find(m => 
        message?.includes(m.content) || m.importance > 0.7
      );
      if (relevantMemory) {
        thoughts.push(`记得${relevantMemory.content}`);
      }
    }

    return thoughts.length > 0 
      ? thoughts.join('，') 
      : '没有特别相关的记忆';
  }

  /**
   * 生成推理步骤
   */
  private generateReasoning(
    observation: string,
    emotionThought: string,
    memoryThought: string
  ): string {
    // 根据观察和情绪推理最佳回应方式
    if (observation.includes('很短')) {
      return '用户可能比较忙或者情绪不高，不需要回复太长，简短温暖就好';
    }
    if (observation.includes('问问题')) {
      return '用户需要答案，要认真回答，但不要太啰嗦';
    }
    if (observation.includes('情绪比较强烈')) {
      return '用户情绪激动，要给足情绪价值，认同ta的感受';
    }
    if (observation.includes('一大段话')) {
      return '用户很认真地分享，我也要认真回应，不能敷衍';
    }

    return '保持自然舒适的对话节奏，真诚地回应';
  }

  /**
   * 生成决策步骤
   */
  private generateDecision(reasoning: string, emotion: EmotionType): string {
    if (reasoning.includes('简短温暖')) {
      return '用一个简短但温暖的回复，可以加个可爱的表情';
    }
    if (reasoning.includes('认真回答')) {
      return '给出详细的回答，可以补充一些相关的建议';
    }
    if (reasoning.includes('情绪价值')) {
      return '先认同用户的感受，然后给予支持，可以适当吐槽';
    }
    if (reasoning.includes('认真回应')) {
      return '认真阅读用户的内容，给出真诚的反馈，可以追问细节';
    }

    return '用自然的方式回复，保持对话的舒适感';
  }

  /**
   * 组合思考步骤成完整的内心独白
   */
  private combineThoughts(steps: ThoughtStep[]): string {
    const parts = steps.map(step => {
      switch (step.type) {
        case 'observation':
          return `【观察】${step.content}`;
        case 'emotion':
          return `【感受】${step.content}`;
        case 'memory':
          return `【回忆】${step.content}`;
        case 'reasoning':
          return `【思考】${step.content}`;
        case 'decision':
          return `【决定】${step.content}`;
        default:
          return step.content;
      }
    });

    return parts.join('\n');
  }

  /**
   * 生成建议回复
   */
  private generateSuggestedResponse(
    decision: string,
    emotion: EmotionType,
    personality?: PersonalityProfile
  ): string {
    // 这里返回的是回复策略，实际回复由AI生成
    // 但我们可以根据决策给出一些回复模板建议

    const templates: Record<string, string[]> = {
      '简短温暖': [
        '嗯嗯~',
        '好的呢',
        '收到~',
        '好哒',
      ],
      '认真回答': [
        '让我想想...',
        '关于这个...',
        '其实...',
      ],
      '情绪价值': [
        '我懂你！',
        '确实是这样',
        '太理解了',
      ],
      '认真回应': [
        '哇，这个...',
        '真的吗！',
        '听起来...',
      ],
    };

    for (const [key, values] of Object.entries(templates)) {
      if (decision.includes(key)) {
        return values[Math.floor(Math.random() * values.length)];
      }
    }

    return '';
  }

  /**
   * 格式化思维链为提示词
   */
  formatAsPrompt(thoughtChain: ThoughtChain): string {
    return `
【内心独白】
${thoughtChain.finalThought}

【回复策略】
${thoughtChain.steps.find(s => s.type === 'decision')?.content}

请基于以上思考，用自然、真诚的方式回复用户。注意：
1. 语气要符合当前情绪状态
2. 回复要像真人一样自然
3. 可以适当加入口头禅或习惯用语
4. 不要太长，保持舒适的对话节奏
`.trim();
  }
}

export const chainOfThoughtService = new ChainOfThoughtService();
