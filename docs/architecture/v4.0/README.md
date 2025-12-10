# DocuMind 飞书体系 v4.0 架构文档

**版本**: 4.0 (最终版)  
**日期**: 2025-12-10  
**状态**: 已确定，准备实施

---

## 概述

本目录包含 DocuMind 飞书体系的最终架构设计文档（v4.0）。经过多轮深度讨论和迭代，我们最终确定了"Web 管理后台 + 轻量级 Linker 插件"的双层应用架构。

## 核心理念

**管理与阅读分离，后台与插件解耦**

- **Web 管理后台**: 独立的 Web 应用，负责所有管理、创建、分析和治理任务。
- **Linker 浏览器插件**: 轻量级浏览器助手，专注于在飞书文档中提供 `@` 引用和悬停预览体验。

## 文档清单

| 文档名称 | 描述 |
| :--- | :--- |
| [最终架构决策报告.md](./最终架构决策报告.md) | **核心文档**，包含完整的架构演进历程、最终决策和团队构成 |
| [architecture_v4_analysis.md](./architecture_v4_analysis.md) | v4.0 架构的深度分析，包含优势、实施路径和与前版本的对比 |
| [web_admin_design.md](./web_admin_design.md) | Web 管理后台的功能清单、技术方案和分阶段实施计划 |
| [linker_plugin_responsibilities.md](./linker_plugin_responsibilities.md) | Linker 插件的核心职责定义和功能边界 |
| [updated_task_assignment_v4.md](./updated_task_assignment_v4.md) | 最终的团队构成和 Agent 启动提示词 |

## 快速开始

如果您是第一次阅读这些文档，建议按以下顺序阅读：

1. 先阅读 **[最终架构决策报告.md](./最终架构决策报告.md)**，了解整体架构和核心决策。
2. 然后阅读 **[web_admin_design.md](./web_admin_design.md)** 和 **[linker_plugin_responsibilities.md](./linker_plugin_responsibilities.md)**，了解两个核心组件的详细设计。
3. 最后阅读 **[updated_task_assignment_v4.md](./updated_task_assignment_v4.md)**，了解团队分工和任务分配。

## 架构演进历史

- **v1.0**: 多维表格驱动（已废弃）
- **v2.0**: 文档驱动（已废弃）
- **v3.0**: 后台驱动，所有 UI 集成在 Linker 插件（已废弃）
- **v4.0**: Web 管理后台 + 轻量级 Linker 插件（当前版本）

## 相关资源

- [项目计划](../../planning/project-plan.md)
- [技术规范](../../technical-specs/)
- [标准与规范](../../standards/)
