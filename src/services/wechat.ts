// 微信服务
import type { WechatBinding } from '@/types';
import { storage } from './storage';
import { delay, generateId } from '@/utils/common';

const BINDING_KEY = 'wechatBinding';
const QR_KEY = 'wechatQR';
const WECHAT_STATE_KEY = 'wechat_state';

type QRStatus = 'pending' | 'scanned' | 'bound' | 'expired' | 'cancelled';

interface QRState {
  id: string;
  status: QRStatus;
  createdAt: number;
  binding?: WechatBinding;
}

// 微信开放平台配置（需要替换为实际的配置）
const WECHAT_CONFIG = {
  // 微信开放平台 AppID（需要申请）
  appId: import.meta.env.VITE_WECHAT_APP_ID || '',
  // 回调地址
  redirectUri: import.meta.env.VITE_WECHAT_REDIRECT_URI || `${window.location.origin}/auth/wechat/callback`,
  // 扫码登录地址
  qrUrl: 'https://open.weixin.qq.com/connect/qrconnect',
  // 公众号扫码登录地址
  mpQrUrl: 'https://open.weixin.qq.com/connect/qrconnect',
};

export const wechatAPI = {
  /**
   * 检查微信登录是否可用
   */
  isWechatLoginAvailable(): boolean {
    return WECHAT_CONFIG.appId.length > 0;
  },

  /**
   * 生成微信登录二维码 URL
   */
  generateLoginUrl(state?: string): string {
    if (!this.isWechatLoginAvailable()) {
      throw new Error('微信登录未配置');
    }

    const stateValue = state || generateId('wx_state');
    storage.set(WECHAT_STATE_KEY, { state: stateValue, createdAt: Date.now() });

    const params = new URLSearchParams({
      appid: WECHAT_CONFIG.appId,
      redirect_uri: WECHAT_CONFIG.redirectUri,
      response_type: 'code',
      scope: 'snsapi_login',
      state: stateValue,
    });

    return `${WECHAT_CONFIG.qrUrl}?${params.toString()}#wechat_redirect`;
  },

  /**
   * 处理微信回调
   */
  async handleCallback(code: string, state: string): Promise<WechatBinding> {
    // 验证 state
    const savedState = storage.get<{ state: string; createdAt: number } | null>(
      WECHAT_STATE_KEY,
      null
    );

    if (!savedState || savedState.state !== state) {
      throw new Error('无效的登录状态');
    }

    // 检查 state 是否过期（5分钟）
    if (Date.now() - savedState.createdAt > 5 * 60 * 1000) {
      throw new Error('登录已过期，请重试');
    }

    // 在实际项目中，这里应该调用后端 API 来交换 access_token
    // 由于是前端项目，这里模拟返回
    const binding: WechatBinding = {
      openid: generateId('wx_openid'),
      unionid: generateId('wx_unionid'),
      nickname: '微信用户',
      avatar: '',
      boundAt: Date.now(),
    };

    storage.set(BINDING_KEY, binding);
    storage.remove(WECHAT_STATE_KEY);

    return binding;
  },

  /**
   * 生成二维码（模拟或真实）
   */
  async generateQR(): Promise<QRState> {
    await delay(500);

    if (this.isWechatLoginAvailable()) {
      // 真实微信登录
      const loginUrl = this.generateLoginUrl();
      const state: QRState = {
        id: generateId('qr'),
        status: 'pending',
        createdAt: Date.now(),
      };

      // 存储 loginUrl 供二维码显示
      (state as any).loginUrl = loginUrl;
      storage.set(QR_KEY, state);

      return state;
    }

    // 模拟模式
    const state: QRState = {
      id: generateId('qr'),
      status: 'pending',
      createdAt: Date.now(),
    };
    storage.set(QR_KEY, state);
    return state;
  },

  /**
   * 获取二维码登录 URL（用于显示二维码图片）
   */
  getQRImageUrl(qrId: string): string {
    const state = storage.get<QRState | null>(QR_KEY, null);
    if (!state || state.id !== qrId) {
      return '';
    }

    if ((state as any).loginUrl) {
      // 使用微信二维码 API 生成图片
      return `https://open.weixin.qq.com/qr/code?appid=${WECHAT_CONFIG.appId}&state=${qrId}`;
    }

    // 模拟二维码
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=zhiwei_mock_${qrId}`;
  },

  /**
   * 轮询登录状态
   */
  async pollStatus(qrId: string): Promise<QRState> {
    const state = storage.get<QRState | null>(QR_KEY, null);
    if (!state || state.id !== qrId) {
      return { id: qrId, status: 'expired', createdAt: Date.now() };
    }

    // 如果是真实微信登录，这里应该调用后端 API 检查状态
    // 模拟扫描流程：pending -> scanned -> bound
    const elapsed = Date.now() - state.createdAt;
    if (elapsed > 10000 && state.status === 'pending') {
      state.status = 'scanned';
      storage.set(QR_KEY, state);
    }
    if (elapsed > 13000 && state.status === 'scanned') {
      state.status = 'bound';
      const binding: WechatBinding = {
        openid: generateId('wx_openid'),
        nickname: '微信用户_' + Math.floor(Math.random() * 1000),
        avatar: '微',
        boundAt: Date.now(),
      };
      state.binding = binding;
      storage.set(QR_KEY, state);
      storage.set(BINDING_KEY, binding);
    }
    if (elapsed > 120000) {
      state.status = 'expired';
      storage.set(QR_KEY, state);
    }
    return state;
  },

  /**
   * 模拟扫描（演示用）
   */
  async simulateScan(qrId: string): Promise<void> {
    const state = storage.get<QRState | null>(QR_KEY, null);
    if (!state || state.id !== qrId) return;
    state.status = 'bound';
    const binding: WechatBinding = {
      openid: generateId('wx_openid'),
      nickname: '微信用户',
      avatar: '微',
      boundAt: Date.now(),
    };
    state.binding = binding;
    storage.set(QR_KEY, state);
    storage.set(BINDING_KEY, binding);
  },

  /**
   * 取消登录
   */
  async cancelLogin(qrId: string): Promise<void> {
    const state = storage.get<QRState | null>(QR_KEY, null);
    if (!state || state.id !== qrId) return;
    state.status = 'cancelled';
    storage.set(QR_KEY, state);
  },

  /**
   * 获取绑定信息
   */
  getBinding(): WechatBinding | null {
    return storage.get<WechatBinding | null>(BINDING_KEY, null);
  },

  /**
   * 解绑微信
   */
  async unbind(): Promise<void> {
    await delay(400);
    storage.remove(BINDING_KEY);
  },

  /**
   * 检查是否在微信环境
   */
  isWechatEnvironment(): boolean {
    const ua = navigator.userAgent.toLowerCase();
    return ua.includes('micromessenger');
  },

  /**
   * 微信内网页授权登录
   */
  async mpLogin(): Promise<void> {
    if (!this.isWechatEnvironment()) {
      throw new Error('请在微信中打开');
    }

    if (!WECHAT_CONFIG.appId) {
      throw new Error('微信登录未配置');
    }

    const state = generateId('wx_mp_state');
    storage.set(WECHAT_STATE_KEY, { state, createdAt: Date.now() });

    const params = new URLSearchParams({
      appid: WECHAT_CONFIG.appId,
      redirect_uri: WECHAT_CONFIG.redirectUri,
      response_type: 'code',
      scope: 'snsapi_userinfo',
      state,
    });

    window.location.href = `https://open.weixin.qq.com/connect/oauth2/authorize?${params.toString()}#wechat_redirect`;
  },
};
