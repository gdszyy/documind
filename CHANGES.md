# 实体删除功能实现说明

## 修改概述

在documind项目的三个页面中添加了实体删除按钮和功能：

1. **实体列表页** (Entities.tsx)
2. **实体编辑页** (EntityForm.tsx)
3. **知识图谱详情页** (Graph.tsx)

## 详细修改

### 1. 实体列表页 (backend/client/src/pages/Entities.tsx)

**新增功能：**
- 在表格的操作列中添加了删除按钮（垃圾桶图标）
- 点击删除按钮会弹出确认对话框
- 确认后调用 tRPC 的 `entities.delete` mutation 删除实体
- 删除成功后自动刷新列表并显示成功提示

**UI改进：**
- 删除按钮使用红色主题，与编辑按钮并排显示
- 使用 AlertDialog 组件确保用户不会误删

### 2. 实体编辑页 (backend/client/src/pages/EntityForm.tsx)

**新增功能：**
- 在编辑模式下，页面底部左侧显示"删除实体"按钮
- 点击按钮弹出确认对话框
- 确认删除后跳转回实体列表页
- 创建模式下不显示删除按钮

**UI改进：**
- 按钮布局调整为左右分布（删除按钮在左，保存/取消在右）
- 删除按钮使用红色边框和文字，视觉上与其他操作区分

### 3. 知识图谱详情页 (backend/client/src/pages/Graph.tsx)

**新增功能：**
- 在侧边栏实体详情面板中添加"删除实体"按钮
- 删除按钮位于"在 DocuMind 中编辑"按钮下方
- 删除成功后关闭侧边栏并刷新图谱数据

**UI改进：**
- 按钮全宽显示，与其他操作按钮保持一致
- 使用红色主题突出警示性

## 技术实现

### 使用的组件和库

- **AlertDialog**: shadcn/ui 的对话框组件，用于删除确认
- **toast**: sonner 库，用于显示成功/失败提示
- **tRPC mutation**: `entities.delete`，后端已有的删除API
- **Trash2 图标**: lucide-react 图标库

### 状态管理

- 使用 `useState` 管理待删除实体的 ID
- 使用 tRPC 的 `useMutation` 处理删除操作
- 删除成功后调用 `invalidate()` 刷新相关查询缓存

### 错误处理

- 删除失败时通过 toast 显示错误信息
- 删除过程中按钮显示 loading 状态并禁用

## 文件修改清单

```
backend/client/src/pages/Entities.tsx
backend/client/src/pages/EntityForm.tsx
backend/client/src/pages/Graph.tsx
```

## 后端支持

后端已有完整的删除API支持：
- tRPC路由: `entities.delete` (backend/server/routers.ts)
- 数据库操作: `db.deleteEntity()` (backend/server/db.ts)

无需修改后端代码，前端可直接调用现有API。
