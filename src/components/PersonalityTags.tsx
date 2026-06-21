/**
 * 智能体性格标签组件
 * 为智能体添加详细的性格标签，方便用户筛选
 */

import { useState } from 'react';
import { Tag, X, Plus, Search, Filter, Sparkles } from 'lucide-react';

// 预设性格标签
export const PERSONALITY_TAGS = [
  // 性格类型
  { id: 'toxic_pride', label: '毒舌傲娇', category: 'personality', icon: '😤', color: 'rose' },
  { id: 'gentle_healing', label: '温柔治愈', category: 'personality', icon: '🥰', color: 'pink' },
  { id: 'dominant_ceo', label: '霸道总裁', category: 'personality', icon: '💼', color: 'indigo' },
  { id: 'smart_study', label: '高智商学霸', category: 'personality', icon: '🧠', color: 'blue' },
  { id: 'cute_playful', label: '可爱俏皮', category: 'personality', icon: '😜', color: 'yellow' },
  { id: 'mature_stable', label: '成熟稳重', category: 'personality', icon: '🧐', color: 'slate' },
  { id: 'humorous', label: '幽默风趣', category: 'personality', icon: '😄', color: 'orange' },
  { id: 'warm_family', label: '温暖贴心', category: 'personality', icon: '❤️', color: 'red' },
  
  // 关系类型
  { id: 'lover', label: '恋人', category: 'relationship', icon: '💕', color: 'pink' },
  { id: 'friend', label: '闺蜜/兄弟', category: 'relationship', icon: '🤝', color: 'cyan' },
  { id: 'parent', label: '父母', category: 'relationship', icon: '👨‍👩‍👧', color: 'amber' },
  { id: 'celebrity', label: '偶像/名人', category: 'relationship', icon: '⭐', color: 'purple' },
  { id: 'colleague', label: '同事/上司', category: 'relationship', icon: '💼', color: 'slate' },
  { id: 'ex_lover', label: '前任', category: 'relationship', icon: '💔', color: 'gray' },
  
  // 沟通风格
  { id: 'short_response', label: '言简意赅', category: 'style', icon: '💬', color: 'slate' },
  { id: 'long_warm', label: '絮絮叨叨', category: 'style', icon: '📝', color: 'amber' },
  { id: 'emoji_lover', label: '表情包狂魔', category: 'style', icon: '😂', color: 'yellow' },
  { id: 'formal_polite', label: '礼貌客气', category: 'style', icon: '🙇', color: 'blue' },
  { id: 'casual_relaxed', label: '轻松随意', category: 'style', icon: '😎', color: 'green' },
  
  // 特殊能力
  { id: 'emotional_support', label: '情感支持', category: 'ability', icon: '🫂', color: 'pink' },
  { id: 'study_helper', label: '学习助手', category: 'ability', icon: '📚', color: 'blue' },
  { id: 'work_advisor', label: '工作顾问', category: 'ability', icon: '💡', color: 'indigo' },
  { id: 'entertainment', label: '娱乐陪伴', category: 'ability', icon: '🎮', color: 'purple' },
  { id: 'life_advice', label: '生活顾问', category: 'ability', icon: '🌿', color: 'green' },
];

// 标签颜色配置
const TAG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  rose: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' },
  pink: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200' },
  slate: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  gray: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
  green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
};

// 分类名称映射
const CATEGORY_LABELS: Record<string, string> = {
  personality: '性格特点',
  relationship: '关系类型',
  style: '沟通风格',
  ability: '特殊能力',
};

interface PersonalityTagsProps {
  selectedTags?: string[];
  onTagsChange?: (tags: string[]) => void;
  isEditable?: boolean;
  maxTags?: number;
  compact?: boolean;
}

