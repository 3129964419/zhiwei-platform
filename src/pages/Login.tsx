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
    const res = await authAPI.sendCode(phone);
    if (res.success) {
      addToast('success', res.message || '验证码已发送');
      setCodeCountdown(60);
      setTimeout(() => codeRef.current?.focus(), 100);
    } else {
      addToast('error', res.message || '发送失败');
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
                    disabled={codeCountdown > 0 || !phoneValidation.isValid}
                    className="btn-secondary text-sm whitespace-nowrap disabled:opacity-50 h-fit self-start mt-0.5"
                  >
                    {codeCountdown > 0 ? `${codeCountdown}s` : '获取验证码'}
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
                className="btn-primary w-full mt-5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '登录中...' : method === 'code' ? '登录 / 注册' : '登录'}
              </button>

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-ink-100" />
                <span className="text-xs text-ink-900/40">或</span>
                <div className="flex-1 h-px bg-ink-100" />
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setMethod('wechat')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-mint-400/10 text-mint-500 font-medium text-sm hover:bg-mint-400/15 transition"
                >
                  <Smartphone size={16} /> 微信扫码登录
                </button>

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
      </div>
    </div>
  );
}
