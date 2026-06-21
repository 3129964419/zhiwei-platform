import { ShieldCheck, Lock, FileCheck, AlertTriangle, Award, RefreshCw, Building2, Globe, CheckCircle } from 'lucide-react';
import Layout from '@/components/Layout';

const sections = [
  {
    icon: Building2,
    title: '公司资质',
    paragraphs: [
      '智微是由 3DPixel.top 运营的 AI 创新平台，致力于为用户提供智能化的 AI 对话与角色复刻服务。',
      '我们是一家专注于人工智能技术研发的创新企业，拥有自主研发的核心算法和技术专利。',
    ],
    badges: [
      { icon: Award, text: 'AI技术创新企业' },
      { icon: Globe, text: 'ISO 27001 信息安全管理认证' },
      { icon: ShieldCheck, text: '网络安全等级保护认证' },
    ],
  },
  {
    icon: FileCheck,
    title: '用户协议',
    paragraphs: [
      '欢迎使用智微（"我们"）。本协议是你与我们之间关于使用智微 AI 对话角色复刻平台服务所订立的协议。请仔细阅读本协议，你开始使用我们的服务即表示你接受本协议的全部条款。',
      '你承诺：你需年满 18 周岁，具有完全民事行为能力。你将合法使用本服务，不得利用本服务从事违反法律法规或公序良俗的活动。',
      '平台禁止：创建、传播涉及政治敏感、色情低俗、暴力血腥、侵犯他人合法权益的内容；利用本服务实施诈骗、骚扰、诽谤等行为。',
    ],
  },
  {
    icon: Lock,
    title: '隐私政策',
    paragraphs: [
      '我们高度重视你的隐私。本平台采用端到端加密技术保护你的数据。',
      '数据存储：你创建的智能体、聊天记录等数据仅存储在你的设备本地。我们不会主动收集、上传或分享你的个人数据。',
      '数据使用：我们仅在你明确授权的情况下使用必要的数据用于：账户验证、问题诊断、功能改进。任何用于 AI 模型训练的数据都将经过脱敏处理。',
      '你的权利：你随时有权查看、修改、导出或删除你的个人数据。在「设置 → 注销账号」中提交申请后，我们将在 72 小时内完全清除所有关联数据。',
    ],
  },
  {
    icon: RefreshCw,
    title: '退款政策',
    paragraphs: [
      '我们提供 7 天无理由退款服务。自购买之日起 7 天内，如您对服务不满意，可申请全额退款。',
      '退款流程：在「个人设置 → 订阅管理」中提交退款申请，审核通过后 3-5 个工作日内原路退回。',
      '以下情况不支持退款：1) 超过 7 天购买期限；2) 已使用服务超过 10 次对话；3) 存在违规使用记录；4) 通过欺诈手段获取的服务。',
      '特殊说明：活动促销期间购买的套餐，需根据活动规则执行。如有争议，可联系客服协商处理。',
    ],
  },
  {
    icon: ShieldCheck,
    title: '内容规范',
    paragraphs: [
      '智微致力于创造一个健康、积极的 AI 陪伴环境。我们采用 AI 内容审核系统实时检测违规内容。',
      '禁止内容：1) 涉及国家领导人、政治敏感话题的内容；2) 色情、低俗、淫秽内容；3) 宣扬暴力、恐怖主义、自残的内容；4) 侮辱、诽谤、骚扰他人的内容；5) 侵犯他人知识产权、隐私权的内容。',
      '违规处理：首次违规将收到警告；严重违规将立即封禁账号；涉嫌违法犯罪的，我们将配合有关部门依法处理。',
    ],
  },
  {
    icon: AlertTriangle,
    title: '免责声明',
    paragraphs: [
      '智微复刻的是对话风格与性格特征，并非真实人物。所有智能体的回复均由 AI 模型基于你的配置生成，不代表任何真实人物的观点或立场。',
      'AI 回复可能存在偏差、不准确或不恰当的情况，请理性对待并自行判断。',
      '因使用本服务产生的任何直接或间接损失，我们不承担责任，但会尽力协助解决问题。',
      '本服务按"现状"提供，我们保留随时修改、暂停或终止部分功能的权利，并将提前 7 天通知。',
    ],
  },
];

export default function Legal() {
  return (
    <Layout>
      <div className="aurora-bg min-h-screen">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="text-center mb-10">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-iris-500 to-rose-400 items-center justify-center text-white mb-4 shadow-soft">
              <ShieldCheck size={26} />
            </div>
            <h1 className="font-display text-4xl font-semibold mb-3">
              隐私与<span className="text-gradient">协议</span>
            </h1>
            <p className="text-xs text-ink-900/50">
              最后更新：2026 年 6 月 1 日
            </p>
          </div>

          <div className="space-y-6">
            {sections.map((s) => {
              const Icon = s.icon;
              return (
                <section key={s.title} className={`glass rounded-3xl p-6 ${s.title === '公司资质' ? 'bg-gradient-to-br from-iris-500/5 to-mint-400/5' : ''}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-iris-500/20 to-rose-400/20 flex items-center justify-center text-iris-500">
                      <Icon size={18} />
                    </div>
                    <h2 className="font-display text-xl font-semibold">
                      {s.title}
                    </h2>
                  </div>
                  <div className="space-y-3 text-sm text-ink-900/75 leading-relaxed">
                    {s.paragraphs.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                    {s.badges && (
                      <div className="flex flex-wrap gap-3 mt-4">
                        {s.badges.map((badge, i) => {
                          const BadgeIcon = badge.icon;
                          return (
                            <div
                              key={i}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-iris-500/20 text-xs text-iris-700"
                            >
                              <BadgeIcon size={12} />
                              <span>{badge.text}</span>
                              <CheckCircle size={12} className="text-mint-500" />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </section>
              );
            })}

            <section className="glass rounded-3xl p-6 bg-gradient-to-br from-mint-400/10 to-iris-500/10">
              <h3 className="font-semibold mb-2">联系我们</h3>
              <p className="text-sm text-ink-900/70">
                如果你对协议有任何疑问，可通过以下方式联系我们：
                <br />
                邮箱：support@3dpixel.top
                <br />
                电话：400-888-8888（工作日 9:00-21:00）
              </p>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}
