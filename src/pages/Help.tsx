import { useState } from 'react';
import { ChevronDown, BookOpen, HelpCircle, MessageCircle, FileText, Sparkles } from 'lucide-react';
import Layout from '@/components/Layout';

const faqs = [
  {
    cat: '快速上手',
    items: [
      {
        q: '如何创建第一个智能体？',
        a: '登录后点击首页「立即开始」或在仪表盘选择「普通创建」/「角色复刻」，按引导步骤设置即可。普通创建约 30 秒，角色复刻需要 1-2 分钟分析。',
      },
      {
        q: '角色复刻需要多少聊天截图？',
        a: '建议至少 10 张以上，最好包含不同场景和情绪的对话。最多支持 20 张，单张不超过 5MB。',
      },
    ],
  },
  {
    cat: '套餐与支付',
    items: [
      {
        q: '复刻次数会过期吗？',
        a: '单次购买的复刻次数永久有效。订阅套餐的次数按月重置，未使用部分不累积到下个月。',
      },
      {
        q: '可以随时取消订阅吗？',
        a: '可以。在「设置 → 套餐管理」中关闭自动续费即可。已支付的服务周期内仍可正常使用。',
      },
    ],
  },
  {
    cat: '隐私与安全',
    items: [
      {
        q: '我的聊天记录会上传服务器吗？',
        a: '不会。所有聊天记录和智能体配置都存储在你的设备本地，我们承诺不收集、不上传、不分享。',
      },
      {
        q: '如何彻底删除我的数据？',
        a: '在「设置 → 注销账号」中提交申请，我们会在 72 小时内完全清除服务器端的所有关联数据。',
      },
    ],
  },
  {
    cat: '智能体使用',
    items: [
      {
        q: '智能体回复不准确怎么办？',
        a: '可以尝试：1) 增加更多聊天记录重新分析；2) 调整关系深度设定；3) 多次对话让 AI 适应你的偏好；4) 联系客服获取人工调优。',
      },
      {
        q: '可以创建多少个智能体？',
        a: '免费版最多 3 个，引力与共振套餐支持无限创建。',
      },
    ],
  },
];

const tutorials = [
  { title: '5 分钟快速上手', tag: '视频 · 5:32', emoji: '🎬', color: 'iris' },
  { title: '如何上传聊天截图', tag: '图文 · 3 步', emoji: '📸', color: 'rose' },
  { title: '选择最佳性格组合', tag: '图文 · 5 分钟', emoji: '🎭', color: 'peach' },
  { title: '提升复刻准确率', tag: '视频 · 8:15', emoji: '✨', color: 'mint' },
  { title: '微信绑定完整指南', tag: '图文 · 4 步', emoji: '📱', color: 'iris' },
  { title: '套餐选择建议', tag: '图文 · 3 分钟', emoji: '💎', color: 'rose' },
];

const colorMap: Record<string, [string, string]> = {
  iris: ['#E5DEFF', '#7C5CFF'],
  rose: ['#FFD3E0', '#FF8FB1'],
  peach: ['#FFD3B6', '#FFB088'],
  mint: ['#D0F5E5', '#6FE7B8'],
};

export default function Help() {
  const [openFaq, setOpenFaq] = useState<string | null>(faqs[0].items[0].q);

  return (
    <Layout>
      <div className="aurora-bg min-h-screen">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center mb-12 reveal-text">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-iris-500 to-rose-400 items-center justify-center text-white mb-4 shadow-soft">
              <BookOpen size={26} />
            </div>
            <h1 className="font-display text-4xl font-semibold mb-3">
              帮助<span className="text-gradient">中心</span>
            </h1>
            <p className="text-ink-900/60 max-w-md mx-auto">
              快速找到你需要的答案，或联系我们的支持团队
            </p>
          </div>

          {/* 教程卡片 */}
          <section className="mb-12">
            <h2 className="font-display text-2xl font-semibold mb-5 flex items-center gap-2">
              <Sparkles size={18} className="text-iris-500" /> 使用教程
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {tutorials.map((t) => (
                <div
                  key={t.title}
                  className="group glass rounded-3xl p-4 hover-lift cursor-pointer relative overflow-hidden"
                >
                  <div
                    className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-30 blur-2xl group-hover:opacity-50 transition"
                    style={{
                      background: `linear-gradient(135deg, ${colorMap[t.color][0]}, ${colorMap[t.color][1]})`,
                    }}
                  />
                  <div className="relative">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-3"
                      style={{
                        background: `linear-gradient(135deg, ${colorMap[t.color][0]}, ${colorMap[t.color][1]})`,
                      }}
                    >
                      {t.emoji}
                    </div>
                    <p className="font-semibold text-sm mb-1">{t.title}</p>
                    <p className="text-[10px] text-ink-900/50">{t.tag}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section className="mb-12">
            <h2 className="font-display text-2xl font-semibold mb-5 flex items-center gap-2">
              <HelpCircle size={18} className="text-rose-400" /> 常见问题
            </h2>
            <div className="space-y-6">
              {faqs.map((cat) => (
                <div key={cat.cat}>
                  <h3 className="text-sm font-semibold text-ink-900/50 mb-2 px-1">
                    {cat.cat}
                  </h3>
                  <div className="space-y-2">
                    {cat.items.map((item) => {
                      const isOpen = openFaq === item.q;
                      return (
                        <div key={item.q} className="glass rounded-2xl overflow-hidden">
                          <button
                            onClick={() => setOpenFaq(isOpen ? null : item.q)}
                            className="w-full flex items-center justify-between p-4 text-left"
                          >
                            <span className="text-sm font-medium pr-4">{item.q}</span>
                            <ChevronDown
                              size={16}
                              className={`shrink-0 text-ink-900/40 transition-transform ${
                                isOpen ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                          {isOpen && (
                            <div className="px-4 pb-4 text-sm text-ink-900/70 leading-relaxed">
                              {item.a}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 联系客服 */}
          <section className="glass rounded-4xl p-6 md:p-8 text-center relative overflow-hidden">
            <div
              className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-30 blur-3xl"
              style={{ background: 'radial-gradient(circle, #B8A6FF, transparent)' }}
            />
            <div
              className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full opacity-30 blur-3xl"
              style={{ background: 'radial-gradient(circle, #FFB8C8, transparent)' }}
            />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-iris-500 to-rose-400 mx-auto mb-4 flex items-center justify-center text-white">
                <MessageCircle size={26} />
              </div>
              <h3 className="font-display text-2xl font-semibold mb-2">
                没有找到答案？
              </h3>
              <p className="text-sm text-ink-900/60 mb-5 max-w-sm mx-auto">
                我们的客服团队随时待命，平均回复时间 2 分钟
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <button className="btn-primary text-sm flex items-center justify-center gap-2">
                  <MessageCircle size={14} /> 在线咨询
                </button>
                <button className="btn-secondary text-sm flex items-center justify-center gap-2">
                  <FileText size={14} /> 提交工单
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
