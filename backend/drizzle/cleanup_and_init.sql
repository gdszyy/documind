-- 清理旧表并初始化新表
-- 警告：此脚本会删除旧表及其数据！

-- 1. 删除旧表（如果存在）
DROP TABLE IF EXISTS `entity_relationships`;
DROP TABLE IF EXISTS `entities`;

-- 2. 创建新表（如果不存在）
CREATE TABLE IF NOT EXISTS `documind_entities` (
  `id` int AUTO_INCREMENT NOT NULL,
  `entityId` varchar(255) NOT NULL,
  `type` varchar(50) NOT NULL,
  `title` varchar(500) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'active',
  `documentUrl` varchar(1000),
  `metadata` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `deletedAt` timestamp,
  CONSTRAINT `documind_entities_id` PRIMARY KEY(`id`),
  CONSTRAINT `documind_entities_entityId_unique` UNIQUE(`entityId`),
  INDEX `idx_type` (`type`),
  INDEX `idx_status` (`status`),
  INDEX `idx_deletedAt` (`deletedAt`),
  INDEX `idx_createdAt` (`createdAt`)
);

CREATE TABLE IF NOT EXISTS `documind_relationships` (
  `id` int AUTO_INCREMENT NOT NULL,
  `relationshipId` varchar(255) NOT NULL,
  `sourceId` varchar(255) NOT NULL,
  `targetId` varchar(255) NOT NULL,
  `relationshipType` varchar(50) NOT NULL,
  `metadata` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `documind_relationships_id` PRIMARY KEY(`id`),
  CONSTRAINT `documind_relationships_relationshipId_unique` UNIQUE(`relationshipId`),
  INDEX `idx_sourceId` (`sourceId`),
  INDEX `idx_targetId` (`targetId`),
  INDEX `idx_relationshipType` (`relationshipType`)
);

-- 3. 验证表结构
SHOW TABLES LIKE 'documind%';
