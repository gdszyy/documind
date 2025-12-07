---
id: 'modal-message'
type: component
title: '模态消息'
status: draft
createdAt: '2025-12-07'
updatedAt: '2025-12-07'
description: '用于显示需要用户明确响应的关键信息、确认操作或警告，会中断用户流程。'
owner: '@frontend-team'
tags: [消息, 弹窗, 全局]
version: '1.0.0'
componentType: 'global'
figmaUrl: 'https://www.figma.com/file/xxxx/documind'
hasInteractive: true
---

# 模态消息 `[组件]`

## 1. 概述

模态消息（Modal）是一个全局组件，用于在当前页面之上显示一个对话框，强制用户进行交互。它会覆盖页面其他内容，并通常带有一个遮罩层，以强调对话框的重要性。模态消息适用于需要用户确认的关键操作（如高额投注）、显示重要警告（如赔率变化）或在流程中提供必要信息。

## 2. 视觉预览

![默认状态预览](https://via.placeholder.com/600x400.png/1A1A1A/FFFFFF?text=Modal+Message)

## 3. 组件剖析

![组件剖析图](https://via.placeholder.com/600x400.png/1A1A1A/FFFFFF?text=Modal+Anatomy)

| 序号 | 元素名称 (Figma) | 功能描述 |
| :--- | :--- | :--- |
| 1 | `.overlay` | 遮罩层，覆盖整个页面背景。 |
| 2 | `.modal-container` | 模态框的主体容器。 |
| 3 | `.modal-header` | 包含标题和可选的关闭按钮。 |
| 4 | `.modal-body` | 显示消息的主要内容，可以是文本、列表或更复杂的组件。 |
| 5 | `.modal-footer` | 包含操作按钮，如“确认”、“取消”。 |

## 4. 内容指南

| 元素 | 内容要求 | 示例 |
| :--- | :--- | :--- |
| `modal-header .title` | 标题应简明扼要，概括消息的核心。 | `确认投注` |
| `modal-body .text` | 内容应清晰、直接，引导用户做出决定。 | `您确定要以 1.75 的新赔率投注吗？` |
| `modal-footer .button` | 按钮文本应明确表示其操作后果。 | `接受新赔率` |

## 5. 属性与状态

### 5.1. 状态维度

| 维度名称 | 属性 (Figma) | 描述 | 可选值 |
| :--- | :--- | :--- | :--- |
| **消息类型** | `Type` | 控制模态框的视觉样式，以反映消息的严重性。 | `Info`, `Success`, `Warning`, `Error` |

### 5.2. 状态矩阵

| 状态组合 | 元素显隐说明 | 视觉预览 |
| :--- | :--- | :--- |
| `Type=Warning` | 头部通常会显示一个警告图标，主色调为黄色或橙色。 | ![警告模态框](https://via.placeholder.com/600x400.png/F39C12/FFFFFF?text=Warning+Modal) |
| `Type=Success` | 头部显示成功图标，主色调为绿色。 | ![成功模态框](https://via.placeholder.com/600x400.png/2ECC71/FFFFFF?text=Success+Modal) |

## 6. 行为与交互

### 6.1. 用户操作

| 操作 | 元素 | 反馈 |
| :--- | :--- | :--- |
| **Click** | `.modal-footer .confirm-btn` | 执行确认操作，并关闭模态框。触发 `onConfirm` 回调。 |
| **Click** | `.modal-footer .cancel-btn` 或 `.modal-header .close-btn` | 取消操作，关闭模态框。触发 `onClose` 回调。 |
| **Press** | `Escape` 键 | 关闭模态框，效果同点击取消按钮。 |

## 7. 使用示例

```jsx
import { useModal } from '@/contexts/ModalContext';

const MyComponent = () => {
  const { showModal } = useModal();

  const handleConfirmBet = () => {
    showModal({
      title: '确认投注',
      content: '您确定要提交这张注单吗？',
      onConfirm: () => {
        // ...提交逻辑...
      },
    });
  };

  return <button onClick={handleConfirmBet}>提交</button>;
};
```

## 8. 无障碍设计

| 准则 | 实现说明 |
| :--- | :--- |
| **焦点管理** | 当模态框打开时，焦点必须自动移入模态框内的第一个可聚焦元素。当关闭时，焦点必须返回到触发它的那个元素。 |
| **屏幕阅读器** | 当模态框打开时，应向屏幕阅读器用户宣告其为“对话框”，并朗读其标题和内容。背景内容应被标记为 `aria-hidden`。 |

## 9. 技术规格

### 9.1. 关联关系

- **被使用的页面/组件**: 全局使用，可被任何需要用户确认或显示的组件调用，如 [@投注栏](../components/bet-slip.md)。

### 9.2. 组件 Props (通过 `showModal` 函数传递)

| Prop 名称 | 类型 | 是否必填 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| `title` | `string` | 是 | - | 模态框的标题。 |
| `content` | `ReactNode` | 是 | - | 模态框的主体内容。 |
| `onConfirm` | `function` | 否 | - | 点击确认按钮时的回调。 |
| `onClose` | `function` | 否 | - | 关闭模态框时的回调。 |
| `confirmText` | `string` | 否 | `'确认'` | 确认按钮的文本。 |
| `cancelText` | `string` | 否 | `'取消'` | 取消按钮的文本。 |

### 9.3. 技术细节

- **Figma 组件链接**: [在 Figma 中查看](https://www.figma.com/file/xxxx/documind)
- **代码组件名称**: `<ModalMessage>`
- **代码仓库路径**: `src/components/global/ModalMessage.tsx`

## 10. 变更历史

| 日期 | 版本 | 变更内容 | 变更人 | Figma 版本 |
| :--- | :--- | :--- | :--- | :--- |
| 2025-12-07 | v1.0.0 | 初始版本，基于v6模板创建。 | @manus-ai | [v1.0] |
