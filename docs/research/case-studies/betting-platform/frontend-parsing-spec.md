# 前端页面解析 Markdown 文档的标准化规范

## 一、核心问题分析

你提出了一个非常关键的问题:**前端页面需要能够识别和解析 Markdown 文档的结构和内容**。这涉及到三个层面的标准化:

### 1.1 文件存储架构的标准化

前端需要知道:
- 文档存储在哪里?
- 目录结构是什么?
- 如何遍历所有文档?
- 如何识别文档的类型(模块/页面/组件/API)?

### 1.2 文档元数据的标准化

前端需要提取:
- 文档的标题、ID、状态、最后更新时间等基本信息
- 文档的分类和标签
- 文档的作者和负责人
- 文档的版本信息

### 1.3 文档内容的标准化

前端需要解析:
- 文档之间的引用关系(`@` 引用)
- 可交互组件的嵌入位置(HTML iframe)
- 代码块、表格、图表等特殊内容
- 章节结构和目录

---

## 二、文件存储架构约定

### 2.1 目录结构标准

我们采用以下标准化的目录结构:

```
docs/
├── modules/                          # 模块文档根目录
│   ├── {module-id}/                 # 模块目录(使用 kebab-case 命名)
│   │   ├── module.json              # 模块元数据文件
│   │   ├── README.md                # 模块文档
│   │   ├── pages/                   # 页面文档目录
│   │   │   ├── {page-id}.md        # 页面文档
│   │   │   └── {page-id}.json      # 页面元数据(可选)
│   │   ├── components/              # 组件文档目录
│   │   │   ├── {component-id}.md   # 组件文档
│   │   │   ├── {component-id}.html # 可交互组件
│   │   │   └── {component-id}.json # 组件元数据(可选)
│   │   └── apis/                    # API 文档目录
│   │       ├── {api-id}.md         # API 文档
│   │       └── {api-id}.json       # API 元数据(可选)
│   └── ...
├── shared/                           # 共享资源目录
│   ├── components/                  # 共享组件
│   └── apis/                        # 共享 API
├── assets/                          # 资源文件目录
│   ├── images/
│   └── diagrams/
└── index.json                       # 全局索引文件
```

### 2.2 命名规范

**模块 ID**: 使用 kebab-case,例如 `sports-betting`、`account-management`

**页面 ID**: 使用 kebab-case,例如 `event-list`、`event-detail`

**组件 ID**: 使用 kebab-case,例如 `bet-card`、`odds-button`

**API ID**: 使用 kebab-case,例如 `get-events`、`place-bet`

**文件命名规则**:
- 文档文件: `{id}.md`
- 元数据文件: `{id}.json` 或 `module.json`
- HTML 组件: `{id}.html`

### 2.3 全局索引文件

在根目录创建 `index.json` 文件,包含所有文档的索引信息:

```json
{
  "version": "1.0.0",
  "lastUpdated": "2024-01-15T10:30:00Z",
  "modules": [
    {
      "id": "sports-betting",
      "name": "体育投注模块",
      "path": "/modules/sports-betting",
      "status": "active",
      "pageCount": 8,
      "componentCount": 15,
      "apiCount": 12
    },
    {
      "id": "account-management",
      "name": "账户管理模块",
      "path": "/modules/account-management",
      "status": "active",
      "pageCount": 5,
      "componentCount": 10,
      "apiCount": 8
    }
  ],
  "stats": {
    "totalModules": 7,
    "totalPages": 45,
    "totalComponents": 120,
    "totalApis": 85
  }
}
```

**前端使用方式**:
1. 首先加载 `index.json`,获取所有模块的列表
2. 根据模块路径加载具体的模块元数据
3. 根据需要加载具体的文档内容

---

## 三、文档元数据标准

### 3.1 Front Matter 格式

在每个 Markdown 文档的开头,使用 YAML Front Matter 定义元数据:

