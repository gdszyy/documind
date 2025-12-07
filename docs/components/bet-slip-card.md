---
id: 'bet-slip-card'
type: component
title: '投注单卡片'
status: draft
createdAt: '2025-12-07'
updatedAt: '2025-12-07'
description: '投注单卡片组件,用于在投注栏中展示单个投注选项的详细信息,包括赛事、盘口、赔率和投注金额。支持多种卡片状态(正常、锁定、失效)和输入状态(空值、聚焦、已填写),并根据状态动态显示或隐藏相关元素。'
owner: '@frontend-team'
tags: [betting, ui-component]
version: '1.0.0'
componentType: 'normal'
figmaUrl: 'https://www.figma.com/file/xxxx/documind?node-id=13:10227'
hasInteractive: true
interactiveUrl: https://github.com/gdszyy/documind/blob/main/docs/demos/bet-slip-card-interactive.html
---

# 投注单卡片 `[组件]`

## 1. 概述

投注单卡片组件用于在投注栏中展示用户选择的单个投注选项的详细信息，包括赛事信息、盘口、赔率和投注金额。组件支持多种卡片状态（正常、锁定、失效）和输入状态（空值、聚焦、已填写），并根据状态动态显示或隐藏相关元素，提升用户投注体验和交互效率。

主要应用场景包括在投注栏中展示用户选择的投注项，允许用户输入投注金额并查看预计派彩，通过快捷按钮快速设置常用投注金额，以及显示赔率变化和市场状态（锁定、失效）。该组件不适用于赛事列表中的赔率展示（应使用 Odds Button）和已结算的注单展示（应使用 Settled Bet Card）。

## 2. 视觉预览

