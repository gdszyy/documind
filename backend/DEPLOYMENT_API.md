# DocuMind API 部署指南

## 概述

本文档描述如何部署 DocuMind REST API 到 Railway 平台。

## 前置条件

1. Railway 账号
2. 已配置的 MySQL 数据库
3. 数据库连接字符串 (DATABASE_URL)

## 部署步骤

### 1. 数据库迁移

首先需要在数据库中创建新的表结构。

#### 方法 A: 使用 Railway 数据库管理界面

1. 登录 Railway 控制台
2. 进入 MySQL 数据库服务
3. 点击 "Query" 或 "Data" 标签
4. 执行以下 SQL 脚本：

```sql
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
```

#### 方法 B: 使用 MySQL 客户端

```bash
mysql -h <host> -u <username> -p <database> < drizzle/0002_documind_entities.sql
```

### 2. 环境变量配置

在 Railway 项目设置中添加以下环境变量：

```env
# 数据库连接（必需）
DATABASE_URL=mysql://user:password@host:port/database

# CORS 配置（可选，默认为 *）
CORS_ORIGIN=*

# 其他现有环境变量保持不变
```

### 3. 代码部署

#### 方法 A: 通过 Git 推送

```bash
# 提交代码
git add .
git commit -m "feat: add REST API endpoints"
git push origin main
```

Railway 会自动检测到代码变更并重新部署。

#### 方法 B: 手动部署

在 Railway 控制台中点击 "Deploy" 按钮手动触发部署。

### 4. 验证部署

部署完成后，访问以下 URL 验证 API 是否正常运行：

```bash
# 健康检查
curl https://documind-backend-production.up.railway.app/health

# 预期响应
{
  "status": "ok",
  "timestamp": "2025-12-10T08:00:00Z",
  "services": {
    "database": "ok",
    "neo4j": "not_implemented"
  }
}
```

## API 端点列表

### 核心端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /health | 健康检查 |
| GET | /api/health | 健康检查（备用） |
| POST | /api/entities | 创建实体 |
| GET | /api/entities/:id | 获取实体详情 |
| GET | /api/entities | 查询实体列表 |
| PUT | /api/entities/:id | 更新实体 |
| PATCH | /api/entities/:id | 部分更新实体 |
| DELETE | /api/entities/:id | 删除实体 |
| POST | /api/entities/batch | 批量创建实体 |
| POST | /api/relationships | 创建关系 |
| GET | /api/entities/:id/relationships | 查询实体关系 |
| DELETE | /api/relationships/:id | 删除关系 |
| GET | /api/search | 全文搜索 |
| GET | /api/stats | 统计信息 |
| POST | /api/entities/import/csv | CSV 导入 |

## 测试 API

### 使用 cURL 测试

```bash
# 创建实体
curl -X POST https://documind-backend-production.up.railway.app/api/entities \
  -H "Content-Type: application/json" \
  -d '{
    "id": "entity-test-001",
    "type": "document",
    "title": "测试文档",
    "status": "active",
    "documentUrl": "https://larksuite.com/docx/test",
    "metadata": {
      "author": "Test User",
      "tags": ["test"]
    }
  }'

# 查询实体列表
curl "https://documind-backend-production.up.railway.app/api/entities?page=1&page_size=10"

# 搜索
curl "https://documind-backend-production.up.railway.app/api/search?q=测试"
```

### 使用测试脚本

在本地运行测试脚本（需要先启动本地服务器）：

```bash
# 启动开发服务器
pnpm dev

# 在另一个终端运行测试
./test_api.sh
```

## 监控和日志

### 查看日志

在 Railway 控制台的 "Deployments" 标签中可以查看实时日志：

- 请求日志
- 错误日志
- 数据库连接状态

### 关键日志标记

- `[Database]` - 数据库相关日志
- `[API Error]` - API 错误日志
- `[Cache]` - 缓存相关日志（如果启用 Redis）
- `[Neo4j]` - Neo4j 相关日志（如果启用）

## 故障排查

### 问题 1: 数据库连接失败

**症状**: `/health` 返回 `database: "error"`

**解决方案**:
1. 检查 `DATABASE_URL` 环境变量是否正确
2. 确认数据库服务是否运行
3. 检查数据库用户权限

### 问题 2: 404 错误

**症状**: API 请求返回 404

**解决方案**:
1. 确认 URL 路径正确（注意 `/api` 前缀）
2. 检查 Railway 部署日志，确认服务启动成功
3. 验证路由配置是否正确加载

### 问题 3: CORS 错误

**症状**: 浏览器控制台显示 CORS 错误

**解决方案**:
1. 设置 `CORS_ORIGIN` 环境变量为允许的域名
2. 或设置为 `*` 允许所有来源（仅用于开发/测试）

### 问题 4: 表不存在

**症状**: 查询时报错 "Table doesn't exist"

**解决方案**:
1. 确认已执行数据库迁移脚本
2. 检查数据库中是否存在 `documind_entities` 和 `documind_relationships` 表
3. 重新执行迁移脚本

## 性能优化建议

1. **启用 Redis 缓存**: 配置 Redis 环境变量以启用缓存层
2. **数据库索引**: 已在迁移脚本中创建必要的索引
3. **连接池**: Drizzle ORM 自动管理连接池
4. **分页**: 使用分页参数避免一次性加载大量数据

## 安全建议

1. **认证**: 当前未实现认证，建议添加 JWT 或 API Key 认证
2. **CORS**: 生产环境应设置具体的允许域名而非 `*`
3. **输入验证**: 已使用 Zod 进行输入验证
4. **SQL 注入**: 使用 Drizzle ORM 的参数化查询防止 SQL 注入
5. **速率限制**: 建议添加速率限制中间件

## 后续开发建议

1. **认证授权**: 实现 JWT 或 API Key 认证
2. **API 文档**: 生成 OpenAPI/Swagger 文档
3. **单元测试**: 添加完整的单元测试和集成测试
4. **监控告警**: 集成监控服务（如 Sentry）
5. **性能监控**: 添加 APM 工具监控性能
6. **Neo4j 集成**: 完善 Neo4j 图数据库集成
7. **向量搜索**: 集成 Qdrant 实现语义搜索

## 联系支持

如有问题，请查看：
- API 实现文档: `API_IMPLEMENTATION.md`
- API 设计文档: `API_DESIGN.md`
- 需求文档: `DocuMind后台API接口需求清单.md`
