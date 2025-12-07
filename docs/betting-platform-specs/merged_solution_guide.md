# 融合方案实施指南

## 一、融合方案概述

### 方案定位

本融合方案结合了:
- **V2.0 方案的逻辑设计** - 清晰的职责划分和组件分类
- **标准化规范的技术实现** - 完整的文件架构和前端解析机制

形成一个既有清晰逻辑又有完整技术实现的文档体系。

### 核心优势

✅ **逻辑清晰**: 组件是"唯一事实源",页面聚焦于"编排与协同"

✅ **技术完整**: 标准化的文件架构、元数据、引用语法、组件嵌入

✅ **前端友好**: 前端可以自动索引、解析和展示所有文档

✅ **易于维护**: 清晰的职责划分降低长期维护成本

---

## 二、关键改进点

### 改进 1: 增加组件分类机制

**在 Front Matter 中增加 `componentType` 字段**:

```yaml
componentType: normal   # 普通组件
componentType: global   # 全局组件
```

**前端使用**:

```javascript
// 根据 componentType 显示不同的标签
function getComponentLabel(componentType) {
  return componentType === 'global' ? '[全局组件]' : '[组件]';
}

// 在组件列表中分类显示
function groupComponents(components) {
  return {
    global: components.filter(c => c.componentType === 'global'),
    normal: components.filter(c => c.componentType === 'normal')
  };
}
```

---

### 改进 2: 优化页面文档结构

**采用 V2.0 的章节结构**:

```markdown
## 组件装配
列出页面使用的所有组件,使用 [@组件名](路径) 格式

## 页面自身状态
仅描述页面独有内容区域的状态,不包含全局组件的状态

## 交互协同
详细描述用户操作如何触发组件之间的通信和状态变化
```

**示例**:

```markdown
## 组件装配
- [@赛事信息](../components/event-info.md) - 显示比赛基本信息
- [@盘口列表](../components/odds-list.md) - 显示所有可投注的盘口
- [@投注栏](../components/bet-slip.md) `[全局组件]` - 管理投注单

## 页面自身状态

### 加载中
盘口列表区域显示骨架屏

### 成功
正常显示所有盘口选项

### 失败
显示错误提示和重试按钮

## 交互协同

### 点击盘口选项
**触发**: 用户点击"盘口列表"中的任意一个盘口选项
**结果**: 触发"投注栏"组件执行"添加注单"操作
```

---

### 改进 3: 优化组件文档结构

**对于全局组件,增加详细的状态和逻辑描述**:

```markdown
## 组件状态与变体
详细描述所有状态(空状态、单关模式、串关模式、异常状态等)

## 核心交互逻辑
详细描述所有交互逻辑(添加注单、删除注单、修改投注额等)
```

**示例**:

```markdown
## 组件状态与变体

### 空状态
**描述**: 注单列表为空时的状态
**显示**: "您的注单是空的"提示文案和引导图标
**交互**: 用户可以通过点击赛事页面的盘口选项来添加注单

### 单关模式
**描述**: 注单列表中只有一项时自动进入单关模式
**显示**: 注单信息、投注额输入框、预计奖金显示
**交互**: 用户输入投注额,系统自动计算预计奖金

## 核心交互逻辑

### 添加注单
**输入**: 盘口信息(赛事 ID、盘口 ID、赔率等)
**逻辑**:
1. 检查该盘口是否已存在于注单列表中
2. 如果不存在,将盘口信息加入注单列表
3. 自动展开投注栏
4. 根据注单数量自动切换单关/串关模式
```

---

### 改进 4: 完善文档引用语法

**将 V2.0 的 `@组件名` 扩展为 `[@组件名](路径)`**:

**V2.0 方案**:
```
@赛事卡片列表, @筛选器, @投注栏
```

**融合方案**:
```markdown
- [@赛事卡片列表](../components/event-card-list.md)
- [@筛选器](../components/filter.md)
- [@投注栏](../components/bet-slip.md) `[全局组件]`
```

**优势**:
- 保留了 `@` 符号的语义(表示引用)
- 提供了可跳转的路径
- 前端可以解析并生成超链接
- 可以在组件名后添加 `[全局组件]` 标签

---

## 三、更新后的文档模板

### 模块文档模板

**文件名**: `README.md`

**Front Matter**:
```yaml
---
id: sports-betting
type: module
title: 体育投注模块
description: 提供体育赛事投注的完整功能
status: active
owner: 产品团队
createdAt: 2024-01-15
updatedAt: 2024-01-15
version: 1.0.0
---
```

