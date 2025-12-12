# Sportradar MTS投注类型文档：累积投注 (Accumulator Bet)

**作者**: Manus AI
**日期**: 2025-12-12

## 1. 简介

累积投注（Accumulator Bet），也称为多重彩或过关投注，是将两个或多个独立选项组合成一个单一的投注。要赢得累积投注，所有选择的选项都必须正确。MTS API通过在`selections`数组中包含多个`uf`类型选项来表示累积投注 [1]。

## 2. 业务说明 (Business Explanation)

### 2.1 概念与风险

累积投注的**核心吸引力在于高回报**。由于每个选项的赔率是相乘的，即使是小额投注，也有可能带来巨额奖金。然而，其**核心风险在于“全有或全无”**的性质：只要其中一个选项失败，整个投注就会失败。

- **赔率计算**：累积投注的总赔率是所有单个选项赔率的乘积。
- **市场需求**：累积投注是吸引休闲玩家和追求高风险高回报用户的关键产品。

### 2.2 业务示例

| 场景 | 投注类型 | 描述 | 关键业务点 |
| :--- | :--- | :--- | :--- |
| **双倍** | 足球比赛 | 预测A队胜（赔率1.5）和B队进球数大于2.5（赔率2.0）。 | 总赔率为3.0 (1.5 * 2.0)。系统需确保两个选项都是独立的。 |
| **多重彩** | 跨赛事 | 组合五场不同比赛的获胜者预测。 | 任何一场比赛结果错误，投注即失败。系统需处理不同赛事ID和市场。 |
| **高赔率** | 冠军赛+常规赛 | 组合一个赛季冠军预测和一个单场比赛让球盘预测。 | 赔率高，但结算周期长，需要系统能正确处理不同类型的`eventId`。 |

## 3. 双倍赛前投注示例 (Double Pre-match Bet)

### 3.1 投注详情

- **产品类型**: 赛前投注 (`productId: "3"`)
- **投注金额**: 10毫比特币（mBTC）
- **投注数量**: 1个投注，包含2个选项（双倍投注）
- **选项1**: 冠军赛获胜者预测
- **选项2**: 比赛让球盘预测 (`specifiers: "hcp=1:0"`)

### 3.2 投注请求 (Ticket Placement Request)

```json
{
  "operatorId": 9985,
  "content": {
    "type": "ticket",
    "ticketId": "Ticket_3668",
    "bets": [
      {
        "selections": [
          {
            "type": "uf",
            "productId": "3",
            "eventId": "sr:season:54837",
            "marketId": "534",
            "outcomeId": "pre:outcometext:9826",
            "specifiers": "variant=pre:markettext:62723",
            "odds": {
              "type": "decimal",
              "value": "1.36"
            }
          },
          {
            "type": "uf",
            "productId": "3",
            "eventId": "sr:match:14950205",
            "marketId": "14",
            "outcomeId": "1712",
            "specifiers": "hcp=1:0",
            "odds": {
              "type": "decimal",
              "value": "1.59"
            }
          }
        ],
        "stake": [
          {
            "type": "cash",
            "currency": "mBTC",
            "amount": "10"
          }
        ]
      }
    ]
  }
}
```

## 4. 参考文献

[1] Sportradar Customer Documentation. (2025). *Bet Types Examples (singles, accumulators, custom bets...)*. Retrieved from https://docs.sportradar.com/mts/transaction-3.0-api/mts-related-transaction-examples/bet-types-examples-singles-accumulators-custom-bets...
