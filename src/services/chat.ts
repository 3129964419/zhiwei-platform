import { MiniMaxAPI } from './minimax';
import { VolcanoAPI } from './volcano';
import { apiConfig } from './apiConfig';
import { billingService } from './billing';
import { withRetry, withTimeout, type RetryOptions } from '@/utils/retry';

type APIProvider = 'minimax' | 'volcano';

let minimaxInstance: MiniMaxAPI | null = null;
let volcanoInstance: VolcanoAPI | null = null;

// 默认重试配置
const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  shouldRetry: (error: Error) => {
    // 网络错误、超时、5xx 服务器错误时重试
    const retryableMessages = [
      'network',
      'timeout',
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT',
      'fetch',
      'Failed to fetch',
      '503',
      '502',
      '504',
      '429', // 速率限制
    ];
    const message = error.message.toLowerCase();
    return retryableMessages.some((m) => message.includes(m.toLowerCase()));
  },
};

// 默认超时时间
const DEFAULT_TIMEOUT = 60000; // 60秒

const MOCK_MODE = import.meta.env.DEV || !import.meta.env.VITE_VOLCANO_API_KEY && !import.meta.env.VITE_MINIMAX_API_KEY && !apiConfig.hasAPIKey();

function getProvider(): APIProvider {
  if (import.meta.env.VITE_VOLCANO_API_KEY) return 'volcano';
  if (import.meta.env.VITE_MINIMAX_API_KEY) return 'minimax';
  return 'minimax';
}

function getMinimax(): MiniMaxAPI | null {
  const apiKey = import.meta.env.VITE_MINIMAX_API_KEY || apiConfig.getCurrentProvider().apiKey;
  if (!apiKey) return null;
  if (!minimaxInstance) {
    const baseUrl = import.meta.env.VITE_MINIMAX_BASE_URL || 'https://api.minimaxi.chat/v1';
    minimaxInstance = new MiniMaxAPI(apiKey, baseUrl);
  }
  return minimaxInstance;
}

