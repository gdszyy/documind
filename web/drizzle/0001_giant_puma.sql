CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`filePath` varchar(512) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`content` text,
	`lastModified` timestamp NOT NULL DEFAULT (now()),
	`modifiedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`),
	CONSTRAINT `documents_filePath_unique` UNIQUE(`filePath`)
);
