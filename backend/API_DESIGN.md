# DocuMind API 设计文档

## 架构设计

### 技术栈
- **框架**: Express.js (REST API)
- **数据库**: MySQL (主存储) + Neo4j (图关系) + Qdrant (向量搜索) + Redis (缓存)
- **ORM**: Drizzle ORM
- **验证**: Zod
- **类型**: TypeScript

### API 层次结构

```
/api
├── /entities          # 实体管理
├── /relationships     # 关系管理
├── /search           # 搜索功能
├── /stats            # 统计信息
└── /health           # 健康检查
```

## 数据模型设计

### 1. Entity Schema 修改

需要修改现有的 `entities` 表以支持灵活的 metadata：

```typescript
export const entities = mysqlTable("entities", {
  id: int("id").autoincrement().primaryKey(),
  // 使用字符串ID以支持自定义ID格式（如 entity-HJKxdRCI8olHgBxAKsYjOkfJpPf）
  entityId: varchar("entityId", { length: 255 }).notNull().unique(),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  documentUrl: varchar("documentUrl", { length: 1000 }),
  // 使用 JSON 字段存储灵活的 metadata
  metadata: text("metadata"), // 存储 JSON 字符串
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  deletedAt: timestamp("deletedAt"), // 软删除支持
});
```

### 2. Relationship Schema 修改

```typescript
export const entityRelationships = mysqlTable("entity_relationships", {
  id: int("id").autoincrement().primaryKey(),
  relationshipId: varchar("relationshipId", { length: 255 }).notNull().unique(),
  sourceId: varchar("sourceId", { length: 255 }).notNull(),
  targetId: varchar("targetId", { length: 255 }).notNull(),
  relationshipType: varchar("relationshipType", { length: 50 }).notNull(),
  metadata: text("metadata"), // JSON 字符串
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
```

## API 接口设计

### 响应格式标准

**成功响应：**
```typescript
{
  code: 0,
  message: "success",
  data: T
}
```

**错误响应：**
```typescript
{
  code: number,
  message: string,
  error: string,
  details?: any
}
```

### 错误码映射

| HTTP状态码 | code | 说明 |
|-----------|------|------|
| 200 | 0 | 成功 |
| 400 | 400 | 请求参数错误 |
| 401 | 401 | 未授权 |
| 403 | 403 | 禁止访问 |
| 404 | 404 | 资源不存在 |
| 409 | 409 | 资源冲突 |
| 500 | 500 | 服务器内部错误 |

## 实现计划

### Phase 1: 数据库迁移
1. 创建新的 schema 文件
2. 生成迁移脚本
3. 执行数据库迁移

### Phase 2: 核心服务层
1. 创建 REST API 路由器
2. 实现实体管理服务
3. 实现关系管理服务
4. 实现搜索服务

### Phase 3: 中间件和工具
1. 错误处理中间件
2. 请求验证中间件
3. CORS 配置
4. 响应格式化工具

### Phase 4: 高级功能
1. 批量操作
2. CSV 导入
3. 统计信息
4. 健康检查

## 文件结构

```
backend/
├── server/
│   ├── api/                    # 新增 REST API
│   │   ├── routes/
│   │   │   ├── entities.ts     # 实体路由
│   │   │   ├── relationships.ts # 关系路由
│   │   │   ├── search.ts       # 搜索路由
│   │   │   ├── stats.ts        # 统计路由
│   │   │   └── health.ts       # 健康检查
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts
│   │   │   ├── validator.ts
│   │   │   └── cors.ts
│   │   ├── services/
│   │   │   ├── entityService.ts
│   │   │   ├── relationshipService.ts
│   │   │   └── searchService.ts
│   │   ├── utils/
│   │   │   ├── response.ts
│   │   │   └── validation.ts
│   │   └── index.ts            # API 路由入口
│   └── ...
├── drizzle/
│   ├── schema_v2.ts            # 新的 schema
│   └── migrations/
└── ...
```

## 优先级

### P0 (必须实现)
- [x] 数据模型设计
- [ ] POST /api/entities
- [ ] GET /api/entities/:id
- [ ] GET /api/entities
- [ ] GET /api/health

### P1 (高优先级)
- [ ] POST /api/entities/batch
- [ ] PUT/PATCH /api/entities/:id
- [ ] POST /api/relationships
- [ ] GET /api/entities/:id/relationships

### P2 (中优先级)
- [ ] GET /api/search
- [ ] DELETE /api/entities/:id
- [ ] GET /api/stats
- [ ] POST /api/entities/import/csv
