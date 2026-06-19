// 表情包资源 - 使用 emoji 风格 + 占位渐变背景

export interface StickerCategory {
  id: string;
  name: string;
  emoji: string;
  items: { emoji: string; tag: string; gradient: [string, string] }[];
}

export const stickerCategories: StickerCategory[] = [
  {
    id: 'happy',
    name: '开心',
    emoji: '😊',
    items: [
      { emoji: '😊', tag: '开心', gradient: ['#FFD3B6', '#FFB088'] },
      { emoji: '🥰', tag: '喜欢', gradient: ['#FFB8C8', '#FF8FB1'] },
      { emoji: '😄', tag: '大笑', gradient: ['#FFE5D0', '#FFB088'] },
      { emoji: '🤗', tag: '拥抱', gradient: ['#E5DEFF', '#B8A6FF'] },
      { emoji: '😆', tag: '笑哭', gradient: ['#FFD3E0', '#FF8FB1'] },
    ],
  },
  {
    id: 'sad',
    name: '难过',
    emoji: '😢',
    items: [
      { emoji: '😢', tag: '难过', gradient: ['#E5DEFF', '#7C5CFF'] },
      { emoji: '🥺', tag: '委屈', gradient: ['#E5DEFF', '#B8A6FF'] },
      { emoji: '😔', tag: '失落', gradient: ['#E2D8C6', '#B8A6FF'] },
      { emoji: '😪', tag: '累了', gradient: ['#F2EDE4', '#7C5CFF'] },
    ],
  },
  {
    id: 'angry',
    name: '生气',
    emoji: '😤',
    items: [
      { emoji: '😤', tag: '生气', gradient: ['#FFB8C8', '#FF6B6B'] },
      { emoji: '😠', tag: '愤怒', gradient: ['#FF8585', '#FF6B6B'] },
      { emoji: '😡', tag: '暴怒', gradient: ['#FF6B6B', '#FF6B96'] },
    ],
  },
  {
    id: 'love',
    name: '爱意',
    emoji: '💕',
    items: [
      { emoji: '💕', tag: '爱心', gradient: ['#FFB8C8', '#FF6B96'] },
      { emoji: '💖', tag: '闪爱', gradient: ['#FFD3E0', '#FF8FB1'] },
      { emoji: '💗', tag: '心动', gradient: ['#FFB8C8', '#FF6B96'] },
      { emoji: '💝', tag: '礼物', gradient: ['#FFB8C8', '#FF6B96'] },
    ],
  },
  {
    id: 'surprise',
    name: '惊喜',
    emoji: '😮',
    items: [
      { emoji: '😮', tag: '惊讶', gradient: ['#FFD3B6', '#FFB088'] },
      { emoji: '😲', tag: '震惊', gradient: ['#FFD3E0', '#FF8FB1'] },
      { emoji: '🤩', tag: '崇拜', gradient: ['#FFD3B6', '#FF945A'] },
    ],
  },
  {
    id: 'thinking',
    name: '思考',
    emoji: '🤔',
    items: [
      { emoji: '🤔', tag: '思考', gradient: ['#E5DEFF', '#7C5CFF'] },
      { emoji: '🧐', tag: '观察', gradient: ['#E5DEFF', '#B8A6FF'] },
      { emoji: '😏', tag: '得意', gradient: ['#FFD3B6', '#FFB088'] },
    ],
  },
];

export const detectStickerMood = (text: string): string => {
  const lower = text.toLowerCase();
  if (/(爱|喜欢|心|想你|宝贝|甜)/.test(text)) return 'love';
  if (/[!！]{2,}|哈|嘻|呵|开心|高兴|快乐|棒/.test(text)) return 'happy';
  if (/(难过|伤心|哭|委屈|想哭|不开心)/.test(text)) return 'sad';
  if (/(生气|气死|讨厌|烦|滚)/.test(text)) return 'angry';
  if (/(真的|不会吧|天哪|天啊|震惊|哇)/.test(text)) return 'surprise';
  if (/(\?|？|为什么|怎么|思考|想|觉得)/.test(text)) return 'thinking';
  return 'happy';
};
