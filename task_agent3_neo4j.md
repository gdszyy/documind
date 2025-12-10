# Agent 3: Neo4j图数据库集成

## 任务目标
实现Neo4j图数据库集成，支持实体和关系的图谱存储与查询

## 输入文件路径
- `/home/ubuntu/documind/backend/server/db.ts`
- `/home/ubuntu/documind/backend/server/routers.ts`
- `/home/ubuntu/documind/backend/drizzle/schema.ts`

## 技术要求

### 依赖安装
```bash
pnpm add neo4j-driver
```

### 环境变量
```bash
NEO4J_URI=bolt://neo4j.railway.internal:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=t5x9zp754t07snum82apudguszzf6j77
```

### Neo4j数据模型
- **节点**: Entity (对应MySQL的entities表)
  - 属性: id, name, uniqueId, type, owner, status, description
- **关系**: 对应MySQL的entity_relationships表
  - 类型: EXPOSES_API, DEPENDS_ON, USES_COMPONENT, CONTAINS

## 实现要求

### 1. 创建 `server/config/neo4j.ts`
```typescript
// 包含以下功能:
- initNeo4jDriver(): 初始化Neo4j驱动
- closeNeo4jDriver(): 关闭连接
- createEntityNode(): 创建实体节点
- updateEntityNode(): 更新实体节点
- deleteEntityNode(): 删除实体节点
- createRelationship(): 创建关系
- deleteRelationship(): 删除关系
- queryGraph(): 查询图谱数据
```

### 2. 修改 `server/db.ts`
- 在 `createEntity()` 中添加同步到Neo4j的逻辑
- 在 `updateEntity()` 中添加同步更新Neo4j节点
- 在 `deleteEntity()` 中添加删除Neo4j节点
- 在 `createRelationship()` 中添加同步到Neo4j
- 在 `getGraphData()` 中添加从Neo4j查询的选项

### 3. 修改 `server/routers.ts`
- 在 `graph.getData` 中添加使用Neo4j查询的逻辑
- 添加错误处理，Neo4j失败时回退到MySQL

### 4. 数据同步策略
- **创建实体**: MySQL → Neo4j
- **更新实体**: MySQL → Neo4j
- **删除实体**: MySQL → Neo4j（同时删除相关关系）
- **创建关系**: MySQL → Neo4j
- **查询图谱**: 优先Neo4j，失败则MySQL

## 输出要求

### 文件输出
1. `/home/ubuntu/documind_output/agent3/config/neo4j.ts` - Neo4j配置和查询函数
2. `/home/ubuntu/documind_output/agent3/db.ts` - 修改后的数据库操作
3. `/home/ubuntu/documind_output/agent3/routers.ts` - 修改后的路由（仅graph部分）
4. `/home/ubuntu/documind_output/agent3/neo4j.test.ts` - Neo4j单元测试
5. `/home/ubuntu/documind_output/agent3/implementation_notes.md` - 实现说明文档

### 测试要求
- 测试Neo4j连接
- 测试节点创建和查询
- 测试关系创建和查询
- 测试数据同步逻辑
- 测试错误处理和回退机制

## 参考文档
- Neo4j Driver文档: https://neo4j.com/docs/javascript-manual/current/
- Cypher查询语言: https://neo4j.com/docs/cypher-manual/current/

## 注意事项
⚠️ 保持MySQL为主数据库，Neo4j为补充
⚠️ Neo4j失败不应阻塞主流程
⚠️ 添加完善的错误处理和日志
⚠️ 优化Cypher查询性能
⚠️ 考虑批量操作优化
