---
id: 'event-card'
type: component
title: '赛事卡片'
status: draft
createdAt: '2025-12-07'
updatedAt: '2025-12-07'
description: '在赛事列表页中，以卡片形式展示单场比赛的核心信息和主要盘口。'
owner: '@frontend-team'
tags: [赛事, 列表, 核心组件]
version: '1.0.0'
componentType: 'normal'
figmaUrl: 'https://www.figma.com/file/xxxx/documind'
hasInteractive: false
---

# 赛事卡片 `[组件]`

## 1. 概述

赛事卡片是赛事列表页的核心组成部分，用于以一种紧凑且信息丰富的方式展示单场比赛。它提供了比赛的关键信息（如对阵双方、开赛时间、实时比分），并直接展示了最主要的盘口（如1X2、让球、大小球），允许用户快速将选项添加到投注栏或导航到赛事详情页。

## 2. 视觉预览

![默认状态预览](https://via.placeholder.com/800x200.png/1A1A1A/FFFFFF?text=Event+Card+Default+View)

## 3. 组件剖析

![组件剖析图](https://via.placeholder.com/800x200.png/1A1A1A/FFFFFF?text=Event+Card+Anatomy)

| 序号 | 元素名称 (Figma) | 功能描述 |
| :--- | :--- | :--- |
| 1 | `.header` | 显示比赛所属的联赛名称和开赛时间。 |
| 2 | `.teams-info` | 显示对阵双方的队名和队徽。 |
| 3 | `.live-info` | 在滚球比赛中显示实时比分和比赛进行时间。 |
| 4 | `.main-markets` | 展示该场比赛最主要的几个盘口及其赔率。 |
| 5 | `.stats-link` | 提供一个链接到赛事详情页的入口，通常显示为“+更多玩法”。 |

## 4. 内容指南

| 元素 | 内容要求 | 示例 |
| :--- | :--- | :--- |
| `teams-info .team-name` | 队名最多显示10个汉字，超出部分用...截断。 | `曼彻斯特联` |
| `main-markets .odds-btn` | 按钮内同时显示选项名称和赔率。 | `主胜 1.85` |

## 5. 属性与状态

### 5.1. 状态维度

| 维度名称 | 属性 (Figma) | 描述 | 可选值 |
| :--- | :--- | :--- | :--- |
| **比赛状态** | `Status` | 控制卡片显示赛前、滚球还是赛后的视图。 | `PreMatch`, `Live`, `Ended` |

### 5.2. 状态矩阵

| 状态组合 | 元素显隐说明 | 视觉预览 |
| :--- | :--- | :--- |
| `Status=PreMatch` | 显示开赛时间，隐藏 `.live-info`。 | ![赛前视图](https://via.placeholder.com/800x200.png/1A1A1A/FFFFFF?text=PreMatch+View) |
| `Status=Live` | 显示 `.live-info`（实时比分和时间），隐藏开赛时间。赔率会动态闪烁。 | ![滚球视图](https://via.placeholder.com/800x200.png/1A1A1A/FFFFFF?text=Live+View) |
| `Status=Ended` | 显示最终比分，禁用所有盘口按钮。 | ![赛后视图](https://via.placeholder.com/800x200.png/1A1A1A/FFFFFF?text=Ended+View) |

### 5.3. 交互状态

| 状态 | 描述 |
| :--- | :--- |
| **Hover** | 鼠标悬停在盘口按钮上时，按钮背景色变亮。 |
| **Selected** | 当一个盘口选项已被添加到投注栏时，该按钮保持高亮状态。 |

## 6. 行为与交互

### 6.1. 用户操作

| 操作 | 元素 | 反馈 |
| :--- | :--- | :--- |
| **Click** | `.main-markets .odds-btn` | 将该盘口选项添加到投注栏。如果已添加，则移除。触发 `Toast` 提示。 |
| **Click** | `.stats-link` 或卡片主体区域 | 导航到该赛事的详情页 (`/events/:eventId`)。 |

## 7. 使用示例

```jsx
import { EventCard } from '@/components/events/EventCard';

const EventList = ({ events }) => (
  <div>
    {events.map(event => (
      <EventCard 
        key={event.id} 
        event={event} 
        onOddsClick={(selection) => console.log('Odds clicked:', selection)}
      />
    ))}
  </div>
);
```

## 8. 无障碍设计

| 准则 | 实现说明 |
| :--- | :--- |
| **键盘导航** | 用户可使用 `Tab` 键在卡片内的各个盘口按钮和“更多玩法”链接之间导航。 |
| **屏幕阅读器** | 完整播报卡片信息：“[联赛名称]，[主队] 对阵 [客队]，[比赛状态]。主胜赔率[赔率]，平局赔率[赔率]...” |

## 9. 技术规格

### 9.1. 关联关系

- **调用的 API**: 无直接调用，数据由父组件传入。
- **依赖的组件**: 无。
- **被使用的页面**: [@赛事列表页](../pages/event-list.md), [@实时赛事页](../pages/live-event.md)

### 9.2. 组件 Props

| Prop 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| `event` | `object` | 是 | - | 包含赛事所有信息的对象。 |
| `onOddsClick` | `function` | 否 | - | 点击盘口按钮时的回调函数，返回被点击的选项信息。 |
| `onCardClick` | `function` | 否 | - | 点击卡片主体时的回调函数。 |

### 9.3. 技术细节

- **Figma 组件链接**: [在 Figma 中查看](https://www.figma.com/file/xxxx/documind)
- **代码组件名称**: `<EventCard>`
- **代码仓库路径**: `src/components/events/EventCard.tsx`

### 9.4. CSS 变量

| CSS 变量 | 默认值 | 描述 |
| :--- | :--- | :--- |
| `--event-card-bg` | `#2C2C2C` | 卡片的背景颜色 |
| `--event-card-border` | `1px solid #444` | 卡片的边框样式 |
| `--odds-btn-bg-hover` | `#4CAF50` | 盘口按钮悬停时的背景色 |

## 10. 变更历史

| 日期 | 版本 | 变更内容 | 变更人 | Figma 版本 |
| :--- | :--- | :--- | :--- | :--- |
| 2025-12-07 | v1.0.0 | 初始版本，基于v6模板创建。 | @manus-ai | [v1.0] |
