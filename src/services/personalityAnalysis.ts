/**
 * 性格分析服务
 * 从聊天记录中提取语言指纹、关系图谱、记忆锚点等核心特征
 */

// 语言指纹接口
export interface LanguageFingerprint {
  // 口头禅和常用表达
  catchphrases: string[];
  // 表情包使用习惯
  emojiPatterns: {
    favorites: string[];      // 常用表情
    frequency: number;        // 使用频率
    contexts: string[];       // 使用场景
  };
  // 标点符号习惯
  punctuationStyle: {
    preferredPunctuation: string;  // 偏好的标点（如波浪号~、句号。）
    exclamationFrequency: number;  // 感叹号使用频率
    questionFrequency: number;     // 问号使用频率
  };
  // 打字习惯
  typingStyle: {
    avgMessageLength: number;      // 平均消息长度
    shortMessageRatio: number;     // 短消息比例
    paragraphPreference: boolean;  // 是否喜欢分段
  };
  // 语气特征
  toneStyle: {
    formality: 'formal' | 'casual' | 'mixed';  // 正式程度
    warmth: number;      // 温暖度 0-1
    humor: number;       // 幽默感 0-1
    directness: number;  // 直接程度 0-1
  };
}

// 关系节点接口
export interface RelationshipNode {
  name: string;           // 对方称呼
  relationship: string;   // 关系类型（父母、朋友、恋人等）
  attitude: string;       // 态度描述
  communicationStyle: string;  // 沟通风格
  topics: string[];       // 常聊话题
}

// 关系图谱接口
export interface RelationshipGraph {
  nodes: RelationshipNode[];
  defaultAttitude: string;  // 默认态度
}

// 记忆锚点接口
export interface MemoryAnchor {
  id: string;
  type: 'event' | 'preference' | 'anniversary' | 'place' | 'food' | 'hobby';
  content: string;
  importance: number;  // 重要程度 0-1
  timestamp?: Date;
  relatedPeople?: string[];
  emotionalValue?: 'positive' | 'negative' | 'neutral';
}

// 性格画像接口
export interface PersonalityProfile {
  id: string;
  userId: string;
  agentId: string;
  languageFingerprint: LanguageFingerprint;
  relationshipGraph: RelationshipGraph;
  memoryAnchors: MemoryAnchor[];
  emotionalBaseline: EmotionalBaseline;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

// 情感基线接口
export interface EmotionalBaseline {
  defaultMood: 'happy' | 'calm' | 'anxious' | 'melancholy' | 'energetic';
  emotionalRange: number;  // 情感波动范围 0-1
  stressTriggers: string[];  // 压力触发点
  comfortSources: string[];  // 安慰来源
  communicationNeeds: string[];  // 沟通需求
}

// 分析进度回调
export interface AnalysisProgress {
  stage: 'parsing' | 'extracting' | 'building' | 'validating' | 'complete';
  progress: number;
  message: string;
}

/**
 * 性格分析服务类
 */
class PersonalityAnalysisService {
  /**
   * 分析聊天记录，提取性格画像
   */
  async analyzeChatHistory(
    chatContent: string,
    onProgress?: (progress: AnalysisProgress) => void
  ): Promise<Partial<PersonalityProfile>> {
    
    // 第一阶段：解析聊天记录
    onProgress?.({
      stage: 'parsing',
      progress: 10,
      message: '正在解析聊天记录...',
    });

    const messages = this.parseChatMessages(chatContent);

    // 第二阶段：提取语言指纹
    onProgress?.({
      stage: 'extracting',
      progress: 30,
      message: '正在分析语言风格...',
    });

    const languageFingerprint = await this.extractLanguageFingerprint(messages);

    // 第三阶段：构建关系图谱
    onProgress?.({
      stage: 'building',
      progress: 50,
      message: '正在构建关系图谱...',
    });

    const relationshipGraph = this.buildRelationshipGraph(messages);

    // 第四阶段：提取记忆锚点
    onProgress?.({
      stage: 'validating',
      progress: 70,
      message: '正在提取重要记忆...',
    });

    const memoryAnchors = await this.extractMemoryAnchors(messages);

    // 第五阶段：分析情感基线
    onProgress?.({
      stage: 'complete',
      progress: 100,
      message: '分析完成！',
    });

    const emotionalBaseline = this.analyzeEmotionalBaseline(messages);

    return {
      languageFingerprint,
      relationshipGraph,
      memoryAnchors,
      emotionalBaseline,
    };
  }

