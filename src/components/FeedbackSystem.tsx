/**
 * 反馈组件
 * 提供"不像"反馈按钮和具体反馈选项
 */

import { useState } from 'react';
import { ThumbsDown, ThumbsUp, MessageSquare, X, Send, Edit3 } from 'lucide-react';

// 反馈类型
export type FeedbackType = 
  | 'tone_wrong'        // 语气不对
  | 'too_formal'        // 太客气了
  | 'too_casual'        // 太随意了
  | 'memory_wrong'      // 记错了
  | 'not_empathetic'    // 不够共情
  | 'too_long'          // 太长了
  | 'too_short'         // 太短了
  | 'wrong_expression'  // 表达方式不对
  | 'other';            // 其他

// 反馈选项配置
const FEEDBACK_OPTIONS: Array<{
  type: FeedbackType;
  label: string;
  description: string;
  icon?: string;
}> = [
  {
    type: 'too_formal',
    label: '太客气了',
    description: 'ta不会说这种客气话',
    icon: '😅',
  },
  {
    type: 'too_casual',
    label: '太随意了',
    description: 'ta说话会更正式一点',
    icon: '🤔',
  },
  {
    type: 'tone_wrong',
    label: '语气不对',
    description: '语气和ta平时不一样',
    icon: '💭',
  },
  {
    type: 'memory_wrong',
    label: '记错了',
    description: '这件事ta不会这样说',
    icon: '🧠',
  },
  {
    type: 'not_empathetic',
    label: '不够共情',
    description: 'ta会更理解我的感受',
    icon: '❤️',
  },
  {
    type: 'too_long',
    label: '太长了',
    description: 'ta说话会更简洁',
    icon: '📝',
  },
  {
    type: 'too_short',
    label: '太短了',
    description: 'ta会说得更详细',
    icon: '💬',
  },
  {
    type: 'wrong_expression',
    label: '表达方式不对',
    description: 'ta会用不同的方式表达',
    icon: '✍️',
  },
  {
    type: 'other',
    label: '其他问题',
    description: '其他需要改进的地方',
    icon: '📌',
  },
];

// 反馈数据接口
export interface MessageFeedback {
  messageId: string;
  type: FeedbackType | 'like';
  customText?: string;
  timestamp: Date;
}

interface FeedbackButtonProps {
  messageId: string;
  onFeedback: (feedback: MessageFeedback) => void;
  hasLiked?: boolean;
  hasDisliked?: boolean;
}

/**
 * 反馈按钮组件
 */
