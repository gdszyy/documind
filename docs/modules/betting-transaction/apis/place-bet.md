---
id: place-bet
type: api
title: 提交投注
status: completed
createdAt: '2025-12-07'
updatedAt: '2025-12-07'
description: '提交一个或多个投注请求到MTS系统。'
owner: '系统架构组'
tags: ['投注', '核心功能', 'MTS']
version: '1.0.0'
apiType: REST
endpoint: '/api/bets/{betType}'
method: 'POST'
---

# POST /api/bets/{betType}

## 基本信息

- **API ID**: `place-bet`
- **状态**: `completed`
- **负责人**: `系统架构组`

## API 概述

此 API 是与 MTS Service 交互以提交用户投注的核心接口。它是一个动态端点，通过路径参数 `betType` 来支持所有类型的投注，包括单式 (`single`)、复式 (`accumulator`)、系统 (`system`) 等。前端的 `投注栏` 组件在用户点击“提交投注”后，会根据当前的投注模式和内容，构建相应的请求体，并调用此 API。

## 请求参数

### 路径参数 (Path Parameters)

| 参数 | 类型 | 描述 |
|---|---|---|
| `betType` | `string` | 投注的类型。必须是 MTS Service 支持的类型之一，例如 `single`, `accumulator`, `system`, `trixie`, `yankee` 等。 |

### 请求体 (Request Body)

请求体的结构根据 `betType` 的不同而变化。以下是两种最常用类型的示例：

#### 1. 单式投注 (`betType` = `single`)

```json
{
  "ticketId": "ticket-single-001",
  "selection": {
    "productId": "3",
    "eventId": "sr:match:12345",
    "marketId": "1",
    "outcomeId": "1",
    "odds": "2.50"
  },
  "stake": {
    "type": "cash",
    "currency": "BRL",
    "amount": "10.00",
    "mode": "total"
  }
}
```

#### 2. 复式投注 (`betType` = `accumulator`)

```json
{
  "ticketId": "ticket-acc-002",
  "selections": [
    {
      "productId": "3",
      "eventId": "sr:match:12345",
      "marketId": "1",
      "outcomeId": "1",
      "odds": "2.50"
    },
    {
      "productId": "3",
      "eventId": "sr:match:12346",
      "marketId": "1",
      "outcomeId": "2",
      "odds": "1.80"
    }
  ],
  "stake": {
    "type": "cash",
    "currency": "BRL",
    "amount": "10.00",
    "mode": "total"
  }
}
```

| 字段 | 类型 | 必填 | 描述 |
|---|---|---|---|
| `ticketId` | `string` | 是 | 客户端生成的唯一注单ID，用于追踪。 |
| `selection` / `selections` | `object` / `array` | 是 | 单个或多个投注选项对象。 |
| `stake` | `object` | 是 | 投注金额信息对象。 |

## 响应格式

### 成功响应 (Success 200)

**Status Code**: `200 OK`

```json
{
  "success": true,
  "data": { 
    "ticket": { ... } // MTS 返回的原始票据数据
  },
  "error": null
}
```

## 错误码

| 状态码 | 错误码 | 描述 |
|---|---|---|
| `400` | `Validation failed` | 请求体字段验证失败，例如 `odds` 格式错误。 |
| `500` | `Failed to send ticket` | MTS Service 在尝试将注单发送到 Sportradar MTS 时遇到内部错误。 |

## 调用示例

提交一个2串1的复式投注：

```bash
curl -X POST \
  http://<mts-service-address>/api/bets/accumulator \
  -H 'Content-Type: application/json' \
  -d '{
    "ticketId": "client-acc-xyz-789",
    "selections": [
      { "eventId": "sr:match:12345", "marketId": "1", "outcomeId": "1", "odds": "2.50", "productId": "3" },
      { "eventId": "sr:match:12346", "marketId": "1", "outcomeId": "2", "odds": "1.80", "productId": "3" }
    ],
    "stake": { "type": "cash", "currency": "BRL", "amount": "20.00", "mode": "total" }
  }'
```

## 被使用的页面/组件

- [@投注栏](../components/bet-slip.md)

## 变更历史

| 日期 | 版本 | 变更内容 | 变更人 |
|---|---|---|---|
| 2025-12-07 | v1.0.0 | 初始版本，根据 MTS Service 文档创建。 | Manus AI |
