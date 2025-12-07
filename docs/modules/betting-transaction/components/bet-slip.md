---
id: 'bet-slip'
type: component
title: '投注栏'
status: draft
createdAt: '2025-12-07'
updatedAt: '2025-12-07'
description: '管理用户的注单选择、待结算和已结算历史，是投注活动的核心枢纽。'
owner: '@frontend-team'
tags: [投注, 核心功能, 全局]
version: '3.0.0'
componentType: 'global'
figmaUrl: 'https://www.figma.com/file/xxxx/documind'
hasInteractive: false
---

# 投注栏 `[组件]`

## 1. 概述

投注栏是一个全局组件，通常固定在页面右侧（桌面端）或从底部滑出（移动端）。它是用户与投注功能交互的核心界面，集成了三大功能：管理当前待提交的注单（Slip），查看已提交但未结算的注单（Open），以及浏览近期已结算的注单历史（Settled）。

## 2. 视觉预览

![默认状态预览](https://via.placeholder.com/400x600.png/f8f9fa/343a40?text=Bet+Slip+Default+View)

## 3. 组件剖析

![组件剖析图](https://via.placeholder.com/400x600.png/f8f9fa/343a40?text=Bet+Slip+Anatomy)

| 序号 | 元素名称 (Figma) | 功能描述 |
| :--- | :--- | :--- |
| 1 | `.tab-nav` | 用于在“注单(Slip)”、“待结算(Open)”和“已结算(Settled)”三个视图间切换。 |
| 2 | `.tab-content` | 显示当前激活Tab对应的内容区域。 |
| 3 | `.bet-item` | 在各Tab中展示单个注单信息的卡片。 |
| 4 | `.summary-section` | 在“注单”Tab中，显示总赔率、总金额和预计奖金。 |
| 5 | `.action-footer` | 包含“接受赔率变化”和“提交投注”等主要操作按钮。 |

## 4. 内容指南

| 元素 | 内容要求 | 示例 |
| :--- | :--- | :--- |
| `bet-item.market-name` | 清晰显示盘口玩法和具体选项 | `全场赛果 - 主胜` |
| `bet-item.odds` | 保留两位小数 | `1.85` |
| `summary-section.total-odds` | 显示所有串关注单的总赔率，保留两位小数 | `总赔率 @ 3.52` |

## 5. 属性与状态

### 5.1. 状态维度

| 维度名称 | 属性 (Figma) | 描述 | 可选值 |
| :--- | :--- | :--- | :--- |
| **当前视图** | `Tab` | 控制显示哪个Tab的内容 | `Slip`, `Open`, `Settled` |
| **注单状态** | `SlipState` | 控制“注单”Tab的内部状态 | `Empty`, `Single`, `Multiple` |

### 5.2. 状态矩阵

| 状态组合 | 元素显隐说明 | 视觉预览 |
| :--- | :--- | :--- |
| `Tab=Slip, SlipState=Empty` | 显示空状态提示 `.empty-prompt`，隐藏 `.summary-section` 和 `.action-footer`。 | ![空状态](https://via.placeholder.com/400x200.png/f8f9fa/343a40?text=Empty+State) |
| `Tab=Slip, SlipState=Multiple` | 显示所有注单项，显示串关类型选择器和完整的汇总区域。 | ![串关状态](https://via.placeholder.com/400x600.png/f8f9fa/343a40?text=Parlay+View) |
| `Tab=Open` | 显示待结算的注单列表，隐藏操作按钮。 | ![待结算状态](https://via.placeholder.com/400x500.png/f8f9fa/343a40?text=Open+Bets) |

### 5.3. 交互状态

| 状态 | 描述 |
| :--- | :--- |
| **Hover** | 鼠标悬停在可点击的注单项或按钮上时，显示背景色或阴影变化。 |
| **Focused** | 使用键盘Tab键聚焦到输入框或按钮时，显示高亮外框。 |
| **Disabled** | 当“提交投注”按钮因余额不足或无有效注单而不可用时，按钮呈灰色且不可点击。 |

## 6. 行为与交互

### 6.1. 用户操作

| 操作 | 元素 | 反馈 |
| :--- | :--- | :--- |
| **Click** | `.tab-nav .tab-item` | 切换到对应的Tab视图，内容区域随之更新。 |
| **Click** | `bet-item .remove-btn` | 从“注单”列表中移除该注单项，并触发总赔率和奖金的重新计算。 |
| **Click** | `.action-footer .submit-btn` | 触发提交流程，调用 `place-bet` API。成功后清空注单并显示 `Toast` 提示。 |

### 6.2. 条件逻辑规则

- **规则 1**: 自动切换模式
  - **当 (When)**: “注单”列表中的项目从1个增加到2个。
  - **则 (Then)**: 视图自动从“单关”模式切换到“串关”模式，并显示串关类型选择器。

- **规则 2**: 赔率变化处理
  - **当 (When)**: WebSocket推送 `odds_change` 消息，且变化的盘口存在于当前注单中。
  - **则 (Then)**: 高亮显示变化的赔率，并显示“接受新赔率”按钮，禁用“提交投注”按钮直到用户确认为止。

## 7. 使用示例

```jsx
import { BetSlipProvider, useBetSlip } from '@/contexts/BetSlipContext';

// 在App根组件包裹Provider
const App = () => (
  <BetSlipProvider>
    {/* ...其他页面和组件... */}
  </BetSlipProvider>
);

// 在任何需要与投注栏交互的组件中使用
const EventCard = ({ market }) => {
  const { addBet } = useBetSlip();
  return <button onClick={() => addBet(market.selection)}>Add to Slip</button>;
};
```

## 8. 无障碍设计

| 准则 | 实现说明 |
| :--- | :--- |
| **键盘导航** | 用户可使用 `Tab` 键在Tab导航、注单项、输入框和操作按钮之间顺序切换。 |
| **屏幕阅读器** | 当Tab切换时，播报“已选择，注单，标签页，3之1”。当注单被添加时，播报“已添加 [赛事名称] 到注单”。 |

## 9. 技术规格

### 9.1. 关联关系

- **调用的 API**: [@提交投注](../apis/place-bet.md), [@获取待结算注单](../apis/get-open-bets.md), [@获取已结算注单](../apis/get-settled-bets.md)
- **依赖的组件**: [@注单项](../components/bet-item.md), [@模态消息](../components/modal-message.md), [@Toast](../components/toast.md)
- **被使用的页面**: 全局使用，在所有允许投注的页面中可见。

### 9.2. 组件 Props

| Prop 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| `position` | `string` | 否 | `'right'` | 投注栏在桌面端的位置，可选 `'right'`, `'bottom'`。 |
| `defaultTab` | `string` | 否 | `'slip'` | 默认显示的Tab，可选 `'slip'`, `'open'`, `'settled'`。 |

### 9.3. 技术细节

- **Figma 组件链接**: [在 Figma 中查看](https://www.figma.com/file/xxxx/documind)
- **代码组件名称**: `<BetSlip>`
- **代码仓库路径**: `src/components/global/BetSlip.tsx`

### 9.4. CSS 变量

| CSS 变量 | 默认值 | 描述 |
| :--- | :--- | :--- |
| `--bet-slip-bg-color` | `#1A1A1A` | 组件的背景颜色 |
| `--bet-slip-header-bg` | `#2C2C2C` | 头部和底部的背景颜色 |
| `--bet-slip-border-color` | `#444444` | 分割线的颜色 |

## 10. 变更历史

| 日期 | 版本 | 变更内容 | 变更人 | Figma 版本 |
| :--- | :--- | :--- | :--- | :--- |
| 2025-12-07 | v3.0.0 | 初始版本，基于v6模板创建，并集成三Tab结构。 | @manus-ai | [v3.0] |
