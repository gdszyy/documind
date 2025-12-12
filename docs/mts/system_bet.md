# Sportradar MTS投注类型文档：系统投注 (System Bet)

**作者**: Manus AI
**日期**: 2025-12-12

## 1. 简介

系统投注（System Bet）是一种复杂的投注形式，它允许玩家从一组选项中选择特定数量的组合进行投注。与累积投注不同，系统投注即使部分选项失败，也有机会获得奖金。MTS API通过`type: "system"`和`size`字段来定义系统投注的组合方式，并支持`Ways`和`Banker`等高级结构 [1]。

## 2. 业务说明 (Business Explanation)

### 2.1 概念与风险管理

系统投注是为那些希望在追求高回报的同时，降低累积投注“全输”风险的用户设计的。它通过将选项拆分成多个较小的累积投注（称为“组合”）来实现风险分散。

- **组合数量**：一个N/K系统投注（从N个选项中选择K个进行组合）会产生 $C(N, K)$ 个组合。
- **核心价值**：系统投注的核心业务价值在于**风险分散**和**部分回报**。用户可以容忍少量选项的失败。

### 2.2 高级结构：Ways与Banker

MTS系统投注支持两种关键的高级结构，用于进一步定制投注逻辑：

| 结构 | 描述 | 业务用途 | MTS API实现 |
| :--- | :--- | :--- | :--- |
| **Ways** | 将同一赛事中的多个相关选项捆绑在一起，作为一个整体参与系统组合。 | 解决同一赛事中不同市场（如比分和进球数）的**非独立性**问题。 | 使用`type: "ways"`嵌套在`system`选项内。 |
| **Banker** | 必须猜中的选项（胆）。如果Banker失败，整个系统投注失败。 | **提高赔率**和**控制成本**。Banker选项不参与系统组合的计算，但必须获胜。 | 作为独立的`uf`选项与`system`选项并列。 |

### 2.3 业务示例

| 场景 | 投注类型 | 描述 | 关键业务点 |
| :--- | :--- | :--- | :--- |
| **2/4系统** | 风险分散 | 选择了4场比赛，只要猜中其中任意2场即可获得奖金。 | 产生了 $C(4, 2) = 6$ 个双倍组合。用户支付6份投注金额。 |
| **3/4系统+1 Banker** | 提高回报 | 选择了5个选项，其中1个Banker必须赢，其余4个选项中猜中3个即可。 | 实际上是 $C(4, 3) = 4$ 个四重组合，每个组合都包含Banker。 |
| **2/4系统+Ways** | 复杂组合 | 选择了3个独立选项和1个Ways（包含2个选项），总共5个基础选项，以2/4系统进行组合。 | 系统需正确解析Ways结构，将其视为一个单元参与组合计算。 |

## 3. 系统投注2/4包含1个Ways示例

### 3.1 投注详情

- **系统类型**: 2/4系统 (`size: [2]`)
- **总选项数**: 5个（3个独立选项 + 1个Ways，Ways包含2个选项）
- **投注金额**: 80欧元

### 3.2 投注请求 (Ticket Placement Request)

```json
{
  "operatorId": 9985,
  "content": {
    "type": "ticket",
    "ticketId": "Ticket_4910",
    "bets": [
      {
        "selections": [
          {
            "type": "system",
            "size": [2],
            "selections": [
              {
                "type": "uf",
                "productId": "3",
                "eventId": "sr:match:14"
              },
              {
                "type": "uf",
                "productId": "3",
                "eventId": "sr:match:18"
              },
              {
                "type": "uf",
                "productId": "3",
                "eventId": "sr:match:15"
              },
              {
                "type": "ways",
                "selections": [
                  {
                    "type": "uf",
                    "productId": "3",
                    "eventId": "sr:match:16"
                  },
                  {
                    "type": "uf",
                    "productId": "3",
                    "eventId": "sr:match:16"
                  }
                ]
              }
            ]
          }
        ],
        "stake": [
          {
            "type": "cash",
            "currency": "EUR",
            "amount": "80"
          }
        ]
      }
    ]
  }
}
```

## 4. 系统投注3/4包含1个Banker示例

### 4.1 投注详情

- **系统类型**: 3/4系统包含1个Banker（实际为2/3系统+1个Banker）
- **总选项数**: 4个（3个系统选项 + 1个Banker）
- **投注金额**: 80欧元

### 4.2 投注请求 (Ticket Placement Request)

```json
{
  "operatorId": 9985,
  "content": {
    "type": "ticket",
    "ticketId": "Ticket_4909",
    "bets": [
      {
        "selections": [
          {
            "type": "system",
            "size": [2],
            "selections": [
              {
                "type": "uf",
                "productId": "3",
                "eventId": "sr:match:14"
              },
              {
                "type": "uf",
                "productId": "3",
                "eventId": "sr:match:18"
              },
              {
                "type": "uf",
                "productId": "3",
                "eventId": "sr:match:15"
              }
            ]
          },
          {
            "type": "uf",
            "productId": "3",
            "eventId": "sr:match:16"
          }
        ],
        "stake": [
          {
            "type": "cash",
            "currency": "EUR",
            "amount": "80"
          }
        ]
      }
    ]
  }
}
```

## 5. 参考文献

[1] Sportradar Customer Documentation. (2025). *Bet Types Examples (singles, accumulators, custom bets...)*. Retrieved from https://docs.sportradar.com/mts/transaction-3.0-api/mts-related-transaction-examples/bet-types-examples-singles-accumulators-custom-bets...
