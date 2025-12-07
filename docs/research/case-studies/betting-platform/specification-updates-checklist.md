# 标准化规范修改清单

## 一、需要修改的部分

### ✅ 需要修改

#### 1. Front Matter 元数据字段

**当前状态**: 缺少 `componentType` 字段

**需要增加**:
```yaml
componentType: normal   # 普通组件
componentType: global   # 全局组件
```

**影响范围**:
- `frontend_parsing_specification.md` 第 3.2 节
- `prompt_for_template_agent.md` 规范 2

---

#### 2. 模块索引文件格式

**当前状态**: `module.json` 中的 components 数组缺少 `componentType` 字段

**需要增加**:
```json
{
  "components": [
    {
      "id": "bet-slip",
      "title": "投注栏",
      "componentType": "global",  // 新增字段
      "path": "./components/bet-slip.md",
      "hasInteractive": true,
      "status": "completed"
    }
  ]
}
```

**影响范围**:
- `frontend_parsing_specification.md` 第 3.3 节
- 自动化脚本示例

---

#### 3. 文档引用语法

**当前状态**: 
```markdown
[@标题](路径)
```

**需要扩展为**:
```markdown
[@标题](路径) `[标签]`
```

**示例**:
```markdown
- [@投注栏](../components/bet-slip.md) `[全局组件]` - 管理投注单
```

**影响范围**:
- `frontend_parsing_specification.md` 第 4.1 节
- `prompt_for_template_agent.md` 规范 3

---

#### 4. 文档模板示例

**当前状态**: 没有区分普通组件和全局组件的文档模板

**需要提供**:
- 全局组件文档模板(包含"组件状态与变体"和"核心交互逻辑"章节)
- 普通组件文档模板(简化版)
- 页面文档模板(采用 V2.0 的章节结构)

**影响范围**:
- `frontend_parsing_specification.md` 第 10 节(如果有完整示例)
- `prompt_for_template_agent.md` 第 6 节

---

#### 5. 前端解析函数

**当前状态**: 没有解析 `componentType` 和带标签引用的函数

**需要增加**:
```javascript
// 解析组件类型
function parseComponentType(metadata) {
  return metadata.componentType || 'normal';
}

// 解析带标签的引用
const referenceWithLabelPattern = /\[@([^\]]+)\]\(([^)]+)\)\s*`\[([^\]]+)\]`/g;
```

**影响范围**:
- `frontend_parsing_specification.md` 第 7 节

---

### ❌ 不需要修改

#### 1. 文件存储架构

**原因**: V2.0 方案与现有的目录结构完全兼容,不需要修改

#### 2. 文件命名规范

**原因**: kebab-case 命名规范已经足够,不需要修改

#### 3. 组件嵌入语法

**原因**: HTML 注释标记的方式已经足够,不需要修改

#### 4. 全局索引文件格式

**原因**: `index.json` 的格式已经足够,不需要修改

---

## 二、修改优先级

### 高优先级(必须修改)

1. **Front Matter 增加 `componentType` 字段** ⭐⭐⭐
   - 这是区分普通组件和全局组件的核心
   - 影响前端解析和显示

2. **文档引用语法扩展** ⭐⭐⭐
   - 需要支持带标签的引用
   - 影响文档的可读性和前端渲染

3. **更新文档模板示例** ⭐⭐⭐
   - 需要提供全局组件和普通组件的不同模板
   - 影响模板生成 Agent 的输出

---

### 中优先级(建议修改)

4. **模块索引文件增加 `componentType`** ⭐⭐
   - 便于前端快速获取组件分类信息
   - 提升索引文件的完整性

5. **前端解析函数增强** ⭐⭐
   - 提供解析 `componentType` 和带标签引用的函数
   - 便于前端开发

---

### 低优先级(可选修改)

6. **VitePress 配置示例更新** ⭐
   - 提供处理组件分类的插件示例
   - 提升文档的完整性

---

## 三、具体修改内容

### 修改 1: 更新 `frontend_parsing_specification.md`

#### 第 3.2 节 - 元数据字段定义

**在"组件文档专用字段"表格中增加**:

| 字段 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| `componentType` | string | 是 | 组件类型 | `normal` / `global` |

**说明文字**:
```markdown
**组件类型说明**:
- `normal`: 普通组件,标准的、可复用的 UI 元素
- `global`: 全局组件,在应用中通常是单例,跨多个页面持续存在

全局组件通常包含复杂的业务逻辑和状态管理,需要在文档中详细描述其状态和交互逻辑。
```

---

#### 第 3.3 节 - 模块元数据文件

**在 components 数组的示例中增加 `componentType` 字段**:

```json
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
```

---

#### 第 4.1 节 - 文档引用语法

**扩展语法格式**:

```markdown
### 基本语法
[@文档标题](相对路径)

### 带标签语法
[@文档标题](相对路径) `[标签]`
```

**增加示例**:

```markdown
**在页面文档中引用组件(带标签)**:
```markdown
## 组件装配
- [@投注栏](../components/bet-slip.md) `[全局组件]` - 管理投注单
- [@赛事卡片](../components/event-card.md) `[组件]` - 展示赛事信息
```
```

**增加前端解析函数**:

```javascript
// 解析带标签的引用
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
```

---

#### 第 7 节 - 完整的前端解析流程

**在步骤 4 中增加组件类型的解析**:

```javascript
// 4. 解析 Front Matter
import matter from 'gray-matter';
const { data, content } = matter(markdown);

// 如果是组件文档,解析组件类型
if (data.type === 'component') {
  const componentType = data.componentType || 'normal';
  const componentLabel = componentType === 'global' ? '[全局组件]' : '[组件]';
}
```

---

