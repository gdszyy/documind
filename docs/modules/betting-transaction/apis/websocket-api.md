---
id: websocket-api
type: api
title: 实时数据与状态推送
status: completed
createdAt: '2025-12-07'
updatedAt: '2025-12-07'
description: '通过WebSocket建立持久连接，接收实时的赛事数据、赔率变化和注单状态更新。'
owner: '系统架构组'
tags: ['WebSocket', '实时', '核心功能']
version: '1.0.0'
apiType: WebSocket
endpoint: 'ws://<your-server-address>/ws'
---

# WebSocket 实时数据与状态推送

## 基本信息

- **API ID**: `websocket-api`
- **状态**: `completed`
- **负责人**: `系统架构组`

## API 概述

为了提供动态、实时的用户体验，平台严重依赖WebSocket进行双向通信。此WebSocket服务整合了来自 **UOF Service** 和 **MTS Service** 的能力，为客户端提供一个统一的实时数据流入口。

**核心功能**:
1.  **UOF数据推送**: 实时推送指定赛事的赔率变化 (`odds_change`)、盘口状态变更 (`bet_stop`)、比分更新等。客户端通过发送 `subscribe` 消息来订阅感兴趣的赛事。
2.  **MTS注单状态**: 在客户端通过REST API提交注单后，MTS Service会通过此WebSocket连接，将注单的最终状态（`accepted` 或 `rejected`）推送给对应的用户。

## 连接端点

`ws://<your-server-address>/ws?userId=<userId>&token=<token>`

### 查询参数 (Query Parameters)

| 参数 | 类型 | 描述 |
|---|---|---|
| `userId` | `string` | 当前登录用户的唯一标识符。用于MTS Service定向推送注单状态。 |
| `token` | `string` | 用于验证用户身份的安全令牌。 |

## 消息流

### 客户端 -> 服务端

| 消息类型 (`type`) | 描述 | Payload 结构 |
|---|---|---|
| `subscribe` | 订阅一个或多个赛事的实时更新。 | `{"eventIds": ["sr:match:12345", "sr:match:12346"]}` |
| `unsubscribe` | 取消订阅。 | `{"eventIds": ["sr:match:12345"]}` |
| `ping` | 心跳消息，用于保持连接活跃。 | (无) |

### 服务端 -> 客户端

| 消息类型 (`type`) | 来源 | 描述 |
|---|---|---|
| `connection_established` | - | 确认WebSocket连接成功。 |
| `odds_change` | UOF | 某个盘口的赔率发生了变化。 |
| `bet_stop` | UOF | 某个盘口或整个赛事停止接受投注。 |
| `bet_settlement` | UOF | 某个盘口已结算。 |
| `bet_result` | MTS | 客户端提交的注单有了最终结果（接受/拒绝）。 |
| `pong` | - | 响应客户端的 `ping` 消息。 |

## 消息格式示例

### 订阅赛事 (C -> S)

```json
{
  "type": "subscribe",
  "payload": {
    "eventIds": ["sr:match:12345"]
  }
}
```

### 赔率变化 (S -> C)

```json
{
  "type": "odds_change",
  "payload": {
    "eventId": "sr:match:12345",
    "marketId": 1,
    "outcomes": [
      { "outcomeId": "1", "odds": 1.90 },
      { "outcomeId": "3", "odds": 4.20 }
    ]
  }
}
```

### 注单结果 (S -> C)

```json
{
  "type": "bet_result",
  "payload": {
    "ticketId": "client-acc-xyz-789",
    "status": "accepted",
    "details": { ... } // MTS返回的完整票据详情
  }
}
```

## 被使用的页面/组件

- [@赛事详情页](../pages/event-detail.md) - 订阅当前页面的赛事，实时更新赔率。
- [@投注栏](../components/bet-slip.md) - 接收注单提交结果。
- [@实时赛事页](../pages/live-event.md) - 订阅所有滚球赛事，实时更新数据。

## 变更历史

| 日期 | 版本 | 变更内容 | 变更人 |
|---|---|---|---|
| 2025-12-07 | v1.0.0 | 初始版本，整合UOF和MTS的WebSocket能力。 | Manus AI |
