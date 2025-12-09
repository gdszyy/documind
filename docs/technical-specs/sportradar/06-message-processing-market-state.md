# Sportradar UOF 消息处理与 Market 状态流转分析报告

**作者:** Manus AI  
**日期:** 2025年12月09日

## 引言

本报告旨在深入分析 Sportradar 统一赔率接口（Unified Odds Feed, UOF）中的核心机制：消息处理流程与 Market（盘口）状态的生命周期管理。正确理解并实现这些机制，对于构建稳定、可靠且响应迅速的体育投注系统至关重要。报告将基于 Sportradar 官方文档，对各类消息的用途、优先级、处理逻辑，以及 Market 从创建到结算的完整状态流转路径进行系统性梳理。

---

## 第一部分：消息处理机制

UOF 系统通过一个基于 AMQP 的消息队列，实时推送赛事、赔率和盘口状态的变更。对这些消息的精确处理是维持数据同步和业务逻辑正确的关键。

### 1.1 核心消息类型概览

系统中的消息可根据其功能和重要性分为几大类。下表总结了最核心的事件相关消息及其属性。

| 消息类型 | 优先级 | 描述 | 主要影响 |
| :--- | :--- | :--- | :--- |
| `alive` | 低 | 系统心跳，用于检测连接是否正常。 | 若在规定时间内（如20秒）未收到，表示连接可能中断。 |
| `fixture_change` | 高 | 赛事基础信息变更，如开赛时间、赛事取消等。 | 建议立即通过 API 重新获取完整的赛事信息。 |
| `odds_change` | 高 | **核心消息**，包含赔率、盘口状态和赛事实时状态的更新。 | 定义了盘口是否可投、赔率数值以及赛事进程。 |
| `bet_stop` | 高 | 快速停止指定盘口投注的信号。 | 立即将活跃盘口的状态更新为"暂停"或"停用"。 |
| `bet_settlement` | 低 | 投注结算，提供赛果和各投注项的输赢结果。 | 触发系统进行派彩或计损，并将盘口状态更新为"已结算"。 |
| `bet_cancel` | 高 | 因故取消盘口，所有相关投注作废并退款。 | 触发退款流程，并将盘口标记为"已取消"。 |
| `rollback_bet_settlement` | 低 | 撤销之前错误的结算。 | 将"已结算"的盘口恢复到之前的状态，通常是"活跃"。 |
| `rollback_bet_cancel` | 低 | 撤销之前错误的取消操作。 | 恢复被错误取消的盘口和投注。 |

### 1.2 消息处理流程

下图展示了系统如何接收、分类和处理不同优先级的消息：

> <img width="3029" height="2493" alt="Mermaid Chart - Create complex, visual diagrams with text -2025-12-09-035939" src="https://github.com/user-attachments/assets/94e9701c-f40a-437b-8d19-ea65f21b49ec" />

> 
> 该图应放在本位置，展示：
> - 消息接收和分类（高优先级 vs 低优先级）
> - 不同消息类型的具体处理路径
> - 最终的数据库更新步骤
> - 消息处理的循环流程

消息处理应遵循其优先级，以确保关键信息的及时响应。

**高优先级消息**（需要立即处理）：这类消息涉及实时赔率和投注可用性，必须立即处理，以避免接收错误赔率的投注或在已关闭的盘口上接受投注。包括 `odds_change`, `bet_stop`, `fixture_change` 和 `bet_cancel`。

**低优先级消息**（可以延迟处理）：这类消息通常不影响实时的投注交易，可以进行异步或延迟处理。包括 `bet_settlement`, `alive` 及其 `rollback` 消息。

### 1.3 投注可用性层级

一个投注项是否对用户开放，需要通过一个层级化的检查。所有条件必须同时满足，投注方为可用。

><img width="1679" height="2421" alt="Mermaid Chart - Create complex, visual diagrams with text -2025-12-09-035325" src="https://github.com/user-attachments/assets/0b03d39b-5ef0-40c6-be04-764169c5d92d" />

> 
> 该图应放在本位置，展示：
> - 四层检查机制的决策树
> - 系统连接检查
> - 生产者正常性检查
> - Market 状态检查
> - 投注项活跃性检查
> - 最终的投注可用/停止结论

**四层检查机制**（所有条件必须同时满足）：

