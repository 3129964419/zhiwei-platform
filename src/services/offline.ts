/**
 * 离线模式服务
 * 检测网络状态、缓存管理、离线消息队列
 */

import { storage } from './storage';

// 离线消息队列 Key
const OFFLINE_QUEUE_KEY = 'offline_message_queue';

// 网络状态
export type NetworkStatus = 'online' | 'offline' | 'slow';

// 离线消息
export interface OfflineMessage {
  id: string;
  agentId: string;
  content: string;
  timestamp: number;
  retryCount: number;
}

// 网络状态变化监听器
type NetworkStatusListener = (status: NetworkStatus) => void;

class OfflineService {
  private status: NetworkStatus = 'online';
  private listeners: Set<NetworkStatusListener> = new Set();
  private slowConnectionTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    // 初始状态
    this.status = navigator.onLine ? 'online' : 'offline';

    // 监听网络状态变化
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // 监听连接速度
    this.monitorConnectionSpeed();
  }

  private handleOnline = () => {
    this.setStatus('online');
    // 自动重试离线消息
    this.retryOfflineMessages();
  };

  private handleOffline = () => {
    this.setStatus('offline');
  };

  private monitorConnectionSpeed() {
    // 使用 Network Information API（如果可用）
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', () => {
        const effectiveType = connection.effectiveType;
        if (effectiveType === 'slow-2g' || effectiveType === '2g') {
          this.setStatus('slow');
        } else if (navigator.onLine) {
          this.setStatus('online');
        }
      });
    }
  }

  private setStatus(status: NetworkStatus) {
    if (this.status !== status) {
      this.status = status;
      this.notifyListeners();
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.status);
      } catch (error) {
        console.error('Network status listener error:', error);
      }
    });
  }

  /**
   * 获取当前网络状态
   */
  getStatus(): NetworkStatus {
    return this.status;
  }

  /**
   * 是否在线
   */
  isOnline(): boolean {
    return this.status === 'online';
  }

  /**
   * 是否离线
   */
  isOffline(): boolean {
    return this.status === 'offline';
  }

  /**
   * 是否慢速连接
   */
  isSlowConnection(): boolean {
    return this.status === 'slow';
  }

  /**
   * 添加网络状态监听器
   */
  addListener(listener: NetworkStatusListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 添加消息到离线队列
   */
  addToQueue(message: Omit<OfflineMessage, 'id' | 'timestamp' | 'retryCount'>): string {
    const queue = this.getQueue();
    const id = `offline_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    queue.push({
      ...message,
      id,
      timestamp: Date.now(),
      retryCount: 0,
    });

    storage.set(OFFLINE_QUEUE_KEY, queue);

    // 触发自定义事件
    window.dispatchEvent(
      new CustomEvent('offline:messageQueued', {
        detail: { id, agentId: message.agentId },
      })
    );

    return id;
  }

  /**
   * 获取离线消息队列
   */
  getQueue(): OfflineMessage[] {
    return storage.get<OfflineMessage[]>(OFFLINE_QUEUE_KEY, []);
  }

  /**
   * 从队列中移除消息
   */
  removeFromQueue(messageId: string): void {
    const queue = this.getQueue().filter((msg) => msg.id !== messageId);
    storage.set(OFFLINE_QUEUE_KEY, queue);
  }

  /**
   * 清空离线队列
   */
  clearQueue(): void {
    storage.set(OFFLINE_QUEUE_KEY, []);
  }

  /**
   * 重试离线消息
   */
  async retryOfflineMessages(): Promise<void> {
    const queue = this.getQueue();
    if (queue.length === 0) return;

    // 触发自定义事件
    window.dispatchEvent(
      new CustomEvent('offline:retryStart', {
        detail: { count: queue.length },
      })
    );

    for (const message of queue) {
      try {
        // 触发自定义事件，让外部处理消息发送
        const event = new CustomEvent('offline:retryMessage', {
          detail: message,
          cancelable: true,
        });

        const dispatched = window.dispatchEvent(event);

        // 如果事件被处理（preventDefault），则从队列中移除
        if (!dispatched || event.defaultPrevented) {
          this.removeFromQueue(message.id);
        }
      } catch (error) {
        console.error('Retry offline message error:', error);

        // 更新重试次数
        const updatedQueue = this.getQueue();
        const msgIndex = updatedQueue.findIndex((m) => m.id === message.id);
        if (msgIndex !== -1) {
          updatedQueue[msgIndex].retryCount++;
          // 超过 5 次重试则移除
          if (updatedQueue[msgIndex].retryCount >= 5) {
            updatedQueue.splice(msgIndex, 1);
          }
          storage.set(OFFLINE_QUEUE_KEY, updatedQueue);
        }
      }
    }

    // 触发自定义事件
    window.dispatchEvent(new CustomEvent('offline:retryComplete'));
  }

  /**
   * 获取队列统计
   */
  getQueueStats(): { count: number; oldestTimestamp: number | null } {
    const queue = this.getQueue();
    return {
      count: queue.length,
      oldestTimestamp: queue.length > 0 ? queue[0].timestamp : null,
    };
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    this.listeners.clear();
  }
}

// 导出单例
export const offlineService = new OfflineService();

// React Hook
import { useState, useEffect } from 'react';

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(offlineService.getStatus());

  useEffect(() => {
    return offlineService.addListener(setStatus);
  }, []);

  return status;
}

export function useOfflineQueue() {
  const [queue, setQueue] = useState<OfflineMessage[]>(offlineService.getQueue());

  useEffect(() => {
    const handleMessageQueued = () => {
      setQueue(offlineService.getQueue());
    };

    const handleRetryComplete = () => {
      setQueue(offlineService.getQueue());
    };

    window.addEventListener('offline:messageQueued', handleMessageQueued);
    window.addEventListener('offline:retryComplete', handleRetryComplete);

    return () => {
      window.removeEventListener('offline:messageQueued', handleMessageQueued);
      window.removeEventListener('offline:retryComplete', handleRetryComplete);
    };
  }, []);

  return {
    queue,
    count: queue.length,
    addToQueue: offlineService.addToQueue.bind(offlineService),
    removeFromQueue: offlineService.removeFromQueue.bind(offlineService),
    clearQueue: offlineService.clearQueue.bind(offlineService),
    retry: offlineService.retryOfflineMessages.bind(offlineService),
  };
}
