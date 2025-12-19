import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

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
  
  // Markdown 内容（使用 Vditor 编辑器编辑）
  content: text("content"),
  
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

/**
 * Linker 引用记录表 - 记录实体在外部文档中的引用行为
 */
export const linkerReferences = mysqlTable("linker_references", {
  // 自增主键
  id: int("id").autoincrement().primaryKey(),
  
  // 引用记录ID
  referenceId: varchar("referenceId", { length: 255 }).notNull().unique(),
  
  // 被引用的实体ID（关联 documind_entities.entityId）
  entityId: varchar("entityId", { length: 255 }).notNull(),
  
  // 外部文档信息
  documentId: varchar("documentId", { length: 255 }).notNull(),
  documentUrl: varchar("documentUrl", { length: 1000 }),
  documentTitle: varchar("documentTitle", { length: 500 }),
  
  // 引用上下文片段
  contextSnippet: text("contextSnippet"),
  
  // 用户信息（关联 users.openId）
  userId: varchar("userId", { length: 255 }),
  
  // 时间戳
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LinkerReference = typeof linkerReferences.$inferSelect;
export type InsertLinkerReference = typeof linkerReferences.$inferInsert;

/**
 * Linker 用户配置表 - 存储用户个性化设置
 */
export const linkerUserSettings = mysqlTable("linker_user_settings", {
  // 自增主键
  id: int("id").autoincrement().primaryKey(),
  
  // 用户ID（关联 users.openId）
  userId: varchar("userId", { length: 255 }).notNull().unique(),
  
  // JSON格式的配置数据
  settings: text("settings"),
  
  // 时间戳
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LinkerUserSettings = typeof linkerUserSettings.$inferSelect;
export type InsertLinkerUserSettings = typeof linkerUserSettings.$inferInsert;
