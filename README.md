# DocuMind - 飞书体系项目

**基于飞书多维表格的新一代 AI 驱动智能产品文档协作平台**

## 📋 仓库说明

本仓库已完成重构，专注于 **DocuMind 飞书体系项目**的文档和飞书多维表格集成代码。原有的完整项目代码已备份至 `backup/full-original-project` 分支。

### 仓库结构

```
documind/
├── docs/              # 完整的项目文档体系
│   ├── standards/     # 文档标准和规范
│   ├── templates/     # 文档模板（模块、页面、组件、API）
│   ├── planning/      # 项目规划和设计文档
│   ├── technical-specs/ # 技术规范和集成指南
│   ├── research/      # 研究和案例分析
│   └── examples/      # 示例文档
└── lark-bitable/      # 飞书多维表格集成代码和文档
    ├── bitable_agent.py              # 飞书多维表格操作脚本
    ├── bitable_schema.json           # 数据表结构定义
    ├── existing_tables.json          # 现有表格清单
    ├── table_verification_report.json # 表格验证报告
    ├── README.md                     # 飞书多维表格集成说明
    ├── FEISHU_BITABLE_COMPLETE_GUIDE.md # 完整操作指南
    ├── AGENT_BITABLE_OPERATIONS_GUIDE.md # Agent 操作指南
    └── BITABLE_CREATION_REPORT.md    # 表格创建报告
```

### 备份分支

原项目的完整代码（包括前端、后端、Web 等所有模块）已完整备份至：

**分支名称**: `backup/full-original-project`

如需访问原项目代码，请切换至该分支：

```bash
git checkout backup/full-original-project
```

或在 GitHub 上查看：[https://github.com/gdszyy/documind/tree/backup/full-original-project](https://github.com/gdszyy/documind/tree/backup/full-original-project)

## 🚀 新项目架构

DocuMind 飞书体系项目采用基于 **Railway 平台**的现代化基础设施架构：

### 基础设施组件

- **Neo4j**: 图数据库，用于存储文档关系和知识图谱
- **Qdrant**: 向量数据库，用于语义搜索和 AI 检索
- **Redis**: 缓存和会话管理
- **后端 API 服务**: 基于 Node.js/Python 的 RESTful API 服务

### 技术栈

- **基础设施平台**: Railway
- **图数据库**: Neo4j
- **向量数据库**: Qdrant
- **缓存**: Redis
- **后端**: Node.js (Express) 或 Python (FastAPI)
- **飞书集成**: 飞书开放平台 API + 多维表格 API
- **AI 集成**: OpenAI API 或兼容服务

## 📚 文档体系

本项目继承了 **DocuMind v4** 标准化文档体系，支持从 Figma 设计稿和飞书多维表格自动化生成产品文档。

### 核心文档

- **[v4 规范文档](./docs/standards/00-specification-v4.md)** - 完整的文档标准和规范
- **[v5 规范文档](./docs/standards/00-specification-v5.md)** - 最新版本规范
- **[Figma 命名规范](./docs/standards/01-figma-naming-convention.md)** - 设计师必读的命名规则
- **[自动化工作流指南](./docs/standards/02-automation-workflow-guide.md)** - 自动化流程说明
- **[整合方案说明](./docs/standards/03-integration-plan.md)** - 系统整合思路
- **[仓库结构规范](./docs/standards/04-repository-structure.md)** - 代码组织规范

### 飞书多维表格集成

- **[飞书多维表格完整指南](./lark-bitable/FEISHU_BITABLE_COMPLETE_GUIDE.md)** - 飞书多维表格操作完整指南
- **[Agent 操作指南](./lark-bitable/AGENT_BITABLE_OPERATIONS_GUIDE.md)** - AI Agent 操作飞书多维表格的指南
- **[表格创建报告](./lark-bitable/BITABLE_CREATION_REPORT.md)** - 多维表格创建和配置报告

### 文档模板

在 `docs/templates/` 目录下提供了标准化模板：

- **[模块模板](./docs/templates/module-template.md)** - 用于定义业务功能模块
- **[页面模板](./docs/templates/page-template.md)** - 用于描述用户交互页面
- **[组件模板 v6](./docs/templates/component-template-v6.md)** - 用于定义 UI 组件
- **[API 模板](./docs/templates/api-template.md)** - 用于描述后端接口
- **[服务模板](./docs/templates/service-template.md)** - 用于描述后端服务

## 🛠️ 基础设施部署

基础设施部署在 Railway 平台上，具体部署文档请参考：

- **基础设施文档**: `docs/infrastructure/railway-setup.md`（部署完成后生成）
- **环境变量配置**: 参考各服务的环境变量配置文档
- **服务连接**: 所有服务通过 Railway 内部网络互联

## 📖 快速开始

### 查看文档

1. 浏览 [文档中心](./docs/README.md) 了解完整文档体系
2. 阅读 [v4 规范文档](./docs/standards/00-specification-v4.md) 或 [v5 规范文档](./docs/standards/00-specification-v5.md)
3. 查看 [飞书多维表格完整指南](./lark-bitable/FEISHU_BITABLE_COMPLETE_GUIDE.md)

### 使用飞书多维表格

1. 参考 [飞书多维表格完整指南](./lark-bitable/FEISHU_BITABLE_COMPLETE_GUIDE.md)
2. 使用 `lark-bitable/bitable_agent.py` 脚本操作多维表格
3. 查看 `lark-bitable/bitable_schema.json` 了解数据结构

### 访问原项目代码

如需查看原项目的前端、后端、Web 等完整代码：

```bash
git checkout backup/full-original-project
```

## 🔗 相关链接

- **GitHub 仓库**: [https://github.com/gdszyy/documind](https://github.com/gdszyy/documind)
- **备份分支**: [https://github.com/gdszyy/documind/tree/backup/full-original-project](https://github.com/gdszyy/documind/tree/backup/full-original-project)
- **Railway 项目**: （部署完成后添加）
- **后端 API 服务**: （部署完成后添加）

## 📝 项目状态

🚀 **当前状态**: 仓库重构完成，Railway 基础设施部署中

### 已完成

- ✅ 原项目代码备份至 `backup/full-original-project` 分支
- ✅ 主分支清理，仅保留 `docs/` 和 `lark-bitable/`
- ✅ README 重写，说明新项目结构

### 进行中

- 🔄 Railway 平台基础设施部署（Neo4j, Qdrant, Redis）
- 🔄 后端 API 服务框架搭建

### 待完成

- 📋 后端 API 开发
- 📋 飞书多维表格深度集成
- 📋 AI 功能集成
- 📋 前端界面开发

## 📄 许可证

（待定）

## 📧 联系方式

如有任何问题或建议，请通过 GitHub Issues 联系我们。

---

**由 Manus AI 设计、规划和重构**