```markdown
---
id: bet-card
type: component
title: 投注卡片
description: 用于展示单个投注选项的卡片组件
status: completed
owner: 张三
tags: [投注, 卡片, 核心组件]
figmaId: 12345:67890
figmaUrl: https://figma.com/file/...
createdAt: 2024-01-10
updatedAt: 2024-01-15
version: 1.2.0
---

# 投注卡片

[文档内容...]
```

### 3.2 元数据字段定义

**通用字段**(所有文档类型都需要):

| 字段 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| `id` | string | 是 | 文档唯一标识符 | `bet-card` |
| `type` | string | 是 | 文档类型 | `module` / `page` / `component` / `api` |
| `title` | string | 是 | 文档标题 | `投注卡片` |
| `description` | string | 否 | 文档简短描述 | `用于展示单个投注选项的卡片组件` |
| `status` | string | 是 | 文档状态 | `draft` / `in-progress` / `review` / `completed` |
| `owner` | string | 否 | 负责人 | `张三` |
| `tags` | array | 否 | 标签列表 | `[投注, 卡片]` |
| `createdAt` | date | 是 | 创建日期 | `2024-01-10` |
| `updatedAt` | date | 是 | 最后更新日期 | `2024-01-15` |
| `version` | string | 否 | 版本号 | `1.2.0` |

**组件文档专用字段**:

| 字段 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| `componentType` | string | 是 | 组件类型 | `normal` / `global` |
| `figmaId` | string | 否 | Figma 组件 ID | `12345:67890` |
| `figmaUrl` | string | 否 | Figma 链接 | `https://figma.com/...` |
| `hasInteractive` | boolean | 否 | 是否有可交互 HTML | `true` |
| `interactiveUrl` | string | 否 | HTML 文件路径 | `./bet-card.html` |

**组件类型说明**:
- `normal`: 普通组件,标准的、可复用的 UI 元素,通常是无状态或状态简单的
- `global`: 全局组件,在应用中通常是单例,跨多个页面持续存在,并自身管理着复杂状态和业务逻辑

全局组件通常包含复杂的业务逻辑和状态管理,需要在文档中详细描述其"组件状态与变体"和"核心交互逻辑"。

**API 文档专用字段**:

| 字段 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| `apiType` | string | 是 | API 类型 | `rest` / `websocket` / `third-party` |
| `endpoint` | string | 是 | API 端点 | `/api/events` |
| `method` | string | 否 | HTTP 方法 | `GET` / `POST` |

### 3.3 模块元数据文件

在每个模块目录下创建 `module.json` 文件:

```json
{
  "id": "sports-betting",
  "name": "体育投注模块",
  "description": "提供体育赛事投注的完整功能",
  "status": "active",
  "owner": "产品团队",
  "pages": [
    {
      "id": "event-list",
      "title": "赛事列表页",
      "path": "./pages/event-list.md",
      "status": "completed"
    },
    {
      "id": "event-detail",
      "title": "赛事详情页",
      "path": "./pages/event-detail.md",
      "status": "in-progress"
    }
  ],
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
  ],
  "apis": [
    {
      "id": "get-events",
      "title": "获取赛事列表",
      "path": "./apis/get-events.md",
      "endpoint": "/api/events",
      "method": "GET",
      "status": "completed"
    }
  ],
  "createdAt": "2024-01-01",
  "updatedAt": "2024-01-15",
  "version": "1.0.0"
}
```

**前端使用方式**:
1. 加载 `module.json`,获取模块的所有页面、组件、API 列表
2. 根据 `path` 字段加载具体的文档内容
3. 根据 `hasInteractive` 和 `interactiveUrl` 判断是否需要加载 HTML 组件

---

## 四、文档引用语法标准

### 4.1 文档引用语法

使用 `@` 符号 + Markdown 链接语法来引用其他文档:

**基本语法格式**:
```markdown
[@文档标题](相对路径)
```

**带标签语法格式**(推荐用于组件引用):
```markdown
[@文档标题](相对路径) `[标签]`
```

**示例**:

在页面文档中引用组件(带标签):
```markdown
## 组件装配
- [@投注栏](../components/bet-slip.md) `[全局组件]` - 管理投注单
- [@赛事卡片](../components/event-card.md) `[组件]` - 展示赛事信息
- [@赔率按钮](../components/odds-button.md) `[组件]` - 显示和选择赔率
```

