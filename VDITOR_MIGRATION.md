# Vditor 编辑器集成说明

## 概述

本次改动将 documind 项目中所有实体的内嵌飞书文档替换为 Vditor 编辑器（所见即所得模式），同时保留飞书文档 URL 作为外部跳转链接。

## 主要改动

### 1. 新增组件

#### VditorEditor.tsx
位置：`backend/client/src/components/VditorEditor.tsx`

Vditor 编辑器封装组件，特性包括：
- 使用 **wysiwyg 模式**（所见即所得）实现最直观的编辑体验
- 支持完整的 Markdown 语法
- 内置工具栏：标题、加粗、斜体、链接、列表、代码块、表格等
- 支持实时预览和大纲导航
- 支持 Ctrl+Enter 快捷保存
- 支持全屏编辑模式
- 中文界面

#### EntityContentEditor.tsx
位置：`backend/client/src/components/EntityContentEditor.tsx`

实体内容编辑对话框组件，特性包括：
- 弹窗式编辑界面，默认宽度 1400px，高度 70vh
- 显示实体名称和编辑状态
- 未保存更改提示
- 全屏/窗口模式切换
- 飞书文档外部跳转按钮
- 保存和取消操作

### 2. 页面修改

#### Entities.tsx（实体列表页）
- **移除**：iframe 内嵌飞书文档预览
- **新增**：「编辑内容」按钮，点击打开 Vditor 编辑器
- **修改**：飞书文档按钮改为外部跳转（在新标签页打开）

#### EntityForm.tsx（实体编辑页）
- **新增**：「编辑内容」按钮和内容编辑器对话框
- **保留**：飞书文档链接输入框和外部跳转链接
- **新增**：显示内容字符数统计

#### Graph.tsx（知识图谱页）
- **新增**：右键菜单，包含「编辑文档」、「查看详情」、「编辑实体」、「删除实体」选项
- **新增**：侧边栏「编辑文档」按钮
- **新增**：内容编辑器对话框集成

### 3. 数据库改动

#### Schema 修改
文件：`backend/drizzle/schema_documind.ts`

在 `documind_entities` 表中新增 `content` 字段：
```sql
content TEXT  -- 存储 Markdown 内容
```

#### 迁移文件
文件：`backend/drizzle/0005_add_content_field.sql`

```sql
ALTER TABLE `documind_entities` ADD COLUMN `content` TEXT;
```

### 4. 后端 API 改动

#### db.ts
- `mapOldToNew` 函数：添加 `content` 字段映射
- `mapNewToOld` 函数：添加 `content` 字段映射

#### routers.ts
- `entities.update` API：添加 `content` 字段支持

## 使用说明

### 编辑实体内容

1. 在实体列表页面，点击实体行的「编辑内容」按钮
2. 在弹出的编辑器对话框中编辑 Markdown 内容
3. 点击「保存」按钮或按 Ctrl+Enter 保存
4. 点击「取消」或关闭对话框退出编辑

### 查看飞书文档

1. 在实体列表页面，点击「飞书文档」按钮
2. 文档将在新标签页中打开

### 在实体编辑页使用

1. 进入实体编辑页面
2. 在「实体内容 (Markdown)」区域点击「编辑内容」按钮
3. 编辑完成后保存
4. 最后点击「保存更改」提交表单

## 依赖

新增依赖：
```json
{
  "vditor": "^3.11.2"
}
```

## 注意事项

1. **数据库迁移**：部署前需要执行数据库迁移脚本添加 `content` 字段
2. **权限控制**：只有管理员用户可以编辑内容
3. **飞书文档**：原有的飞书文档 URL 保持不变，仍可通过外部链接访问
4. **内容存储**：Markdown 内容存储在数据库的 `content` 字段中

## 文件清单

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| `backend/client/src/components/VditorEditor.tsx` | 新增 | Vditor 编辑器组件 |
| `backend/client/src/components/EntityContentEditor.tsx` | 新增 | 内容编辑对话框组件 |
| `backend/client/src/pages/Entities.tsx` | 修改 | 移除 iframe，添加编辑按钮 |
| `backend/client/src/pages/EntityForm.tsx` | 修改 | 添加内容编辑功能 |
| `backend/drizzle/schema_documind.ts` | 修改 | 添加 content 字段 |
| `backend/drizzle/0005_add_content_field.sql` | 新增 | 数据库迁移脚本 |
| `backend/server/db.ts` | 修改 | 添加 content 字段映射 |
| `backend/server/routers.ts` | 修改 | API 支持 content 字段 |
| `backend/package.json` | 修改 | 添加 vditor 依赖 |
