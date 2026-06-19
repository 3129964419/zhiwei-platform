/**
 * 重试机制工具函数
 * 用于 API 调用失败时自动重试
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  shouldRetry?: (error: Error) => boolean;
  onRetry?: (attempt: number, error: Error) => void;
}

const defaultShouldRetry = (error: Error): boolean => {
  // 网络错误、超时、5xx 服务器错误时重试
  const retryableMessages = [
    'network',
    'timeout',
    'ECONNREFUSED',
    'ENOTFOUND',
    'ETIMEDOUT',
    'fetch',
    'Failed to fetch',
  ];

  const message = error.message.toLowerCase();
  return retryableMessages.some((m) => message.includes(m.toLowerCase()));
};

/**
 * 带指数退避的重试函数
 * @param fn - 需要重试的异步函数
 * @param options - 重试选项
 * @returns Promise<T>
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    shouldRetry = defaultShouldRetry,
    onRetry,
  } = options;

  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // 检查是否应该重试
      if (attempt === maxRetries || !shouldRetry(lastError)) {
        throw lastError;
      }

      // 计算延迟时间（指数退避）
      const delay = Math.min(
        initialDelay * Math.pow(backoffFactor, attempt),
        maxDelay
      );

      // 添加随机抖动避免雷群效应
      const jitter = Math.random() * 0.1 * delay;
      const actualDelay = delay + jitter;

      // 调用重试回调
      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }

      // 等待后重试
      await new Promise((resolve) => setTimeout(resolve, actualDelay));
    }
  }

  throw lastError;
}

/**
 * 带超时的异步函数
 * @param fn - 异步函数
 * @param timeoutMs - 超时时间（毫秒）
 * @returns Promise<T>
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([fn(), timeoutPromise]);
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    return result;
  } catch (error) {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    throw error;
  }
}

/**
 * 带重试和超时的异步函数
 * @param fn - 异步函数
 * @param options - 重试和超时选项
 * @returns Promise<T>
 */
export async function withRetryAndTimeout<T>(
  fn: () => Promise<T>,
  options: RetryOptions & { timeout?: number } = {}
): Promise<T> {
  const { timeout = 30000, ...retryOptions } = options;

  return withRetry(
    () => withTimeout(fn, timeout),
    retryOptions
  );
}

/**
 * 请求去重器
 * 防止短时间内重复发送相同请求
 */
export class RequestDeduplicator<T> {
  private pendingRequests = new Map<string, Promise<T>>();

  async dedupe(key: string, fn: () => Promise<T>): Promise<T> {
    // 如果已有相同请求在进行中，返回该 Promise
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    // 创建新请求
    const promise = fn().finally(() => {
      // 请求完成后清理
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  clear(): void {
    this.pendingRequests.clear();
  }
}

/**
 * 创建请求去重器实例
 */
export function createDeduplicator<T>(): RequestDeduplicator<T> {
  return new RequestDeduplicator<T>();
}