在组件文档中引用 API:
```markdown
## 调用的 API
- [@获取赛事列表](../apis/get-events.md) - 获取可投注的赛事
```

在组件文档中引用被使用的页面:
```markdown
## 被使用的页面
- [@赛事列表页](../pages/event-list.md)
- [@赛事详情页](../pages/event-detail.md)
```

### 4.2 前端解析引用的方法

**解析基本引用**:
```javascript
// 匹配 [@标题](路径) 格式的引用
const referencePattern = /\[@([^\]]+)\]\(([^)]+)\)/g;

function parseReferences(markdown) {
  const references = [];
  let match;
  
  while ((match = referencePattern.exec(markdown)) !== null) {
    references.push({
      title: match[1],      // 文档标题
      path: match[2],       // 相对路径
      type: inferType(match[2])  // 根据路径推断类型
    });
  }
  
  return references;
}

function inferType(path) {
  if (path.includes('/components/')) return 'component';
  if (path.includes('/pages/')) return 'page';
  if (path.includes('/apis/')) return 'api';
  if (path.includes('/modules/')) return 'module';
  return 'unknown';
}
```

**解析带标签的引用**:
```javascript
// 匹配 [@标题](路径) `[标签]` 格式的引用
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
  const labelClass = ref.label === '全局组件' ? 'label-global' : 'label-normal';
  return `
    <a href="${ref.path}" class="doc-reference">
      ${ref.title}
      <span class="label ${labelClass}">${ref.label}</span>
    </a>
  `;
}
```

**使用示例**:
```javascript
const markdown = `
## 使用的组件
- [@投注卡片](../components/bet-card.md) - 展示单个投注选项
- [@赔率按钮](../components/odds-button.md) - 显示和选择赔率
`;

const references = parseReferences(markdown);
console.log(references);
// [
//   { title: '投注卡片', path: '../components/bet-card.md', type: 'component' },
//   { title: '赔率按钮', path: '../components/odds-button.md', type: 'component' }
// ]
```

### 4.3 引用关系图谱

前端可以根据引用关系构建文档的关系图谱:

```javascript
// 构建引用关系图
function buildReferenceGraph(documents) {
  const graph = {
    nodes: [],
    edges: []
  };
  
  documents.forEach(doc => {
    // 添加节点
    graph.nodes.push({
      id: doc.id,
      title: doc.title,
      type: doc.type
    });
    
    // 解析引用,添加边
    const references = parseReferences(doc.content);
    references.forEach(ref => {
      graph.edges.push({
        source: doc.id,
        target: resolveId(ref.path),
        type: 'reference'
      });
    });
  });
  
  return graph;
}
```

---

## 五、可交互组件嵌入语法标准

### 5.1 组件嵌入语法

在组件文档中,使用特定的 HTML 注释标记来嵌入可交互组件:

**语法格式**:
```markdown
<!-- INTERACTIVE_COMPONENT_START -->
<iframe src="./bet-card.html" width="100%" height="400px" frameborder="0"></iframe>
<!-- INTERACTIVE_COMPONENT_END -->
```

**完整示例**:
```markdown
# 投注卡片

## 基本信息
- **组件 ID**: `bet-card`
- **状态**: 已完成

## 组件概述
投注卡片用于展示单个投注选项,包括赛事信息、赔率和投注按钮。

## 组件预览

<!-- INTERACTIVE_COMPONENT_START -->
<iframe src="./bet-card.html" width="100%" height="400px" frameborder="0"></iframe>
<!-- INTERACTIVE_COMPONENT_END -->

## 组件属性
...
```

### 5.2 前端解析组件嵌入

