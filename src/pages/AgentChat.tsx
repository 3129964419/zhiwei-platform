import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MoreVertical, Trash2, MessageCircle, Sparkles, Heart, Check, CheckCheck, Calendar, Download, X } from 'lucide-react';
import Layout from '@/components/Layout';
import MessageBubble from '@/components/MessageBubble';
import ChatInput from '@/components/ChatInput';
import TypingIndicator from '@/components/TypingIndicator';
import { useUserStore } from '@/store/userStore';
import { useAgentStore } from '@/store/agentStore';
import { useUIStore } from '@/store/uiStore';
import { agentAPI } from '@/services/agent';
import { chatService } from '@/services/chat';
import { personalities } from '@/data/personalities';
import { relationships } from '@/data/relationships';
import { stickerCategories, detectStickerMood } from '@/data/stickers';
import { pickRandom } from '@/utils/common';
import type { Agent, Message, Skill } from '@/types';
import { formatTime, formatDate } from '@/utils/format';

interface GroupedMessage {
  date?: string;
  messages: Message[];
}

function groupMessagesByDate(messages: Message[]): GroupedMessage[] {
  if (messages.length === 0) return [];
  
  const groups: GroupedMessage[] = [];
  let currentDate = '';
  
  messages.forEach((msg) => {
    const msgDate = formatDate(msg.timestamp);
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      groups.push({ date: msgDate, messages: [msg] });
    } else {
      groups[groups.length - 1].messages.push(msg);
    }
  });
  
  return groups;
}

