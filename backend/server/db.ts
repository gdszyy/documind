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
 * 将前端的type值映射为数据库存储的值
 */
function mapTypeToDatabase(frontendType: string): string {
  const typeMapping: Record<string, string> = {
    'Service': 'service',
    'API': 'api',
    'Component': 'component',
    'Page': 'page',
    'Module': 'module',
    'Documentation': 'documentation',
    'Document': 'document',
  };
  
  return typeMapping[frontendType] || frontendType.toLowerCase();
}

/**
 * 将前端的status值映射为数据库存储的值
 */
function mapStatusToDatabase(frontendStatus: string): string {
  const statusMapping: Record<string, string> = {
    'Development': 'draft',
    'Testing': 'testing',
    'Production': 'active',
    'Deprecated': 'archived',
  };
  
  return statusMapping[frontendStatus] || frontendStatus.toLowerCase();
}

/**
 * 旧表字段到新表字段的映射
 * 将前端/tRPC使用的旧格式转换为新的数据库格式
 * 注意：此函数用于创建和更新操作，更新时只应包含需要更新的字段
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
  content?: string;
}, isUpdate: boolean = false): Partial<InsertDocumindEntity> {
  const metadata: Record<string, any> = {};
  
  // 将扩展字段放入metadata（只添加有值的字段）
  if (oldData.owner !== undefined) metadata.owner = oldData.owner;
  if (oldData.description !== undefined) metadata.description = oldData.description;
  if (oldData.httpMethod !== undefined) metadata.httpMethod = oldData.httpMethod;
  if (oldData.apiPath !== undefined) metadata.apiPath = oldData.apiPath;

  const result: Partial<InsertDocumindEntity> = {};
  
  // 对于更新操作，只添加明确传入的字段
  // 对于创建操作，使用默认值
  if (oldData.uniqueId !== undefined) {
    result.entityId = oldData.uniqueId;
  } else if (!isUpdate) {
    result.entityId = `entity-${nanoid()}`;
  }
  
  if (oldData.type !== undefined) {
    result.type = mapTypeToDatabase(oldData.type);
  } else if (!isUpdate) {
    result.type = 'service';
  }
  
  if (oldData.name !== undefined) {
    result.title = oldData.name;
  } else if (!isUpdate) {
    result.title = 'Untitled';
    console.warn('[mapOldToNew] Missing required field: name, using default "Untitled"');
  }
  
  if (oldData.status !== undefined) {
    result.status = mapStatusToDatabase(oldData.status);
  } else if (!isUpdate) {
    result.status = 'active';
  }
  
  // 只在字段明确传入且有值时才添加，避免插入 undefined 导致数据库错误
  if (oldData.larkDocUrl !== undefined) {
    result.documentUrl = oldData.larkDocUrl || null;
  }
  
  // 添加 content 字段映射（仅在明确传入且有值时）
  // 注意：不要在创建时包含 content 字段，除非明确提供了值
  if (oldData.content !== undefined && oldData.content !== null) {
    result.content = oldData.content;
  }
  
  if (Object.keys(metadata).length > 0) {
    result.metadata = JSON.stringify(metadata);
  }
  
  console.log('[mapOldToNew] Mapping:', {
    isUpdate,
    input: { name: oldData.name, uniqueId: oldData.uniqueId, type: oldData.type, larkDocUrl: oldData.larkDocUrl },
    output: result,
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
    type: mapTypeToFrontend(newEntity.type),
    owner: metadata.owner || 'Unknown',
    status: mapStatusToFrontend(newEntity.status),
    description: metadata.description || null,
    httpMethod: metadata.httpMethod || null,
    apiPath: metadata.apiPath || null,
    larkDocUrl: newEntity.documentUrl,
    content: newEntity.content || null, // Markdown 内容
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

/**
 * 将数据库的type值映射为前端期望的枚举值
 */
function mapTypeToFrontend(dbType: string): string {
  const typeMapping: Record<string, string> = {
    'service': 'Service',
    'api': 'API',
    'component': 'Component',
    'page': 'Page',
    'module': 'Module',
    'documentation': 'Documentation',
    'document': 'Document',
  };
  
  const lowerType = dbType.toLowerCase();
  return typeMapping[lowerType] || 'Service'; // 默认为 Service
}

/**
 * 将数据库的status值映射为前端期望的枚举值
 */
function mapStatusToFrontend(dbStatus: string): string {
  const statusMapping: Record<string, string> = {
    'active': 'Production',      // active 映射为 Production
    'draft': 'Development',      // draft 映射为 Development
    'planned': 'Development',    // planned 映射为 Development
    'archived': 'Deprecated',    // archived 映射为 Deprecated
    'development': 'Development',
    'testing': 'Testing',
    'production': 'Production',
    'deprecated': 'Deprecated',
  };
  
  const lowerStatus = dbStatus.toLowerCase();
  return statusMapping[lowerStatus] || 'Development'; // 默认为 Development
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
    // entity 已经是转换后的旧格式，直接使用
    const oldFormatEntity = entity;
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

  return entity; // entity 已经是转换后的旧格式
}