**章节结构**:
```markdown
# 体育投注模块

## 基本信息
## 模块概述
## 包含页面
## 核心组件
## 相关 API
## 技术架构
## 变更历史
```

---

### 页面文档模板

**文件名**: `{page-id}.md`

**Front Matter**:
```yaml
---
id: event-detail
type: page
title: 赛事详情页
description: 用户查看单场比赛的详细盘口信息
status: completed
owner: 张三
tags: [赛事, 盘口, 投注]
createdAt: 2024-01-10
updatedAt: 2024-01-15
version: 1.2.0
---
```

**章节结构**:
```markdown
# 赛事详情页

## 基本信息
## 用户故事
## 组件装配
## 页面自身状态
## 交互协同
## 调用的 API
## 变更历史
```

---

### 组件文档模板(全局组件)

**文件名**: `{component-id}.md`

**Front Matter**:
```yaml
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
```

**章节结构**:
```markdown
# 投注栏 `[全局组件]`

## 基本信息
## 组件概述
## 组件预览
## 组件状态与变体
## 核心交互逻辑
## 组件属性 (Props)
## 使用示例
## 调用的 API
## 被使用的页面
## 变更历史
```

---

### 组件文档模板(普通组件)

**文件名**: `{component-id}.md`

**Front Matter**:
```yaml
---
id: event-card
type: component
title: 赛事卡片
description: 展示单个赛事的基本信息
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
```

**章节结构**:
```markdown
# 赛事卡片 `[组件]`

## 基本信息
## 组件概述
## 组件预览
## 组件属性 (Props)
## 组件变体
## 组件状态
## 使用示例
## 被使用的页面
## 变更历史
```

---

### API 文档模板

**文件名**: `{api-id}.md`

**Front Matter**:
```yaml
---
id: place-bet
type: api
title: 提交投注
description: 提交用户的投注单
status: completed
owner: 赵六
tags: [投注, API]
apiType: rest
endpoint: /api/bets
method: POST
createdAt: 2024-01-05
updatedAt: 2024-01-15
version: 1.0.0
---
```

**章节结构**:
```markdown
# 提交投注

## 基本信息
## API 概述
## 请求参数
## 响应格式
## 错误码
## API 测试
## 调用示例
## 被使用的组件
## 被使用的页面
## 依赖的服务
## 变更历史
```

---

## 四、更新后的标准化规范

### 规范 1: Front Matter 必填字段

**所有文档类型的通用必填字段**:

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `id` | string | 文档唯一标识符,使用 kebab-case | `bet-slip` |
| `type` | string | 文档类型 | `module` / `page` / `component` / `api` |
| `title` | string | 文档标题(中文) | `投注栏` |
| `status` | string | 文档状态 | `draft` / `in-progress` / `review` / `completed` |
| `createdAt` | date | 创建日期,格式 YYYY-MM-DD | `2024-01-10` |
| `updatedAt` | date | 最后更新日期,格式 YYYY-MM-DD | `2024-01-15` |

**组件文档专用必填字段**:

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `componentType` | string | 组件类型 | `normal` / `global` |

**组件文档可选字段**:

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `figmaId` | string | Figma 组件 ID | `12345:67890` |
| `figmaUrl` | string | Figma 链接 | `https://figma.com/file/...` |
| `hasInteractive` | boolean | 是否有可交互 HTML 组件 | `true` |
| `interactiveUrl` | string | HTML 文件相对路径 | `./bet-slip.html` |

**API 文档专用必填字段**:

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `apiType` | string | API 类型 | `rest` / `websocket` / `third-party` |
| `endpoint` | string | API 端点 | `/api/bets` |
| `method` | string | HTTP 方法 | `GET` / `POST` / `PUT` / `DELETE` |

---

### 规范 2: 文档引用语法

**标准格式**:
```markdown
[@文档标题](相对路径) `[标签]`
```

**示例**:
```markdown
- [@投注栏](../components/bet-slip.md) `[全局组件]` - 管理投注单
- [@赛事卡片](../components/event-card.md) `[组件]` - 展示赛事信息
```

**规则**:
- 必须使用 `@` 符号开头
- 使用相对路径
- 可以在路径后添加标签(如 `[全局组件]`)
- 可以在标签后添加破折号和说明

---

### 规范 3: 组件分类显示

**在组件文档标题后显示分类标签**:

```markdown
# 投注栏 `[全局组件]`
```

```markdown
# 赛事卡片 `[组件]`
```

**前端渲染**:

