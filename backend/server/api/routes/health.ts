import { Router } from "express";
import { drizzle } from "drizzle-orm/mysql2";

const router = Router();

/**
 * 健康检查
 * GET /api/health
 * GET /health
 */
router.get("/", async (req, res) => {
  const health: any = {
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      database: "unknown",
      neo4j: "unknown",
    },
  };

  // 检查数据库连接
  try {
    if (process.env.DATABASE_URL) {
      const db = drizzle(process.env.DATABASE_URL);
      await db.execute("SELECT 1" as any);
      health.services.database = "ok";
    } else {
      health.services.database = "not_configured";
    }
  } catch (error) {
    health.services.database = "error";
    health.status = "degraded";
  }

  // TODO: 检查 Neo4j 连接
  health.services.neo4j = "not_implemented";

  return res.status(200).json(health);
});

export default router;
