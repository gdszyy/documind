# 热门程度计算规则与算法实现完整文档

**版本**: 1.1
**更新日期**: 2025-11-27

## 一、概述

本系统包含两套独立的热门程度评分算法，分别用于评估**比赛（Event）**和**联赛（Tournament）**的热门程度。

| 评分对象 | 模型 | 核心指标 | 评分范围 |
| :--- | :--- | :--- | :--- |
| **比赛 (Event)** | 单维度 | 市场数量 | 1-10 (整数) |
| **联赛 (Tournament)** | 二维加权 | 联赛层级 (50%) + 市场深度 (50%) | 1-10 (小数) |

---

## 二、比赛 (Event) 热门度评分规则与算法

### 1. 核心模型

比赛热门度采用**单维度模型**，仅基于该场比赛的**市场数量（Market Count）**进行评分。市场数量直接反映了博彩公司和市场对该比赛的关注度和投入程度。

### 2. 评分标准

比赛的评分范围为 1-10 分（整数），根据市场数量直接映射：

| 得分 | 市场数量 | 描述 |
| :--- | :--- | :--- |
| 10 | > 400 | 全球顶级赛事 (如世界杯决赛) |
| 9 | 301 - 400 | 重大国际赛事 |
| 8 | 201 - 300 | 顶级国家赛事 |
| 7 | 151 - 200 | 高关注度比赛 |
| 6 | 101 - 150 | 标准高水平比赛 |
| 5 | 51 - 100 | 中等关注度 |
| 4 | 31 - 50 | 较低关注度 |
| 3 | 11 - 30 | 低关注度 |
| 2 | 6 - 10 | 极低关注度 |
| 1 | 1 - 5 | 最低关注度 |

### 3. 算法实现 (SQL)

**文件**: `scripts/calculate_event_popularity.sql`

算法主要分为三个步骤：

1.  **创建或确保评分表存在**: `event_popularity_scores`
2.  **计算每场比赛的市场数量**: 通过 `LEFT JOIN` 关联 `tracked_events` 和 `markets` 表，并使用 `GROUP BY` 和 `COUNT`。
3.  **根据评分标准赋值并更新**: 使用 `CASE` 语句根据市场数量赋值，并通过 `INSERT ... ON CONFLICT ... DO UPDATE` 将结果写入评分表。

```sql
-- 核心计算逻辑
WITH 
-- 步骤 2.1: 计算每场比赛的市场数量
event_market_counts AS (
    SELECT 
        te.event_id,
        te.tournament_id,
        te.category_id,
        te.sport_id,
        COUNT(m.id) as market_count
    FROM tracked_events te
    LEFT JOIN markets m ON te.event_id = m.event_id
    GROUP BY te.event_id, te.tournament_id, te.category_id, te.sport_id
),

-- 步骤 2.2: 根据市场数量赋值
scored_events AS (
    SELECT 
        *,
        CASE 
            WHEN market_count > 400 THEN 10
            WHEN market_count > 300 THEN 9
            WHEN market_count > 200 THEN 8
            WHEN market_count > 150 THEN 7
            WHEN market_count > 100 THEN 6
            WHEN market_count > 50 THEN 5
            WHEN market_count > 30 THEN 4
            WHEN market_count > 10 THEN 3
            WHEN market_count > 5 THEN 2
            ELSE 1
        END as popularity_score
    FROM event_market_counts
)

-- 步骤 2.3: 将结果写入评分表
INSERT INTO event_popularity_scores (...)
SELECT ... FROM scored_events
ON CONFLICT (event_id) DO UPDATE SET ...;
```

### 4. 算法设计原理：为什么比赛不使用层级维度？

这是一个关键的设计决策，基于以下数据验证：

1.  **信息冗余**: 市场数量与联赛层级**高度相关**（相关系数 r=0.767）。这意味着高层级联赛的比赛自然会有更多的市场，市场数量已经隐含了联赛层级的信息。

2.  **区分度下降**: 同一联赛内的不同比赛，市场数有合理差异（如强队对决 vs 弱队对决）。如果强行加入联赛层级，会让同一联赛的所有比赛得分趋同，**反而降低了对比赛本身热门度的区分**。

3.  **简洁性原则 (奥卡姆剃刀)**: 在效果相同的情况下，选择最简单的模型。单维度模型简洁、高效，且已能准确反映比赛热门度。

> **结论**: 市场数量本身就综合反映了联赛层级和比赛即时热门度，无需额外的层级维度。

---

## 三、联赛 (Tournament) 热门度评分规则与算法

### 1. 核心模型

联赛热门度采用**二维加权模型**，结合**联赛层级（Tournament Tier）**和**市场深度（Market Depth）**两个维度，更全面地评估联赛的综合价值。

**计算公式**:
```
最终得分 = (联赛层级得分 × 0.5) + (市场深度得分 × 0.5)
```

### 2. 评分标准：联赛层级得分 (权重 50%)

此维度反映联赛的**固有声望和全球影响力**。评分范围为 1-10 分。

