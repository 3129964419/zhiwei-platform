// LocalStorage 封装
const PREFIX = 'zhiwei:';

// LocalStorage 容量限制（大约 5MB）
const STORAGE_QUOTA = 5 * 1024 * 1024;

// 警告阈值（80%）
const WARNING_THRESHOLD = 0.8;

export interface StorageInfo {
  used: number;
  quota: number;
  percentage: number;
  isNearLimit: boolean;
}

/**
 * 计算 LocalStorage 使用量
 */
function calculateUsage(): number {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      if (value) {
        // 计算字符串的字节大小（UTF-8 编码）
        total += new Blob([key + value]).size;
      }
    }
  }
  return total;
}

/**
 * 获取存储信息
 */
export function getStorageInfo(): StorageInfo {
  const used = calculateUsage();
  const percentage = (used / STORAGE_QUOTA) * 100;
  const isNearLimit = percentage > WARNING_THRESHOLD * 100;

  return {
    used,
    quota: STORAGE_QUOTA,
    percentage,
    isNearLimit,
  };
}

/**
 * 检查是否有足够空间
 */
function hasEnoughSpace(additionalBytes: number): boolean {
  const info = getStorageInfo();
  return info.used + additionalBytes < STORAGE_QUOTA;
}

/**
 * 清理旧数据以释放空间
 */
function cleanupOldData(): void {
  // 清理过期的会话数据
  const sessionsKey = PREFIX + 'sessions';
  try {
    const sessions = storage.get<any[]>(sessionsKey, []);
    if (sessions.length > 50) {
      // 只保留最近 50 个会话
      storage.set(sessionsKey, sessions.slice(-50));
    }
  } catch {
    // 忽略错误
  }

  // 清理旧的消息数据
  const messagesKey = PREFIX + 'messages';
  try {
    const messages = storage.get<any[]>(messagesKey, []);
    if (messages.length > 1000) {
      // 只保留最近 1000 条消息
      storage.set(messagesKey, messages.slice(-1000));
    }
  } catch {
    // 忽略错误
  }
}

export const storage = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): boolean {
    try {
      const serialized = JSON.stringify(value);
      const size = new Blob([serialized]).size;

      // 检查空间
      if (!hasEnoughSpace(size)) {
        // 尝试清理旧数据
        cleanupOldData();

        // 再次检查
        if (!hasEnoughSpace(size)) {
          console.warn('LocalStorage 容量不足，请清理数据');
          // 触发自定义事件通知用户
          window.dispatchEvent(
            new CustomEvent('storage:quotaExceeded', {
              detail: getStorageInfo(),
            })
          );
          return false;
        }
      }

      localStorage.setItem(PREFIX + key, serialized);

      // 检查是否接近限制
      const info = getStorageInfo();
      if (info.isNearLimit) {
        window.dispatchEvent(
          new CustomEvent('storage:nearLimit', {
            detail: info,
          })
        );
      }

      return true;
    } catch (e) {
      console.error('Storage set error:', e);

      // 处理 QuotaExceededError
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        window.dispatchEvent(
          new CustomEvent('storage:quotaExceeded', {
            detail: getStorageInfo(),
          })
        );
      }

      return false;
    }
  },

  remove(key: string): void {
    localStorage.removeItem(PREFIX + key);
  },

  clear(): void {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  },

  // 获取存储信息
  getInfo: getStorageInfo,

  // 清理旧数据
  cleanup: cleanupOldData,
};
