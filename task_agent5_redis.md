# Agent 5: Redis缓存集成

## 任务目标
实现Redis缓存层，优化实体列表和图谱查询性能

## 输入文件路径
- `/home/ubuntu/documind/backend/server/db.ts`
- `/home/ubuntu/documind/backend/server/routers.ts`

## 技术要求

### 依赖安装
```bash
pnpm add redis
```

### 环境变量
```bash
REDIS_URL=redis://redis.railway.internal:6379
```

### 缓存策略
- **实体列表**: 缓存5分钟
- **单个实体**: 缓存10分钟
- **图谱数据**: 缓存3分钟
- **失效策略**: 创建/更新/删除实体时清除相关缓存

## 实现要求

### 1. 创建 `server/config/redis.ts`
```typescript
// 包含以下功能:
- initRedisClient(): 初始化Redis客户端
- closeRedisClient(): 关闭连接
- getCache(): 获取缓存
- setCache(): 设置缓存（带过期时间）
- deleteCache(): 删除缓存
- deleteCachePattern(): 批量删除缓存（支持通配符）
```

### 2. 修改 `server/db.ts`
- 在 `getEntities()` 中添加缓存逻辑
  - Key: `entities:list:${search}:${page}:${limit}:${sortBy}:${order}`
  - TTL: 300秒
- 在 `getEntityById()` 中添加缓存
  - Key: `entity:${id}`
  - TTL: 600秒
- 在 `getGraphData()` 中添加缓存
  - Key: `graph:${types}:${statuses}`
  - TTL: 180秒
- 在 `createEntity()`, `updateEntity()`, `deleteEntity()` 中清除相关缓存

### 3. 缓存失效逻辑
```typescript
// 创建/更新/删除实体时:
- 删除 `entities:list:*` (所有列表缓存)
- 删除 `entity:${id}` (单个实体缓存)
- 删除 `graph:*` (所有图谱缓存)
```

### 4. 错误处理
- Redis连接失败时，直接查询数据库
- Redis操作失败时，记录日志但不阻塞主流程
- 添加Redis健康检查

## 输出要求

### 文件输出
1. `/home/ubuntu/documind_output/agent5/config/redis.ts` - Redis配置和缓存函数
2. `/home/ubuntu/documind_output/agent5/db.ts` - 修改后的数据库操作
3. `/home/ubuntu/documind_output/agent5/redis.test.ts` - Redis单元测试
4. `/home/ubuntu/documind_output/agent5/implementation_notes.md` - 实现说明文档

### 测试要求
- 测试Redis连接
- 测试缓存读写
- 测试缓存失效
- 测试错误处理（Redis不可用时）
- 测试缓存命中率

## 参考文档
- Redis Node Client: https://github.com/redis/node-redis
- Redis命令参考: https://redis.io/commands/

## 注意事项
⚠️ Redis失败不应阻塞主流程
⚠️ 缓存Key设计要合理，避免冲突
⚠️ 注意缓存一致性问题
⚠️ 添加缓存监控和日志
⚠️ 考虑缓存穿透和雪崩问题
