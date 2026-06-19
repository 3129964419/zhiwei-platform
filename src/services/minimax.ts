interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatCompletionOptions {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface ChatCompletionResponse {
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

interface TTSOptions {
  model?: 'speech-2.8-turbo' | 'speech-2.8-hd';
  voice?: string;
  text: string;
  language?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  stream?: boolean;
}

interface TTSResponse {
  audio: string;
  audio_format: string;
  audio_duration: number;
  audio_size: number;
}

interface VoiceCloneOptions {
  voice_name: string;
  audio_url?: string;
  audio_data?: string;
  language?: string;
}

interface VoiceCloneResponse {
  voice_id: string;
  voice_name: string;
  status: 'success' | 'processing';
}

interface VoiceDesignOptions {
  voice_name: string;
  description: string;
  language?: string;
}

interface VoiceDesignResponse {
  voice_id: string;
  voice_name: string;
  status: 'success';
}

export class MiniMaxAPI {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = 'https://api.minimaxi.chat/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  private getHeaders(): Headers {
    return new Headers({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    });
  }

  async chatCompletion(
    options: ChatCompletionOptions
  ): Promise<ChatCompletionResponse> {
    const response = await fetch(`${this.baseUrl}/text/chatcompletion`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        model: options.model || 'MiniMax-M2.7',
        messages: options.messages,
        temperature: options.temperature !== undefined ? options.temperature : 0.7,
        max_tokens: options.max_tokens || 1024,
        stream: options.stream || false,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async chatCompletionStream(
    options: ChatCompletionOptions,
    onChunk: (chunk: string) => void,
    onComplete?: () => void
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/text/chatcompletion`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        model: options.model || 'MiniMax-M2.7',
        messages: options.messages,
        temperature: options.temperature !== undefined ? options.temperature : 0.7,
        max_tokens: options.max_tokens || 1024,
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

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter((l) => l.trim());

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            onComplete?.();
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              content += delta;
              onChunk(delta);
            }
          } catch {
            continue;
          }
        }
      }
    }

    onComplete?.();
  }

  async tts(options: TTSOptions): Promise<TTSResponse> {
    const response = await fetch(`${this.baseUrl}/tts`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        model: options.model || 'speech-2.8-turbo',
        voice: options.voice || 'Zhiwei',
        text: options.text,
        language: options.language || 'zh-CN',
        rate: options.rate || 1,
        pitch: options.pitch || 1,
        volume: options.volume !== undefined ? options.volume : 1,
        stream: options.stream || false,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async ttsStream(
    options: TTSOptions,
    onAudioChunk: (chunk: ArrayBuffer) => void,
    onComplete?: () => void
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/tts`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        model: options.model || 'speech-2.8-turbo',
        voice: options.voice || 'Zhiwei',
        text: options.text,
        language: options.language || 'zh-CN',
        rate: options.rate || 1,
        pitch: options.pitch || 1,
        volume: options.volume !== undefined ? options.volume : 1,
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

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      onAudioChunk(value.buffer);
    }

    onComplete?.();
  }

  async cloneVoice(options: VoiceCloneOptions): Promise<VoiceCloneResponse> {
    const response = await fetch(`${this.baseUrl}/voice_clone`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        voice_name: options.voice_name,
        audio_url: options.audio_url,
        audio_data: options.audio_data,
        language: options.language || 'zh-CN',
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async designVoice(options: VoiceDesignOptions): Promise<VoiceDesignResponse> {
    const response = await fetch(`${this.baseUrl}/voice_design`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        voice_name: options.voice_name,
        description: options.description,
        language: options.language || 'zh-CN',
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getVoices(): Promise<Array<{ voice_id: string; voice_name: string; language: string }>> {
    const response = await fetch(`${this.baseUrl}/voices`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}