```javascript
// 根据 componentType 自动添加标签
function renderComponentTitle(component) {
  const label = component.componentType === 'global' ? '[全局组件]' : '[组件]';
  return `${component.title} \`${label}\``;
}
```

---

### 规范 4: 页面文档的章节结构

**必须包含的章节**:

1. **基本信息**: 页面 ID、路由、状态等
2. **用户故事**: 描述用户的需求和目标
3. **组件装配**: 列出页面使用的所有组件
4. **页面自身状态**: 仅描述页面独有内容区域的状态
5. **交互协同**: 描述组件之间的交互逻辑
6. **调用的 API**: 列出页面调用的所有 API
7. **变更历史**: 记录页面的变更历史

**"页面自身状态"的定义**:

仅描述页面**独有内容区域**的状态,不包含全局组件(如投注栏、导航栏)的状态。

常见的页面自身状态:
- 加载中
- 成功
- 失败
- 空状态
- 特殊业务状态(如"盘口关闭")

**"交互协同"的格式**:

```markdown
### 交互名称
**触发**: 用户的操作
**结果**: 组件的响应和状态变化
```

---

### 规范 5: 组件文档的章节结构

**全局组件必须包含的章节**:

1. **基本信息**: 组件 ID、类型、Figma 链接等
2. **组件概述**: 组件的功能描述和使用场景
3. **组件预览**: 嵌入可交互的 HTML 组件
4. **组件状态与变体**: 详细描述所有状态
5. **核心交互逻辑**: 详细描述所有交互逻辑
6. **组件属性 (Props)**: 列出所有属性
7. **使用示例**: 提供代码示例
8. **调用的 API**: 列出组件调用的所有 API
9. **被使用的页面**: 列出使用该组件的所有页面
10. **变更历史**: 记录组件的变更历史

**普通组件必须包含的章节**:

1. **基本信息**: 组件 ID、类型、Figma 链接等
2. **组件概述**: 组件的功能描述和使用场景
3. **组件预览**: 嵌入可交互的 HTML 组件
4. **组件属性 (Props)**: 列出所有属性
5. **组件变体**: 描述不同的变体
6. **组件状态**: 描述不同的状态
7. **使用示例**: 提供代码示例
8. **被使用的页面**: 列出使用该组件的所有页面
9. **变更历史**: 记录组件的变更历史

**区别**:

全局组件需要更详细地描述"组件状态与变体"和"核心交互逻辑",因为它们通常包含复杂的业务逻辑。

---

## 五、前端解析的增强

### 增强 1: 解析组件分类

```javascript
// 解析 Front Matter 中的 componentType
function parseComponentType(metadata) {
  return metadata.componentType || 'normal';
}

// 在组件列表中分组显示
function renderComponentList(components) {
  const grouped = {
    global: components.filter(c => c.componentType === 'global'),
    normal: components.filter(c => c.componentType === 'normal')
  };
  
  return `
    <h3>全局组件</h3>
    ${grouped.global.map(c => renderComponentItem(c)).join('')}
    
    <h3>普通组件</h3>
    ${grouped.normal.map(c => renderComponentItem(c)).join('')}
  `;
}
```

---

### 增强 2: 解析组件标签

```javascript
// 解析文档引用中的标签
const referenceWithLabelPattern = /\[@([^\]]+)\]\(([^)]+)\)\s*`\[([^\]]+)\]`/g;

function parseReferencesWithLabels(markdown) {
  const references = [];
  let match;
  
  while ((match = referenceWithLabelPattern.exec(markdown)) !== null) {
    references.push({
      title: match[1],      // 文档标题
      path: match[2],       // 相对路径
      label: match[3],      // 标签(如"全局组件")
      type: inferType(match[2])
    });
  }
  
  return references;
}

// 渲染带标签的引用
function renderReferenceWithLabel(ref) {
  return `
    <a href="${ref.path}" class="doc-reference">
      ${ref.title}
      <span class="label label-${ref.label}">${ref.label}</span>
    </a>
  `;
}
```

---

### 增强 3: 生成组件分类索引

```javascript
// 在 module.json 中增加组件分类信息
{
  "id": "sports-betting",
  "name": "体育投注模块",
  "components": [
    {
      "id": "bet-slip",
      "title": "投注栏",
      "path": "./components/bet-slip.md",
      "componentType": "global",
      "hasInteractive": true,
      "interactiveUrl": "./components/bet-slip.html",
      "status": "completed"
    },
    {
      "id": "event-card",
      "title": "赛事卡片",
      "path": "./components/event-card.md",
      "componentType": "normal",
      "hasInteractive": true,
      "interactiveUrl": "./components/event-card.html",
      "status": "completed"
    }
  ]
}
```

---

## 六、更新模板生成 Agent 的提示词

### 需要增加的内容

在之前准备的提示词中,需要增加以下内容:

#### 1. 组件分类要求

```markdown
### 规范 7: 组件分类