export function FeedbackButton({ 
  messageId, 
  onFeedback, 
  hasLiked = false, 
  hasDisliked = false 
}: FeedbackButtonProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [selectedType, setSelectedType] = useState<FeedbackType | null>(null);
  const [customText, setCustomText] = useState('');

  const handleLike = () => {
    onFeedback({
      messageId,
      type: 'like',
      timestamp: new Date(),
    });
  };

  const handleDislike = () => {
    setShowOptions(true);
  };

  const handleOptionSelect = (type: FeedbackType) => {
    setSelectedType(type);
  };

  const handleSubmit = () => {
    if (selectedType) {
      onFeedback({
        messageId,
        type: selectedType,
        customText: customText || undefined,
        timestamp: new Date(),
      });
      setShowOptions(false);
      setSelectedType(null);
      setCustomText('');
    }
  };

  return (
    <div className="relative">
      {/* 主按钮 */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleLike}
          className={`p-1.5 rounded-lg transition-all ${
            hasLiked 
              ? 'bg-mint-100 text-mint-600' 
              : 'text-ink-400 hover:text-mint-500 hover:bg-mint-50'
          }`}
          title="这个回复很像我"
        >
          <ThumbsUp size={14} />
        </button>
        <button
          onClick={handleDislike}
          className={`p-1.5 rounded-lg transition-all ${
            hasDisliked 
              ? 'bg-coral-100 text-coral-600' 
              : 'text-ink-400 hover:text-coral-500 hover:bg-coral-50'
          }`}
          title="这个回复不太像"
        >
          <ThumbsDown size={14} />
        </button>
      </div>

      {/* 反馈选项弹窗 */}
      {showOptions && (
        <div className="absolute bottom-full left-0 mb-2 w-72 bg-white rounded-2xl shadow-lg border border-ink-100 p-4 z-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-ink-900 text-sm">哪里不太像？</h4>
            <button
              onClick={() => setShowOptions(false)}
              className="text-ink-400 hover:text-ink-600"
            >
              <X size={16} />
            </button>
          </div>

          {!selectedType ? (
            // 选择反馈类型
            <div className="grid grid-cols-2 gap-2">
              {FEEDBACK_OPTIONS.map((option) => (
                <button
                  key={option.type}
                  onClick={() => handleOptionSelect(option.type)}
                  className="flex flex-col items-start p-2.5 rounded-xl bg-ink-50 hover:bg-ink-100 transition-all text-left"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span>{option.icon}</span>
                    <span className="text-sm font-medium text-ink-900">{option.label}</span>
                  </div>
                  <span className="text-xs text-ink-500">{option.description}</span>
                </button>
              ))}
            </div>
          ) : (
            // 输入详细反馈
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-ink-600">
                <span>{FEEDBACK_OPTIONS.find(o => o.type === selectedType)?.icon}</span>
                <span>{FEEDBACK_OPTIONS.find(o => o.type === selectedType)?.label}</span>
              </div>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="可以具体说说哪里不对，帮助我更像ta~"
                className="w-full p-3 rounded-xl bg-ink-50 border border-ink-100 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-iris-400/20"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedType(null)}
                  className="flex-1 py-2 rounded-xl bg-ink-100 text-ink-600 text-sm font-medium hover:bg-ink-200 transition"
                >
                  返回
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-iris-500 to-rose-400 text-white text-sm font-medium hover:shadow-lg transition"
                >
                  提交反馈
                </button>
              </div>
            </div>
          )}

          {/* 提示 */}
          <p className="text-xs text-ink-400 mt-3 text-center">
            💡 你的反馈会帮助我越来越像ta
          </p>
        </div>
      )}
    </div>
  );
}

// 记忆项接口
interface MemoryItem {
  id: string;
  type: 'event' | 'preference' | 'anniversary' | 'place' | 'food' | 'hobby';
  content: string;
  importance: number;
  isEditing?: boolean;
}

interface MemoryEditorProps {
  memories: MemoryItem[];
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onAdd: (memory: Omit<MemoryItem, 'id'>) => void;
}

/**
 * 记忆编辑器组件
 */
