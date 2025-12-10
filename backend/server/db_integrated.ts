import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { entities, entityRelationships, InsertEntity, InsertEntityRelationship, InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

// 导入新的数据库集成
import * as neo4j from "./config/neo4j";
import * as qdrant from "./config/qdrant";
import * as redis from "./config/redis";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ========== Entity Management ==========

export async function createEntity(data: InsertEntity) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 1. 创建实体到MySQL
  const result = await db.insert(entities).values(data);
  const insertedId = Number(result[0].insertId);
  
  const entity = await getEntityById(insertedId);
  
  if (entity) {
    // 2. 同步到Neo4j（异步，不阻塞）
    neo4j.createEntityNode(entity).catch(err => {
      console.error("[Neo4j] Failed to sync entity:", err);
    });

    // 3. 向量化并存储到Qdrant（异步，不阻塞）
    qdrant.upsertEntityVector(entity).catch(err => {
      console.error("[Qdrant] Failed to vectorize entity:", err);
    });

    // 4. 清除相关缓存
    await redis.deleteCachePattern("entities:list:*").catch(() => {});
    await redis.deleteCachePattern("graph:*").catch(() => {});
  }

  return entity;
}

export async function getEntityById(id: number) {
  // 1. 尝试从缓存获取
  const cacheKey = redis.CacheKeys.entity(id);
  const cached = await redis.getCache(cacheKey).catch(() => null);
  
  if (cached) {
    console.log(`[Cache] Hit for entity: ${id}`);
    return cached;
  }

  // 2. 从数据库获取
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(entities).where(eq(entities.id, id)).limit(1);
  const entity = result[0];

  // 3. 写入缓存
  if (entity) {
    await redis.setCache(cacheKey, entity, redis.CacheTTL.ENTITY).catch(() => {});
  }

  return entity;
}

export async function updateEntity(id: number, data: Partial<InsertEntity>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 1. 更新MySQL
  await db.update(entities).set(data).where(eq(entities.id, id));
  const entity = await getEntityById(id);

  if (entity) {
    // 2. 同步到Neo4j（异步，不阻塞）
    neo4j.updateEntityNode(id, data).catch(err => {
      console.error("[Neo4j] Failed to update entity:", err);
    });

    // 3. 更新Qdrant向量（异步，不阻塞）
    qdrant.upsertEntityVector(entity).catch(err => {
      console.error("[Qdrant] Failed to update vector:", err);
    });

    // 4. 清除缓存
    await redis.deleteCache(redis.CacheKeys.entity(id)).catch(() => {});
    await redis.deleteCachePattern("entities:list:*").catch(() => {});
    await redis.deleteCachePattern("graph:*").catch(() => {});
  }

  return entity;
}

export async function deleteEntity(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 1. 删除MySQL中的关系
  await db.delete(entityRelationships).where(
    or(
      eq(entityRelationships.sourceId, id),
      eq(entityRelationships.targetId, id)
    )
  );

  // 2. 删除MySQL中的实体
  await db.delete(entities).where(eq(entities.id, id));

  // 3. 删除Neo4j节点（异步，不阻塞）
  neo4j.deleteEntityNode(id).catch(err => {
    console.error("[Neo4j] Failed to delete entity:", err);
  });

  // 4. 删除Qdrant向量（异步，不阻塞）
  qdrant.deleteEntityVector(id).catch(err => {
    console.error("[Qdrant] Failed to delete vector:", err);
  });

  // 5. 清除缓存
  await redis.deleteCache(redis.CacheKeys.entity(id)).catch(() => {});
  await redis.deleteCachePattern("entities:list:*").catch(() => {});
  await redis.deleteCachePattern("graph:*").catch(() => {});
}

export async function getEntities(params: {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: "asc" | "desc";
}) {
  const { search = "", page = 1, limit = 10, sortBy = "updatedAt", order = "desc" } = params;

  // 1. 尝试从缓存获取
  const cacheKey = redis.CacheKeys.entitiesList(search, page, limit, sortBy, order);
  const cached = await redis.getCache(cacheKey).catch(() => null);

  if (cached) {
    console.log(`[Cache] Hit for entities list`);
    return cached;
  }

  // 2. 从数据库获取
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let query = db.select().from(entities);

  // 搜索过滤
  if (search) {
    query = query.where(like(entities.name, `%${search}%`)) as any;
  }

  // 排序
  const orderColumn = sortBy === "name" ? entities.name : entities.updatedAt;
  query = query.orderBy(order === "asc" ? orderColumn : desc(orderColumn)) as any;

  // 分页
  const offset = (page - 1) * limit;
  const items = await query.limit(limit).offset(offset);

  // 获取总数
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(entities)
    .where(search ? like(entities.name, `%${search}%`) : undefined);

  const total = Number(countResult[0]?.count || 0);

  const result = {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };

  // 3. 写入缓存
  await redis.setCache(cacheKey, result, redis.CacheTTL.ENTITIES_LIST).catch(() => {});

  return result;
}

