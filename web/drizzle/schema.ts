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
 * Documents table - stores metadata about markdown files
 */
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  /** File path relative to documind repo root */
  filePath: varchar("filePath", { length: 512 }).notNull().unique(),
  /** File name */
  fileName: varchar("fileName", { length: 255 }).notNull(),
  /** File content (markdown) */
  content: text("content"),
  /** Last modified timestamp */
  lastModified: timestamp("lastModified").defaultNow().notNull(),
  /** User who last modified */
  modifiedBy: int("modifiedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;
