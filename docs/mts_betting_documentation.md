# Sportradar MTS投注类型文档

**作者**: Manus AI
**日期**: 2025-12-12

## 1. 简介

本文件旨在详细解释Sportradar的MTS（Managed Trading Services）交易API 3.0版本所支持的各种投注类型。通过具体的JSON示例，本文档将阐述如何构建和发送不同类型的投注请求，包括单注、累积投注、系统投注和自定义投注。所有信息均基于Sportradar官方文档 [1]。

## 2. 投注类型概览

MTS API支持多种投注类型，以满足不同业务场景的需求。下表总结了主要的投注类型及其特点：

| 投注类型 | 描述 | 关键特征 |
| --- | --- | --- |
| **单注 (Single)** | 对单个赛事结果的投注。 | 结构简单，一个投注单只包含一个选项。 |
| **累积投注 (Accumulator)** | 将多个独立选项组合成一个投注，所有选项必须全部猜中才能获胜。 | 赔率相乘，风险和潜在回报较高。 |
| **系统投注 (System Bet)** | 从多个选项中选择特定数量的组合进行投注，允许部分选项猜错。 | 灵活性高，通过组合降低风险。 |
| **自定义投注 (Custom Bet)** | 将同一场比赛中的多个相关选项组合成一个投注。 | 处理非独立选项，使用综合赔率。 |

---

接下来，我们将详细分析每种投注类型。

## 3. 单注 (Single Bet)

单注是最简单的投注形式，即对单一事件的单个结果进行投注。MTS API通过`productId`字段区分不同类型的单注，例如赛前投注和滚球投注。

### 3.1 赛前单注 (Pre-match Single Bet)

赛前单注是在比赛开始前进行的投注。以下是一个在1x2市场上进行的赛前单注示例。

> 此单注通过网页浏览器提交，投注10欧元，预测客队获胜，赔率为1.32。

**关键字段**:
- `"productId": "3"` 表示这是一个赛前投注。
- `"marketId": "1"` 代表1x2市场。
- `"outcomeId": "2"` 代表客队胜。

**投注请求 (Ticket Placement Request)**

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

### 3.2 滚球单注 (Live Single Bet)

滚球单注是在比赛进行中进行的投注。与赛前投注相比，滚球投注的赔率会实时变化。

> 此单注通过移动设备提交，投注12丹麦克朗，预测客队获胜，赔率为7.1。注意，此示例中包含了货币转换。

**关键字段**:
- `"productId": "1"` 表示这是一个滚球投注。
- `"currency": "DKK"` 表明投注货币为丹麦克朗，响应中的`exchangeRate`字段会提供其与系统货币（欧元）的汇率。

**投注请求 (Ticket Placement Request)**

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

## 4. 累积投注 (Accumulator Bet)

累积投注（也称为多重彩或parlay）是将多个独立选项组合成一个单一的投注。为了赢得累积投注，所有选择的选项都必须正确。MTS API通过在`selections`数组中包含多个选项来支持累积投注。

### 4.1 双倍赛前投注 (Double Pre-match Bet)

这是一个包含两个赛前选项的累积投注。两个选项分别来自不同的赛事和市场类型。

> 此投注包含两个赛前选项：一个冠军赛获胜者预测和一个让球盘预测。投注金额为10毫比特币（mBTC）。

**关键字段**:
- `selections`数组包含两个独立的投注选项。
- `specifiers`字段用于提供额外的市场信息，例如`hcp=1:0`表示让球盘。
- `currency`: "mBTC" 表明支持加密货币作为投注货币。

**投注请求 (Ticket Placement Request)**

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

## 5. 系统投注 (System Bet)

系统投注允许玩家从一组选项中选择多个组合进行投注，即使部分选项未能猜中，也有机会赢得奖金。MTS API通过嵌套的`selections`结构和`type`: "system"来支持复杂的系统投注，包括`Ways`和`Banker`等高级功能。

### 5.1 系统投注与Ways (System Bet with Ways)

