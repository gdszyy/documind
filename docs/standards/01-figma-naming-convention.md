# DocuMind: Figma 命名规范指南

## 1. 概述

本指南为设计师提供了一套标准的 Figma 命名规范。遵循此规范是实现“设计即文档”自动化流程的**第一步也是最关键的一步**。清晰、一致的命名是让 AI 和自动化脚本能够准确理解并解析您设计的语言。

## 2. 核心原则

- **语义化**: 名称应清晰地反映其功能和层级。
- **结构化**: 使用斜杠 `/` 来创建层级和分类。
- **一致性**: 在整个设计系统中保持命名风格的统一。

## 3. 四级命名结构

我们采用 `分类 / 组件 / 变体 / 元素` 的四级结构来组织所有组件。

### 3.1. 第一级: 分类 (Category)

**格式**: `[分类名称]` (首字母大写)

**目的**: 对组件进行高级别的分组,通常对应业务领域或功能类型。

**示例**:
- `Form/`
- `Navigation/`
- `Betting/`
- `Global/`

### 3.2. 第二级: 组件 (Component)

**格式**: `[组件名称]` (首字母大写)

**目的**: 定义组件的名称,这是组件的核心标识。

**示例**:
- `Form / Button`
- `Betting / BetCard`
- `Global / BetSlip`

### 3.3. 第三级: 变体 (Variant)

**格式**: `[属性1]=[值1], [属性2]=[值2]`

**目的**: 定义组件的不同状态和样式。这是 Figma 的变体 (Variants) 功能的标准用法。

**示例**:
- `Form / Button / Type=Primary, State=Default`
- `Form / Button / Type=Secondary, State=Hover`
- `Betting / BetCard / Live=True, State=Selected`

### 3.4. 第四级: 元素 (Element)

**格式**: `.[元素名称]` (以点 `.` 开头, kebab-case)

**目的**: 标记组件内部的关键子元素,以便 AI 能够识别并描述它们。

**示例**:
- 在 `Betting / BetCard` 组件内部:
  - `.header-section`
  - `.team-name`
  - `.odds-button`
  - `.remove-icon`

## 4. 完整示例: 一个按钮组件

假设我们正在设计一个按钮组件,它有主要/次要两种类型,以及默认/悬停/禁用三种状态。

**Figma 中的图层结构**:

```
Form / Button
  ├─ Type=Primary, State=Default
  │   └─ .text-label
  ├─ Type=Primary, State=Hover
  │   └─ .text-label
  ├─ Type=Primary, State=Disabled
  │   └─ .text-label
  ├─ Type=Secondary, State=Default
  │   └─ .text-label
  ├─ Type=Secondary, State=Hover
  │   └─ .text-label
  └─ Type=Secondary, State=Disabled
      └─ .text-label
```

**自动化脚本解析结果**:

- **组件名称**: `Button`
- **分类**: `Form`
- **变体属性**:
  - `Type`: `Primary`, `Secondary`
  - `State`: `Default`, `Hover`, `Disabled`
- **内部元素**:
  - `.text-label`

## 5. 最佳实践

- **从全局到局部**: 命名时遵循从大到小的顺序: `分类 / 组件 / ...`。
- **使用英文**: 所有命名都应使用清晰的英文,避免使用缩写或拼音。
- **善用变体**: 充分利用 Figma 的变体功能来管理状态,而不是创建多个独立的组件。
- **标记关键元素**: 只需标记需要被文档描述的关键内部元素,无需标记每一个图层。
- **保持简洁**: 在保证语义清晰的前提下,尽量让名称保持简洁。

遵循这些规范,您的设计稿将不仅仅是视觉稿,更是一份结构化的、可供机器读取的“设计数据”,为实现高效的自动化文档流程奠定坚实的基础。