1. **系统连接正常**：在过去20秒内收到过 `alive` 消息。
2. **数据生产者正常**：处理该赛事的生产者未被标记为"宕机"。
3. **盘口状态活跃**：该盘口的 `status` 必须为 `1` (Active)。
4. **投注项状态活跃**：该投注项的 `active` 属性必须为 `true`。

任何一个条件不满足，该投注项都应被视为不可投。

### 1.4 关键消息处理详解

#### 1.4.1 odds_change

`odds_change` 是 UOF 中最重要和最频繁的消息。它不仅提供赔率的更新，更重要的是，**它是定义盘口状态（Market Status）的唯一依据**。

这意味着，任何时候判断一个盘口是否可投（Active）、暂停（Suspended）或停用（Deactivated），都应以最新的 `odds_change` 消息中的 `market` 元素的 `status` 属性为准。

#### 1.4.2 bet_stop

`bet_stop` 是一个优化的"快速通道"信号，用于在紧急情况下（如危险进攻、进球、红牌等）立即暂停投注。它本身不包含详细的盘口状态，而是指示系统应将指定的活跃盘口暂停。其具体原因和最终状态会在稍后紧随的 `odds_change` 消息中得到确认。

#### 1.4.3 bet_settlement

此消息用于结算已结束的盘口。一个关键属性是 `certainty`，它表示结算的确认级别：

- **certainty="1"**：基于现场数据源（如球探）的初步结算，速度快但有极低概率被修正。
- **certainty="2"**：基于官方赛果的最终结算，被视为最终确认。

系统可以选择在收到初步结算时即进行派彩，或等待最终确认结算以保证准确性。

---

## 第二部分：Market 状态流转

Market（盘口）的生命周期由其状态（Status）定义。状态的转换由 `odds_change` 等消息驱动，构成一个清晰的状态机。

### 2.1 Market 状态定义

下表详细解释了各个 Market 状态的含义和业务影响。

| 状态 ID | 状态名称 | 描述 | 投注可用性 |
| :--- | :--- | :--- | :--- |
| `1` | **Active** (活跃) | 正常提供赔率，可以接受投注。 | ✅ **可投注** |
| `-1` | **Suspended** (暂停) | 赔率可能仍在更新，但暂时不接受投注。通常是短期状态。 | ❌ **不可投注** |
| `0` | **Deactivated** (停用) | 不再提供赔率，但盘口可能在后续恢复为活跃。 | ❌ **不可投注** |
| `-3` | **Settled** (已结算) | 盘口已结束并完成结算，不再提供赔率。 | ❌ **不可投注** |
| `-4` | **Cancelled** (已取消) | 盘口被取消，相关投注作废。 | ❌ **不可投注** |
| `-2` | **Handed Over** (已移交) | 临时过渡状态，表示数据生产者正在交接。 | ⚠️ **条件性暂停** |

### 2.2 Market 状态转换图

下图清晰地展示了 Market 各状态之间的转换路径及其触发条件：

> <img width="2857" height="2994" alt="Untitled diagram-2025-12-09-054452" src="https://github.com/user-attachments/assets/824565fd-b4c0-4c61-828d-1d593f9fc712" />


> 
> 该图应放在本位置，展示：
> - 6 种 Market 状态的完整转换图
> - 从 Active 出发的所有可能转换路径
> - 各个状态的特征说明（投注可用性、赔率提供等）
> - 状态转换的触发消息类型
> - 可逆和不可逆的转换

**核心转换路径**：

- **Active ↔ Suspended/Deactivated**：这是盘口在比赛进行中的主要状态变化。`Active` 是可交易状态，而 `Suspended` 和 `Deactivated` 是因比赛事件（如进球、VAR）或盘口赔率不再平衡而触发的临时不可交易状态。

- **Active → Settled**：当比赛或盘口结果确定后，通过 `bet_settlement` 消息，盘口进入最终的"已结算"状态。

- **Settled → Active**：这是一个罕见的逆向转换，由 `rollback_bet_settlement` 消息触发，通常是因为之前的结算存在错误（如VAR改判）。

- **Active → Cancelled**：当盘口因故需要作废时，通过 `bet_cancel` 消息进入"已取消"状态。

- **Active → Handed Over → Active**：在数据生产者交接时（如赛前转赛中），盘口会短暂进入 `Handed Over` 状态，此时应暂停投注，直到新的生产者发来 `Active` 状态的 `odds_change` 消息。

