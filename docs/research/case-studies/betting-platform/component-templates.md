# 组件文档模板集合

本文档提供了两种类型的组件文档模板:**全局组件**和**普通组件**。

---

## 一、全局组件文档模板

全局组件是在应用中通常是单例,跨多个页面持续存在,并自身管理着复杂状态和业务逻辑的组件。

**示例**: 投注栏、购物车、用户登录面板

---

### 模板文件

**文件名**: `bet-slip.md`

```markdown
---
id: bet-slip
type: component
title: 投注栏
description: 管理用户的投注单,支持单关和串关模式
status: completed
owner: 李四
tags: [投注, 全局组件, 核心功能]
componentType: global
figmaId: 12345:67890
figmaUrl: https://figma.com/file/xxx
hasInteractive: true
interactiveUrl: ./bet-slip.html
createdAt: 2024-01-05
updatedAt: 2024-01-15
version: 2.1.0
---

# 投注栏 `[全局组件]`

## 基本信息

| 属性 | 值 |
|------|------|
| 组件 ID | `bet-slip` |
| 组件类型 | 全局组件 |
| Figma 链接 | [查看设计稿](https://figma.com/file/xxx) |
| 状态 | 已完成 |
| 负责人 | 李四 |
| 最后更新 | 2024-01-15 |
| 版本 | 2.1.0 |

---

## 组件概述

投注栏是一个全局组件,固定在页面右侧或底部,用于管理用户的投注单。它支持单关和串关两种投注模式,并提供投注额输入、预计奖金计算、提交投注等功能。

**核心功能**:
- 添加/删除注单
- 单关/串关模式切换
- 投注额输入和验证
- 预计奖金实时计算
- 提交投注

**使用场景**:
- 赛事列表页
- 赛事详情页
- 所有包含投注功能的页面

---

## 组件预览

<!-- INTERACTIVE_COMPONENT_START -->
<iframe src="./bet-slip.html" width="100%" height="600px" frameborder="0"></iframe>
<!-- INTERACTIVE_COMPONENT_END -->

---

## 组件状态与变体

### 空状态

**描述**: 注单列表为空时的状态

**显示内容**:
- "您的注单是空的"提示文案
- 引导图标
- 空状态插图

**交互**:
- 用户可以通过点击赛事页面的盘口选项来添加注单

---

### 单关模式

**描述**: 注单列表中只有一项时自动进入单关模式

**显示内容**:
- 注单信息(赛事名称、盘口类型、赔率)
- 投注额输入框
- 预计奖金显示
- "提交投注"按钮

**交互**:
- 用户输入投注额,系统自动计算预计奖金
- 点击"提交投注"按钮,提交投注单

**验证规则**:
- 投注额必须大于最小投注额(例如 10 BRL)
- 投注额不能超过用户余额
- 投注额不能超过单笔最大投注额(例如 10000 BRL)

---

### 串关模式

**描述**: 注单列表中有两项或以上时自动进入串关模式

**显示内容**:
- 所有注单信息
- 串关类型选择(2串1、3串1等)
- 总赔率显示
- 投注额输入框
- 预计奖金显示
- "提交投注"按钮

**交互**:
- 用户选择串关类型
- 用户输入投注额,系统自动计算总赔率和预计奖金
- 点击"提交投注"按钮,提交投注单

**验证规则**:
- 至少需要 2 个注单才能进行串关
- 投注额必须大于最小投注额
- 投注额不能超过用户余额
- 投注额不能超过单笔最大投注额

---

### 异常状态

**赔率变化**:
- 显示"赔率已变化"提示
- 高亮显示变化的赔率
- 提供"接受新赔率"和"移除注单"选项

**盘口关闭**:
- 显示"盘口已关闭"提示
- 禁用该注单
- 提供"移除注单"选项

**余额不足**:
- 显示"余额不足"提示
- 禁用"提交投注"按钮
- 提供"充值"链接

---

## 核心交互逻辑

### 添加注单

**输入**: 盘口信息(赛事 ID、盘口 ID、盘口类型、赔率、选项名称等)

**逻辑**:
1. 检查该盘口是否已存在于注单列表中
2. 如果已存在,显示提示"该盘口已在注单中"
3. 如果不存在,将盘口信息加入注单列表
4. 自动展开投注栏(如果处于收起状态)
5. 根据注单数量自动切换单关/串关模式
6. 触发预计奖金计算

**输出**: 更新后的注单列表

---

### 删除注单

**输入**: 注单 ID

**逻辑**:
1. 从注单列表中移除指定的注单
2. 如果注单列表为空,切换到空状态
3. 如果注单列表只剩一项,切换到单关模式
4. 触发预计奖金重新计算

**输出**: 更新后的注单列表

---

### 修改投注额

**输入**: 投注额数值

**逻辑**:
1. 验证投注额格式(必须是数字)
2. 验证投注额范围(最小值、最大值)
3. 验证用户余额是否足够
4. 如果验证通过,更新投注额
5. 触发预计奖金重新计算
6. 如果验证失败,显示错误提示

**输出**: 更新后的投注额和预计奖金

---

### 计算预计奖金

**输入**: 投注额、赔率(单关)或总赔率(串关)

**逻辑**:
1. 单关模式: 预计奖金 = 投注额 × 赔率
2. 串关模式: 预计奖金 = 投注额 × 总赔率
3. 总赔率 = 所有注单赔率的乘积
4. 保留两位小数

**输出**: 预计奖金金额

---

### 提交投注

**输入**: 注单列表、投注额、投注模式

**逻辑**:
1. 最终验证所有注单的有效性(赔率是否变化、盘口是否关闭)
2. 验证投注额和用户余额
3. 调用 [@提交投注](../apis/place-bet.md) API
4. 如果提交成功:
   - 显示成功提示
   - 清空注单列表
   - 更新用户余额
   - 跳转到投注记录页面
5. 如果提交失败:
   - 显示错误提示
   - 保留注单列表

**输出**: 投注结果

---

## 组件属性 (Props)

| 属性名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `position` | string | 否 | `right` | 投注栏位置,可选值: `right` / `bottom` |
| `defaultExpanded` | boolean | 否 | `false` | 是否默认展开 |
| `minBetAmount` | number | 否 | `10` | 最小投注额(BRL) |
| `maxBetAmount` | number | 否 | `10000` | 最大投注额(BRL) |
| `onBetSuccess` | function | 否 | - | 投注成功回调函数 |
| `onBetError` | function | 否 | - | 投注失败回调函数 |

---

## 使用示例

### React 示例

```jsx
import BetSlip from '@/components/BetSlip';

