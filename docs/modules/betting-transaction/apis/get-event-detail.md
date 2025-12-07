---
id: get-event-detail
type: api
title: 获取赛事详情
status: completed
createdAt: '2025-12-07'
updatedAt: '2025-12-07'
description: '获取指定赛事的完整详情，包括所有盘口、specifier 和 outcomes。'
owner: '系统架构组'
tags: ['赛事', '数据', '盘口']
version: '1.0.0'
apiType: REST
endpoint: '/api/events/{eventId}'
method: 'GET'
---

# GET /api/events/{eventId}

## 基本信息

- **API ID**: `get-event-detail`
- **状态**: `completed`
- **负责人**: `系统架构组`

## API 概述

此 API 是从 UOF Service 获取单个赛事全部详细信息的核心接口。当用户从赛事列表页导航到特定赛事的详情页时，调用此 API 来加载该赛事的所有相关数据，包括但不限于基本信息（对阵双方、时间、联赛）、实时比分、以及最重要的——所有可投注的盘口（Markets）及其赔率（Outcomes）。

## 请求参数

### 路径参数 (Path Parameters)

| 参数 | 类型 | 描述 |
|---|---|---|
| `eventId` | `string` | 要查询的赛事的唯一标识符，例如 `sr:match:12345`。 |

## 响应格式

### 成功响应 (Success 200)

**Status Code**: `200 OK`

```json
{
  "event_id": "sr:match:12345",
  "sport_id": "sr:sport:1",
  "sport_name": "Football",
  "tournament_name": "Premier League",
  "home_team": "Manchester United",
  "away_team": "Liverpool",
  "scheduled": "2025-12-07T15:00:00Z",
  "status": "live",
  "score": {
    "home": 1,
    "away": 0
  },
  "markets": [
    {
      "market_id": 1,
      "market_name": "1X2",
      "specifiers": "variant=sr:exact_games:bestof:3",
      "outcomes": [
        {
          "outcome_id": "1",
          "outcome_name": "Home",
          "odds": 1.85,
          "active": true
        },
        {
          "outcome_id": "2",
          "outcome_name": "Draw",
          "odds": 3.50,
          "active": true
        },
        {
          "outcome_id": "3",
          "outcome_name": "Away",
          "odds": 4.00,
          "active": true
        }
      ]
    }
  ]
}
```

| 字段 | 类型 | 描述 |
|---|---|---|
| `event_id` | `string` | 赛事的唯一标识符。 |
| `score` | `object` | 实时比分对象。 |
| `markets` | `array` | 该赛事的所有盘口对象数组。 |
| `markets[].market_id` | `int` | 盘口的唯一ID。 |
| `markets[].market_name` | `string` | 盘口名称，例如 "1X2"。 |
| `markets[].specifiers` | `string` | 盘口的附加说明符，用于区分相似的盘口。 |
| `markets[].outcomes` | `array` | 该盘口的所有投注选项数组。 |
| `outcomes[].outcome_id` | `string` | 投注选项的唯一ID。 |
| `outcomes[].outcome_name` | `string` | 投注选项的名称，例如 "Home"。 |
| `outcomes[].odds` | `number` | 当前赔率。 |
| `outcomes[].active` | `boolean` | 该投注选项当前是否可投。 |

## 错误码

| 状态码 | 错误码 | 描述 |
|---|---|---|
| `404` | `NOT_FOUND` | 未找到具有指定 `eventId` 的赛事。 |
| `500` | `INTERNAL_SERVER_ERROR` | 服务器内部错误。 |

## 调用示例

```bash
curl -X GET \
  'http://<uof-service-address>/api/events/sr:match:12345' \
  -H 'Content-Type: application/json'
```

## 被使用的页面/组件

- [@赛事详情页](../pages/event-detail.md)
- [@盘口列表](../components/odds-list.md)

## 变更历史

| 日期 | 版本 | 变更内容 | 变更人 |
|---|---|---|---|
| 2025-12-07 | v1.0.0 | 初始版本，根据 UOF Service 文档创建。 | Manus AI |
