---
title: Bet Settlement - 结算消息
description: Websocket投注结算通知消息
category: Websocket消息
tags:
  - websocket
  - settlement
  - result
---

# Bet Settlement - 结算消息

## 消息说明

投注结算消息，用于通知投注的最终结果。

## Websocket连接信息

**地址:** `wss://xpbet-ws-api.helix.city/ws`

## 消息格式

### 消息结构

\`\`\`
cmd: 10040
time: 1764843686186
data: {消息数据}
\`\`\`

### 数据字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| event_id | string | 比赛ID |
| product | number | 产品类型：1=LiveOdds，2=MTS，3=BetradarCtrl，4=Betpal，5=premium cricket |
| timestamp | number | 生成时间（毫秒） |
| certainty | number | 确定性：1=现场，2=官方 |
| outcomes | object | 结算结果 |

### Outcomes字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| market | array | Market结算列表 |

### Market字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | string/number | Market ID |
| specifiers | string | Specifiers值 |
| outcome | array | 结果列表 |

### Outcome字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | string/number | Odds ID |
| result | number | 结果：-1=void（无效），0=lose（输），1=win（赢），0.5=half-win（半赢） |
| void_factor | number | 无效因子，默认0.5 |
| dead_heat_factor | number | 并列因子，默认0.5 |

### 消息示例

\`\`\`json
{
  "cmd": 10040,
  "time": 1764843686186,
  "data": {
    "event_id": "sr:match:65763330",
    "product": 1,
    "timestamp": 1764843686186,
    "certainty": 2,
    "outcomes": {
      "market": [
        {
          "id": 303,
          "specifiers": "quarternr=1|hcp=-1.5",
          "outcome": [
            {
              "id": 1714,
              "result": 1,
              "void_factor": 0.5,
              "dead_heat_factor": 0.5
            },
            {
              "id": 1715,
              "result": 0,
              "void_factor": 0.5,
              "dead_heat_factor": 0.5
            }
          ]
        }
      ]
    }
  }
}
\`\`\`

## 使用示例

### JavaScript

\`\`\`javascript
const ws = new WebSocket('wss://xpbet-ws-api.helix.city/ws');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.cmd === 10040) {
    const { event_id, product, certainty, outcomes, timestamp } = message.data;
    
    console.log('结算消息:', {
      比赛ID: event_id,
      产品类型: getProductName(product),
      确定性: certainty === 1 ? '现场' : '官方',
      时间戳: new Date(timestamp)
    });
    
    // 处理结算
    handleSettlement(message.data);
  }
};

function getProductName(product) {
  const productNames = {
    1: 'LiveOdds',
    2: 'MTS',
    3: 'BetradarCtrl',
    4: 'Betpal',
    5: 'Premium Cricket'
  };
  return productNames[product] || '未知';
}

function handleSettlement(data) {
  const { event_id, outcomes, certainty } = data;
  
  outcomes.market.forEach(market => {
    console.log(\`Market ID: \${market.id}\`);
    console.log(\`Specifiers: \${market.specifiers}\`);
    
    market.outcome.forEach(outcome => {
      const resultText = getResultText(outcome.result);
      console.log(\`Outcome \${outcome.id}: \${resultText}\`);
      
      // 查找相关投注并结算
      settleBets(event_id, market.id, outcome.id, outcome.result, outcome.void_factor, outcome.dead_heat_factor);
    });
  });
}

function getResultText(result) {
  if (result === -1) return 'void（无效）';
  if (result === 0) return 'lose（输）';
  if (result === 1) return 'win（赢）';
  if (result === 0.5) return 'half-win（半赢）';
  return '未知';
}

function settleBets(eventId, marketId, outcomeId, result, voidFactor, deadHeatFactor) {
  // 查找相关投注
  const bets = findBetsByOutcome(eventId, marketId, outcomeId);
  
  bets.forEach(bet => {
    let payout = 0;
    
    switch(result) {
      case -1: // void
        payout = bet.amount * voidFactor;
        break;
      case 0: // lose
        payout = 0;
        break;
      case 1: // win
        payout = bet.amount * bet.odds * deadHeatFactor;
        break;
      case 0.5: // half-win
        payout = bet.amount + (bet.amount * (bet.odds - 1) / 2);
        break;
    }
    
    // 执行结算
    settleBet(bet.id, result, payout);
  });
}

function findBetsByOutcome(eventId, marketId, outcomeId) {
  // 实现查找逻辑
  return [];
}

function settleBet(betId, result, payout) {
  console.log(\`结算投注: \${betId}, 结果: \${result}, 派彩: \${payout}\`);
  // 实现结算逻辑
}
\`\`\`

## 注意事项

1. certainty=1表示现场结算，certainty=2表示官方结算
2. result值说明：
   - -1: void（无效），需要根据void_factor退款
   - 0: lose（输），不派彩
   - 1: win（赢），全额派彩
   - 0.5: half-win（半赢），半额派彩
3. void_factor和dead_heat_factor用于计算特殊情况下的派彩金额
4. 官方结算为最终结算，现场结算可能会被官方结算覆盖