### 2.3 关键场景一：进球处理

进球是比赛中最常见的事件，会触发一系列 Market 状态变化。下图展示了从进球发生到赔率稳定的完整过程：

> <img width="1630" height="2599" alt="Untitled diagram-2025-12-09-053441" src="https://github.com/user-attachments/assets/bc51ee65-ad31-4e9c-ac48-f07c4c43d921" />


> 
> 该图应放在本位置，展示：
> - 进球发生时的 Market 状态变化
> - Suspended 状态的持续时间
> - 进球确认后的恢复过程
> - 赔率重新平衡时的 Deactivated 状态
> - 新赔率线条的提供和激活
> - 整个过程的时间顺序

**处理流程**：

1. 进球发生，系统立即接收 `odds_change` 消息，Market 状态变为 `Suspended (-1)`
2. 进球被确认，系统接收 `odds_change` 消息，Market 状态恢复为 `Active (1)`
3. 赔率重新平衡，某些 Market 变为 `Deactivated (0)`（如原有的总进球数线条不再提供）
4. 新赔率线条提供，新 Market 变为 `Active (1)`（如新的总进球数线条）

### 2.4 关键场景二：生产者交接 (Handover)

从赛前（Prematch）到赛中（Live）的过渡是一个关键场景。此时，数据生产者会发生变更。

><img width="2172" height="3164" alt="Untitled diagram-2025-12-09-053741" src="https://github.com/user-attachments/assets/ede00199-dce8-4063-a555-8925ea650107" />

> 
> 该图应放在本位置，展示：
> - Prematch 生产者的最终消息
> - Market 状态标记为 Handed Over (-2)
> - 客户端的暂停和计时器启动
> - Live Odds 生产者的消息到达
> - Market 状态恢复为 Active (1)
> - 60 秒超时的错误处理场景

**处理步骤**：

1. 赛前生产者发送最后一次 `odds_change`，将即将由赛中生产者接管的盘口标记为 `status="-2"` (Handed Over)。
2. 客户端收到 `Handed Over` 状态后，应**暂停**该盘口，等待赛中生产者的消息。
3. 赛中生产者开始发送 `odds_change` 消息，将盘口状态更新为 `status="1"` (Active)。
4. 客户端收到新的 `Active` 消息后，恢复盘口投注。

**最佳实践**：如果在收到 `Handed Over` 状态后超过60秒仍未收到来自新生产者的 `odds_change` 消息，应视为异常情况并进行处理。

### 2.5 赛事生命周期

一个赛事从预订到完全关闭会经历多个阶段，每个阶段都有不同的 Market 状态和数据源特征：

> <img width="3232" height="630" alt="Mermaid Chart - Create complex, visual diagrams with text -2025-12-09-035406" src="https://github.com/user-attachments/assets/28e454a8-1ecc-4734-b2ef-fcae8bb9b805" />

> 
> 该图应放在本位置，展示：
> - 赛事的完整生命周期阶段
> - 每个阶段的时间范围
> - 每个阶段的 Market 状态特征
> - 每个阶段的赔率数据来源
> - 每个阶段的投注可用性

**生命周期阶段详解**：

| 阶段 | 时间 | Market 状态 | 赔率来源 | 投注状态 | 特点 |
|-----|------|----------|--------|--------|------|
| **Prematch** | T=-1h | Active | Prematch | 可用 | 赛前投注，赔率相对稳定 |
| **Handover** | T=-30s~0 | Active → Handed Over → Active | 交接中 | 条件性 | 生产者交接，需要特殊处理 |
| **Live** | T=0~90min | Active ↔ Suspended ↔ Deactivated | Live Odds | 动态 | 赛中投注，状态频繁变化 |
| **Post-match** | T=90+ | Active | 停止更新 | 停止 | 赛事结束，等待结算 |
| **Settled** | T=90+30min | Settled | 无 | 已结算 | 投注已结算，派彩完成 |
| **Archived** | T=后续 | Archived | 无 | 已关闭 | 赛事存档，数据保留 |

---

## 第三部分：最佳实践与核心规则

### 3.1 消息处理最佳实践

1. **严格遵守消息优先级**：高优先级消息应该在低优先级消息之前处理，以确保实时数据的准确性。

