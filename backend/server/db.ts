import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  documindEntities, 
  documindRelationships, 
  DocumindEntity,
  DocumindRelationship,
  InsertDocumindEntity, 
  InsertDocumindRelationship,
  InsertUser, 
  users 
} from "../drizzle/schema_documind";
import { ENV } from './_core/env';

// 导入新的数据库集成
import * as neo4j from "./config/neo4j";
import * as qdrant from "./config/qdrant";
import * as redis from "./config/redis";
import { nanoid } from "nanoid";

let _db: ReturnType<typeof drizzle> | null = null;
let _dbInitialized = false;

// 初始化数据库连接并输出状态
export async function initDatabase() {
  if (_dbInitialized) {
    return;
  }
  _dbInitialized = true;

  console.log("[Database] Initializing database connection...");
  
  if (!process.env.DATABASE_URL) {
    console.warn("[Database] DATABASE_URL not configured - running without database");
    console.warn("[Database] User data will not be persisted");
    console.warn("[Database] To enable database, set DATABASE_URL environment variable");
    return;
  }

  try {
    console.log("[Database] DATABASE_URL found, attempting connection...");
    _db = drizzle(process.env.DATABASE_URL);
    // 尝试执行一个简单查询来验证连接
    await _db.select().from(users).limit(1);
    console.log("[Database] ✅ Database connected successfully");
  } catch (error) {
    console.error("[Database] ❌ Failed to connect:", error);
    console.warn("[Database] Running without database - user data will not be persisted");
    _db = null;
  }
}

