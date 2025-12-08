---
title: 获取比赛Market列表
description: 获取指定比赛的所有盘口（market）信息，包括赔率、状态等
endpoint: /v1/match/{match_id}/market
method: GET
category: 比赛详情
tags:
  - match
  - market
  - odds
---

# 获取比赛Market列表

## 接口说明

获取指定比赛的所有盘口（market）信息，包括各种玩法的赔率、状态、结果等详细数据。支持分页查询。

## 请求信息

### 请求路径

\`\`\`
GET /v1/match/{match_id}/market
\`\`\`

### 路径参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| match_id | string | 是 | 比赛ID | sr:match:65919704 |

### Query参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| cursor | string | 否 | 分页游标，使用上次响应中的next_cursor值 | xxxxxxxxxx |
| limit | number | 否 | 每页返回数量，默认20 | 20 |

### 请求示例

\`\`\`bash
curl -X GET "https://api.example.com/v1/match/sr:match:65919704/market?limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
\`\`\`

## 响应信息

### Specifier状态说明

| 状态值 | 状态名 | 说明 |
|--------|--------|------|
| 1 | active | 显示赔率且接受门票 |
| -1 | suspended | 显示赔率但不接受门票 |
| 0 | deactivated | 停止显示赔率且不接受门票 |
| -2 | handed_over | 已移交 |
| -4 | cancelled | 已取消（恢复期间可能出现） |
| -3 | settled | 已结算（恢复期间可能出现） |

**注意：** 如果状态不存在，则默认值为active(1)。

### 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| code | string | 响应状态码，"0"表示成功 |
| data | object | 响应数据 |
| data.next_cursor | string | 下一页游标，用于分页 |
| data.list | array | Market列表 |
| data.list[].id | number | Market内部ID |
| data.list[].market_id | number | Market ID |
| data.list[].match_id | string | 比赛ID |
| data.list[].name | string | Market名称 |
| data.list[].specifiers | array | Specifier列表 |
| data.list[].specifiers[].id | number | Specifier ID |
| data.list[].specifiers[].specifier_value | string | Specifier值 |
| data.list[].specifiers[].specifier_status | number | Specifier状态 |
| data.list[].specifiers[].outcomes | array | 结果列表 |
| data.list[].specifiers[].outcomes[].id | number | 结果ID |
| data.list[].specifiers[].outcomes[].name | string | 结果名称 |
| data.list[].specifiers[].outcomes[].odds | number | 赔率 |
| data.list[].specifiers[].outcomes[].active | number | 是否激活（1=是，0=否） |
| message | string | 响应消息 |

### 成功响应示例

\`\`\`json
{
    "code": "0",
    "data": {
        "next_cursor": "xxxxxxxxxx",
        "list": [
            {
                "id": 33,
                "market_id": 302,
                "match_id": "sr:match:63130277",
                "name": "{!quarternr} quarter - draw no bet",
                "specifiers": [
                    {
                        "id": 26,
                        "specifier_value": "quarternr=1",
                        "specifier_status": 0,
                        "outcomes": [
                            {
                                "id": 4,
                                "name": "{$competitor1}",
                                "odds": 1.73,
                                "active": 1
                            },
                            {
                                "id": 5,
                                "name": "{$competitor2}",
                                "odds": 1.719,
                                "active": 1
                            }
                        ]
                    },
                    {
                        "id": 28,
                        "specifier_value": "quarternr=2",
                        "outcomes": [
                            {
                                "id": 4,
                                "name": "{$competitor1}",
                                "odds": 1.73,
                                "active": 1
                            },
                            {
                                "id": 5,
                                "name": "{$competitor2}",
                                "odds": 1.719,
                                "active": 1
                            }
                        ]
                    }
                ]
            },
            {
                "id": 982,
                "market_id": 64,
                "match_id": "sr:match:63130277",
                "name": "1st half - draw no bet",
                "specifiers": []
            }
        ]
    },
    "message": "success"
}
\`\`\`

### 错误响应示例

\`\`\`json
{
    "code": 50000004,
    "data": null,
    "message": "verify ID token failed: ID token has expired at: 1758875631\n"
}
\`\`\`

## 使用示例

### cURL

\`\`\`bash
curl -X GET "https://api.example.com/v1/match/sr:match:65919704/market?limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
\`\`\`

### JavaScript

\`\`\`javascript
const matchId = 'sr:match:65919704';
const limit = 20;

async function getMatchMarkets(matchId, cursor = null) {
  const url = new URL(\`https://api.example.com/v1/match/\${matchId}/market\`);
  url.searchParams.append('limit', limit);
  if (cursor) {
    url.searchParams.append('cursor', cursor);
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  console.log('Market数据:', data);
  
  // 如果有下一页，继续获取
  if (data.data && data.data.next_cursor) {
    await getMatchMarkets(matchId, data.data.next_cursor);
  }
}

getMatchMarkets(matchId);
\`\`\`

## 注意事项

1. 需要有效的认证Token才能访问此接口
2. 支持分页查询，使用cursor参数获取下一页数据
3. specifier_status状态决定了该盘口是否可投注
4. 赔率数据会实时更新
5. name字段中的{!quarternr}、{$competitor1}等为占位符，需要根据specifier_value替换
