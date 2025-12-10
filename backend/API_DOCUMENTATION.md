# DocuMind API 接口文档

**版本**: v1.0  
**基础URL**: `https://documind-production.up.railway.app`  
**更新日期**: 2025-12-10

---

## 目录

- [概述](#概述)
- [认证](#认证)
- [响应格式](#响应格式)
- [错误码](#错误码)
- [接口列表](#接口列表)
  - [健康检查](#健康检查)
  - [实体管理](#实体管理)
  - [关系管理](#关系管理)
  - [搜索](#搜索)
  - [统计](#统计)
  - [数据库迁移](#数据库迁移)

---

## 概述

DocuMind API 提供了完整的实体和关系管理功能，支持创建、查询、更新、删除实体，以及管理实体之间的关系。

### 特性

- ✅ RESTful API 设计
- ✅ 统一的响应格式
- ✅ 完整的错误处理
- ✅ 分页查询支持
- ✅ 软删除机制
- ✅ 批量操作
- ✅ 全文搜索
- ✅ 灵活的 metadata 存储

---

## 认证

当前版本暂未实现认证机制。所有接口均可直接访问。

> ⚠️ **注意**: 生产环境建议添加 JWT 或 API Key 认证。

---

## 响应格式

### 成功响应

```json
{
  "code": 0,
  "message": "success",
  "data": {
    // 响应数据
  }
}
```

### 错误响应

```json
{
  "code": 400,
  "message": "Invalid request parameters",
  "error": "INVALID_PARAMETERS",
  "details": {
    // 错误详情（可选）
  }
}
```

---

## 错误码

| HTTP状态码 | code | error | 说明 |
|-----------|------|-------|------|
| 200 | 0 | - | 成功 |
| 400 | 400 | INVALID_PARAMETERS | 请求参数错误 |
| 404 | 404 | NOT_FOUND | 资源不存在 |
| 409 | 409 | DUPLICATE_ENTITY | 实体已存在 |
| 409 | 409 | CONFLICT | 资源冲突 |
| 500 | 500 | INTERNAL_ERROR | 服务器内部错误 |

---

## 接口列表

---

## 健康检查

### 检查服务状态

检查 API 服务和数据库连接状态。

**端点**: `GET /health`

**请求参数**: 无

**响应示例**:

```json
{
  "status": "ok",
  "timestamp": "2025-12-10T09:01:36.109Z",
  "services": {
    "database": "ok",
    "neo4j": "not_implemented"
  }
}
```

**字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| status | string | 服务状态：ok / error |
| timestamp | string | ISO 8601 时间戳 |
| services.database | string | 数据库状态：ok / error |
| services.neo4j | string | Neo4j 状态：ok / error / not_implemented |

---

## 实体管理

### 1. 创建实体

创建一个新的实体。

**端点**: `POST /api/entities`

**请求头**:
```
Content-Type: application/json
```

**请求体**:

```json
{
  "id": "entity-HJKxdRCI8olHgBxAKsYjOkfJpPf",
  "type": "document",
  "title": "投注交易模块完整清单",
  "status": "active",
  "documentUrl": "https://larksuite.com/docx/HJKxdRCI8olHgBxAKsYjOkfJpPf",
  "metadata": {
    "author": "张三",
    "tags": ["betting", "transaction"],
    "category": "modules",
    "version": "1.0"
  }
}
```

**字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 否 | 实体ID，不提供则自动生成 |
| type | string | 是 | 实体类型（document, module, api等） |
| title | string | 是 | 实体标题 |
| status | string | 否 | 状态，默认 active |
| documentUrl | string | 否 | Lark文档URL |
| metadata | object | 否 | 元数据（任意JSON对象） |

**响应示例**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "entityId": "entity-HJKxdRCI8olHgBxAKsYjOkfJpPf",
    "type": "document",
    "title": "投注交易模块完整清单",
    "status": "active",
    "documentUrl": "https://larksuite.com/docx/HJKxdRCI8olHgBxAKsYjOkfJpPf",
    "metadata": {
      "author": "张三",
      "tags": ["betting", "transaction"],
      "category": "modules",
      "version": "1.0"
    },
    "createdAt": "2025-12-10T09:02:52.000Z",
    "updatedAt": "2025-12-10T09:02:52.000Z",
    "deletedAt": null
  }
}
```

**错误响应**:

```json
{
  "code": 409,
  "message": "Entity already exists",
  "error": "DUPLICATE_ENTITY"
}
```

---

### 2. 批量创建实体

批量创建多个实体。

**端点**: `POST /api/entities/batch`

**请求头**:
```
Content-Type: application/json
```

**请求体**:

```json
{
  "entities": [
    {
      "id": "entity-001",
      "type": "module",
      "title": "用户管理模块",
      "status": "active"
    },
    {
      "id": "entity-002",
      "type": "api",
      "title": "用户登录API",
      "status": "active"
    }
  ]
}
```

**响应示例**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "success_count": 2,
    "failed_count": 0,
    "results": [
      {
        "id": "entity-001",
        "status": "created"
      },
      {
        "id": "entity-002",
        "status": "created"
      }
    ]
  }
}
```

**性能**: 使用批量插入，3个实体 < 500ms

---

### 3. 获取实体详情

根据ID获取实体的详细信息。

**端点**: `GET /api/entities/:entity_id`

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| entity_id | string | 实体ID |

**响应示例**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "entityId": "entity-HJKxdRCI8olHgBxAKsYjOkfJpPf",
    "type": "document",
    "title": "投注交易模块完整清单",
    "status": "active",
    "documentUrl": "https://larksuite.com/docx/HJKxdRCI8olHgBxAKsYjOkfJpPf",
    "metadata": {
      "author": "张三",
      "tags": ["betting", "transaction"],
      "category": "modules"
    },
    "createdAt": "2025-12-10T09:02:52.000Z",
    "updatedAt": "2025-12-10T09:02:52.000Z",
    "deletedAt": null
  }
}
```

**错误响应**:

```json
{
  "code": 404,
  "message": "Entity not found",
  "error": "NOT_FOUND"
}
```

---

### 4. 查询实体列表

查询实体列表，支持过滤、分页、排序。

**端点**: `GET /api/entities`

**查询参数**:

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| type | string | 否 | - | 实体类型过滤 |
| status | string | 否 | - | 状态过滤 |
| category | string | 否 | - | 分类过滤（metadata中） |
| tags | string | 否 | - | 标签过滤（逗号分隔） |
| search | string | 否 | - | 标题关键词搜索 |
| page | number | 否 | 1 | 页码 |
| page_size | number | 否 | 20 | 每页数量（1-100） |
| sort_by | string | 否 | created_at | 排序字段：created_at / updated_at / title |
| sort_order | string | 否 | desc | 排序方向：asc / desc |

**请求示例**:

```
GET /api/entities?type=document&status=active&page=1&page_size=20&sort_by=created_at&sort_order=desc
```

**响应示例**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 100,
    "page": 1,
    "page_size": 20,
    "total_pages": 5,
    "items": [
      {
        "id": 1,
        "entityId": "entity-HJKxdRCI8olHgBxAKsYjOkfJpPf",
        "type": "document",
        "title": "投注交易模块完整清单",
        "status": "active",
        "documentUrl": "https://larksuite.com/docx/HJKxdRCI8olHgBxAKsYjOkfJpPf",
        "metadata": {
          "author": "张三",
          "tags": ["betting", "transaction"]
        },
        "createdAt": "2025-12-10T09:02:52.000Z",
        "updatedAt": "2025-12-10T09:02:52.000Z",
        "deletedAt": null
      }
      // ... 更多实体
    ]
  }
}
```

---

### 5. 更新实体（完整更新）

完整更新实体的所有字段。

**端点**: `PUT /api/entities/:entity_id`

**请求头**:
```
Content-Type: application/json
```

**请求体**:

```json
{
  "type": "document",
  "title": "投注交易模块完整清单（已更新）",
  "status": "active",
  "documentUrl": "https://larksuite.com/docx/HJKxdRCI8olHgBxAKsYjOkfJpPf",
  "metadata": {
    "author": "李四",
    "tags": ["betting", "transaction", "updated"],
    "version": "2.0"
  }
}
```

**字段说明**: 所有字段必填（除 documentUrl 和 metadata）

**响应示例**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "entityId": "entity-HJKxdRCI8olHgBxAKsYjOkfJpPf",
    "type": "document",
    "title": "投注交易模块完整清单（已更新）",
    "status": "active",
    "documentUrl": "https://larksuite.com/docx/HJKxdRCI8olHgBxAKsYjOkfJpPf",
    "metadata": {
      "author": "李四",
      "tags": ["betting", "transaction", "updated"],
      "version": "2.0"
    },
    "createdAt": "2025-12-10T09:02:52.000Z",
    "updatedAt": "2025-12-10T09:15:30.000Z",
    "deletedAt": null
  }
}
```

---

### 6. 更新实体（部分更新）

部分更新实体的某些字段。

**端点**: `PATCH /api/entities/:entity_id`

**请求头**:
```
Content-Type: application/json
```

**请求体**:

```json
{
  "status": "archived",
  "metadata": {
    "author": "王五",
    "tags": ["betting", "transaction", "archived"]
  }
}
```

**字段说明**: 只需提供要更新的字段

**响应示例**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "entityId": "entity-HJKxdRCI8olHgBxAKsYjOkfJpPf",
    "type": "document",
    "title": "投注交易模块完整清单",
    "status": "archived",
    "documentUrl": "https://larksuite.com/docx/HJKxdRCI8olHgBxAKsYjOkfJpPf",
    "metadata": {
      "author": "王五",
      "tags": ["betting", "transaction", "archived"]
    },
    "createdAt": "2025-12-10T09:02:52.000Z",
    "updatedAt": "2025-12-10T09:20:15.000Z",
    "deletedAt": null
  }
}
```

---

### 7. 删除实体

删除指定的实体。

**端点**: `DELETE /api/entities/:entity_id`

**查询参数**:

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| soft_delete | boolean | 否 | true | 是否软删除 |
| cascade | boolean | 否 | false | 是否级联删除关系 |

**请求示例**:

```
DELETE /api/entities/entity-HJKxdRCI8olHgBxAKsYjOkfJpPf?soft_delete=true&cascade=false
```

**响应示例**:

```json
{
  "code": 0,
  "message": "Entity deleted successfully",
  "data": {
    "id": "entity-HJKxdRCI8olHgBxAKsYjOkfJpPf",
    "deleted_at": "2025-12-10T09:25:00.000Z"
  }
}
```

**说明**:
- 软删除：设置 `deletedAt` 字段，查询时自动过滤
- 硬删除：从数据库中永久删除记录

---

### 8. CSV 导入

从 CSV 数据批量导入实体。

**端点**: `POST /api/entities/import/csv`

**请求头**:
```
Content-Type: application/json
```

**请求体**:

```json
{
  "csvData": [
    {
      "entity_title": "文档1",
      "lark_doc_url": "https://larksuite.com/docx/xxx",
      "migration_status": "Success"
    },
    {
      "entity_title": "文档2",
      "lark_doc_url": "https://larksuite.com/docx/yyy",
      "migration_status": "Success"
    }
  ],
  "mapping": {
    "entity_title": "title",
    "lark_doc_url": "documentUrl",
    "migration_status": "status"
  }
}
```

**字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| csvData | array | 是 | CSV数据数组 |
| mapping | object | 否 | 字段映射（CSV字段 -> 实体字段） |

**响应示例**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "success_count": 2,
    "failed_count": 0,
    "results": [
      {
        "id": "entity-xxx",
        "status": "created"
      },
      {
        "id": "entity-yyy",
        "status": "created"
      }
    ]
  }
}
```

---

## 关系管理

### 1. 创建关系

在两个实体之间创建关系。

**端点**: `POST /api/relationships`

**请求头**:
```
Content-Type: application/json
```

**请求体**:

```json
{
  "source_id": "entity-HJKxdRCI8olHgBxAKsYjOkfJpPf",
  "target_id": "entity-C9kZdpBwVolFecxMRbnjDQjxp2d",
  "relationship_type": "CONTAINS",
  "metadata": {
    "description": "模块包含API文档",
    "weight": 1.0
  }
}
```

**字段说明**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| source_id | string | 是 | 源实体ID |
| target_id | string | 是 | 目标实体ID |
| relationship_type | string | 是 | 关系类型（CONTAINS, DEPENDS_ON等） |
| metadata | object | 否 | 关系元数据 |

**关系类型**:

| 类型 | 说明 | 示例 |
|------|------|------|
| CONTAINS | 包含 | 模块包含API |
| DEPENDS_ON | 依赖 | API依赖模块 |
| REFERENCES | 引用 | 文档引用API |
| IMPLEMENTS | 实现 | 代码实现接口 |
| EXTENDS | 扩展 | 子类扩展父类 |

**响应示例**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "relationshipId": "rel-AdoDvHgvYFr9wXoIv1fa",
    "sourceId": "entity-HJKxdRCI8olHgBxAKsYjOkfJpPf",
    "targetId": "entity-C9kZdpBwVolFecxMRbnjDQjxp2d",
    "relationshipType": "CONTAINS",
    "metadata": {
      "description": "模块包含API文档",
      "weight": 1.0
    },
    "createdAt": "2025-12-10T09:03:48.000Z"
  }
}
```

---

### 2. 查询实体关系

查询指定实体的所有关系。

**端点**: `GET /api/entities/:entity_id/relationships`

**查询参数**:

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| direction | string | 否 | both | 关系方向：outgoing / incoming / both |
| type | string | 否 | - | 关系类型过滤 |

**请求示例**:

```
GET /api/entities/entity-HJKxdRCI8olHgBxAKsYjOkfJpPf/relationships?direction=both&type=CONTAINS
```

**响应示例**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "entity_id": "entity-HJKxdRCI8olHgBxAKsYjOkfJpPf",
    "outgoing": [
      {
        "relationship_id": "rel-AdoDvHgvYFr9wXoIv1fa",
        "type": "CONTAINS",
        "target": {
          "id": "entity-C9kZdpBwVolFecxMRbnjDQjxp2d",
          "title": "投注API文档",
          "documentUrl": "https://larksuite.com/docx/C9kZdpBwVolFecxMRbnjDQjxp2d"
        }
      }
    ],
    "incoming": [
      {
        "relationship_id": "rel-XyzAbc123",
        "type": "DEPENDS_ON",
        "source": {
          "id": "entity-Abc123",
          "title": "交易服务",
          "documentUrl": "https://larksuite.com/docx/Abc123"
        }
      }
    ]
  }
}
```

**字段说明**:

| 字段 | 说明 |
|------|------|
| outgoing | 出站关系（当前实体 -> 其他实体） |
| incoming | 入站关系（其他实体 -> 当前实体） |

---

### 3. 删除关系

删除指定的关系。

**端点**: `DELETE /api/relationships/:relationship_id`

**响应示例**:

```json
{
  "code": 0,
  "message": "Relationship deleted successfully",
  "data": {
    "id": "rel-AdoDvHgvYFr9wXoIv1fa",
    "deleted": true
  }
}
```

---

## 搜索

### 全文搜索

搜索实体标题中包含关键词的实体。

**端点**: `GET /api/search`

**查询参数**:

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| q | string | 是 | - | 搜索关键词 |
| type | string | 否 | - | 实体类型过滤 |
| category | string | 否 | - | 分类过滤 |
| page | number | 否 | 1 | 页码 |
| page_size | number | 否 | 10 | 每页数量（1-50） |

**请求示例**:

```
GET /api/search?q=投注&type=document&page=1&page_size=10
```

**响应示例**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "query": "投注",
    "total": 15,
    "page": 1,
    "page_size": 10,
    "results": [
      {
        "id": 1,
        "entityId": "entity-HJKxdRCI8olHgBxAKsYjOkfJpPf",
        "type": "document",
        "title": "投注交易模块完整清单",
        "status": "active",
        "documentUrl": "https://larksuite.com/docx/HJKxdRCI8olHgBxAKsYjOkfJpPf",
        "metadata": {
          "author": "张三",
          "tags": ["betting", "transaction"]
        },
        "createdAt": "2025-12-10T09:02:52.000Z",
        "updatedAt": "2025-12-10T09:02:52.000Z",
        "deletedAt": null,
        "relevance_score": 0.95,
        "highlight": "投注交易模块完整清单"
      }
      // ... 更多结果
    ]
  }
}
```

**字段说明**:

| 字段 | 说明 |
|------|------|
| relevance_score | 相关性评分（0-1） |
| highlight | 高亮显示的匹配文本 |

---

## 统计

### 获取统计信息

获取实体和关系的统计信息。

**端点**: `GET /api/stats`

**请求参数**: 无

**响应示例**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total_entities": 150,
    "by_type": {
      "document": 50,
      "module": 30,
      "api": 70
    },
    "by_status": {
      "active": 120,
      "draft": 20,
      "archived": 10
    },
    "by_category": {
      "modules": 30,
      "apis": 70,
      "docs": 50
    },
    "total_relationships": 200,
    "last_updated": "2025-12-10T09:26:01.000Z"
  }
}
```

**字段说明**:

| 字段 | 说明 |
|------|------|
| total_entities | 总实体数（不含已删除） |
| by_type | 按类型统计 |
| by_status | 按状态统计 |
| by_category | 按分类统计（metadata中的category） |
| total_relationships | 总关系数 |
| last_updated | 最后更新时间 |

---

## 数据库迁移

### 执行数据库迁移

创建必需的数据库表。

**端点**: `POST /api/migrate`

**请求参数**: 无

**响应示例**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "Migration completed successfully",
    "tables": [
      "documind_entities",
      "documind_relationships"
    ]
  }
}
```