function App() {
  const handleBetSuccess = (result) => {
    console.log('投注成功:', result);
    // 跳转到投注记录页面
    router.push('/bet-history');
  };

  const handleBetError = (error) => {
    console.error('投注失败:', error);
    // 显示错误提示
    toast.error(error.message);
  };

  return (
    <BetSlip
      position="right"
      defaultExpanded={false}
      minBetAmount={10}
      maxBetAmount={10000}
      onBetSuccess={handleBetSuccess}
      onBetError={handleBetError}
    />
  );
}
```

### 添加注单示例

```javascript
import { useBetSlipStore } from '@/stores/betSlip';

function EventCard({ event }) {
  const { addBet } = useBetSlipStore();

  const handleOddsClick = (odds) => {
    addBet({
      eventId: event.id,
      eventName: event.name,
      oddsId: odds.id,
      oddsType: odds.type,
      oddsValue: odds.value,
      selection: odds.selection
    });
  };

  return (
    <div>
      <h3>{event.name}</h3>
      <button onClick={() => handleOddsClick(event.odds[0])}>
        {event.odds[0].value}
      </button>
    </div>
  );
}
```

---

## 调用的 API

- [@提交投注](../apis/place-bet.md) - 提交用户的投注单
- [@获取用户余额](../apis/get-user-balance.md) - 获取用户当前余额
- [@验证投注](../apis/validate-bet.md) - 验证投注单的有效性

---

## 被使用的页面

- [@赛事列表页](../pages/event-list.md) - 显示所有可投注的赛事
- [@赛事详情页](../pages/event-detail.md) - 显示单场比赛的详细盘口
- [@赛事直播页](../pages/event-live.md) - 显示比赛直播和实时盘口

---

## 变更历史

| 版本 | 日期 | 作者 | 变更内容 |
|------|------|------|----------|
| 2.1.0 | 2024-01-15 | 李四 | 增加赔率变化提示功能 |
| 2.0.0 | 2024-01-10 | 李四 | 重构组件,支持串关模式 |
| 1.0.0 | 2024-01-05 | 李四 | 初始版本,支持单关模式 |
```

