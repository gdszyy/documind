-- Linker 引用记录表
CREATE TABLE IF NOT EXISTS `linker_references` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `referenceId` varchar(255) NOT NULL UNIQUE,
  `entityId` varchar(255) NOT NULL,
  `documentId` varchar(255) NOT NULL,
  `documentUrl` varchar(1000),
  `documentTitle` varchar(500),
  `contextSnippet` text,
  `userId` varchar(255),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_ref_entityId` (`entityId`),
  INDEX `idx_ref_documentId` (`documentId`),
  INDEX `idx_ref_userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Linker 用户配置表
CREATE TABLE IF NOT EXISTS `linker_user_settings` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` varchar(255) NOT NULL UNIQUE,
  `settings` text,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_setting_userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
