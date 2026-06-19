import { storage } from './storage';
import type { Agent } from '@/types';
import { generateId } from '@/utils/common';

export interface SharedAgent {
  id: string;
  agentId: string;
  name: string;
  personality: string;
  relationship: string;
  background: string;
  avatar: string;
  avatarGradient: [string, string];
  authorId: string;
  authorName: string;
  likes: number;
  downloads: number;
  tags: string[];
  createdAt: number;
  featured: boolean;
}

export interface CommunityStats {
  totalShares: number;
  totalDownloads: number;
  totalLikes: number;
}

const SHARED_AGENTS_KEY = 'shared_agents';
const USER_LIKES_KEY = 'user_likes';

export const communityService = {
  // 分享智能体到社区
  shareAgent(agent: Agent, authorName: string): SharedAgent {
    const shared: SharedAgent = {
      id: generateId('share'),
      agentId: agent.id,
      name: agent.name,
      personality: agent.personality,
      relationship: agent.relationship,
      background: agent.background,
      avatar: agent.avatar,
      avatarGradient: agent.avatarGradient,
      authorId: agent.userId,
      authorName,
      likes: 0,
      downloads: 0,
      tags: [agent.personality, agent.relationship],
      createdAt: Date.now(),
      featured: false,
    };

    const all = storage.get<SharedAgent[]>(SHARED_AGENTS_KEY, []);
    all.unshift(shared);
    storage.set(SHARED_AGENTS_KEY, all);

    return shared;
  },

  // 取消分享
  unshareAgent(shareId: string): void {
    const all = storage.get<SharedAgent[]>(SHARED_AGENTS_KEY, []);
    storage.set(SHARED_AGENTS_KEY, all.filter(s => s.id !== shareId));
  },

  // 获取分享列表
  getSharedAgents(options?: {
    sort?: 'popular' | 'newest';
    tag?: string;
    limit?: number;
  }): SharedAgent[] {
    let all = storage.get<SharedAgent[]>(SHARED_AGENTS_KEY, []);

    // 按标签过滤
    if (options?.tag) {
      all = all.filter(s => s.tags.includes(options.tag!));
    }

    // 排序
    if (options?.sort === 'popular') {
      all.sort((a, b) => b.likes - a.likes);
    } else {
      all.sort((a, b) => b.createdAt - a.createdAt);
    }

    // 限制数量
    if (options?.limit) {
      all = all.slice(0, options.limit);
    }

    return all;
  },

  // 获取用户分享的智能体
  getUserShares(userId: string): SharedAgent[] {
    const all = storage.get<SharedAgent[]>(SHARED_AGENTS_KEY, []);
    return all.filter(s => s.authorId === userId);
  },

  // 检查是否已分享
  isShared(agentId: string): SharedAgent | null {
    const all = storage.get<SharedAgent[]>(SHARED_AGENTS_KEY, []);
    return all.find(s => s.agentId === agentId) || null;
  },

  // 点赞
  likeShare(shareId: string, userId: string): boolean {
    const likes = storage.get<Set<string>>(USER_LIKES_KEY, new Set());
    const likeSet = likes instanceof Set ? likes : new Set(likes as unknown as string[]);
    const key = `${userId}:${shareId}`;

    if (likeSet.has(key)) {
      // 取消点赞
      likeSet.delete(key);
      storage.set(USER_LIKES_KEY, Array.from(likeSet));

      const all = storage.get<SharedAgent[]>(SHARED_AGENTS_KEY, []);
      const share = all.find(s => s.id === shareId);
      if (share) {
        share.likes = Math.max(0, share.likes - 1);
        storage.set(SHARED_AGENTS_KEY, all);
      }
      return false;
    } else {
      // 点赞
      likeSet.add(key);
      storage.set(USER_LIKES_KEY, Array.from(likeSet));

      const all = storage.get<SharedAgent[]>(SHARED_AGENTS_KEY, []);
      const share = all.find(s => s.id === shareId);
      if (share) {
        share.likes++;
        storage.set(SHARED_AGENTS_KEY, all);
      }
      return true;
    }
  },

  // 检查是否已点赞
  hasLiked(shareId: string, userId: string): boolean {
    const likes = storage.get<string[]>(USER_LIKES_KEY, []);
    return likes.includes(`${userId}:${shareId}`);
  },

  // 下载/克隆智能体
  downloadShare(shareId: string, userId: string): Agent {
    const all = storage.get<SharedAgent[]>(SHARED_AGENTS_KEY, []);
    const share = all.find(s => s.id === shareId);
    if (!share) throw new Error('分享不存在');

    // 增加下载计数
    share.downloads++;
    storage.set(SHARED_AGENTS_KEY, all);

    // 创建克隆
    const agent: Agent = {
      id: generateId('agent'),
      userId,
      name: share.name,
      personality: share.personality,
      relationship: share.relationship,
      background: share.background,
      avatar: share.avatar,
      avatarGradient: share.avatarGradient,
      interactionMode: ['text', 'sticker'],
      status: 'active',
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
    };

    const agents = storage.get<Agent[]>('agents', []);
    agents.push(agent);
    storage.set('agents', agent);

    return agent;
  },

  // 获取统计
  getStats(): CommunityStats {
    const all = storage.get<SharedAgent[]>(SHARED_AGENTS_KEY, []);
    return {
      totalShares: all.length,
      totalDownloads: all.reduce((sum, s) => sum + s.downloads, 0),
      totalLikes: all.reduce((sum, s) => sum + s.likes, 0),
    };
  },

  // 获取热门标签
  getPopularTags(): { tag: string; count: number }[] {
    const all = storage.get<SharedAgent[]>(SHARED_AGENTS_KEY, []);
    const tagCounts: Record<string, number> = {};

    all.forEach(share => {
      share.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  },
};
