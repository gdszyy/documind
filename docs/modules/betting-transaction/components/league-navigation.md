---
id: 'league-navigation'
type: component
title: '体育/联赛导航'
status: draft
createdAt: '2025-12-07'
updatedAt: '2025-12-07'
description: '以可折叠的树状结构展示所有体育项目和联赛，方便用户按层级筛选比赛。'
owner: '@frontend-team'
tags: [导航, 筛选, 全局]
version: '1.0.0'
componentType: 'global'
figmaUrl: 'https://www.figma.com/file/xxxx/documind'
hasInteractive: false
---

# 体育/联赛导航 `[组件]`

## 1. 概述

体育/联赛导航是一个全局侧边栏组件，它以树状结构（通常是手风琴效果）组织了平台支持的所有体育项目、国家/地区和联赛。用户可以通过它快速按类别筛选赛事列表，并能直观地看到每个分类下可投注的比赛数量。

## 2. 视觉预览

![默认状态预览](https://via.placeholder.com/300x700.png/1A1A1A/FFFFFF?text=League+Navigation)

## 3. 组件剖析

![组件剖析图](https://via.placeholder.com/300x700.png/1A1A1A/FFFFFF?text=League+Nav+Anatomy)

| 序号 | 元素名称 (Figma) | 功能描述 |
| :--- | :--- | :--- |
| 1 | `.sport-item` | 一级菜单，代表一个体育项目（如足球、篮球）。 |
| 2 | `.country-item` | 二级菜单，代表一个国家或地区。 |
| 3 | `.league-item` | 三级菜单，代表一个具体的联赛。 |
| 4 | `.event-count` | 显示在该分类下的赛事总数。 |
| 5 | `.expand-icon` | 用于展开或折叠下级菜单的图标。 |

## 4. 内容指南

| 元素 | 内容要求 | 示例 |
| :--- | :--- | :--- |
| `sport-item .name` | 体育项目名称应使用通用简称。 | `足球` |
| `league-item .name` | 联赛名称应完整，必要时可换行。 | `英格兰冠军联赛` |

## 5. 属性与状态

### 5.1. 状态维度

| 维度名称 | 属性 (Figma) | 描述 | 可选值 |
| :--- | :--- | :--- | :--- |
| **展开状态** | `Expanded` | 控制菜单项是否展开以显示其子项。 | `True`, `False` |
| **选中状态** | `Selected` | 标识用户当前选中的筛选路径。 | `True`, `False` |

### 5.2. 状态矩阵

| 状态组合 | 元素显隐说明 | 视觉预览 |
| :--- | :--- | :--- |
| `Expanded=False` | 子菜单项被隐藏，`.expand-icon` 指向右侧。 | ![折叠状态](https://via.placeholder.com/300x100.png/1A1A1A/FFFFFF?text=Collapsed) |
| `Expanded=True` | 显示所有直接子菜单项，`.expand-icon` 指向下方。 | ![展开状态](https://via.placeholder.com/300x300.png/1A1A1A/FFFFFF?text=Expanded) |
| `Selected=True` | 该菜单项背景高亮，表示当前赛事列表正按此项筛选。 | ![选中状态](https://via.placeholder.com/300x100.png/4CAF50/FFFFFF?text=Selected) |

## 6. 行为与交互

### 6.1. 用户操作

| 操作 | 元素 | 反馈 |
| :--- | :--- | :--- |
| **Click** | `.sport-item` 或 `.country-item` | 展开或折叠该项的子菜单。 |
| **Click** | `.league-item` | 更新赛事列表，仅显示该联赛下的比赛，并高亮该项为 `Selected` 状态。 |

## 7. 使用示例

```jsx
import { LeagueNavigation } from '@/components/global/LeagueNavigation';
import { useEvents } from '@/hooks/useEvents';

const SportsPage = () => {
  const { setLeagueFilter } = useEvents();

  return (
    <aside>
      <LeagueNavigation onLeagueSelect={(leagueId) => setLeagueFilter(leagueId)} />
    </aside>
  );
};
```

## 8. 无障碍设计

| 准则 | 实现说明 |
| :--- | :--- |
| **键盘导航** | 用户可使用 `上下箭头` 在菜单项之间移动，使用 `Enter` 或 `空格键` 展开/折叠或选中菜单项。 |
| **屏幕阅读器** | 当展开一个菜单时，播报“已展开，足球，包含25个国家”。当选中一个联赛时，播报“已选中，英超联赛，共10场比赛”。 |

## 9. 技术规格

### 9.1. 关联关系

- **调用的 API**: [@获取联赛结构](../apis/get-league-tree.md) (假设存在一个获取完整导航树的API)
- **被使用的页面**: 全局使用，通常在赛事列表页和实时赛事页的侧边栏。 

### 9.2. 组件 Props

| Prop 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| `treeData` | `array` | 是 | `[]` | 包含所有体育项目、国家和联赛层级关系的树状数据结构。 |
| `onLeagueSelect` | `function` | 是 | - | 当用户点击选择一个联赛时的回调函数，返回被选中的联赛ID。 |
| `activeLeagueId` | `string` | 否 | `null` | 当前激活的联赛ID，用于高亮显示。 |

### 9.3. 技术细节

- **Figma 组件链接**: [在 Figma 中查看](https://www.figma.com/file/xxxx/documind)
- **代码组件名称**: `<LeagueNavigation>`
- **代码仓库路径**: `src/components/global/LeagueNavigation.tsx`

## 10. 变更历史

| 日期 | 版本 | 变更内容 | 变更人 | Figma 版本 |
| :--- | :--- | :--- | :--- | :--- |
| 2025-12-07 | v1.0.0 | 初始版本，基于v6模板创建。 | @manus-ai | [v1.0] |
