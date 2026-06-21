import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Phone, Lock, Eye, EyeOff, MessageSquare, Smartphone, AlertCircle, CheckCircle } from 'lucide-react';
import { authAPI } from '@/services/auth';
import { useUserStore } from '@/store/userStore';
import { useUIStore } from '@/store/uiStore';

type Method = 'code' | 'password' | 'wechat';

interface FieldValidation {
  isValid: boolean | null;
  message: string;
}

export default function Login() {
  const navigate = useNavigate();
  const login = useUserStore((s) => s.login);
  const addToast = useUIStore((s) => s.addToast);

  const [method, setMethod] = useState<Method>('code');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [codeCountdown, setCodeCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);

  const phoneRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    phoneRef.current?.focus();
  }, []);

  useEffect(() => {
    if (codeCountdown <= 0) return;
    const t = setTimeout(() => setCodeCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [codeCountdown]);

  const validatePhone = (value: string): FieldValidation => {
    if (!value) return { isValid: null, message: '' };
    if (!/^1[3-9]\d{9}$/.test(value)) {
      return { isValid: false, message: '请输入正确的手机号格式' };
    }
    return { isValid: true, message: '' };
  };

  const validateCode = (value: string): FieldValidation => {
    if (!value) return { isValid: null, message: '' };
    if (!/^\d{6}$/.test(value)) {
      return { isValid: false, message: '验证码应为 6 位数字' };
    }
    return { isValid: true, message: '' };
  };

  const validatePassword = (value: string): FieldValidation => {
    if (!value) return { isValid: null, message: '' };
    if (value.length < 6) {
      return { isValid: false, message: '密码至少需要 6 位' };
    }
    return { isValid: true, message: '' };
  };

  const phoneValidation = validatePhone(phone);
  const codeValidation = validateCode(code);
  const passwordValidation = validatePassword(password);

  const canSubmit = 
    phoneValidation.isValid && 
    ((method === 'code' && codeValidation.isValid) || 
     (method === 'password' && passwordValidation.isValid));

  const sendCode = async () => {
    if (!phoneValidation.isValid) {
      addToast('error', phoneValidation.message || '请输入正确的手机号');
      phoneRef.current?.focus();
      return;
    }
    if (sendingCode || codeCountdown > 0) return;
    
    setSendingCode(true);
    try {
      const res = await authAPI.sendCode(phone);
      if (res.success) {
        addToast('success', res.message || '验证码已发送，请注意查收');
        if (res.demoCode) {
          addToast('success', `演示验证码：${res.demoCode}`);
          setCode(res.demoCode);
        }
        setCodeCountdown(60);
        setTimeout(() => codeRef.current?.focus(), 100);
      } else {
        const errorMsg = res.message || '验证码发送失败，请稍后重试';
        addToast('error', errorMsg);
      }
    } catch (e: any) {
      addToast('error', e?.message || '网络错误，请检查网络后重试');
    } finally {
      setSendingCode(false);
    }
  };

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (loading) return;
    if (!phoneValidation.isValid) {
      addToast('error', phoneValidation.message || '请输入正确的手机号');
      phoneRef.current?.focus();
      return;
    }
    if (method === 'code' && !codeValidation.isValid) {
      addToast('error', codeValidation.message || '请输入 6 位验证码');
      codeRef.current?.focus();
      return;
    }
    if (method === 'password' && !passwordValidation.isValid) {
      addToast('error', passwordValidation.message || '请输入密码');
      passwordRef.current?.focus();
      return;
    }
    setLoading(true);
    try {
      let user;
      if (method === 'code') {
        user = await authAPI.loginByCode(phone, code);
      } else {
        user = await authAPI.loginByPassword(phone, password);
      }
      login(user);
      addToast('success', `欢迎回来，${user.nickname}`);
      navigate('/dashboard');
    } catch (e: any) {
      addToast('error', e.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen aurora-bg flex items-center justify-center px-6 py-10 relative">
      <div
        className="float-blob"
        style={{
          top: '20%',
          left: '20%',
          width: 400,
          height: 400,
          background: 'radial-gradient(circle, #B8A6FF 0%, transparent 70%)',
        }}
      />
      <div
        className="float-blob"
        style={{
          bottom: '10%',
          right: '15%',
          width: 350,
          height: 350,
          background: 'radial-gradient(circle, #FFB8C8 0%, transparent 70%)',
          animationDelay: '-3s',
        }}
      />

      <div className="relative w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-2 mb-6 group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-iris-500 to-rose-400 flex items-center justify-center text-white font-display font-semibold">
            智
          </div>
          <span className="font-display text-lg font-semibold group-hover:text-iris-500 transition">
            智微
          </span>
        </Link>

        <div className="glass rounded-4xl p-8 shadow-glow">
          <h1 className="font-display text-3xl font-semibold mb-2">
            {method === 'wechat' ? '微信登录' : '欢迎回来'}
          </h1>
          <p className="text-sm text-ink-900/60 mb-6">
            {method === 'wechat'
              ? '使用微信扫码快速登录'
              : '使用手机号登录或注册账号'}
          </p>

          {method === 'wechat' ? (
            <div className="text-center py-8">
              <div className="inline-block p-4 bg-white rounded-3xl shadow-card relative">
                <div className="w-44 h-44 bg-gradient-to-br from-ink-50 to-ink-100 rounded-2xl flex items-center justify-center relative overflow-hidden">
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage: `repeating-linear-gradient(45deg, #1A1B3A 0 1px, transparent 1px 8px), repeating-linear-gradient(-45deg, #1A1B3A 0 1px, transparent 1px 8px)`,
                    }}
                  />
                  <div className="relative text-center">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-mint-400 to-mint-500 mx-auto mb-2 flex items-center justify-center text-white text-2xl">
                      微
                    </div>
                    <p className="text-xs text-ink-900/60">扫码登录</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-ink-900/50 mt-4">
                打开微信扫一扫，演示环境可点击下方按钮直接登录
              </p>
              <button
                onClick={handleLogin}
                disabled={loading}
                className="mt-4 btn-secondary text-sm"
              >
                {loading ? '登录中...' : '演示用：直接登录'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-3">
              <div className="relative">
                <Phone
                  size={16}
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                    phoneValidation.isValid === false ? 'text-coral-500' : 'text-ink-900/40'
                  }`}
                />
                <input
                  ref={phoneRef}
                  type="tel"
                  placeholder="手机号"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && phoneValidation.isValid) {
                      if (method === 'code') {
                        codeRef.current?.focus();
                      } else {
                        passwordRef.current?.focus();
                      }
                    }
                  }}
                  className={`input-field pl-10 transition-all ${
                    phoneValidation.isValid === false ? 'border-coral-300 focus:border-coral-400 bg-coral-400/5' : ''
                  }`}
                  autoComplete="phone"
                />
                {phone && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {phoneValidation.isValid ? (
                      <CheckCircle size={16} className="text-mint-500" />
                    ) : (
                      <AlertCircle size={16} className="text-coral-500" />
                    )}
                  </div>
                )}
                {phoneValidation.isValid === false && (
                  <p className="text-[10px] text-coral-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {phoneValidation.message}
                  </p>
                )}
              </div>

              {method === 'code' ? (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MessageSquare
                      size={16}
                      className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                        codeValidation.isValid === false ? 'text-coral-500' : 'text-ink-900/40'
                      }`}
                    />
                    <input
                      ref={codeRef}
                      type="text"
                      placeholder="6 位验证码"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && canSubmit) {
                          handleLogin();
                        }
                      }}
                      className={`input-field pl-10 transition-all ${
                        codeValidation.isValid === false ? 'border-coral-300 focus:border-coral-400 bg-coral-400/5' : ''
                      }`}
                      autoComplete="one-time-code"
                    />
                    {code && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {codeValidation.isValid ? (
                          <CheckCircle size={16} className="text-mint-500" />
                        ) : (
                          <AlertCircle size={16} className="text-coral-500" />
                        )}
                      </div>
                    )}
                    {codeValidation.isValid === false && (
                      <p className="text-[10px] text-coral-500 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} />
                        {codeValidation.message}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={sendCode}
                    disabled={codeCountdown > 0 || !phoneValidation.isValid || sendingCode}
                    className="btn-secondary text-sm whitespace-nowrap disabled:opacity-50 h-fit self-start mt-0.5 min-w-[88px] flex items-center justify-center gap-1.5"
                  >
                    {sendingCode ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        发送中
                      </>
                    ) : codeCountdown > 0 ? (
                      `${codeCountdown}s`
                    ) : (
                      '获取验证码'
                    )}
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Lock
                    size={16}
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                      passwordValidation.isValid === false ? 'text-coral-500' : 'text-ink-900/40'
                    }`}
                  />
                  <input
                    ref={passwordRef}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && canSubmit) {
                        handleLogin();
                      }
                    }}
                    className={`input-field pl-10 pr-10 transition-all ${
                      passwordValidation.isValid === false ? 'border-coral-300 focus:border-coral-400 bg-coral-400/5' : ''
                    }`}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-900/40"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  {passwordValidation.isValid === false && (
                    <p className="text-[10px] text-coral-500 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {passwordValidation.message}
                    </p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !canSubmit}
                className="btn-primary w-full mt-5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    登录中...
                  </>
                ) : (
                  method === 'code' ? '登录 / 注册' : '登录'
                )}
              </button>

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-ink-100" />
                <span className="text-xs text-ink-900/40">或</span>
                <div className="flex-1 h-px bg-ink-100" />
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <button
                    type="button"
                    disabled
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-mint-400/5 text-mint-500/50 font-medium text-sm cursor-not-allowed"
                    title="微信扫码登录功能开发中"
                  >
                    <Smartphone size={16} /> 微信扫码登录
                  </button>
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[9px] font-medium bg-amber-100 text-amber-700 rounded-full">
                    即将上线
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setMethod(method === 'code' ? 'password' : 'code')}
                  className="w-full text-xs text-ink-900/50 hover:text-iris-500 transition py-1"
                >
                  {method === 'code' ? '使用密码登录' : '使用验证码登录'}
                </button>
              </div>

              <p className="text-[10px] text-ink-900/40 text-center mt-5">
                演示提示：验证码请使用 <span className="text-iris-500 font-mono">123456</span>
              </p>

              <div className="flex items-center justify-center gap-3 mt-4">
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-mint-400/10">
                  <svg className="w-3.5 h-3.5 text-mint-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="text-[10px] text-mint-600 font-medium">安全连接</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-400/10">
                  <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-[10px] text-blue-600 font-medium">HTTPS</span>
                </div>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-ink-900/50 mt-6">
          登录即代表同意
          <Link to="/legal" className="text-iris-500 hover:underline mx-1">
            用户协议
          </Link>
          与
          <Link to="/legal" className="text-iris-500 hover:underline mx-1">
            隐私政策
          </Link>
        </p>

        <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-ink-900/40">
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            support@3dpixel.top
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            400-888-8888
          </span>
        </div>
      </div>
    </div>
  );
}
