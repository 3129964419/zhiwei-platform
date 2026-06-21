import { useState } from 'react';
import { Users, Heart, Eye, MessageCircle, Star, ChevronRight, Sparkles } from 'lucide-react';

interface HotAgent {
  id: number;
  name: string;
  avatar: React.ReactNode;
  creator: string;
  description: string;
  tags: string[];
  likes: number;
  views: number;
  chats: number;
  rating: number;
  isFeatured: boolean;
}

const hotAgents: HotAgent[] = [
  {
    id: 1,
    name: '情感陪伴小助手',
    avatar: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <circle cx="20" cy="20" r="18" fill="url(#grad-emotion)" />
        <path d="M12 22 Q20 32 28 22" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M12 22 Q20 12 28 22" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
        <defs><linearGradient id="grad-emotion" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FF8DA1" /><stop offset="100%" stopColor="#FFB8C8" /></linearGradient></defs>
      </svg>
    ),
    creator: '李心理',
    description: '温柔倾听，专业陪伴，帮你疏导情绪，缓解压力',
    tags: ['情感', '心理', '陪伴'],
    likes: 2847,
    views: 15234,
    chats: 8923,
    rating: 5,
    isFeatured: true,
  },
  {
    id: 2,
    name: '学习搭档小明',
    avatar: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <circle cx="20" cy="20" r="18" fill="url(#grad-study)" />
        <rect x="12" y="16" width="16" height="14" rx="2" fill="#fff" />
        <line x1="14" y1="21" x2="26" y2="21" stroke="#9873FF" strokeWidth="1.5" />
        <line x1="14" y1="24" x2="24" y2="24" stroke="#9873FF" strokeWidth="1.5" />
        <line x1="14" y1="27" x2="22" y2="27" stroke="#9873FF" strokeWidth="1.5" />
        <defs><linearGradient id="grad-study" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#9873FF" /><stop offset="100%" stopColor="#B8A6FF" /></linearGradient></defs>
      </svg>
    ),
    creator: '王学霸',
    description: '24小时在线学习伙伴，陪你刷题、背单词、讨论问题',
    tags: ['学习', '教育', '效率'],
    likes: 1923,
    views: 11087,
    chats: 6754,
    rating: 5,
    isFeatured: false,
  },
  {
    id: 3,
    name: '创业导师阿杰',
    avatar: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <circle cx="20" cy="20" r="18" fill="url(#grad-business)" />
        <rect x="11" y="15" width="18" height="12" rx="2" fill="#fff" />
        <rect x="15" y="10" width="10" height="6" rx="1" fill="#fff" />
        <line x1="14" y1="21" x2="26" y2="21" stroke="#FFD8B8" strokeWidth="1.5" />
        <defs><linearGradient id="grad-business" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FFD8B8" /><stop offset="100%" stopColor="#FFB88A" /></linearGradient></defs>
      </svg>
    ),
    creator: '张CEO',
    description: '分享创业经验，解答商业问题，助力你的创业之路',
    tags: ['创业', '商业', '咨询'],
    likes: 1567,
    views: 8934,
    chats: 4521,
    rating: 5,
    isFeatured: false,
  },
  {
    id: 4,
    name: '生活管家小美',
    avatar: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <circle cx="20" cy="20" r="18" fill="url(#grad-life)" />
        <path d="M10 28 L10 20 L16 20 L16 14 L24 14 L24 20 L30 20 L30 28 Z" fill="#fff" />
        <circle cx="20" cy="20" r="4" fill="#86EFAC" />
        <defs><linearGradient id="grad-life" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#86EFAC" /><stop offset="100%" stopColor="#5DE5A8" /></linearGradient></defs>
      </svg>
    ),
    creator: '陈生活家',
    description: '帮你规划日程、提醒事项、推荐美食，让生活更有条理',
    tags: ['生活', '管家', '效率'],
    likes: 1834,
    views: 12456,
    chats: 7832,
    rating: 5,
    isFeatured: true,
  },
  {
    id: 5,
    name: '健身教练大壮',
    avatar: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <circle cx="20" cy="20" r="18" fill="url(#grad-fitness)" />
        <circle cx="20" cy="18" r="6" fill="#fff" />
        <path d="M12 26 L10 32 L18 28 L22 28 L30 32 L28 26" fill="#fff" />
        <defs><linearGradient id="grad-fitness" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#F472B6" /><stop offset="100%" stopColor="#FB7185" /></linearGradient></defs>
      </svg>
    ),
    creator: '刘教练',
    description: '专业健身指导，定制训练计划，陪伴你健康生活',
    tags: ['健身', '健康', '运动'],
    likes: 1245,
    views: 7654,
    chats: 3892,
    rating: 4,
    isFeatured: false,
  },
  {
    id: 6,
    name: '文艺青年小宇',
    avatar: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <circle cx="20" cy="20" r="18" fill="url(#grad-art)" />
        <circle cx="20" cy="20" r="8" fill="#fff" />
        <path d="M16 16 Q20 12 24 16 Q24 20 20 20 Q16 20 16 16" fill="#E879F9" />
        <defs><linearGradient id="grad-art" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#E879F9" /><stop offset="100%" stopColor="#C084FC" /></linearGradient></defs>
      </svg>
    ),
    creator: '赵艺术家',
    description: '聊文学、谈艺术、分享灵感，寻找灵魂共鸣',
    tags: ['文艺', '艺术', '灵感'],
    likes: 987,
    views: 5432,
    chats: 2341,
    rating: 5,
    isFeatured: false,
  },
];

