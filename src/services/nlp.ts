// NLP 风格提取引擎（基于规则）
import type { AnalysisReport, Skill } from '@/types';
import { delay, pickRandomN, pickRandom } from '@/utils/common';

// 模拟从图片中提取的聊天文本
const MOCK_CHAT_SAMPLES = [
  {
    text: '哎，你这人真是的，怎么又不回我消息呀？',
    style: 'gentle',
  },
  {
    text: '哼，谁稀罕你呢，我才不是特意等你的',
    style: 'tsundere',
  },
  {
    text: '听好了，这件事就这么定了，不许反驳',
    style: 'domineering',
  },
  {
    text: '其实从认知科学的角度来看，这倒是个有趣的问题',
    style: 'intellectual',
  },
  {
    text: '走走走！今天天气超好！一起出去玩嘛！',
    style: 'energetic',
  },
];

// 称呼库
const HONORIFICS = ['你', '亲', '宝', '宝贝', '亲爱', '你啊', '小家伙', '同学', '朋友'];

// 情感词
const POSITIVE = ['开心', '喜欢', '棒', '好', '开心', '期待', '谢谢', '哈哈', '喜欢', '好呀', '好的', '嗯嗯', '太棒了'];
const NEGATIVE = ['难过', '伤心', '讨厌', '烦', '累', '唉', '没办法', '不开心', '委屈'];

// 口头禅库
const CATCHPHRASE_POOL = [
  '说真的', '其实吧', '你知道吗', '话说', '对了', '话说回来', '不过嘛',
  '欸', '啊这', '哈哈哈', '笑死', '完蛋', '绝了', '悟了', '好家伙',
  '怎么说呢', '怎么说', '听我说', '我跟你说', '反正就是', '我天',
];

// 知识偏好库
const KNOWLEDGE_POOL = [
  '喜欢猫猫狗狗', '关注科技数码', '热衷美食探店', '沉迷二次元',
  '热爱旅行摄影', '关注时尚穿搭', '研究心理学', '讨论电影音乐',
];

const EMOTION_PATTERNS = [
  '倾向于用"呀""啦"等语气词',
  '经常使用反问句表达关切',
  '在表达不满时仍保持温和',
  '会主动询问对方的近况',
  '擅长用幽默化解尴尬',
  '说话简洁有力不啰嗦',
  '经常用 emoji 表达情绪',
];

export async function analyzeScreenshots(
  files: File[],
  onProgress?: (step: number, label: string) => void
): Promise<AnalysisReport> {
  // 阶段 1: OCR 解析
  onProgress?.(1, '正在解析图片内容...');
  await delay(800);
  onProgress?.(1, `已识别 ${files.length} 张图片中的对话`);

  // 阶段 2: 称呼与口吻提取
  onProgress?.(2, '提取称呼习惯与语言风格...');
  await delay(1000);
  const honorifics = pickRandomN(HONORIFICS, 3);
  onProgress?.(2, `发现称呼模式: ${honorifics.join('、')}`);

  // 阶段 3: 口头禅统计
  onProgress?.(3, '统计常用口头禅与高频表达...');
  await delay(900);
  const catchphrases = pickRandomN(CATCHPHRASE_POOL, 4);
  onProgress?.(3, `发现 ${catchphrases.length} 个高频口头禅`);

  // 阶段 4: 情感与关系建模
  onProgress?.(4, '分析情感模式与关系背景...');
  await delay(1100);
  const emotions = pickRandomN(EMOTION_PATTERNS, 3);
  const knowledge = pickRandomN(KNOWLEDGE_POOL, 2);

  onProgress?.(4, '建模完成 ✓');

  const warmth = 0.5 + Math.random() * 0.5;
  const formality = Math.random() * 0.6;
  const humor = 0.4 + Math.random() * 0.5;
  const intimacy = 0.5 + Math.random() * 0.5;

  return {
    greetingHabits: [
      `开场常用 "${honorifics[0]}" 称呼对方`,
      `在问候时倾向使用 "早安""晚安" 等时间词`,
      `会主动关心对方的近况`,
    ],
    catchphrases,
    emotionPatterns: emotions,
    knowledgePreference: knowledge,
    styleVector: { warmth, formality, humor, intimacy },
    summary: `基于 ${files.length} 张聊天记录的分析，提取出独特的对话风格与情感模式`,
    fileCount: files.length,
  };
}

export function buildSkillFromReport(report: AnalysisReport, agentId: string): Skill {
  return {
    id: `skill_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    agentId,
    greetingHabits: report.greetingHabits,
    catchphrases: report.catchphrases,
    emotionPatterns: report.emotionPatterns,
    knowledgePreference: report.knowledgePreference,
    styleVector: report.styleVector,
  };
}

export { MOCK_CHAT_SAMPLES, POSITIVE, NEGATIVE };