`Ways`是一种将共享同一`eventId`的多个选项捆绑在一起的特殊结构。这在处理同一场比赛的多个相关市场时非常有用。

> 此示例为一个2/4系统投注，包含了1个`Ways`。总共有5个基础选项，其中3个独立，2个组成`Ways`。

**关键字段**:
- `type`: "system"，`size`: [2] 表示这是一个2/4的系统投注。
- `type`: "ways" 用于标识一个`Ways`组合，其内部的选项共享同一个`eventId`。

**投注请求 (Ticket Placement Request)**

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
                "eventId": "sr:match:14",
                "marketId": "818"
              },
              {
                "type": "uf",
                "eventId": "sr:match:18",
                "marketId": "552"
              },
              {
                "type": "uf",
                "eventId": "sr:match:15",
                "marketId": "105"
              },
              {
                "type": "ways",
                "selections": [
                  {
                    "type": "uf",
                    "eventId": "sr:match:16",
                    "marketId": "3"
                  },
                  {
                    "type": "uf",
                    "eventId": "sr:match:16",
                    "marketId": "1"
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

### 5.2 系统投注与Banker (System Bet with Banker)

`Banker`（胆）是一个必须猜中的选项。如果`Banker`选项失败，整个系统投注都会失败。加入`Banker`会改变系统投注的组合方式。

> 此示例为一个包含1个`Banker`的3/4系统投注。这实际上将投注转化为了一个2/3系统加上一个必须猜中的`Banker`选项。

**关键字段**:
- `Banker`选项在JSON结构中与`system`选项并列，它是一个常规的`uf`类型选项。
- 包含`Banker`后，原3/4系统（6个组合）变为2/3系统（3个组合）乘以`Banker`选项。

**投注请求 (Ticket Placement Request)**

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
                "eventId": "sr:match:14"
              },
              {
                "type": "uf",
                "eventId": "sr:match:18"
              },
              {
                "type": "uf",
                "eventId": "sr:match:15"
              }
            ]
          },
          {
            "type": "uf",
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

## 6. 自定义投注 (Custom Bet)

自定义投注允许玩家将同一场比赛中的多个相关（非独立）选项组合成一个单一的投注。这对于提供“自建投注”功能至关重要。MTS API通过`uf-custom-bet`类型来支持此功能，其赔率是预先从UOF（统一赔率源）获取的综合赔率。

### 6.1 单场比赛自定义投注 (Single Custom Bet)

> 此示例展示了一个包含三个来自同一足球比赛的相关选项的自定义投注。这些选项如果作为普通累积投注提交将被拒绝。

**关键字段**:
- `type`: "uf-custom-bet" 明确标识这是一个自定义投注。
- `selections` 数组内包含了多个来自同一`eventId`的`uf`类型选项。
- `odds` 字段在`uf-custom-bet`层级提供的是综合赔率，而非各选项赔率的乘积。

**投注请求 (Ticket Placement Request)**

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
                "eventId": "sr:match:66389934",
                "marketId": "1",
                "outcomeId": "1"
              },
              {
                "type": "uf",
                "eventId": "sr:match:66389934",
                "marketId": "18",
                "specifiers": "total=1.5"
              },
              {
                "type": "uf",
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

## 7. 结论

Sportradar的MTS交易API 3.0版本提供了强大而灵活的投注处理能力，能够支持从简单的单注到复杂的多重系统投注和自定义投注。通过理解本文档中介绍的各种投注类型的JSON结构和关键字段，开发人员可以有效地与MTS API集成，构建功能丰富的体育博彩应用。

正确使用`productId`、`type`、`specifiers`以及嵌套的`selections`结构是成功实现不同投注逻辑的关键。无论是处理多种货币、滚球盘口，还是构建复杂的过关投注，MTS API都提供了标准化的接口来满足这些需求。

## 8. 参考文献

[1] Sportradar Customer Documentation. (2025). *Bet Types Examples (singles, accumulators, custom bets...)*. Retrieved from https://docs.sportradar.com/mts/transaction-3.0-api/mts-related-transaction-examples/bet-types-examples-singles-accumulators-custom-bets...
