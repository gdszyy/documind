-- DocuMind 实体表
CREATE TABLE IF NOT EXISTS `documind_entities` (
  `id` int AUTO_INCREMENT NOT NULL,
  `entityId` varchar(255) NOT NULL,
  `type` varchar(100) NOT NULL,
  `title` varchar(500) NOT NULL,
  `status` varchar(100) NOT NULL DEFAULT 'active',
  `documentUrl` varchar(1000),
  `metadata` json,
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

-- DocuMind 关系表
CREATE TABLE IF NOT EXISTS `documind_relationships` (
  `id` int AUTO_INCREMENT NOT NULL,
  `relationshipId` varchar(255) NOT NULL,
  `sourceId` varchar(255) NOT NULL,
  `targetId` varchar(255) NOT NULL,
  `relationshipType` varchar(100) NOT NULL,
  `metadata` json,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `documind_relationships_id` PRIMARY KEY(`id`),
  CONSTRAINT `documind_relationships_relationshipId_unique` UNIQUE(`relationshipId`),
  INDEX `idx_sourceId` (`sourceId`),
  INDEX `idx_targetId` (`targetId`),
  INDEX `idx_relationshipType` (`relationshipType`)
);
