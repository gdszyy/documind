---
id: get-match-list
type: api
title: 获取比赛列表
status: completed
createdAt: '2025-12-07'
updatedAt: '2025-12-07'
description: '获取比赛列表，支持多种筛选条件和分页。'
owner: 'Manus AI'
tags: ['比赛', '筛选', '列表']
version: '1.0'
apiType: REST
endpoint: '/v1/match'
method: 'GET'
---

# GET /v1/match 接口文档

**版本:** 1.0  
**生成日期:** 2025-12-07  
**作者:** Manus AI

---

## 1. 接口概述

获取比赛列表，支持多种筛选条件和分页。

该接口是UOF首页API的一部分，用于提供前端应用所需的数据支持。

---

## 2. 请求参数


| 参数名 | 类型 | 必填 | 描述 |
|---|---|---|---|
| `sport_id` | string | 否 | 体育类型，例如：足球、篮球 |
| `tournament_id` | string | 否 | 联赛，例如：世界杯、中超、NBA |
| `status` | string | 否 | 状态：0-未开赛、1-live（不包含取消、已结束） |
| `market_id` | string | 否 | 玩法ID |
| `start_from` | number | 否 | 开赛筛选范围时间戳（起始） |
| `start_to` | number | 否 | 开赛筛选范围时间戳（结束） |
| `cursor` | string | 是 | 后端返回的next_cursor的值 |
| `limit` | number | 是 | 每页数量，默认20 |


---

## 3. 响应格式

### 3.1 成功响应

**HTTP 状态码:** 200

**响应体示例:**

```json
{
    "code": "0",
    "data": {
        "next_cursor": "eyJ0cyI6IjIwMjUtMTItMDVUMDA6MDA6MDBaIiwiaWQiOjEyMzQ1fQ",
        "list": [
            {
                "id": 179710,
                "match_id": "sr:match:61794908",
                "sport_id": "sr:sport:2",
                "category_id": "sr:category:103",
                "tournament_id": "sr:tournament:17788",
                "start_time": 1764568800,
                "match_phase": 0,
                "status": 0,
                "match_status": 0,
                "match_status_name": "",
                "home_competitor": {
                    "id": 16922,
                    "competitor_id": "sr:competitor:6133",
                    "logo": "",
                    "name": "New Zealand",
                    "score": 0
                },
                "away_competitor": {
                    "id": 16908,
                    "competitor_id": "sr:competitor:6125",
                    "logo": "",
                    "name": "Australia",
                    "score": 0
                },
                "markets": []
            }
        ]
    },
    "message": "success"
}
```

### 3.2 错误响应

**HTTP 状态码:** 200 (业务错误通过code字段标识)

**响应体示例:**

```json
{
    "code": 50000004,
    "data": null,
    "message": "verify ID token failed"
}
```

**错误说明:**

- `code != "0"`: 表示请求失败
- `message`: 包含具体的错误信息

---

## 4. 使用示例

### 4.1 cURL 示例

```bash
curl -X GET \
  '/v1/match?sport_id=<value>&tournament_id=<value>' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json'
```

### 4.2 JavaScript 示例

```javascript
const response = await fetch('/v1/match?sport_id=value&tournament_id=value', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
if (data.code === '0') {
  console.log('Success:', data.data);
} else {
  console.error('Error:', data.message);
}
```

---

## 5. 注意事项

1. **认证**: 所有请求需要在Header中携带有效的Authorization Token
2. **响应格式**: 所有响应都遵循统一的格式，通过`code`字段判断成功或失败
3. **错误处理**: 当`code != "0"`时，应该展示`message`中的错误信息给用户
4. **分页**: 对于支持分页的接口，使用返回的`next_cursor`进行下一页查询

---

## 6. 相关文档

- [投注交易模块 API 文档](./README.md)
- [UOF Service API Documentation](../../README.md)

---

**文档生成时间:** 2025-12-07  
**文档维护者:** Manus AI