**正则表达式匹配**:
```javascript
// 匹配 INTERACTIVE_COMPONENT 标记之间的内容
const componentPattern = /<!-- INTERACTIVE_COMPONENT_START -->([\s\S]*?)<!-- INTERACTIVE_COMPONENT_END -->/g;

function parseInteractiveComponents(markdown) {
  const components = [];
  let match;
  
  while ((match = componentPattern.exec(markdown)) !== null) {
    const htmlContent = match[1].trim();
    
    // 提取 iframe 的 src 属性
    const srcMatch = htmlContent.match(/src="([^"]+)"/);
    if (srcMatch) {
      components.push({
        html: htmlContent,
        src: srcMatch[1],
        position: match.index
      });
    }
  }
  
  return components;
}
```

**使用示例**:
```javascript
const markdown = `
## 组件预览

<!-- INTERACTIVE_COMPONENT_START -->
<iframe src="./bet-card.html" width="100%" height="400px"></iframe>
<!-- INTERACTIVE_COMPONENT_END -->
`;

const components = parseInteractiveComponents(markdown);
console.log(components);
// [
//   {
//     html: '<iframe src="./bet-card.html" width="100%" height="400px"></iframe>',
//     src: './bet-card.html',
//     position: 20
//   }
// ]
```

### 5.3 组件嵌入的替代方案

除了 iframe,也可以使用自定义的 Markdown 扩展语法:

**方案 A: 使用自定义代码块**
```markdown
```interactive-component
src: ./bet-card.html
width: 100%
height: 400px
```
```

**方案 B: 使用自定义标签**
```markdown
<InteractiveComponent src="./bet-card.html" width="100%" height="400px" />
```

**前端解析**:
```javascript
// 方案 A: 解析自定义代码块
function parseCustomCodeBlock(markdown) {
  const pattern = /```interactive-component\n([\s\S]*?)```/g;
  // ... 解析逻辑
}

// 方案 B: 解析自定义标签
function parseCustomTag(markdown) {
  const pattern = /<InteractiveComponent\s+([^>]+)\s*\/>/g;
  // ... 解析逻辑
}
```

**推荐**: 使用 HTML 注释标记(方案 1),因为:
- 兼容性好,不需要特殊的 Markdown 解析器
- 可以直接在 GitHub 等平台预览
- 前端解析简单

---

## 六、章节结构和目录解析

### 6.1 章节标记

使用标准的 Markdown 标题语法,并在 Front Matter 中定义章节结构:

```markdown
---
id: bet-card
title: 投注卡片
sections:
  - id: basic-info
    title: 基本信息
    level: 2
  - id: overview
    title: 组件概述
    level: 2
  - id: preview
    title: 组件预览
    level: 2
  - id: props
    title: 组件属性
    level: 2
---

# 投注卡片

## 基本信息
...

## 组件概述
...

## 组件预览
...

## 组件属性
...
```

### 6.2 前端自动生成目录

如果 Front Matter 中没有定义章节结构,前端可以自动解析 Markdown 标题:

```javascript
function parseTableOfContents(markdown) {
  const headingPattern = /^(#{2,6})\s+(.+)$/gm;
  const toc = [];
  let match;
  
  while ((match = headingPattern.exec(markdown)) !== null) {
    const level = match[1].length;  // 标题级别(2-6)
    const title = match[2].trim();
    const id = slugify(title);      // 生成 slug ID
    
    toc.push({
      id,
      title,
      level,
      position: match.index
    });
  }
  
  return toc;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
```

---

## 七、完整的前端解析流程

### 7.1 初始化阶段

```javascript
// 1. 加载全局索引
const index = await fetch('/docs/index.json').then(r => r.json());

// 2. 加载所有模块的元数据
const modules = await Promise.all(
  index.modules.map(m => 
    fetch(`/docs${m.path}/module.json`).then(r => r.json())
  )
);

// 3. 构建文档索引
const documentIndex = buildDocumentIndex(modules);
```

### 7.2 文档加载阶段

```javascript
// 加载单个文档
async function loadDocument(path) {
  // 1. 加载 Markdown 文件
  const markdown = await fetch(path).then(r => r.text());
  
  // 2. 解析 Front Matter
  const { metadata, content } = parseFrontMatter(markdown);
  
  // 3. 解析引用关系
  const references = parseReferences(content);
  
  // 4. 解析可交互组件
  const interactiveComponents = parseInteractiveComponents(content);
  
  // 5. 解析目录
  const toc = parseTableOfContents(content);
  
  // 6. 渲染 Markdown
  const html = renderMarkdown(content);
  
  return {
    metadata,
    content,
    html,
    references,
    interactiveComponents,
    toc
  };
}
```

