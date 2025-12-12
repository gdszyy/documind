# Sportradar MTS投注类型文档：自定义投注 (Custom Bet)

**作者**: Manus AI
**日期**: 2025-12-12

## 1. 简介

自定义投注（Custom Bet），也常被称为“自建投注”（Bet Builder），允许用户将同一场比赛中的多个相关（非独立）选项组合成一个单一的投注。由于这些选项之间存在关联性，它们不能作为常规的累积投注处理。MTS API通过`type: "uf-custom-bet"`来支持此功能，其赔率是预先从UOF（统一赔率源）获取的综合赔率 [1]。

## 2. 业务说明 (Business Explanation)

### 2.1 概念与核心价值

自定义投注的核心价值在于**极高的灵活性和个性化**。它满足了用户对同一场比赛中多个事件进行组合预测的需求，例如“A队获胜”和“A队球员B进球”这两个选项是高度相关的。

- **非独立性处理**：常规累积投注要求选项独立。自定义投注通过复杂的算法（通常由Sportradar的UOF提供）计算出这些相关选项的综合赔率。
- **用户体验**：自定义投注极大地提升了用户参与度，是现代体育博彩平台不可或缺的功能。

### 2.2 业务示例

| 场景 | 投注类型 | 描述 | 关键业务点 |
| :--- | :--- | :--- | :--- |
| **足球** | 单场三选 | 组合“主队获胜”、“总进球数大于2.5”和“主队球员获得一张黄牌”。 | 系统必须能够实时计算并提供这三个相关事件的综合赔率。 |
| **篮球** | 球员表现 | 组合“球员A得分超过20分”和“球员A助攻超过5次”。 | 两个选项都与球员A的表现相关，赔率计算需要考虑这种相关性。 |
| **赔率获取** | 综合赔率 | 客户端必须使用`uf-custom-bet`类型，并提供从UOF获取的综合赔率。 | 客户端不能自行计算赔率，必须依赖MTS/UOF提供的单一赔率。 |

## 3. 单场足球自定义投注示例 (Single Custom Bet on Soccer with Three Selections)

### 3.1 投注详情

- **投注类型**: 自定义投注 (`type: "uf-custom-bet"`)
- **赛事**: 单场足球比赛 (`eventId: "sr:match:66389934"`)
- **投注金额**: 10欧元
- **综合赔率**: 1.11（所有三个选项的综合赔率）
- **嵌套选项**: 3个（比赛结果、总进球数1.5、总进球数3.5）

### 3.2 投注请求 (Ticket Placement Request)

```json
{
  "operatorId": 9985,
  "content": {
    "type": "ticket",
    "ticketId": "Ticket_818937",
    "bets": [
      {
        "selections": [
          {
            "type": "uf-custom-bet",
            "selections": [
              {
                "type": "uf",
                "productId": "3",
                "eventId": "sr:match:66389934",
                "marketId": "1",
                "outcomeId": "1"
              },
              {
                "type": "uf",
                "productId": "3",
                "eventId": "sr:match:66389934",
                "marketId": "18",
                "specifiers": "total=1.5"
              },
              {
                "type": "uf",
                "productId": "3",
                "eventId": "sr:match:66389934",
                "marketId": "18",
                "specifiers": "total=3.5"
              }
            ],
            "odds": {
              "type": "decimal",
              "value": "1.11"
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

## 4. 参考文献

[1] Sportradar Customer Documentation. (2025). *Bet Types Examples (singles, accumulators, custom bets...)*. Retrieved from https://docs.sportradar.com/mts/transaction-3.0-api/mts-related-transaction-examples/bet-types-examples-singles-accumulators-custom-bets...
