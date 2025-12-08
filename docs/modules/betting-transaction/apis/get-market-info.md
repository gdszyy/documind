---
title: 获取Market信息
description: 获取指定比赛和玩法的Market详细信息（Websocket专用）
endpoint: /v1/match/market
method: GET
category: Websocket专用接口
tags:
  - websocket
  - market
  - info
---

# 获取Market信息

## 接口说明

获取指定比赛和玩法的Market详细信息，主要用于Websocket服务中查询Market名称等信息。

## 请求信息

### 请求路径

\`\`\`
GET /v1/match/market
\`\`\`

### Query参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| match_id | string | 否 | 比赛ID | sr:match:63130277 |
| market_id | string | 否 | 玩法ID | 303 |

### 请求示例

\`\`\`bash
curl -X GET "https://api.example.com/v1/match/market?match_id=sr:match:63130277&market_id=303" \
  -H "Authorization: Bearer YOUR_TOKEN"
\`\`\`

## 响应信息

### 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| code | string | 响应状态码，"0"表示成功 |
| data | object | Market信息 |
| data.match_id | string | 比赛ID |
| data.market_id | number | Market ID |
| data.market_name | string | Market名称 |
| message | string | 响应消息 |

### 成功响应示例

\`\`\`json
{
    "code": "0",
    "data": {
        "match_id": "sr:match:63130277",
        "market_id": 303,
        "market_name": " quarter - handicap"
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
curl -X GET "https://api.example.com/v1/match/market?match_id=sr:match:63130277&market_id=303" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
\`\`\`

### JavaScript

\`\`\`javascript
const matchId = 'sr:match:63130277';
const marketId = 303;

fetch(\`https://api.example.com/v1/match/market?match_id=\${matchId}&market_id=\${marketId}\`, {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => {
    console.log('Market信息:', data);
  })
  .catch(error => {
    console.error('获取失败:', error);
  });
\`\`\`

## 注意事项

1. 此接口主要用于Websocket服务中查询Market信息
2. match_id和market_id参数都是可选的，可以单独使用或组合使用
3. 需要有效的认证Token才能访问此接口
