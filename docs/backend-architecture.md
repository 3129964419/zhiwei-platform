# 智微后端服务架构设计

## 一、架构概述

### 1.1 目标
- 实现数据云端存储，支持多设备同步
- 提供用户认证、授权服务
- 支持 API 开放平台
- 高可用、可扩展

### 1.2 技术栈选型

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| 网关层 | Nginx / Kong | 负载均衡、限流、认证 |
| 服务层 | Node.js (NestJS) / Go | RESTful API 服务 |
| 数据层 | PostgreSQL + Redis | 关系型数据库 + 缓存 |
| 文件存储 | OSS / S3 | 头像、聊天记录文件 |
| 消息队列 | RabbitMQ / Kafka | 异步任务处理 |
| 搜索引擎 | Elasticsearch | 智能体搜索 |

---

## 二、服务模块设计

### 2.1 用户服务 (User Service)

```
/api/v1/users
├── POST   /register          # 用户注册
├── POST   /login             # 用户登录
├── POST   /logout            # 用户登出
├── GET    /me                # 获取当前用户信息
├── PUT    /me                # 更新用户信息
├── POST   /phone/verify      # 发送验证码
├── POST   /wechat/bind       # 微信绑定
└── POST   /wechat/unbind     # 微信解绑
```

### 2.2 智能体服务 (Agent Service)

```
/api/v1/agents
├── GET    /                  # 获取智能体列表
├── POST   /                  # 创建智能体
├── GET    /:id               # 获取智能体详情
├── PUT    /:id               # 更新智能体
├── DELETE /:id               # 删除智能体
├── POST   /:id/clone         # 克隆智能体
└── POST   /clone-from-chat   # 从聊天记录克隆
```

### 2.3 对话服务 (Chat Service)

```
/api/v1/chat
├── GET    /:agentId/messages # 获取消息历史
├── POST   /:agentId/messages # 发送消息
├── DELETE /:agentId/messages # 清空消息
├── GET    /:agentId/export   # 导出对话
└── POST   /stream            # 流式对话 (WebSocket)
```

### 2.4 社区服务 (Community Service)

```
/api/v1/community
├── GET    /agents            # 获取分享列表
├── POST   /agents/:id/share  # 分享智能体
├── DELETE /shares/:id        # 取消分享
├── POST   /shares/:id/like   # 点赞
├── POST   /shares/:id/download # 下载/克隆
└── GET    /tags              # 获取热门标签
```

### 2.5 订阅服务 (Subscription Service)

```
/api/v1/subscription
├── GET    /tiers             # 获取套餐列表
├── GET    /me                # 获取当前订阅状态
├── POST   /subscribe         # 订阅套餐
├── POST   /cancel            # 取消订阅
├── GET    /usage             # 获取使用量统计
└── POST   /pay               # 发起支付
```

### 2.6 管理服务 (Admin Service)

```
/api/v1/admin
├── POST   /login             # 管理员登录
├── GET    /users             # 用户列表
├── PUT    /users/:id         # 更新用户
├── GET    /agents            # 智能体统计
├── GET    /stats             # 系统统计
├── GET    /logs              # 操作日志
└── GET    /revenue           # 收入统计
```

---

## 三、数据库设计

### 3.1 用户表 (users)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255),
  nickname VARCHAR(50),
  avatar_url TEXT,
  wechat_openid VARCHAR(100) UNIQUE,
  wechat_unionid VARCHAR(100),
  tier VARCHAR(20) DEFAULT 'free',
  tier_expire_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP
);
```

### 3.2 智能体表 (agents)

```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  personality VARCHAR(50),
  relationship VARCHAR(50),
  background TEXT,
  avatar_url TEXT,
  avatar_gradient JSONB,
  interaction_mode JSONB,
  skill_id UUID,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP
);

CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_agents_status ON agents(status);
```

### 3.3 消息表 (messages)

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'text',
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_agent_id ON messages(agent_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
```

### 3.4 订阅表 (subscriptions)

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tier VARCHAR(20) NOT NULL,
  billing_cycle VARCHAR(20),
  price DECIMAL(10, 2),
  start_at TIMESTAMP,
  expire_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active',
  payment_method VARCHAR(20),
  payment_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

### 3.5 分享表 (shares)

```sql
CREATE TABLE shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  name VARCHAR(50),
  personality VARCHAR(50),
  relationship VARCHAR(50),
  background TEXT,
  avatar_url TEXT,
  avatar_gradient JSONB,
  likes_count INT DEFAULT 0,
  downloads_count INT DEFAULT 0,
  tags JSONB,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_shares_user_id ON shares(user_id);
CREATE INDEX idx_shares_created_at ON shares(created_at);
```

---

## 四、API 认证设计

### 4.1 JWT Token 认证

```typescript
interface TokenPayload {
  userId: string;
  phone?: string;
  tier: string;
  iat: number;
  exp: number;
}

// Access Token: 2小时过期
// Refresh Token: 30天过期
```

### 4.2 请求头格式

```
Authorization: Bearer <access_token>
X-Request-ID: <uuid>
```

---

## 五、部署架构

```
                    ┌─────────────┐
                    │   CDN/OSS   │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │    Nginx    │
                    │  (Gateway)  │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
  ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
  │  API Server │   │  API Server │   │  API Server │
  │   (Node 1)  │   │   (Node 2)  │   │   (Node 3)  │
  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
  ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
  │ PostgreSQL  │   │    Redis    │   │ RabbitMQ    │
  │  (Primary)  │   │   (Cache)   │   │  (Queue)    │
  └─────────────┘   └─────────────┘   └─────────────┘
```

---

## 六、实施路线图

### Phase 1: 基础服务 (2周)
- [ ] 搭建 NestJS 项目框架
- [ ] 实现用户认证服务
- [ ] 实现 PostgreSQL 数据库连接
- [ ] 实现 Redis 缓存

### Phase 2: 核心功能 (3周)
- [ ] 实现智能体 CRUD
- [ ] 实现消息存储
- [ ] 实现对话服务
- [ ] 实现订阅服务

### Phase 3: 社区功能 (2周)
- [ ] 实现分享服务
- [ ] 实现点赞/下载
- [ ] 实现搜索功能

### Phase 4: 运维优化 (2周)
- [ ] 部署 CI/CD
- [ ] 监控告警
- [ ] 日志收集
- [ ] 性能优化

---

## 七、成本估算

### 7.1 云服务成本 (月度)

| 服务 | 配置 | 预估费用 |
|------|------|---------|
| ECS (API Server) | 4核8G × 2 | ¥400 |
| RDS PostgreSQL | 2核4G | ¥300 |
| Redis | 1G | ¥100 |
| OSS | 100G | ¥50 |
| CDN | 500G流量 | ¥100 |
| **合计** | | **¥950/月** |

### 7.2 扩展建议

- 初期用户量 < 1000：使用 Serverless 架构降低成本
- 用户量 1000-10000：使用上述标准架构
- 用户量 > 10000：考虑 Kubernetes 集群部署