export default function AgentChat() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const touchAgent = useAgentStore((s) => s.touchAgent);
  const deleteAgent = useAgentStore((s) => s.deleteAgent);
  const addToast = useUIStore((s) => s.addToast);
  const settings = useUserStore((s) => s.settings);

  const [agent, setAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [skill, setSkill] = useState<Skill | null>(null);
  const [typing, setTyping] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [readCount, setReadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    agentAPI.get(id).then((a) => {
      if (!a) {
        addToast('error', '智能体不存在');
        navigate('/dashboard');
        return;
      }
      setAgent(a);
      touchAgent(a.id);
      agentAPI.getMessages(a.id).then((msgs) => {
        setMessages(msgs);
        setReadCount(msgs.filter(m => m.role === 'agent').length);
      });
      agentAPI.getSkill(a.id).then(setSkill);
    });
  }, [id, navigate, touchAgent, addToast]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typing, scrollToBottom]);

  const markAsRead = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;
    if (isAtBottom && agent) {
      const agentMsgCount = messages.filter(m => m.role === 'agent').length;
      if (agentMsgCount > readCount) {
        setReadCount(agentMsgCount);
      }
    }
  }, [messages, readCount, agent]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.addEventListener('scroll', markAsRead);
    return () => container.removeEventListener('scroll', markAsRead);
  }, [markAsRead]);

  const handleSend = async (content: string, type: 'text' | 'sticker' | 'voice') => {
    if (!agent) return;
    const userMsg = await agentAPI.addMessage({
      agentId: agent.id,
      role: 'user',
      content,
      type,
    });
    setMessages((prev) => [...prev, userMsg]);

    setTyping(true);

    const delay = settings.replySpeed === 'fast' ? 600 : settings.replySpeed === 'slow' ? 1800 : 1100;
    setTimeout(async () => {
      let replyType: 'text' | 'sticker' = 'text';
      let replyContent = '';

      if (settings.stickerAutoReply && Math.random() < 0.3) {
        const mood = detectStickerMood(content);
        const category = stickerCategories.find((c) => c.id === mood) || stickerCategories[0];
        const item = pickRandom(category.items);
        replyType = 'sticker';
        replyContent = item.emoji;
      } else {
        try {
          if (chatService.isAvailable()) {
            const systemPrompt = skill?.systemPrompt || `你是${personality?.name || '一个AI助手'}，与用户的关系是${relationship?.name || '朋友'}。请用${personality?.description || '自然'}的语气回复。`;
            
            const chatMessages = messages.slice(-5).map(m => ({
              role: m.role === 'user' ? 'user' : 'assistant',
              content: m.content,
            }));
            
            const result = await chatService.sendMessage({
              messages: [...chatMessages, { role: 'user', content }] as any,
              systemPrompt,
              temperature: 0.7,
              maxTokens: 512,
            });
            
            replyContent = result.content;
          } else {
            const reply = await agentAPI.sendMessage(agent, content);
            replyContent = reply.content;
          }
        } catch (error) {
          addToast('error', error instanceof Error ? error.message : '发送失败');
          const reply = await agentAPI.sendMessage(agent, content);
          replyContent = reply.content;
        }
      }

      const replyMsg = await agentAPI.addMessage({
        agentId: agent.id,
        role: 'agent',
        content: replyContent,
        type: replyType,
      });
      setMessages((prev) => [...prev, replyMsg]);
      setTyping(false);
    }, delay);
  };

  const handleClear = async () => {
    if (!agent) return;
    if (confirm('确定要清空与 TA 的所有聊天记录吗？')) {
      await agentAPI.clearMessages(agent.id);
      setMessages([]);
      setReadCount(0);
      addToast('success', '聊天记录已清空');
    }
    setMenuOpen(false);
  };

  const handleExport = () => {
    if (!agent || messages.length === 0) return;
    
    const exportData = {
      agent: {
        name: agent.name,
        personality: agent.personality,
        relationship: agent.relationship,
      },
      messages: messages.map(m => ({
        role: m.role === 'user' ? '我' : agent.name,
        content: m.content,
        time: new Date(m.timestamp).toLocaleString('zh-CN'),
      })),
      exportTime: new Date().toLocaleString('zh-CN'),
    };
    
    const text = `与 ${agent.name} 的对话记录\n导出时间：${exportData.exportTime}\n${'='.repeat(40)}\n\n` +
      exportData.messages.map(m => `[${m.time}] ${m.role}：${m.content}`).join('\n\n');
    
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${agent.name}_对话记录_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    addToast('success', '对话记录已导出');
    setMenuOpen(false);
  };

  const handleDeleteMessage = async (msgId: string) => {
    const allMessages = await agentAPI.getMessages(agent!.id);
    const filtered = allMessages.filter(m => m.id !== msgId);
    localStorage.setItem('messages', JSON.stringify(filtered));
    setMessages(filtered);
    addToast('success', '消息已删除');
  };

  const handleDelete = async () => {
    if (!agent) return;
    if (confirm(`确定要删除「${agent.name}」吗？此操作无法撤销。`)) {
      await deleteAgent(agent.id);
      addToast('success', '已删除');
      navigate('/dashboard');
    }
    setMenuOpen(false);
  };

  if (!agent) return null;

  const personality = personalities.find((p) => p.id === agent.personality);
  const relationship = relationships.find((r) => r.id === agent.relationship);
  const groupedMessages = groupMessagesByDate(messages);
  const unreadCount = messages.filter(m => m.role === 'agent').length - readCount;

  return (
    <Layout showFooter={false} noPadding>
      <div className="h-screen flex flex-col aurora-bg">
        <div className="glass border-b border-ink-100 shrink-0 z-20">
          <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-full hover:bg-ink-100 flex items-center justify-center text-ink-900/70 transition active:scale-95"
            >
              <ArrowLeft size={18} />
            </button>
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-display text-lg font-semibold shrink-0"
              style={{
                background: `linear-gradient(135deg, ${agent.avatarGradient[0]}, ${agent.avatarGradient[1]})`,
              }}
            >
              {agent.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-ink-900 truncate">{agent.name}</h1>
              <div className="flex items-center gap-1.5 text-xs text-ink-900/50">
                <span className="dot-pulse" style={{ width: 6, height: 6 }} />
                <span>
                  {personality?.name} · {relationship?.name} · 在线
                </span>
              </div>
            </div>
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-9 h-9 rounded-full hover:bg-ink-100 flex items-center justify-center text-ink-900/70 transition active:scale-95"
              >
                <MoreVertical size={18} />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-40 w-44 bg-white rounded-2xl shadow-card border border-ink-100 py-1.5">
                    <Link
                      to={`/agent/${agent.id}`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-ink-900/80 hover:bg-ink-50"
                    >
                      <MessageCircle size={14} /> 查看资料
                    </Link>
                    <button
                      onClick={handleExport}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-ink-900/80 hover:bg-ink-50"
                    >
                      <Download size={14} /> 导出对话
                    </button>
                    <button
                      onClick={handleClear}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-ink-900/80 hover:bg-ink-50"
                    >
                      <Trash2 size={14} /> 清空对话
                    </button>
                    <div className="h-px bg-ink-100 my-1" />
                    <button
                      onClick={handleDelete}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-coral-500 hover:bg-coral-400/5"
                    >
                      <Trash2 size={14} /> 删除智能体
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto scroll-smooth"
        >
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-10 animate-fade-in">
                <div
                  className="w-20 h-20 rounded-3xl flex items-center justify-center text-white text-3xl mx-auto mb-4 shadow-glow"
                  style={{
                    background: `linear-gradient(135deg, ${agent.avatarGradient[0]}, ${agent.avatarGradient[1]})`,
                  }}
                >
                  {agent.avatar}
                </div>
                <h2 className="font-display text-2xl font-semibold mb-2">
                  和 {agent.name} 开始对话
                </h2>
                <p className="text-sm text-ink-900/60 max-w-sm mx-auto mb-6">
                  {agent.background}
                </p>
                {skill && (
                  <div className="glass rounded-3xl p-5 max-w-md mx-auto text-left">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles size={14} className="text-iris-500" />
                      <p className="text-xs font-semibold text-ink-900">TA 的特点</p>
                    </div>
                    <div className="space-y-2">
                      {skill.catchphrases.slice(0, 3).map((c) => (
                        <div
                          key={c}
                          className="text-xs text-ink-900/70 bg-white/50 rounded-lg px-3 py-1.5 inline-block mr-2"
                        >
                          "{c}"
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {groupedMessages.map((group, groupIndex) => (
              <div key={groupIndex}>
                {group.date && (
                  <div className="flex items-center justify-center gap-3 my-6">
                    <div className="h-px flex-1 bg-ink-200/50" />
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/60 backdrop-blur rounded-full">
                      <Calendar size={12} className="text-ink-900/40" />
                      <span className="text-xs text-ink-900/60">{group.date}</span>
                    </div>
                    <div className="h-px flex-1 bg-ink-200/50" />
                  </div>
                )}

                {group.messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    agentAvatar={agent.avatar}
                    agentGradient={agent.avatarGradient}
                    isRead={msg.role === 'agent' && messages.indexOf(msg) < messages.filter(m => m.role === 'agent').length}
                    voiceId={agent.voiceId}
                  />
                ))}
              </div>
            ))}

            {typing && (
              <div className="flex gap-2 justify-start animate-fade-in">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-semibold shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${agent.avatarGradient[0]}, ${agent.avatarGradient[1]})`,
                  }}
                >
                  {agent.avatar}
                </div>
                <div className="bubble-agent">
                  <TypingIndicator gradient={agent.avatarGradient} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="shrink-0 pb-4 pt-2 px-4 bg-gradient-to-t from-ink-50 via-ink-50/95 to-transparent">
          <div className="max-w-3xl mx-auto">
            <ChatInput
              onSend={handleSend}
              disabled={typing}
              placeholder={`和 ${agent.name} 说点什么...`}
            />
            <p className="text-[10px] text-ink-900/40 text-center mt-2">
              智能复刻的是对话风格与性格特征，所有回复由 AI 生成 ·{' '}
              <Link to="/legal" className="hover:text-iris-500 transition">
                内容规范
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