// ========== Entity Relationships ==========

export async function createRelationship(data: InsertEntityRelationship) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 1. 创建MySQL关系
  await db.insert(entityRelationships).values(data);

  // 2. 获取关系ID
  const result = await db
    .select()
    .from(entityRelationships)
    .where(
      and(
        eq(entityRelationships.sourceId, data.sourceId),
        eq(entityRelationships.targetId, data.targetId),
        eq(entityRelationships.type, data.type)
      )
    )
    .limit(1);

  const relationship = result[0];

  if (relationship) {
    // 3. 同步到Neo4j（异步，不阻塞）
    neo4j.createRelationship(relationship).catch(err => {
      console.error("[Neo4j] Failed to create relationship:", err);
    });

    // 4. 清除图谱缓存
    await redis.deleteCachePattern("graph:*").catch(() => {});
  }
}

export async function getEntityRelationships(entityId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const outgoing = await db
    .select()
    .from(entityRelationships)
    .where(eq(entityRelationships.sourceId, entityId));

  const incoming = await db
    .select()
    .from(entityRelationships)
    .where(eq(entityRelationships.targetId, entityId));

  return { outgoing, incoming };
}

export async function getAllRelationships() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(entityRelationships);
}

// ========== Graph Data ==========

export async function getGraphData(filters?: {
  types?: string[];
  statuses?: string[];
}) {
  // 1. 尝试从缓存获取
  const cacheKey = redis.CacheKeys.graph(filters?.types, filters?.statuses);
  const cached = await redis.getCache(cacheKey).catch(() => null);

  if (cached) {
    console.log(`[Cache] Hit for graph data`);
    return cached;
  }

  // 2. 尝试从Neo4j获取（如果可用）
  try {
    const isNeo4jHealthy = await neo4j.healthCheck();
    if (isNeo4jHealthy) {
      const graphData = await neo4j.queryGraph(filters);
      
      // 转换格式以匹配原有API
      const result = {
        nodes: graphData.nodes.map(n => n.data),
        edges: graphData.edges,
      };

      // 写入缓存
      await redis.setCache(cacheKey, result, redis.CacheTTL.GRAPH).catch(() => {});

      console.log("[Neo4j] Graph data retrieved from Neo4j");
      return result;
    }
  } catch (error) {
    console.error("[Neo4j] Failed to get graph data, falling back to MySQL:", error);
  }

  // 3. 回退到MySQL
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let query = db.select().from(entities);

  // 类型和状态过滤
  if (filters?.types && filters.types.length > 0) {
    query = query.where(
      sql`${entities.type} IN (${sql.join(filters.types.map(t => sql`${t}`), sql`, `)})`
    ) as any;
  }

  if (filters?.statuses && filters.statuses.length > 0) {
    query = query.where(
      sql`${entities.status} IN (${sql.join(filters.statuses.map(s => sql`${s}`), sql`, `)})`
    ) as any;
  }

  const nodes = await query;
  const edges = await getAllRelationships();

  const result = { nodes, edges };

  // 写入缓存
  await redis.setCache(cacheKey, result, redis.CacheTTL.GRAPH).catch(() => {});

  return result;
}

// ========== RAG Search ==========

export async function searchEntitiesByVector(query: string, limit: number = 10) {
  try {
    const results = await qdrant.searchSimilarEntities(query, limit);
    
    // 获取完整的实体信息
    const entityIds = results.map(r => r.entityId);
    const entities = await Promise.all(
      entityIds.map(id => getEntityById(id))
    );

    return entities.filter(e => e !== undefined).map((entity, index) => ({
      ...entity,
      similarity: results[index].score,
    }));
  } catch (error) {
    console.error("[RAG] Search failed:", error);
    return [];
  }
}