| 得分 | 联赛类型 | 示例 |
| :--- | :--- | :--- |
| 10 | 世界杯级别 | FIFA World Cup, Olympic Games |
| 9 | 洲际顶级赛事 | UEFA Champions League, NBA, NFL |
| 8 | 国家顶级联赛 | Premier League, La Liga, Serie A, Bundesliga |
| 7 | 国家次级联赛 | English Championship, La Liga 2 |
| 6 | 国家三级联赛 / 主要杯赛 | English League One, FA Cup |
| 5 | 地区性 / 青年联赛 | Regional Leagues, U21/U19 Leagues |
| 1-4 | 其他低级别联赛 | Amateur leagues, etc. |

### 3. 评分标准：市场深度得分 (权重 50%)

此维度反映联赛的**市场成熟度和实际受关注程度**，通过该联赛下所有比赛的**平均市场数量**来衡量。评分范围为 1-10 分。

| 得分 | 平均市场数 | 描述 |
| :--- | :--- | :--- |
| 10 | > 200 | 市场极度成熟 |
| 9 | 151 - 200 | 市场非常成熟 |
| 8 | 101 - 150 | 市场成熟 |
| 7 | 76 - 100 | 市场较好 |
| 6 | 51 - 75 | 市场一般 |
| 5 | 31 - 50 | 市场发展中 |
| 4 | 16 - 30 | 市场较小 |
| 3 | 6 - 15 | 市场很小 |
| 2 | 2 - 5 | 市场极小 |
| 1 | 1 | 市场几乎不存在 |

### 4. 算法实现 (SQL)

**文件**: `scripts/calculate_tournament_popularity.sql`

算法主要分为四个步骤：

1.  **创建或确保评分表存在**: `tournament_popularity_scores`
2.  **计算每个联赛的平均市场数**: 首先计算每场比赛的市场数，然后按联赛分组计算平均值。
3.  **根据评分标准赋值**: 使用 `CASE` 语句为"联赛层级"和"市场深度"分别赋值。
4.  **计算最终得分并更新**: 根据加权公式计算最终得分，并通过 `INSERT ... ON CONFLICT ... DO UPDATE` 写入评分表。

```sql
-- 核心计算逻辑
WITH 
-- 步骤 2.1: 计算每个联赛的平均市场数
tournament_market_stats AS (
    SELECT 
        te.tournament_id,
        COUNT(DISTINCT te.event_id) as total_events,
        COALESCE(AVG(emc.market_count), 0) as avg_markets
    FROM tracked_events te
    LEFT JOIN event_market_counts emc ON te.event_id = emc.event_id
    GROUP BY te.tournament_id
    HAVING COUNT(DISTINCT te.event_id) > 0
),

-- 步骤 2.2: 赋值并计算最终得分
scored_tournaments AS (
    SELECT 
        tms.tournament_id,
        -- ... 其他字段
        -- 计算联赛层级得分
        CASE 
            WHEN t.name ILIKE '%World Cup%' THEN 10
            WHEN t.name ILIKE '%Champions League%' THEN 9
            -- ... 其他规则
        END as tournament_tier_score,
        
        -- 计算市场深度得分
        CASE 
            WHEN tms.avg_markets > 200 THEN 10
            WHEN tms.avg_markets > 150 THEN 9
            -- ... 其他规则
        END as market_depth_score
    FROM tournament_market_stats tms
    -- ... JOIN 其他表
)

-- 步骤 2.3: 写入评分表
INSERT INTO tournament_popularity_scores (...)
SELECT 
    -- ... 其他字段
    -- 计算最终加权得分
    ROUND((tournament_tier_score * 0.5 + market_depth_score * 0.5), 2) as final_popularity_score
FROM scored_tournaments
ON CONFLICT (tournament_id) DO UPDATE SET ...;
```

---

## 四、实现与数据表

### 1. 数据库表

| 表名 | 用途 | 主键 | 关键字段 |
| :--- | :--- | :--- | :--- |
| `event_popularity_scores` | 存储比赛热门度 | `event_id` | `popularity_score`, `market_count` |
| `tournament_popularity_scores` | 存储联赛热门度 | `tournament_id` | `final_popularity_score`, `tournament_tier_score`, `market_depth_score`, `avg_market_count` |

### 2. SQL 脚本

- **比赛评分脚本**: `scripts/calculate_event_popularity.sql`
- **联赛评分脚本**: `scripts/calculate_tournament_popularity.sql`

### 3. 更新机制

建议使用 Cron Job **每日**执行以上两个 SQL 脚本，以保持评分数据的时效性。

```bash
# 每日凌晨 2:00 执行
0 2 * * * psql $DATABASE_URL -f scripts/calculate_event_popularity.sql
5 2 * * * psql $DATABASE_URL -f scripts/calculate_tournament_popularity.sql
```

## 五、未评分联赛说明

**问题**: 为什么有 61.92% 的联赛没有评分？

**原因**: 所有未评分的联赛都是因为**没有追踪的比赛（tracked_events）**。这主要是未来赛季、历史联赛或不活跃的联赛。

**结论**: 这是正常现象。算法设计正确，只为有实际比赛数据的联赛评分。当这些联赛开始有比赛时，每日更新的脚本会自动为其生成评分。
