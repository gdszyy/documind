# DocuMind 并行开发任务拆分方案

**日期**: 2025-12-10  
**目标**: 将三大核心任务拆分为可并行开发的独立子任务

---

## 任务优先级与依赖关系分析

### 核心任务概览

| 任务 | 优先级 | 阻塞性 | 预计复杂度 |
|------|--------|--------|------------|
| 任务1: 替换为飞书OAuth登录 | ⭐⭐⭐ | 是（阻塞部署） | 中等 |
| 任务2: 集成Neo4j/Qdrant/Redis | ⭐⭐⭐ | 否 | 高 |
| 任务3: 实现真实飞书文档创建 | ⭐⭐ | 否 | 低 |

### 依赖关系图

```
任务1 (飞书OAuth) - 独立，无依赖
├─ 子任务1.1: 飞书OAuth配置和流程实现
└─ 子任务1.2: 前端登录入口更新

任务2 (多数据库集成) - 独立，可拆分为3个并行子任务
├─ 子任务2.1: Neo4j图数据库集成
├─ 子任务2.2: Qdrant向量数据库集成
└─ 子任务2.3: Redis缓存集成

任务3 (飞书文档API) - 依赖任务1的飞书应用配置
└─ 子任务3.1: 飞书文档API实现
```

---

## 并行开发方案

### 第一批并行任务（5个Agent同时工作）

#### Agent 1: 飞书OAuth认证系统
**任务**: 实现飞书OAuth 2.0登录替换Manus OAuth  
**输入文件**: 
- `/home/ubuntu/documind/backend/server/_core/oauth.ts`
- `/home/ubuntu/documind/backend/server/_core/context.ts`
- `/home/ubuntu/documind/backend/drizzle/schema.ts`

**输出要求**:
- 修改后的 `oauth.ts` 文件
- 修改后的 `context.ts` 文件
- 环境变量配置说明文档
- 测试验证报告

**关键点**:
- 实现飞书OAuth授权流程
- 用户信息获取和存储
- Session管理
- 保持与现有数据库schema兼容

---

#### Agent 2: 前端登录入口更新
**任务**: 更新前端登录逻辑以适配飞书OAuth  
**输入文件**:
- `/home/ubuntu/documind/backend/client/src/const.ts`
- `/home/ubuntu/documind/backend/client/src/_core/` (相关认证组件)

**输出要求**:
- 修改后的前端登录入口代码
- 登录按钮UI更新
- 登录流程测试说明

**关键点**:
- 更新 `getLoginUrl()` 函数
- 适配飞书登录跳转
- 保持用户体验一致性

---

#### Agent 3: Neo4j图数据库集成
**任务**: 实现Neo4j图数据库集成和数据同步  
**输入文件**:
- `/home/ubuntu/documind/backend/server/db.ts`
- `/home/ubuntu/documind/backend/server/routers.ts`
- `/home/ubuntu/documind/backend/drizzle/schema.ts`

**输出要求**:
- `server/config/neo4j.ts` 配置文件
- Neo4j连接和查询函数
- 实体和关系同步逻辑
- 图查询API实现
- 单元测试

**关键点**:
- MySQL → Neo4j 数据同步
- 实体节点创建
- 关系边创建
- 图谱查询优化
- 环境变量: `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD`

---

#### Agent 4: Qdrant向量数据库集成
**任务**: 实现Qdrant向量数据库集成和RAG检索  
**输入文件**:
- `/home/ubuntu/documind/backend/server/db.ts`
- `/home/ubuntu/documind/backend/server/routers.ts`

**输出要求**:
- `server/config/qdrant.ts` 配置文件
- 向量化和存储逻辑
- RAG检索API实现
- 单元测试

**关键点**:
- 实体描述向量化
- Qdrant集合创建
- 向量存储和检索
- 相似度搜索实现
- 环境变量: `QDRANT_URL`

---

#### Agent 5: Redis缓存集成
**任务**: 实现Redis缓存层优化查询性能  
**输入文件**:
- `/home/ubuntu/documind/backend/server/db.ts`
- `/home/ubuntu/documind/backend/server/routers.ts`

**输出要求**:
- `server/config/redis.ts` 配置文件
- 缓存策略实现
- 缓存失效逻辑
- 单元测试

**关键点**:
- Redis连接配置
- 实体列表缓存
- 图谱数据缓存
- 缓存过期策略
- 环境变量: `REDIS_URL`

---

### 第二批任务（依赖第一批完成）

#### Agent 6: 飞书文档API实现
**任务**: 替换模拟实现为真实飞书API调用  
**依赖**: Agent 1完成（飞书应用配置）  
**输入文件**:
- `/home/ubuntu/documind/backend/server/larkService.ts`

**输出要求**:
- 修改后的 `larkService.ts`
- 飞书API调用实现
- 错误处理和重试逻辑
- 测试验证报告

**关键点**:
- 获取 `tenant_access_token`
- 调用创建文档API
- 返回真实文档链接
- 错误处理
- 环境变量: `LARK_APP_ID`, `LARK_APP_SECRET`

---

## 并行开发输入输出规范

### 输入标准化
每个Agent将收到:
1. **任务描述**: 清晰的目标和范围
2. **输入文件路径**: 需要修改的文件列表
3. **技术要求**: API文档、环境变量、依赖包
4. **测试要求**: 需要通过的测试用例

### 输出标准化
每个Agent需要提交:
1. **代码文件**: 完整的实现代码
2. **配置说明**: 环境变量和依赖配置
3. **测试报告**: 单元测试结果
4. **集成说明**: 如何与其他模块集成

---

## 集成和测试策略

### 阶段1: 独立测试（各Agent完成后）
- 每个子任务独立运行单元测试
- 验证核心功能正常工作
- 确保代码质量

### 阶段2: 集成测试（所有Agent完成后）
1. 合并所有代码到主分支
2. 安装所有新依赖
3. 配置所有环境变量
4. 运行完整的集成测试
5. 验证前后端联调

### 阶段3: 端到端测试
1. 测试飞书OAuth登录流程
2. 测试实体创建和同步到Neo4j/Qdrant
3. 测试图谱查询和RAG检索
4. 测试飞书文档真实创建
5. 测试Redis缓存效果

---

## 时间估算

| 阶段 | 任务 | 预计时间 |
|------|------|----------|
| 第一批并行 | Agent 1-5 同时工作 | 15-20分钟 |
| 第二批 | Agent 6 | 5-10分钟 |
| 集成测试 | 代码合并和测试 | 10-15分钟 |
| 总计 | - | 30-45分钟 |

相比串行开发（预计90-120分钟），并行开发可节省约50-60%的时间。

---

## 风险控制

### 潜在风险
1. **依赖冲突**: 多个Agent可能修改同一文件
2. **接口不匹配**: 各模块间接口定义不一致
3. **环境变量**: Railway环境变量配置错误

### 缓解措施
1. **明确文件归属**: 每个Agent负责不同的文件
2. **接口先行**: 先定义清晰的接口规范
3. **配置验证**: 提供环境变量检查脚本

---

## 下一步行动

1. ✅ 完成任务拆分方案
2. ⏳ 启动5个并行Agent执行第一批任务
3. ⏳ 收集和整合所有Agent的输出
4. ⏳ 执行集成测试
5. ⏳ 推送代码到GitHub
6. ⏳ 部署到Railway并验证