### 7.3 文档渲染阶段

```javascript
// 渲染文档
function renderDocument(document) {
  // 1. 渲染基本信息
  renderMetadata(document.metadata);
  
  // 2. 渲染目录
  renderTableOfContents(document.toc);
  
  // 3. 渲染 Markdown 内容
  renderMarkdownContent(document.html);
  
  // 4. 渲染可交互组件
  document.interactiveComponents.forEach(comp => {
    renderInteractiveComponent(comp);
  });
  
  // 5. 渲染引用关系
  renderReferences(document.references);
}
```

---

## 八、VitePress 集成方案

### 8.1 VitePress 配置

VitePress 原生支持 Front Matter 和自定义 Markdown 扩展:

```javascript
// .vitepress/config.js
export default {
  title: '巴西博彩平台设计文档',
  
  // Markdown 配置
  markdown: {
    // 启用行号
    lineNumbers: true,
    
    // 自定义 Markdown 解析器
    config: (md) => {
      // 注册自定义插件
      md.use(interactiveComponentPlugin);
      md.use(documentReferencePlugin);
    }
  },
  
  // 主题配置
  themeConfig: {
    // 导航栏
    nav: [
      { text: '首页', link: '/' },
      { text: '模块', link: '/modules/' }
    ],
    
    // 侧边栏
    sidebar: {
      '/modules/': generateSidebar()
    },
    
    // 搜索
    search: {
      provider: 'local'
    }
  }
}
```

### 8.2 自定义 Markdown 插件

**插件 1: 解析可交互组件**

```javascript
// .vitepress/plugins/interactive-component.js
export function interactiveComponentPlugin(md) {
  const defaultRender = md.renderer.rules.html_block;
  
  md.renderer.rules.html_block = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const content = token.content;
    
    // 检测 INTERACTIVE_COMPONENT 标记
    if (content.includes('INTERACTIVE_COMPONENT_START')) {
      // 提取 iframe src
      const srcMatch = content.match(/src="([^"]+)"/);
      if (srcMatch) {
        const src = srcMatch[1];
        // 返回自定义的 Vue 组件
        return `<InteractiveComponent src="${src}" />`;
      }
    }
    
    return defaultRender(tokens, idx, options, env, self);
  };
}
```

**插件 2: 解析文档引用**

```javascript
// .vitepress/plugins/document-reference.js
export function documentReferencePlugin(md) {
  const defaultRender = md.renderer.rules.link_open;
  
  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const hrefIndex = token.attrIndex('href');
    
    if (hrefIndex >= 0) {
      const href = token.attrs[hrefIndex][1];
      
      // 检测是否是文档引用(以 @ 开头)
      const textToken = tokens[idx + 1];
      if (textToken && textToken.content.startsWith('@')) {
        // 添加自定义 class
        token.attrPush(['class', 'doc-reference']);
        // 添加 data 属性
        token.attrPush(['data-ref-type', inferType(href)]);
      }
    }
    
    return defaultRender(tokens, idx, options, env, self);
  };
}
```

### 8.3 自定义 Vue 组件

**组件: InteractiveComponent.vue**

```vue
<template>
  <div class="interactive-component">
    <div class="component-header">
      <span class="component-label">可交互组件</span>
      <button @click="openFullscreen" class="fullscreen-btn">
        全屏查看
      </button>
    </div>
    <iframe 
      :src="src" 
      width="100%" 
      :height="height"
      frameborder="0"
      ref="iframe"
    ></iframe>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  src: String,
  height: {
    type: String,
    default: '400px'
  }
});

const iframe = ref(null);

function openFullscreen() {
  if (iframe.value.requestFullscreen) {
    iframe.value.requestFullscreen();
  }
}
</script>

<style scoped>
.interactive-component {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  margin: 20px 0;
}

.component-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.component-label {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.fullscreen-btn {
  padding: 5px 12px;
  font-size: 12px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.fullscreen-btn:hover {
  background: #2563eb;
}
</style>
```

