import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { entities, entityRelationships, InsertEntity, InsertEntityRelationship, InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

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

  const result = await db.insert(entities).values(data);
  const insertedId = Number(result[0].insertId);
  
  return getEntityById(insertedId);
}

export async function getEntityById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(entities).where(eq(entities.id, id)).limit(1);
  return result[0];
}

export async function updateEntity(id: number, data: Partial<InsertEntity>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(entities).set(data).where(eq(entities.id, id));
  return getEntityById(id);
}

export async function deleteEntity(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 删除相关关系
  await db.delete(entityRelationships).where(
    or(
      eq(entityRelationships.sourceId, id),
      eq(entityRelationships.targetId, id)
    )
  );

  // 删除实体
  await db.delete(entities).where(eq(entities.id, id));
}

export async function getEntities(params: {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: "asc" | "desc";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { search, page = 1, limit = 10, sortBy = "updatedAt", order = "desc" } = params;

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

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// ========== Entity Relationships ==========

export async function createRelationship(data: InsertEntityRelationship) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(entityRelationships).values(data);
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

  return { nodes, edges };
}
