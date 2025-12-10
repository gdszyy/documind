import { sql, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { documindEntities, documindRelationships } from "../../../drizzle/schema_documind";
import { ApiError } from "../middleware/errorHandler";

let _db: ReturnType<typeof drizzle> | null = null;

async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    _db = drizzle(process.env.DATABASE_URL);
  }
  if (!_db) {
    throw new ApiError(500, "Database not available", "DATABASE_ERROR");
  }
  return _db;
}

/**
 * 获取统计信息
 */
export async function getStats() {
  const db = await getDb();

  // 总实体数
  const totalEntitiesResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(documindEntities)
    .where(isNull(documindEntities.deletedAt));

  const totalEntities = Number(totalEntitiesResult[0]?.count || 0);

  // 按类型统计
  const byTypeResult = await db
    .select({
      type: documindEntities.type,
      count: sql<number>`count(*)`,
    })
    .from(documindEntities)
    .where(isNull(documindEntities.deletedAt))
    .groupBy(documindEntities.type);

  const byType: Record<string, number> = {};
  byTypeResult.forEach((row) => {
    byType[row.type] = Number(row.count);
  });

  // 按状态统计
  const byStatusResult = await db
    .select({
      status: documindEntities.status,
      count: sql<number>`count(*)`,
    })
    .from(documindEntities)
    .where(isNull(documindEntities.deletedAt))
    .groupBy(documindEntities.status);

  const byStatus: Record<string, number> = {};
  byStatusResult.forEach((row) => {
    byStatus[row.status] = Number(row.count);
  });

  // TODO: 按分类统计（需要解析metadata中的category字段）
  const byCategory: Record<string, number> = {};

  // 总关系数
  const totalRelationshipsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(documindRelationships);

  const totalRelationships = Number(totalRelationshipsResult[0]?.count || 0);

  // 最后更新时间
  const lastUpdatedResult = await db
    .select({ updatedAt: documindEntities.updatedAt })
    .from(documindEntities)
    .where(isNull(documindEntities.deletedAt))
    .orderBy(sql`${documindEntities.updatedAt} DESC`)
    .limit(1);

  const lastUpdated = lastUpdatedResult[0]?.updatedAt?.toISOString() || new Date().toISOString();

  return {
    total_entities: totalEntities,
    by_type: byType,
    by_status: byStatus,
    by_category: byCategory,
    total_relationships: totalRelationships,
    last_updated: lastUpdated,
  };
}
