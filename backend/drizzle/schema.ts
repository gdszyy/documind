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
 * 实体表 - 存储服务、API、组件等技术实体
 */
export const entities = mysqlTable("entities", {
  id: int("id").autoincrement().primaryKey(),
  /** 实体名称 */
  name: varchar("name", { length: 255 }).notNull(),
  /** 唯一标识符 (kebab-case) */
  uniqueId: varchar("uniqueId", { length: 255 }).notNull().unique(),
  /** 实体类型 */
  type: mysqlEnum("type", ["Service", "API", "Component", "Page"]).notNull(),
  /** 负责人 */
  owner: varchar("owner", { length: 255 }).notNull(),
  /** 状态 */
  status: mysqlEnum("status", ["Development", "Testing", "Production", "Deprecated"]).notNull(),
  /** 描述 */
  description: text("description"),
  /** HTTP 方法 (仅 API 类型) */
  httpMethod: mysqlEnum("httpMethod", ["GET", "POST", "PUT", "DELETE", "PATCH"]),
  /** API 路径 (仅 API 类型) */
  apiPath: varchar("apiPath", { length: 500 }),
  /** 飞书文档链接 */
  larkDocUrl: varchar("larkDocUrl", { length: 500 }),
  /** 创建时间 */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  /** 更新时间 */
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Entity = typeof entities.$inferSelect;
export type InsertEntity = typeof entities.$inferInsert;

/**
 * 实体关系表 - 存储实体之间的关联关系
 */
export const entityRelationships = mysqlTable("entity_relationships", {
  id: int("id").autoincrement().primaryKey(),
  /** 源实体 ID */
  sourceId: int("sourceId").notNull(),
  /** 目标实体 ID */
  targetId: int("targetId").notNull(),
  /** 关系类型 */
  type: mysqlEnum("type", ["EXPOSES_API", "DEPENDS_ON", "USES_COMPONENT", "CONTAINS"]).notNull(),
  /** 创建时间 */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EntityRelationship = typeof entityRelationships.$inferSelect;
export type InsertEntityRelationship = typeof entityRelationships.$inferInsert;
