---
title: 投注交易模块 API 文档
author: Manus AI
date: 2025-12-07
version: 1.0
---

# 投注交易模块 API 文档

本文档集合了为 **documind** 项目的 **投注交易模块** 生成的核心 API 文档。这些文档是基于您提供的 `MTS Service API Documentation (v2.1).md` 和 `UOF_Service_API_Documentation.md`，并严格遵循项目现有的 DocuMind 规范编写的。

## API 文档列表

以下是本次生成的 API 文档清单：

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

## 设计与规范

- **遵循 DocuMind 规范**: 所有文档均采用标准的 Front Matter 元数据和章节结构。
- **明确数据来源**: 每个 API 文档都清晰地指出了其功能是源于 UOF Service 还是 MTS Service。
- **关联业务场景**: 文档中详细描述了每个 API 在前端页面和组件中的具体使用场景，例如 `get-event-detail` 被 `赛事详情页` 使用。
- **请求与响应示例**: 提供了清晰的 `curl` 调用示例和 JSON 响应结构，方便前端开发人员理解和对接。
