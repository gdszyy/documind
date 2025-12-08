---
title: BetStop - 停止投注消息
description: Websocket停止投注通知消息
category: Websocket消息
tags:
  - websocket
  - betstop
  - suspend
---

# BetStop - 停止投注消息

## 消息说明

停止所有或部分市场应立即暂停（继续显示赔率，但不接受投注）。

## Websocket连接信息

**地址:** `wss://xpbet-ws-api.helix.city/ws`

## 消息格式

### 消息结构

\`\`\`
cmd: 10030
time: 1764843686186
data: {消息数据}
\`\`\`

### 数据字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| event_id | string | 比赛ID |
| market_status | string | 市场状态。如果该字段未填写，则应将指定的市场状态更改为"暂停"。如果填写，则应根据该字段的值将其暂停或停用 |
| product | number | 产品类型：1或3 |
| groups | string | 对应该暂停哪些市场——该值应为组名，"all"表示停止所有 |
| timestamp | number | 消息生成时间戳（毫秒） |

### 消息示例

\`\`\`json
{
  "cmd": 10030,
  "time": 1764843686186,
  "data": {
    "event_id": "sr:match:65763330",
    "market_status": "suspended",
    "product": 1,
    "groups": "all",
    "timestamp": 1764843686186
  }
}
\`\`\`

## 使用示例

### JavaScript

\`\`\`javascript
const ws = new WebSocket('wss://xpbet-ws-api.helix.city/ws');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.cmd === 10030) {
    const { event_id, market_status, product, groups, timestamp } = message.data;
    
    console.log('停止投注消息:', {
      比赛ID: event_id,
      市场状态: market_status || '暂停',
      产品类型: product === 1 ? '滚球盘' : '赛前盘',
      影响范围: groups === 'all' ? '所有市场' : groups,
      时间戳: new Date(timestamp)
    });
    
    // 处理停止投注
    handleBetStop(message.data);
  }
};

function handleBetStop(data) {
  const { event_id, market_status, groups } = data;
  
  if (groups === 'all') {
    // 停止该比赛的所有市场
    suspendAllMarkets(event_id);
  } else {
    // 停止指定组的市场
    suspendMarketGroups(event_id, groups);
  }
  
  // 根据market_status决定是暂停还是停用
  if (market_status) {
    updateMarketStatus(event_id, market_status);
  } else {
    // 默认暂停
    suspendMarkets(event_id);
  }
}

function suspendAllMarkets(eventId) {
  console.log(\`暂停比赛 \${eventId} 的所有市场\`);
  // 继续显示赔率，但禁用投注按钮
  // 实现具体的UI更新逻辑
}

function suspendMarketGroups(eventId, groups) {
  console.log(\`暂停比赛 \${eventId} 的市场组: \${groups}\`);
  // 实现具体的UI更新逻辑
}
\`\`\`

## 注意事项

1. 暂停状态下应继续显示赔率，但不接受投注
2. groups="all"表示停止所有市场
3. market_status字段为空时，默认将市场状态更改为"暂停"
4. 需要在UI上明确标识市场已暂停
