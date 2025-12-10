# 附录：Railway 基础设施搭建指南

本文档将指导您在 Railway 平台上为 DocuMind 飞书体系项目搭建完整的后端基础设施，包括数据库服务和后端 API 服务框架。

## 1. 创建 Railway 项目

首先，您需要在 Railway 上创建一个新项目来托管所有服务。

1.  访问 [Railway](https://railway.app) 并登录您的账户。
2.  在仪表板 (Dashboard) 页面，点击 **New Project** 按钮。
3.  选择 **Deploy from GitHub repo** 选项，并授权 Railway 访问您的 GitHub 账户。
4.  选择 `gdszyy/documind` 仓库并点击 **Deploy**。Railway 会自动检测并尝试部署，但由于仓库根目录没有可直接部署的应用，此步骤主要用于创建项目和关联仓库。

## 2. 部署数据库服务

接下来，我们将通过 Railway 的模板一键部署所需的数据库服务：Neo4j、Qdrant 和 Redis。

### 2.1 部署 Neo4j

1.  在您的 Railway 项目中，点击 **New** 按钮。
2.  在下拉菜单中选择 **Database**。
3.  在数据库模板列表中，找到并点击 **Neo4j**。
4.  Railway 会自动为您创建一个新的 Neo4j 服务实例。部署完成后，您可以在服务的 **Connect** 标签页找到连接信息。

### 2.2 部署 Qdrant

1.  再次点击 **New** 按钮。
2.  在下拉菜单中选择 **Template**。
3.  在搜索框中输入 `Qdrant` 并搜索。
4.  从搜索结果中选择官方或社区推荐的 Qdrant 模板，然后点击 **Deploy**。
5.  Railway 将根据模板部署 Qdrant 服务。

### 2.3 部署 Redis

1.  继续点击 **New** 按钮。
2.  在下拉菜单中选择 **Database**。
3.  在数据库模板列表中，找到并点击 **Redis**。
4.  Railway 会自动为您创建一个新的 Redis 服务实例。

至此，您的项目应该已经包含 Neo4j、Qdrant 和 Redis 三个正在运行的服务。

## 3. 部署并配置后端 API 服务

现在，我们将创建一个空的后端 API 服务框架，并将其连接到 Git 仓库和数据库。

1.  在 Railway 项目中，点击 **New** 按钮。
2.  选择 **Empty Service** 或从一个基础模板开始，例如 **Node.js** 或 **Python**。这将创建一个新的空服务。
3.  进入新创建的服务，在 **Settings** 标签页中，找到 **Service** 部分。
4.  点击 **Connect to a repo** 并选择 `gdszyy/documind` 仓库。如果项目已关联，请确保该服务指向正确的仓库和 `main` 分支。
5.  切换到 **Variables** 标签页，配置环境变量以连接到数据库服务。

    > **注意**: Railway 会自动将已部署服务的连接信息作为环境变量注入到项目中的其他服务。您无需手动复制粘贴连接字符串。

    您需要在后端代码中引用以下由 Railway 提供的标准环境变量：

| 环境变量 | 描述 |
| :--- | :--- |
| `NEO4J_URL` | Neo4j 数据库的 Bolt 连接地址 |
| `QDRANT_URL` | Qdrant 服务的 gRPC 或 HTTP 地址 |
| `REDIS_URL` | Redis 服务的连接地址 |

    您只需在您的后端应用代码中直接使用这些环境变量即可建立连接。

6.  (可选) 如果您的后端服务需要一个启动命令，请在 **Settings** 标签页的 **Deploy** 部分配置 **Start Command**。

## 4. 关键交付物

完成以上步骤后，您将获得一个完整的基础设施环境，包括：

- **一个清理和重构后的 `gdszyy/documind` 仓库**，主分支仅包含 `docs/` 和 `lark-bitable/`。
- **在 Railway 上运行的三个数据库服务**：Neo4j、Qdrant 和 Redis。
- **一个空的后端 API 服务框架**，已连接到 `gdszyy/documind` 仓库，并配置好数据库连接环境变量。

### 访问服务

- **后端 API 服务**: 部署成功后，您可以在 Railway 服务的 **Settings** 标签页找到公开的访问 URL (Public URL)。
- **数据库服务**: 默认情况下，数据库服务不会暴露在公网。您可以通过 Railway 提供的连接信息在后端服务中访问它们。

---

**由 Manus AI 设计和编写**