export async function getEntityById(id: number): Promise<any | undefined> {
  // 1. 尝试从缓存获取
  const cacheKey = redis.CacheKeys.entity(id);
  const cached = await redis.getCache<any>(cacheKey).catch(() => null);
  
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

  // 转换为前端期望的旧格式
  const oldFormatEntity = entity ? mapNewToOld(entity) : undefined;

  // 3. 写入缓存（缓存转换后的格式）
  if (oldFormatEntity) {
    await redis.setCache(cacheKey, oldFormatEntity, redis.CacheTTL.ENTITY).catch(() => {});
  }

  return oldFormatEntity;
}

export async function updateEntity(id: number, data: any) {
  console.log('[updateEntity] Starting entity update:', {
    id,
    fields: Object.keys(data),
  });
  
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 转换旧格式到新格式（更新模式，只包含需要更新的字段）
  const newData = mapOldToNew(data, true);
  console.log('[updateEntity] Converted to new format:', newData);

  // 1. 更新MySQL
  await db
    .update(documindEntities)
    .set(newData)
    .where(eq(documindEntities.id, id));
  console.log('[updateEntity] Updated in MySQL');
  
  const entity = await getEntityById(id);

  if (entity) {
    // entity 已经是转换后的旧格式，直接使用
    const oldFormatEntity = entity;
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

  return entity; // entity 已经是转换后的旧格式
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
  type?: string;
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
  const { search = "", type, page = 1, limit = 10, sortBy = "updatedAt", order = "desc" } = params;

  // 1. 尝试从缓存获取
  const cacheKey = redis.CacheKeys.entitiesList(search, page, limit, sortBy, order) + (type ? `:type:${type}` : "");
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
  if (type) {
    const typeDb = mapTypeToDatabase(type);
    conditions.push(sql`${documindEntities.type} = ${typeDb}`);
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
  const countConditions = [
    sql`${documindEntities.deletedAt} IS NULL`,
    search ? like(documindEntities.title, `%${search}%`) : undefined,
    type ? sql`${documindEntities.type} = ${mapTypeToDatabase(type)}` : undefined,
  ].filter(Boolean);
  
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(documindEntities)
    .where(and(...countConditions));

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
    sourceId: sourceEntity.uniqueId, // 使用转换后的uniqueId字段
    targetId: targetEntity.uniqueId, // 使用转换后的uniqueId字段
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
  outgoing: Array<{
    id: number;
    relationshipId: string;
    type: string;
    targetId: string;
    targetEntity: {
      id: number;
      name: string;
      uniqueId: string;
      type: string;
    } | null;
  }>;
  incoming: Array<{
    id: number;
    relationshipId: string;
    type: string;
    sourceId: string;
    sourceEntity: {
      id: number;
      name: string;
      uniqueId: string;
      type: string;
    } | null;
  }>;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const entity = await getEntityById(entityId);
  if (!entity) {
    throw new Error("Entity not found");
  }

  // 获取出站关系（带目标实体信息）
  const outgoingResults = await db
    .select({
      relationship: documindRelationships,
      target: documindEntities,
    })
    .from(documindRelationships)
    .leftJoin(
      documindEntities,
      eq(documindRelationships.targetId, documindEntities.entityId)
    )
    .where(eq(documindRelationships.sourceId, entity.uniqueId));

  const outgoing = outgoingResults.map((r) => ({
    id: r.relationship.id,
    relationshipId: r.relationship.relationshipId,
    type: r.relationship.relationshipType,
    targetId: r.relationship.targetId,
    targetEntity: r.target
      ? {
          id: r.target.id,
          name: r.target.title,
          uniqueId: r.target.entityId,
          type: mapTypeToFrontend(r.target.type),
        }
      : null,
  }));

  // 获取入站关系（带源实体信息）
  const incomingResults = await db
    .select({
      relationship: documindRelationships,
      source: documindEntities,
    })
    .from(documindRelationships)
    .leftJoin(
      documindEntities,
      eq(documindRelationships.sourceId, documindEntities.entityId)
    )
    .where(eq(documindRelationships.targetId, entity.uniqueId));

  const incoming = incomingResults.map((r) => ({
    id: r.relationship.id,
    relationshipId: r.relationship.relationshipId,
    type: r.relationship.relationshipType,
    sourceId: r.relationship.sourceId,
    sourceEntity: r.source
      ? {
          id: r.source.id,
          name: r.source.title,
          uniqueId: r.source.entityId,
          type: mapTypeToFrontend(r.source.type),
        }
      : null,
  }));

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
    // 使用正确的类型映射
    const typesDb = filters.types.map(t => mapTypeToDatabase(t));
    conditions.push(sql`${documindEntities.type} IN (${sql.join(typesDb.map(t => sql`${t}`), sql`, `)})`);
  }

  if (filters?.statuses && filters.statuses.length > 0) {
    // 使用正确的状态映射
    // 注意：Development 需要包括 draft 和 planned 两种状态
    const statusesDb: string[] = [];
    filters.statuses.forEach(s => {
      if (s === 'Development') {
        statusesDb.push('draft', 'planned');
      } else {
        statusesDb.push(mapStatusToDatabase(s));
      }
    });
    // 去重
    const uniqueStatuses = [...new Set(statusesDb)];
    conditions.push(sql`${documindEntities.status} IN (${sql.join(uniqueStatuses.map(s => sql`${s}`), sql`, `)})`);
  }

  let query = db
    .select()
    .from(documindEntities)
    .where(and(...conditions));

  const entities = await query;
  const entitiesOldFormat = entities.map(mapNewToOld);

  // 获取所有实体（不应用过滤条件），用于关系映射
  // 这样可以确保关系的源和目标实体都能被找到
  const allEntities = await db.select().from(documindEntities)
    .where(sql`${documindEntities.deletedAt} IS NULL`);
  const allEntitiesOldFormat = allEntities.map(mapNewToOld);
  
  // 调试：输出实体的uniqueId格式
  console.log('[getGraphData] Total entities:', allEntitiesOldFormat.length);
  if (allEntitiesOldFormat.length > 0) {
    console.log('[getGraphData] Sample entity uniqueIds:', allEntitiesOldFormat.slice(0, 3).map(e => e.uniqueId));
    // 输出所有uniqueId以便调试
    const allUniqueIds = allEntitiesOldFormat.map(e => e.uniqueId);
    console.log('[getGraphData] All uniqueIds:', JSON.stringify(allUniqueIds));
  }

  // 获取所有关系
  const relationships = await db.select().from(documindRelationships);
  console.log('[getGraphData] Total relationships from DB:', relationships.length);
  
  // 调试：输出前几个关系数据
  if (relationships.length > 0) {
    console.log('[getGraphData] Sample relationship:', relationships[0]);
  }

  // 将关系数据转换为前端期望的格式
  // 数据库存储的是 entityId (字符串)，前端期望的是数字 id
  const edgesWithNumericIds = relationships.map(rel => {
    // 从所有实体中查找，而不是只从过滤后的实体中查找
    // 注意：数据库中的entityId格式不一致，有些是'entity-xxx'，有些是短名称
    // 所以直接用uniqueId匹配即可
    const sourceEntity = allEntitiesOldFormat.find(e => e.uniqueId === rel.sourceId);
    const targetEntity = allEntitiesOldFormat.find(e => e.uniqueId === rel.targetId);
    
    // 调试：记录找不到的实体
    if (!sourceEntity) {
      console.warn('[getGraphData] Source entity not found for sourceId:', rel.sourceId);
    }
    if (!targetEntity) {
      console.warn('[getGraphData] Target entity not found for targetId:', rel.targetId);
    }
    
    return {
      sourceId: sourceEntity?.id,
      targetId: targetEntity?.id,
      type: rel.relationshipType,
    };
  }).filter(edge => edge.sourceId && edge.targetId);
  
  console.log('[getGraphData] Edges after numeric ID conversion:', edgesWithNumericIds.length);

  // 只返回源和目标都在当前过滤实体中的边
  // ReactFlow要求边的源和目标节点都必须存在才能显示连线
  const filteredEntityIds = new Set(entitiesOldFormat.map(e => e.id));
  const filteredEdges = edgesWithNumericIds.filter(edge => 
    filteredEntityIds.has(edge.sourceId) && filteredEntityIds.has(edge.targetId)
  );
  
  console.log('[getGraphData] Filtered nodes count:', entitiesOldFormat.length);
  console.log('[getGraphData] Filtered edges count:', filteredEdges.length);
  console.log('[getGraphData] Sample filtered node IDs:', Array.from(filteredEntityIds).slice(0, 5));
  if (filteredEdges.length > 0) {
    console.log('[getGraphData] Sample filtered edge:', filteredEdges[0]);
  }

  return {
    nodes: entitiesOldFormat,
    edges: filteredEdges,
  };
}

export async function deleteRelationship(relationshipId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 验证关系是否存在
  const existing = await db
    .select()
    .from(documindRelationships)
    .where(eq(documindRelationships.id, relationshipId))
    .limit(1);

  if (existing.length === 0) {
    throw new Error("Relationship not found");
  }

  // 删除关系
  await db
    .delete(documindRelationships)
    .where(eq(documindRelationships.id, relationshipId));

  // 清除缓存
  await redis.deleteCachePattern("graph:*").catch(() => {});
}
