# 前端解析标准化规范 - 快速参考

## 📋 核心约定速查

### 1. 文件命名规范

| 类型 | 格式 | 示例 |
|------|------|------|
| 模块 ID | kebab-case | `sports-betting` |
| 页面 ID | kebab-case | `event-list` |
| 组件 ID | kebab-case | `bet-card` |
| API ID | kebab-case | `get-events` |
| 文档文件 | `{id}.md` | `bet-card.md` |
| HTML 组件 | `{id}.html` | `bet-card.html` |
| 元数据文件 | `module.json` | `module.json` |

---

### 2. 目录结构

```
docs/
├── index.json                        # 全局索引
├── modules/
│   └── {module-id}/
│       ├── module.json              # 模块索引
│       ├── README.md                # 模块文档
│       ├── pages/{page-id}.md
│       ├── components/{component-id}.md
│       ├── components/{component-id}.html
│       └── apis/{api-id}.md
```

---

### 3. Front Matter 必填字段

**通用字段**:
```yaml
---
id: bet-slip                    # 文档唯一标识
type: component                 # 文档类型
title: 投注栏                   # 文档标题
status: completed               # 文档状态
createdAt: 2024-01-10          # 创建日期
updatedAt: 2024-01-15          # 更新日期
---
```

**组件文档专用字段**:
```yaml
---
componentType: global           # 组件类型 (normal / global)
figmaId: 12345:67890           # Figma 组件 ID
hasInteractive: true           # 是否有可交互 HTML
interactiveUrl: ./bet-slip.html # HTML 文件路径
---
```

**文档类型**: `module` / `page` / `component` / `api`

**文档状态**: `draft` / `in-progress` / `review` / `completed`

**组件类型**: `normal` (普通组件) / `global` (全局组件)

---

### 4. 文档引用语法

**基本格式**:
```markdown
[@文档标题](相对路径)
```

**带标签格式**(推荐用于组件):
```markdown
[@文档标题](相对路径) `[标签]`
```

**示例**:
```markdown
## 组件装配
- [@投注栏](../components/bet-slip.md) `[全局组件]` - 管理投注单
- [@赛事卡片](../components/event-card.md) `[组件]` - 展示赛事信息

## 调用的 API
- [@获取赛事列表](../apis/get-events.md)
```

**前端解析**:
```javascript
// 基本引用
const pattern = /\[@([^\]]+)\]\(([^)]+)\)/g;

// 带标签引用
const labelPattern = /\[@([^\]]+)\]\(([^)]+)\)\s*`\[([^\]]+)\]`/g;
```

---

### 5. 组件嵌入语法

```markdown
<!-- INTERACTIVE_COMPONENT_START -->
<iframe src="./bet-card.html" width="100%" height="400px"></iframe>
<!-- INTERACTIVE_COMPONENT_END -->
```

**前端解析**:
```javascript
const pattern = /<!-- INTERACTIVE_COMPONENT_START -->([\s\S]*?)<!-- INTERACTIVE_COMPONENT_END -->/g;
```

---

### 6. 全局索引文件格式

**文件**: `docs/index.json`

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

---

### 7. 模块索引文件格式

**文件**: `docs/modules/{module-id}/module.json`

```json
{
  "id": "sports-betting",
  "name": "体育投注模块",
  "pages": [
    {
      "id": "event-list",
      "title": "赛事列表页",
      "path": "./pages/event-list.md",
      "status": "completed"
    }
  ],
  "components": [
    {
      "id": "bet-card",
      "title": "投注卡片",
      "path": "./components/bet-card.md",
      "hasInteractive": true,
      "interactiveUrl": "./components/bet-card.html",
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
  ]
}
```

---

## 🚀 前端加载流程

### 步骤 1: 加载全局索引

```javascript
const index = await fetch('/docs/index.json').then(r => r.json());
```

### 步骤 2: 加载模块索引

```javascript
const moduleData = await fetch('/docs/modules/sports-betting/module.json')
  .then(r => r.json());
```

### 步骤 3: 加载文档内容

```javascript
const markdown = await fetch('/docs/modules/sports-betting/components/bet-card.md')
  .then(r => r.text());
```

### 步骤 4: 解析 Front Matter

```javascript
import matter from 'gray-matter';
const { data, content } = matter(markdown);
```

### 步骤 5: 解析引用和组件

```javascript
const references = parseReferences(content);
const components = parseInteractiveComponents(content);
```

