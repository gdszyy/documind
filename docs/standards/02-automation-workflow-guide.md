# DocuMind v4: Figma 自动化工作流指南

## 1. 概述

本指南详细描述了如何实施从 Figma 设计稿到 DocuMind v4 产品文档的自动化生成流程。该流程旨在最大限度地减少手动编写工作,确保设计与文档的同步,并利用 AI 提升效率。

## 2. 四步工作流

```mermaid
graph TD
    A[**1. 设计 (Figma)**<br>设计师遵循命名规范<br>完成组件设计] --> B[**2. 提取 (脚本)**<br>自动化脚本从 Figma 提取<br>结构化的 JSON 数据];
    B --> C[**3. 生成 (AI)**<br>将 JSON 数据和主提示词<br>输入 AI 生成文档];
    C --> D[**4. 审核与发布 (人工)**<br>产品经理或开发者审核<br>AI 生成的 Markdown 文档];
```

| 步骤 | 角色 | 核心任务 |
| :--- | :--- | :--- |
| 1. **设计** | UI/UX 设计师 | 严格按照 [Figma 命名规范](./01-figma-naming-convention.md) 创建和组织组件。 |
| 2. **提取** | 开发/自动化 | 运行脚本,通过 Figma API 提取设计信息,并转换为下文定义的 JSON 格式。 |
| 3. **生成** | AI (Manus) | 使用 [主提示词](#4-主提示词-master-prompt) 和提取的 JSON 数据,自动生成符合 v4 模板的 Markdown 文档。 |
| 4. **审核** | 产品经理/开发者 | 审核 AI 生成的文档,补充业务逻辑、技术细节,并最终发布。 |

## 3. 步骤详解

### 步骤 1: 设计

此阶段的成功完全依赖于设计师是否严格遵守了命名规范。请确保所有参与的团队成员都已熟悉并遵循:

> **[DocuMind: Figma 命名规范指南](./01-figma-naming-convention.md)**

### 步骤 2: 提取

此步骤需要一个自动化脚本(推荐使用 Node.js)来调用 Figma REST API,并将设计数据转换为以下结构的 JSON 文件。

**目标 JSON 结构 (`component-data.json`):**

```json
{
  "componentName": "Bet Card",
  "description": "用于在列表中展示单个赛事的核心信息...",
  "useCases": ["在赛事列表中展示比赛", "在用户收藏中显示赛事"],
  "avoidUseCases": ["用于展示非赛事类的卡片信息"],
  "defaultPreviewImageUrl": "https://s3.aws.com/figma-images/default.png",
  "anatomyImageUrl": "https://s3.aws.com/figma-images/anatomy.png",
  "elements": [
    { "name": ".header-section", "description": "卡片顶部区域,包含队伍名称和时间" },
    { "name": ".odds-button", "description": "显示赔率并响应用户点击" }
  ],
  "properties": [
    {
      "name": "Live",
      "figmaName": "Live",
      "description": "是否为滚球赛事",
      "values": ["True", "False"]
    },
    {
      "name": "State",
      "figmaName": "State",
      "description": "组件的交互状态",
      "values": ["Default", "Hover", "Selected"]
    }
  ],
  "variants": [
    {
      "combination": "Live=True, State=Default",
      "imageUrl": "https://s3.aws.com/figma-images/variant-1.png"
    },
    {
      "combination": "Live=False, State=Default",
      "imageUrl": "https://s3.aws.com/figma-images/variant-2.png"
    }
  ],
  "interactions": [
    { "action": "Click", "element": ".odds-button", "feedback": "触发 onSelectOdds 回调,将注单添加到投注栏" }
  ],
  "contentGuidelines": [
    { "element": ".team-name", "guideline": "最多显示 15 个字符,超出部分用...省略", "example": "Manchester United" }
  ],
  "accessibility": {
    "keyboardNav": "用户可以使用 Tab 键在不同的赔率按钮间切换",
    "screenReader": "赔率按钮应读出'主队胜,赔率2.1'"
  },
  "technicalSpecs": {
    "figmaUrl": "https://figma.com/file/...",
    "codeComponentName": "BetCard"
  }
}
```

### 步骤 3: 生成

将上一步生成的 `component-data.json` 和下面的“主提示词”一同提交给 AI 模型,即可生成完整的 Markdown 文档。

### 步骤 4: 审核

AI 生成的文档是高质量的初稿,但仍需人工审核。审核重点:

- **补充业务逻辑**: AI 无法完全理解复杂的业务规则,需要人工补充“条件逻辑规则”。
- **完善技术规格**: 补充代码仓库路径、关联的 API 和页面等。
- **校对文案**: 检查所有描述是否准确、清晰。

## 4. 主提示词 (Master Prompt)

这是指导 AI 完成任务的核心指令。将此提示词与 `component-data.json` 的内容结合后发送给 AI。

---

**角色**: 你是一个专业的产品文档专家(Product Documentation Specialist),精通技术写作和用户体验设计。你的任务是根据提供的 Figma 组件数据(JSON 格式),生成一份结构清晰、内容详尽、符合 DocuMind v4 规范的 Markdown 产品文档。

**上下文**:
你正在为一个大型博彩平台构建产品文档体系。所有文档都必须遵循 DocuMind v4 的标准模板。现在,你需要为一个新的 Figma 组件生成文档。

**任务**: 
将以下提供的 `COMPONENT_DATA_JSON` 填充到 `COMPONENT_TEMPLATE_V4` 中,生成一份完整的 Markdown 文档。请严格按照模板的结构和占位符进行填充,并确保所有内容都准确无误。

**输入数据格式 (COMPONENT_DATA_JSON)**:
```json
{
  "componentName": "组件名称",
  "description": "组件描述",
  "useCases": ["使用场景"],
  "avoidUseCases": ["不使用场景"],
  "defaultPreviewImageUrl": "默认预览图URL",
  "anatomyImageUrl": "剖析图URL",
  "elements": [{ "name": "元素名", "description": "元素描述" }],
  "properties": [{ "name": "维度名", "figmaName": "Figma属性名", "description": "维度描述", "values": ["可选值"] }],
  "variants": [{ "combination": "状态组合", "imageUrl": "变体预览图URL" }],
  "interactions": [{ "action": "操作", "element": "元素", "feedback": "反馈" }],
  "contentGuidelines": [{ "element": "元素", "guideline": "内容要求", "example": "示例" }],
  "accessibility": { "keyboardNav": "键盘导航说明", "screenReader": "屏幕阅读器说明" },
  "technicalSpecs": { "figmaUrl": "Figma链接", "codeComponentName": "代码组件名" }
}
```

**输出模板 (COMPONENT_TEMPLATE_V4)**:
```markdown
---
id: [根据 componentName 生成 kebab-case id]
type: component
title: [componentName]
status: draft
createdAt: [当前日期 YYYY-MM-DD]
updatedAt: [当前日期 YYYY-MM-DD]
description: [description]
owner: '[待补充]'
tags: ['[待补充]']
version: '1.0.0'
componentType: [待补充: normal 或 global]
figmaUrl: [technicalSpecs.figmaUrl]
hasInteractive: false
interactiveUrl: ./[id].html
---

# [componentName]

## 1. 概述

### 1.1. 组件描述

[description]

### 1.2. 何时使用

[遍历 useCases 生成列表]

### 1.3. 何时不使用

[遍历 avoidUseCases 生成列表]

## 2. 视觉预览 (默认状态)

![默认状态预览]({{defaultPreviewImageUrl}})

## 3. 组件剖析

![组件剖析图]({{anatomyImageUrl}})

| 序号 | 元素名称 (Figma) | 功能描述 |
| :--- | :--- | :--- |
[遍历 elements 生成表格行]

## 4. 属性与状态

### 4.1. 状态维度

| 维度名称 | 属性 (Figma) | 描述 | 可选值 |
| :--- | :--- | :--- | :--- |
[遍历 properties 生成表格行]

### 4.2. 状态矩阵

| 状态组合 | 视觉预览 |
| :--- | :--- |
[遍历 variants 生成表格行]

## 5. 行为与交互

### 5.1. 用户操作

| 操作 | 元素 | 反馈 |
| :--- | :--- | :--- |
[遍历 interactions 生成表格行]

### 5.2. 条件逻辑规则

- **规则 1**: [待补充]

## 6. 内容指南

| 元素 | 内容要求 | 示例 |
| :--- | :--- | :--- |
[遍历 contentGuidelines 生成表格行]

## 7. 无障碍设计

| 准则 | 实现说明 |
| :--- | :--- |
| **键盘导航** | [accessibility.keyboardNav] |
| **屏幕阅读器** | [accessibility.screenReader] |

## 8. 技术规格

### 8.1. 关联关系

- **调用的 API**: [待补充]
- **依赖的组件**: [待补充]
- **被使用的页面**: [待补充]

### 8.2. 技术细节

- **Figma 组件链接**: [在 Figma 中查看]({{technicalSpecs.figmaUrl}})
- **代码组件名称**: `<{{technicalSpecs.codeComponentName}}>`
- **代码仓库路径**: `[待补充]`

## 9. 变更历史

| 日期 | 版本 | 变更内容 | 变更人 | Figma 版本 |
| :--- | :--- | :--- | :--- | :--- |
| [当前日期] | v1.0.0 | 初始版本 (AI 生成) | AI | [待补充] |
```

**你的任务现在开始。请根据提供的 `COMPONENT_DATA_JSON` 和 `COMPONENT_TEMPLATE_V4` 生成最终的 Markdown 文档。不要输出任何额外信息,只输出完整的 Markdown 内容。**

---
