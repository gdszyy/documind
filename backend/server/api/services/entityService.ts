import { and, desc, eq, like, or, sql, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { documindEntities, InsertDocumindEntity } from "../../../drizzle/schema_documind";
import { nanoid } from "nanoid";
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
 * 生成实体ID
 */
function generateEntityId(): string {
  return `entity-${nanoid(20)}`;
}

/**
 * 解析metadata（从JSON字符串到对象）
 */
function parseMetadata(metadataStr: string | null): Record<string, any> | null {
  if (!metadataStr) return null;
  try {
    return JSON.parse(metadataStr);
  } catch {
    return null;
  }
}

/**
 * 序列化metadata（从对象到JSON字符串）
 */
function serializeMetadata(metadata: Record<string, any> | null | undefined): string | null {
  if (!metadata) return null;
  return JSON.stringify(metadata);
}

/**
 * 格式化实体（添加解析后的metadata）
 */
function formatEntity(entity: any) {
  return {
    ...entity,
    metadata: parseMetadata(entity.metadata),
  };
}

/**
 * 创建实体
 */
export async function createEntity(data: {
  id?: string;
  type: string;
  title: string;
  status?: string;
  documentUrl?: string;
  metadata?: Record<string, any>;
}) {
  const db = await getDb();

  const entityId = data.id || generateEntityId();

  // 检查是否已存在
  const existing = await db
    .select()
    .from(documindEntities)
    .where(eq(documindEntities.entityId, entityId))
    .limit(1);

  if (existing.length > 0) {
    throw new ApiError(409, "Entity already exists", "DUPLICATE_ENTITY");
  }

  const insertData: InsertDocumindEntity = {
    entityId,
    type: data.type,
    title: data.title,
    status: data.status || "active",
    documentUrl: data.documentUrl || null,
    metadata: serializeMetadata(data.metadata),
  };

  await db.insert(documindEntities).values(insertData);

  const entity = await getEntityById(entityId);
  return entity;
}

/**
 * 批量创建实体
 */
export async function batchCreateEntities(entities: Array<{
  id?: string;
  type: string;
  title: string;
  status?: string;
  documentUrl?: string;
  metadata?: Record<string, any>;
}>) {
  const results: Array<{ id: string; status: string; error?: string }> = [];
  let successCount = 0;
  let failedCount = 0;

  for (const entityData of entities) {
    try {
      const entity = await createEntity(entityData);
      results.push({
        id: entity!.entityId,
        status: "created",
      });
      successCount++;
    } catch (error: any) {
      results.push({
        id: entityData.id || "unknown",
        status: "failed",
        error: error.message,
      });
      failedCount++;
    }
  }

  return {
    success_count: successCount,
    failed_count: failedCount,
    results,
  };
}

/**
 * 获取实体详情
 */
export async function getEntityById(entityId: string) {
  const db = await getDb();

  const result = await db
    .select()
    .from(documindEntities)
    .where(
      and(
        eq(documindEntities.entityId, entityId),
        isNull(documindEntities.deletedAt)
      )
    )
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  return formatEntity(result[0]);
}

/**
 * 更新实体
 */
export async function updateEntity(
  entityId: string,
  data: {
    type?: string;
    title?: string;
    status?: string;
    documentUrl?: string;
    metadata?: Record<string, any>;
  }
) {
  const db = await getDb();

  // 检查实体是否存在
  const existing = await getEntityById(entityId);
  if (!existing) {
    throw new ApiError(404, "Entity not found", "NOT_FOUND");
  }

  const updateData: any = {};
  if (data.type !== undefined) updateData.type = data.type;
  if (data.title !== undefined) updateData.title = data.title;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.documentUrl !== undefined) updateData.documentUrl = data.documentUrl;
  if (data.metadata !== undefined) {
    updateData.metadata = serializeMetadata(data.metadata);
  }

  await db
    .update(documindEntities)
    .set(updateData)
    .where(eq(documindEntities.entityId, entityId));

  return getEntityById(entityId);
}

/**
 * 部分更新实体（PATCH）
 */
