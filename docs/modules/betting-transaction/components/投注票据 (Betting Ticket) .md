---
id: 'betting-ticket'
type: component
title: '投注票据 (Betting Ticket)'
status: draft
createdAt: '2025-12-08'
updatedAt: '2025-12-08'
description: '用于展示体育赛事投注详情、赔率及结算状态的卡片组件'
owner: '@frontend-team'
tags: [Betting, Card, Status]
version: '1.0.0'
componentType: 'normal'
figmaUrl: 'https://www.figma.com/file/...'
hasInteractive: true
interactiveUrl: ./betting-ticket.html
---

# 投注票据 (Betting Ticket) `[组件]`

## 1. 概述

投注票据组件是体育博彩应用中的核心元素，用于向用户展示单笔投注的详细信息。它包含了赛事信息、投注选项、赔率、本金、潜在赔付金额以及当前的结算状态。该组件旨在清晰地传达投注结果（赢、输、待定、作废），帮助用户快速了解其投注组合的表现。

## 2. 视觉预览

![投注票据预览](https://private-us-east-1.manuscdn.com/sessionFile/ofQO3LPWFxHiHc5edb78c5/sandbox/mWEUnPXSGPrYkN5RIxLQ26-images_1765127718068_na1fn_L2hvbWUvdWJ1bnR1L2RvY3VtaW5kL2RvY3MvbW9kdWxlcy9iZXR0aW5nLXRyYW5zYWN0aW9uL2NvbXBvbmVudHMvYXNzZXRzL2JldHRpbmctdGlja2V0LXByZXZpZXc.png?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvb2ZRTzNMUFdGeEhpSGM1ZWRiNzhjNS9zYW5kYm94L21XRVVuUFhTR1ByWWtONVJJeExRMjYtaW1hZ2VzXzE3NjUxMjc3MTgwNjhfbmExZm5fTDJodmJXVXZkV0oxYm5SMUwyUnZZM1Z0YVc1a0wyUnZZM012Ylc5a2RXeGxjeTlpWlhSMGFXNW5MWFJ5WVc1ellXTjBhVzl1TDJOdmJYQnZibVZ1ZEhNdllYTnpaWFJ6TDJKbGRIUnBibWN0ZEdsamEyVjBMWEJ5WlhacFpYYy5wbmciLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=o3jFdbwZNqp0KxWqRExqOQOMIHV24WR09EI6GCpUyGoJ4Rsw-cbW2g9kBv0yGseV7emM8KrwdtvarFP9poeOckwwtntRBPAPnAF4x1vFA900vxzUBoo14xImWYPWWgcWswD1G19kIfw66HMOweuAcQY-eGHA9PElc3C6sWsg7p86YprQU9FXiJibX~ZrHZMJQxugqdoC1gY2g3mYesF-CB2qcVVkoUBm18wd5GL9KSc4~2bTlyGu7BPX5hS3etAeGexjGnWMwP4hj7vVwIABp1fJsmNi3j9yYOkuReDsUBjxkKUx15XfqP2qCZEz5DD0FVZHNQCI7ktQf5SQgxSpVA__)

## 3. 组件剖析

| 序号 | 元素名称 (Figma) | 功能描述 |
| :--- | :--- | :--- |
| 1 | `GroupSettleTime` | 显示投注结算的具体时间 |
| 2 | `StatusBadge` | 显示当前投注状态（Won/Lost/Pending/Void） |
| 3 | `GroupMatchInfo` | 展示比赛双方队伍名称及联赛信息 |
| 4 | `GroupOdds` | 显示该笔投注的赔率 |
| 5 | `GroupMarketInfo` | 展示具体的投注玩法（如 Match Winner）及所选队伍 |
| 6 | `GroupOutcome` | 显示比赛最终比分（仅在已结算状态下显示） |
| 7 | `GroupStake` | 显示用户投入的本金金额 |
| 8 | `GroupPayout` | 显示根据赔率计算出的赔付金额 |

## 4. 内容指南

| 元素 | 内容要求 | 示例 |
| :--- | :--- | :--- |
| `Settle Time` | 格式为 YYYY-MM-DD HH:mm:ss，待定状态显示 "-" | `2025-01-01 12:09:07` |
| `Match Name` | 格式为 "主队 vs 客队" | `Man United vs Liverpool` |
| `Odds` | 必须以 "@" 开头，保留两位小数 | `@2.75` |
| `Stake/Payout` | 必须包含货币符号，保留两位小数 | `$25.00` |

## 5. 属性与状态

### 5.1. 状态维度

| 维度名称 | 属性 (Figma) | 描述 | 可选值 |
| :--- | :--- | :--- | :--- |
| **Status** | `Property 1` | 票据的结算状态 | `Won`, `Lost`, `Pending`, `Void` |

### 5.2. 状态矩阵

| 状态组合 | 元素显隐说明 | 视觉表现 |
| :--- | :--- | :--- |
| `Status=Won` | 显示完整信息，Payout 金额为正数 | 状态标签及赔付金额为绿色 (#0c9c16) |
| `Status=Lost` | 显示完整信息，Payout 金额为 $0.00 | 状态标签及赔付金额为红色 (#b30505) |
| `Status=Pending` | Settle Time 显示 "-"，Payout 显示 "—" | 状态标签为橙色 (#d89600)，赔付金额为待定 |
| `Status=Void` | 整体透明度降低 (opacity-60)，Payout 为空 | 状态标签为灰色 (#a0a0a0)，整体呈现失效感 |

### 5.3. 交互状态

| 状态 | 描述 |
| :--- | :--- |
| **Hover** | 鼠标悬停时，卡片背景色微调或添加阴影以提升层级感 |
| **Default** | 默认状态下背景为白色半透明 (bg-white/60) |

## 6. 行为与交互

### 6.1. 用户操作

| 操作 | 元素 | 反馈 |
| :--- | :--- | :--- |
| **Click** | `Ticket` | 点击票据可跳转至该场比赛的详情页面或投注详情页 |

## 7. 使用示例

```jsx
import { Ticket } from '@/components/Ticket';

const Example = () => (
  <Ticket
    status="Won"
    settleTime="2025-01-01 12:09:07"
    matchName="Man United vs Liverpool"
    leagueName="Soccer / Premier League"
    teamName="Man United"
    marketName="Match Winner"
    odds="@2.75"
    outcome="2-1"
    stake="$25.00"
    payout="$25.00"
  />
);
```

## 8. 无障碍设计

| 准则 | 实现说明 |
| :--- | :--- |
| **颜色对比度** | 确保状态颜色（红/绿/橙）与背景有足够的对比度，同时辅以文字说明 |
| **屏幕阅读器** | 应朗读完整的投注信息，包括状态、比赛、投注项及金额 |

## 9. 技术规格

### 9.1. 关联关系

- **调用的 API**: `/api/bets/{betId}`
- **依赖的组件**: 无
- **被使用的页面**: `MyBets`, `BetHistory`

### 9.2. 组件 Props

| Prop 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| `status` | `'Won' \| 'Lost' \| 'Pending' \| 'Void'` | 是 | - | 票据状态 |
| `matchName` | `string` | 是 | - | 比赛名称 |
| `odds` | `string` | 是 | - | 赔率 |
| `stake` | `string` | 是 | - | 本金 |
| `payout` | `string` | 否 | - | 赔付金额 |

### 9.3. CSS 变量

| CSS 变量 | 默认值 | 描述 |
| :--- | :--- | :--- |
| `--ticket-bg` | `rgba(255, 255, 255, 0.6)` | 票据背景色 |
| `--status-won` | `#0c9c16` | 赢状态颜色 |
| `--status-lost` | `#b30505` | 输状态颜色 |
| `--status-pending` | `#d89600` | 待定状态颜色 |
| `--status-void` | `#a0a0a0` | 作废状态颜色 |

## 10. 变更历史

| 日期 | 版本 | 变更内容 | 变更人 |
| :--- | :--- | :--- | :--- |
| 2025-12-08 | v1.0.0 | 初始版本，基于 Figma 设计还原 | @Manus |
