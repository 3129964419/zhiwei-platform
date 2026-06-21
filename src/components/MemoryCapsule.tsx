/**
 * 记忆胶囊组件
 * 显性化展示AI的记忆，让用户能够查看、编辑、添加记忆
 */

import { useState, useEffect } from 'react';
import { Brain, Plus, Edit3, Trash2, X, Check, Sparkles, Heart, Calendar, MapPin, Coffee, Gamepad2, Send } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';

// 记忆类型
type MemoryType = 'preference' | 'event' | 'anniversary' | 'place' | 'food' | 'hobby';

// 记忆项
interface MemoryItem {
  id: string;
  type: MemoryType;
  content: string;
  importance: number;
  isAutoExtracted: boolean;
  lastMentioned?: string;
  mentionCount: number;
}

// 记忆类型配置
const MEMORY_TYPE_CONFIG: Record<MemoryType, { icon: typeof Heart; label: string; color: string; bgColor: string }> = {
  preference: { icon: Heart, label: '喜好', color: 'text-rose-500', bgColor: 'bg-rose-50' },
  event: { icon: Calendar, label: '事件', color: 'text-amber-500', bgColor: 'bg-amber-50' },
  anniversary: { icon: Sparkles, label: '纪念日', color: 'text-purple-500', bgColor: 'bg-purple-50' },
  place: { icon: MapPin, label: '地点', color: 'text-blue-500', bgColor: 'bg-blue-50' },
  food: { icon: Coffee, label: '美食', color: 'text-orange-500', bgColor: 'bg-orange-50' },
  hobby: { icon: Gamepad2, label: '爱好', color: 'text-green-500', bgColor: 'bg-green-50' },
};

// 预设记忆示例（用于演示）
const DEMO_MEMORIES: MemoryItem[] = [
  { id: '1', type: 'preference', content: '喜欢用波浪号~结尾，说话有点小傲娇', importance: 0.9, isAutoExtracted: true, lastMentioned: '2天前', mentionCount: 5 },
  { id: '2', type: 'food', content: '最讨厌吃香菜，一点点都不能接受', importance: 0.8, isAutoExtracted: true, lastMentioned: '1周前', mentionCount: 3 },
  { id: '3', type: 'event', content: '最近工作压力很大，经常加班到很晚', importance: 0.7, isAutoExtracted: true, lastMentioned: '3天前', mentionCount: 2 },
  { id: '4', type: 'anniversary', content: '我们的纪念日是5月20日', importance: 0.9, isAutoExtracted: false, mentionCount: 0 },
  { id: '5', type: 'place', content: '最喜欢的城市是成都，想去很久了', importance: 0.6, isAutoExtracted: true, lastMentioned: '2周前', mentionCount: 1 },
  { id: '6', type: 'hobby', content: '喜欢玩原神和王者荣耀，周末会宅家打游戏', importance: 0.7, isAutoExtracted: true, mentionCount: 0 },
];