---

## 九、自动化脚本:生成索引文件

### 9.1 生成全局索引

```javascript
// scripts/generate-index.js
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const DOCS_ROOT = './docs';
const OUTPUT_FILE = './docs/index.json';

function scanModules() {
  const modulesDir = path.join(DOCS_ROOT, 'modules');
  const modules = [];
  
  const moduleDirs = fs.readdirSync(modulesDir);
  
  for (const moduleDir of moduleDirs) {
    const modulePath = path.join(modulesDir, moduleDir);
    const moduleJsonPath = path.join(modulePath, 'module.json');
    
    if (fs.existsSync(moduleJsonPath)) {
      const moduleData = JSON.parse(fs.readFileSync(moduleJsonPath, 'utf-8'));
      
      modules.push({
        id: moduleData.id,
        name: moduleData.name,
        path: `/modules/${moduleDir}`,
        status: moduleData.status,
        pageCount: moduleData.pages?.length || 0,
        componentCount: moduleData.components?.length || 0,
        apiCount: moduleData.apis?.length || 0
      });
    }
  }
  
  return modules;
}

function generateIndex() {
  const modules = scanModules();
  
  const index = {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    modules,
    stats: {
      totalModules: modules.length,
      totalPages: modules.reduce((sum, m) => sum + m.pageCount, 0),
      totalComponents: modules.reduce((sum, m) => sum + m.componentCount, 0),
      totalApis: modules.reduce((sum, m) => sum + m.apiCount, 0)
    }
  };
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2));
  console.log(`✅ 索引文件已生成: ${OUTPUT_FILE}`);
}

generateIndex();
```

### 9.2 生成模块索引

```javascript
// scripts/generate-module-index.js
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

function scanDocuments(dir, type) {
  const documents = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    if (file.endsWith('.md')) {
      const filePath = path.join(dir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const { data } = matter(content);
      
      documents.push({
        id: data.id || path.basename(file, '.md'),
        title: data.title,
        path: `./${type}/${file}`,
        status: data.status,
        hasInteractive: data.hasInteractive || false,
        interactiveUrl: data.interactiveUrl || null
      });
    }
  }
  
  return documents;
}

function generateModuleIndex(moduleDir) {
  const modulePath = path.join(DOCS_ROOT, 'modules', moduleDir);
  const readmePath = path.join(modulePath, 'README.md');
  
  // 解析模块文档的 Front Matter
  const readmeContent = fs.readFileSync(readmePath, 'utf-8');
  const { data: moduleData } = matter(readmeContent);
  
  // 扫描各类文档
  const pages = scanDocuments(path.join(modulePath, 'pages'), 'pages');
  const components = scanDocuments(path.join(modulePath, 'components'), 'components');
  const apis = scanDocuments(path.join(modulePath, 'apis'), 'apis');
  
  const moduleIndex = {
    id: moduleData.id,
    name: moduleData.title,
    description: moduleData.description,
    status: moduleData.status,
    owner: moduleData.owner,
    pages,
    components,
    apis,
    createdAt: moduleData.createdAt,
    updatedAt: moduleData.updatedAt,
    version: moduleData.version
  };
  
  // 保存模块索引
  const outputPath = path.join(modulePath, 'module.json');
  fs.writeFileSync(outputPath, JSON.stringify(moduleIndex, null, 2));
  console.log(`✅ 模块索引已生成: ${outputPath}`);
}
```

---

## 十、总结和建议

### 10.1 核心标准化约定

你的问题非常关键,前端页面确实需要一套标准化的约定来识别和解析文档。我们设计了以下标准:

**1. 文件存储架构标准**
- 固定的目录结构: `modules/{module-id}/{type}/{doc-id}.md`
- 统一的命名规范: kebab-case
- 全局索引文件: `index.json`
- 模块索引文件: `module.json`

