---
title: BetCancel - 取消投注消息
description: Websocket取消投注通知消息
category: Websocket消息
tags:
  - websocket
  - betcancel
  - refund
---

# BetCancel - 取消投注消息

## 消息说明

需要取消并退款时，会发送bet_cancel消息。

## Websocket连接信息

**地址:** `wss://xpbet-ws-api.helix.city/ws`

## 消息格式

### 消息结构

\`\`\`
cmd: 10050
time: 1764843686186
data: {消息数据}
\`\`\`

### 数据字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| event_id | string | 比赛ID |
| product | number | 产品类型：1=LiveOdds，2=MTS，3=BetradarCtrl，4=Betpal，5=premium cricket |
| timestamp | number | 生成时间（毫秒） |
| start_time | number | 开始时间（毫秒） |
| end_time | number | 结束时间（毫秒） |
| market | array | 需要取消的Market列表 |

### Market字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | string/number | Market ID |
| name | string | Market名称 |
| specifiers | string | Specifiers值 |
| void_reason | string | 取消原因 |

### 消息示例

\`\`\`json
{
  "cmd": 10050,
  "time": 1764843686186,
  "data": {
    "event_id": "sr:match:65763330",
    "product": 1,
    "timestamp": 1764843686186,
    "start_time": 1764843600000,
    "end_time": 1764847200000,
    "market": [
      {
        "id": 303,
        "name": "quarter - handicap",
        "specifiers": "quarternr=1|hcp=-1.5",
        "void_reason": "比赛取消"
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
  
  if (message.cmd === 10050) {
    const { event_id, product, market, timestamp } = message.data;
    
    console.log('取消投注消息:', {
      比赛ID: event_id,
      产品类型: getProductName(product),
      取消的市场数: market.length,
      时间戳: new Date(timestamp)
    });
    
    // 处理投注取消
    handleBetCancel(message.data);
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

function handleBetCancel(data) {
  const { event_id, market, start_time, end_time } = data;
  
  market.forEach(m => {
    console.log(\`取消Market: \${m.name} (ID: \${m.id})\`);
    console.log(\`取消原因: \${m.void_reason}\`);
    
    // 查找该时间段内的相关投注
    const bets = findBetsByTimeRange(event_id, m.id, start_time, end_time);
    
    // 取消并退款
    bets.forEach(bet => {
      cancelBet(bet.id);
      refundBet(bet.id, bet.amount);
    });
  });
}

function findBetsByTimeRange(eventId, marketId, startTime, endTime) {
  // 实现查找逻辑
  // 返回在指定时间范围内的投注列表
  return [];
}

function cancelBet(betId) {
  console.log(\`取消投注: \${betId}\`);
  // 实现取消逻辑
}

function refundBet(betId, amount) {
  console.log(\`退款: \${betId}, 金额: \${amount}\`);
  // 实现退款逻辑
}
\`\`\`

## 注意事项

1. 收到此消息后需要立即取消相关投注并退款
2. 需要根据start_time和end_time查找该时间段内的投注
3. void_reason字段说明了取消的原因，应该告知用户
4. product字段区分不同的产品类型
