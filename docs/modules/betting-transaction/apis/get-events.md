---
id: get-events
type: api
title: 获取赛事列表
status: completed
createdAt: '2024-12-07'
updatedAt: '2024-12-07'
description: '获取增强的赛事信息列表，包含完整的赛事详情和盘口数据。'
owner: 'Manus AI'
tags: ['赛事', '数据']
version: '1.0'
apiType: REST
endpoint: '/api/events'
method: 'GET'
---

# GET /api/events 接口文档

**版本:** 1.0  
**生成日期:** 2024-12-07  
**作者:** Manus AI

---

## 1. 接口概述

`GET /api/events` 是一个功能强大的赛事查询接口,用于获取增强的赛事信息。它支持丰富的过滤和排序选项,可以获取包括赛事基本信息、实时比分、盘口数据在内的完整数据。

该接口的核心功能是提供一个统一的入口,用于查询和筛选所有跟踪的赛事,并动态关联其盘口数据,为前端应用提供一站式的数据支持。

### 主要特性

- **丰富的过滤选项:** 支持按赛事状态、订阅状态、体育类型、生产者、是否有盘口等多种条件进行过滤。
- **灵活的排序功能:** 支持按时间、热度等多种方式排序。
- **动态盘口关联:** 实时获取并关联赛事的盘口和赔率数据。
- **数据映射与格式化:** 对原始数据进行映射和格式化,使其更易于前端展示。
- **缓存机制:** 内置查询缓存,提高重复查询的响应速度。
- **分页支持:** 支持分页查询,降低单次请求的负载。

---

## 2. 请求参数

该接口支持通过 URL 查询参数进行过滤和排序。以下是所有支持的参数列表:

| 参数名 | 类型 | 必填 | 描述 | 默认值 |
|---|---|---|---|---|
| `status` | string | 否 | 赛事状态,如 `live`, `not_started`, `ended` | - |
| `subscribed` | boolean | 否 | 是否已订阅 (`true` 或 `false`) | - |
| `sport_id` | string | 否 | 体育类型 ID,如 `sr:sport:1` | - |
| `search` | string | 否 | 搜索关键词 (支持赛事 ID 精确匹配或队伍名称模糊匹配) | - |
| `producer` | int | 否 | 生产者 ID,用于过滤特定生产者提供的盘口 | - |
| `is_live` | boolean | 否 | 是否为进行中的比赛 (`true`) | - |
| `is_ended` | boolean | 否 | 是否为已结束的比赛 (`true` 或 `false`) | - |
| `has_markets` | boolean | 否 | 是否必须包含盘口数据 (`true`) | - |
| `market_ids` | string | 否 | 盘口 ID 列表,逗号分隔,用于过滤特定盘口 | - |
| `sort_by` | string | 否 | 排序字段 (`time`, `popularity`) | `last_update` |
| `sort_order` | string | 否 | 排序顺序 (`asc`, `desc`) | `desc` |
| `page` | int | 否 | 页码 | 1 |
| `page_size` | int | 否 | 每页数量 (最大 50) | 20 |
| `include_unsubscribed_started` | boolean | 否 | 是否包含未订阅且已开赛的比赛 (`true`) | `false` |

### 参数详解

- **`status`**: 用于过滤特定状态的比赛。常见状态包括:
  - `not_started`: 未开始
  - `live`: 进行中
  - `ended`: 已结束
  - `cancelled`: 已取消

- **`search`**: 提供强大的搜索功能。如果提供的是赛事 ID,则进行精确匹配;如果是文本,则对主队和客队名称进行不区分大小写的模糊匹配。

- **`is_ended`**: 一个便捷的过滤器,`is_ended=false` 可以排除所有已结束、取消或废弃的比赛,`is_ended=true` 则只返回这些比赛。

- **`has_markets`**: 设置为 `true` 时,将只返回那些当前至少有一个有效盘口的比赛,非常适合用于展示有投注选项的比赛列表。

- **`market_ids`**: 允许您只获取包含特定盘口的比赛,例如 `market_ids=1,18` 将只返回包含 "1X2" 和 "Total Goals" 盘口的比赛。

- **`sort_by`**:
  - `time`: 按比赛计划时间 (`schedule_time`) 排序。
  - `popularity`: 按热度 (消息数量 `message_count`) 排序。
  - 默认: 按最后更新时间 (`last_update`, 包括盘口更新时间) 排序,确保最新的数据排在最前面。

- **`include_unsubscribed_started`**: 默认情况下,接口会过滤掉那些**未订阅**且**已开赛**的比赛,因为这类比赛通常没有可用的滚球盘口。将此参数设置为 `true` 可以禁用此默认行为,返回所有符合条件的比赛。

---

## 3. 响应结构