2. **以 `odds_change` 为唯一信源**：Market 状态仅由 `odds_change` 消息定义，不应该基于 `bet_cancel` 或 `bet_settlement` 改变市场状态。

3. **实现消息队列**：使用消息队列（如 RabbitMQ）来管理消息的接收和处理，确保消息不会丢失。

4. **设置心跳检测**：监控 `alive` 消息，如果20秒内未收到，应立即停止所有投注。

### 3.2 Market 状态管理规则

1. **只操作活跃市场**：`bet_stop` 只能将活跃市场改为暂停或停用，不能对已停用、已结算或已取消的市场操作。

2. **灰显规则**：Market 状态为 `0` (Deactivated) 时应灰显，直到收到 `status="1"` 才恢复。

3. **Handed Over 处理**：
   - 如已收到新生产者赔率：忽略 `Handed Over` 标记
   - 如未收到新生产者赔率：暂停市场
   - 如60秒内未收到新生产者赔率：作为错误处理

4. **恢复流程处理**：在系统故障后恢复时，应调用恢复 API，并等待 `snapshot_complete` 消息确认所有数据已恢复。

### 3.3 错误处理

- **20秒无消息**：系统可能故障，应停止所有投注
- **60秒无 Handed Over 后续**：生产者故障，应进行错误处理
- **已结算市场被 bet_cancel**：极少数错误情况，应进行日志记录
- **match_status 异常**：检查赛事状态，可能需要人工介入

---

## 总结

Sportradar UOF 的消息和状态管理系统是一个复杂但逻辑严谨的体系。成功集成的关键在于：

1. **严格遵守消息优先级**，确保对高优先级消息的瞬时响应。
2. **以 `odds_change` 为唯一信源** 来管理盘口状态，避免被其他消息（如 `bet_cancel`）误导。
3. **精确实现状态机**，正确处理 `Active`, `Suspended`, `Deactivated`, `Settled`, `Cancelled`, `Handed Over` 之间的转换。
4. **理解并应用投注可用性层级**，确保只在所有条件满足时才接受投注。
5. **妥善处理关键场景**，如进球、生产者交接、系统故障等。

通过遵循本文档梳理的规则和流程，开发团队可以构建一个与 Sportradar UOF 数据流高度同步、稳定可靠的投注平台。

---

## 图表索引

本文档包含以下 6 个 Mermaid 流程图，应按照以下位置放置：

| 序号 | 图表名称 | 文件名 | 推荐位置 | 用途 |
|-----|--------|--------|--------|------|
| #1 | 消息处理流程图 | `message_processing_flow.png` | 第1.2节 | 展示消息的接收、分类和处理流程 |
| #2 | 投注可用性层级图 | `betting_availability_hierarchy.png` | 第1.3节 | 展示投注可用性的四层检查机制 |
| #3 | Market 状态转换图 | `market_state_diagram.png` | 第2.2节 | 展示 Market 状态的完整转换路径 |
| #4 | 进球处理时序图 | `goal_handling_sequence.png` | 第2.3节 | 展示进球事件的处理过程 |
| #5 | 生产者交接时序图 | `handover_sequence.png` | 第2.4节 | 展示 Prematch → Live Odds 的交接过程 |
| #6 | 赛事生命周期图 | `event_lifecycle.png` | 第2.5节 | 展示赛事的完整生命周期 |

---

## 参考文献

[1] Sportradar Developer Portal. (2025). *Messages*. Retrieved from https://docs.sportradar.com/uof/data-and-features/messages

[2] Sportradar Developer Portal. (2025). *Odds Change*. Retrieved from https://docs.sportradar.com/uof/data-and-features/messages/event/odds-change

[3] Sportradar Developer Portal. (2025). *Bet Cancel*. Retrieved from https://docs.sportradar.com/uof/data-and-features/messages/event/bet-cancel

[4] Sportradar Developer Portal. (2025). *Bet Stop*. Retrieved from https://docs.sportradar.com/uof/data-and-features/messages/event/bet-stop

[5] Sportradar Developer Portal. (2025). *Bet Settlement*. Retrieved from https://docs.sportradar.com/uof/data-and-features/messages/event/bet-settlement

[6] Sportradar Developer Portal. (2025). *Market Status*. Retrieved from https://docs.sportradar.com/uof/data-and-features/markets-and-outcomes/market-status
