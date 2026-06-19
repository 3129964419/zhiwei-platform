/**
 * 火山引擎大模型 API 服务
 * 支持 Doubao、DeepSeek 等模型
 * API 文档: https://www.volcengine.com/docs/82379/1263512
 */

import { storage } from './storage';
import { pricingService, type SubscriptionTier } from './pricing';

// =============================================
// 类型定义
// =============================================

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface TTSOptions {
  model?: string;
  voice?: string;
  text: string;
  speed?: number;
  pitch?: number;
  volume?: number;
}

export interface TTSResponse {
  audio: string;
  audio_format: string;
  duration?: number;
}

// 火山引擎 Token 成本配置 (¥/MTok)
export const VOLCANO_TOKEN_COST = {
  // Doubao Seed 2.0 系列
  'doubao-seed-2.0-pro': { input: 4.8, output: 24.0 },
  'doubao-seed-2.0-lite': { input: 0.9, output: 5.4 },
  'doubao-seed-2.0-mini': { input: 0.4, output: 4.0 },
  'doubao-seed-2.0-code': { input: 4.8, output: 24.0 },

  // Doubao Seed 1.6 系列
  'doubao-seed-1.6': { input: 1.2, output: 16.0 },
  'doubao-seed-1.6-lite': { input: 0.3, output: 2.4 },
  'doubao-seed-1.6-flash': { input: 0.15, output: 1.5 },

  // Doubao 1.5 系列
  'doubao-1.5-pro-32k': { input: 0.8, output: 2.0 },
  'doubao-1.5-lite-32k': { input: 0.3, output: 0.6 },

  // DeepSeek 系列
  'deepseek-r1': { input: 4.0, output: 16.0 },
  'deepseek-v3': { input: 2.0, output: 8.0 },
};

// 默认模型
const DEFAULT_MODEL = 'doubao-seed-2.0-lite';

// =============================================
// API 客户端类
// =============================================