接口返回一个 JSON 对象,包含赛事列表和分页信息。

```json
{
  "success": true,
  "count": 1,
  "events": [
    {
      "event_id": "sr:match:12345",
      "srn_id": "srn:match:12345",
      "sport_id": "sr:sport:1",
      "status": "live",
      "schedule_time": "2024-12-07T15:00:00Z",
      "home_team_id": "sr:competitor:1",
      "home_team_name": "Manchester United",
      "away_team_id": "sr:competitor:2",
      "away_team_name": "Liverpool",
      "home_score": 1,
      "away_score": 0,
      "match_status": "2nd_half",
      "match_time": "65:00",
      "message_count": 500,
      "last_message_at": "2024-12-07T16:10:00Z",
      "subscribed": true,
      "created_at": "2024-12-07T10:00:00Z",
      "updated_at": "2024-12-07T16:10:00Z",
      "sport": "SOCCER",
      "sport_name": "足球",
      "match_status_mapped": "2nd_half",
      "match_status_name": "下半场",
      "match_time_mapped": "65:00",
      "home_team_id_mapped": "1",
      "away_team_id_mapped": "2",
      "is_live": true,
      "is_ended": false,
      "markets": {
        "1": {
          "sr_market_id": "1",
          "market_name": "1X2",
          "specifiers": {
            "default": {
              "specifier": "",
              "status": "active",
              "producer_id": 1,
              "outcomes": [
                {
                  "outcome_id": "1",
                  "name": "Home",
                  "outcome_name": "主胜",
                  "odds": 1.50,
                  "probability": 0.65,
                  "active": true
                }
              ],
              "updated_at": "2024-12-07T16:09:00Z"
            }
          }
        }
      }
    }
  ]
}
```

### 字段说明

- **`event_id`**: 赛事的唯一标识符。
- **`srn_id`**: Sportradar 提供的赛事 URN。
- **`sport_id`**: 体育类型 ID。
- **`status`**: 赛事的原始状态 (`live`, `ended` 等)。
- **`schedule_time`**: 比赛计划开始时间。
- **`home_team_name` / `away_team_name`**: 主客队名称。
- **`home_score` / `away_score`**: 主客队比分。
- **`match_status`**: 比赛内部状态,如 `2nd_half`。
- **`match_time`**: 比赛进行时间。
- **`message_count`**: 该赛事接收到的消息总数,可作为热度指标。
- **`subscribed`**: 是否已订阅该赛事。
- **`sport_name`**: 映射后的体育类型中文名称。
- **`match_status_name`**: 映射后的比赛状态中文名称。
- **`is_live`**: 是否为进行中的比赛 (根据 `status` 字段判断)。
- **`is_ended`**: 是否为已结束的比赛。
- **`markets`**: 盘口数据,一个以盘口 ID 为键的 map。
  - **`market_name`**: 盘口名称,已根据盘口描述服务进行本地化。
  - **`specifiers`**: 盘口的 specifier 分组,以 specifier 字符串为键。
    - **`outcomes`**: 该 specifier 下的所有投注项。
      - **`outcome_name`**: 投注项名称,已本地化。
      - **`odds`**: 赔率。
      - **`active`**: 是否可投注。

---

## 4. 示例请求

### 示例 1: 获取所有进行中的足球比赛,按热度降序排序

```
GET /api/events?sport_id=sr:sport:1&is_live=true&sort_by=popularity&sort_order=desc
```

### 示例 2: 获取已订阅且包含 "1X2" 和 "大小球" 盘口的未结束比赛

```
GET /api/events?subscribed=true&is_ended=false&market_ids=1,18
```

### 示例 3: 搜索队伍名称包含 "United" 的比赛,每页返回 10 条

```
GET /api/events?search=United&page_size=10
```

---

## 5. 缓存机制

为了提高性能,该接口实现了一套查询缓存机制。当使用相同的查询参数组合发起请求时,服务器会直接返回缓存的结果,从而大大减少数据库负载和响应时间。

- **缓存键:** 根据所有查询参数生成唯一的缓存键。
- **缓存时间:** 默认为 30 秒。
- **缓存命中:** 当缓存命中时,响应头中会包含 `X-Cache: HIT`。
- **缓存未命中:** 当缓存未命中时,响应头中会包含 `X-Cache: MISS`,服务器会执行数据库查询并将结果存入缓存。

---

## 6. 总结

`GET /api/events` 是一个高度优化的、功能全面的赛事查询接口。通过组合使用其丰富的过滤和排序参数,开发者可以高效地获取所需的数据,满足各种复杂的前端展示需求。其内置的缓存和数据映射机制进一步提升了性能和开发效率,使其成为 `uof-service` 中最核心的数据查询接口之一。
