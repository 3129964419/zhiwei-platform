import { create } from 'zustand';

interface DarkModeStore {
  isDark: boolean;
  toggle: () => void;
  set: (value: boolean) => void;
}

export const useDarkModeStore = create<DarkModeStore>((set) => ({
  isDark: typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches,
  toggle: () => set((state) => ({ isDark: !state.isDark })),
  set: (value) => set({ isDark: value }),
}));