---
title: Odds Change - 赔率变化消息
description: Websocket赔率变化通知消息
category: Websocket消息
tags:
  - websocket
  - odds
  - change
---

# Odds Change - 赔率变化消息

## 消息说明

更新比赛中一个或多个盘口的赔率时，系统会发送消息。这些消息可能包含部分盘口，未包含的盘口赔率保持不变。对于每个已报告的盘口，消息中会包含所有当前结果及其相应的赔率。

## Websocket连接信息

**地址:** `wss://xpbet-ws-api.helix.city/ws`

## 消息格式

### 消息结构

\`\`\`
cmd: 10020
time: 1764843686186
data: {消息数据}
\`\`\`

### 数据字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| match_id | string | 比赛ID |
| product_id | number | 产品类型：1=滚球盘，3=赛前盘 |
| timestamp | number | 消息时间戳（毫秒） |
| status | number | 比赛状态 |
| match_status | number | 比赛状态 |
| home_score | number | 主队得分 |
| away_score | number | 客队得分 |
| results | any | 结果信息 |
| odds_markets | array | 赔率盘口列表 |

### Odds Markets字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | string | Market ID |
| status | string | 当前specifiers对应的outcomes状态：0=关停 |
| specifiers | string | Specifiers值，格式如"quarternr=1&#124;hcp=-1.5" |
| outcomes | array | 结果列表 |

### Outcomes字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | string | Odds ID |
| odds | number | 赔率值 |
| active | number | Odds状态：1=激活，0=未激活 |

### 消息示例

\`\`\`json
{
  "cmd": 10020,
  "time": 1764843686186,
  "data": {
    "match_id": "sr:match:63194829",
    "product_id": 1,
    "timestamp": 1764843686186,
    "status": 1,
    "match_status": 2,
    "home_score": 10,
    "away_score": 10,
    "results": null,
    "odds_markets": [
      {
        "id": "303",
        "status": "1",
        "specifiers": "quarternr=1|hcp=-1.5",
        "outcomes": [
          {
            "id": "1714",
            "odds": 1.87,
            "active": 1
          },
          {
            "id": "1715",
            "odds": 1.704,
            "active": 1
          }
        ]
      }
    ]
  }
}
\`\`\`

## 使用示例

### JavaScript

\`\`\`javascript
const ws = new WebSocket('wss://xpbet-ws-api.helix.city/ws');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.cmd === 10020) {
    const { match_id, odds_markets, home_score, away_score } = message.data;
    
    console.log('赔率变化消息:', {
      比赛ID: match_id,
      主队得分: home_score,
      客队得分: away_score,
      变化的盘口数: odds_markets.length
    });
    
    // 更新赔率
    odds_markets.forEach(market => {
      updateMarketOdds(match_id, market);
    });
  }
};

function updateMarketOdds(matchId, market) {
  const { id, status, specifiers, outcomes } = market;
  
  // 检查盘口状态
  if (status === "0") {
    console.log(\`盘口 \${id} 已关停\`);
    disableMarket(matchId, id);
    return;
  }
  
  // 更新每个结果的赔率
  outcomes.forEach(outcome => {
    if (outcome.active === 1) {
      updateOddsDisplay(matchId, id, outcome.id, outcome.odds);
    } else {
      disableOdds(matchId, id, outcome.id);
    }
  });
}
\`\`\`

## 注意事项

1. 消息可能只包含部分盘口，未包含的盘口赔率保持不变
2. 每个盘口会包含所有当前结果及其赔率
3. status=0表示盘口已关停，需要禁用投注
4. active=0表示该赔率选项已禁用
5. 需要根据specifiers解析盘口的具体参数