function getVolcano(): VolcanoAPI | null {
  const apiKey = import.meta.env.VITE_VOLCANO_API_KEY;
  const baseUrl = import.meta.env.VITE_VOLCANO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';
  if (!apiKey) return null;
  if (!volcanoInstance) {
    volcanoInstance = new VolcanoAPI(apiKey, baseUrl);
  }
  return volcanoInstance;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatCompletionOptions {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface ChatResult {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: number;
}

export const chatService = {
  async sendMessage(options: ChatCompletionOptions): Promise<ChatResult> {
    const provider = getProvider();

    // 使用重试和超时机制
    return withRetry(
      () => withTimeout(() => this._sendMessageInternal(options), DEFAULT_TIMEOUT),
      DEFAULT_RETRY_OPTIONS
    );
  },

  async _sendMessageInternal(options: ChatCompletionOptions): Promise<ChatResult> {
    if (MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1500));
      const mockResponses = [
        '嗯嗯，我懂你的感受呢。要不要我陪你聊聊？',
        '好的呀，我在这里陪你呢～',
        '我理解你的想法，让我们一起想想办法吧。',
        '你说的很有道理，继续说，我在听。',
        '谢谢你愿意和我分享这些，我会一直陪着你的。',
      ];
      const lastMessage = options.messages[options.messages.length - 1];
      const response = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      console.log(`[Chat Mock] User: ${lastMessage.content} -> AI: ${response}`);
      return {
        content: response,
        usage: {
          promptTokens: lastMessage.content.length,
          completionTokens: response.length,
          totalTokens: lastMessage.content.length + response.length,
        },
        cost: 0,
      };
    }

    const provider = getProvider();

    if (provider === 'volcano') {
      const volcano = getVolcano();
      if (!volcano) {
        throw new Error('火山引擎 API 配置不完整');
      }

      if (!billingService.canMakeRequest('chat')) {
        throw new Error('今日对话免费额度已用完，请明日再试');
      }

      const model = import.meta.env.VITE_VOLCANO_MODEL || 'doubao-seed-2.0-lite';
      const allMessages: ChatMessage[] = [];

      if (options.systemPrompt) {
        allMessages.push({ role: 'system', content: options.systemPrompt });
      }
      allMessages.push(...options.messages);

      const result = await volcano.chatCompletion({
        model,
        messages: allMessages,
        temperature: options.temperature !== undefined ? options.temperature : 0.7,
        max_tokens: options.maxTokens || 1024,
      });

      const usage = {
        prompt_tokens: result.usage?.prompt_tokens || 0,
        completion_tokens: result.usage?.completion_tokens || 0,
        total_tokens: result.usage?.total_tokens || 0,
      };

      const cost = billingService.calculateCost(usage.prompt_tokens, usage.completion_tokens);

      billingService.recordPromptTokens(usage.prompt_tokens);
      billingService.recordCompletionTokens(usage.completion_tokens);

      return {
        content: result.choices[0].message.content,
        usage: {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        },
        cost,
      };
    }

    const minimax = getMinimax();
    if (!minimax) {
      throw new Error('API 密钥未配置');
    }

    if (!billingService.canMakeRequest('chat')) {
      throw new Error('今日对话免费额度已用完，请明日再试');
    }

    const config = apiConfig.getConfig();
    const providerConfig = config.providers[config.provider];
    const allMessages: ChatMessage[] = [];

    if (options.systemPrompt) {
      allMessages.push({ role: 'system', content: options.systemPrompt });
    }

    allMessages.push(...options.messages);

    const result = await minimax.chatCompletion({
      model: options.model || providerConfig.model,
      messages: allMessages,
      temperature: options.temperature !== undefined ? options.temperature : config.temperature,
      max_tokens: options.maxTokens || 1024,
      stream: false,
    });

    const usage = result.usage;
    const cost = billingService.calculateCost(usage.prompt_tokens, usage.completion_tokens);

    billingService.recordPromptTokens(usage.prompt_tokens);
    billingService.recordCompletionTokens(usage.completion_tokens);

    return {
      content: result.choices[0].message.content,
      usage: {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
      },
      cost,
    };
  },
  
  async sendMessageStream(
    options: ChatCompletionOptions,
    onChunk: (chunk: string) => void,
    onComplete?: () => void
  ): Promise<void> {
    if (MOCK_MODE) {
      const mockResponses = [
        '嗯嗯，我懂你的感受呢。要不要我陪你聊聊？',
        '好的呀，我在这里陪你呢～',
        '我理解你的想法，让我们一起想想办法吧。',
        '你说的很有道理，继续说，我在听。',
        '谢谢你愿意和我分享这些，我会一直陪着你的。',
      ];
      const response = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      const chars = response.split('');
      for (let i = 0; i < chars.length; i++) {
        onChunk(chars[i]);
        await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 80));
      }
      if (onComplete) onComplete();
      return;
    }

    const provider = getProvider();
    
    if (provider === 'volcano') {
      const volcano = getVolcano();
      if (!volcano) {
        throw new Error('火山引擎 API 配置不完整');
      }
      
      if (!billingService.canMakeRequest('chat')) {
        throw new Error('今日对话免费额度已用完，请明日再试');
      }
      
      const model = import.meta.env.VITE_VOLCANO_MODEL || 'doubao-seed-2.0-lite';
      const allMessages: ChatMessage[] = [];
      
      if (options.systemPrompt) {
        allMessages.push({ role: 'system', content: options.systemPrompt });
      }
      allMessages.push(...options.messages);
      
      try {
        const stream = volcano.chatCompletionStream(
          {
            model,
            messages: allMessages,
            temperature: options.temperature !== undefined ? options.temperature : 0.7,
            max_tokens: options.maxTokens || 1024,
          },
          onChunk,
          onComplete
        );
        for await (const _ of stream) {
          // 迭代完成
        }
      } catch (error) {
        throw error instanceof Error ? error : new Error(String(error));
      }
      return;
    }
    
    const minimax = getMinimax();
    if (!minimax) {
      throw new Error('API 密钥未配置');
    }
    
    if (!billingService.canMakeRequest('chat')) {
      throw new Error('今日对话免费额度已用完，请明日再试');
    }
    
    const config = apiConfig.getConfig();
    const providerConfig = config.providers[config.provider];
    const allMessages: ChatMessage[] = [];
    
    if (options.systemPrompt) {
      allMessages.push({ role: 'system', content: options.systemPrompt });
    }
    
    allMessages.push(...options.messages);
    
    try {
      await minimax.chatCompletionStream(
        {
          model: options.model || providerConfig.model,
          messages: allMessages,
          temperature: options.temperature !== undefined ? options.temperature : config.temperature,
          max_tokens: options.maxTokens || 1024,
          stream: true,
        },
        onChunk,
        onComplete
      );
    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error));
    }
  },
  
  isAvailable(): boolean {
    if (MOCK_MODE) return true;
    if (import.meta.env.VITE_VOLCANO_API_KEY && import.meta.env.VITE_VOLCANO_ENDPOINT_ID) {
      return true;
    }
    if (import.meta.env.VITE_MINIMAX_API_KEY) {
      return true;
    }
    return apiConfig.hasAPIKey();
  },
  
  getConfig() {
    return apiConfig.getConfig();
  },
  
  setAPIKey(key: string) {
    apiConfig.setAPIKey(key);
    minimaxInstance = null;
  },
};