---
title: Alive - UOF心跳消息
description: Websocket心跳消息，用于检测UOF服务状态
category: Websocket消息
tags:
  - websocket
  - alive
  - heartbeat
---

# Alive - UOF心跳消息

## 消息说明

UOF服务心跳消息，用于检测服务是否正常运行。当offset_time > 20时，表示UOF停止服务，须停止所有比赛及其相关周边等。

## Websocket连接信息

**地址:** `wss://xpbet-ws-api.helix.city/ws`

## 消息格式

### 消息结构

\`\`\`
cmd: 10000
time: 1764843686186
data: {消息数据}
\`\`\`

### 数据字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| last_alive_time | number | 最后一次alive时间（Unix时间戳，秒） |
| now_alive_time | number | 当前时间（Unix时间戳，秒） |
| offset_time | number | 间隔时长（秒） |

### 消息示例

\`\`\`json
{
  "cmd": 10000,
  "time": 1764843686186,
  "data": {
    "last_alive_time": 0,
    "now_alive_time": 1764991536,
    "offset_time": 1764991536
  }
}
\`\`\`

## 使用示例

### JavaScript

\`\`\`javascript
const ws = new WebSocket('wss://xpbet-ws-api.helix.city/ws');
const MAX_OFFSET_TIME = 20; // 最大允许间隔时间（秒）

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.cmd === 10000) {
    const { last_alive_time, now_alive_time, offset_time } = message.data;
    
    console.log('心跳消息:', {
      上次心跳: new Date(last_alive_time * 1000),
      当前时间: new Date(now_alive_time * 1000),
      间隔时长: offset_time + '秒'
    });
    
    // 检查服务状态
    if (offset_time > MAX_OFFSET_TIME) {
      console.error('UOF服务已停止！');
      handleServiceDown();
    } else {
      console.log('UOF服务正常');
      handleServiceAlive();
    }
  }
};

function handleServiceDown() {
  // 停止所有比赛
  stopAllMatches();
  
  // 禁用投注功能
  disableBetting();
  
  // 显示服务维护提示
  showMaintenanceNotice();
}

function handleServiceAlive() {
  // 恢复服务
  resumeService();
}
\`\`\`

## 注意事项

1. **重要：** offset_time > 20 时表示UOF服务停止，必须立即停止所有比赛及相关功能
2. 建议定期检查心跳消息，确保服务正常运行
3. last_alive_time为0可能表示首次连接
4. 时间戳为Unix时间戳（秒），需要乘以1000转换为毫秒
