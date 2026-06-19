import { create } from 'zustand';
import type { User, UserSettings } from '@/types';
import { authAPI } from '@/services/auth';
import { settingsAPI } from '@/services/settings';

interface UserState {
  user: User | null;
  settings: UserSettings;
  loading: boolean;
  init: () => void;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  loadSettings: () => Promise<void>;
  updateSettings: (data: Partial<UserSettings>) => Promise<void>;
}

const DEFAULT_SETTINGS: UserSettings = {
  stickerAutoReply: true,
  replySpeed: 'normal',
  voice: { autoPlay: false, rate: 1, volume: 1 },
  notification: { sound: true, desktop: false, email: false },
  privacy: { showOnlineStatus: true, allowDataAnalytics: true },
};

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  settings: DEFAULT_SETTINGS,
  loading: true,

  init: () => {
    const user = authAPI.getCurrent();
    set({ user, loading: false });
    get().loadSettings();
  },

  login: (user) => {
    authAPI.updateUser(user);
    set({ user });
  },

  logout: () => {
    authAPI.logout();
    set({ user: null });
  },

  updateUser: (data) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, ...data };
    authAPI.updateUser(updated);
    set({ user: updated });
  },

  loadSettings: async () => {
    const settings = await settingsAPI.getSettings();
    set({ settings });
  },

  updateSettings: async (data) => {
    const newSettings = { ...get().settings, ...data };
    await settingsAPI.saveSettings(newSettings);
    set({ settings: newSettings });
  },
}));
