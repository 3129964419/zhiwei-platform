const express = require('express');
const config = require('./config');
const { initRedis, closeRedis } = require('./services/redisService');
const { logger } = require('./services/logger');
const smsRoutes = require('./routes/sms');
const {
  securityMiddleware,
  requestIdMiddleware,
  generalRateLimiter,
  corsMiddleware,
  bodyParserMiddleware,
  errorHandler,
} = require('./middleware/security');

const app = express();

// 安全中间件
app.use(securityMiddleware);
app.use(requestIdMiddleware);
app.use(corsMiddleware);
app.use(bodyParserMiddleware);
app.use(express.json());
app.use(generalRateLimiter);

// 请求日志
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path}`, {
      requestId: req.requestId,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });
  
  next();
});

// API 路由
app.use('/api/sms', smsRoutes);

// 根路径
app.get('/', (req, res) => {
  res.json({
    service: 'Zhiwei SMS Service',
    version: '1.0.0',
    status: 'running',
  });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API not found',
    code: 'NOT_FOUND',
  });
});

// 错误处理
app.use(errorHandler);

// 启动服务
async function startServer() {
  try {
    // 初始化 Redis
    await initRedis();
    logger.info('Redis initialized');

    // 启动 HTTP 服务器
    const server = app.listen(config.server.port, () => {
      logger.info(`SMS service running on port ${config.server.port}`);
      logger.info(`Environment: ${config.server.env}`);
    });

    // 优雅关闭
    const shutdown = async (signal) => {
      logger.info(`${signal} received, shutting down gracefully`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        await closeRedis();
        logger.info('Redis connection closed');
        process.exit(0);
      });

      // 30秒后强制退出
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
