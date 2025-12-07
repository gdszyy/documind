# DocuMind v4: 标准化规范文档

## 1. 概述

DocuMind v4 是在 v3 基础上,通过整合 Figma 组件系统而演进的版本。它保留了 v3 的所有核心规范(Front Matter、文件命名、文档引用等),并在组件文档层面进行了大幅扩展,以支持从 Figma 设计稿自动化生成高质量的产品文档。

## 2. 核心变化

### 2.1. 组件模板的扩展

v4 的组件模板从原来的 9 个章节扩展到 9 个更详细的章节,并融合了 Figma 模板的深度内容:

| 章节 | v3 | v4 | 来源 |
|---|---|---|---|
| 基本信息 | ✅ | ✅ | v3 |
| 组件概述 | ✅ | ✅ 扩展 | v3 + Figma |
| 组件预览 | ✅ | ✅ | v3 |
| 组件属性 | ✅ | ✅ 扩展 | v3 + Figma |
| 组件变体 | ✅ | ✅ 扩展 | v3 + Figma |
| 组件状态 | ✅ | ✅ | v3 |
| 使用示例 | ✅ | ✅ | v3 |
| 技术规格 | ✅ | ✅ 扩展 | v3 + Figma |
| 变更历史 | ✅ | ✅ | v3 |
| **新增**: 组件剖析 | ❌ | ✅ | Figma |
| **新增**: 行为与交互 | ❌ | ✅ | Figma |
| **新增**: 内容指南 | ❌ | ✅ | Figma |
| **新增**: 无障碍设计 | ❌ | ✅ | Figma |

### 2.2. 自动化工作流支持

v4 引入了完整的自动化工作流,支持从 Figma 设计稿直接生成符合规范的产品文档:

- **Figma 命名规范**: 设计师遵循的标准化命名规则
- **数据提取脚本**: 从 Figma API 提取结构化数据
- **AI 主提示词**: 指导 AI 如何生成符合规范的文档
- **人工审核流程**: 确保 AI 生成的文档质量

## 3. 文件与目录规范 (继承自 v3)

### 3.1. 文件命名

所有文档和资源文件名必须使用 **kebab-case** (小写字母,单词间用连字符 `-` 分隔)。

### 3.2. 目录结构

```
docs/
├── 00-specification-v4.md       # 本规范文档
├── README.md                    # 项目说明
├── 01-figma-naming-convention.md   # Figma 命名规范
├── 02-automation-workflow-guide.md # 自动化工作流指南
├── index.json                   # 全局索引文件
├── templates/                   # 模板目录
│   ├── module-template.md
│   ├── page-template.md
│   ├── component-template-v4.md # 新的整合模板
│   └── api-template.md
└── modules/
    └── {module-id}/
        ├── README.md
        ├── module.json
        ├── pages/
        ├── components/
        └── apis/
```

## 4. Front Matter 元数据 (继承自 v3)

每个 Markdown 文档都 **必须** 以 YAML Front Matter 开头。

### 4.1. 通用必填字段

| 字段 | 类型 | 描述 | 示例 |
|---|---|---|---|
| `id` | String | 文档唯一标识符 (kebab-case) | `bet-card` |
| `type` | String | 文档类型 | `module`, `page`, `component`, `api` |
| `title` | String | 文档标题(中文) | `投注卡片` |
| `status` | String | 文档状态 | `draft`, `in-progress`, `review`, `completed` |
| `createdAt` | String | 创建日期 (YYYY-MM-DD) | `2025-12-08` |
| `updatedAt` | String | 最后更新日期 (YYYY-MM-DD) | `2025-12-08` |

### 4.2. 组件特定字段

| 字段 | 类型 | 必填 | 描述 |
|---|---|---|---|
| `componentType` | String | 是 | `normal` (普通) 或 `global` (全局) |
| `figmaUrl` | String | 否 | Figma 设计稿链接 |
| `hasInteractive` | Boolean | 否 | 是否有可交互 HTML 预览 |
| `interactiveUrl` | String | 否 | HTML 文件相对路径 |

## 5. 内容语法规范 (继承自 v3)

### 5.1. 文档引用

- **标准语法**: `[@文档标题](相对路径)`
- **带标签语法**: `[@文档标题](相对路径) 	`[标签]``

### 5.2. 可交互组件嵌入

使用 HTML 注释包裹 `<iframe>` 标签:

```markdown
<!-- INTERACTIVE_COMPONENT_START -->
<iframe src="./component-id.html" title="Interactive Preview" width="100%" height="400px" frameborder="0"></iframe>
<!-- INTERACTIVE_COMPONENT_END -->
```

## 6. 组件文档的标准章节结构 (v4 新增)

所有组件文档 **必须** 遵循以下章节结构和顺序:

1. **Front Matter**: YAML 元数据
2. **1. 概述**: 包括组件描述、使用场景、不使用场景
3. **2. 视觉预览**: 默认状态的预览图
4. **3. 组件剖析**: 组件的构成元素及其功能
5. **4. 属性与状态**: 定义组件的各种变体和状态
6. **5. 行为与交互**: 用户操作和条件逻辑
7. **6. 内容指南**: 各元素的内容规范
8. **7. 无障碍设计**: 键盘导航、屏幕阅读器等
9. **8. 技术规格**: 关联关系和技术细节
10. **9. 变更历史**: 版本迭代记录

## 7. 自动化工作流规范 (v4 新增)

### 7.1. Figma 命名规范

详见 [Figma 命名规范指南](./01-figma-naming-convention.md)。

### 7.2. 数据提取格式

从 Figma 提取的数据应遵循 [自动化工作流指南](./02-automation-workflow-guide.md) 中定义的 JSON 格式。

### 7.3. AI 生成指南

AI 应遵循 [自动化工作流指南](./02-automation-workflow-guide.md) 中的“主提示词”来生成符合规范的文档。

## 8. 向后兼容性

v4 完全兼容 v3 的所有规范。现有的 v3 文档无需修改,可以直接在 v4 体系中使用。如果需要升级到新的组件模板,只需按照 v4 的章节结构重新组织内容即可。

## 9. 变更历史

| 日期 | 版本 | 变更内容 | 变更人 |
|---|---|---|---|
| 2025-12-08 | v4.0.0 | 整合 Figma 组件系统,扩展组件文档模板,引入自动化工作流 | @manus-ai |
| 2025-12-08 | v3.0.0 | 初始版本,基于前端解析规范 | @manus-ai |