---

## 二、普通组件文档模板

普通组件是标准的、可复用的 UI 元素,通常是无状态或状态简单的。

**示例**: 按钮、输入框、卡片、标签

---

### 模板文件

**文件名**: `event-card.md`

```markdown
---
id: event-card
type: component
title: 赛事卡片
description: 展示单个赛事的基本信息和主要盘口
status: completed
owner: 王五
tags: [赛事, 卡片]
componentType: normal
figmaId: 23456:78901
figmaUrl: https://figma.com/file/yyy
hasInteractive: true
interactiveUrl: ./event-card.html
createdAt: 2024-01-08
updatedAt: 2024-01-15
version: 1.1.0
---

# 赛事卡片 `[组件]`

## 基本信息

| 属性 | 值 |
|------|------|
| 组件 ID | `event-card` |
| 组件类型 | 普通组件 |
| Figma 链接 | [查看设计稿](https://figma.com/file/yyy) |
| 状态 | 已完成 |
| 负责人 | 王五 |
| 最后更新 | 2024-01-15 |
| 版本 | 1.1.0 |

---

## 组件概述

赛事卡片用于展示单个体育赛事的基本信息,包括比赛双方、比赛时间、联赛名称和主要盘口选项。用户可以点击卡片查看赛事详情,或直接点击盘口选项添加到投注栏。

**核心功能**:
- 展示赛事基本信息
- 展示主要盘口选项
- 点击卡片跳转到赛事详情页
- 点击盘口选项添加到投注栏

**使用场景**:
- 赛事列表页
- 首页推荐赛事区域
- 搜索结果页

---

## 组件预览

<!-- INTERACTIVE_COMPONENT_START -->
<iframe src="./event-card.html" width="100%" height="300px" frameborder="0"></iframe>
<!-- INTERACTIVE_COMPONENT_END -->

---

## 组件属性 (Props)

| 属性名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `event` | object | 是 | - | 赛事数据对象 |
| `event.id` | string | 是 | - | 赛事 ID |
| `event.homeTeam` | string | 是 | - | 主队名称 |
| `event.awayTeam` | string | 是 | - | 客队名称 |
| `event.startTime` | string | 是 | - | 比赛开始时间(ISO 8601 格式) |
| `event.league` | string | 是 | - | 联赛名称 |
| `event.odds` | array | 是 | - | 盘口选项列表 |
| `showOdds` | boolean | 否 | `true` | 是否显示盘口选项 |
| `onClick` | function | 否 | - | 点击卡片的回调函数 |
| `onOddsClick` | function | 否 | - | 点击盘口选项的回调函数 |

**event.odds 数组元素结构**:

| 属性名 | 类型 | 说明 |
|--------|------|------|
| `id` | string | 盘口 ID |
| `type` | string | 盘口类型(如 `1x2`, `handicap`, `over_under`) |
| `value` | number | 赔率值 |
| `selection` | string | 选项名称(如 `主胜`, `客胜`, `平局`) |

---

## 组件变体

### 默认变体

**描述**: 标准的赛事卡片,显示所有信息

**显示内容**:
- 联赛名称和图标
- 主队 vs 客队
- 比赛开始时间
- 主要盘口选项(主胜、平局、客胜)

---

### 紧凑变体

**描述**: 紧凑版的赛事卡片,用于空间有限的场景

**显示内容**:
- 主队 vs 客队(简化显示)
- 比赛开始时间
- 主要盘口选项

**省略内容**:
- 联赛名称和图标

---

### 无盘口变体

**描述**: 不显示盘口选项的赛事卡片

**显示内容**:
- 联赛名称和图标
- 主队 vs 客队
- 比赛开始时间

**省略内容**:
- 盘口选项

**使用场景**:
- 赛事预告
- 已结束的赛事

---

## 组件状态

### 默认状态

**描述**: 未来的赛事,盘口正常开放

**样式**:
- 正常颜色
- 盘口选项可点击

---

### 进行中状态

**描述**: 比赛正在进行中

**样式**:
- 显示"进行中"标签
- 显示当前比分
- 盘口选项可点击

**额外显示**:
- 比赛进行时间(如"45'")
- 当前比分(如"1-0")

---

### 已结束状态

**描述**: 比赛已结束

**样式**:
- 显示"已结束"标签
- 显示最终比分
- 盘口选项不可点击(灰色)

**额外显示**:
- 最终比分

---

### 盘口关闭状态

**描述**: 盘口已关闭,不接受投注

**样式**:
- 显示"盘口关闭"标签
- 盘口选项不可点击(灰色)

---

## 使用示例

### React 示例

```jsx
import EventCard from '@/components/EventCard';
import { useBetSlipStore } from '@/stores/betSlip';
import { useRouter } from 'next/router';

