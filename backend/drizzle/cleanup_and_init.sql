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

-- 4. 创建 Linker 表
CREATE TABLE IF NOT EXISTS `linker_references` (
  `id` int AUTO_INCREMENT NOT NULL,
  `referenceId` varchar(255) NOT NULL,
  `entityId` varchar(255) NOT NULL,
  `documentId` varchar(255) NOT NULL,
  `documentUrl` varchar(1000),
  `documentTitle` varchar(500),
  `contextSnippet` text,
  `userId` varchar(255),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `linker_references_id` PRIMARY KEY(`id`),
  CONSTRAINT `linker_references_referenceId_unique` UNIQUE(`referenceId`),
  INDEX `idx_ref_entityId` (`entityId`),
  INDEX `idx_ref_documentId` (`documentId`),
  INDEX `idx_ref_userId` (`userId`)
);

CREATE TABLE IF NOT EXISTS `linker_user_settings` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` varchar(255) NOT NULL,
  `settings` text,
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `linker_user_settings_id` PRIMARY KEY(`id`),
  CONSTRAINT `linker_user_settings_userId_unique` UNIQUE(`userId`),
  INDEX `idx_setting_userId` (`userId`)
);

-- 5. 验证所有表
SHOW TABLES;
