import express from 'express';
import { getDriver } from '../config/neo4j.js';
import { getClient as getQdrantClient } from '../config/qdrant.js';
import { getClient as getRedisClient } from '../config/redis.js';

const router = express.Router();

// 健康检查端点
router.get('/', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      neo4j: 'unknown',
      qdrant: 'unknown',
      redis: 'unknown',
    },
  };

  // 检查 Neo4j
  try {
    const driver = getDriver();
    await driver.verifyConnectivity();
    health.services.neo4j = 'connected';
  } catch (error) {
    health.services.neo4j = 'disconnected';
    health.status = 'degraded';
  }

  // 检查 Qdrant
  try {
    const qdrantClient = getQdrantClient();
    await qdrantClient.getCollections();
    health.services.qdrant = 'connected';
  } catch (error) {
    health.services.qdrant = 'disconnected';
    health.status = 'degraded';
  }

  // 检查 Redis
  try {
    const redisClient = getRedisClient();
    await redisClient.ping();
    health.services.redis = 'connected';
  } catch (error) {
    health.services.redis = 'disconnected';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

export default router;