> ⚠️ **注意**: 此接口应该受到保护，仅允许管理员访问。

---

### 检查迁移状态

检查数据库表是否已创建。

**端点**: `GET /api/migrate`

**请求参数**: 无

**响应示例**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "migrated": true,
    "tables": [
      "documind_entities",
      "documind_relationships"
    ],
    "required_tables": [
      "documind_entities",
      "documind_relationships"
    ]
  }
}
```

---

## 使用示例

### JavaScript/TypeScript

```typescript
// 创建实体
const response = await fetch('https://documind-production.up.railway.app/api/entities', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    id: 'entity-001',
    type: 'document',
    title: '我的文档',
    status: 'active',
    metadata: {
      author: '张三',
      tags: ['test']
    }
  })
});

const data = await response.json();
console.log(data);
```

### Python

```python
import requests

# 创建实体
response = requests.post(
    'https://documind-production.up.railway.app/api/entities',
    json={
        'id': 'entity-001',
        'type': 'document',
        'title': '我的文档',
        'status': 'active',
        'metadata': {
            'author': '张三',
            'tags': ['test']
        }
    }
)

data = response.json()
print(data)
```

### cURL

```bash
# 创建实体
curl -X POST https://documind-production.up.railway.app/api/entities \
  -H "Content-Type: application/json" \
  -d '{
    "id": "entity-001",
    "type": "document",
    "title": "我的文档",
    "status": "active",
    "metadata": {
      "author": "张三",
      "tags": ["test"]
    }
  }'
