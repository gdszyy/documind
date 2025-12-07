# DocuMind

**新一代 AI 驱动的智能产品文档协作平台**

## 项目简介

DocuMind 是一个革命性的产品文档创作平台,旨在通过深度集成 AI 能力和外部"事实源"(如 Figma),彻底改变产品文档的撰写和维护流程。

### 核心特性

- **四层文档结构**: 模块 → 页面 → 组件 → API,完整覆盖产品知识体系
- **Figma 集成**: 自动同步设计稿中的组件信息,生成或更新文档草稿
- **标准化文档体系**: 基于 v4 规范,支持手动编写和自动化生成两种工作方式
- **全功能编辑器**: 交互式示例、API 测试器、完整的上下文侧边栏
- **AI 深度融合**: 文本生成、润色、影响分析、聊天助手
- **一键发布**: 生成包含完整交互体验的只读静态网站

## 📚 文档体系 (v4)

本项目采用 **DocuMind v4** 标准化文档体系,支持从 Figma 设计稿自动化生成产品文档。

### 核心文档

- **[v4 规范文档](./docs/standards/00-specification-v4.md)** - 完整的文档标准和规范
- **[Figma 命名规范](./docs/standards/figma-naming-convention.md)** - 设计师必读的命名规则
- **[自动化工作流指南](./docs/standards/automation-workflow-guide.md)** - 从 Figma 到文档的自动化流程
- **[整合方案说明](./docs/standards/00-integration-plan.md)** - v3 和 Figma 系统的整合思路
- **[v4 交付总结](./docs/DELIVERY-SUMMARY-V4.md)** - 完整的项目交付说明

### 文档模板

在 `docs/templates/` 目录下提供了四种标准化模板:

- **[模块模板](./docs/templates/module-template.md)** - 用于定义业务功能模块
- **[页面模板](./docs/templates/page-template.md)** - 用于描述用户交互页面
- **[组件模板 v4](./docs/templates/component-template-v4.md)** - 用于定义 UI 组件(支持 Figma 自动化)
- **[API 模板](./docs/templates/api-template.md)** - 用于描述后端接口

### 工作方式

**方式 A: 手动编写**
1. 复制相应的模板文件
2. 填写 Front Matter 和各个章节
3. 遵循规范中定义的格式

**方式 B: 从 Figma 自动生成**
1. 设计师在 Figma 中遵循命名规范
2. 运行脚本从 Figma API 提取数据
3. 使用 AI (如 Manus) 生成 Markdown 文档
4. 人工审核和补充内容

详见 [自动化工作流指南](./docs/standards/automation-workflow-guide.md)。

## 项目文档

- [项目计划书](./docs/DocuMind_Project_Plan.md) - 完整的 MVP 项目计划
- [MVP 详细设计](./docs/documind_mvp_revised.md) - MVP 版本的详细功能设计
- [功能架构图](./docs/functional_architecture_revised.png) - 系统功能架构
- [页面信息架构图](./docs/page_information_architecture_revised.png) - 页面流程和跳转关系

## 技术栈

- **前端**: React + TypeScript + TailwindCSS
- **后端**: Node.js (Express) 或 Python (FastAPI)
- **数据库**: PostgreSQL
- **对象存储**: AWS S3 或其他云存储
- **LLM 集成**: OpenAI API 或其他兼容 API
- **编辑器核心**: Monaco Editor 或 CodeMirror
- **Figma 集成**: Figma REST API

## 项目状态

🚀 **当前状态**: 文档体系 v4 已完成,MVP 开发准备就绪

## 开发计划

| 阶段 | 主要任务 | 预计工时 | 状态 |
| :--- | :--- | :--- | :--- |
| 第零阶段 | **文档体系标准化 (v4)** | 已完成 | ✅ 已完成 |
| 第一阶段 | 密码保护、项目管理、编辑器基础框架 | 1-2 周 | 📋 待开始 |
| 第二阶段 | 四层文档结构、模板系统、手动关联 | 2 周 | 📋 待开始 |
| 第三阶段 | 交互式示例、API 测试器 | 2 周 | 📋 待开始 |
| 第四阶段 | **Figma 集成** | 2-3 周 | 📋 待开始 |
| 第五阶段 | AI 功能集成 | 2-3 周 | 📋 待开始 |
| 第六阶段 | 发布服务、静态网站生成 | 1-2 周 | 📋 待开始 |
| 第七阶段 | 集成测试、优化与部署 | 1-2 周 | 📋 待开始 |

## 快速开始

### 使用文档模板

1. 阅读 [v4 规范文档](./docs/standards/00-specification-v4.md)
2. 选择合适的模板: [模块](./docs/templates/module-template.md) | [页面](./docs/templates/page-template.md) | [组件](./docs/templates/component-template-v4.md) | [API](./docs/templates/api-template.md)
3. 复制模板并按照规范填写内容

### 从 Figma 自动生成文档

1. 确保设计师遵循 [Figma 命名规范](./docs/standards/figma-naming-convention.md)
2. 参考 [自动化工作流指南](./docs/standards/automation-workflow-guide.md) 实施自动化流程

### 开发平台 (待完成)

(开发完成后将在此处添加安装和运行说明)

## 贡献指南

本项目目前处于 MVP 开发阶段,暂不接受外部贡献。

## 许可证

(待定)

## 联系方式

如有任何问题或建议,请通过 GitHub Issues 联系我们。

---

**由 Manus AI 设计和规划**
