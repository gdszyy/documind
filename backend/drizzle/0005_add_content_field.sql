-- 添加 content 字段到 documind_entities 表
-- 用于存储 Vditor 编辑器的 Markdown 内容

ALTER TABLE `documind_entities` ADD COLUMN `content` TEXT;
