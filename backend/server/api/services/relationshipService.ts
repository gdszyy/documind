import { and, desc, eq, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { documindRelationships, InsertDocumindRelationship, documindEntities } from "../../../drizzle/schema_documind";
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
 * 生成关系ID
 */
function generateRelationshipId(): string {
  return `rel-${nanoid(20)}`;
}

/**
 * 解析metadata
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
 * 序列化metadata
 */
function serializeMetadata(metadata: Record<string, any> | null | undefined): string | null {
  if (!metadata) return null;
  return JSON.stringify(metadata);
}

/**
 * 格式化关系
 */
function formatRelationship(relationship: any) {
  return {
    ...relationship,
    metadata: parseMetadata(relationship.metadata),
  };
}

/**
 * 创建关系
 */
export async function createRelationship(data: {
  source_id: string;
  target_id: string;
  relationship_type: string;
  metadata?: Record<string, any>;
}) {
  const db = await getDb();

  // 验证源实体和目标实体是否存在
  const sourceEntity = await db
    .select()
    .from(documindEntities)
    .where(eq(documindEntities.entityId, data.source_id))
    .limit(1);

  const targetEntity = await db
    .select()
    .from(documindEntities)
    .where(eq(documindEntities.entityId, data.target_id))
    .limit(1);

  if (sourceEntity.length === 0) {
    throw new ApiError(404, "Source entity not found", "SOURCE_NOT_FOUND");
  }

  if (targetEntity.length === 0) {
    throw new ApiError(404, "Target entity not found", "TARGET_NOT_FOUND");
  }

  const relationshipId = generateRelationshipId();

  const insertData: InsertDocumindRelationship = {
    relationshipId,
    sourceId: data.source_id,
    targetId: data.target_id,
    relationshipType: data.relationship_type,
    metadata: serializeMetadata(data.metadata),
  };

  await db.insert(documindRelationships).values(insertData);

  const relationship = await db
    .select()
    .from(documindRelationships)
    .where(eq(documindRelationships.relationshipId, relationshipId))
    .limit(1);

  return formatRelationship(relationship[0]);
}

/**
 * 查询实体的关系
 */
export async function getEntityRelationships(
  entityId: string,
  params?: {
    type?: string;
    direction?: "outgoing" | "incoming" | "both";
  }
) {
  const db = await getDb();
  const { type, direction = "both" } = params || {};

  // 验证实体是否存在
  const entity = await db
    .select()
    .from(documindEntities)
    .where(eq(documindEntities.entityId, entityId))
    .limit(1);

  if (entity.length === 0) {
    throw new ApiError(404, "Entity not found", "NOT_FOUND");
  }

  const outgoing: any[] = [];
  const incoming: any[] = [];

  // 查询出站关系
  if (direction === "outgoing" || direction === "both") {
    const outgoingConditions = [eq(documindRelationships.sourceId, entityId)];
    if (type) {
      outgoingConditions.push(eq(documindRelationships.relationshipType, type));
    }
    
    let outgoingQuery = db
      .select({
        relationship: documindRelationships,
        target: documindEntities,
      })
      .from(documindRelationships)
      .leftJoin(
        documindEntities,
        eq(documindRelationships.targetId, documindEntities.entityId)
      )
      .where(and(...outgoingConditions));

    const outgoingResults = await outgoingQuery;

    outgoing.push(
      ...outgoingResults.map((r) => ({
        relationship_id: r.relationship.relationshipId,
        type: r.relationship.relationshipType,
        target: r.target
          ? {
              id: r.target.entityId,
              title: r.target.title,
              documentUrl: r.target.documentUrl,
            }
          : null,
      }))
    );
  }

  // 查询入站关系
  if (direction === "incoming" || direction === "both") {
    const incomingConditions = [eq(documindRelationships.targetId, entityId)];
    if (type) {
      incomingConditions.push(eq(documindRelationships.relationshipType, type));
    }
    
    let incomingQuery = db
      .select({
        relationship: documindRelationships,
        source: documindEntities,
      })
      .from(documindRelationships)
      .leftJoin(
        documindEntities,
        eq(documindRelationships.sourceId, documindEntities.entityId)
      )
      .where(and(...incomingConditions));

    const incomingResults = await incomingQuery;

    incoming.push(
      ...incomingResults.map((r) => ({
        relationship_id: r.relationship.relationshipId,
        type: r.relationship.relationshipType,
        source: r.source
          ? {
              id: r.source.entityId,
              title: r.source.title,
              documentUrl: r.source.documentUrl,
            }
          : null,
      }))
    );
  }

  return {
    entity_id: entityId,
    outgoing,
    incoming,
  };
}

/**
 * 删除关系
 */
export async function deleteRelationship(relationshipId: string) {
  const db = await getDb();

  const existing = await db
    .select()
    .from(documindRelationships)
    .where(eq(documindRelationships.relationshipId, relationshipId))
    .limit(1);

  if (existing.length === 0) {
    throw new ApiError(404, "Relationship not found", "NOT_FOUND");
  }

  await db
    .delete(documindRelationships)
    .where(eq(documindRelationships.relationshipId, relationshipId));

  return {
    id: relationshipId,
    deleted_at: new Date().toISOString(),
  };
}