export class VolcanoAPI {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = 'https://ark.cn-beijing.volces.com/api/v3') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };
  }

  /**
   * 文本对话补全
   */
  async chatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    const model = options.model || DEFAULT_MODEL;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        model,
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 1024,
        stream: options.stream ?? false,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * 流式文本对话补全
   */
  async *chatCompletionStream(
    options: ChatCompletionOptions,
    onChunk?: (chunk: string) => void,
    onComplete?: () => void
  ): AsyncGenerator<string> {
    const model = options.model || DEFAULT_MODEL;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        model,
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 1024,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    const decoder = new TextDecoder();
    let content = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((l) => l.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              onComplete?.();
              yield content;
              return;
            }
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                content += delta;
                onChunk?.(delta);
                yield delta;
              }
            } catch {
              continue;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    onComplete?.();
  }

  /**
   * 获取模型列表
   */
  async listModels(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/models`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data?.map((m: { id: string }) => m.id) || [];
  }

  /**
   * 计算 Token 使用成本
   */
  calculateCost(promptTokens: number, completionTokens: number, model: string = DEFAULT_MODEL): number {
    const pricing = VOLCANO_TOKEN_COST[model as keyof typeof VOLCANO_TOKEN_COST];
    if (!pricing) {
      // 默认使用 Doubao Seed 2.0 Lite 的定价
      const defaultPricing = VOLCANO_TOKEN_COST['doubao-seed-2.0-lite'];
      return (promptTokens / 1000000) * defaultPricing.input +
             (completionTokens / 1000000) * defaultPricing.output;
    }
    return (promptTokens / 1000000) * pricing.input +
           (completionTokens / 1000000) * pricing.output;
  }
}

// =============================================
// 服务配置
// =============================================

const VOLCANO_CONFIG_KEY = 'zhiwei:volcano:config';

interface VolcanoConfig {
  apiKey: string;
  baseUrl: string;
  endpointId: string;
  model: string;
  enabled: boolean;
}

function getConfig(): VolcanoConfig {
  const defaultConfig: VolcanoConfig = {
    apiKey: import.meta.env.VITE_VOLCANO_API_KEY || '',
    baseUrl: import.meta.env.VITE_VOLCANO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3',
    endpointId: import.meta.env.VITE_VOLCANO_ENDPOINT_ID || '',
    model: import.meta.env.VITE_VOLCANO_MODEL || 'doubao-seed-2.0-lite',
    enabled: false,
  };

  const saved = storage.get<VolcanoConfig | null>(VOLCANO_CONFIG_KEY, null);
  return saved || defaultConfig;
}

export const volcanoService = {
  /**
   * 获取 API 客户端实例
   */
  getClient(): VolcanoAPI | null {
    const config = getConfig();
    if (!config.apiKey || config.apiKey === 'your_volcano_api_key_here') {
      return null;
    }
    return new VolcanoAPI(config.apiKey, config.baseUrl);
  },

  /**
   * 检查是否已配置
   */
  isConfigured(): boolean {
    const config = getConfig();
    return !!config.apiKey && config.apiKey !== 'your_volcano_api_key_here';
  },

  /**
   * 获取当前配置
   */
  getConfig(): VolcanoConfig {
    return getConfig();
  },

  /**
   * 更新配置
   */
  setConfig(config: Partial<VolcanoConfig>): void {
    const current = getConfig();
    storage.set(VOLCANO_CONFIG_KEY, { ...current, ...config });
  },

  /**
   * 获取当前使用的模型
   */
  getCurrentModel(): string {
    return getConfig().model;
  },

  /**
   * 文本对话
   */
  async chat(
    messages: ChatMessage[],
    options: { temperature?: number; maxTokens?: number; model?: string } = {}
  ): Promise<{ content: string; usage: ChatCompletionResponse['usage'] }> {
    const client = this.getClient();
    if (!client) {
      throw new Error('火山引擎 API 未配置，请检查 .env 文件中的 VITE_VOLCANO_API_KEY');
    }

    const response = await client.chatCompletion({
      model: options.model || getConfig().model,
      messages,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
    });

    return {
      content: response.choices[0]?.message?.content || '',
      usage: response.usage,
    };
  },

  /**
   * 流式文本对话
   */
  async *chatStream(
    messages: ChatMessage[],
    options: { temperature?: number; maxTokens?: number; model?: string } = {}
  ): AsyncGenerator<string> {
    const client = this.getClient();
    if (!client) {
      throw new Error('火山引擎 API 未配置，请检查 .env 文件中的 VITE_VOLCANO_API_KEY');
    }

    yield* client.chatCompletionStream({
      model: options.model || getConfig().model,
      messages,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
    });
  },

  /**
   * 计算对话成本
   */
  calculateCost(promptTokens: number, completionTokens: number): number {
    const client = this.getClient();
    if (!client) return 0;
    return client.calculateCost(promptTokens, completionTokens, getConfig().model);
  },

  /**
   * 获取可用模型列表
   */
  getAvailableModels(): { id: string; name: string; description: string }[] {
    return [
      { id: 'doubao-seed-2.0-pro', name: 'Doubao Seed 2.0 Pro', description: '旗舰模型，支持视觉和工具调用，256K 上下文' },
      { id: 'doubao-seed-2.0-lite', name: 'Doubao Seed 2.0 Lite', description: '性价比高，支持视觉和工具调用，256K 上下文' },
      { id: 'doubao-seed-2.0-mini', name: 'Doubao Seed 2.0 Mini', description: '轻量模型，响应快，支持视觉和工具调用' },
      { id: 'doubao-seed-1.6-flash', name: 'Doubao Seed 1.6 Flash', description: '最便宜选项，适合简单对话场景' },
      { id: 'doubao-1.5-lite-32k', name: 'Doubao 1.5 Lite', description: '入门级模型，32K 上下文' },
      { id: 'deepseek-r1', name: 'DeepSeek R1', description: '深度推理模型，适合复杂逻辑任务' },
      { id: 'deepseek-v3', name: 'DeepSeek V3', description: '通用模型，平衡性能与成本' },
    ];
  },

  /**
   * 获取模型定价信息
   */
  getModelPricing(model: string): { input: number; output: number } | null {
    return VOLCANO_TOKEN_COST[model as keyof typeof VOLCANO_TOKEN_COST] || null;
  },
};

export default volcanoService;
