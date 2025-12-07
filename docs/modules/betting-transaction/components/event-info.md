---
id: 'event-info'
type: component
title: '赛事信息'
status: draft
createdAt: '2025-12-07'
updatedAt: '2025-12-07'
description: '在赛事详情页顶部，展示该场比赛的详细信息（对阵双方、比赛状态等）。'
owner: '@frontend-team'
tags: [赛事, 详情, 核心组件]
version: '1.0.0'
componentType: 'normal'
figmaUrl: 'https://www.figma.com/file/xxxx/documind'
hasInteractive: false
---

# 赛事信息 `[组件]`

## 1. 概述

赛事信息组件是赛事详情页的“头部”，它提供了关于当前比赛最核心、最全面的信息概览。这包括对阵双方的队名和队徽、当前的比赛状态（如时间、比分）、所属联赛，以及可能的直播源或动画直播入口。

## 2. 视觉预览

![默认状态预览](https://via.placeholder.com/1200x250.png/1A1A1A/FFFFFF?text=Event+Info+View)

## 3. 组件剖析

![组件剖析图](https://via.placeholder.com/1200x250.png/1A1A1A/FFFFFF?text=Event+Info+Anatomy)

| 序号 | 元素名称 (Figma) | 功能描述 |
| :--- | :--- | :--- |
| 1 | `.tournament-logo` | 显示赛事所属的联赛Logo。 |
| 2 | `.team-home` | 显示主队的队徽和名称。 |
| 3 | `.team-away` | 显示客队的队徽和名称。 |
| 4 | `.score-panel` | 显示当前的比分和比赛进行时间（或开赛日期）。 |
| 5 | `.live-animation-link` | （可选）提供一个入口，用于打开动画直播或视频直播。 |

## 4. 内容指南

| 元素 | 内容要求 | 示例 |
| :--- | :--- | :--- |
| `team-home .name` | 队名应完整显示，不截断。 | `曼彻斯特联` |
| `score-panel .time` | 滚球时显示分钟，赛前显示日期和时间。 | `75'` 或 `12-08 03:00` |

## 5. 属性与状态

### 5.1. 状态维度

| 维度名称 | 属性 (Figma) | 描述 | 可选值 |
| :--- | :--- | :--- | :--- |
| **比赛状态** | `Status` | 控制组件显示赛前、滚球还是赛后的视图。 | `PreMatch`, `Live`, `Ended` |

### 5.2. 状态矩阵

| 状态组合 | 元素显隐说明 | 视觉预览 |
| :--- | :--- | :--- |
| `Status=Live` | `.score-panel` 显示实时比分和分钟数，`.live-animation-link` 可见。 | ![滚球视图](https://via.placeholder.com/1200x250.png/1A1A1A/FFFFFF?text=Live+Event+Info) |
| `Status=Ended` | `.score-panel` 显示最终比分，并可能带有“已结束”标识。 | ![完赛视图](https://via.placeholder.com/1200x250.png/1A1A1A/FFFFFF?text=Ended+Event+Info) |

## 6. 行为与交互

### 6.1. 用户操作

| 操作 | 元素 | 反馈 |
| :--- | :--- | :--- |
| **Click** | `.live-animation-link` | 在新窗口或模态框中打开动画/视频直播。 |

## 7. 使用示例

```jsx
import { EventInfo } from '@/components/events/EventInfo';

const EventDetailPage = ({ event }) => (
  <div>
    <EventInfo event={event} />
    {/* ...其他页面内容... */}
  </div>
);
```

## 8. 无障碍设计

| 准则 | 实现说明 |
| :--- | :--- |
| **屏幕阅读器** | 完整播报比赛信息：“[联赛名称]，[主队名称] [主队得分]，对阵 [客队名称] [客队得分]，比赛进行到第 [时间] 分钟”。 |

## 9. 技术规格

### 9.1. 关联关系

- **调用的 API**: 无直接调用，数据由父页面传入。
- **被使用的页面**: [@赛事详情页](../pages/event-detail.md)

### 9.2. 组件 Props

| Prop 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| `event` | `object` | 是 | - | 包含赛事所有详细信息的对象。 |

### 9.3. 技术细节

- **Figma 组件链接**: [在 Figma 中查看](https://www.figma.com/file/xxxx/documind)
- **代码组件名称**: `<EventInfo>`
- **代码仓库路径**: `src/components/events/EventInfo.tsx`

## 10. 变更历史

| 日期 | 版本 | 变更内容 | 变更人 | Figma 版本 |
| :--- | :--- | :--- | :--- | :--- |
| 2025-12-07 | v1.0.0 | 初始版本，基于v6模板创建。 | @manus-ai | [v1.0] |
