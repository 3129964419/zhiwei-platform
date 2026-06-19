# 智微验证码服务

基于 Node.js + Express + Redis 的手机验证码服务

## 功能特性

- ✅ 6位数字随机验证码生成
- ✅ 5分钟有效期
- ✅ 1分钟发送频率限制
- ✅ IP/设备防刷机制
- ✅ 完整日志记录
- ✅ 加密存储

## 技术栈

- **运行时**: Node.js 18+
- **框架**: Express.js
- **存储**: Redis
- **短信服务**: 阿里云/腾讯云/容联云
- **安全**: rate-limit, helmet, cors

## 项目结构

```
server/
├── src/
│   ├── config/
│   │   └── index.js          # 配置文件
│   ├── middleware/
│   │   ├── rateLimit.js      # 频率限制
│   │   ├── security.js       # 安全中间件
│   │   └── logger.js         # 日志中间件
│   ├── routes/
│   │   └── sms.js            # 验证码API路由
│   ├── services/
│   │   ├── smsService.js     # 短信服务
│   │   ├── redisService.js   # Redis存储
│   │   ├── codeGenerator.js  # 验证码生成
│   │   └── logger.js        # 日志服务
│   └── utils/
│       └── validator.js      # 验证工具
├── tests/
│   └── sms.test.js           # 测试用例
├── package.json
└── README.md
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# 短信服务配置 (阿里云)
ALIYUN_ACCESS_KEY_ID=your_access_key
ALIYUN_ACCESS_KEY_SECRET=your_secret
ALIYUN_SIGN_NAME=智微科技
ALIYUN_TEMPLATE_CODE=SMS_xxxxx

# 服务端口
PORT=3000

# 防刷配置
MAX_REQUESTS_PER_IP=10
MAX_REQUESTS_PER_DEVICE=5
```

### 3. 启动服务

```bash
# 开发环境
npm run dev

# 生产环境
npm start
```

## API 接口

### 发送验证码

```
POST /api/sms/send
Content-Type: application/json

{
  "phone": "13800138000",
  "deviceId": "device_unique_id"
}

Response:
{
  "success": true,
  "message": "验证码已发送",
  "expiresIn": 300
}
```

### 验证验证码

```
POST /api/sms/verify
Content-Type: application/json

{
  "phone": "13800138000",
  "code": "123456",
  "deviceId": "device_unique_id"
}

Response:
{
  "success": true,
  "message": "验证成功",
  "token": "jwt_token_for_login"
}
```

## 安全措施

1. **频率限制**: 同一IP 1分钟内最多10次请求
2. **设备限制**: 同一设备1分钟内最多5次请求
3. **手机号限制**: 同一手机号1分钟内最多发送1次
4. **验证码限制**: 连续5次错误自动锁定
5. **加密存储**: 验证码使用 AES 加密

## 日志记录

所有操作都会被记录：

- 发送时间、IP地址、设备ID
- 验证成功/失败
- 异常情况

日志存储在 `logs/sms.log`

## 测试

```bash
# 运行测试
npm test

# 压力测试
npm run load-test
```

## 部署

### Docker 部署

```bash
docker-compose up -d
```

### 云服务部署

推荐使用阿里云函数计算或 AWS Lambda
