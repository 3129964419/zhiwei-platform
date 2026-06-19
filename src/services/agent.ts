// 智能体服务
import type { Agent, AnalysisReport, Message, Skill, PersonalityId, RelationshipId } from '@/types';
import { storage } from './storage';
import { delay, generateId, pickRandom } from '@/utils/common';
import { personalities } from '@/data/personalities';
import { analyzeScreenshots, buildSkillFromReport } from './nlp';

const AGENTS_KEY = 'agents';
const MESSAGES_KEY = 'messages';
const SKILLS_KEY = 'skills';

const REPLY_TEMPLATES: Record<string, string[]> = {
  gentle: [
    '嗯嗯，我懂你的感受呢。要不要我陪你聊聊？',
    '辛苦啦，今天也好好照顾自己哦～',
    '我在呢，随时都可以跟我说说。',
    '你已经很棒了，别太苛求自己呀。',
  ],
  tsundere: [
    '哼，又来找我了？算你有点良心。',
    '我才不是特意等你的消息呢，碰巧看到而已。',
    '行吧行吧，既然你都开口了，那我就勉为其难地答应你。',
    '切，这种小事都要我说第二遍吗？',
  ],
  domineering: [
    '听我的，这件事就这么办。',
    '别废话，按我说的来，不会让你吃亏。',
    '我让你做什么你就做什么，别想太多。',
  ],
  intellectual: [
    '这个问题的本质，其实涉及到一个有趣的认知偏差。',
    '从逻辑上推演，你这个想法有其合理之处。',
    '不妨换个角度思考，或许会有新的发现。',
  ],
  energetic: [
    '冲冲冲！今天又是元气满满的一天！',
    '哇塞这个也太棒了吧！我超爱！',
    '走起走起！有什么好犹豫的！',
  ],
  cool: [
    '嗯。',
    '知道了。',
    '随你。',
  ],
  neighbor: [
    '嘿，今天过得咋样啊？',
    '来来来，我跟你说个事儿！',
    '没事儿，就是想找你唠唠嗑。',
  ],
  mysterious: [
    '…有些事，知道太多反而无趣。',
    '你确定想知道答案？',
    '命运这种东西，从来不会直说。',
  ],
};

const FOLLOW_UP_REPLIES = [
  '然后呢？',
  '继续说，我在听。',
  '嗯，然后呢？',
  '那你怎么想？',
  '原来是这样啊',
];

const getTemplates = (personality: string | PersonalityId): string[] => {
  return REPLY_TEMPLATES[personality] || REPLY_TEMPLATES.gentle;
};

const pickAvatarGradient = (): [string, string] => {
  return pickRandom(personalities).gradient;
};

