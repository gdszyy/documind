---
id: get-events
type: api
title: 获取赛事列表
status: completed
createdAt: '2025-12-07'
updatedAt: '2025-12-07'
description: '获取增强的赛事信息列表，包含完整的赛事详情和盘口数据。'
owner: '系统架构组'
tags: ['赛事', '数据']
version: '1.0.0'
apiType: REST
endpoint: '/api/events'
method: 'GET'
---

# GET /api/events

## 基本信息

- **API ID**: `get-events`
- **状态**: `completed`
- **负责人**: `系统架构组`

## API 概述

此 API 用于从 UOF Service 获取一个经过增强的赛事信息列表。与简单的赛事列表不同，此接口返回的数据包含了每个赛事的详细信息，例如体育项目、联赛名称、对阵双方、开赛时间、当前状态，以及关键的盘口统计和具体盘口数据。这使得客户端可以直接在列表视图中展示丰富的赛事信息，而无需为每个赛事单独请求详情。

## 请求参数

### 查询参数 (Query Parameters)

| 参数 | 类型 | 默认值 | 描述 |
|---|---|---|---|
| `status` | `string` | - | 筛选赛事的当前状态。有效值: `not_started` (未开始), `live` (进行中), `ended` (已结束), `cancelled` (已取消)。 |
| `sport_id` | `string` | - | 按体育项目ID进行筛选，例如 `sr:sport:1` 代表足球。 |
| `page` | `int` | `1` | 分页查询的页码。 |
| `page_size` | `int` | `20` | 每页返回的赛事数量，最大值为 100。 |

## 响应格式

### 成功响应 (Success 200)

**Status Code**: `200 OK`

```json
{
  "events": [
    {
      "event_id": "sr:match:12345",
      "sport_id": "sr:sport:1",
      "sport_name": "Football",
      "tournament_name": "Premier League",
      "home_team": "Manchester United",
      "away_team": "Liverpool",
      "scheduled": "2025-12-07T15:00:00Z",
      "status": "live",
      "markets_count": 150,
      "markets": []
    }
  ],
  "total": 100,
  "page": 1,
  "page_size": 20
}
```

| 字段 | 类型 | 描述 |
|---|---|---|
| `events` | `array` | 赛事对象数组。 |
| `events[].event_id` | `string` | 赛事的唯一标识符。 |
| `events[].sport_name` | `string` | 体育项目名称。 |
| `events[].tournament_name` | `string` | 联赛或锦标赛名称。 |
| `events[].home_team` | `string` | 主队名称。 |
| `events[].away_team` | `string` | 客队名称。 |
| `events[].scheduled` | `string` | 预定的开赛时间 (ISO 8601 格式)。 |
| `events[].status` | `string` | 赛事当前状态。 |
| `events[].markets_count` | `int` | 该赛事可用的盘口总数。 |
| `events[].markets` | `array` | 盘口数据数组 (通常在此接口中为节省带宽而返回空数组或有限的关键盘口)。 |
| `total` | `int` | 符合查询条件的总赛事数。 |
| `page` | `int` | 当前页码。 |
| `page_size` | `int` | 每页数量。 |

## 错误码

| 状态码 | 错误码 | 描述 |
|---|---|---|
| `400` | `INVALID_PARAMETER` | 查询参数无效，例如 `page_size` 超出范围。 |
| `500` | `INTERNAL_SERVER_ERROR` | 服务器内部错误。 |

## 调用示例

获取第一页正在进行的足球比赛：

```bash
curl -X GET \
  'http://<uof-service-address>/api/events?status=live&sport_id=sr:sport:1&page=1&page_size=10' \
  -H 'Content-Type: application/json'
```

## 被使用的页面/组件

- [@赛事列表页](../pages/event-list.md)
- [@实时赛事页](../pages/live-event.md)
- [@热门赛事](../components/hot-matches.md)

## 变更历史

| 日期 | 版本 | 变更内容 | 变更人 |
|---|---|---|---|
| 2025-12-07 | v1.0.0 | 初始版本，根据 UOF Service 文档创建。 | Manus AI |
