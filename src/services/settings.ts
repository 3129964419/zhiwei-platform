// 设置服务
import type { UserSettings } from '@/types';
import { storage } from './storage';
import { delay } from '@/utils/common';

const SETTINGS_KEY = 'userSettings';
const AGENTS_KEY = 'agents';
const MESSAGES_KEY = 'messages';

const DEFAULT_SETTINGS: UserSettings = {
  stickerAutoReply: true,
  replySpeed: 'normal',
  voice: {
    autoPlay: false,
    rate: 1,
    volume: 1,
  },
  notification: {
    sound: true,
    desktop: false,
    email: false,
  },
  privacy: {
    showOnlineStatus: true,
    allowDataAnalytics: true,
  },
};

export const settingsAPI = {
  async getSettings(): Promise<UserSettings> {
    await delay(100);
    return storage.get<UserSettings>(SETTINGS_KEY, DEFAULT_SETTINGS);
  },

  async saveSettings(settings: UserSettings): Promise<void> {
    storage.set(SETTINGS_KEY, settings);
  },

  async exportData(userId: string): Promise<Blob> {
    await delay(800);
    const agents = storage.get<unknown[]>(AGENTS_KEY, []).filter((a: any) => a.userId === userId);
    const messages = storage.get<unknown[]>(MESSAGES_KEY, []).filter((m: any) => {
      const agentIds = agents.map((a: any) => a.id);
      return agentIds.includes(m.agentId);
    });
    const settings = storage.get<UserSettings>(SETTINGS_KEY, DEFAULT_SETTINGS);
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      userId,
      agents,
      messages,
      settings,
      agentCount: agents.length,
      messageCount: messages.length,
    };
    return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  },

  async importData(file: File): Promise<{ agentCount: number; messageCount: number }> {
    const content = await file.text();
    const data = JSON.parse(content);
    
    if (!data.version || !data.agents) {
      throw new Error('无效的备份文件');
    }
    
    const existingAgents = storage.get<unknown[]>(AGENTS_KEY, []);
    const existingMessages = storage.get<unknown[]>(MESSAGES_KEY, []);
    
    const importedAgents = data.agents.map((agent: any) => ({
      ...agent,
      id: `${agent.id}_imported_${Date.now()}`,
    }));
    
    const importedMessages = data.messages.map((msg: any) => ({
      ...msg,
      id: `${msg.id}_imported_${Date.now()}`,
    }));
    
    storage.set(AGENTS_KEY, [...existingAgents, ...importedAgents]);
    storage.set(MESSAGES_KEY, [...existingMessages, ...importedMessages]);
    
    if (data.settings) {
      storage.set(SETTINGS_KEY, { ...DEFAULT_SETTINGS, ...data.settings });
    }
    
    return {
      agentCount: importedAgents.length,
      messageCount: importedMessages.length,
    };
  },

  async deleteAccount(): Promise<void> {
    await delay(600);
    storage.clear();
  },
};
