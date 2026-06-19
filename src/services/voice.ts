interface VoiceOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  voiceId?: string;
  useExternal?: boolean;
}

interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
  confidence?: number;
}

type SpeechRecognitionCallback = (result: SpeechRecognitionResult) => void;
type SpeechErrorCallback = (error: Error | string) => void;
type SpeechStartCallback = () => void;
type SpeechEndCallback = () => void;

import { apiConfig } from './apiConfig';
import { MiniMaxAPI } from './minimax';
import { VolcanoAPI } from './volcano';
import { billingService } from './billing';

let minimaxInstance: MiniMaxAPI | null = null;
let volcanoInstance: VolcanoAPI | null = null;

function getMinimax(): MiniMaxAPI | null {
  const config = apiConfig.getConfig();
  const minimaxConfig = config.providers.minimax;
  if (!minimaxConfig.apiKey) return null;
  if (!minimaxInstance) {
    minimaxInstance = new MiniMaxAPI(minimaxConfig.apiKey);
  }
  return minimaxInstance;
}

function getVolcano(): VolcanoAPI | null {
  const config = apiConfig.getConfig();
  const volcanoConfig = config.providers.volcano;
  if (!volcanoConfig.apiKey) return null;
  if (!volcanoInstance) {
    volcanoInstance = new VolcanoAPI(volcanoConfig.apiKey, volcanoConfig.baseUrl || '');
  }
  return volcanoInstance;
}

export class VoiceService {
  private recognition: any = null;
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private isListening = false;
  private isSpeaking = false;

  private onResult: SpeechRecognitionCallback | null = null;
  private onError: SpeechErrorCallback | null = null;
  private onStart: SpeechStartCallback | null = null;
  private onEnd: SpeechEndCallback | null = null;

  constructor() {
    this.synth = window.speechSynthesis || null;
    
    const SpeechRecognitionClass = (window as any).SpeechRecognition || 
                                   (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'zh-CN';
      
      this.setupRecognitionHandlers();
    }
    
    this.loadVoices();
    this.setupVoiceChangeListener();
  }

  private setupRecognitionHandlers() {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.onStart?.();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.onEnd?.();
    };

