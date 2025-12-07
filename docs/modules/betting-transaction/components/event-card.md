---
id: 'event-card'
type: component
title: '赛事卡片'
status: completed
createdAt: '2025-12-07'
updatedAt: '2025-12-07'
description: '在赛事列表页中，以卡片形式展示单场比赛的核心信息和主要盘口。'
owner: '@frontend-team'
tags: [赛事, 列表, 核心组件]
version: '1.1.0'
componentType: 'normal'
figmaUrl: 'https://www.figma.com/file/xxxx/documind'
hasInteractive: true
---

# 赛事卡片 `[组件]`

## 1. 概述

赛事卡片是赛事列表页的核心组成部分，用于以一种紧凑且信息丰富的方式展示单场比赛。它提供了比赛的关键信息（如对阵双方、开赛时间、实时比分），并直接展示了最主要的盘口（如1X2、让球、大小球），允许用户快速将选项添加到投注栏或导航到赛事详情页。

本组件采用 **Swiss Style (国际主义设计风格)**，强调网格对齐、高可读性和客观的数据展示。

## 2. 视觉预览

*(请参考 Figma 设计稿或在线演示)*

## 3. 组件剖析

| 序号 | 区域 | 功能描述 |
| :--- | :--- | :--- |
| 1 | **左侧信息区** | 包含比赛时间/状态、比赛阶段、主客队队徽及名称、实时比分。 |
| 2 | **中间盘口区** | 展示三个核心盘口：1x2 (胜平负)、Handicap (让球)、Total (大小球)。 |
| 3 | **右侧操作区** | 提供“更多玩法”按钮，显示剩余盘口数量，点击跳转详情页。 |

## 4. 数据来源与更新机制

### 4.1. 初始数据
组件初始化时，数据来源于 `/apis/get-events` 接口。

### 4.2. 实时更新
组件通过 WebSocket 监听 `odds_change` 消息，实时更新以下字段：
- **比分 (`score`)**：主客队进球数。
- **比赛时间 (`matchTime`)**：比赛进行时间（如 68:32）。
- **比赛阶段 (`matchStatus`)**：如 "1st Half", "2nd Half"。
- **赔率 (`odds`)**：盘口赔率的变化。

## 5. 交互逻辑

### 5.1. 状态显示逻辑
- **未开赛 (`not_started`)**：
  - 左侧显示比赛日期 (YY mm/dd) 和时间 (HH:MM)。
  - 比分显示为 `-`。
- **进行中 (`live`)**：
  - 左侧显示实时比赛时间（秒级跳动）和伤停补时。
  - 显示实时比分。
  - 显示比赛阶段（如 "1st Round"）。

### 5.2. 用户交互
| 操作 | 目标元素 | 行为 |
| :--- | :--- | :--- |
| **点击盘口选项** | 赔率按钮 | 切换选中状态。选中时背景变为深色 (`#2e2e2e`)，文字变白。阻止事件冒泡。 |
| **点击卡片主体** | 卡片背景 | 触发 `onCardClick`，通常跳转至赛事详情页。 |
| **点击更多按钮** | 右侧 `+120` 按钮 | 触发 `onCardClick`，跳转至赛事详情页。 |
| **悬停** | 卡片整体 | 背景色从 `bg-white/60` 变为 `bg-white/85`，增加视觉反馈。 |

## 6. 技术规格

### 6.1. TypeScript 接口

```typescript
export type MatchStatus = "not_started" | "live" | "ended" | "cancelled";

export interface MarketOutcome {
  id: string;
  name: string; // e.g., "1", "x", "2", "Over", "Under"
  odds: number;
  active: boolean;
}

export interface Market {
  id: string;
  name: string; // e.g., "1x2", "Handicap", "Total"
  outcomes: MarketOutcome[];
}

export interface EventData {
  id: string;
  status: MatchStatus;
  scheduleTime: string; // ISO string
  matchTime?: string; // e.g., "68:32"
  matchStatus?: string; // e.g., "1st Round"
  homeTeam: {
    name: string;
    logo: string;
    score: number;
  };
  awayTeam: {
    name: string;
    logo: string;
    score: number;
  };
  markets: {
    main: Market; // 1x2
    handicap?: Market;
    total?: Market;
  };
  marketCount: number;
}
```

### 6.2. 组件 Props

| Prop 名称 | 类型 | 是否必填 | 描述 |
| :--- | :--- | :--- | :--- |
| `event` | `EventData` | 否 (Demo用) | 包含赛事所有信息的对象。 |
| `onCardClick` | `(eventId: string) => void` | 否 | 点击卡片主体时的回调函数。 |
| `onOutcomeClick` | `(eventId: string, marketId: string, outcomeId: string) => void` | 否 | 点击盘口按钮时的回调函数。 |

## 7. 使用示例

```tsx
import EventCard from "@/components/EventCard";

// 在列表中使用
{events.map(event => (
  <EventCard 
    key={event.id} 
    event={event}
    onCardClick={(id) => router.push(`/events/${id}`)}
    onOutcomeClick={(evtId, mktId, outId) => addToBetSlip(evtId, mktId, outId)}
  />
))}
```

## 8. 变更历史

| 日期 | 版本 | 变更内容 | 变更人 |
| :--- | :--- | :--- | :--- |
| 2025-12-07 | v1.1.0 | 更新文档以匹配 Figma 像素级还原实现，添加 WebSocket 更新逻辑说明。 | @manus-ai |
| 2025-12-07 | v1.0.0 | 初始草稿。 | @frontend-team |
