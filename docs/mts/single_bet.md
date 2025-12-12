# Sportradar MTS投注类型文档：单注投注 (Single Bet)

**作者**: Manus AI
**日期**: 2025-12-12

## 1. 简介

单注投注（Single Bet）是最基础的投注形式，即对单一事件的单个结果进行投注。MTS API通过`productId`字段区分不同类型的单注，例如赛前投注和滚球投注 [1]。

## 2. 业务说明 (Business Explanation)

### 2.1 概念与应用

单注投注是用户最常接触的投注类型，其核心在于**单一选择，独立结算**。无论投注是赛前还是滚球，其风险和回报都只取决于该单一选项的结果。

- **赛前投注 (Pre-match)**：在赛事开始前接受投注。赔率相对稳定，主要用于预测最终结果。
- **滚球投注 (Live/In-Play)**：在赛事进行中接受投注。赔率实时变动，要求系统具备高并发和低延迟的响应能力。

### 2.2 业务示例

| 场景 | 投注类型 | 描述 | 关键业务点 |
| :--- | :--- | :--- | :--- |
| **赛前** | 1X2市场 | 用户在足球比赛开始前，投注100元预测主队获胜。 | 赔率在投注时锁定，交易量大，风险相对可控。 |
| **滚球** | 下一进球 | 在篮球比赛进行到第三节时，用户投注50元预测下一分钟内会有得分。 | 赔率波动剧烈，系统需实时处理赔率变化和投注延迟。 |
| **多币种** | 赛前 | 一位使用丹麦克朗（DKK）的用户投注，系统需进行货币转换。 | 交易API需返回准确的汇率（`exchangeRate`）和转换后的金额。 |

## 3. 赛前单注 (Pre-match Single Bet)

### 3.1 投注详情

- **产品类型**: 赛前投注 (`productId: "3"`)
- **市场**: 1X2市场 (`marketId: "1"`)
- **结果**: 客队胜 (`outcomeId: "2"`)
- **投注金额**: 10.00欧元现金

### 3.2 投注请求 (Ticket Placement Request)

```json
{
  "operatorId": 9985,
  "content": {
    "type": "ticket",
    "ticketId": "Ticket_3691",
    "bets": [
      {
        "selections": [
          {
            "type": "uf",
            "productId": "3",
            "eventId": "sr:match:15050881",
            "marketId": "1",
            "outcomeId": "2",
            "odds": {
              "type": "decimal",
              "value": "1.32"
            }
          }
        ],
        "stake": [
          {
            "type": "cash",
            "currency": "EUR",
            "amount": "10"
          }
        ]
      }
    ]
  }
}
```

## 4. 滚球单注 (Live Single Bet)

### 4.1 投注详情

- **产品类型**: 滚球投注 (`productId: "1"`)
- **市场**: 1X2市场 (`marketId: "1"`)
- **结果**: 客队胜 (`outcomeId: "2"`)
- **投注金额**: 12.00丹麦克朗现金
- **渠道**: 移动设备 (`channel.type: "mobile"`)

### 4.2 投注请求 (Ticket Placement Request)

```json
{
  "operatorId": 9985,
  "content": {
    "type": "ticket",
    "ticketId": "Ticket_3690",
    "bets": [
      {
        "selections": [
          {
            "type": "uf",
            "productId": "1",
            "eventId": "sr:match:16470657",
            "marketId": "1",
            "outcomeId": "2",
            "odds": {
              "type": "decimal",
              "value": "7.1"
            }
          }
        ],
        "stake": [
          {
            "type": "cash",
            "currency": "DKK",
            "amount": "12"
          }
        ]
      }
    ]
  }
}
```

## 5. 参考文献

[1] Sportradar Customer Documentation. (2025). *Bet Types Examples (singles, accumulators, custom bets...)*. Retrieved from https://docs.sportradar.com/mts/transaction-3.0-api/mts-related-transaction-examples/bet-types-examples-singles-accumulators-custom-bets...
