# DocuMind API 实现文档

## 概述

本文档描述了为 DocuMind v4.0 实现的 REST API 接口。

## 已实现的功能

### P0 (核心功能) ✅

1. **POST /api/entities** - 创建实体
2. **GET /api/entities/:id** - 获取实体详情
3. **GET /api/entities** - 查询实体列表
4. **GET /api/health** - 健康检查

### P1 (高优先级) ✅

5. **POST /api/entities/batch** - 批量创建实体
6. **PUT /api/entities/:id** - 完整更新实体
7. **PATCH /api/entities/:id** - 部分更新实体
8. **POST /api/relationships** - 创建关系
9. **GET /api/entities/:id/relationships** - 查询实体关系

### P2 (中优先级) ✅

10. **GET /api/search** - 全文搜索
11. **DELETE /api/entities/:id** - 删除实体
12. **GET /api/stats** - 统计信息
13. **POST /api/entities/import/csv** - CSV 导入
14. **DELETE /api/relationships/:id** - 删除关系

## 技术架构

### 文件结构

```
backend/
├── server/
│   ├── api/
│   │   ├── routes/              # 路由层
│   │   │   ├── entities.ts      # 实体路由
│   │   │   ├── relationships.ts # 关系路由
│   │   │   ├── entityRelationships.ts
│   │   │   ├── search.ts        # 搜索路由
│   │   │   ├── stats.ts         # 统计路由
│   │   │   ├── health.ts        # 健康检查
│   │   │   └── import.ts        # CSV导入
│   │   ├── services/            # 服务层
│   │   │   ├── entityService.ts
│   │   │   ├── relationshipService.ts
│   │   │   ├── statsService.ts
│   │   │   └── importService.ts
│   │   ├── middleware/          # 中间件
│   │   │   └── errorHandler.ts
│   │   ├── utils/               # 工具函数
│   │   │   └── response.ts
│   │   └── index.ts             # API入口
│   └── _core/
│       └── index.ts             # 服务器入口（已集成REST API）
├── drizzle/
│   ├── schema_documind.ts       # DocuMind数据模型
│   └── 0002_documind_entities.sql # 迁移脚本
└── ...
```

### 数据模型

#### documind_entities 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 自增主键 |
| entityId | varchar(255) | 实体ID（外部使用） |
| type | varchar(50) | 实体类型 |
| title | varchar(500) | 标题 |
| status | varchar(50) | 状态 |
| documentUrl | varchar(1000) | Lark文档URL |
| metadata | text | 元数据（JSON） |
| createdAt | timestamp | 创建时间 |
| updatedAt | timestamp | 更新时间 |
| deletedAt | timestamp | 删除时间（软删除） |

#### documind_relationships 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 自增主键 |
| relationshipId | varchar(255) | 关系ID |
| sourceId | varchar(255) | 源实体ID |
| targetId | varchar(255) | 目标实体ID |
| relationshipType | varchar(50) | 关系类型 |
| metadata | text | 元数据（JSON） |
| createdAt | timestamp | 创建时间 |

## 部署步骤

### 1. 数据库迁移

执行 SQL 迁移脚本创建新表：

```bash
# 连接到数据库并执行
mysql -u <username> -p <database> < drizzle/0002_documind_entities.sql
```

或者使用 Railway 的数据库管理界面执行 SQL。

### 2. 环境变量

确保以下环境变量已配置：

```env
DATABASE_URL=mysql://...
CORS_ORIGIN=*  # 或指定允许的域名
```

### 3. 安装依赖并启动

```bash
cd backend
pnpm install
pnpm dev  # 开发模式
# 或
pnpm build && pnpm start  # 生产模式
```

### 4. 验证部署

访问健康检查接口：

```bash
curl https://documind-backend-production.up.railway.app/health
```

预期响应：

```json
{
  "status": "ok",
  "timestamp": "2025-12-10T08:00:00Z",
  "services": {
    "database": "ok",
    "neo4j": "not_implemented"
  }
}
```

## API 使用示例

### 创建实体

```bash
curl -X POST https://documind-backend-production.up.railway.app/api/entities \
  -H "Content-Type: application/json" \
  -d '{
    "id": "entity-test123",
    "type": "document",
    "title": "测试文档",
    "status": "active",
    "documentUrl": "https://larksuite.com/docx/xxx",
    "metadata": {
      "author": "AI Agent",
      "tags": ["test"]
    }
  }'
```

### 查询实体列表

```bash
curl "https://documind-backend-production.up.railway.app/api/entities?type=document&page=1&page_size=10"
```

### 搜索实体

```bash
curl "https://documind-backend-production.up.railway.app/api/search?q=投注&page=1&page_size=10"
```

### CSV 导入

```bash
curl -X POST https://documind-backend-production.up.railway.app/api/entities/import/csv \
  -H "Content-Type: application/json" \
  -d '{
    "csvData": [
      {
        "entity_title": "文档1",
        "lark_doc_url": "https://larksuite.com/docx/xxx",
        "migration_status": "Success"
      }
    ]
  }'
```

## 响应格式

### 成功响应

```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

### 错误响应

```json
{
  "code": 400,
  "message": "Invalid request parameters",
  "error": "INVALID_PARAMETERS",
  "details": { ... }
}
```

## 注意事项

1. **CORS 配置**: 已配置为允许所有来源，生产环境建议设置 `CORS_ORIGIN` 环境变量
2. **软删除**: 删除实体默认使用软删除，可通过 `soft_delete=false` 参数强制硬删除
3. **metadata 字段**: 支持任意 JSON 对象，灵活存储不同类型的元数据
4. **分页**: 默认每页 20 条，最大 100 条
5. **搜索**: 当前实现为简单的标题匹配，后续可集成 Qdrant 向量搜索

## 后续优化建议

1. **认证授权**: 添加 JWT 或 API Key 认证
2. **向量搜索**: 集成 Qdrant 实现语义搜索
3. **Neo4j 集成**: 同步实体和关系到 Neo4j 图数据库
4. **Redis 缓存**: 添加缓存层提升性能
5. **批量操作优化**: 使用事务和批量插入提升性能
6. **CSV 解析增强**: 支持更复杂的 CSV 格式和字段映射
7. **API 文档**: 生成 OpenAPI/Swagger 文档