  /**
   * 解析聊天消息
   */
  private parseChatMessages(content: string): Array<{
    sender: string;
    content: string;
    timestamp?: Date;
  }> {
    const messages: Array<{ sender: string; content: string; timestamp?: Date }> = [];
    
    // 支持多种聊天记录格式
    const patterns = [
      // 微信格式: [时间] 发送者: 内容
      /^\[(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\]\s+(.+?):\s*(.+)$/gm,
      // QQ格式: 发送者(时间): 内容
      /^(.+?)\((\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2})\):\s*(.+)$/gm,
      // 简单格式: 发送者: 内容
      /^(.+?):\s*(.+)$/gm,
    ];

    for (const pattern of patterns) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      while ((match = regex.exec(content)) !== null) {
        if (pattern === patterns[0]) {
          messages.push({
            timestamp: new Date(match[1]),
            sender: match[2].trim(),
            content: match[3].trim(),
          });
        } else if (pattern === patterns[1]) {
          messages.push({
            sender: match[1].trim(),
            timestamp: new Date(match[2].replace(/\//g, '-')),
            content: match[3].trim(),
          });
        } else {
          messages.push({
            sender: match[1].trim(),
            content: match[2].trim(),
          });
        }
      }
      if (messages.length > 0) break;
    }

    // 如果没有匹配到格式，尝试按行分割
    if (messages.length === 0) {
      const lines = content.split('\n').filter(line => line.trim());
      let currentSender = '未知';
      
      for (const line of lines) {
        const colonIndex = line.indexOf('：') !== -1 ? line.indexOf('：') : line.indexOf(':');
        if (colonIndex !== -1) {
          currentSender = line.substring(0, colonIndex).trim();
          messages.push({
            sender: currentSender,
            content: line.substring(colonIndex + 1).trim(),
          });
        } else {
          messages.push({
            sender: currentSender,
            content: line.trim(),
          });
        }
      }
    }

    return messages;
  }

  /**
   * 提取语言指纹
   */
  private async extractLanguageFingerprint(
    messages: Array<{ sender: string; content: string }>
  ): Promise<LanguageFingerprint> {
    const contents = messages.map(m => m.content);
    const allText = contents.join(' ');

    // 提取口头禅（高频短语）
    const catchphrases = this.extractCatchphrases(contents);

    // 分析表情包使用
    const emojiPatterns = this.analyzeEmojiPatterns(allText);

    // 分析标点符号习惯
    const punctuationStyle = this.analyzePunctuationStyle(allText);

    // 分析打字习惯
    const typingStyle = this.analyzeTypingStyle(contents);

    // 分析语气特征
    const toneStyle = this.analyzeToneStyle(allText);

    return {
      catchphrases,
      emojiPatterns,
      punctuationStyle,
      typingStyle,
      toneStyle,
    };
  }

  /**
   * 提取口头禅
   */
  private extractCatchphrases(contents: string[]): string[] {
    const phraseCount: Map<string, number> = new Map();
    
    // 常见口头禅模式
    const patterns = [
      /哈哈+/g,
      /呵呵+/g,
      /嘿嘿+/g,
      /哎呀/g,
      /哇塞/g,
      /天哪/g,
      /我的天/g,
      /真的假的/g,
      /不会吧/g,
      /绝了/g,
      /无语/g,
      /醉了/g,
      /服了/g,
      /好的?[啊吧呢呀]/g,
      /知道啦/g,
      /收到/g,
      /OK/gi,
      /嗯+[啊呢]/g,
      /啊+[吧呢]/g,
    ];

    for (const content of contents) {
      for (const pattern of patterns) {
        const matches = content.match(pattern);
        if (matches) {
          for (const match of matches) {
            phraseCount.set(match, (phraseCount.get(match) || 0) + 1);
          }
        }
      }
    }

    // 返回出现频率最高的口头禅
    return Array.from(phraseCount.entries())
      .filter(([_, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([phrase]) => phrase);
  }

  /**
   * 分析表情包使用
   */
  private analyzeEmojiPatterns(text: string): LanguageFingerprint['emojiPatterns'] {
    // 匹配常见表情符号
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    
    const emojis = text.match(emojiRegex) || [];
    const emojiCount: Map<string, number> = new Map();

    for (const emoji of emojis) {
      emojiCount.set(emoji, (emojiCount.get(emoji) || 0) + 1);
    }

    const favorites = Array.from(emojiCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([emoji]) => emoji);

    return {
      favorites,
      frequency: emojis.length / (text.length || 1) * 100,
      contexts: favorites.length > 0 ? ['日常聊天', '表达情绪'] : [],
    };
  }

  /**
   * 分析标点符号习惯
   */
  private analyzePunctuationStyle(text: string): LanguageFingerprint['punctuationStyle'] {
    const totalLength = text.length || 1;
    
    // 统计各种标点
    const tildeCount = (text.match(/~/g) || []).length;
    const periodCount = (text.match(/。/g) || []).length;
    const exclamationCount = (text.match(/[!！]/g) || []).length;
    const questionCount = (text.match(/[?？]/g) || []).length;

    // 判断偏好的标点
    let preferredPunctuation = '。';
    if (tildeCount > periodCount) preferredPunctuation = '~';
    else if (exclamationCount > periodCount && exclamationCount > tildeCount) preferredPunctuation = '！';

    return {
      preferredPunctuation,
      exclamationFrequency: exclamationCount / totalLength * 100,
      questionFrequency: questionCount / totalLength * 100,
    };
  }

  /**
   * 分析打字习惯
   */
  private analyzeTypingStyle(contents: string[]): LanguageFingerprint['typingStyle'] {
    const lengths = contents.map(c => c.length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / (lengths.length || 1);
    const shortMessages = lengths.filter(l => l <= 10).length;
    const hasParagraphs = contents.some(c => c.includes('\n'));

    return {
      avgMessageLength: Math.round(avgLength),
      shortMessageRatio: shortMessages / (contents.length || 1),
      paragraphPreference: hasParagraphs,
    };
  }

  /**
   * 分析语气特征
   */
  private analyzeToneStyle(text: string): LanguageFingerprint['toneStyle'] {
    // 正式程度判断
    const formalIndicators = ['您好', '请问', '感谢', '麻烦', '抱歉'];
    const casualIndicators = ['哈哈', '嘿嘿', '嗯嗯', '好滴', '哒'];
    
    let formalScore = 0;
    let casualScore = 0;
    
    for (const indicator of formalIndicators) {
      formalScore += (text.match(new RegExp(indicator, 'g')) || []).length;
    }
    for (const indicator of casualIndicators) {
      casualScore += (text.match(new RegExp(indicator, 'g')) || []).length;
    }

    const formality = formalScore > casualScore ? 'formal' : 
                      casualScore > formalScore * 2 ? 'casual' : 'mixed';

    // 温暖度判断
    const warmIndicators = ['亲', '宝贝', '亲爱的', '抱抱', '想你了', '爱你'];
    const warmthCount = warmIndicators.reduce((acc, w) => 
      acc + (text.match(new RegExp(w, 'g')) || []).length, 0);
    const warmth = Math.min(1, warmthCount / 10);

    // 幽默感判断
    const humorIndicators = ['哈哈', '嘿嘿', '笑死', '绝了', '哈哈哈'];
    const humorCount = humorIndicators.reduce((acc, h) => 
      acc + (text.match(new RegExp(h, 'g')) || []).length, 0);
    const humor = Math.min(1, humorCount / 20);

    // 直接程度判断
    const directIndicators = ['直接', '就是', '反正', '干脆'];
    const indirectIndicators = ['可能', '也许', '大概', '好像'];
    const directCount = directIndicators.reduce((acc, d) => 
      acc + (text.match(new RegExp(d, 'g')) || []).length, 0);
    const indirectCount = indirectIndicators.reduce((acc, i) => 
      acc + (text.match(new RegExp(i, 'g')) || []).length, 0);
    const directness = Math.min(1, Math.max(0, (directCount - indirectCount + 5) / 10));

    return {
      formality,
      warmth,
      humor,
      directness,
    };
  }

  /**
   * 构建关系图谱
   */
  private buildRelationshipGraph(
    messages: Array<{ sender: string; content: string }>
  ): RelationshipGraph {
    const nodes: RelationshipNode[] = [];
    const uniqueSenders = [...new Set(messages.map(m => m.sender))];

    // 关系关键词映射
    const relationshipKeywords: Record<string, string[]> = {
      '恋人': ['宝贝', '亲爱的', '老婆', '老公', '宝宝', '媳妇', '男朋友', '女朋友'],
      '父母': ['妈', '爸', '妈妈', '爸爸', '老妈', '老爸', '母亲', '父亲'],
      '朋友': ['兄弟', '姐妹', '闺蜜', '哥们', '老铁', '基友'],
      '同事': ['同事', '领导', '老板', '经理', '主管'],
    };

    for (const sender of uniqueSenders.slice(0, 10)) {
      const senderMessages = messages.filter(m => m.sender === sender);
      const content = senderMessages.map(m => m.content).join(' ');

      // 判断关系类型
      let relationship = '朋友';
      for (const [type, indicators] of Object.entries(relationshipKeywords)) {
        if (indicators.some(i => content.includes(i) || sender.includes(i))) {
          relationship = type;
          break;
        }
      }

      nodes.push({
        name: sender,
        relationship,
        attitude: this.inferAttitude(content),
        communicationStyle: this.inferCommunicationStyle(content),
        topics: this.extractTopics(senderMessages.map(m => m.content)),
      });
    }

    return {
      nodes,
      defaultAttitude: '友好热情',
    };
  }

  /**
   * 推断态度
   */
  private inferAttitude(content: string): string {
    if (/爱你|想你|亲爱|宝贝/.test(content)) return '亲密温柔';
    if (/哈哈|嘿嘿|开心|高兴/.test(content)) return '开朗活泼';
    if (/好的|收到|明白|OK/.test(content)) return '配合积极';
    if (/嗯|哦|好吧|行/.test(content)) return '平和淡然';
    return '友好热情';
  }

  /**
   * 推断沟通风格
   */
  private inferCommunicationStyle(content: string): string {
    const avgLength = content.length / (content.split(/[。！？\n]/).length || 1);
    
    if (avgLength > 50) return '详细周到，喜欢解释';
    if (avgLength < 10) return '简洁直接，言简意赅';
    if (/[？?]/.test(content) && /[！!]/.test(content)) return '情绪丰富，表达直接';
    return '平和中庸，娓娓道来';
  }

  /**
   * 提取话题
   */
  private extractTopics(contents: string[]): string[] {
    const topicKeywords: Record<string, string[]> = {
      '工作': ['工作', '加班', '项目', '会议', '领导', '同事'],
      '学习': ['学习', '考试', '作业', '课程', '老师'],
      '生活': ['吃饭', '睡觉', '逛街', '购物', '做饭'],
      '娱乐': ['电影', '游戏', '音乐', '综艺', '追剧'],
      '情感': ['喜欢', '爱', '想', '难过', '开心'],
      '健康': ['运动', '健身', '减肥', '生病', '医院'],
    };

    const text = contents.join(' ');
    const topics: string[] = [];

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(k => text.includes(k))) {
        topics.push(topic);
      }
    }

    return topics.slice(0, 3);
  }

  /**
   * 提取记忆锚点
   */
  private async extractMemoryAnchors(
    messages: Array<{ sender: string; content: string }>
  ): Promise<MemoryAnchor[]> {
    const anchors: MemoryAnchor[] = [];
    const text = messages.map(m => m.content).join(' ');

    // 日期事件提取
    const datePatterns = [
      /(\d{1,2})月(\d{1,2})日/g,
      /(\d{4})年(\d{1,2})月(\d{1,2})日?/g,
    ];

    for (const pattern of datePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        anchors.push({
          id: `date-${anchors.length}`,
          type: 'anniversary',
          content: match[0],
          importance: 0.7,
          emotionalValue: 'positive',
        });
      }
    }

    // 食物偏好提取
    const foodPatterns = [
      /喜欢吃(.{1,10})/g,
      /爱吃(.{1,10})/g,
      /不吃(.{1,10})/g,
      /讨厌(.{1,10})/g,
    ];

    for (const pattern of foodPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        anchors.push({
          id: `food-${anchors.length}`,
          type: 'food',
          content: match[1],
          importance: 0.6,
          emotionalValue: pattern.source.includes('讨厌') || pattern.source.includes('不吃') ? 'negative' : 'positive',
        });
      }
    }

    // 地点提取
    const placePatterns = [
      /去过(.{2,8})/g,
      /在(.{2,8})工作/g,
      /住在(.{2,8})/g,
    ];

    for (const pattern of placePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        anchors.push({
          id: `place-${anchors.length}`,
          type: 'place',
          content: match[1],
          importance: 0.5,
        });
      }
    }