**2. 文档元数据标准**
- 使用 YAML Front Matter 定义元数据
- 必填字段: id, type, title, status, createdAt, updatedAt
- 可选字段: description, owner, tags, version 等
- 组件专用字段: figmaId, hasInteractive, interactiveUrl

**3. 文档引用语法标准**
- 使用 `[@标题](路径)` 格式
- 使用相对路径
- 前端通过正则表达式解析

**4. 组件嵌入语法标准**
- 使用 HTML 注释标记: `<!-- INTERACTIVE_COMPONENT_START/END -->`
- 内嵌 iframe 标签
- 前端通过正则表达式或 Markdown 插件解析

### 10.2 实施建议

**阶段一: 建立标准**(第 1 周)
1. 确定文件存储架构和命名规范
2. 设计 Front Matter 元数据字段
3. 定义引用语法和组件嵌入语法
4. 编写标准化规范文档

**阶段二: 实现自动化**(第 2 周)
1. 编写索引生成脚本
2. 编写文档模板生成脚本
3. 集成到 Figma 同步流程

**阶段三: 前端集成**(第 3 周)
1. 配置 VitePress
2. 开发自定义 Markdown 插件
3. 开发自定义 Vue 组件
4. 测试文档解析和渲染

### 10.3 关键要点

✅ **文件路径和命名要标准化**,前端才能正确遍历和加载文档

✅ **Front Matter 元数据要完整**,前端才能提取关键信息

✅ **引用语法要统一**,前端才能解析文档关系

✅ **组件嵌入要有明确标记**,前端才能识别和渲染

✅ **提供索引文件**,前端可以快速加载而不需要遍历整个文件系统

✅ **使用自动化脚本**,确保索引文件和元数据的准确性

这套标准化约定将确保前端页面能够正确识别、解析和展示所有文档及可交互组件! 🎯


---

## 十一、组件分类处理

### 11.1 解析组件类型

前端需要能够解析组件的类型(普通组件 vs 全局组件),并根据类型进行不同的处理和展示。

```javascript
// 解析组件类型
function parseComponentType(metadata) {
  return metadata.componentType || 'normal';
}

// 获取组件标签
function getComponentLabel(componentType) {
  return componentType === 'global' ? '[全局组件]' : '[组件]';
}

// 判断是否为全局组件
function isGlobalComponent(metadata) {
  return metadata.componentType === 'global';
}
```

---

### 11.2 组件分类索引

在加载模块的组件列表时,可以根据组件类型进行分组:

```javascript
// 组件分类
function groupComponents(components) {
  return {
    global: components.filter(c => c.componentType === 'global'),
    normal: components.filter(c => c.componentType === 'normal')
  };
}

// 统计组件数量
function countComponentsByType(components) {
  const grouped = groupComponents(components);
  return {
    total: components.length,
    global: grouped.global.length,
    normal: grouped.normal.length
  };
}
```

**使用示例**:

```javascript
// 从 module.json 加载组件列表
const moduleData = await fetch('/docs/modules/sports-betting/module.json')
  .then(r => r.json());

// 分组显示
const grouped = groupComponents(moduleData.components);

console.log('全局组件:', grouped.global);
// [{ id: 'bet-slip', title: '投注栏', componentType: 'global', ... }]

console.log('普通组件:', grouped.normal);
// [{ id: 'event-card', title: '赛事卡片', componentType: 'normal', ... }]
```

---

### 11.3 渲染组件列表

在前端页面中,可以分组渲染组件列表,并为不同类型的组件添加不同的样式:

```javascript
function renderComponentList(components) {
  const grouped = groupComponents(components);
  
  let html = '';
  
  // 渲染全局组件
  if (grouped.global.length > 0) {
    html += '<h3>全局组件</h3>';
    html += '<ul class="component-list global">';
    grouped.global.forEach(c => {
      html += renderComponentItem(c, 'global');
    });
    html += '</ul>';
  }
  
  // 渲染普通组件
  if (grouped.normal.length > 0) {
    html += '<h3>普通组件</h3>';
    html += '<ul class="component-list normal">';
    grouped.normal.forEach(c => {
      html += renderComponentItem(c, 'normal');
    });
    html += '</ul>';
  }
  
  return html;
}

function renderComponentItem(component, type) {
  const label = type === 'global' ? '[全局组件]' : '[组件]';
  const labelClass = type === 'global' ? 'label-global' : 'label-normal';
  
  return `
    <li class="component-item">
      <a href="${component.path}">
        ${component.title}
        <span class="label ${labelClass}">${label}</span>
      </a>
      <span class="status status-${component.status}">${component.status}</span>
    </li>
  `;
}
```

