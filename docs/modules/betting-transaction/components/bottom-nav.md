---
id: 'bottom-nav'
type: component
title: '底部导航栏'
status: draft
createdAt: '2025-12-07'
updatedAt: '2025-12-07'
description: '在移动端设备上提供核心功能的快捷访问入口。'
owner: '@frontend-team'
tags: [导航, 移动端, 全局]
version: '1.0.0'
componentType: 'global'
figmaUrl: 'https://www.figma.com/file/xxxx/documind'
hasInteractive: false
---

# 底部导航栏 `[组件]`

## 1. 概述

底部导航栏是一个专为移动端设计的全局组件，它固定在屏幕底部，为用户提供对应用最核心功能的即时访问。这确保了即使用户在页面的任何位置，也能轻松地在主要板块之间切换，提升了移动端的用户体验。

## 2. 视觉预览

![默认状态预览](https://via.placeholder.com/400x80.png/1A1A1A/FFFFFF?text=Bottom+Nav)

## 3. 组件剖析

![组件剖析图](https://via.placeholder.com/400x80.png/1A1A1A/FFFFFF?text=Bottom+Nav+Anatomy)

| 序号 | 元素名称 (Figma) | 功能描述 |
| :--- | :--- | :--- |
| 1 | `.nav-item` | 代表一个导航项，通常由一个图标和一个文本标签组成。 |
| 2 | `.nav-icon` | 导航项的图标，用于快速识别功能。 |
| 3 | `.nav-label` | 导航项的文本标签。 |

## 4. 内容指南

| 元素 | 内容要求 | 示例 |
| :--- | :--- | :--- |
| `nav-label` | 标签应极为简洁，通常为2个汉字。 | `首页` |

## 5. 属性与状态

### 5.1. 状态维度

| 维度名称 | 属性 (Figma) | 描述 | 可选值 |
| :--- | :--- | :--- | :--- |
| **选中状态** | `Active` | 标识用户当前所在的页面对应的导航项。 | `True`, `False` |

### 5.2. 状态矩阵

| 状态组合 | 元素显隐说明 | 视觉预览 |
| :--- | :--- | :--- |
| `Active=False` | 图标和文本使用默认颜色。 | ![未选中状态](https://via.placeholder.com/80x80.png/1A1A1A/FFFFFF?text=Inactive) |
| `Active=True` | 图标和文本高亮显示，以明确指示当前页面。 | ![选中状态](https://via.placeholder.com/80x80.png/4CAF50/FFFFFF?text=Active) |

## 6. 行为与交互

### 6.1. 用户操作

| 操作 | 元素 | 反馈 |
| :--- | :--- | :--- |
| **Click** | `.nav-item` | 导航到对应的页面路由，并更新导航栏的激活状态。 |

## 7. 使用示例

```jsx
import { BottomNav } from '@/components/global/BottomNav';
import { useRouter } from 'next/router';

const MobileLayout = ({ children }) => {
  const router = useRouter();
  const navLinks = [
    { text: '首页', href: '/', icon: <HomeIcon /> },
    { text: '体育', href: '/sports', icon: <SportsIcon /> },
    { text: '注单', href: '/betslip', icon: <BetSlipIcon /> },
    { text: '我的', href: '/profile', icon: <ProfileIcon /> },
  ];

  return (
    <div>
      <main>{children}</main>
      <BottomNav links={navLinks} activePath={router.pathname} />
    </div>
  );
};
```

## 8. 无障碍设计

| 准则 | 实现说明 |
| :--- | :--- |
| **键盘导航** | 在移动端，此组件主要通过触摸交互。如在桌面模拟器中使用，应支持左右箭头键切换焦点。 |
| **屏幕阅读器** | 当焦点在导航项上时，播报“标签页，[标签名称]，[位置]之[总数]”。 |

## 9. 技术规格

### 9.1. 关联关系

- **被使用的页面**: 全局使用，是移动端视图的父级布局的一部分。

### 9.2. 组件 Props

| Prop 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| `links` | `array` | 是 | `[]` | 定义导航链接的数组，每个对象包含 `text`, `href`, 和 `icon` 字段。 |
| `activePath` | `string` | 是 | - | 当前页面的路由路径，用于确定哪个链接应处于激活状态。 |

### 9.3. 技术细节

- **Figma 组件链接**: [在 Figma 中查看](https://www.figma.com/file/xxxx/documind)
- **代码组件名称**: `<BottomNav>`
- **代码仓库路径**: `src/components/global/BottomNav.tsx`

## 10. 变更历史

| 日期 | 版本 | 变更内容 | 变更人 | Figma 版本 |
| :--- | :--- | :--- | :--- | :--- |
| 2025-12-07 | v1.0.0 | 初始版本，基于v6模板创建。 | @manus-ai | [v1.0] |