export function MemoryEditor({ memories, onUpdate, onDelete, onAdd }: MemoryEditorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newMemory, setNewMemory] = useState({
    type: 'preference' as MemoryItem['type'],
    content: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const typeLabels: Record<MemoryItem['type'], { label: string; icon: string }> = {
    event: { label: '重要事件', icon: '📅' },
    preference: { label: '喜好偏好', icon: '❤️' },
    anniversary: { label: '纪念日', icon: '🎉' },
    place: { label: '常去地点', icon: '📍' },
    food: { label: '食物偏好', icon: '🍜' },
    hobby: { label: '兴趣爱好', icon: '🎯' },
  };

  const handleAdd = () => {
    if (newMemory.content.trim()) {
      onAdd({
        ...newMemory,
        importance: 0.7,
      });
      setNewMemory({ type: 'preference', content: '' });
      setIsAdding(false);
    }
  };

  const handleEdit = (id: string, content: string) => {
    setEditingId(id);
    setEditContent(content);
  };

  const handleSaveEdit = (id: string) => {
    onUpdate(id, editContent);
    setEditingId(null);
    setEditContent('');
  };

  return (
    <div className="bg-white rounded-2xl border border-ink-100 p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-ink-900">长期记忆库</h3>
          <p className="text-xs text-ink-500 mt-0.5">编辑AI对ta的记忆，让回复更准确</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-iris-50 text-iris-600 text-sm font-medium hover:bg-iris-100 transition"
        >
          <span>+</span>
          添加记忆
        </button>
      </div>

      {/* 添加新记忆 */}
      {isAdding && (
        <div className="mb-4 p-3 rounded-xl bg-iris-50/50 border border-iris-100">
          <div className="flex gap-2 mb-2">
            <select
              value={newMemory.type}
              onChange={(e) => setNewMemory({ ...newMemory, type: e.target.value as MemoryItem['type'] })}
              className="px-3 py-1.5 rounded-lg bg-white border border-ink-200 text-sm"
            >
              {Object.entries(typeLabels).map(([type, { label }]) => (
                <option key={type} value={type}>{label}</option>
              ))}
            </select>
          </div>
          <textarea
            value={newMemory.content}
            onChange={(e) => setNewMemory({ ...newMemory, content: e.target.value })}
            placeholder="输入记忆内容，例如：ta喜欢吃辣，不喜欢吃香菜"
            className="w-full p-2 rounded-lg bg-white border border-ink-200 text-sm resize-none"
            rows={2}
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setIsAdding(false)}
              className="px-3 py-1 rounded-lg text-ink-500 text-sm hover:bg-ink-100"
            >
              取消
            </button>
            <button
              onClick={handleAdd}
              className="px-3 py-1 rounded-lg bg-iris-500 text-white text-sm hover:bg-iris-600"
            >
              保存
            </button>
          </div>
        </div>
      )}

      {/* 记忆列表 */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {memories.map((memory) => (
          <div
            key={memory.id}
            className="flex items-start gap-3 p-3 rounded-xl bg-ink-50/50 hover:bg-ink-50 transition group"
          >
            <span className="text-lg">{typeLabels[memory.type].icon}</span>
            <div className="flex-1 min-w-0">
              {editingId === memory.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-2 rounded-lg bg-white border border-ink-200 text-sm resize-none"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-2 py-1 rounded text-xs text-ink-500 hover:bg-ink-100"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => handleSaveEdit(memory.id)}
                      className="px-2 py-1 rounded text-xs bg-iris-500 text-white hover:bg-iris-600"
                    >
                      保存
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-ink-900">{memory.content}</p>
                  <p className="text-xs text-ink-400 mt-0.5">{typeLabels[memory.type].label}</p>
                </>
              )}
            </div>
            {editingId !== memory.id && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={() => handleEdit(memory.id, memory.content)}
                  className="p-1 rounded text-ink-400 hover:text-iris-500 hover:bg-iris-50"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={() => onDelete(memory.id)}
                  className="p-1 rounded text-ink-400 hover:text-coral-500 hover:bg-coral-50"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        ))}

        {memories.length === 0 && (
          <div className="text-center py-6 text-ink-400 text-sm">
            <MessageSquare size={24} className="mx-auto mb-2 opacity-50" />
            <p>还没有添加记忆</p>
            <p className="text-xs mt-1">点击上方按钮添加，帮助AI更了解ta</p>
          </div>
        )}
      </div>
    </div>
  );
}

// 反馈服务
class FeedbackService {
  private feedbackHistory: MessageFeedback[] = [];

  /**
   * 记录反馈
   */
  recordFeedback(feedback: MessageFeedback): void {
    this.feedbackHistory.push(feedback);
    
    // 这里可以发送到后端进行学习
    console.log('Feedback recorded:', feedback);
  }

  /**
   * 获取反馈历史
   */
  getFeedbackHistory(): MessageFeedback[] {
    return [...this.feedbackHistory];
  }

  /**
   * 获取特定类型的反馈统计
   */
  getFeedbackStats(): Record<FeedbackType | 'like', number> {
    const stats: Record<FeedbackType | 'like', number> = {
      like: 0,
      tone_wrong: 0,
      too_formal: 0,
      too_casual: 0,
      memory_wrong: 0,
      not_empathetic: 0,
      too_long: 0,
      too_short: 0,
      wrong_expression: 0,
      other: 0,
    };

    for (const feedback of this.feedbackHistory) {
      stats[feedback.type]++;
    }

    return stats;
  }
}

export const feedbackService = new FeedbackService();