interface MemoryCapsuleProps {
  agentId?: string;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export default function MemoryCapsule({ agentId, isExpanded = false, onToggle }: MemoryCapsuleProps) {
  const addToast = useUIStore((s) => s.addToast);
  const [memories, setMemories] = useState<MemoryItem[]>(DEMO_MEMORIES);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [newMemory, setNewMemory] = useState({ type: 'preference' as MemoryType, content: '' });

  // 根据类型分组显示记忆
  const groupedMemories = memories.reduce((acc, memory) => {
    if (!acc[memory.type]) acc[memory.type] = [];
    acc[memory.type].push(memory);
    return acc;
  }, {} as Record<MemoryType, MemoryItem[]>);

  const handleAddMemory = () => {
    if (!newMemory.content.trim()) {
      addToast('error', '请输入记忆内容');
      return;
    }

    const newItem: MemoryItem = {
      id: Date.now().toString(),
      type: newMemory.type,
      content: newMemory.content.trim(),
      importance: 0.7,
      isAutoExtracted: false,
      mentionCount: 0,
    };

    setMemories([newItem, ...memories]);
    setNewMemory({ type: 'preference', content: '' });
    setShowAddModal(false);
    addToast('success', '记忆已添加');
  };

  const handleEditMemory = (id: string) => {
    const memory = memories.find(m => m.id === id);
    if (memory) {
      setEditContent(memory.content);
      setEditingId(id);
    }
  };

  const handleSaveEdit = () => {
    if (!editContent.trim()) return;
    
    setMemories(memories.map(m => 
      m.id === editingId ? { ...m, content: editContent.trim() } : m
    ));
    setEditingId(null);
    setEditContent('');
    addToast('success', '记忆已更新');
  };

  const handleDeleteMemory = (id: string) => {
    setMemories(memories.filter(m => m.id !== id));
    addToast('success', '记忆已删除');
  };

  return (
    <div className="bg-white rounded-2xl border border-ink-100 shadow-soft overflow-hidden">
      {/* 头部 */}
      <div 
        className="p-4 flex items-center justify-between bg-gradient-to-r from-iris-50/50 to-rose-50/50 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-iris-500 to-rose-400 flex items-center justify-center shadow-soft">
            <Brain size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-ink-900">记忆胶囊</h3>
            <p className="text-xs text-ink-900/50">
              {memories.length} 个记忆 · AI 会主动提及这些
            </p>
          </div>
        </div>
        <button className="p-2 rounded-lg hover:bg-white/50 transition">
          <svg 
            className={`w-5 h-5 text-ink-900/50 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* 展开内容 */}
      {isExpanded && (
        <div className="p-4 border-t border-ink-100">
          {/* 添加记忆按钮 */}
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full mb-4 p-3 rounded-xl border-2 border-dashed border-iris-200 text-iris-600 flex items-center justify-center gap-2 hover:border-iris-400 hover:bg-iris-50/30 transition"
          >
            <Plus size={18} />
            <span className="text-sm font-medium">添加新的记忆</span>
          </button>

          {/* 记忆列表 */}
          <div className="space-y-4">
            {Object.entries(groupedMemories).map(([type, items]) => {
              const config = MEMORY_TYPE_CONFIG[type as MemoryType];
              const Icon = config.icon;
              
              return (
                <div key={type}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-6 h-6 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                      <Icon size={14} className={config.color} />
                    </div>
                    <span className="text-xs font-medium text-ink-900/70">{config.label}</span>
                    <span className="text-xs text-ink-900/40">({items.length})</span>
                  </div>
                  
                  <div className="space-y-2 pl-8">
                    {items.map(memory => (
                      <div 
                        key={memory.id}
                        className={`p-3 rounded-xl bg-ink-50/50 group relative ${
                          memory.isAutoExtracted ? 'border-l-2 border-iris-300' : ''
                        }`}
                      >
                        {editingId === memory.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="w-full p-2 rounded-lg bg-white border border-ink-200 text-sm resize-none"
                              rows={2}
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-3 py-1 rounded-lg text-xs text-ink-500 hover:bg-ink-100"
                              >
                                取消
                              </button>
                              <button
                                onClick={handleSaveEdit}
                                className="px-3 py-1 rounded-lg text-xs bg-iris-500 text-white hover:bg-iris-600"
                              >
                                保存
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-ink-900 pr-16">{memory.content}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {memory.isAutoExtracted && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-iris-100 text-iris-600">
                                  AI提取
                                </span>
                              )}
                              {memory.lastMentioned && (
                                <span className="text-[10px] text-ink-900/40">
                                  上次提及: {memory.lastMentioned}
                                </span>
                              )}
                            </div>
                            <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                              <button
                                onClick={() => handleEditMemory(memory.id)}
                                className="p-1.5 rounded-lg bg-white text-ink-400 hover:text-iris-500 shadow-sm"
                              >
                                <Edit3 size={12} />
                              </button>
                              <button
                                onClick={() => handleDeleteMemory(memory.id)}
                                className="p-1.5 rounded-lg bg-white text-ink-400 hover:text-coral-500 shadow-sm"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 底部提示 */}
          <div className="mt-4 p-3 rounded-xl bg-mint-50/50 border border-mint-200/50">
            <p className="text-xs text-mint-700 flex items-center gap-2">
              <Sparkles size={14} className="text-mint-500" />
              AI 会根据这些记忆主动发起对话，比如"对了，去成都的攻略看了吗？"
            </p>
          </div>
        </div>
      )}

      {/* 添加记忆弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-4 border-b border-ink-100 flex items-center justify-between">
              <h3 className="font-semibold text-ink-900">添加新记忆</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-ink-100"
              >
                <X size={18} className="text-ink-900/50" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-ink-900 mb-2 block">记忆类型</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(MEMORY_TYPE_CONFIG) as [MemoryType, typeof MEMORY_TYPE_CONFIG.preference][]).map(([type, config]) => {
                    const Icon = config.icon;
                    return (
                      <button
                        key={type}
                        onClick={() => setNewMemory({ ...newMemory, type })}
                        className={`p-2 rounded-xl flex flex-col items-center gap-1 transition ${
                          newMemory.type === type 
                            ? 'bg-iris-50 border-2 border-iris-400' 
                            : 'bg-ink-50 border-2 border-transparent hover:border-ink-200'
                        }`}
                      >
                        <Icon size={18} className={config.color} />
                        <span className="text-xs text-ink-900">{config.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-ink-900 mb-2 block">记忆内容</label>
                <textarea
                  value={newMemory.content}
                  onChange={(e) => setNewMemory({ ...newMemory, content: e.target.value })}
                  placeholder="例如：他最喜欢吃的火锅是海底捞，最讨厌的食物是香菜"
                  className="w-full p-3 rounded-xl bg-ink-50 border border-ink-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-iris-400/20"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="p-4 border-t border-ink-100 flex gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-ink-100 text-ink-900 font-medium hover:bg-ink-200 transition"
              >
                取消
              </button>
              <button
                onClick={handleAddMemory}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-iris-500 to-rose-400 text-white font-medium hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                <Send size={16} />
                添加记忆
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
