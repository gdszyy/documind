import { getDb } from "../../db";
import { documindEntities, documindRelationships, linkerReferences, linkerUserSettings } from "../../../drizzle/schema_documind";
import { eq, and, like, isNull, desc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import type {
  LinkerSearchParams,
  LinkerSearchResult,
  LinkerEntityDetail,
  LinkerReference,
  CreateLinkerReferenceRequest,
  LinkerUserSettings,
} from "../types/linker";

/**
 * 搜索实体（结合引用热度排序）
 */
export async function searchEntities(params: LinkerSearchParams): Promise<LinkerSearchResult[]> {
  const { q, type, status = "active", limit = 10 } = params;
  
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 构建查询条件
  const conditions = [
    like(documindEntities.title, `%${q}%`),
    eq(documindEntities.status, status),
    isNull(documindEntities.deletedAt),
  ];

  if (type) {
    conditions.push(eq(documindEntities.type, type));
  }

  // 查询实体并左连接引用记录以统计引用次数
  const results = await db
    .select({
      entityId: documindEntities.entityId,
      type: documindEntities.type,
      title: documindEntities.title,
      status: documindEntities.status,
      documentUrl: documindEntities.documentUrl,
      metadata: documindEntities.metadata,
      updatedAt: documindEntities.updatedAt,
      referenceCount: sql<number>`COUNT(${linkerReferences.id})`.as('referenceCount'),
    })
    .from(documindEntities)
    .leftJoin(linkerReferences, eq(documindEntities.entityId, linkerReferences.entityId))
    .where(and(...conditions))
    .groupBy(documindEntities.id)
    .orderBy(desc(sql`referenceCount`), desc(documindEntities.updatedAt))
    .limit(limit);

  return results.map(row => ({
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
  }));
}

/**
 * 获取实体详情（包含关系和引用统计）
 */
export async function getEntityDetail(entityId: string): Promise<LinkerEntityDetail | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // 1. 查询实体基础信息
  const entity = await db
    .select()
    .from(documindEntities)
    .where(and(
      eq(documindEntities.entityId, entityId),
      isNull(documindEntities.deletedAt)
    ))
    .limit(1);

  if (entity.length === 0) {
    return null;
  }

  const entityData = entity[0];

  // 2. 查询出站关系（该实体作为 source）
  const outboundRelationships = await db
    .select({
      relationshipId: documindRelationships.relationshipId,
      relationshipType: documindRelationships.relationshipType,
      targetEntityId: documindEntities.entityId,
      targetTitle: documindEntities.title,
      targetType: documindEntities.type,
    })
    .from(documindRelationships)
    .leftJoin(documindEntities, eq(documindRelationships.targetId, documindEntities.entityId))
    .where(eq(documindRelationships.sourceId, entityId));

  // 3. 查询入站关系（该实体作为 target）
  const inboundRelationships = await db
    .select({
      relationshipId: documindRelationships.relationshipId,
      relationshipType: documindRelationships.relationshipType,
      sourceEntityId: documindEntities.entityId,
      sourceTitle: documindEntities.title,
      sourceType: documindEntities.type,
    })
    .from(documindRelationships)
    .leftJoin(documindEntities, eq(documindRelationships.sourceId, documindEntities.entityId))
    .where(eq(documindRelationships.targetId, entityId));

  // 4. 统计引用次数
  const referenceCountResult = await db
    .select({
      count: sql<number>`COUNT(*)`.as('count'),
    })
    .from(linkerReferences)
    .where(eq(linkerReferences.entityId, entityId));

  const referenceCount = referenceCountResult[0]?.count || 0;

  // 5. 组装返回数据
  return {
    entity: {
      entityId: entityData.entityId,
      type: entityData.type,
      title: entityData.title,
      status: entityData.status,
      documentUrl: entityData.documentUrl,
      metadata: entityData.metadata ? JSON.parse(entityData.metadata) : null,
      createdAt: entityData.createdAt,
      updatedAt: entityData.updatedAt,
    },
    relationships: {
      outbound: outboundRelationships.map(r => ({
        relationshipId: r.relationshipId,
        relationshipType: r.relationshipType,
        target: r.targetEntityId ? {
          entityId: r.targetEntityId,
          title: r.targetTitle!,
          type: r.targetType!,
        } : undefined,
      })),
      inbound: inboundRelationships.map(r => ({
        relationshipId: r.relationshipId,
        relationshipType: r.relationshipType,
        source: r.sourceEntityId ? {
          entityId: r.sourceEntityId,
          title: r.sourceTitle!,
          type: r.sourceType!,
        } : undefined,
      })),
    },
    referenceCount,
  };
}

/**
 * 获取实体的引用记录
 */
export async function getEntityReferences(
  entityId: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ total: number; references: LinkerReference[] }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // 统计总数
  const totalResult = await db
    .select({
      count: sql<number>`COUNT(*)`.as('count'),
    })
    .from(linkerReferences)
    .where(eq(linkerReferences.entityId, entityId));

  const total = totalResult[0]?.count || 0;

  // 查询引用记录
  const references = await db
    .select()
    .from(linkerReferences)
    .where(eq(linkerReferences.entityId, entityId))
    .orderBy(desc(linkerReferences.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    total,
    references,
  };
}

/**
 * 创建引用记录
 */
export async function createReference(data: CreateLinkerReferenceRequest): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const referenceId = `ref-${nanoid(20)}`;

  await db.insert(linkerReferences).values({
    referenceId,
    entityId: data.entityId,
    documentId: data.documentId,
    documentUrl: data.documentUrl || null,
    documentTitle: data.documentTitle || null,
    contextSnippet: data.contextSnippet || null,
    userId: data.userId || null,
  });

  return referenceId;
}

/**
 * 删除引用记录
 */
export async function deleteReference(referenceId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .delete(linkerReferences)
    .where(eq(linkerReferences.referenceId, referenceId));

  return true; // 如果没有抛异常，则认为删除成功
}

/**
 * 获取用户配置
 */
export async function getUserSettings(userId: string): Promise<LinkerUserSettings | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const settings = await db
    .select()
    .from(linkerUserSettings)
    .where(eq(linkerUserSettings.userId, userId))
    .limit(1);

  if (settings.length === 0) {
    return null;
  }

  const settingsData = settings[0];

  // settings 字段是 text 类型，Drizzle 会自动返回字符串
  let parsedSettings = {};
  if (settingsData.settings) {
    try {
      parsedSettings = typeof settingsData.settings === 'string' 
        ? JSON.parse(settingsData.settings)
        : settingsData.settings;
    } catch (error) {
      console.error('[getUserSettings] Failed to parse settings:', error);
    }
  }
  
  return {
    userId: settingsData.userId,
    settings: parsedSettings,
    updatedAt: settingsData.updatedAt,
  };
}

/**
 * 保存用户配置
 */
export async function saveUserSettings(userId: string, settings: any): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const settingsJson = JSON.stringify(settings);

  // 使用 INSERT ... ON DUPLICATE KEY UPDATE
  await db
    .insert(linkerUserSettings)
    .values({
      userId,
      settings: settingsJson,
    })
    .onDuplicateKeyUpdate({
      set: { settings: settingsJson },
    });
}
