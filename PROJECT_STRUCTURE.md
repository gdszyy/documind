# DocuMind 项目目录结构

本文档描述了 DocuMind 项目的推荐目录结构。

## 根目录结构

```
documind/
├── docs/                          # 项目文档
│   ├── DocuMind_Project_Plan.md   # 项目计划书
│   ├── documind_mvp_revised.md    # MVP 详细设计
│   ├── functional_architecture_revised.png
│   └── page_information_architecture_revised.png
├── frontend/                      # 前端应用
│   ├── src/
│   │   ├── components/            # React 组件
│   │   │   ├── editor/            # 编辑器相关组件
│   │   │   ├── common/            # 通用组件
│   │   │   └── ...
│   │   ├── pages/                 # 页面组件
│   │   │   ├── Dashboard.tsx      # 项目仪表盘
│   │   │   ├── Editor.tsx         # 编辑器工作区
│   │   │   ├── Settings.tsx       # 设置页
│   │   │   └── ...
│   │   ├── services/              # API 服务
│   │   ├── hooks/                 # 自定义 React Hooks
│   │   ├── utils/                 # 工具函数
│   │   ├── types/                 # TypeScript 类型定义
│   │   ├── App.tsx                # 应用入口
│   │   └── main.tsx               # 主入口
│   ├── public/                    # 静态资源
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend/                       # 后端应用
│   ├── src/
│   │   ├── routes/                # API 路由
│   │   │   ├── auth.ts            # 访问控制
│   │   │   ├── projects.ts        # 项目管理
│   │   │   ├── documents.ts       # 文档核心
│   │   │   ├── figma.ts           # Figma 集成
│   │   │   ├── ai.ts              # AI 辅助
│   │   │   └── publish.ts         # 发布服务
│   │   ├── services/              # 业务逻辑服务
│   │   │   ├── DocumentService.ts
│   │   │   ├── FigmaService.ts
│   │   │   ├── AIService.ts
│   │   │   └── PublishService.ts
│   │   ├── models/                # 数据模型
│   │   ├── middleware/            # 中间件
│   │   │   └── auth.ts            # 访问控制中间件
│   │   ├── utils/                 # 工具函数
│   │   ├── config/                # 配置文件
│   │   └── app.ts                 # 应用入口
│   ├── package.json
│   └── tsconfig.json
├── database/                      # 数据库相关
│   ├── migrations/                # 数据库迁移
│   └── schema.sql                 # 数据库模式
├── scripts/                       # 脚本文件
│   ├── setup.sh                   # 环境设置脚本
│   └── deploy.sh                  # 部署脚本
├── .gitignore
├── README.md
└── PROJECT_STRUCTURE.md           # 本文件
```

## 核心模块说明

### 前端 (frontend/)

前端采用 React + TypeScript + Vite 构建，主要包含以下核心模块：

*   **编辑器组件**：包括文档树导航、富文本编辑器、上下文侧边栏等
*   **交互式示例**：用于在文档中嵌入可交互的组件实例
*   **API 测试器**：用于在文档中测试 API 调用
*   **Figma 集成 UI**：Figma 配置和同步界面

### 后端 (backend/)

后端采用 Node.js (Express) 或 Python (FastAPI)，主要包含以下核心服务：

*   **访问控制中间件**：硬编码密码验证
*   **项目管理服务**：项目的创建、查询和管理
*   **文档核心服务**：四层文档结构的增删改查、版本管理
*   **Figma 集成服务**：与 Figma API 通信，同步组件数据
*   **AI 辅助服务**：封装 LLM 调用，提供各种 AI 功能
*   **发布服务**：生成静态网站并上传至对象存储

### 数据库 (database/)

数据库采用 PostgreSQL，主要存储以下数据：

*   项目信息
*   文档内容（四层结构）
*   文档关联关系
*   版本历史
*   Figma 同步配置和历史

## 开发规范

*   **代码风格**：遵循 ESLint 和 Prettier 配置
*   **提交规范**：遵循 Conventional Commits 规范
*   **分支策略**：main 分支为稳定版本，develop 分支为开发版本

## 下一步

请根据此结构创建相应的目录和文件，并开始第一阶段的开发工作。