**要求**: 所有组件文档必须在 Front Matter 中定义 `componentType` 字段

**组件类型**:
- `normal`: 普通组件,标准的、可复用的 UI 元素
- `global`: 全局组件,在应用中通常是单例,跨多个页面持续存在

**示例**:
```yaml
---
id: bet-slip
type: component
title: 投注栏
componentType: global
---
```

```yaml
---
id: event-card
type: component
title: 赛事卡片
componentType: normal
---
```

**在文档标题后显示分类标签**:
```markdown
# 投注栏 `[全局组件]`
```

```markdown
# 赛事卡片 `[组件]`
```
```

#### 2. 页面文档章节要求

```markdown
### 规范 8: 页面文档的章节结构

**必须包含的章节**:

1. **基本信息**
2. **用户故事**
3. **组件装配** - 使用 [@组件名](路径) `[标签]` 格式
4. **页面自身状态** - 仅描述页面独有内容区域的状态
5. **交互协同** - 使用"触发"和"结果"的格式
6. **调用的 API**
7. **变更历史**

**"页面自身状态"的定义**:

仅描述页面**独有内容区域**的状态,不包含全局组件的状态。

**"交互协同"的格式**:

```markdown
### 交互名称
**触发**: 用户的操作
**结果**: 组件的响应和状态变化
```
```

#### 3. 组件文档章节要求

```markdown
### 规范 9: 组件文档的章节结构

**全局组件必须包含的章节**:

1. **基本信息**
2. **组件概述**
3. **组件预览**
4. **组件状态与变体** - 详细描述所有状态
5. **核心交互逻辑** - 详细描述所有交互逻辑
6. **组件属性 (Props)**
7. **使用示例**
8. **调用的 API**
9. **被使用的页面**
10. **变更历史**

**普通组件必须包含的章节**:

1. **基本信息**
2. **组件概述**
3. **组件预览**
4. **组件属性 (Props)**
5. **组件变体**
6. **组件状态**
7. **使用示例**
8. **被使用的页面**
9. **变更历史**
```

---

## 七、实施步骤

### 步骤 1: 更新文档模板(今天)

1. 更新模块文档模板
2. 更新页面文档模板
3. 更新组件文档模板(区分全局组件和普通组件)
4. 更新 API 文档模板

### 步骤 2: 更新提示词(今天)

1. 更新给模板生成 Agent 的提示词
2. 增加组件分类的要求
3. 增加页面文档章节的要求
4. 增加组件文档章节的要求

### 步骤 3: 更新前端解析逻辑(明天)

1. 增加 `componentType` 字段的解析
2. 增加组件分类索引的生成
3. 增加带标签的文档引用解析
4. 更新 VitePress 配置和插件

### 步骤 4: 试点验证(下周)

1. 选择"体育投注模块"作为试点
2. 生成"投注栏"(全局组件)的文档
3. 生成"赛事卡片"(普通组件)的文档
4. 生成"赛事详情页"的文档
5. 验证前端解析和渲染效果

### 步骤 5: 全面推广(下下周)

1. 根据试点反馈优化方案
2. 生成所有模块的文档
3. 培训团队成员
4. 正式上线文档网站

---

## 八、总结

### 融合方案的核心价值

✅ **逻辑清晰**: V2.0 的职责划分让文档结构更合理

✅ **技术完整**: 标准化规范让前端能够自动解析和展示

✅ **易于维护**: 清晰的职责和标准化的格式降低维护成本

✅ **团队协作**: 统一的规范提升团队协作效率

### 关键改进点

1. **增加组件分类** - 区分普通组件和全局组件
2. **优化页面文档** - 聚焦于组件装配和交互协同
3. **优化组件文档** - 全局组件包含详细的状态和逻辑
4. **完善引用语法** - 既有语义又有路径

### 下一步行动

1. ✅ 更新文档模板
2. ✅ 更新提示词
3. ⏳ 更新前端解析逻辑
4. ⏳ 试点验证
5. ⏳ 全面推广

这个融合方案将为你的团队提供一个既有清晰逻辑又有完整技术实现的文档体系! 🎯