    // 关键事件提取
    const eventKeywords = ['生日', '纪念日', '毕业', '入职', '结婚', '搬家', '旅行'];
    for (const keyword of eventKeywords) {
      if (text.includes(keyword)) {
        const context = this.extractContext(text, keyword, 20);
        anchors.push({
          id: `event-${anchors.length}`,
          type: 'event',
          content: context,
          importance: 0.8,
          emotionalValue: 'positive',
        });
      }
    }

    return anchors.slice(0, 20);
  }

  /**
   * 提取上下文
   */
  private extractContext(text: string, keyword: string, contextLength: number): string {
    const index = text.indexOf(keyword);
    if (index === -1) return keyword;
    
    const start = Math.max(0, index - contextLength);
    const end = Math.min(text.length, index + keyword.length + contextLength);
    
    return text.substring(start, end);
  }

  /**
   * 分析情感基线
   */
  private analyzeEmotionalBaseline(
    messages: Array<{ sender: string; content: string }>
  ): EmotionalBaseline {
    const text = messages.map(m => m.content).join(' ');

    // 默认情绪判断
    const moodIndicators = {
      happy: ['哈哈', '开心', '高兴', '太好了', '棒'],
      calm: ['嗯', '好的', '知道', '明白', '行'],
      anxious: ['担心', '焦虑', '紧张', '怕', '着急'],
      melancholy: ['难过', '伤心', '郁闷', '烦', '累'],
      energetic: ['冲', '加油', '努力', '奋斗', '干'],
    };

    let maxMood: keyof typeof moodIndicators = 'calm';
    let maxCount = 0;

    for (const [mood, indicators] of Object.entries(moodIndicators)) {
      const count = indicators.reduce((acc, i) => 
        acc + (text.match(new RegExp(i, 'g')) || []).length, 0);
      if (count > maxCount) {
        maxCount = count;
        maxMood = mood as keyof typeof moodIndicators;
      }
    }

    // 情感波动范围
    const emotionWords = ['开心', '难过', '生气', '害怕', '惊讶', '感动'];
    const emotionCount = emotionWords.reduce((acc, e) => 
      acc + (text.match(new RegExp(e, 'g')) || []).length, 0);
    const emotionalRange = Math.min(1, emotionCount / 20);

    // 压力触发点
    const stressTriggers: string[] = [];
    if (/工作|加班|项目/.test(text)) stressTriggers.push('工作压力');
    if (/考试|学习|作业/.test(text)) stressTriggers.push('学业压力');
    if (/钱|穷|花销/.test(text)) stressTriggers.push('经济压力');

    // 安慰来源
    const comfortSources: string[] = [];
    if (/朋友|闺蜜|兄弟/.test(text)) comfortSources.push('朋友支持');
    if (/家人|父母|爸妈/.test(text)) comfortSources.push('家庭温暖');
    if (/游戏|追剧|音乐/.test(text)) comfortSources.push('娱乐放松');

    // 沟通需求
    const communicationNeeds: string[] = [];
    if (/[？?]{2,}/.test(text)) communicationNeeds.push('需要解答');
    if (/倾诉|说说|聊聊/.test(text)) communicationNeeds.push('需要倾听');
    if (/怎么办|如何/.test(text)) communicationNeeds.push('需要建议');

    return {
      defaultMood: maxMood,
      emotionalRange,
      stressTriggers,
      comfortSources,
      communicationNeeds,
    };
  }
}

export const personalityAnalysisService = new PersonalityAnalysisService();
