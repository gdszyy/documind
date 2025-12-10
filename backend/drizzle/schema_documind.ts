import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json } from "drizzle-orm/mysql-core";

/**
 * DocuMind 实体表 - 存储文档实体
 * 支持灵活的 metadata 字段以适应不同类型的文档
 */
export const documindEntities = mysqlTable("documind_entities", {
  // 自增主键（内部使用）
  id: int("id").autoincrement().primaryKey(),
  
  // 实体ID（外部使用，如 entity-HJKxdRCI8olHgBxAKsYjOkfJpPf）
  entityId: varchar("entityId", { length: 255 }).notNull().unique(),
  
  // 实体类型（document, module, api, component, page, service等）
  type: varchar("type", { length: 50 }).notNull(),
  
  // 标题
  title: varchar("title", { length: 500 }).notNull(),
  
  // 状态（active, draft, archived等）
  status: varchar("status", { length: 50 }).notNull().default("active"),
  
  // Lark文档URL
  documentUrl: varchar("documentUrl", { length: 1000 }),
  
  // 元数据（灵活的JSON对象）
  // 可以包含：author, created_at, tags, category, version等任意字段
  metadata: text("metadata"),
  
  // 时间戳
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  
  // 软删除支持
  deletedAt: timestamp("deletedAt"),
});

export type DocumindEntity = typeof documindEntities.$inferSelect;
export type InsertDocumindEntity = typeof documindEntities.$inferInsert;

/**
 * DocuMind 关系表 - 存储实体之间的关系
 */
export const documindRelationships = mysqlTable("documind_relationships", {
  // 自增主键
  id: int("id").autoincrement().primaryKey(),
  
  // 关系ID（外部使用）
  relationshipId: varchar("relationshipId", { length: 255 }).notNull().unique(),
  
  // 源实体ID
  sourceId: varchar("sourceId", { length: 255 }).notNull(),
  
  // 目标实体ID
  targetId: varchar("targetId", { length: 255 }).notNull(),
  
  // 关系类型（CONTAINS, DEPENDS_ON, REFERENCES, IMPLEMENTS, RELATED_TO）
  relationshipType: varchar("relationshipType", { length: 50 }).notNull(),
  
  // 关系元数据（灵活的JSON对象）
  metadata: text("metadata"),
  
  // 时间戳
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DocumindRelationship = typeof documindRelationships.$inferSelect;
export type InsertDocumindRelationship = typeof documindRelationships.$inferInsert;