#### 增加新章节 - 组件分类处理

**在第 7 节后增加新章节**:

```markdown
## 八、组件分类处理

### 8.1 解析组件类型

```javascript
function parseComponentType(metadata) {
  return metadata.componentType || 'normal';
}

function getComponentLabel(componentType) {
  return componentType === 'global' ? '[全局组件]' : '[组件]';
}
```

### 8.2 组件分类索引

```javascript
function groupComponents(components) {
  return {
    global: components.filter(c => c.componentType === 'global'),
    normal: components.filter(c => c.componentType === 'normal')
  };
}
```

### 8.3 渲染组件列表

```javascript
function renderComponentList(components) {
  const grouped = groupComponents(components);
  
  return `
    <h3>全局组件</h3>
    ${grouped.global.map(c => renderComponentItem(c)).join('')}
    
    <h3>普通组件</h3>
    ${grouped.normal.map(c => renderComponentItem(c)).join('')}
  `;
}
```
```

---

### 修改 2: 更新 `prompt_for_template_agent.md`

#### 规范 2 - Front Matter 元数据

**在"组件文档专用字段"表格中增加**:

| 字段 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| `componentType` | string | 是 | 组件类型 | `normal` / `global` |

**增加说明**:

```markdown
**组件类型 (componentType)**:

必填字段,用于区分普通组件和全局组件。

- `normal`: 普通组件
  - 标准的、可复用的 UI 元素
  - 通常是无状态或状态简单的
  - 示例: 按钮、输入框、卡片

- `global`: 全局组件
  - 在应用中通常是单例
  - 跨多个页面持续存在
  - 自身管理着复杂状态和业务逻辑
  - 示例: 投注栏、购物车、用户登录面板

**重要**: 全局组件需要在文档中详细描述其所有状态和交互逻辑。
```

---

#### 规范 3 - 文档引用语法

**扩展语法格式**:

```markdown
**基本格式**:
```markdown
[@文档标题](相对路径)
```

**带标签格式**:
```markdown
[@文档标题](相对路径) `[标签]`
```

**使用场景**:

在引用组件时,建议添加组件类型标签,以便阅读者快速识别:

```markdown
## 组件装配
- [@投注栏](../components/bet-slip.md) `[全局组件]` - 管理投注单
- [@赛事卡片](../components/event-card.md) `[组件]` - 展示赛事信息
```
```

---

#### 增加新规范 - 组件文档的章节结构

**增加规范 7**:

```markdown
### 规范 7: 组件文档的章节结构

组件文档的章节结构根据组件类型(普通组件 vs 全局组件)有所不同。

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

**区别说明**:

全局组件需要更详细地描述"组件状态与变体"和"核心交互逻辑",因为它们通常包含复杂的业务逻辑。

普通组件的"组件变体"和"组件状态"章节相对简单,主要描述视觉上的变化。
```

---

#### 增加新规范 - 页面文档的章节结构

**增加规范 8**:

```markdown
### 规范 8: 页面文档的章节结构

页面文档必须包含以下章节:

1. **基本信息**
2. **用户故事**
3. **组件装配** - 使用 [@组件名](路径) `[标签]` 格式
4. **页面自身状态** - 仅描述页面独有内容区域的状态
5. **交互协同** - 使用"触发"和"结果"的格式
6. **调用的 API**
7. **变更历史**

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

**示例**:

```markdown
### 点击盘口选项
**触发**: 用户点击"盘口列表"中的任意一个盘口选项
**结果**: 触发"投注栏"组件执行"添加注单"操作,投注栏展开并显示新增的注单
```
```

---

#### 第 6 节 - 完整示例

**需要提供两个组件文档示例**:

1. 全局组件示例(投注栏)
2. 普通组件示例(赛事卡片)

**需要提供页面文档示例**:

1. 赛事详情页(采用 V2.0 的章节结构)

---

## 四、修改后的文件列表

需要更新的文件:

1. ✅ `frontend_parsing_specification.md` - 前端解析标准化规范
2. ✅ `frontend_parsing_quick_reference.md` - 快速参考卡片
3. ✅ `prompt_for_template_agent.md` - 模板生成 Agent 的提示词

新增的文件:

4. ✅ `component_templates.md` - 组件文档模板集合(区分全局组件和普通组件)
5. ✅ `page_templates.md` - 页面文档模板集合

---

## 五、修改时间估算

| 任务 | 预计时间 | 优先级 |
|------|---------|--------|
| 更新 `frontend_parsing_specification.md` | 30 分钟 | 高 |
| 更新 `frontend_parsing_quick_reference.md` | 15 分钟 | 高 |
| 更新 `prompt_for_template_agent.md` | 45 分钟 | 高 |
| 创建 `component_templates.md` | 30 分钟 | 高 |
| 创建 `page_templates.md` | 20 分钟 | 中 |
| **总计** | **2 小时 20 分钟** | - |

---

## 六、总结

### 需要修改的核心内容

1. **Front Matter 增加 `componentType` 字段** - 区分普通组件和全局组件
2. **文档引用语法扩展** - 支持带标签的引用
3. **文档模板区分** - 全局组件和普通组件使用不同的模板
4. **页面文档结构优化** - 采用 V2.0 的章节结构
5. **前端解析函数增强** - 支持组件分类和带标签引用

### 修改的必要性

✅ **高度必要** - 这些修改是适配 V2.0 方案的核心,不修改将无法体现 V2.0 的逻辑设计

✅ **向后兼容** - 这些修改都是增量式的,不会破坏现有的标准

✅ **提升价值** - 这些修改将显著提升文档体系的逻辑清晰度和可维护性

---

**结论**: 标准化规范**需要适配修改**,但修改量不大,主要是增量式的扩展。
