import { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Bell,
  Shield,
  Download,
  Upload,
  Trash2,
  Smartphone,
  LogOut,
  ChevronRight,
  Loader2,
  Check,
  Volume2,
  Key,
  Crown,
  AlertCircle,
  Zap,
} from 'lucide-react';
import Layout from '@/components/Layout';
import { useUserStore } from '@/store/userStore';
import { useUIStore } from '@/store/uiStore';
import { settingsAPI } from '@/services/settings';
import { authAPI } from '@/services/auth';
import { apiConfig } from '@/services/apiConfig';
import { billingService } from '@/services/billing';
import { subscriptionService } from '@/services/subscription';
import { pricingService } from '@/services/pricing';

export default function Settings() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const settings = useUserStore((s) => s.settings);
  const updateSettings = useUserStore((s) => s.updateSettings);
  const updateUser = useUserStore((s) => s.updateUser);
  const logout = useUserStore((s) => s.logout);
  const addToast = useUIStore((s) => s.addToast);

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(user?.nickname || '');
  const [apiKey, setApiKey] = useState(apiConfig.getAPIKey());
  const [savingApiKey, setSavingApiKey] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // 检查免费额度是否用完
  const remaining = user ? subscriptionService.getRemainingQuota(user.id) : null;
  const tier = user ? subscriptionService.getUserTier(user.id) : 'free';
  const isQuotaExhausted = tier === 'free' && remaining && remaining.tokens <= 0;

  // 合并调用，避免重复执行相同计算
  const dailyLimits = useMemo(() => billingService.getRemainingDailyLimits(), [user]);
  const usagePercents = useMemo(() => billingService.getUsagePercentages(), [user]);
  const dailyCost = useMemo(() => billingService.getDailyCost(), [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      addToast('error', '请上传图片文件');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      addToast('error', '图片大小不能超过 2MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const avatar = ev.target?.result as string;
        updateUser({ avatar });
        addToast('success', '头像已更新');
      };
      reader.onerror = () => {
        addToast('error', '头像上传失败');
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  if (!user) return null;

  const handleToggle = async (
    category: 'stickerAutoReply' | 'replySpeed' | keyof typeof settings.notification | keyof typeof settings.privacy | 'voice',
    sub?: string,
    value?: string
  ) => {
    if (category === 'stickerAutoReply') {
      await updateSettings({ stickerAutoReply: !settings.stickerAutoReply });
    } else if (category === 'replySpeed' && sub) {
      await updateSettings({ replySpeed: sub as 'slow' | 'normal' | 'fast' });
    } else if (category === 'sound' || category === 'desktop' || category === 'email') {
      await updateSettings({
        notification: { ...settings.notification, [category]: !settings.notification[category] },
      });
    } else if (category === 'showOnlineStatus' || category === 'allowDataAnalytics') {
      await updateSettings({
        privacy: { ...settings.privacy, [category]: !settings.privacy[category] },
      });
    } else if (category === 'voice' && sub) {
      if (sub === 'autoPlay') {
        await updateSettings({
          voice: { ...settings.voice, autoPlay: !settings.voice.autoPlay },
        });
      } else if (sub === 'rate' && value) {
        await updateSettings({
          voice: { ...settings.voice, rate: parseFloat(value) },
        });
      } else if (sub === 'volume' && value) {
        await updateSettings({
          voice: { ...settings.voice, volume: parseFloat(value) },
        });
      }
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await settingsAPI.exportData(user.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zhiwei-data-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('success', '数据已导出');
    } catch (e: any) {
      addToast('error', e.message || '导出失败');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.json')) {
      addToast('error', '请选择 JSON 格式的备份文件');
      return;
    }
    
    if (!confirm('导入数据将添加到现有数据中，是否继续？')) {
      return;
    }
    
    setImporting(true);
    try {
      const result = await settingsAPI.importData(file);
      addToast('success', `成功导入 ${result.agentCount} 个智能体和 ${result.messageCount} 条消息`);
    } catch (e: any) {
      addToast('error', e.message || '导入失败');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const handleDelete = async () => {
    if (
      !confirm('确定要注销账号吗？所有数据将在 72 小时内完全清除，此操作不可撤销。')
    )
      return;
    if (!confirm('请再次确认：你将永久失去所有智能体与聊天记录。')) return;
    setDeleting(true);
    try {
      await settingsAPI.deleteAccount();
      addToast('success', '账号已注销');
      logout();
      navigate('/');
    } catch (e: any) {
      addToast('error', e.message || '注销失败');
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveName = () => {
    if (tempName.trim() && tempName !== user.nickname) {
      updateUser({ nickname: tempName.trim() });
      addToast('success', '昵称已更新');
    }
    setEditingName(false);
  };

  const handleSaveApiKey = async () => {
    setSavingApiKey(true);
    try {
      apiConfig.setAPIKey(apiKey);
      addToast('success', 'API 密钥已保存');
    } catch (e: any) {
      addToast('error', e.message || '保存失败');
    } finally {
      setSavingApiKey(false);
    }
  };

  return (
    <Layout>
      <div className="aurora-bg min-h-screen">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <h1 className="font-display text-3xl font-semibold mb-6">个人设置</h1>

          {/* 额度用尽提醒 */}
          {isQuotaExhausted && (
            <div className="glass rounded-3xl p-4 mb-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                  <AlertCircle size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-800">今日免费额度已用完</p>
                  <p className="text-xs text-amber-600 mt-0.5">升级套餐继续使用，或明日再来</p>
                </div>
                <button
                  onClick={() => navigate('/pricing')}
                  className="btn-primary text-xs bg-amber-500 hover:bg-amber-600 border-amber-500"
                >
                  <Zap size={14} className="mr-1" /> 升级
                </button>
              </div>
            </div>
          )}

          {/* 资料 */}
          <section className="glass rounded-3xl p-5 mb-4">
            <h2 className="text-sm font-semibold text-ink-900/60 mb-3 flex items-center gap-2">
              <User size={14} /> 个人资料
            </h2>
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-iris-500 to-rose-400 flex items-center justify-center text-white font-display text-2xl font-semibold shadow-soft hover:opacity-90 transition-opacity overflow-hidden"
                >
                  {uploadingAvatar ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    user.avatar
                  )}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-iris-500 flex items-center justify-center text-white">
                  <Upload size={10} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="input-field text-sm"
                      autoFocus
                    />
                    <button onClick={handleSaveName} className="btn-primary text-xs">
                      <Check size={14} />
                    </button>
                  </div>
                ) : (
                  <p
                    onClick={() => {
                      setTempName(user.nickname);
                      setEditingName(true);
                    }}
                    className="font-semibold text-lg cursor-pointer hover:text-iris-500"
                  >
                    {user.nickname}
                  </p>
                )}
                <p className="text-xs text-ink-900/50 mt-0.5">
                  {user.phone}
                </p>
              </div>
            </div>
          </section>

          {/* 订阅管理 */}
          {(() => {
            const sub = user ? subscriptionService.getSubscription(user.id) : null;
            const tier = user ? subscriptionService.getUserTier(user.id) : 'free';
            const tierInfo = pricingService.getTier(tier);
            const remaining = user ? subscriptionService.getRemainingQuota(user.id) : null;
            
            return (
              <section className="glass rounded-3xl p-5 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-ink-900/60 flex items-center gap-2">
                    <Crown size={14} /> 当前套餐
                  </h2>
                  <button
                    onClick={() => navigate('/pricing')}
                    className="text-xs text-iris-500 hover:text-iris-600"
                  >
                    {tier === 'free' ? '立即订阅' : '升级套餐'}
                  </button>
                </div>
                
                <div className="bg-gradient-to-r from-iris-50 to-rose-50 rounded-2xl p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-iris-500 to-rose-400 flex items-center justify-center text-white text-lg font-semibold">
                      {tier === 'free' ? '🆓' : tier === 'gravity' ? '🌟' : '💎'}
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{tierInfo?.name || '免费版'}</p>
                      <p className="text-xs text-ink-900/60">
                        {sub?.status === 'active' && sub?.expireDate
                          ? `有效期至 ${new Date(sub.expireDate).toLocaleDateString()}`
                          : '免费额度每日重置'}
                      </p>
                    </div>
                  </div>
                </div>

                {tier !== 'free' && remaining && !remaining.isUnlimited && (
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-ink-900/60">Token 额度</span>
                        <span className="text-ink-900/80">
                          {remaining.tokens.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-iris-500 rounded-full"
                          style={{ width: `${Math.min(100, (remaining.tokens / (tierInfo?.limits.monthlyTokenQuota || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-ink-900/60">语音合成</span>
                        <span className="text-ink-900/80">
                          {remaining.tts.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-mint-500 rounded-full"
                          style={{ width: `${Math.min(100, (remaining.tts / (tierInfo?.limits.monthlyTTSQuota || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-ink-900/60">语音克隆</span>
                        <span className="text-ink-900/80">
                          {remaining.clones} 次
                        </span>
                      </div>
                      <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-coral-500 rounded-full"
                          style={{ width: `${Math.min(100, (remaining.clones / (tierInfo?.limits.monthlyCloneQuota || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {tier === 'free' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-ink-900/60">每日免费 Token</span>
                      <span className="text-ink-900/80">
                        {remaining?.tokens.toLocaleString() || 100000}/100,000
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-ink-900/60">每日免费语音</span>
                      <span className="text-ink-900/80">
                        {remaining?.tts.toLocaleString() || 10000}/10,000
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-ink-900/60">每日免费克隆</span>
                      <span className="text-ink-900/80">
                        {remaining?.clones || 1}/1
                      </span>
                    </div>
                  </div>
                )}
              </section>
            );
          })()}

          {/* 微信 */}
          <section className="glass rounded-3xl p-1 mb-4">
            <button
              onClick={() => navigate('/wechat-bind')}
              className="w-full flex items-center gap-3 p-4 hover:bg-ink-50/50 rounded-3xl transition"
            >
              <div className="w-10 h-10 rounded-xl bg-mint-400/10 text-mint-500 flex items-center justify-center">
                <Smartphone size={18} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold">微信绑定</p>
                <p className="text-xs text-ink-900/50">管理微信生态集成</p>
              </div>
              <ChevronRight size={16} className="text-ink-900/30" />
            </button>
          </section>

          {/* 互动设置 */}
          <section className="glass rounded-3xl p-5 mb-4">
            <h2 className="text-sm font-semibold text-ink-900/60 mb-3 flex items-center gap-2">
              <Bell size={14} /> 互动设置
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">表情包自动回复</p>
                  <p className="text-xs text-ink-900/50">
                    智能体根据对话内容自动发送表情包
                  </p>
                </div>
                <button
                  onClick={() => handleToggle('stickerAutoReply')}
                  className={`w-11 h-6 rounded-full transition relative ${
                    settings.stickerAutoReply ? 'bg-iris-500' : 'bg-ink-200'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                      settings.stickerAutoReply ? 'left-5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">回复速度</p>
                <div className="flex gap-1 p-1 bg-ink-100 rounded-full">
                  {(['slow', 'normal', 'fast'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => handleToggle('replySpeed', s)}
                      className={`flex-1 py-1.5 rounded-full text-xs font-medium transition ${
                        settings.replySpeed === s
                          ? 'bg-white text-ink-900 shadow-card'
                          : 'text-ink-900/60'
                      }`}
                    >
                      {s === 'slow' ? '慢' : s === 'normal' ? '正常' : '快'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 语音设置 */}
          <section className="glass rounded-3xl p-5 mb-4">
            <h2 className="text-sm font-semibold text-ink-900/60 mb-3 flex items-center gap-2">
              <Volume2 size={14} /> 语音设置
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">自动朗读回复</p>
                  <p className="text-xs text-ink-900/50">
                    智能体回复后自动播放语音
                  </p>
                </div>
                <button
                  onClick={() => handleToggle('voice', 'autoPlay')}
                  className={`w-11 h-6 rounded-full transition relative ${
                    settings.voice.autoPlay ? 'bg-iris-500' : 'bg-ink-200'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                      settings.voice.autoPlay ? 'left-5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">语音速度</p>
                  <span className="text-xs text-ink-900/50">
                    {(settings.voice.rate * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={settings.voice.rate}
                  onChange={(e) => handleToggle('voice', 'rate', e.target.value)}
                  className="w-full h-2 bg-ink-200 rounded-full appearance-none cursor-pointer accent-iris-500"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-ink-900/40">慢</span>
                  <span className="text-[10px] text-ink-900/40">正常</span>
                  <span className="text-[10px] text-ink-900/40">快</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">语音音量</p>
                  <span className="text-xs text-ink-900/50">
                    {(settings.voice.volume * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.voice.volume}
                  onChange={(e) => handleToggle('voice', 'volume', e.target.value)}
                  className="w-full h-2 bg-ink-200 rounded-full appearance-none cursor-pointer accent-iris-500"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-ink-900/40">静音</span>
                  <span className="text-[10px] text-ink-900/40">最大</span>
                </div>
              </div>
            </div>
          </section>

          {/* API 配置 */}
          <section className="glass rounded-3xl p-5 mb-4">
            <h2 className="text-sm font-semibold text-ink-900/60 mb-3 flex items-center gap-2">
              <Key size={14} /> API 配置
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">MiniMax API 密钥</p>
                <p className="text-xs text-ink-900/50 mb-3">
                  配置 API 密钥后可使用更强大的 AI 对话和语音功能
                </p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="输入你的 MiniMax API 密钥"
                    className="flex-1 input-field text-sm"
                  />
                  <button
                    onClick={handleSaveApiKey}
                    disabled={savingApiKey || !apiKey.trim()}
                    className="btn-primary text-sm px-4"
                  >
                    {savingApiKey ? <Loader2 size={14} className="animate-spin" /> : '保存'}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* 免费额度 */}
          <section className="glass rounded-3xl p-5 mb-4">
            <h2 className="text-sm font-semibold text-ink-900/60 mb-3">免费额度</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-900/70">对话 Token</span>
                <span className="text-sm font-medium">
                  {dailyLimits.promptTokens.toLocaleString()}
                  <span className="text-ink-900/50 ml-1">/ 100,000</span>
                </span>
              </div>
              <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-iris-500 rounded-full transition-all"
                  style={{ width: `${100 - usagePercents.promptTokens}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-900/70">语音合成</span>
                <span className="text-sm font-medium">
                  {dailyLimits.ttsChars.toLocaleString()}
                  <span className="text-ink-900/50 ml-1">/ 10,000</span>
                </span>
              </div>
              <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-mint-500 rounded-full transition-all"
                  style={{ width: `${100 - usagePercents.ttsChars}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-900/70">语音克隆</span>
                <span className="text-sm font-medium">
                  {dailyLimits.voiceClones}
                  <span className="text-ink-900/50 ml-1">/ 1</span>
                </span>
              </div>
              <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-coral-500 rounded-full transition-all"
                  style={{ width: `${100 - usagePercents.voiceClones}%` }}
                />
              </div>

              <div className="pt-2 border-t border-ink-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ink-900/70">今日预估费用</span>
                  <span className="text-sm font-medium text-iris-500">
                    ¥{dailyCost.toFixed(4)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* 通知 */}
          <section className="glass rounded-3xl p-5 mb-4">
            <h2 className="text-sm font-semibold text-ink-900/60 mb-3 flex items-center gap-2">
              <Bell size={14} /> 消息通知
            </h2>
            <div className="space-y-4">
              {[
                { key: 'sound' as const, label: '声音提醒' },
                { key: 'desktop' as const, label: '桌面通知' },
                { key: 'email' as const, label: '邮件通知' },
              ].map((n) => (
                <div key={n.key} className="flex items-center justify-between">
                  <p className="text-sm font-medium">{n.label}</p>
                  <button
                    onClick={() => handleToggle(n.key)}
                    className={`w-11 h-6 rounded-full transition relative ${
                      settings.notification[n.key] ? 'bg-iris-500' : 'bg-ink-200'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                        settings.notification[n.key] ? 'left-5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* 隐私 */}
          <section className="glass rounded-3xl p-5 mb-4">
            <h2 className="text-sm font-semibold text-ink-900/60 mb-3 flex items-center gap-2">
              <Shield size={14} /> 隐私设置
            </h2>
            <div className="space-y-4">
              {[
                {
                  key: 'showOnlineStatus' as const,
                  label: '显示在线状态',
                  desc: '让其他用户看到你是否在线',
                },
                {
                  key: 'allowDataAnalytics' as const,
                  label: '允许数据分析',
                  desc: '帮助我们改进产品体验',
                },
              ].map((p) => (
                <div key={p.key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{p.label}</p>
                    <p className="text-xs text-ink-900/50">{p.desc}</p>
                  </div>
                  <button
                    onClick={() => handleToggle(p.key)}
                    className={`w-11 h-6 rounded-full transition relative ${
                      settings.privacy[p.key] ? 'bg-iris-500' : 'bg-ink-200'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                        settings.privacy[p.key] ? 'left-5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* 数据 */}
          <section className="glass rounded-3xl p-1 mb-4 space-y-1">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="w-full flex items-center gap-3 p-4 hover:bg-ink-50/50 rounded-3xl transition"
            >
              <div className="w-10 h-10 rounded-xl bg-iris-500/10 text-iris-500 flex items-center justify-center">
                {exporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold">导出我的数据</p>
                <p className="text-xs text-ink-900/50">下载所有智能体与对话的 JSON 副本</p>
              </div>
              <ChevronRight size={16} className="text-ink-900/30" />
            </button>
            <button
              onClick={() => document.getElementById('import-file')?.click()}
              disabled={importing}
              className="w-full flex items-center gap-3 p-4 hover:bg-ink-50/50 rounded-3xl transition"
            >
              <div className="w-10 h-10 rounded-xl bg-mint-400/10 text-mint-500 flex items-center justify-center">
                {importing ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold">导入数据</p>
                <p className="text-xs text-ink-900/50">从备份文件恢复智能体与对话记录</p>
              </div>
              <ChevronRight size={16} className="text-ink-900/30" />
            </button>
            <input
              id="import-file"
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </section>

          {/* 退出/注销 */}
          <section className="space-y-2">
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="w-full glass rounded-2xl p-4 flex items-center gap-3 hover:bg-ink-50/50 transition"
            >
              <LogOut size={18} className="text-ink-900/60" />
              <span className="text-sm font-medium">退出登录</span>
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-full glass rounded-2xl p-4 flex items-center gap-3 hover:bg-coral-400/5 transition text-coral-500"
            >
              {deleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
              <div className="text-left flex-1">
                <p className="text-sm font-medium">注销账号</p>
                <p className="text-xs opacity-70">72 小时内完全清除所有数据</p>
              </div>
            </button>
          </section>
        </div>
      </div>
    </Layout>
  );
}
