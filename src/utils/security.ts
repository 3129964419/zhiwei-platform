const CSRF_KEY = 'zhiwei:csrf-token';

const generateCSRFToken = (): string => {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 15)}_${Math.random().toString(36).slice(2, 15)}`;
};

export const csrf = {
  getToken(): string {
    let token = localStorage.getItem(CSRF_KEY);
    if (!token) {
      token = generateCSRFToken();
      localStorage.setItem(CSRF_KEY, token);
    }
    return token;
  },

  refreshToken(): string {
    const token = generateCSRFToken();
    localStorage.setItem(CSRF_KEY, token);
    return token;
  },

  validateToken(token: string): boolean {
    const stored = localStorage.getItem(CSRF_KEY);
    return stored === token;
  },

  clearToken(): void {
    localStorage.removeItem(CSRF_KEY);
  },
};

/**
 * 安全地清理 HTML 字符串，防止 XSS 攻击
 * @param html - 需要清理的 HTML 字符串
 * @param options - 可选的配置选项
 * @returns 清理后的安全 HTML 字符串
 */
export const sanitizeHTML = (html: string, options?: {
  ALLOWED_TAGS?: string[];
  ALLOWED_ATTR?: string[];
  KEEP_CONTENT?: boolean;
}): string => {
  // 使用 DOMPurify 清理 HTML
  let result = html;
  
  // 移除危险的标签和属性
  result = result.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  result = result.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  result = result.replace(/on\w+\s*=\s*["'][^"']*["']/gi, ''); // 移除事件处理器
  result = result.replace(/javascript:/gi, '');
  
  // 保留基本的安全标签
  const safeTags = ['b', 'i', 'em', 'strong', 'br', 'p', 'span'];
  const allowedTags = options?.ALLOWED_TAGS || safeTags;
  
  // 如果需要，保留内容
  if (options?.KEEP_CONTENT ?? true) {
    // 保留允许的标签及其内容
    allowedTags.forEach(tag => {
      // 不需要特殊处理，标签会被保留
    });
  }
  
  // 移除所有不在允许列表中的标签，但保留其内容
  result = result.replace(/<(\/?)([\w-]+)([^>]*)>/gi, (match, isClosing, tagName, attrs) => {
    const lowerTag = tagName.toLowerCase();
    if (allowedTags.includes(lowerTag)) {
      // 保留安全标签
      if (attrs) {
        // 只保留安全属性
        const safeAttrs = options?.ALLOWED_ATTR || ['class'];
        const filteredAttrs = attrs.replace(/(\w+)=["'][^"']*["']/gi, (attrMatch: string, attrName: string) => {
          if (safeAttrs.includes(attrName.toLowerCase())) {
            return attrMatch;
          }
          return '';
        });
        return `<${isClosing}${lowerTag}${filteredAttrs}>`;
      }
      return `<${isClosing}${lowerTag}>`;
    }
    // 移除标签但保留内容（对于非关闭标签）
    if (!isClosing && !['br', 'hr', 'img'].includes(lowerTag)) {
      return '';
    }
    if (isClosing) {
      return '';
    }
    return match;
  });
  
  return result;
};

/**
 * 清理纯文本，移除所有 HTML 标签
 * @param text - 需要清理的文本
 * @returns 纯文本字符串
 */
export const sanitizeText = (text: string): string => {
  return text.replace(/<[^>]*>/g, '');
};

export const isSafeURL = (url: string): boolean => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.startsWith('javascript:')) return false;
  if (lowerUrl.startsWith('data:')) return false;
  if (lowerUrl.startsWith('vbscript:')) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateOrigin = (allowedOrigins: string[]): boolean => {
  if (typeof window === 'undefined') return true;
  const origin = window.location.origin;
  return allowedOrigins.includes(origin);
};