export async function patchEntity(
  entityId: string,
  data: {
    status?: string;
    metadata?: Record<string, any>;
  }
) {
  const db = await getDb();

  const existing = await getEntityById(entityId);
  if (!existing) {
    throw new ApiError(404, "Entity not found", "NOT_FOUND");
  }

  const updateData: any = {};
  if (data.status !== undefined) updateData.status = data.status;
  
  // PATCH 时，metadata 需要合并而不是替换
  if (data.metadata !== undefined) {
    const currentMetadata = existing.metadata || {};
    const mergedMetadata = { ...currentMetadata, ...data.metadata };
    updateData.metadata = serializeMetadata(mergedMetadata);
  }

  await db
    .update(documindEntities)
    .set(updateData)
    .where(eq(documindEntities.entityId, entityId));

  return getEntityById(entityId);
}

/**
 * 删除实体
 */
export async function deleteEntity(entityId: string, softDelete: boolean = true) {
  const db = await getDb();

  const existing = await getEntityById(entityId);
  if (!existing) {
    throw new ApiError(404, "Entity not found", "NOT_FOUND");
  }

  if (softDelete) {
    // 软删除
    await db
      .update(documindEntities)
      .set({ deletedAt: new Date() })
      .where(eq(documindEntities.entityId, entityId));
  } else {
    // 硬删除
    await db
      .delete(documindEntities)
      .where(eq(documindEntities.entityId, entityId));
  }

  return {
    id: entityId,
    deleted_at: new Date().toISOString(),
  };
}

/**
 * 查询实体列表
 */
export async function getEntities(params: {
  type?: string;
  status?: string;
  category?: string;
  tags?: string;
  search?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}) {
  const db = await getDb();

  const {
    type,
    status,
    category,
    tags,
    search,
    page = 1,
    page_size = 20,
    sort_by = "created_at",
    sort_order = "desc",
  } = params;

  // 构建过滤条件
  const conditions = [isNull(documindEntities.deletedAt)];
  
  if (type) {
    conditions.push(eq(documindEntities.type, type));
  }
  
  if (status) {
    conditions.push(eq(documindEntities.status, status));
  }
  
  if (search) {
    conditions.push(like(documindEntities.title, `%${search}%`));
  }
  
  let query = db.select().from(documindEntities).where(and(...conditions));

  // TODO: category 和 tags 需要在 metadata 中搜索，这里暂时简化处理

  // 排序
  const orderColumn =
    sort_by === "title"
      ? documindEntities.title
      : sort_by === "updated_at"
      ? documindEntities.updatedAt
      : documindEntities.createdAt;

  query = query.orderBy(sort_order === "asc" ? orderColumn : desc(orderColumn)) as any;

  // 分页
  const offset = (page - 1) * page_size;
  const items = await query.limit(page_size).offset(offset);

  // 获取总数
  const countQuery = db
    .select({ count: sql<number>`count(*)` })
    .from(documindEntities)
    .where(isNull(documindEntities.deletedAt));

  const countResult = await countQuery;
  const total = Number(countResult[0]?.count || 0);

  return {
    total,
    page,
    page_size,
    total_pages: Math.ceil(total / page_size),
    items: items.map(formatEntity),
  };
}

/**
 * 搜索实体（全文搜索）
 */
export async function searchEntities(params: {
  q: string;
  type?: string;
  category?: string;
  page?: number;
  page_size?: number;
}) {
  const { q, type, category, page = 1, page_size = 10 } = params;

  const db = await getDb();

  const conditions = [
    isNull(documindEntities.deletedAt),
    like(documindEntities.title, `%${q}%`)
  ];
  
  if (type) {
    conditions.push(eq(documindEntities.type, type));
  }
  
  let query = db
    .select()
    .from(documindEntities)
    .where(and(...conditions));

  const offset = (page - 1) * page_size;
  const results = await query.limit(page_size).offset(offset);

  // 获取总数
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(documindEntities)
    .where(
      and(
        isNull(documindEntities.deletedAt),
        like(documindEntities.title, `%${q}%`)
      )
    );

  const total = Number(countResult[0]?.count || 0);

  return {
    query: q,
    total,
    page,
    page_size,
    results: results.map((item) => ({
      ...formatEntity(item),
      relevance_score: 0.8, // 简化处理，实际应该计算相关性分数
      highlight: item.title,
    })),
  };
}
