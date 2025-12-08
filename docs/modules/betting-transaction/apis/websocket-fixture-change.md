---
title: Fixture Change - 比赛变化消息
description: Websocket比赛赛程变更通知消息
category: Websocket消息
tags:
  - websocket
  - fixture
  - change
---

# Fixture Change - 比赛变化消息

## 消息说明

赛程变更通知，当赛程变更时会发送fixture_change消息。当比赛被添加到实时赔率程序中时，您也将收到赛程变更通知。

## Websocket连接信息

**地址:** `wss://xpbet-ws-api.helix.city/ws`

## 消息格式

### 消息结构

\`\`\`
cmd: 10010
time: 1764843686186
data: {消息数据}
\`\`\`

### 数据字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| change_type | number | 变更类型：1=常规变更，2=开始时间更新，3=已取消 |
| start_time | number | 比赛开始时间（毫秒时间戳） |
| product | number | 产品类型：1=滚球盘，3=赛前盘 |
| event_id | string | 比赛ID |
| timestamp | number | 消息时间戳（毫秒） |

### 消息示例

\`\`\`json
{
  "cmd": 10010,
  "time": 1764843686186,
  "data": {
    "change_type": 1,
    "start_time": 1765715400000,
    "product": 1,
    "event_id": "sr:match:65763330",
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
  
  if (message.cmd === 10010) {
    const { change_type, start_time, product, event_id, timestamp } = message.data;
    
    console.log('比赛变化消息:', {
      变更类型: change_type === 1 ? '常规变更' : change_type === 2 ? '时间更新' : '已取消',
      开始时间: new Date(start_time),
      产品类型: product === 1 ? '滚球盘' : '赛前盘',
      比赛ID: event_id,
      时间戳: new Date(timestamp)
    });
    
    // 处理比赛变化逻辑
    handleFixtureChange(message.data);
  }
};

function handleFixtureChange(data) {
  // 根据change_type处理不同的变更
  switch(data.change_type) {
    case 1:
      // 常规变更
      updateMatchInfo(data.event_id);
      break;
    case 2:
      // 更新开始时间
      updateMatchStartTime(data.event_id, data.start_time);
      break;
    case 3:
      // 比赛取消
      cancelMatch(data.event_id);
      break;
  }
}
\`\`\`

## 注意事项

1. 当比赛被添加到实时赔率程序中时也会收到此消息
2. change_type=3表示比赛已取消，需要特殊处理
3. start_time为毫秒时间戳，需要转换为日期时间
4. product字段区分滚球盘和赛前盘
