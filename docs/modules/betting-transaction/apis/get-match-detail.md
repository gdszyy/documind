---
title: 获取比赛详情Header
description: 获取指定比赛的详细信息，包括比赛基本信息、参赛队伍、比分等
endpoint: /v1/match/{match_id}
method: GET
category: 比赛详情
tags:
  - match
  - detail
  - header
---

# 获取比赛详情Header

## 接口说明

获取指定比赛的详细header信息，包括比赛基本信息、参赛队伍、比分等核心数据。

## 请求信息

### 请求路径

\`\`\`
GET /v1/match/{match_id}
\`\`\`

### 路径参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| match_id | string | 是 | 比赛ID | sr:match:61743302 |

### 请求示例

\`\`\`bash
curl -X GET "https://api.example.com/v1/match/sr:match:61743302" \
  -H "Authorization: Bearer YOUR_TOKEN"
\`\`\`

## 响应信息

### 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| code | string | 响应状态码，"0"表示成功 |
| data | object | 比赛详情数据 |
| data.id | number | 内部ID |
| data.match_id | string | 比赛ID |
| data.sport_id | string | 体育项目ID |
| data.category_id | string | 赛区ID |
| data.tournament_id | string | 联赛ID |
| data.start_time | number | 比赛开始时间（Unix时间戳） |
| data.status | number | 状态 |
| data.match_status | number | 比赛状态 |
| data.match_status_name | string | 比赛状态名称 |
| data.home_competitor | object | 主队信息 |
| data.home_competitor.id | number | 主队内部ID |
| data.home_competitor.competitor_id | string | 主队ID |
| data.home_competitor.logo | string | 主队Logo URL |
| data.home_competitor.name | string | 主队名称 |
| data.home_competitor.score | number | 主队得分 |
| data.away_competitor | object | 客队信息 |
| data.away_competitor.id | number | 客队内部ID |
| data.away_competitor.competitor_id | string | 客队ID |
| data.away_competitor.logo | string | 客队Logo URL |
| data.away_competitor.name | string | 客队名称 |
| data.away_competitor.score | number | 客队得分 |
| message | string | 响应消息 |

### 成功响应示例

\`\`\`json
{
    "code": "0",
    "data": {
        "id": 1,
        "match_id": "sr:match:61743302",
        "sport_id": "sr:sport:2",
        "category_id": "sr:category:111",
        "tournament_id": "sr:tournament:1165",
        "start_time": 1765116000,
        "status": 0,
        "match_status": 0,
        "match_status_name": "Not started",
        "home_competitor": {
            "id": 2884,
            "competitor_id": "sr:competitor:35347",
            "logo": "",
            "name": "BBC Bayreuth",
            "score": 0
        },
        "away_competitor": {
            "id": 3462,
            "competitor_id": "sr:competitor:3520",
            "logo": "",
            "name": "Giants Leverkusen",
            "score": 0
        }
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
curl -X GET "https://api.example.com/v1/match/sr:match:61743302" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
\`\`\`

### JavaScript

\`\`\`javascript
const matchId = 'sr:match:61743302';

fetch(\`https://api.example.com/v1/match/\${matchId}\`, {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => {
    console.log('比赛详情:', data);
  })
  .catch(error => {
    console.error('获取失败:', error);
  });
\`\`\`

## 注意事项

1. 需要有效的认证Token才能访问此接口
2. match_id必须是有效的Sportradar比赛ID格式
3. 比赛状态和得分会实时更新
4. Token过期时会返回50000004错误码