**CSS 样式示例**:

```css
.label {
  display: inline-block;
  padding: 2px 8px;
  font-size: 12px;
  border-radius: 4px;
  margin-left: 8px;
}

.label-global {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fbbf24;
}

.label-normal {
  background: #e0e7ff;
  color: #3730a3;
  border: 1px solid #818cf8;
}

.component-list.global {
  border-left: 3px solid #fbbf24;
  padding-left: 16px;
}

.component-list.normal {
  border-left: 3px solid #818cf8;
  padding-left: 16px;
}
```

---

### 11.4 组件文档标题渲染

在渲染组件文档时,自动在标题后添加组件类型标签:

```javascript
function renderComponentTitle(component) {
  const label = getComponentLabel(component.componentType);
  return `<h1>${component.title} <code>${label}</code></h1>`;
}
```

**渲染结果**:

```html
<!-- 全局组件 -->
<h1>投注栏 <code>[全局组件]</code></h1>

<!-- 普通组件 -->
<h1>赛事卡片 <code>[组件]</code></h1>
```

---

### 11.5 更新索引生成脚本

在自动化脚本中,需要提取组件的 `componentType` 字段:

```javascript
// scripts/generate-module-index.js
function scanDocuments(dir, type) {
  const documents = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    if (file.endsWith('.md')) {
      const filePath = path.join(dir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const { data } = matter(content);
      
      const doc = {
        id: data.id || path.basename(file, '.md'),
        title: data.title,
        path: `./${type}/${file}`,
        status: data.status
      };
      
      // 如果是组件文档,增加组件类型字段
      if (type === 'components') {
        doc.componentType = data.componentType || 'normal';
        doc.hasInteractive = data.hasInteractive || false;
        doc.interactiveUrl = data.interactiveUrl || null;
      }
      
      documents.push(doc);
    }
  }
  
  return documents;
}
```

---

### 11.6 VitePress 插件增强

在 VitePress 的自定义插件中,可以自动为组件文档添加类型标签:

```javascript
// .vitepress/plugins/component-type.js
export function componentTypePlugin(md) {
  const defaultRender = md.renderer.rules.heading_open;
  
  md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    
    // 只处理 h1 标题
    if (token.tag === 'h1' && env.frontmatter && env.frontmatter.type === 'component') {
      const componentType = env.frontmatter.componentType || 'normal';
      const label = componentType === 'global' ? '[全局组件]' : '[组件]';
      
      // 在下一个 token(标题文本)后添加标签
      const nextToken = tokens[idx + 1];
      if (nextToken && nextToken.type === 'inline') {
        nextToken.content += ` \`${label}\``;
      }
    }
    
    return defaultRender(tokens, idx, options, env, self);
  };
}
```

**在 VitePress 配置中注册插件**:

```javascript
// .vitepress/config.js
import { componentTypePlugin } from './plugins/component-type.js';

export default {
  markdown: {
    config: (md) => {
      md.use(componentTypePlugin);
    }
  }
}
```

---

### 11.7 总结

通过增加组件分类机制,前端可以:

✅ **自动识别组件类型** - 通过 `componentType` 字段

✅ **分组显示组件列表** - 全局组件和普通组件分开显示

✅ **添加视觉标识** - 不同类型的组件使用不同的标签和样式

✅ **自动添加标题标签** - 在组件文档标题后自动添加类型标签

✅ **生成完整索引** - 索引文件包含组件类型信息

这些功能将帮助开发者快速识别和理解不同类型的组件,提升文档的可用性和可维护性。
