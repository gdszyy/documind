# AI 生成技术文档指南

## 1. 概述

本指南为开发者提供了一套标准的 AI 提示词模板,用于从 DocuMind v6 产品文档自动生成技术实现细节,如 CSS 代码、Storybook 故事等。

## 2. 核心原则

- **产品文档是单一事实源**: 所有技术实现都应基于产品文档生成,确保一致性。
- **关注点分离**: 产品文档关注"做什么",技术文档关注"怎么做"。
- **AI 作为助手**: AI 用于生成技术实现的初稿,开发者负责审核和优化。

## 3. 生成 CSS 代码

### 3.1. 提示词模板

```
**角色**: 你是一个精通 CSS 的前端开发专家。

**任务**: 根据以下提供的 DocuMind v6 组件产品文档,为该组件生成一份完整的 CSS (或 SCSS) 代码。请严格遵循以下要求:

1.  **使用 CSS 变量**: 优先使用文档中定义的 CSS 变量,如 `--component-name-bg-color`。
2.  **遵循 BEM 命名规范**: 使用 `block__element--modifier` 的格式为所有类命名。
3.  **处理所有状态**: 确保为 `Hover`, `Focused`, `Disabled` 等交互状态提供相应的样式。
4.  **注释清晰**: 为关键样式和复杂逻辑添加清晰的注释。

**输入: DocuMind v6 组件产品文档**

---

[此处粘贴完整的 DocuMind v6 组件产品文档内容]

---

**你的任务现在开始。请生成完整的 CSS 代码。**
```

### 3.2. 示例

假设我们将 `bet-slip-card-v6.md` 的内容粘贴到上述提示词中,AI 可能会生成如下 CSS 代码:

```css
/* Bet Slip Card Component */
.bet-slip-card {
  --bet-slip-card-bg-color: #FFFFFF;
  --bet-slip-card-border-color: #E0E0E0;

  background-color: var(--bet-slip-card-bg-color);
  border: 1px solid var(--bet-slip-card-border-color);
  border-radius: 8px;
  padding: 16px;
  transition: background-color 0.3s;
}

/* Hover state */
.bet-slip-card:hover {
  background-color: #F5F5F5;
}

/* Disabled state */
.bet-slip-card--disabled {
  opacity: 0.6;
  pointer-events: none;
}

.bet-slip-card__market-info {
  font-size: 14px;
  color: #333;
}

.bet-slip-card__odds-display {
  font-size: 16px;
  font-weight: bold;
  color: #1890FF;
}

.bet-slip-card__stake-input {
  border: 1px solid #D9D9D9;
  border-radius: 4px;
  padding: 8px;
}

/* Focused state for input */
.bet-slip-card__stake-input:focus {
  border-color: #1890FF;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}
```

## 4. 生成 Storybook 故事

### 4.1. 提示词模板

```
**角色**: 你是一个精通 Storybook 和 TypeScript 的前端开发专家。

**任务**: 根据以下提供的 DocuMind v6 组件产品文档,为该组件生成一份完整的 Storybook 故事文件 (`*.stories.tsx`)。请严格遵循以下要求:

1.  **导入组件**: 从正确的路径导入组件。
2.  **定义 Meta**: 设置 `title`, `component`, `tags` 等元信息。
3.  **创建主故事**: 创建一个默认状态的主故事 (Primary)。
4.  **创建所有变体**: 为文档中"状态矩阵"表格里的每一种状态组合都创建一个独立的故事。
5.  **使用 Args**: 使用 Storybook 的 `args` 来传递 Props。

**输入: DocuMind v6 组件产品文档**

---

[此处粘贴完整的 DocuMind v6 组件产品文档内容]

---

**你的任务现在开始。请生成完整的 `*.stories.tsx` 文件。**
```

### 4.2. 示例

同样,使用 `bet-slip-card-v6.md` 的内容,AI 可能会生成如下 Storybook 故事:

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { BetSlipCard } from './BetSlipCard';

const meta = {
  title: 'Components/BetSlipCard',
  component: BetSlipCard,
  tags: ['autodocs'],
} satisfies Meta<typeof BetSlipCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    marketInfo: '巴西 vs 阿根廷, 独赢: 巴西',
    odds: 2.10,
    stake: 0,
    cardState: 'Normal',
  },
};

export const Locked: Story = {
  args: {
    ...Primary.args,
    cardState: 'Locked',
  },
};

export const Invalid: Story = {
  args: {
    ...Primary.args,
    cardState: 'Invalid',
  },
};

export const Filled: Story = {
  args: {
    ...Primary.args,
    stake: 100,
  },
};
```

## 5. 最佳实践

- **一次生成一个目标**: 不要试图让 AI 同时生成 CSS 和 Storybook,效果会更好。
- **提供完整的上下文**: 始终将完整的 DocuMind v6 产品文档作为输入,信息越全,生成质量越高。
- **人工审核**: AI 生成的代码是初稿,需要开发者进行审核、优化和测试。
- **迭代优化提示词**: 根据生成效果,可以微调提示词以获得更好的结果。