function EventList({ events }) {
  const router = useRouter();
  const { addBet } = useBetSlipStore();

  const handleCardClick = (event) => {
    router.push(`/events/${event.id}`);
  };

  const handleOddsClick = (event, odds) => {
    addBet({
      eventId: event.id,
      eventName: `${event.homeTeam} vs ${event.awayTeam}`,
      oddsId: odds.id,
      oddsType: odds.type,
      oddsValue: odds.value,
      selection: odds.selection
    });
  };

  return (
    <div className="event-list">
      {events.map(event => (
        <EventCard
          key={event.id}
          event={event}
          showOdds={true}
          onClick={() => handleCardClick(event)}
          onOddsClick={(odds) => handleOddsClick(event, odds)}
        />
      ))}
    </div>
  );
}
```

### 数据结构示例

```javascript
const event = {
  id: "evt_12345",
  homeTeam: "弗拉门戈",
  awayTeam: "帕尔梅拉斯",
  startTime: "2024-01-20T19:00:00Z",
  league: "巴西甲级联赛",
  leagueIcon: "/images/leagues/brasileirao.png",
  odds: [
    {
      id: "odds_1",
      type: "1x2",
      value: 2.10,
      selection: "主胜"
    },
    {
      id: "odds_2",
      type: "1x2",
      value: 3.20,
      selection: "平局"
    },
    {
      id: "odds_3",
      type: "1x2",
      value: 3.50,
      selection: "客胜"
    }
  ]
};
```

---

## 被使用的页面

- [@赛事列表页](../pages/event-list.md) - 显示所有可投注的赛事
- [@首页](../pages/home.md) - 显示推荐赛事
- [@搜索结果页](../pages/search-results.md) - 显示搜索到的赛事

---

## 变更历史

| 版本 | 日期 | 作者 | 变更内容 |
|------|------|------|----------|
| 1.1.0 | 2024-01-15 | 王五 | 增加紧凑变体 |
| 1.0.0 | 2024-01-08 | 王五 | 初始版本 |
```

---

## 三、模板使用指南

### 选择合适的模板

**使用全局组件模板的场景**:
- 组件在应用中是单例
- 组件跨多个页面持续存在
- 组件管理着复杂的状态和业务逻辑
- 示例: 投注栏、购物车、用户登录面板、通知中心

**使用普通组件模板的场景**:
- 组件是标准的、可复用的 UI 元素
- 组件是无状态或状态简单的
- 组件主要负责展示数据
- 示例: 按钮、输入框、卡片、标签、图标

---

### 填写模板的注意事项

1. **Front Matter 必须完整**
   - 所有必填字段都要填写
   - 组件文档必须包含 `componentType` 字段

2. **章节结构必须完整**
   - 全局组件必须包含"组件状态与变体"和"核心交互逻辑"章节
   - 普通组件必须包含"组件变体"和"组件状态"章节

3. **文档引用使用标准格式**
   - 使用 `[@标题](路径)` 格式
   - 路径必须准确

4. **可交互组件嵌入使用标准标记**
   - 使用 `<!-- INTERACTIVE_COMPONENT_START -->` 和 `<!-- INTERACTIVE_COMPONENT_END -->`

5. **变更历史使用表格格式**
   - 包含版本、日期、作者、变更内容四列

---

## 四、总结

这两个模板为不同类型的组件提供了标准化的文档结构:

✅ **全局组件模板** - 适用于复杂的、有状态的组件

✅ **普通组件模板** - 适用于简单的、可复用的 UI 元素

✅ **章节结构清晰** - 每个模板都有明确的章节要求

✅ **示例完整** - 提供了完整的填写示例

✅ **易于使用** - 直接复制模板并填写即可

使用这些模板将确保所有组件文档的一致性和完整性! 📚
