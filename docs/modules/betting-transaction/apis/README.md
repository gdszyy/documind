---
title: 投注交易模块 API 文档
author: Manus AI
date: 2025-12-07
version: 1.1
---

# 投注交易模块 API 文档

本文档集合了为 **documind** 项目的 **投注交易模块** 生成的核心 API 文档。这些文档是基于 `MTS Service API Documentation (v2.1).md`、`UOF_Service_API_Documentation.md` 以及 **UOF 首页API文档**，并严格遵循项目现有的 DocuMind 规范编写的。

## API 文档列表

### 原有API文档

1.  **[获取赛事列表 (get-events.md)](./get-events.md)**
    - **来源**: UOF Service
    - **功能**: 提供分页的、可按状态和体育项目筛选的增强赛事列表。

2.  **[获取赛事详情 (get-event-detail.md)](./get-event-detail.md)**
    - **来源**: UOF Service
    - **功能**: 获取单个赛事的全部详细信息，包括所有盘口和赔率，是赛事详情页的核心数据源。

3.  **[提交投注 (place-bet.md)](./place-bet.md)**
    - **来源**: MTS Service
    - **功能**: 支持单式、复式等多种类型的投注提交，是投注功能的核心写操作接口。

4.  **[实时数据与状态推送 (websocket-api.md)](./websocket-api.md)**
    - **来源**: UOF Service & MTS Service (整合)
    - **功能**: 通过一个统一的 WebSocket 连接，实现赔率、盘口状态的实时更新，以及注单提交结果的即时反馈。

### UOF 首页API文档 (新增)

以下是从 **UOF 首页API文档** 提取并生成的API接口文档：

#### 左侧导航菜单相关

5.  **[获取体育项目列表 (get-menu-sports.md)](./get-menu-sports.md)**
    - **来源**: UOF 首页API
    - **功能**: 获取所有可用的体育项目列表，用于左侧导航菜单的体育项目选择。

6.  **[获取赛区列表 (get-menu-category.md)](./get-menu-category.md)**
    - **来源**: UOF 首页API
    - **功能**: 根据体育项目ID获取对应的赛区列表，支持分页，用于左侧导航菜单的赛区选择。

7.  **[获取联赛列表 (get-menu-tournament.md)](./get-menu-tournament.md)**
    - **来源**: UOF 首页API
    - **功能**: 根据体育项目和赛区获取联赛列表，支持分页，用于左侧导航菜单的联赛选择。

8.  **[获取导航面包屑 (get-menu-breadcrumb.md)](./get-menu-breadcrumb.md)**
    - **来源**: UOF 首页API
    - **功能**: 根据联赛ID或比赛ID获取完整的导航路径信息，用于页面顶部的面包屑导航。

#### 比赛筛选相关

9.  **[获取比赛列表 (get-match-list.md)](./get-match-list.md)**
    - **来源**: UOF 首页API
    - **功能**: 获取比赛列表，支持按体育类型、联赛、状态、玩法、时间范围等多种条件筛选，支持分页。

## 设计与规范

- **遵循 DocuMind 规范**: 所有文档均采用标准的 Front Matter 元数据和章节结构。
- **明确数据来源**: 每个 API 文档都清晰地指出了其功能是源于 UOF Service、MTS Service 还是 UOF 首页API。
- **关联业务场景**: 文档中详细描述了每个 API 在前端页面和组件中的具体使用场景，例如 `get-event-detail` 被 `赛事详情页` 使用。
- **请求与响应示例**: 提供了清晰的 `curl` 调用示例和 JSON 响应结构，方便前端开发人员理解和对接。
- **统一响应格式**: 所有UOF首页API都遵循统一的响应格式，通过`code`字段判断成功或失败。

## 更新日志

### v1.1 (2025-12-07)

- 新增5个UOF首页API接口文档
  - 获取体育项目列表
  - 获取赛区列表
  - 获取联赛列表
  - 获取导航面包屑
  - 获取比赛列表

### v1.0 (2024-12-07)

- 初始版本，包含4个核心API文档
