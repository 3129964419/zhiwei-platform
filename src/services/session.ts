import { storage } from './storage';

const SESSION_KEY = 'zhiwei:session-expiry';

export const session = {
  setExpiry(hours: number = 24): void {
    const expiry = Date.now() + hours * 60 * 60 * 1000;
    storage.set(SESSION_KEY, expiry);
  },

  getExpiry(): number | null {
    return storage.get<number | null>(SESSION_KEY, null);
  },

  isExpired(): boolean {
    const expiry = this.getExpiry();
    if (!expiry) return false;
    return Date.now() > expiry;
  },

  clear(): void {
    storage.remove(SESSION_KEY);
  },

  refresh(): void {
    this.setExpiry(24);
  },
};

export const monitorSession = (onExpired: () => void): (() => void) => {
  const checkInterval = setInterval(() => {
    if (session.isExpired()) {
      clearInterval(checkInterval);
      onExpired();
    }
  }, 60000);

  const handleActivity = () => {
    session.refresh();
  };

  window.addEventListener('mousemove', handleActivity);
  window.addEventListener('keydown', handleActivity);
  window.addEventListener('click', handleActivity);
  window.addEventListener('scroll', handleActivity);

  return () => {
    clearInterval(checkInterval);
    window.removeEventListener('mousemove', handleActivity);
    window.removeEventListener('keydown', handleActivity);
    window.removeEventListener('click', handleActivity);
    window.removeEventListener('scroll', handleActivity);
  };
};