export async function getDb() {
  if (!_db && process.env.DATABASE_URL && !_dbInitialized) {
    await initDatabase();
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

    await db
      .insert(users)
      .values(values)
      .onDuplicateKeyUpdate({
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

// ========== Entity Management (使用新表 documind_entities) ==========

/**
 * 旧表字段到新表字段的映射
 * 将前端/tRPC使用的旧格式转换为新的数据库格式
 */
function mapOldToNew(oldData: {
  name?: string;
  uniqueId?: string;
  type?: string;
  owner?: string;
  status?: string;
  description?: string;
  httpMethod?: string;
  apiPath?: string;
  larkDocUrl?: string;
}): Partial<InsertDocumindEntity> {
  // 验证必需字段
  if (!oldData.name) {
    console.warn('[mapOldToNew] Missing required field: name');
  }
  if (!oldData.type) {
    console.warn('[mapOldToNew] Missing required field: type');
  }
  
  const metadata: Record<string, any> = {};
  
  // 将扩展字段放入metadata（只添加有值的字段）
  if (oldData.owner !== undefined) metadata.owner = oldData.owner;
  if (oldData.description !== undefined) metadata.description = oldData.description;
  if (oldData.httpMethod !== undefined) metadata.httpMethod = oldData.httpMethod;
  if (oldData.apiPath !== undefined) metadata.apiPath = oldData.apiPath;

  const result = {
    entityId: oldData.uniqueId || `entity-${nanoid()}`,
    type: oldData.type?.toLowerCase() || 'unknown',
    title: oldData.name || 'Untitled',
    status: oldData.status?.toLowerCase() || 'active',
    documentUrl: oldData.larkDocUrl || null,
    metadata: Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : null,
  };
  
  console.log('[mapOldToNew] Mapping:', {
    input: { name: oldData.name, uniqueId: oldData.uniqueId, type: oldData.type },
    output: { title: result.title, entityId: result.entityId, type: result.type },
    metadataFields: Object.keys(metadata),
  });
  
  return result;
}

/**
 * 新表字段到旧表格式的映射（用于返回给前端和同步到Neo4j/Qdrant）
 * 将数据库的新格式转换回前端期望的旧格式
 */
function mapNewToOld(newEntity: any) {
  let metadata: Record<string, any> = {};
  
  // 安全解析metadata
  if (newEntity.metadata) {
    try {
      metadata = typeof newEntity.metadata === 'string' 
        ? JSON.parse(newEntity.metadata) 
        : newEntity.metadata;
    } catch (error) {
      console.error('[mapNewToOld] Failed to parse metadata:', error);
      console.error('[mapNewToOld] Raw metadata:', newEntity.metadata);
      metadata = {};
    }
  }

  const result = {
    id: newEntity.id,
    name: newEntity.title,
    uniqueId: newEntity.entityId,
    type: capitalizeFirst(newEntity.type),
    owner: metadata.owner || 'Unknown',
    status: capitalizeFirst(newEntity.status),
    description: metadata.description || null,
    httpMethod: metadata.httpMethod || null,
    apiPath: metadata.apiPath || null,
    larkDocUrl: newEntity.documentUrl,
    createdAt: newEntity.createdAt,
    updatedAt: newEntity.updatedAt,
  };
  
  // 验证关键字段
  if (!result.name || !result.uniqueId || !result.type) {
    console.error('[mapNewToOld] Missing critical fields:', {
      name: result.name,
      uniqueId: result.uniqueId,
      type: result.type,
    });
  }
  
  return result;
}

function capitalizeFirst(str: string): string {
  if (!str) return str;
  
  // 特殊类型处理：全大写的类型
  const specialTypes: Record<string, string> = {
    'api': 'API',
    'ui': 'UI',
    'id': 'ID',
  };
  
  const lowerStr = str.toLowerCase();
  if (specialTypes[lowerStr]) {
    return specialTypes[lowerStr];
  }
  
  // 默认：首字母大写
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export async function createEntity(data: any) {
  console.log('[createEntity] Starting entity creation:', {
    name: data.name,
    uniqueId: data.uniqueId,
    type: data.type,
  });
  
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 转换旧格式到新格式
  const newData = mapOldToNew(data);
  console.log('[createEntity] Converted to new format:', newData);

  // 1. 创建实体到MySQL
  const result = await db.insert(documindEntities).values(newData as InsertDocumindEntity);
  const insertedId = Number(result[0].insertId);
  console.log('[createEntity] Inserted into MySQL with ID:', insertedId);
  
  const entity = await getEntityById(insertedId);
  
  if (entity) {
    // 转换为旧格式用于同步
    const oldFormatEntity = mapNewToOld(entity);
    console.log('[createEntity] Converted back to old format for sync:', {
      id: oldFormatEntity.id,
      name: oldFormatEntity.name,
      uniqueId: oldFormatEntity.uniqueId,
      type: oldFormatEntity.type,
      owner: oldFormatEntity.owner,
    });
    
    // 验证必需字段
    if (!oldFormatEntity.name || !oldFormatEntity.uniqueId || !oldFormatEntity.type) {
      console.error('[createEntity] Invalid entity format for sync:', oldFormatEntity);
      throw new Error('Entity missing required fields for sync');
    }
    
    // 2. 同步到Neo4j（异步，不阻塞）
    console.log('[createEntity] Syncing to Neo4j...');
    neo4j.createEntityNode(oldFormatEntity).then(() => {
      console.log('[createEntity] ✓ Neo4j sync successful for entity:', oldFormatEntity.id);
    }).catch(err => {
      console.error('[createEntity] ✗ Neo4j sync failed for entity:', oldFormatEntity.id);
      console.error('[createEntity] Neo4j error details:', {
        message: err.message,
        code: err.code,
        name: err.name,
        stack: err.stack?.split('\n').slice(0, 3).join('\n'),
      });
      console.error('[createEntity] Entity data:', {
        id: oldFormatEntity.id,
        name: oldFormatEntity.name,
        uniqueId: oldFormatEntity.uniqueId,
        type: oldFormatEntity.type,
      });
      // TODO: 添加到失败队列进行重试
    });

    // 3. 向量化并存储到Qdrant（异步，不阻塞）
    console.log('[createEntity] Syncing to Qdrant...');
    qdrant.upsertEntityVector(oldFormatEntity).then(() => {
      console.log('[createEntity] ✓ Qdrant sync successful for entity:', oldFormatEntity.id);
    }).catch(err => {
      console.error('[createEntity] ✗ Qdrant sync failed for entity:', oldFormatEntity.id);
      console.error('[createEntity] Qdrant error details:', {
        message: err.message,
        code: err.code,
        name: err.name,
        stack: err.stack?.split('\n').slice(0, 3).join('\n'),
      });
      console.error('[createEntity] Entity data:', {
        id: oldFormatEntity.id,
        name: oldFormatEntity.name,
        uniqueId: oldFormatEntity.uniqueId,
        type: oldFormatEntity.type,
      });
      // TODO: 添加到失败队列进行重试
    });

    // 4. 清除相关缓存
    await redis.deleteCachePattern("entities:list:*").catch(() => {});
    await redis.deleteCachePattern("graph:*").catch(() => {});
    
    console.log('[createEntity] Entity creation completed:', oldFormatEntity.id);
  }

  return entity ? mapNewToOld(entity) : null;
}

export async function getEntityById(id: number): Promise<DocumindEntity | undefined> {
  // 1. 尝试从缓存获取
  const cacheKey = redis.CacheKeys.entity(id);
  const cached = await redis.getCache<DocumindEntity>(cacheKey).catch(() => null);
  
  if (cached) {
    console.log(`[Cache] Hit for entity: ${id}`);
    return cached;
  }

  // 2. 从数据库获取
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(documindEntities)
    .where(and(
      eq(documindEntities.id, id),
      sql`${documindEntities.deletedAt} IS NULL`
    ))
    .limit(1);
  
  const entity = result[0];

  // 3. 写入缓存
  if (entity) {
    await redis.setCache(cacheKey, entity, redis.CacheTTL.ENTITY).catch(() => {});
  }

  return entity;
}

export async function updateEntity(id: number, data: any) {
  console.log('[updateEntity] Starting entity update:', {
    id,
    fields: Object.keys(data),
  });
  
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 转换旧格式到新格式
  const newData = mapOldToNew(data);
  console.log('[updateEntity] Converted to new format:', newData);

  // 1. 更新MySQL
  await db
    .update(documindEntities)
    .set(newData)
    .where(eq(documindEntities.id, id));
  console.log('[updateEntity] Updated in MySQL');
  
  const entity = await getEntityById(id);

  if (entity) {
    const oldFormatEntity = mapNewToOld(entity);
    console.log('[updateEntity] Converted back to old format:', {
      id: oldFormatEntity.id,
      name: oldFormatEntity.name,
      uniqueId: oldFormatEntity.uniqueId,
    });
    
    // 2. 同步到Neo4j（异步，不阻塞）
    console.log('[updateEntity] Syncing to Neo4j...');
    neo4j.updateEntityNode(id, oldFormatEntity).then(() => {
      console.log('[updateEntity] ✓ Neo4j sync successful for entity:', id);
    }).catch(err => {
      console.error('[updateEntity] ✗ Neo4j sync failed for entity:', id);
      console.error('[updateEntity] Neo4j error details:', {
        message: err.message,
        code: err.code,
        name: err.name,
        stack: err.stack?.split('\n').slice(0, 3).join('\n'),
      });
      console.error('[updateEntity] Entity data:', {
        id: oldFormatEntity.id,
        name: oldFormatEntity.name,
        uniqueId: oldFormatEntity.uniqueId,
      });
    });

    // 3. 更新Qdrant向量（异步，不阻塞）
    console.log('[updateEntity] Syncing to Qdrant...');
    qdrant.upsertEntityVector(oldFormatEntity).then(() => {
      console.log('[updateEntity] ✓ Qdrant sync successful for entity:', id);
    }).catch(err => {
      console.error('[updateEntity] ✗ Qdrant sync failed for entity:', id);
      console.error('[updateEntity] Qdrant error details:', {
        message: err.message,
        code: err.code,
        name: err.name,
        stack: err.stack?.split('\n').slice(0, 3).join('\n'),
      });
      console.error('[updateEntity] Entity data:', {
        id: oldFormatEntity.id,
        name: oldFormatEntity.name,
        uniqueId: oldFormatEntity.uniqueId,
      });
    });

    // 4. 清除缓存
    await redis.deleteCache(redis.CacheKeys.entity(id)).catch(() => {});
    await redis.deleteCachePattern("entities:list:*").catch(() => {});
    await redis.deleteCachePattern("graph:*").catch(() => {});
    
    console.log('[updateEntity] Entity update completed:', id);
  }

  return entity ? mapNewToOld(entity) : null;
}

export async function deleteEntity(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 1. 软删除MySQL中的实体
  await db
    .update(documindEntities)
    .set({ deletedAt: new Date() })
    .where(eq(documindEntities.id, id));

  // 2. 删除Neo4j节点（异步，不阻塞）
  neo4j.deleteEntityNode(id).catch(err => {
    console.error("[Neo4j] Failed to delete entity:", err);
  });

  // 3. 删除Qdrant向量（异步，不阻塞）
  qdrant.deleteEntityVector(id).catch(err => {
    console.error("[Qdrant] Failed to delete vector:", err);
  });

  // 4. 清除缓存
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
}): Promise<{
  items: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const { search = "", page = 1, limit = 10, sortBy = "updatedAt", order = "desc" } = params;

  // 1. 尝试从缓存获取
  const cacheKey = redis.CacheKeys.entitiesList(search, page, limit, sortBy, order);
  const cached = await redis.getCache<{
    items: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>(cacheKey).catch(() => null);

  if (cached) {
    console.log(`[Cache] Hit for entities list`);
    return cached;
  }

  // 2. 从数据库获取
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 构建查询条件
  const conditions = [sql`${documindEntities.deletedAt} IS NULL`];
  if (search) {
    conditions.push(like(documindEntities.title, `%${search}%`));
  }

  let query = db
    .select()
    .from(documindEntities)
    .where(and(...conditions));

  // 排序
  const orderColumn = sortBy === "name" ? documindEntities.title : documindEntities.updatedAt;
  query = (order === "asc" ? query.orderBy(orderColumn) : query.orderBy(desc(orderColumn))) as any;

  // 分页
  const offset = (page - 1) * limit;
  const items = await query.limit(limit).offset(offset);

  // 获取总数
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(documindEntities)
    .where(
      and(
        sql`${documindEntities.deletedAt} IS NULL`,
        search ? like(documindEntities.title, `%${search}%`) : undefined
      )
    );

  const total = Number(countResult[0]?.count || 0);

  const result = {
    items: items.map(mapNewToOld),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };

  // 3. 写入缓存
  await redis.setCache(cacheKey, result, redis.CacheTTL.LIST).catch(() => {});

  return result;
}

// ========== Relationship Management ==========

export async function createRelationship(data: {
  sourceId: number;
  targetId: number;
  type: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 获取源实体和目标实体的entityId
  const sourceEntity = await getEntityById(data.sourceId);
  const targetEntity = await getEntityById(data.targetId);

  if (!sourceEntity || !targetEntity) {
    throw new Error("Source or target entity not found");
  }

  const relationshipData: InsertDocumindRelationship = {
    relationshipId: `rel-${nanoid()}`,
    sourceId: sourceEntity.entityId, // 新表中的entityId字段
    targetId: targetEntity.entityId, // 新表中的entityId字段
    relationshipType: data.type,
    metadata: null,
  };

  // 1. 创建关系到MySQL
  await db.insert(documindRelationships).values(relationshipData);

  // 2. 同步到Neo4j（异步，不阻塞）
  // Neo4j需要完整的关系对象，但我们这里只有简单的数据
  // 暂时跳过Neo4j同步，或者需要修改neo4j.createRelationship的签名
  // neo4j.createRelationship(...).catch(err => {
  //   console.error("[Neo4j] Failed to create relationship:", err);
  // });

  // 3. 清除缓存
  await redis.deleteCachePattern("graph:*").catch(() => {});
}

export async function getEntityRelationships(entityId: number): Promise<{
  outgoing: DocumindRelationship[];
  incoming: DocumindRelationship[];
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const entity = await getEntityById(entityId);
  if (!entity) {
    throw new Error("Entity not found");
  }

  // 获取出站关系
  const outgoing = await db
    .select()
    .from(documindRelationships)
    .where(eq(documindRelationships.sourceId, entity.entityId));

  // 获取入站关系
  const incoming = await db
    .select()
    .from(documindRelationships)
    .where(eq(documindRelationships.targetId, entity.entityId));

  return {
    outgoing,
    incoming,
  };
}

// ========== Vector Search ==========

export async function searchEntitiesByVector(query: string, limit: number = 10) {
  try {
    // 1. 使用Qdrant进行向量搜索
    const vectorResults = await qdrant.searchSimilarEntities(query, limit);
    
    if (!vectorResults || vectorResults.length === 0) {
      return [];
    }

    // 2. 从数据库获取完整实体信息
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const entityIds = vectorResults.map(r => r.entityId);
    const entities = await db
      .select()
      .from(documindEntities)
      .where(
        and(
          sql`${documindEntities.id} IN (${sql.join(entityIds.map(id => sql`${id}`), sql`, `)})`,
          sql`${documindEntities.deletedAt} IS NULL`
        )
      );

    // 3. 合并向量搜索分数
    const entitiesWithScore = entities.map(entity => {
      const vectorResult = vectorResults.find(r => r.entityId === entity.id);
      return {
        ...mapNewToOld(entity),
        score: vectorResult?.score || 0,
      };
    });

    // 4. 按分数排序
    return entitiesWithScore.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error("[Search] Vector search failed:", error);
    // 降级到普通搜索
    const result = await getEntities({ search: query, limit });
    return result.items;
  }
}

// ========== Graph Data ==========

export async function getGraphData(filters?: {
  types?: string[];
  statuses?: string[];
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 构建查询条件
  const conditions = [sql`${documindEntities.deletedAt} IS NULL`];
  
  if (filters?.types && filters.types.length > 0) {
    const typesLower = filters.types.map(t => t.toLowerCase());
    conditions.push(sql`${documindEntities.type} IN (${sql.join(typesLower.map(t => sql`${t}`), sql`, `)})`);
  }

  if (filters?.statuses && filters.statuses.length > 0) {
    const statusesLower = filters.statuses.map(s => s.toLowerCase());
    conditions.push(sql`${documindEntities.status} IN (${sql.join(statusesLower.map(s => sql`${s}`), sql`, `)})`);
  }

  let query = db
    .select()
    .from(documindEntities)
    .where(and(...conditions));

  const entities = await query;

  // 获取所有关系
  const relationships = await db.select().from(documindRelationships);

  return {
    nodes: entities.map(mapNewToOld),
    edges: relationships,
  };
}
