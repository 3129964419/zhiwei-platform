import { storage } from './storage';

const API_KEY_KEY = 'zhiwei:mm-api-key';
const API_CONFIG_KEY = 'zhiwei:mm-api-config';

// 支持的 AI Provider
export type AIProvider = 'minimax' | 'volcano' | 'openai' | 'custom';

// Provider 配置
export interface ProviderConfig {
  apiKey: string;
  baseUrl?: string;
  model: string;
  enabled: boolean;
}

interface APIConfig {
  // 当前使用的 Provider
  provider: AIProvider;
  // 各 Provider 配置
  providers: {
    minimax: ProviderConfig;
    volcano: ProviderConfig;
    openai: ProviderConfig;
    custom: ProviderConfig;
  };
  // TTS 配置
  ttsModel: 'speech-2.8-turbo' | 'speech-2.8-hd';
  defaultVoice: string;
  // 通用配置
  temperature: number;
  maxTokens: number;
  // 是否使用环境变量中的配置
  useEnvConfig: boolean;
}

const DEFAULT_PROVIDERS = {
  minimax: {
    apiKey: '',
    model: 'MiniMax-M2.7',
    enabled: true,
  },
  volcano: {
    apiKey: '',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    model: 'doubao-seed-2.0-lite',
    enabled: true,
  },
  openai: {
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    enabled: false,
  },
  custom: {
    apiKey: '',
    baseUrl: '',
    model: '',
    enabled: false,
  },
};

const DEFAULT_CONFIG: APIConfig = {
  provider: 'volcano',
  providers: DEFAULT_PROVIDERS,
  ttsModel: 'speech-2.8-turbo',
  defaultVoice: 'Zhiwei',
  temperature: 0.7,
  maxTokens: 2048,
  useEnvConfig: true,
};

export const apiConfig = {
  getConfig(): APIConfig {
    const saved = storage.get<APIConfig>(API_CONFIG_KEY, DEFAULT_CONFIG);
    const savedKey = storage.get<string>(API_KEY_KEY, '');

    // 如果使用环境变量配置，优先使用环境变量
    if (saved.useEnvConfig) {
      const envConfig = this.loadFromEnv();
      if (envConfig) {
        return { ...saved, ...envConfig };
      }
    }

    return saved;
  },

  /**
   * 从环境变量加载配置
   */
  loadFromEnv(): Partial<APIConfig> | null {
    const volcanoKey = import.meta.env.VITE_VOLCANO_API_KEY;
    const volcanoEndpoint = import.meta.env.VITE_VOLCANO_ENDPOINT_ID;
    const minimaxKey = import.meta.env.VITE_MINIMAX_API_KEY;

    if (volcanoKey && volcanoEndpoint) {
      return {
        provider: 'volcano',
        providers: {
          ...DEFAULT_CONFIG.providers,
          volcano: {
            apiKey: volcanoKey,
            baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
            model: volcanoEndpoint,
            enabled: true,
          },
        },
      };
    }

    if (minimaxKey) {
      return {
        provider: 'minimax',
        providers: {
          ...DEFAULT_CONFIG.providers,
          minimax: {
            apiKey: minimaxKey,
            model: import.meta.env.VITE_MINIMAX_MODEL || 'MiniMax-M2.7',
            enabled: true,
          },
        },
      };
    }

    return null;
  },

  /**
   * 保存配置
   */
  saveConfig(config: Partial<APIConfig>): void {
    const current = this.getConfig();
    const newConfig = { ...current, ...config };
    storage.set(API_CONFIG_KEY, newConfig);
  },

  /**
   * 获取当前 Provider 配置
   */
  getCurrentProvider(): ProviderConfig {
    const config = this.getConfig();
    return config.providers[config.provider];
  },

  /**
   * 设置当前 Provider
   */
  setProvider(provider: AIProvider): void {
    this.saveConfig({ provider });
  },

  /**
   * 更新 Provider 配置
   */
  updateProviderConfig(
    provider: AIProvider,
    providerConfig: Partial<ProviderConfig>
  ): void {
    const config = this.getConfig();
    const currentProviderConfig = config.providers[provider];
    const newProviders = {
      ...config.providers,
      [provider]: { ...currentProviderConfig, ...providerConfig },
    };
    this.saveConfig({ providers: newProviders });
  },

  /**
   * 检查是否有可用的 API 配置
   */
  hasValidConfig(): boolean {
    const config = this.getConfig();
    const providerConfig = config.providers[config.provider];
    return providerConfig.enabled && providerConfig.apiKey.length > 0;
  },

  /**
   * 获取可用的 Provider 列表
   */
  getAvailableProviders(): AIProvider[] {
    const config = this.getConfig();
    return Object.entries(config.providers)
      .filter(([_, p]) => p.enabled && p.apiKey.length > 0)
      .map(([name]) => name as AIProvider);
  },

  /**
   * 验证 API 配置
   */
  async validateConfig(provider?: AIProvider): Promise<{
    valid: boolean;
    error?: string;
  }> {
    const config = this.getConfig();
    const targetProvider = provider || config.provider;
    const providerConfig = config.providers[targetProvider];

    if (!providerConfig.apiKey) {
      return { valid: false, error: 'API Key 未配置' };
    }

    // 根据不同 Provider 进行验证
    try {
      switch (targetProvider) {
        case 'volcano': {
          const { VolcanoAPI } = await import('./volcano');
          const api = new VolcanoAPI(
            providerConfig.apiKey,
            providerConfig.baseUrl || ''
          );
          // 简单的验证请求
          await api.chatCompletion({
            model: providerConfig.model,
            messages: [{ role: 'user', content: 'Hi' }],
            max_tokens: 10,
          });
          break;
        }
        case 'minimax': {
          const { MiniMaxAPI } = await import('./minimax');
          const api = new MiniMaxAPI(providerConfig.apiKey);
          await api.chatCompletion({
            model: providerConfig.model,
            messages: [{ role: 'user', content: 'Hi' }],
            max_tokens: 10,
          });
          break;
        }
        default:
          return { valid: true };
      }
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : '验证失败',
      };
    }
  },

  /**
   * 清除所有配置
   */
  clear(): void {
    storage.remove(API_KEY_KEY);
    storage.remove(API_CONFIG_KEY);
  },

  // 兼容旧 API
  setAPIKey(key: string): void {
    this.updateProviderConfig('minimax', { apiKey: key });
  },

  getAPIKey(): string {
    return this.getCurrentProvider().apiKey;
  },

  hasAPIKey(): boolean {
    return this.hasValidConfig();
  },
};