![默认状态预览](https://via.placeholder.com/290x120.png/FFFFFF/2E2E2E?text=Bet+Slip+Card)

## 3. 组件剖析

![组件剖析图](https://via.placeholder.com/400x300.png/f8f9fa/343a40?text=Bet+Slip+Card+Anatomy)

| 序号 | 元素名称 (Figma) | 功能描述 |
| :--- | :--- | :--- |
| 1 | `.remove-button` | 左上角的移除按钮,点击可从投注栏中删除该注单 |
| 2 | `.match-info` | 赛事信息区域,包含比赛名称和联赛信息 |
| 3 | `.odds-display` | 赔率显示区域,根据赔率变化显示不同颜色,锁定状态下显示锁图标 |
| 4 | `.market-info` | 盘口信息区域,包含选项名称(如队伍名)和盘口名称(如 Match Winner) |
| 5 | `.stake-input` | 投注金额输入框,支持手动输入和快捷按钮填充 |
| 6 | `.quick-bet-buttons` | 快捷投注按钮组(+10, +50, +100),点击可快速增加投注金额 |
| 7 | `.payout-display` | 预计派彩显示区域,显示 'To Return $XX.XX' |
| 8 | `.lock-icon` | 锁定图标,在卡片锁定状态下替换赔率显示 |

## 4. 内容指南

| 元素 | 内容要求 | 示例 |
| :--- | :--- | :--- |
| `.match-info` | 比赛名称最多显示 30 个字符,超出部分用省略号;联赛信息格式为 '体育类型 / 联赛名称' | `Man United vs Liverpool, Soccer / Premier League` |
| `.odds-display` | 赔率保留两位小数,前缀 @ 符号,根据赔率变化显示不同颜色(绿色上升,红色下降,灰色默认) | `@2.75, @1.85` |
| `.market-info` | 选项名称使用红色粗体,盘口名称使用灰色常规字体 | `Man United (红色) Match Winner (灰色)` |
| `.stake-input` | 输入框内容为数字,前缀 $ 符号,支持千分位逗号分隔,最小值为 0 | `$0, $10, $3,000` |
| `.payout-display` | 显示格式为 'To Return $XX.XX',使用红色字体,保留两位小数 | `To Return $27.5` |

## 5. 属性与状态

### 5.1. 状态维度

| 维度名称 | 属性 (Figma) | 描述 | 可选值 |
| :--- | :--- | :--- | :--- |
| **CardState** | `status` | 卡片的整体状态 | `Normal`, `Locked`, `Invalid` |
| **InputState** | `inputStatus` | 输入框的状态 | `Default`, `Focused` |
| **InputValue** | `inputValue` | 输入框的值状态 | `Zero`, `Filled` |
| **MarketStatus** | `marketStatus` | 市场状态 | `Active`, `Suspended` |

### 5.2. 状态矩阵

| 状态组合 | 元素显隐说明 | 视觉预览 |
| :--- | :--- | :--- |
| `CardState=Normal, InputState=Default, InputValue=Zero` | 卡片正常显示，输入框为空，快捷按钮显示，赔率正常显示，无锁图标 | ![状态预览](https://via.placeholder.com/290x120.png/FFFFFF/2E2E2E?text=Normal+Empty) |
| `CardState=Normal, InputState=Focused, InputValue=Filled` | 输入框聚焦且有值，快捷按钮隐藏，边框变红，赔率正常显示 | ![状态预览](https://via.placeholder.com/290x140.png/FFFFFF/E80104?text=Focused+Filled) |
| `CardState=Normal, InputState=Default, InputValue=Filled` | 输入框有值但未聚焦，快捷按钮显示或预计派彩显示，赔率正常显示 | ![状态预览](https://via.placeholder.com/290x140.png/FFFFFF/2E2E2E?text=Normal+Filled) |
| `CardState=Invalid, InputState=Default, InputValue=Zero` | 卡片失效状态，显示失效样式，输入框为空，快捷按钮隐藏 | ![状态预览](https://via.placeholder.com/290x100.png/FEE2E2/6B7280?text=Invalid) |
| `CardState=Locked, InputState=Default, InputValue=Zero` | 卡片锁定状态，赔率显示锁图标，输入框为空，快捷按钮隐藏 | ![状态预览](https://via.placeholder.com/290x100.png/D0D0D0/8B8B8B?text=Locked) |

### 5.3. 交互状态

| 状态 | 描述 |
| :--- | :--- |
| **Hover** | 待补充 |
| **Focused** | 输入框获得焦点时，边框变为红色，快捷按钮隐藏 |
| **Disabled** | 待补充 |

## 6. 行为与交互

### 6.1. 用户操作

| 操作 | 元素 | 反馈 |
| :--- | :--- | :--- |
| **Click** | `.remove-button` | 触发 onRemove 回调,从投注栏中移除该注单卡片 |
| **Click** | `.quick-bet-buttons` | 将对应金额(10/50/100)累加到当前投注金额中 |
| **Focus** | `.stake-input` | 输入框获得焦点,边框变为红色,隐藏快捷按钮 |
| **Blur** | `.stake-input` | 输入框失去焦点,如果内容为空则自动填充为 0,显示快捷按钮或预计派彩 |
| **Input** | `.stake-input` | 实时计算并更新预计派彩金额(投注金额 × 赔率) |

### 6.2. 条件逻辑规则

- **规则 1**: 输入框聚焦时隐藏快捷投注按钮，显示红色边框
  - **当 (When)**: `.stake-input` 获得焦点
  - **则 (Then)**: 隐藏 `.quick-bet-buttons`，输入框边框变红

- **规则 2**: 输入框失去焦点且为空时，自动填充为 0 并显示快捷按钮或预计派彩
  - **当 (When)**: `.stake-input` 失去焦点且内容为空
  - **则 (Then)**: 输入框值设为 0，显示 `.quick-bet-buttons` 或 `.payout-display`

- **规则 3**: 点击快捷投注按钮时，增加对应金额到投注金额
  - **当 (When)**: 点击 `.quick-bet-buttons` 中的任一按钮
  - **则 (Then)**: 累加对应金额到 `.stake-input` 的当前值，更新预计派彩

- **规则 4**: 卡片状态为锁定时，赔率显示锁图标，禁止输入投注金额
  - **当 (When)**: `CardState=Locked`
  - **则 (Then)**: 显示 `.lock-icon` 替代 `.odds-display`，禁用 `.stake-input`

## 7. 使用示例

```jsx
import { BetSlipCard } from '@/components/path';

const Example = () => (
  <BetSlipCard
    status="Normal"
    inputStatus="Default"
    inputValue="Zero"
    marketStatus="Active"
    onRemove={() => console.log('Removed bet slip card')}
  />
);
```

## 8. 无障碍设计

| 准则 | 实现说明 |
| :--- | :--- |
| **键盘导航** | 用户可以使用 Tab 键在移除按钮、输入框和快捷按钮间切换,使用 Enter 键激活按钮 |
| **屏幕阅读器** | 应读出完整信息,例如:'投注单卡片,曼联对利物浦,足球英超联赛,曼联独赢,赔率 2.75,当前投注金额 10 美元,预计派彩 27.5 美元' |

## 9. 技术规格

> **注意**: 本章节内容主要为技术实现提供参考,其中部分内容(如 CSS 变量、代码组件名)可通过 AI 结合本文档自动生成。

### 9.1. 关联关系

- **调用的 API**: 待补充
- **依赖的组件**: 待补充
- **被使用的页面**: 待补充

### 9.2. 组件 Props

| Prop 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| `status` | `string` | `是` | `'Normal'` | 卡片的整体状态，支持 `Normal`、`Locked`、`Invalid` |
| `inputStatus` | `string` | `是` | `'Default'` | 输入框的状态，支持 `Default`、`Focused` |
| `inputValue` | `string` | `是` | `'Zero'` | 输入框的值状态，支持 `Zero`、`Filled` |
| `marketStatus` | `string` | `是` | `'Active'` | 市场状态，支持 `Active`、`Suspended` |
| `onRemove` | `function` | `否` | `undefined` | 点击移除按钮时触发的回调函数 |

### 9.3. 技术细节

- **Figma 组件链接**: [在 Figma 中查看](https://www.figma.com/file/xxxx/documind?node-id=13:10227)
- **代码组件名称**: `<BetSlipCard>`
- **代码仓库路径**: `src/components/path/to/BetSlipCard.tsx`

### 9.4. CSS 变量 (可通过 AI 生成)

| CSS 变量 | 默认值 | 描述 |
| :--- | :--- | :--- |
| `--bet-slip-card-bg-color` | `#FFFFFF` | 组件的背景颜色 |
| `--bet-slip-card-border-color` | `#E0E0E0` | 组件的边框颜色 |

## 10. 变更历史

| 日期 | 版本 | 变更内容 | 变更人 | Figma 版本 |
| :--- | :--- | :--- | :--- | :--- |
| 2025-12-07 | v1.0.0 | 初始版本 | @frontend-team | [v1.0] |

