# DocuMind Railway 部署指南

**更新日期**: 2025-12-10  
**版本**: 2.0 - 完整集成版

---

## 📋 部署前检查清单

### ✅ 已完成的开发任务

- [x] **任务1**: 替换为飞书OAuth 2.0登录
- [x] **任务2**: 集成Neo4j图数据库
- [x] **任务3**: 集成Qdrant向量数据库（RAG）
- [x] **任务4**: 集成Redis缓存层
- [x] **任务5**: 实现真实的飞书文档API

### 🔑 飞书应用凭证

```
App ID: cli_a98e2f05eff89e1a
App Secret: P8RRCqQlzw587orCUowX5dt37WQI7CZI
```

---

## 🚀 Railway 部署步骤

### 第一步：推送代码到GitHub

```bash
cd /home/ubuntu/documind
git add .
git commit -m "feat: integrate Feishu OAuth, Neo4j, Qdrant, Redis, and Lark Docs API"
git push origin main
```

### 第二步：在Railway创建服务

#### 1. 创建主应用服务

1. 登录 [Railway](https://railway.app/)
2. 创建新项目或选择现有项目
3. 点击 "New Service" → "GitHub Repo"
4. 选择 `gdszyy/documind` 仓库
5. 设置 Root Directory: `./backend`
6. Railway会自动检测并构建项目

#### 2. 创建数据库服务

在同一个Railway项目中添加以下服务：

- **MySQL/TiDB**: 主数据库（如已有则跳过）
- **Neo4j**: 图数据库
- **Qdrant**: 向量数据库
- **Redis**: 缓存数据库

点击 "New Service" → "Database" → 选择对应的数据库类型

---

## 🔧 环境变量配置

### 主应用环境变量

在Railway主应用服务的 "Variables" 标签页中配置：

#### 基础配置

```bash
# 数据库
DATABASE_URL=${{mysql.DATABASE_URL}}  # 引用MySQL服务

# 飞书OAuth
FEISHU_APP_ID=cli_a98e2f05eff89e1a
FEISHU_APP_SECRET=P8RRCqQlzw587orCUowX5dt37WQI7CZI
FEISHU_REDIRECT_URI=https://your-app.railway.app/api/oauth/callback

# JWT密钥（生成一个随机字符串）
JWT_SECRET=your-random-secret-key-change-in-production
```

#### 数据库集成配置

```bash
# Neo4j
NEO4J_URI=bolt://neo4j.railway.internal:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=${{neo4j.NEO4J_PASSWORD}}

# Qdrant
QDRANT_URL=http://qdrant.railway.internal:6333

# Redis
REDIS_URL=${{redis.REDIS_URL}}

# OpenAI（用于向量化）
OPENAI_API_KEY=your-openai-api-key
```

#### 飞书文档API配置

```bash
# 使用与OAuth相同的凭证
LARK_APP_ID=cli_a98e2f05eff89e1a
LARK_APP_SECRET=P8RRCqQlzw587orCUowX5dt37WQI7CZI
```

#### 前端环境变量

```bash
# Vite前端配置
VITE_FEISHU_APP_ID=cli_a98e2f05eff89e1a
```

### 重要提示

⚠️ **变量引用语法**：
- Railway内部服务引用使用 `${{service.VARIABLE}}` 格式
- 例如：`${{mysql.DATABASE_URL}}`、`${{redis.REDIS_URL}}`

⚠️ **JWT_SECRET**：
- 必须生成一个强随机字符串
- 可以使用：`openssl rand -base64 32`

⚠️ **FEISHU_REDIRECT_URI**：
- 替换 `your-app.railway.app` 为实际的Railway域名
- 必须与飞书开放平台配置完全一致

---

## 🔗 飞书开放平台配置

### 1. 配置OAuth回调地址

1. 访问 [飞书开放平台](https://open.feishu.cn/)
2. 进入应用管理 → 选择应用（App ID: cli_a98e2f05eff89e1a）
3. 进入 "安全设置" → "重定向URL"
4. 添加：`https://your-app.railway.app/api/oauth/callback`
5. 保存配置

### 2. 开启必要权限

确保应用已开启以下权限：

- **网页** - 用于OAuth登录
- **获取用户基本信息** - 用于获取用户名和邮箱
- **创建文档** - 用于自动创建飞书文档

### 3. 发布应用

- 如果是企业内部使用，发布到企业内部
- 如果是公开使用，需要提交审核

---

## 📦 依赖包说明

项目已安装以下新依赖：

```json
{
  "neo4j-driver": "^6.0.1",
  "@qdrant/js-client-rest": "latest",
  "redis": "^5.10.0",
  "openai": "^6.10.0"
}
```

这些依赖已在 `package.json` 中，Railway会自动安装。

---

## 🧪 部署后测试

### 1. 测试飞书OAuth登录

1. 访问应用首页
2. 点击登录按钮
3. 应该跳转到飞书授权页面
4. 授权后应该成功登录并返回应用

### 2. 测试实体创建

1. 创建一个新实体
2. 检查是否成功创建
3. 检查是否自动生成了飞书文档链接
4. 点击文档链接，验证文档是否真实存在

### 3. 测试数据同步

#### Neo4j测试
- 创建实体后，数据应该同步到Neo4j
- 在图谱页面查看，应该能看到节点和关系

#### Qdrant测试
- 创建带描述的实体
- 使用语义搜索功能（如果前端已实现）
- 应该能找到相关实体

#### Redis测试
- 多次访问实体列表
- 第二次访问应该更快（缓存命中）
- 查看日志应该有 `[Cache] Hit` 提示

### 4. 检查日志

在Railway控制台查看应用日志，确认：

```
[Neo4j] Driver initialized
[Qdrant] Client initialized
[Redis] Client initialized
[Lark] Document created successfully
```

---

## 🐛 常见问题排查

### 问题1: 飞书登录失败

**症状**: 点击登录后报错或无法跳转

**解决方案**:
1. 检查 `FEISHU_REDIRECT_URI` 是否与飞书开放平台配置一致
2. 检查 `FEISHU_APP_ID` 和 `FEISHU_APP_SECRET` 是否正确
3. 查看Railway日志中的错误信息

### 问题2: Neo4j连接失败

**症状**: 日志中显示 `[Neo4j] Failed to connect`

**解决方案**:
1. 确认Neo4j服务已在Railway中创建
2. 检查 `NEO4J_URI` 是否正确（应该是 `bolt://neo4j.railway.internal:7687`）
3. 检查 `NEO4J_PASSWORD` 是否正确引用了服务变量

### 问题3: Qdrant向量化失败

**症状**: 实体创建成功但向量化失败

**解决方案**:
1. 检查 `OPENAI_API_KEY` 是否有效
2. 检查OpenAI API配额是否充足
3. 向量化失败不会阻塞实体创建，只是RAG搜索功能不可用

### 问题4: Redis缓存不工作

**症状**: 缓存始终不命中

**解决方案**:
1. 确认Redis服务已在Railway中创建
2. 检查 `REDIS_URL` 是否正确
3. Redis失败会自动降级，不影响主功能

### 问题5: 飞书文档创建失败

**症状**: 实体创建成功但文档链接是模拟的

**解决方案**:
1. 检查 `LARK_APP_ID` 和 `LARK_APP_SECRET` 是否正确
2. 确认飞书应用已开启"创建文档"权限
3. 查看日志中的具体错误信息
4. 如果API调用失败，会自动降级到模拟链接

---

## 📊 性能优化建议

### 1. Redis缓存策略

当前缓存TTL配置：
- 实体列表: 5分钟
- 单个实体: 10分钟
- 图谱数据: 3分钟

可根据实际使用情况调整 `server/config/redis.ts` 中的 `CacheTTL` 配置。

### 2. Neo4j查询优化

- 为常用查询字段创建索引
- 使用Cypher查询计划分析器优化查询
- 考虑使用批量操作减少网络往返

### 3. Qdrant向量化优化

- 考虑使用批量向量化减少API调用
- 可以实现异步队列处理向量化任务
- 定期清理过期或无效的向量

---

## 🔄 数据迁移（可选）

如果已有生产数据，需要将现有实体同步到Neo4j和Qdrant：

### 创建迁移脚本

```typescript
// scripts/migrate-to-multi-db.ts
import * as db from './server/db';
import * as neo4j from './server/config/neo4j';
import * as qdrant from './server/config/qdrant';

async function migrate() {
  // 1. 初始化Qdrant collection
  await qdrant.initialize();

  // 2. 获取所有实体
  const entities = await db.getEntities({ page: 1, limit: 1000 });

  // 3. 同步到Neo4j和Qdrant
  for (const entity of entities.items) {
    await neo4j.createEntityNode(entity);
    await qdrant.upsertEntityVector(entity);
  }

  // 4. 同步关系
  const relationships = await db.getAllRelationships();
  for (const rel of relationships) {
    await neo4j.createRelationship(rel);
  }

  console.log('Migration completed!');
}

migrate();
```

---

## 📝 更新日志

### v2.0 (2025-12-10)

**新增功能**:
- ✅ 飞书OAuth 2.0登录
- ✅ Neo4j图数据库集成
- ✅ Qdrant向量数据库集成（RAG）
- ✅ Redis缓存层
- ✅ 真实的飞书文档API

**技术改进**:
- 多数据库架构（MySQL + Neo4j + Qdrant + Redis）
- 异步数据同步，不阻塞主流程
- 自动降级机制，确保核心功能可用
- 完善的错误处理和日志

**破坏性变更**:
- 认证系统从Manus OAuth迁移到飞书OAuth
- 需要配置额外的环境变量

---

## 🆘 获取帮助

如有问题，请：

1. 查看Railway日志获取详细错误信息
2. 参考本文档的"常见问题排查"部分
3. 查看项目README和代码注释
4. 提交GitHub Issue

---

**祝部署顺利！🎉**