export default function PersonalityTags({ 
  selectedTags = [], 
  onTagsChange,
  isEditable = false,
  maxTags = 5,
  compact = false
}: PersonalityTagsProps) {
  const [showSelector, setShowSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // 过滤标签
  const filteredTags = PERSONALITY_TAGS.filter(tag => 
    tag.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 按分类分组
  const groupedTags = filteredTags.reduce((acc, tag) => {
    if (!acc[tag.category]) acc[tag.category] = [];
    acc[tag.category].push(tag);
    return acc;
  }, {} as Record<string, typeof PERSONALITY_TAGS>);

  const handleToggleTag = (tagId: string) => {
    if (!onTagsChange) return;
    
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter(id => id !== tagId));
    } else if (selectedTags.length < maxTags) {
      onTagsChange([...selectedTags, tagId]);
    }
  };

  const selectedTagObjects = selectedTags
    .map(id => PERSONALITY_TAGS.find(t => t.id === id))
    .filter(Boolean) as typeof PERSONALITY_TAGS;

  return (
    <div className="relative">
      {/* 已选标签 */}
      {selectedTags.length > 0 && (
        <div className={`flex flex-wrap gap-1.5 ${compact ? 'mb-2' : 'mb-3'}`}>
          {selectedTagObjects.map(tag => {
            const colors = TAG_COLORS[tag.color];
            return (
              <span
                key={tag.id}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text} ${colors.border} border ${isEditable ? 'pr-1' : ''}`}
              >
                <span>{tag.icon}</span>
                <span>{tag.label}</span>
                {isEditable && (
                  <button
                    onClick={() => handleToggleTag(tag.id)}
                    className="ml-0.5 p-0.5 rounded-full hover:bg-black/10 transition"
                  >
                    <X size={10} />
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}

      {/* 添加标签按钮 */}
      {isEditable && selectedTags.length < maxTags && (
        <button
          onClick={() => setShowSelector(!showSelector)}
          className={`inline-flex items-center gap-1 ${selectedTags.length > 0 ? 'mt-1' : ''} px-2 py-1 rounded-lg border-2 border-dashed border-ink-200 text-ink-500 hover:border-iris-400 hover:text-iris-600 transition ${compact ? 'text-xs' : 'text-sm'}`}
        >
          <Plus size={compact ? 12 : 14} />
          <span>{compact ? '添加标签' : `添加标签 (${selectedTags.length}/${maxTags})`}</span>
        </button>
      )}

      {/* 标签选择器 */}
      {showSelector && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-ink-100 overflow-hidden z-50">
          {/* 搜索框 */}
          <div className="p-3 border-b border-ink-100">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-900/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索标签..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-ink-50 text-sm focus:outline-none focus:ring-2 focus:ring-iris-400/20"
              />
            </div>
          </div>

          {/* 分类筛选 */}
          <div className="flex gap-1 p-2 border-b border-ink-100 overflow-x-auto">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                !activeCategory ? 'bg-iris-100 text-iris-700' : 'text-ink-900/60 hover:bg-ink-50'
              }`}
            >
              全部
            </button>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  activeCategory === key ? 'bg-iris-100 text-iris-700' : 'text-ink-900/60 hover:bg-ink-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 标签列表 */}
          <div className="max-h-64 overflow-y-auto p-2">
            {Object.entries(groupedTags).map(([category, tags]) => (
              (!activeCategory || activeCategory === category) && (
                <div key={category} className="mb-3 last:mb-0">
                  <div className="text-xs text-ink-900/50 px-2 mb-1.5">
                    {CATEGORY_LABELS[category]}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {tags.map(tag => {
                      const colors = TAG_COLORS[tag.color];
                      const isSelected = selectedTags.includes(tag.id);
                      const isDisabled = !isSelected && selectedTags.length >= maxTags;
                      
                      return (
                        <button
                          key={tag.id}
                          onClick={() => !isDisabled && handleToggleTag(tag.id)}
                          disabled={isDisabled}
                          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-left transition ${
                            isSelected 
                              ? `${colors.bg} ${colors.text} border ${colors.border}` 
                              : isDisabled
                                ? 'bg-ink-50 text-ink-900/30 cursor-not-allowed'
                                : 'bg-ink-50 text-ink-900 hover:bg-ink-100'
                          }`}
                        >
                          <span>{tag.icon}</span>
                          <span className="truncate">{tag.label}</span>
                          {isSelected && <Sparkles size={10} className="ml-auto shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )
            ))}

            {filteredTags.length === 0 && (
              <div className="text-center py-6 text-ink-900/40 text-sm">
                没有找到相关标签
              </div>
            )}
          </div>

          {/* 关闭按钮 */}
          <button
            onClick={() => setShowSelector(false)}
            className="w-full p-3 border-t border-ink-100 text-sm text-ink-900/60 hover:text-ink-900 hover:bg-ink-50 transition"
          >
            完成选择
          </button>
        </div>
      )}
    </div>
  );
}

// 导出标签颜色工具函数
export const getTagColor = (color: string) => TAG_COLORS[color] || TAG_COLORS.slate;
