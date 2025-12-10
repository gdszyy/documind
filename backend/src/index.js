import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRouter from './routes/health.js';
import { connectNeo4j, disconnectNeo4j } from './config/neo4j.js';
import { connectQdrant } from './config/qdrant.js';
import { connectRedis, disconnectRedis } from './config/redis.js';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
app.use('/health', healthRouter);

// 根路由
app.get('/', (req, res) => {
  res.json({
    message: 'DocuMind Backend API Service',
    version: '1.0.0',
    status: 'running'
  });
});

// 初始化数据库连接
async function initializeConnections() {
  try {
    console.log('🔌 Initializing database connections...');
    
    await connectNeo4j();
    console.log('✅ Neo4j connected');
    
    await connectQdrant();
    console.log('✅ Qdrant connected');
    
    await connectRedis();
    console.log('✅ Redis connected');
    
    console.log('🎉 All database connections initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize connections:', error);
    // 不中断服务启动，允许部分功能降级运行
  }
}

// 优雅关闭
async function gracefulShutdown() {
  console.log('\n🛑 Shutting down gracefully...');
  
  try {
    await disconnectNeo4j();
    await disconnectRedis();
    console.log('✅ All connections closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// 启动服务器
app.listen(PORT, async () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  await initializeConnections();
});
