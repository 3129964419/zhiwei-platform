/**
 * 防抖函数
 * @param fn - 需要防抖的函数
 * @param delay - 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * 节流函数
 * @param fn - 需要节流的函数
 * @param limit - 时间限制（毫秒）
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * 异步防抖函数
 * @param fn - 需要防抖的异步函数
 * @param delay - 延迟时间（毫秒）
 * @returns 防抖后的异步函数
 */
export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let latestResolve: ((value: any) => void) | null = null;

  return function (this: any, ...args: Parameters<T>): Promise<ReturnType<T>> {
    return new Promise((resolve) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      latestResolve = resolve;

      timeoutId = setTimeout(async () => {
        const result = await fn.apply(this, args);
        if (latestResolve === resolve) {
          resolve(result);
        }
        timeoutId = null;
      }, delay);
    });
  };
}

/**
 * 带取消功能的防抖函数
 */
export function debounceWithCancel<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): {
  call: (...args: Parameters<T>) => void;
  cancel: () => void;
  flush: () => void;
} {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const call = function (this: any, ...args: Parameters<T>) {
    lastArgs = args;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
      lastArgs = null;
    }, delay);
  };

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
      lastArgs = null;
    }
  };

  const flush = () => {
    if (timeoutId && lastArgs) {
      fn(...lastArgs);
      cancel();
    }
  };

  return { call, cancel, flush };
}
