import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, Clock, Heart, Download, Users, Sparkles } from 'lucide-react';
import Layout from '@/components/Layout';
import { communityService, type SharedAgent } from '@/services/community';
import { useUserStore } from '@/store/userStore';
import { useAgentStore } from '@/store/agentStore';
import { useUIStore } from '@/store/uiStore';
import { personalities } from '@/data/personalities';
import { relationships } from '@/data/relationships';

type SortType = 'newest' | 'popular';

export default function Community() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const addAgent = useAgentStore((s) => s.addAgent);
  const addToast = useUIStore((s) => s.addToast);

  const [sharedAgents, setSharedAgents] = useState<SharedAgent[]>([]);
  const [sort, setSort] = useState<SortType>('newest');
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalShares: 0, totalDownloads: 0, totalLikes: 0 });
  const [popularTags, setPopularTags] = useState<{ tag: string; count: number }[]>([]);

  useEffect(() => {
    loadData();
  }, [sort, selectedTag]);

  const loadData = () => {
    const agents = communityService.getSharedAgents({
      sort,
      tag: selectedTag || undefined,
    });
    setSharedAgents(agents);
    setStats(communityService.getStats());
    setPopularTags(communityService.getPopularTags());
  };

  const filteredAgents = sharedAgents.filter(agent =>
    agent.name.toLowerCase().includes(search.toLowerCase()) ||
    agent.background.toLowerCase().includes(search.toLowerCase())
  );

  const handleLike = (shareId: string) => {
    if (!user) {
      addToast('info', '请先登录');
      return;
    }
    communityService.likeShare(shareId, user.id);
    loadData();
  };

  const handleDownload = (shareId: string) => {
    if (!user) {
      addToast('info', '请先登录');
      navigate('/login');
      return;
    }

    try {
      const agent = communityService.downloadShare(shareId, user.id);
      addAgent(agent);
      addToast('success', `已添加「${agent.name}」到你的智能体列表`);
      loadData();
    } catch (e: any) {
      addToast('error', e.message || '下载失败');
    }
  };

  const getPersonalityEmoji = (personality: string) => {
    const p = personalities.find(p => p.id === personality);
    return p?.emoji || '✨';
  };

  const getRelationshipName = (relationship: string) => {
    const r = relationships.find(r => r.id === relationship);
    return r?.name || '朋友';
  };

  return (
    <Layout>
      <div className="aurora-bg min-h-screen">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-4">
              <Users size={14} className="text-iris-500" />
              <span className="text-xs font-medium text-ink-900/80">智能体社区</span>
            </div>
            <h1 className="font-display text-4xl font-semibold mb-3">
              发现<span className="text-gradient mx-2">精彩智能体</span>
            </h1>
            <p className="text-ink-900/60 max-w-xl mx-auto">
              探索社区成员分享的智能体，一键克隆到你的列表
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="glass rounded-2xl p-4 text-center">
              <p className="text-2xl font-display font-semibold text-gradient">{stats.totalShares}</p>
              <p className="text-xs text-ink-900/50 mt-1">分享数</p>
            </div>
            <div className="glass rounded-2xl p-4 text-center">
              <p className="text-2xl font-display font-semibold text-gradient">{stats.totalDownloads}</p>
              <p className="text-xs text-ink-900/50 mt-1">下载数</p>
            </div>
            <div className="glass rounded-2xl p-4 text-center">
              <p className="text-2xl font-display font-semibold text-gradient">{stats.totalLikes}</p>
              <p className="text-xs text-ink-900/50 mt-1">点赞数</p>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-900/40" />
              <input
                type="text"
                placeholder="搜索智能体..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <div className="flex gap-1 p-1 bg-ink-100 rounded-full">
              <button
                onClick={() => setSort('newest')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition ${
                  sort === 'newest' ? 'bg-white text-ink-900 shadow-card' : 'text-ink-900/60'
                }`}
              >
                <Clock size={14} /> 最新
              </button>
              <button
                onClick={() => setSort('popular')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition ${
                  sort === 'popular' ? 'bg-white text-ink-900 shadow-card' : 'text-ink-900/60'
                }`}
              >
                <TrendingUp size={14} /> 热门
              </button>
            </div>
          </div>

          {/* Tags */}
          {popularTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  selectedTag === null
                    ? 'bg-iris-500 text-white'
                    : 'bg-ink-100 text-ink-900/60 hover:bg-ink-200'
                }`}
              >
                全部
              </button>
              {popularTags.slice(0, 8).map(({ tag, count }) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    selectedTag === tag
                      ? 'bg-iris-500 text-white'
                      : 'bg-ink-100 text-ink-900/60 hover:bg-ink-200'
                  }`}
                >
                  {tag} ({count})
                </button>
              ))}
            </div>
          )}

          {/* Agent Grid */}
          {filteredAgents.length === 0 ? (
            <div className="glass rounded-4xl p-16 text-center">
              <Sparkles size={48} className="mx-auto mb-4 text-ink-900/20" />
              <p className="text-ink-900/60 mb-2">暂无分享的智能体</p>
              <p className="text-sm text-ink-900/40">成为第一个分享的人吧！</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAgents.map((share) => (
                <div
                  key={share.id}
                  className="glass rounded-3xl p-5 hover-lift relative overflow-hidden group"
                >
                  <div
                    className="absolute inset-0 opacity-10 group-hover:opacity-20 transition"
                    style={{
                      background: `linear-gradient(135deg, ${share.avatarGradient[0]}, ${share.avatarGradient[1]})`,
                    }}
                  />

                  <div className="relative">
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl font-semibold shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${share.avatarGradient[0]}, ${share.avatarGradient[1]})`,
                        }}
                      >
                        {share.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-ink-900 truncate">{share.name}</h3>
                        <p className="text-xs text-ink-900/50">
                          {getPersonalityEmoji(share.personality)} · {getRelationshipName(share.relationship)}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-ink-900/70 line-clamp-2 mb-4 min-h-[2.5em]">
                      {share.background}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-ink-900/50">
                        <button
                          onClick={() => handleLike(share.id)}
                          className={`flex items-center gap-1 transition ${
                            user && communityService.hasLiked(share.id, user.id)
                              ? 'text-rose-400'
                              : 'hover:text-rose-400'
                          }`}
                        >
                          <Heart size={14} fill={user && communityService.hasLiked(share.id, user.id) ? 'currentColor' : 'none'} />
                          {share.likes}
                        </button>
                        <span className="flex items-center gap-1">
                          <Download size={14} /> {share.downloads}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDownload(share.id)}
                        className="px-4 py-1.5 rounded-full bg-iris-500 text-white text-xs font-medium hover:bg-iris-600 transition"
                      >
                        克隆
                      </button>
                    </div>

                    <div className="mt-3 pt-3 border-t border-ink-100">
                      <p className="text-xs text-ink-900/40">
                        分享者：{share.authorName}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
