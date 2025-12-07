---
id: 'toast'
type: component
title: 'Toast'
status: draft
createdAt: '2025-12-07'
updatedAt: '2025-12-07'
description: '用于显示非侵入式的、短暂的通知消息，在几秒后会自动消失。'
owner: '@frontend-team'
tags: [消息, 通知, 全局]
version: '1.0.0'
componentType: 'global'
figmaUrl: 'https://www.figma.com/file/xxxx/documind'
hasInteractive: true
---

# Toast `[组件]`

## 1. 概述

Toast 是一个全局性的非侵入式消息组件，用于提供关于应用操作的简短反馈。它通常出现在屏幕的角落（如右上角或顶部中央），显示几秒钟后会自动消失，不会打断用户当前的工作流程。它非常适合用于确认操作成功（如“已添加到投注单”）、轻微的警告或提供即时信息。

## 2. 视觉预览

![默认状态预览](https://via.placeholder.com/350x60.png/2ECC71/FFFFFF?text=Success+Toast)

## 3. 组件剖析

![组件剖析图](https://via.placeholder.com/350x60.png/2ECC71/FFFFFF?text=Toast+Anatomy)

| 序号 | 元素名称 (Figma) | 功能描述 |
| :--- | :--- | :--- |
| 1 | `.toast-container` | Toast消息的主体容器。 |
| 2 | `.status-icon` | （可选）显示与消息类型对应的图标（如成功、失败）。 |
| 3 | `.message` | 显示通知的文本内容。 |
| 4 | `.close-button` | （可选）允许用户手动关闭Toast的按钮。 |

## 4. 内容指南

| 元素 | 内容要求 | 示例 |
| :--- | :--- | :--- |
| `message` | 消息文本应非常简短，清晰地传达操作结果。 | `已成功添加到注单！` |

## 5. 属性与状态

### 5.1. 状态维度

| 维度名称 | 属性 (Figma) | 描述 | 可选值 |
| :--- | :--- | :--- | :--- |
| **消息类型** | `Type` | 控制Toast的视觉样式，以反映消息的性质。 | `Info`, `Success`, `Warning`, `Error` |

### 5.2. 状态矩阵

| 状态组合 | 元素显隐说明 | 视觉预览 |
| :--- | :--- | :--- |
| `Type=Success` | 背景色为绿色，通常带有一个对勾图标。 | ![成功Toast](https://via.placeholder.com/350x60.png/2ECC71/FFFFFF?text=Success+Toast) |
| `Type=Error` | 背景色为红色，通常带有一个错误图标。 | ![错误Toast](https://via.placeholder.com/350x60.png/E74C3C/FFFFFF?text=Error+Toast) |

## 6. 行为与交互

### 6.1. 用户操作

| 操作 | 元素 | 反馈 |
| :--- | :--- | :--- |
| **Click** | `.close-button` | 立即关闭该条Toast消息。 |
| **Hover** | `.toast-container` | 当鼠标悬停在Toast上时，暂停其自动消失的计时器。 |

### 6.2. 条件逻辑规则

- **规则 1**: 自动消失
  - **当 (When)**: Toast被触发显示后。
  - **则 (Then)**: 在 `duration` 毫秒后，自动从界面上移除。

## 7. 使用示例

```jsx
import { useToast } from '@/contexts/ToastContext';

const AddToBetSlipButton = () => {
  const { showToast } = useToast();

  const handleClick = () => {
    // ...添加逻辑...
    showToast('已成功添加到注单！', { type: 'success' });
  };

  return <button onClick={handleClick}>添加</button>;
};
```

## 8. 无障碍设计

| 准则 | 实现说明 |
| :--- | :--- |
| **ARIA Live Regions** | Toast容器应使用 `role="alert"` 和 `aria-live="assertive"` 属性，以便屏幕阅读器能够在新消息出现时立即播报，而无需移动用户的焦点。 |

## 9. 技术规格

### 9.1. 关联关系

- **被使用的页面/组件**: 全局使用，可被任何需要提供非侵入式反馈的组件调用。

### 9.2. 组件 Props (通过 `showToast` 函数传递)

| Prop 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| `message` | `string` | 是 | - | 要显示的通知文本。 |
| `options.type` | `string` | 否 | `'info'` | Toast的类型，可选 `info`, `success`, `warning`, `error`。 |
| `options.duration` | `number` | 否 | `3000` | Toast显示的持续时间（毫秒）。 |

### 9.3. 技术细节

- **Figma 组件链接**: [在 Figma 中查看](https://www.figma.com/file/xxxx/documind)
- **代码组件名称**: `<ToastProvider>` / `useToast()`
- **代码仓库路径**: `src/components/global/ToastProvider.tsx`

## 10. 变更历史

| 日期 | 版本 | 变更内容 | 变更人 | Figma 版本 |
| :--- | :--- | :--- | :--- | :--- |
| 2025-12-07 | v1.0.0 | 初始版本，基于v6模板创建。 | @manus-ai | [v1.0] |
