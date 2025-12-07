---
id: 'navbar'
type: component
title: '顶部导航栏'
status: draft
createdAt: '2025-12-07'
updatedAt: '2025-12-07'
description: '提供站点级别的核心功能导航，并展示用户状态信息。'
owner: '@frontend-team'
tags: [导航, 核心功能, 全局]
version: '1.0.0'
componentType: 'global'
figmaUrl: 'https://www.figma.com/file/xxxx/documind'
hasInteractive: false
---

# 顶部导航栏 `[组件]`

## 1. 概述

顶部导航栏（Navbar）是一个全局组件，固定在所有页面的顶部。它为用户提供了访问平台核心功能模块（如体育、滚球、赛果）的稳定入口，并在用户登录后展示其账户信息（如余额）和关键操作（如充值、提现）。

## 2. 视觉预览

![默认状态预览](https://via.placeholder.com/1200x80.png/1A1A1A/FFFFFF?text=Navbar+Default+View)

## 3. 组件剖析

![组件剖析图](https://via.placeholder.com/1200x80.png/1A1A1A/FFFFFF?text=Navbar+Anatomy)

| 序号 | 元素名称 (Figma) | 功能描述 |
| :--- | :--- | :--- |
| 1 | `.logo` | 显示平台Logo，点击后通常返回首页。 |
| 2 | `.main-nav-links` | 包含指向核心功能模块的链接，如“体育”、“滚球”、“电竞”等。 |
| 3 | `.user-profile` | 用户信息区域，在登录后显示。 |
| 4 | `.balance-display` | 显示用户当前账户余额。 |
| 5 | `.action-buttons` | 包含“充值”、“提现”等主要操作按钮。 |
| 6 | `.auth-buttons` | 在用户未登录时显示“登录”和“注册”按钮。 |

## 4. 内容指南

| 元素 | 内容要求 | 示例 |
| :--- | :--- | :--- |
| `main-nav-links` | 链接文本应简洁明了，不超过4个汉字。 | `体育` |
| `balance-display` | 货币符号在前，千分位分隔，保留两位小数。 | `R$ 1,234.56` |

## 5. 属性与状态

### 5.1. 状态维度

| 维度名称 | 属性 (Figma) | 描述 | 可选值 |
| :--- | :--- | :--- | :--- |
| **登录状态** | `Auth` | 控制导航栏显示用户登录前还是登录后的视图。 | `Guest`, `Authenticated` |

### 5.2. 状态矩阵

| 状态组合 | 元素显隐说明 | 视觉预览 |
| :--- | :--- | :--- |
| `Auth=Guest` | 显示 `.auth-buttons` (登录/注册)，隐藏 `.user-profile`。 | ![访客视图](https://via.placeholder.com/1200x80.png/1A1A1A/FFFFFF?text=Navbar+Guest+View) |
| `Auth=Authenticated` | 显示 `.user-profile` (用户信息和余额)，隐藏 `.auth-buttons`。 | ![登录视图](https://via.placeholder.com/1200x80.png/1A1A1A/FFFFFF?text=Navbar+Authenticated+View) |

### 5.3. 交互状态

| 状态 | 描述 |
| :--- | :--- |
| **Hover** | 鼠标悬停在导航链接或按钮上时，文本或背景高亮。 |
| **Active** | 当前所在页面的对应导航链接会保持高亮状态。 |

## 6. 行为与交互

### 6.1. 用户操作

| 操作 | 元素 | 反馈 |
| :--- | :--- | :--- |
| **Click** | `.main-nav-links a` | 导航到对应的页面路由。 |
| **Click** | `.auth-buttons .login-btn` | 打开登录模态框。 |
| **Click** | `.action-buttons .deposit-btn` | 导航到充值页面。 |

## 7. 使用示例

```jsx
import { Navbar } from '@/components/global/Navbar';
import { useAuth } from '@/contexts/AuthContext';

const Layout = ({ children }) => {
  const { user, balance } = useAuth();

  return (
    <div>
      <Navbar user={user} balance={balance} />
      <main>{children}</main>
    </div>
  );
};
```

## 8. 无障碍设计

| 准则 | 实现说明 |
| :--- | :--- |
| **键盘导航** | 用户可使用 `Tab` 键在Logo、导航链接和右侧用户操作按钮之间顺序导航。 |
| **屏幕阅读器** | 当焦点在余额上时，播报“当前余额，雷亚尔1234.56”。 |

## 9. 技术规格

### 9.1. 关联关系

- **调用的 API**: [@获取用户余额](../apis/get-user-balance.md)
- **被使用的页面**: 全局使用，是所有页面的父级布局的一部分。

### 9.2. 组件 Props

| Prop 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| `user` | `object` | 否 | `null` | 当前登录的用户对象。如果为 `null`，则显示访客视图。 |
| `balance` | `number` | 否 | `0` | 用户的账户余额。 |
| `navLinks` | `array` | 是 | - | 定义主导航链接的数组，包含 `text` 和 `href` 字段。 |

### 9.3. 技术细节

- **Figma 组件链接**: [在 Figma 中查看](https://www.figma.com/file/xxxx/documind)
- **代码组件名称**: `<Navbar>`
- **代码仓库路径**: `src/components/global/Navbar.tsx`

### 9.4. CSS 变量

| CSS 变量 | 默认值 | 描述 |
| :--- | :--- | :--- |
| `--navbar-bg-color` | `#1A1A1A` | 导航栏的背景颜色 |
| `--navbar-link-color` | `#FFFFFF` | 导航链接的默认文字颜色 |
| `--navbar-link-active-color` | `#4CAF50` | 激活状态的导航链接文字颜色 |

## 10. 变更历史

| 日期 | 版本 | 变更内容 | 变更人 | Figma 版本 |
| :--- | :--- | :--- | :--- | :--- |
| 2025-12-07 | v1.0.0 | 初始版本，基于v6模板创建。 | @manus-ai | [v1.0] |