    this.recognition.onresult = (event: any) => {
      let transcript = '';
      let isFinal = false;
      let confidence: number | undefined;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          isFinal = true;
          confidence = event.results[i][0].confidence;
        }
      }

      this.onResult?.({ transcript, isFinal, confidence });
    };

    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      let errorMessage = '语音识别出错';
      
      switch (event.error) {
        case 'not-allowed':
          errorMessage = '麦克风权限被拒绝，请在浏览器设置中允许访问麦克风';
          break;
        case 'no-speech':
          errorMessage = '未检测到语音输入';
          break;
        case 'audio-capture':
          errorMessage = '未找到麦克风设备';
          break;
        case 'network':
          errorMessage = '网络连接异常，请检查网络';
          break;
        case 'not-supported':
          errorMessage = '当前浏览器不支持语音识别';
          break;
        case 'aborted':
          errorMessage = '语音识别被中断';
          break;
        case 'language-not-supported':
          errorMessage = '当前语言不支持';
          break;
        case 'bad-grammar':
          errorMessage = '语法错误';
          break;
        case 'service-not-allowed':
          errorMessage = '语音服务不可用';
          break;
      }

      this.onError?.(new Error(errorMessage));
    };
  }

  private loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  private setupVoiceChangeListener() {
    if (!this.synth) return;
    this.synth.onvoiceschanged = () => {
      this.loadVoices();
    };
  }

  isRecognitionSupported(): boolean {
    return this.recognition !== null;
  }

  isSynthesisSupported(): boolean {
    return this.synth !== null;
  }

  startListening(
    options?: { lang?: string },
    callbacks?: {
      onResult?: SpeechRecognitionCallback;
      onError?: SpeechErrorCallback;
      onStart?: SpeechStartCallback;
      onEnd?: SpeechEndCallback;
    }
  ): void {
    if (!this.recognition) {
      callbacks?.onError?.('当前浏览器不支持语音识别');
      return;
    }

    if (this.isListening) {
      return;
    }

    if (options?.lang) {
      this.recognition.lang = options.lang;
    }

    this.onResult = callbacks?.onResult || null;
    this.onError = callbacks?.onError || null;
    this.onStart = callbacks?.onStart || null;
    this.onEnd = callbacks?.onEnd || null;

    try {
      this.recognition.start();
    } catch (error) {
      this.onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.error('Failed to stop recognition:', error);
      }
    }
  }

  speak(
    text: string,
    options: VoiceOptions = {}
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synth) {
        reject(new Error('当前浏览器不支持语音合成'));
        return;
      }

      if (this.isSpeaking) {
        this.synth.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = options.lang || 'zh-CN';
      utterance.rate = options.rate || 1;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume !== undefined ? options.volume : 1;

      const zhVoice = this.voices.find((v) => 
        v.lang.startsWith('zh') && v.name.includes('Female')
      ) || this.voices.find((v) => v.lang.startsWith('zh'));
      
      if (zhVoice) {
        utterance.voice = zhVoice;
      }

      utterance.onend = () => {
        this.isSpeaking = false;
        resolve();
      };

      utterance.onerror = (event) => {
        this.isSpeaking = false;
        let errorMessage = '语音合成失败';
        
        switch (event.error) {
          case 'canceled':
            errorMessage = '语音播放被取消';
            break;
          case 'interrupted':
            errorMessage = '语音播放被中断';
            break;
          case 'not-allowed':
            errorMessage = '语音权限被拒绝';
            break;
          case 'audio-busy':
            errorMessage = '音频设备繁忙';
            break;
          case 'audio-hardware':
            errorMessage = '音频硬件错误';
            break;
          case 'network':
            errorMessage = '网络连接异常';
            break;
        }

        reject(new Error(errorMessage));
      };

      this.isSpeaking = true;
      this.synth.speak(utterance);
    });
  }

  stopSpeaking(): void {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
  }

  getVoices(lang?: string): SpeechSynthesisVoice[] {
    if (!lang) return this.voices;
    return this.voices.filter((v) => v.lang.startsWith(lang));
  }

  isListeningNow(): boolean {
    return this.isListening;
  }

  isSpeakingNow(): boolean {
    return this.isSpeaking;
  }

  async speakWithMinimax(
    text: string,
    options: VoiceOptions = {}
  ): Promise<void> {
    const minimax = getMinimax();
    if (!minimax) {
      throw new Error('MiniMax API 密钥未配置，请在设置中添加 API 密钥');
    }

    if (!billingService.canMakeRequest('tts')) {
      throw new Error('今日语音合成免费额度已用完，请明日再试');
    }

    const config = apiConfig.getConfig();
    try {
      const result = await minimax.tts({
        model: config.ttsModel,
        voice: options.voiceId || config.defaultVoice,
        text: text,
        language: options.lang || 'zh-CN',
        rate: options.rate || 1,
        pitch: options.pitch || 1,
        volume: options.volume !== undefined ? options.volume : 1,
      });

      billingService.recordTTSChars(text.length);

      const audio = new Audio(result.audio);
      return new Promise((resolve, reject) => {
        this.isSpeaking = true;
        audio.onended = () => {
          this.isSpeaking = false;
          resolve();
        };
        audio.onerror = () => {
          this.isSpeaking = false;
          reject(new Error('音频播放失败'));
        };
        audio.play();
      });
    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  async cloneVoiceWithMinimax(
    voiceName: string,
    audioData: string
  ): Promise<string> {
    const minimax = getMinimax();
    if (!minimax) {
      throw new Error('MiniMax API 密钥未配置，请在设置中添加 API 密钥');
    }

    if (!billingService.canMakeRequest('clone')) {
      throw new Error('今日语音克隆免费额度已用完，请明日再试');
    }

    try {
      const result = await minimax.cloneVoice({
        voice_name: voiceName,
        audio_data: audioData,
        language: 'zh-CN',
      });

      billingService.recordVoiceClone();

      return result.voice_id;
    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  async designVoiceWithMinimax(
    voiceName: string,
    description: string
  ): Promise<string> {
    const minimax = getMinimax();
    if (!minimax) {
      throw new Error('MiniMax API 密钥未配置，请在设置中添加 API 密钥');
    }

    try {
      const result = await minimax.designVoice({
        voice_name: voiceName,
        description: description,
        language: 'zh-CN',
      });

      billingService.recordVoiceClone();

      return result.voice_id;
    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  async getAvailableVoices(): Promise<Array<{ voice_id: string; voice_name: string; language: string }>> {
    const minimax = getMinimax();
    if (!minimax) {
      return [];
    }

    try {
      return await minimax.getVoices();
    } catch {
      return [];
    }
  }

  isExternalVoiceAvailable(): boolean {
    const config = apiConfig.getConfig();
    const providerConfig = config.providers[config.provider];
    return providerConfig.enabled && providerConfig.apiKey.length > 0;
  }

  /**
   * 使用当前配置的 Provider 进行语音合成
   */
  async speakWithProvider(
    text: string,
    options: VoiceOptions = {}
  ): Promise<void> {
    const config = apiConfig.getConfig();
    const provider = config.provider;

    switch (provider) {
      case 'volcano':
        return this.speakWithVolcano(text, options);
      case 'minimax':
        return this.speakWithMinimax(text, options);
      default:
        // 使用本地语音合成
        return this.speak(text, options);
    }
  }

  /**
   * 使用火山引擎 TTS
   */
  async speakWithVolcano(
    text: string,
    options: VoiceOptions = {}
  ): Promise<void> {
    const volcano = getVolcano();
    if (!volcano) {
      throw new Error('火山引擎 API 密钥未配置');
    }

    if (!billingService.canMakeRequest('tts')) {
      throw new Error('今日语音合成免费额度已用完，请明日再试');
    }

    try {
      // 火山引擎 TTS API 调用
      const response = await fetch('https://openspeech.bytedance.com/api/v1/tts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer; ${apiConfig.getCurrentProvider().apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app: {
            appid: 'zhiwei',
            token: 'access_token',
          },
          user: {
            uid: 'user_001',
          },
          audio: {
            voice_type: options.voiceId || 'zh_female_shuangkuaisisi_moon_bigtts',
            encoding: 'mp3',
            speed_ratio: options.rate || 1.0,
            volume_ratio: options.volume || 1.0,
            pitch_ratio: options.pitch || 1.0,
          },
          request: {
            reqid: `tts_${Date.now()}`,
            text: text,
            text_type: 'plain',
            operation: 'query',
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`火山引擎 TTS 请求失败: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.code !== 3000) {
        throw new Error(result.message || '语音合成失败');
      }

      billingService.recordTTSChars(text.length);

      // 播放音频
      const audioData = result.data;
      const audio = new Audio(`data:audio/mp3;base64,${audioData}`);
      
      return new Promise((resolve, reject) => {
        this.isSpeaking = true;
        audio.onended = () => {
          this.isSpeaking = false;
          resolve();
        };
        audio.onerror = () => {
          this.isSpeaking = false;
          reject(new Error('音频播放失败'));
        };
        audio.play();
      });
    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  destroy(): void {
    this.stopListening();
    this.stopSpeaking();
    if (this.recognition) {
      this.recognition.onstart = null;
      this.recognition.onend = null;
      this.recognition.onresult = null;
      this.recognition.onerror = null;
    }
  }
}

export const voiceService = new VoiceService();