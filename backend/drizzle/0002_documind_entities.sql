-- DocuMind 实体表
CREATE TABLE IF NOT EXISTS `documind_entities` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `entityId` varchar(255) NOT NULL UNIQUE,
  `type` varchar(50) NOT NULL,
  `title` varchar(500) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'active',
  `documentUrl` varchar(1000),
  `metadata` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deletedAt` timestamp NULL,
  INDEX `idx_entityId` (`entityId`),
  INDEX `idx_type` (`type`),
  INDEX `idx_status` (`status`),
  INDEX `idx_deletedAt` (`deletedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DocuMind 关系表
CREATE TABLE IF NOT EXISTS `documind_relationships` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `relationshipId` varchar(255) NOT NULL UNIQUE,
  `sourceId` varchar(255) NOT NULL,
  `targetId` varchar(255) NOT NULL,
  `relationshipType` varchar(50) NOT NULL,
  `metadata` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_relationshipId` (`relationshipId`),
  INDEX `idx_sourceId` (`sourceId`),
  INDEX `idx_targetId` (`targetId`),
  INDEX `idx_relationshipType` (`relationshipType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
