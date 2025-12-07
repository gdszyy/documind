---
id: 'odds-list'
type: component
title: '盘口列表'
status: draft
createdAt: '2025-12-07'
updatedAt: '2025-12-07'
description: '在赛事详情页中，按盘口类型组织和展示所有可投注的盘口。'
owner: '@frontend-team'
tags: [赛事, 详情, 盘口]
version: '1.0.0'
componentType: 'normal'
figmaUrl: 'https://www.figma.com/file/xxxx/documind'
hasInteractive: false
---

# 盘口列表 `[组件]`

## 1. 概述

盘口列表是赛事详情页的主体内容，它负责以清晰、有组织的方式展示一场比赛所有可用的投注盘口。组件通常使用Tab或手风琴来对盘口进行分类（如全场、半场、角球等），并在每个分类下以列表或网格形式展示具体的盘口和赔率。

## 2. 视觉预览

![默认状态预览](https://via.placeholder.com/1200x800.png/1A1A1A/FFFFFF?text=Odds+List+View)

## 3. 组件剖析

![组件剖析图](https://via.placeholder.com/1200x800.png/1A1A1A/FFFFFF?text=Odds+List+Anatomy)

| 序号 | 元素名称 (Figma) | 功能描述 |
| :--- | :--- | :--- |
| 1 | `.market-group-tabs` | 用于切换不同盘口分类的Tab导航。 |
| 2 | `.market-group` | 单个盘口分组，通常包含一个标题和一个或多个盘口。 |
| 3 | `.market-header` | 盘口分组的标题，可折叠/展开内容。 |
| 4 | `.market-row` | 单个盘口行，包含盘口名称和对应的赔率按钮。 |
| 5 | `.odds-button` | 代表一个可投注的赔率选项。 |

## 4. 内容指南

| 元素 | 内容要求 | 示例 |
| :--- | :--- | :--- |
| `market-group-tabs .tab` | 分类名称应为行业标准术语。 | `主要`、`进球`、`半场` |
| `market-row .market-name` | 盘口名称应清晰易懂。 | `两队都进球` |

## 5. 属性与状态

### 5.1. 状态维度

| 维度名称 | 属性 (Figma) | 描述 | 可选值 |
| :--- | :--- | :--- | :--- |
| **盘口状态** | `MarketStatus` | 控制单个盘口的显示状态。 | `Active`, `Suspended` (封盘), `Deactivated` (关闭) |
| **赔率变化** | `OddsChange` | 标识赔率是上升还是下降。 | `Up`, `Down`, `None` |

### 5.2. 状态矩阵

| 状态组合 | 元素显隐说明 | 视觉预览 |
| :--- | :--- | :--- |
| `MarketStatus=Suspended` | 整个 `.market-row` 变灰，并显示锁定图标，所有 `.odds-button` 不可点击。 | ![封盘状态](https://via.placeholder.com/1200x100.png/333333/FFFFFF?text=Market+Suspended) |
| `OddsChange=Up` | 对应的 `.odds-button` 短暂显示绿色背景和向上箭头。 | ![赔率上升](https://via.placeholder.com/150x50.png/2ECC71/FFFFFF?text=1.95+▲) |
| `OddsChange=Down` | 对应的 `.odds-button` 短暂显示红色背景和向下箭头。 | ![赔率下降](https://via.placeholder.com/150x50.png/E74C3C/FFFFFF?text=1.80+▼) |

## 6. 行为与交互

### 6.1. 用户操作

| 操作 | 元素 | 反馈 |
| :--- | :--- | :--- |
| **Click** | `.market-group-tabs .tab` | 切换到对应的盘口分类视图。 |
| **Click** | `.odds-button` | 将该投注选项添加到投注栏。如果已在投注栏中，则将其移除。 |

## 7. 使用示例

```jsx
import { OddsList } from '@/components/events/OddsList';

const EventDetailPage = ({ event }) => (
  <div>
    {/* ...EventInfo... */}
    <OddsList markets={event.markets} />
  </div>
);
```

## 8. 无障碍设计

| 准则 | 实现说明 |
| :--- | :--- |
| **键盘导航** | 用户可使用 `Tab` 在不同的赔率按钮之间导航。 |
| **屏幕阅读器** | 当赔率变化时，使用 `aria-live` 区域播报：“[盘口名称] 赔率已从 [旧赔率] 变为 [新赔率]”。 |

## 9. 技术规格

### 9.1. 关联关系

- **调用的 API**: 无直接调用，数据由父页面通过 [@获取赛事详情](../apis/get-event-detail.md) 获取后传入。
- **依赖的组件**: 无。
- **被使用的页面**: [@赛事详情页](../pages/event-detail.md)

### 9.2. 组件 Props

| Prop 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| `markets` | `array` | 是 | `[]` | 包含赛事所有盘口信息的数组。 |
| `onOddsClick` | `function` | 否 | - | 点击赔率按钮时的回调函数。 |

### 9.3. 技术细节

- **Figma 组件链接**: [在 Figma 中查看](https://www.figma.com/file/xxxx/documind)
- **代码组件名称**: `<OddsList>`
- **代码仓库路径**: `src/components/events/OddsList.tsx`

## 10. 变更历史

| 日期 | 版本 | 变更内容 | 变更人 | Figma 版本 |
| :--- | :--- | :--- | :--- | :--- |
| 2025-12-07 | v1.0.0 | 初始版本，基于v6模板创建。 | @manus-ai | [v1.0] |
