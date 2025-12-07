# DocuMind Web 应用

这是 DocuMind 项目的 Web 文档管理系统，提供可视化的文档浏览和编辑功能。

## 功能特性

- **四层资产结构浏览**：聚焦于 docs/modules 下的模块、页面、组件、API 文档
- **中文标题显示**：从 Front Matter 提取中文标题，提升可读性
- **在线编辑**：支持 Markdown 文件的在线编辑和实时预览
- **资产管理**：支持新增和删除文档资产，自动使用标准模板
- **Git 集成**：所有修改自动提交到 Git 仓库
- **侧边栏收起**：灵活的界面布局

## 技术栈

- **前端**：React 19 + TypeScript + Tailwind CSS 4
- **后端**：Express + tRPC 11
- **数据库**：MySQL (TiDB)
- **编辑器**：@uiw/react-md-editor
- **Markdown 渲染**：react-markdown + remark-gfm

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 运行生产服务器
pnpm start
```

## 环境变量

项目需要以下环境变量（在 Manus 平台上自动注入）：

- `DATABASE_URL`：数据库连接字符串
- `JWT_SECRET`：会话密钥
- `OAUTH_SERVER_URL`：OAuth 服务器地址
- 其他 Manus 平台提供的系统环境变量

## 项目结构

```
web/
├── client/              # 前端代码
│   ├── src/
│   │   ├── components/  # UI 组件
│   │   ├── pages/       # 页面组件
│   │   └── lib/         # 工具库
├── server/              # 后端代码
│   ├── routers.ts       # tRPC 路由
│   ├── fileSystem.ts    # 文件系统操作
│   └── assetOperations.ts # 资产管理
├── drizzle/             # 数据库 schema
└── shared/              # 共享类型和常量
```

## 相关链接

- [DocuMind 文档](../docs/)
- [前端规划](../frontend/)
- [后端规划](../backend/)
