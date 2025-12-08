# DocuMind 仓库结构与命名规范

## 1. 概述

本文档定义了 DocuMind 项目的官方目录结构和文件命名规范。遵循此规范有助于保持仓库的整洁、可维护性和专业性,方便团队成员快速定位和理解项目内容。

## 2. 核心原则

- **关注点分离 (Separation of Concerns)**: 代码、文档、脚本等不同类型的内容应存放在独立的目录中。
- **命名一致性 (Consistent Naming)**: 所有文件和目录都应遵循统一的命名约定。
- **结构可预测性 (Predictable Structure)**: 目录结构应清晰、直观,新成员可以快速上手。

## 3. 文件命名规范

**所有文件和目录名必须使用 `kebab-case` (小写字母,单词间用连字符 `-` 分隔)。**

| 规则 | 说明 |
| :--- | :--- |
| **格式** | `kebab-case` |
| **大小写** | 仅使用小写字母 |
| **分隔符** | 单词之间使用连字符 `-` |
| **禁止** | 避免使用下划线 `_`、驼峰式 `camelCase` 或帕斯卡式 `PascalCase` |
| **语言** | 优先使用英文,除非是特定区域的文档 |
| **版本号** | 在文件名末尾使用 `-v1`, `-v2` 等表示版本 |

**示例**:

- ✅ `figma-naming-convention.md`
- ✅ `automation-workflow-guide.md`
- ✅ `component-template-v4.md`
- ❌ `DocuMind_Project_Plan.md` (错误: 大写和下划线)
- ❌ `DELIVERY-SUMMARY-V4.md` (错误: 全大写)

## 4. 根目录结构

```
documind/
├── .github/              # GitHub 相关配置 (例如 CI/CD 工作流)
├── .vscode/              # VSCode 编辑器配置
├── backend/              # 后端代码 (Node.js/Python)
├── docs/                 # 项目所有文档
├── frontend/             # 前端代码 (React/Vue)
├── scripts/              # 自动化脚本
├── .gitignore            # Git 忽略文件配置
├── CONTRIBUTING.md       # 贡献指南
├── LICENSE               # 项目许可证
└── README.md             # 项目主入口,提供高级概述和导航
```

## 5. `docs` 目录结构

`docs` 目录是所有非代码类文档的中心,其内部结构按文档类型和用途进行划分。

```
docs/
├── README.md             # 文档中心导航页,提供所有文档的索引和简介
├── planning/             # 项目规划与管理文档
│   ├── project-plan.md
│   ├── mvp-design.md
│   ├── delivery-summary-v4.md
│   └── diagrams/         # 存放所有架构图、流程图等
│       ├── functional-architecture.png
│       └── page-information-architecture.png
├── research/             # 研究、分析与案例
│   ├── ai-element-recognition-feasibility.md
│   └── case-studies/     # 案例研究
│       └── betting-platform/
├── standards/            # 文档体系规范
│   ├── 00-specification-v5.md
│   ├── 01-figma-naming-convention.md
│   ├── 02-automation-workflow-guide.md
│   ├── 03-integration-plan.md
│   └── 04-repository-structure.md  # 本文档
├── architecture/         # 架构设计文档 (v5 新增)
│   └── service-api-architecture.md
├── technical-specs/      # 技术规范文档
│   ├── README.md         # 技术规范索引
│   └── sportradar/       # Sportradar 集成规范
│       ├── 01-uof-realtime-layer.md
│       ├── 02-uof-confirmation-layer.md
│       └── 03-outcome-mapping-api.md
├── templates/            # 标准化文档模板
│   ├── module-template.md
│   ├── page-template.md
│   ├── component-template.md
│   ├── service-template.md    # v5 新增
│   └── api-template.md
├── examples/             # 完整示例 (v5 新增)
│   └── wallet-deposit/   # 充值功能示例
└── modules/              # 业务模块文档
    └── {module-id}/
        ├── README.md
        ├── pages/
        ├── components/
        └── backend/      # v5 新增: 后端层
            ├── services/ # 服务层
            └── apis/     # API 层
```

### 5.1. 文档分类说明

| 目录 | 用途 | 示例内容 |
| :--- | :--- | :--- |
| `planning/` | **项目规划与管理**: 包含项目从启动到交付的各类高级设计和总结文档。 | 项目计划书、MVP 设计稿、交付总结、架构图。 |
| `research/` | **研究与分析**: 包含技术可行性研究、竞品分析、案例研究等探索性文档。 | AI 可行性分析、博彩平台案例研究。 |
| `standards/` | **文档体系规范**: 定义 DocuMind 平台的文档编写标准、命名规范和工作流程。 | 文档规范、Figma 命名规范、自动化工作流指南、仓库结构规范。 |
| `architecture/` | **架构设计文档** (v5 新增): 包含系统架构设计、技术决策和设计理念。 | 服务+API 架构设计、数据库设计、微服务架构。 |
| `technical-specs/` | **技术规范文档**: 包含各类技术集成规范、API 使用指南和技术实现细节。 | Sportradar UOF 集成规范、数据源 API 使用指南、消息处理规范。 |
| `templates/` | **文档模板**: 提供可复用的标准化文档模板,用于快速创建新文档。 | 模块、页面、组件、服务、API 的 Markdown 模板。 |
| `examples/` | **完整示例** (v5 新增): 提供完整的功能模块文档示例,展示最佳实践。 | 充值功能示例、订单模块示例。 |

### 5.2. 文档编号规范

在 `standards/` 目录下的文档,建议使用两位数字前缀 (`00-`, `01-`, `02-`...)来表示其重要性和推荐的阅读顺序,帮助新成员快速建立对项目规范的理解。

- `00-`: **核心规范**,是整个体系的基石。
- `01-` onwards: **具体规范**,按逻辑顺序排列。

## 6. 开发规范

- **代码风格**: 遵循项目根目录下的 ESLint 和 Prettier 配置。
- **提交规范**: 遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范,有助于自动化生成变更日志。
- **分支策略**: 推荐使用 Git Flow 或类似的策略,例如:
  - `main`: 稳定的生产版本。
  - `develop`: 最新的开发版本。
  - `feat/...`: 新功能开发分支。
  - `fix/...`: Bug 修复分支。

---

**本文档是 DocuMind 项目的核心规范之一,所有团队成员都应阅读并遵循。**
