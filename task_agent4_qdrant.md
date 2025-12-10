# Agent 4: Qdrant向量数据库集成

## 任务目标
实现Qdrant向量数据库集成，支持实体描述的向量化存储和RAG检索

## 输入文件路径
- `/home/ubuntu/documind/backend/server/db.ts`
- `/home/ubuntu/documind/backend/server/routers.ts`

## 技术要求

### 依赖安装
```bash
pnpm add @qdrant/js-client openai
```

### 环境变量
```bash
QDRANT_URL=http://qdrant.railway.internal:6333
OPENAI_API_KEY=your_openai_api_key  # 用于文本向量化
```

### Qdrant数据模型
- **Collection**: `documind_entities`
- **Vector维度**: 1536 (OpenAI text-embedding-3-small)
- **Payload**: 
  - entityId: number
  - name: string
  - type: string
  - description: string
  - uniqueId: string

## 实现要求

### 1. 创建 `server/config/qdrant.ts`
```typescript
// 包含以下功能:
- initQdrantClient(): 初始化Qdrant客户端
- createCollection(): 创建collection
- embedText(): 使用OpenAI生成向量
- upsertEntityVector(): 插入/更新实体向量
- deleteEntityVector(): 删除实体向量
- searchSimilarEntities(): 向量相似度搜索
```

### 2. 修改 `server/db.ts`
- 在 `createEntity()` 中添加向量化和存储逻辑
- 在 `updateEntity()` 中添加更新向量
- 在 `deleteEntity()` 中添加删除向量
- 添加 `searchEntitiesByVector()` 函数用于RAG检索

### 3. 修改 `server/routers.ts`
- 添加 `entities.search` procedure，支持语义搜索
- 输入: 搜索文本
- 输出: 相关实体列表（按相似度排序）

### 4. 向量化策略
- **向量化内容**: `${entity.name} ${entity.description}`
- **更新时机**: 创建/更新实体时
- **批量处理**: 支持批量向量化（可选）

## 输出要求

### 文件输出
1. `/home/ubuntu/documind_output/agent4/config/qdrant.ts` - Qdrant配置和查询函数
2. `/home/ubuntu/documind_output/agent4/db.ts` - 修改后的数据库操作
3. `/home/ubuntu/documind_output/agent4/routers.ts` - 修改后的路由（仅search部分）
4. `/home/ubuntu/documind_output/agent4/qdrant.test.ts` - Qdrant单元测试
5. `/home/ubuntu/documind_output/agent4/implementation_notes.md` - 实现说明文档

### 测试要求
- 测试Qdrant连接
- 测试collection创建
- 测试向量生成和存储
- 测试相似度搜索
- 测试错误处理

## 参考文档
- Qdrant JS Client: https://qdrant.tech/documentation/frameworks/javascript/
- OpenAI Embeddings: https://platform.openai.com/docs/guides/embeddings

## 注意事项
⚠️ 向量化失败不应阻塞实体创建
⚠️ 添加向量化重试逻辑
⚠️ 考虑OpenAI API速率限制
⚠️ 优化向量搜索性能
⚠️ 添加完善的错误处理和日志
