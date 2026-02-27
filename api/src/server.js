/**
 * Express 服务器入口
 * 职责：启动服务器，配置中间件，挂载路由
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./db/init');
const promptsRouter = require('./routes/prompts');

const app = express();
const PORT = 3000;

// 启动时自动运行一次 init.js 以确保数据库存在
console.log('正在初始化数据库...');
try {
  initDatabase();
  console.log('数据库初始化完成');
} catch (error) {
  console.error('数据库初始化失败:', error);
  process.exit(1);
}

// 启用 CORS 中间件（允许插件跨域访问）- 增强配置
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 启用 JSON body 解析
app.use(express.json());

// 静态目录：提供可视化面板前端（临时方案，后续可迁移至独立 dashboard）
const publicDir = path.join(__dirname, '../public');
app.use(express.static(publicDir));

// 添加请求日志中间件（在路由之前）
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  if (req.method === 'POST' && req.body) {
    console.log('请求体:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// 挂载 prompts 路由
app.use('/api/prompts', promptsRouter);

// 根路径健康检查
app.get('/', (req, res) => {
  res.json({
    message: 'AI Prompt Manager API',
    status: 'running'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`服务器运行在 http://127.0.0.1:${PORT}`);
  console.log(`API 端点: http://127.0.0.1:${PORT}/api/prompts`);
});
