CREATE TABLE `entities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`uniqueId` varchar(255) NOT NULL,
	`type` enum('Service','API','Component','Page') NOT NULL,
	`owner` varchar(255) NOT NULL,
	`status` enum('Development','Testing','Production','Deprecated') NOT NULL,
	`description` text,
	`httpMethod` enum('GET','POST','PUT','DELETE','PATCH'),
	`apiPath` varchar(500),
	`larkDocUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `entities_id` PRIMARY KEY(`id`),
	CONSTRAINT `entities_uniqueId_unique` UNIQUE(`uniqueId`)
);
--> statement-breakpoint
CREATE TABLE `entity_relationships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceId` int NOT NULL,
	`targetId` int NOT NULL,
	`type` enum('EXPOSES_API','DEPENDS_ON','USES_COMPONENT','CONTAINS') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `entity_relationships_id` PRIMARY KEY(`id`)
);