```

---

## 最佳实践

### 1. 错误处理

始终检查响应的 `code` 字段：

```typescript
const response = await fetch('/api/entities');
const data = await response.json();

if (data.code === 0) {
  // 成功
  console.log(data.data);
} else {
  // 错误
  console.error(data.message, data.error);
}
```

### 2. 分页查询

处理大量数据时使用分页：

```typescript
async function getAllEntities() {
  const allEntities = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(`/api/entities?page=${page}&page_size=100`);
    const data = await response.json();
    
    allEntities.push(...data.data.items);
    
    hasMore = page < data.data.total_pages;
    page++;
  }

  return allEntities;
}
```

### 3. 批量操作

创建多个实体时使用批量接口：

```typescript
// ✅ 推荐：使用批量创建
await fetch('/api/entities/batch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    entities: [
      { id: 'entity-001', type: 'document', title: '文档1', status: 'active' },
      { id: 'entity-002', type: 'document', title: '文档2', status: 'active' },
      { id: 'entity-003', type: 'document', title: '文档3', status: 'active' }
    ]
  })
});

// ❌ 不推荐：循环调用单个创建
for (const entity of entities) {
  await fetch('/api/entities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entity)
  });
}
```

### 4. Metadata 使用

充分利用 metadata 字段存储灵活数据：

```typescript
{
  "id": "entity-001",
  "type": "document",
  "title": "我的文档",
  "metadata": {
    // 作者信息
    "author": "张三",
    "author_email": "zhangsan@example.com",
    
    // 标签和分类
    "tags": ["betting", "transaction", "api"],
    "category": "modules",
    
    // 版本信息
    "version": "1.0.0",
    "changelog": "初始版本",
    
    // 自定义字段
    "priority": "high",
    "department": "技术部",
    "reviewers": ["李四", "王五"]
  }
}
```

---

## 性能指标

| 操作 | 平均响应时间 | 备注 |
|------|-------------|------|
| 健康检查 | < 100ms | - |
| 创建单个实体 | < 200ms | - |
| 批量创建（3个） | < 500ms | 使用批量插入 |
| 查询实体详情 | < 150ms | - |
| 查询列表（20条） | < 200ms | 有索引 |
| 搜索 | < 300ms | 标题模糊匹配 |
| 创建关系 | < 150ms | - |
| 查询关系 | < 200ms | - |
| 统计信息 | < 250ms | - |

---

## 限制和配额

| 项目 | 限制 |
|------|------|
| 请求频率 | 无限制（建议 < 1000/分钟） |
| 单次查询返回数量 | 最多 100 条 |
| 批量创建数量 | 建议 < 1000 个 |
| metadata 大小 | 建议 < 10KB |
| 标题长度 | 最多 500 字符 |
| URL 长度 | 最多 1000 字符 |

---

## 更新日志

### v1.0 (2025-12-10)

- ✅ 实现所有核心 CRUD 接口
- ✅ 实现关系管理
- ✅ 实现搜索功能
- ✅ 实现统计功能
- ✅ 实现批量操作
- ✅ 实现 CSV 导入
- ✅ 优化批量创建性能
- ✅ 修复搜索接口问题

---

## 支持

如有问题或建议，请：

1. 查看 [API 实现文档](./API_IMPLEMENTATION.md)
2. 查看 [部署指南](./DEPLOYMENT_API.md)
3. 查看 [测试报告](../API_TEST_REPORT.md)

---

**文档版本**: 1.0  
**最后更新**: 2025-12-10  
**维护者**: Manus AI Agent
