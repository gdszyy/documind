import { Router } from "express";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { successResponse, internalErrorResponse } from "../utils/response";

const router = Router();

/**
 * 执行数据库迁移
 * POST /api/migrate
 * 注意：这是一个管理接口，生产环境应该添加认证保护
 */
router.post("/", async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return internalErrorResponse(res, "DATABASE_URL not configured");
    }

    const connection = await mysql.createConnection(process.env.DATABASE_URL);

    // 删除旧表（如果存在）
    await connection.execute("DROP TABLE IF EXISTS `entity_relationships`").catch(() => {});
    await connection.execute("DROP TABLE IF EXISTS `entities`").catch(() => {});

    // 创建 documind_entities 表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`documind_entities\` (
        \`id\` int AUTO_INCREMENT PRIMARY KEY,
        \`entityId\` varchar(255) NOT NULL UNIQUE,
        \`type\` varchar(50) NOT NULL,
        \`title\` varchar(500) NOT NULL,
        \`status\` varchar(50) NOT NULL DEFAULT 'active',
        \`documentUrl\` varchar(1000),
        \`metadata\` text,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deletedAt\` timestamp NULL,
        INDEX \`idx_entityId\` (\`entityId\`),
        INDEX \`idx_type\` (\`type\`),
        INDEX \`idx_status\` (\`status\`),
        INDEX \`idx_deletedAt\` (\`deletedAt\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 创建 documind_relationships 表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`documind_relationships\` (
        \`id\` int AUTO_INCREMENT PRIMARY KEY,
        \`relationshipId\` varchar(255) NOT NULL UNIQUE,
        \`sourceId\` varchar(255) NOT NULL,
        \`targetId\` varchar(255) NOT NULL,
        \`relationshipType\` varchar(50) NOT NULL,
        \`metadata\` text,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_relationshipId\` (\`relationshipId\`),
        INDEX \`idx_sourceId\` (\`sourceId\`),
        INDEX \`idx_targetId\` (\`targetId\`),
        INDEX \`idx_relationshipType\` (\`relationshipType\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 检查表是否存在
    const [tables] = await connection.execute(`
      SHOW TABLES LIKE 'documind_%'
    `) as any;

    await connection.end();

    return successResponse(res, {
      message: "Migration completed successfully",
      tables: tables.map((t: any) => Object.values(t)[0]),
    });
  } catch (error: any) {
    console.error("Migration error:", error);
    return internalErrorResponse(res, "Migration failed", error.message);
  }
});

/**
 * 检查迁移状态
 * GET /api/migrate
 */
router.get("/", async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return internalErrorResponse(res, "DATABASE_URL not configured");
    }

    const connection = await mysql.createConnection(process.env.DATABASE_URL);

    const [tables] = await connection.execute(`
      SHOW TABLES LIKE 'documind_%'
    `) as any;

    await connection.end();

    const tableNames = tables.map((t: any) => Object.values(t)[0]);

    return successResponse(res, {
      migrated: tableNames.length > 0,
      tables: tableNames,
      required_tables: ["documind_entities", "documind_relationships"],
    });
  } catch (error: any) {
    console.error("Migration check error:", error);
    return internalErrorResponse(res, "Failed to check migration status", error.message);
  }
});

export default router;