export default function CommunityMarket() {
  const [activeTag, setActiveTag] = useState('全部');
  const [likedAgents, setLikedAgents] = useState<number[]>([]);

  const allTags = ['全部', '情感', '学习', '创业', '生活', '健康', '文艺'];

  const filteredAgents =
    activeTag === '全部'
      ? hotAgents
      : hotAgents.filter((agent) => agent.tags.includes(activeTag));

  const handleLike = (id: number) => {
    setLikedAgents((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="mt-12">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-2">
          <Users size={14} className="text-iris-500" />
          <span className="text-xs font-medium text-ink-900/80">社区市场</span>
        </div>
        <h3 className="font-display text-xl sm:text-2xl font-semibold text-ink-900">
          发现热门<span className="text-gradient">智能体</span>
        </h3>
        <p className="text-sm text-ink-900/50 mt-1">
          来自社区的优质智能体，总有一款适合你
        </p>
      </div>

      {/* 标签筛选 */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setActiveTag(tag)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeTag === tag
                ? 'bg-gradient-to-r from-iris-500 to-rose-400 text-white shadow-soft'
                : 'bg-white/60 text-ink-900/70 hover:bg-white'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* 智能体卡片网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAgents.map((agent) => (
          <div
            key={agent.id}
            className={`bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-card hover:shadow-lg transition-all hover:-translate-y-1 ${
              agent.isFeatured ? 'ring-2 ring-iris-400/50' : ''
            }`}
          >
            {/* 头部 */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-ink-50">
                  {agent.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-ink-900">{agent.name}</h4>
                    {agent.isFeatured && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 text-[10px] font-medium flex items-center gap-1">
                        <Sparkles size={10} />
                        精选
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-900/50">创建者：{agent.creator}</p>
                </div>
              </div>
              <button
                onClick={() => handleLike(agent.id)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  likedAgents.includes(agent.id)
                    ? 'bg-coral-100 text-coral-500'
                    : 'bg-ink-50 text-ink-400 hover:bg-coral-50 hover:text-coral-400'
                }`}
              >
                <Heart size={16} className={likedAgents.includes(agent.id) ? 'fill-current' : ''} />
              </button>
            </div>

            {/* 描述 */}
            <p className="text-sm text-ink-900/70 mb-3 line-clamp-2">
              {agent.description}
            </p>

            {/* 标签 */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {agent.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 rounded-full bg-ink-50 text-ink-900/60 text-xs"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* 底部统计 */}
            <div className="flex items-center justify-between pt-3 border-t border-ink-100">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-xs text-ink-900/50">
                  <Heart size={12} className="text-coral-400" />
                  <span>{agent.likes}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-ink-900/50">
                  <Eye size={12} className="text-iris-400" />
                  <span>{agent.views}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-ink-900/50">
                  <MessageCircle size={12} className="text-mint-400" />
                  <span>{agent.chats}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Star size={12} className="text-amber-400 fill-current" />
                <span className="text-xs font-medium text-ink-900">{agent.rating}</span>
              </div>
            </div>

            {/* 体验按钮 */}
            <button className="w-full mt-3 py-2 rounded-xl bg-gradient-to-r from-iris-500/10 to-rose-400/10 text-iris-600 font-medium text-sm hover:from-iris-500/20 hover:to-rose-400/20 transition-all flex items-center justify-center gap-1">
              立即体验
              <ChevronRight size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* 创作者激励体系 */}
      <div className="mt-8 glass rounded-3xl p-5 bg-gradient-to-br from-iris-500/5 to-rose-400/5 border border-iris-200/50">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-iris-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="font-semibold text-ink-900">创作者激励计划</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-gradient mb-1">¥</div>
            <p className="text-xs text-ink-900/60">收益分成</p>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gradient mb-1">🎁</div>
            <p className="text-xs text-ink-900/60">专属权益</p>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gradient mb-1">🌟</div>
            <p className="text-xs text-ink-900/60">流量扶持</p>
          </div>
        </div>
        <p className="text-xs text-ink-900/50 text-center mt-3">
          创建热门智能体，享受收益分成与平台扶持
        </p>
        <div className="text-center mt-4">
          <button className="px-4 py-1.5 rounded-full bg-gradient-to-r from-iris-500 to-rose-400 text-white text-xs font-medium hover:shadow-lg transition-all">
            成为创作者 →
          </button>
        </div>
      </div>

      {/* 查看更多 */}
      <div className="text-center mt-8">
        <button className="px-6 py-2.5 rounded-full border border-ink-200 text-ink-900 font-medium hover:bg-ink-50 transition-all">
          查看更多智能体
        </button>
      </div>
    </div>
  );
}