---

## 🛠️ 工具函数

### 解析文档引用

```javascript
function parseReferences(markdown) {
  const pattern = /\[@([^\]]+)\]\(([^)]+)\)/g;
  const references = [];
  let match;
  
  while ((match = pattern.exec(markdown)) !== null) {
    references.push({
      title: match[1],
      path: match[2],
      type: inferType(match[2])
    });
  }
  
  return references;
}

function inferType(path) {
  if (path.includes('/components/')) return 'component';
  if (path.includes('/pages/')) return 'page';
  if (path.includes('/apis/')) return 'api';
  return 'unknown';
}
```

### 解析可交互组件

```javascript
function parseInteractiveComponents(markdown) {
  const pattern = /<!-- INTERACTIVE_COMPONENT_START -->([\s\S]*?)<!-- INTERACTIVE_COMPONENT_END -->/g;
  const components = [];
  let match;
  
  while ((match = pattern.exec(markdown)) !== null) {
    const html = match[1].trim();
    const srcMatch = html.match(/src="([^"]+)"/);
    
    if (srcMatch) {
      components.push({
        html,
        src: srcMatch[1],
        position: match.index
      });
    }
  }
  
  return components;
}
```

### 解析目录结构

```javascript
function parseTableOfContents(markdown) {
  const pattern = /^(#{2,6})\s+(.+)$/gm;
  const toc = [];
  let match;
  
  while ((match = pattern.exec(markdown)) !== null) {
    toc.push({
      level: match[1].length,
      title: match[2].trim(),
      id: slugify(match[2]),
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

## 📝 VitePress 配置示例

### 基础配置

```javascript
// .vitepress/config.js
export default {
  title: '巴西博彩平台设计文档',
  
  markdown: {
    lineNumbers: true,
    config: (md) => {
      md.use(interactiveComponentPlugin);
      md.use(documentReferencePlugin);
    }
  },
  
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '模块', link: '/modules/' }
    ],
    sidebar: 'auto',
    search: {
      provider: 'local'
    }
  }
}
```

### 自定义插件

```javascript
// .vitepress/plugins/interactive-component.js
export function interactiveComponentPlugin(md) {
  const defaultRender = md.renderer.rules.html_block;
  
  md.renderer.rules.html_block = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const content = token.content;
    
    if (content.includes('INTERACTIVE_COMPONENT_START')) {
      const srcMatch = content.match(/src="([^"]+)"/);
      if (srcMatch) {
        return `<InteractiveComponent src="${srcMatch[1]}" />`;
      }
    }
    
    return defaultRender(tokens, idx, options, env, self);
  };
}
```

---

## 🔧 自动化脚本

### 生成全局索引

```bash
node scripts/generate-index.js
```

**输出**: `docs/index.json`

### 生成模块索引

```bash
node scripts/generate-module-index.js sports-betting
```

**输出**: `docs/modules/sports-betting/module.json`

### 批量生成所有索引

```bash
node scripts/generate-all-indexes.js
```

---

## ✅ 检查清单

### 文件结构检查

- [ ] 目录结构符合标准
- [ ] 文件命名使用 kebab-case
- [ ] 每个模块有 `module.json` 文件
- [ ] 根目录有 `index.json` 文件

### 文档内容检查

- [ ] 每个文档有 Front Matter
- [ ] Front Matter 包含必填字段
- [ ] 文档引用使用 `[@标题](路径)` 格式
- [ ] 组件嵌入使用标准标记

### 前端功能检查

- [ ] 能够加载全局索引
- [ ] 能够加载模块索引
- [ ] 能够解析 Front Matter
- [ ] 能够解析文档引用
- [ ] 能够解析可交互组件
- [ ] 能够渲染 Markdown 内容

---

## 🎯 常见问题

### Q: 为什么要使用 Front Matter?

**A**: Front Matter 是 Markdown 文件的元数据标准,VitePress 和大多数静态站点生成器都原生支持,前端可以直接解析。

### Q: 为什么引用要使用 `@` 符号?

**A**: `@` 符号是一个明确的标记,便于前端识别哪些链接是文档引用,哪些是普通链接。

### Q: 为什么要使用 HTML 注释标记组件?

**A**: HTML 注释不会在渲染时显示,但可以被前端解析,既不影响阅读,又能提供结构化信息。

### Q: 可以不使用索引文件吗?

**A**: 可以,但会降低前端加载效率。索引文件可以让前端快速获取所有文档的元信息,而不需要遍历整个文件系统。

### Q: 如何确保索引文件是最新的?

**A**: 使用自动化脚本在每次文档更新后重新生成索引文件,或者集成到 CI/CD 流程中。

---

## 📚 相关文档

- **frontend_parsing_specification.md** - 完整的标准化规范(本文档的详细版)
- **mvp_implementation_guide.md** - MVP 实施指南
- **prompts_collection.md** - 提示词集合

---

## 💡 最佳实践

1. **始终使用标准化的文件结构和命名**
2. **为每个文档添加完整的 Front Matter**
3. **使用自动化脚本生成索引文件**
4. **定期验证文档引用的准确性**
5. **在 VitePress 中测试文档的渲染效果**
6. **将标准化规范纳入团队培训**

---

有了这套标准化约定,前端页面就能够正确识别、解析和展示所有文档及可交互组件了! 🎉


---

## 🏷️ 组件分类处理

### 组件类型识别

```javascript
// 解析组件类型
function parseComponentType(metadata) {
  return metadata.componentType || 'normal';
}

