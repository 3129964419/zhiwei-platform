# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY src ./src

# 生产阶段
FROM node:18-alpine AS production

WORKDIR /app

# 复制 package 文件和依赖
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# 复制源代码
COPY src ./src

# 创建日志目录
RUN mkdir -p ./logs

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/sms/health || exit 1

# 启动命令
CMD ["node", "src/index.js"]
