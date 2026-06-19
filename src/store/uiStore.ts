import { create } from 'zustand';

interface Toast {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface UIState {
  toasts: Toast[];
  legalAccepted: boolean;
  showLegalModal: boolean;
  onboardingCompleted: boolean;
  showOnboarding: boolean;
  addToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: number) => void;
  acceptLegal: () => void;
  openLegal: () => void;
  closeLegal: () => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
}

let toastId = 0;

export const useUIStore = create<UIState>((set, get) => ({
  toasts: [],
  legalAccepted: localStorage.getItem('zhiwei:legalAccepted') === 'true',
  showLegalModal: false,
  onboardingCompleted: localStorage.getItem('zhiwei:onboardingCompleted') === 'true',
  showOnboarding: localStorage.getItem('zhiwei:onboardingCompleted') !== 'true',

  addToast: (type, message) => {
    const id = ++toastId;
    set({ toasts: [...get().toasts, { id, type, message }] });
    setTimeout(() => {
      set({ toasts: get().toasts.filter((t) => t.id !== id) });
    }, 3000);
  },

  removeToast: (id) => {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },

  acceptLegal: () => {
    localStorage.setItem('zhiwei:legalAccepted', 'true');
    set({ legalAccepted: true, showLegalModal: false });
  },

  openLegal: () => set({ showLegalModal: true }),
  closeLegal: () => set({ showLegalModal: false }),

  completeOnboarding: () => {
    localStorage.setItem('zhiwei:onboardingCompleted', 'true');
    set({ onboardingCompleted: true, showOnboarding: false });
  },

  skipOnboarding: () => {
    localStorage.setItem('zhiwei:onboardingCompleted', 'true');
    set({ onboardingCompleted: true, showOnboarding: false });
  },
}));