// 获取组件标签
function getComponentLabel(componentType) {
  return componentType === 'global' ? '[全局组件]' : '[组件]';
}
```

---

### 组件分组显示

```javascript
// 组件分类
function groupComponents(components) {
  return {
    global: components.filter(c => c.componentType === 'global'),
    normal: components.filter(c => c.componentType === 'normal')
  };
}

// 渲染分组列表
function renderComponentList(components) {
  const grouped = groupComponents(components);
  
  let html = '<h3>全局组件</h3><ul>';
  grouped.global.forEach(c => {
    html += `<li><a href="${c.path}">${c.title}</a> <code>[全局组件]</code></li>`;
  });
  html += '</ul>';
  
  html += '<h3>普通组件</h3><ul>';
  grouped.normal.forEach(c => {
    html += `<li><a href="${c.path}">${c.title}</a> <code>[组件]</code></li>`;
  });
  html += '</ul>';
  
  return html;
}
```

---

### 样式建议

```css
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
```

---

## 📝 文档模板章节结构

### 全局组件文档

1. 基本信息
2. 组件概述
3. 组件预览
4. **组件状态与变体** (详细)
5. **核心交互逻辑** (详细)
6. 组件属性 (Props)
7. 使用示例
8. 调用的 API
9. 被使用的页面
10. 变更历史

---

### 普通组件文档

1. 基本信息
2. 组件概述
3. 组件预览
4. 组件属性 (Props)
5. 组件变体
6. 组件状态
7. 使用示例
8. 被使用的页面
9. 变更历史

---

### 页面文档

1. 基本信息
2. 用户故事
3. **组件装配** (使用带标签引用)
4. **页面自身状态** (仅页面独有内容)
5. **交互协同** (组件间交互)
6. 调用的 API
7. 变更历史

---

## ⚡ 快速检查清单

### 文档创建检查

- [ ] 文件名使用 kebab-case
- [ ] Front Matter 包含所有必填字段
- [ ] 组件文档包含 `componentType` 字段
- [ ] 文档引用使用 `[@标题](路径)` 格式
- [ ] 组件引用添加类型标签
- [ ] 可交互组件使用标准嵌入标记
- [ ] 变更历史使用表格格式

---

### 索引文件检查

- [ ] `index.json` 包含所有模块
- [ ] `module.json` 包含所有文档
- [ ] 组件列表包含 `componentType` 字段
- [ ] 所有路径使用相对路径
- [ ] 时间戳格式正确

---

### 前端集成检查

- [ ] VitePress 配置正确
- [ ] Markdown 插件已注册
- [ ] 组件分类样式已定义
- [ ] 搜索功能正常
- [ ] 文档跳转正常
- [ ] 可交互组件渲染正常

---

## 🎯 关键要点总结

✅ **组件分类是核心** - 区分普通组件和全局组件

✅ **标签提升可读性** - 使用 `[全局组件]` 和 `[组件]` 标签

✅ **文档结构要规范** - 全局组件需要详细描述状态和逻辑

✅ **引用语法要统一** - 使用 `[@标题](路径) `[标签]`` 格式

✅ **索引文件要完整** - 包含 `componentType` 字段

✅ **自动化很重要** - 使用脚本生成索引文件

这份快速参考卡片将帮助你快速查找和应用标准化规范! 📚