export const agentAPI = {
  async list(userId: string): Promise<Agent[]> {
    await delay(200);
    const all = storage.get<Agent[]>(AGENTS_KEY, []);
    return all
      .filter((a) => a.userId === userId)
      .sort((a, b) => b.lastUsedAt - a.lastUsedAt);
  },

  async getAll(): Promise<Agent[]> {
    await delay(200);
    return storage.get<Agent[]>(AGENTS_KEY, []);
  },

  async get(id: string): Promise<Agent | null> {
    const all = storage.get<Agent[]>(AGENTS_KEY, []);
    return all.find((a) => a.id === id) || null;
  },

  async createNormal(config: {
    userId: string;
    name: string;
    personality: PersonalityId | string;
    relationship: RelationshipId | string;
    interactionMode: Agent['interactionMode'];
    background: string;
    customPersonality?: string;
    customAvatar?: string;
  }): Promise<Agent> {
    await delay(2000);
    const agent: Agent = {
      id: generateId('agent'),
      userId: config.userId,
      name: config.name,
      personality: config.personality,
      relationship: config.relationship,
      interactionMode: config.interactionMode,
      background: config.background,
      avatar: config.customAvatar || config.name.slice(0, 1),
      avatarGradient: pickAvatarGradient(),
      status: 'active',
      customPersonality: config.customPersonality,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
    };
    const all = storage.get<Agent[]>(AGENTS_KEY, []);
    all.push(agent);
    storage.set(AGENTS_KEY, all);
    return agent;
  },

  async cloneFromScreenshots(
    files: File[],
    userId: string,
    name: string,
    onProgress?: (step: number, label: string) => void
  ): Promise<{ agent: Agent; skill: Skill; report: AnalysisReport }> {
    const report = await analyzeScreenshots(files, onProgress);
    await delay(500);

    const skill = buildSkillFromReport(report, '');

    const agent: Agent = {
      id: generateId('agent'),
      userId,
      name,
      personality: 'custom',
      relationship: 'friend',
      interactionMode: ['text', 'sticker'],
      background: report.summary,
      avatar: name.slice(0, 1),
      avatarGradient: pickAvatarGradient(),
      status: 'active',
      skillId: skill.id,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
    };
    skill.agentId = agent.id;

    const allAgents = storage.get<Agent[]>(AGENTS_KEY, []);
    allAgents.push(agent);
    storage.set(AGENTS_KEY, allAgents);

    const allSkills = storage.get<Skill[]>(SKILLS_KEY, []);
    allSkills.push(skill);
    storage.set(SKILLS_KEY, allSkills);

    return { agent, skill, report };
  },

  async update(id: string, data: Partial<Agent>): Promise<Agent> {
    const all = storage.get<Agent[]>(AGENTS_KEY, []);
    const idx = all.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error('Agent not found');
    all[idx] = { ...all[idx], ...data };
    storage.set(AGENTS_KEY, all);
    return all[idx];
  },

  async delete(id: string): Promise<void> {
    const all = storage.get<Agent[]>(AGENTS_KEY, []);
    storage.set(AGENTS_KEY, all.filter((a) => a.id !== id));
    const msgs = storage.get<Message[]>(MESSAGES_KEY, []);
    storage.set(MESSAGES_KEY, msgs.filter((m) => m.agentId !== id));
  },

  async duplicate(id: string): Promise<Agent> {
    const all = storage.get<Agent[]>(AGENTS_KEY, []);
    const origin = all.find((a) => a.id === id);
    if (!origin) throw new Error('Agent not found');
    const copy: Agent = {
      ...origin,
      id: generateId('agent'),
      name: origin.name + ' (副本)',
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
    };
    all.push(copy);
    storage.set(AGENTS_KEY, all);
    return copy;
  },

  async touch(id: string): Promise<void> {
    const all = storage.get<Agent[]>(AGENTS_KEY, []);
    const idx = all.findIndex((a) => a.id === id);
    if (idx === -1) return;
    all[idx].lastUsedAt = Date.now();
    storage.set(AGENTS_KEY, all);
  },

  async getMessages(agentId: string): Promise<Message[]> {
    const all = storage.get<Message[]>(MESSAGES_KEY, []);
    return all
      .filter((m) => m.agentId === agentId)
      .sort((a, b) => a.timestamp - b.timestamp);
  },

  async addMessage(message: Omit<Message, 'id' | 'timestamp'>): Promise<Message> {
    const msg: Message = {
      ...message,
      id: generateId('msg'),
      timestamp: Date.now(),
    };
    const all = storage.get<Message[]>(MESSAGES_KEY, []);
    all.push(msg);
    storage.set(MESSAGES_KEY, all);
    return msg;
  },

  async clearMessages(agentId: string): Promise<void> {
    const all = storage.get<Message[]>(MESSAGES_KEY, []);
    storage.set(MESSAGES_KEY, all.filter((m) => m.agentId !== agentId));
  },

  async sendMessage(agent: Agent, content: string): Promise<Message> {
    await delay(800 + Math.random() * 1200);
    const templates = getTemplates(agent.personality);
    let reply = pickRandom(templates);
    if (Math.random() > 0.6) {
      reply = pickRandom(templates) + ' ' + pickRandom(FOLLOW_UP_REPLIES);
    }
    return this.addMessage({
      agentId: agent.id,
      role: 'agent',
      content: reply,
      type: 'text',
    });
  },

  async getSkill(agentId: string): Promise<Skill | null> {
    const all = storage.get<Skill[]>(SKILLS_KEY, []);
    return all.find((s) => s.agentId === agentId) || null;
  },
};
