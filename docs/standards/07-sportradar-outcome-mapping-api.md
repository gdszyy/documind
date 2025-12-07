---
title: Sportradar Outcome Mapping API 规范
category: standard
type: api-integration
version: 1.0
status: active
createdAt: 2025-12-07
updatedAt: 2025-12-08
author: Manus AI
tags:
  - sportradar
  - api
  - outcome-mapping
  - market-descriptions
  - data-source
  - integration
description: Sportradar Market Descriptions 和 Variant Market Descriptions API 的调研报告和使用规范
reference: https://docs.sportradar.com/uof/en/overview
---

# Sportradar Outcome Mapping API 规范

## 调研目标
调研 SportRader 中关于 outcome mapping 的 API 地址，包括常规版本和两个 variant 变体版本。

## 执行摘要

根据对 SportRader 文档的深入调研，我们确认了**三种主要的活跃 API 端点**用于获取 outcome mapping：

1. **常规 Market Descriptions API** - 获取所有市场的描述和映射
2. **Variant Market Descriptions API** - 获取特定 variant 的市场结果映射
3. **Variant Market Description Direct API** - 获取产品特定（pre/liveodds/wns）的 variant 映射

这三个 API 都支持通过 `include_mappings` 参数获取完整的 outcome mapping 信息。

此外，还有一个 **Variant Descriptions API** 用于返回所有 variant 类型的列表。

---

## 核心发现

根据 SportRader 文档，outcome mapping 相关的 API 主要有以下类型：

### 1. 常规 Market Descriptions API（包含 mapping）
**端点地址：**
```
GET /descriptions/{language}/markets.xml
```

**参数：**
- `language`: 语言代码（必需，如 `en` 表示英语）
- `include_mappings`: 可选参数，设置为 `true` 时返回 mapping 信息

**用途：**
- 获取所有市场的描述信息
- 当 `include_mappings=true` 时，响应会包含 market mappings，显示 Unified Odds 市场如何映射到其他 Betradar 产品（如 Live Odds 和 LCoO）中的等效市场

**示例：**
```
GET /descriptions/en/markets.xml?include_mappings=true
```

**API 规范（OpenAPI）：**
```json
{
  "openapi": "3.0.3",
  "servers": [{"url": "https://global.api.betradar.com/v1"}],
  "paths": {
    "/descriptions/{language}/markets.xml": {
      "get": {
        "summary": "Market descriptions",
        "description": "Defines all currently available markets.",
        "parameters": [
          {"name": "language", "required": true},
          {"name": "include_mappings", "required": false, "type": "boolean"}
        ]
      }
    }
  }
}
```

---

### 2. Variant Market Descriptions API（第一个 variant 版本）
**端点地址：**
```
GET /descriptions/{language}/markets/{market_id}/variants/{variant_urn}
```

**参数：**
- `language`: 语言代码（必需，如 `en`）
- `market_id`: 市场 ID（必需，如 `241`）
- `variant_urn`: variant URN（必需，如 `sr:exact_games:bestof:5`）
- `include_mappings`: 可选参数，选择是否包含市场映射

**用途：**
- 返回包含 `variant=<urn>` 的市场描述和结果
- 提供与 outrights（冠军盘口）相关的结果信息
- 用于获取特定 variant 市场的 outcome 映射
- 此端点可能会重定向（301）到产品特定端点

**示例：**
```
GET /descriptions/en/markets/241/variants/sr:exact_games:bestof:5?include_mappings=true
```

**API 规范（OpenAPI）：**
```json
{
  "openapi": "3.0.3",
  "servers": [{"url": "https://global.api.betradar.com/v1"}],
  "paths": {
    "/descriptions/{language}/markets/{market_id}/variants/{variant_urn}": {
      "get": {
        "summary": "Variant market descriptions",
        "description": "Lists market outcomes for a specific variant of a market, including optional mappings.",
        "operationId": "variantLookup"
      }
    }
  }
}
```

---

### 3. Variant Market Description Direct API（第二个 variant 版本）
**端点地址：**
```
GET /{product}/descriptions/{language}/markets/{market_id}/variants/{variant_urn}
```

**参数：**
- `product`: 产品类型（必需，可选值：`pre`、`liveodds`、`wns`）
- `language`: 语言代码（必需，如 `en`）
- `market_id`: 市场 ID（必需，如 `534`）
- `variant_urn`: variant URN（必需，如 `pre:markettext:33421`）

**用途：**
- 列出指定产品（prematch、live 或 wns）内市场 variant 的结果
- 提供针对特定产品的 variant 市场描述
- 用于获取产品特定的 outcome 映射
- 这是 Variant Market Descriptions API 重定向的目标端点

**示例：**
```
GET /pre/descriptions/en/markets/534/variants/pre:markettext:33421
GET /liveodds/descriptions/en/markets/241/variants/sr:exact_games:bestof:5
GET /wns/descriptions/en/markets/534/variants/pre:markettext:33421
```

**API 规范（OpenAPI）：**
```json
{
  "openapi": "3.0.3",
  "servers": [{"url": "https://global.api.betradar.com/v1"}],
  "paths": {
    "/{product}/descriptions/{language}/markets/{market_id}/variants/{variant_urn}": {
      "get": {
        "summary": "Variant market descriptions direct",
        "description": "Lists outcomes for a market variant within a specified product (pre, liveodds, wns).",
        "operationId": "variantDirectLookup",
        "parameters": [
          {"name": "product", "enum": ["pre", "liveodds", "wns"]}
        ]
      }
    }
  }
}
```

---

### 4. Variant Descriptions API
**端点地址：**
```
GET /descriptions/{language}/variants.xml
```

**参数：**
- `language`: 语言代码（必需，如 `en`）

**用途：**
- 返回所有 variant 类型及其关联的市场
- 提供 variants 的完整列表和概览
- 用于发现系统中存在哪些 variant 类型

**示例：**
```
GET /descriptions/en/variants.xml
```

**API 规范（OpenAPI）：**
```json
{
  "openapi": "3.0.3",
  "servers": [{"url": "https://global.api.betradar.com/v1"}],
  "paths": {
    "/descriptions/{language}/variants.xml": {
      "get": {
        "summary": "Variant descriptions",
        "description": "Returns all variant types and the markets they are associated with.",
        "operationId": "variantDescriptions"
      }
    }
  }
}
```

**注意：** 此 API 位于 Betting Descriptions API 的活跃端点列表中，并非已废弃端点。

---

## API 地址总结

| API 类型 | 端点地址 | 状态 | 用途 |
|---------|---------|------|------|
| **常规 Market Descriptions** | `/descriptions/{language}/markets.xml` | ✅ 活跃 | 获取所有市场描述，可选包含 mapping |
| **Variant Market Descriptions** | `/descriptions/{language}/markets/{market_id}/variants/{variant_urn}` | ✅ 活跃 | 获取特定 variant 市场的 outcome 映射 |
| **Variant Market Description Direct** | `/{product}/descriptions/{language}/markets/{market_id}/variants/{variant_urn}` | ✅ 活跃 | 获取产品特定的 variant 市场 outcome 映射 |
| **Variant Descriptions** | `/descriptions/{language}/variants.xml` | ✅ 活跃 | 返回所有 variant 类型列表 |

---

## 关键概念

### Variant 说明
**Variant** 是一种特殊的 specifier，用于标识具有可变描述的市场和结果。这种机制主要应用于以下场景：

- **Outright markets**（冠军盘口）：如联赛冠军、赛季最佳球员等
- **动态市场**：如正确比分市场（Correct Score）
- **板球市场**：某些特定的板球投注市场

**Variant URN 格式示例：**
- `sr:exact_games:bestof:5` - SportRadar 标准格式
- `pre:markettext:1234` - 赛前市场文本格式

### Mapping 说明
**Mapping** 是 Unified Odds Feed 的核心组成部分，用于将新的统一赔率系统映射到传统的 Betradar 产品：

**映射包含的信息：**
- `product_id` / `product_ids`: 产品标识符（1=Live Odds, 3=LCoO, 4=BetPal）
- `sport_id`: 运动项目 ID（如 `sr:sport:1` 表示足球）
- `market_id`: 传统产品中的市场 ID
- `sov_template`: 特殊赔率值模板
- `mapping_outcome`: outcome 级别的映射关系

**产品 ID 说明：**
- `product_id="1"`: Live Odds（滚球）
- `product_id="3"`: LCoO（赛前）
- `product_id="4"`: BetPal
- `product_ids="1|4"`: 同时映射到多个产品

### 获取 Variant Market 的流程

**标准工作流程：**

1. **接收 odds_change 消息**，其中包含 variant specifier：
   ```xml
   <market id="241" specifiers="variant=sr:exact_games:bestof:5">
   ```

2. **调用 Variant Market Descriptions API** 获取实际的市场和结果名称：
   ```
   GET /descriptions/en/markets/241/variants/sr:exact_games:bestof:5?include_mappings=true
   ```

3. **解析响应**，获取市场名称和 outcome 映射：
   ```xml
   <market_descriptions response_code="OK">
     <market id="241" name="Exact games" variant="sr:exact_games:bestof:5">
       <outcomes>
         <outcome id="sr:exact_games:bestof:5:39" name="3"/>
         <outcome id="sr:exact_games:bestof:5:40" name="4"/>
         <outcome id="sr:exact_games:bestof:5:41" name="5"/>
       </outcomes>
       <mappings>
         <!-- mapping 信息 -->
       </mappings>
     </market>
   </market_descriptions>
   ```

4. **处理重定向**（如果发生）：API 可能返回 301 重定向到产品特定端点

**重要提示：** 相同的 market_id 配合不同的 variant 描述应被视为不同的市场线路，系统会独立处理和结算这些市场。

---

## 使用建议

### 1. API 选择策略

**获取所有市场描述：**
```
GET /descriptions/en/markets.xml?include_mappings=true
```
适用于初始化、缓存构建、完整市场列表获取。

**获取特定 variant 市场：**
```
GET /descriptions/en/markets/{market_id}/variants/{variant_urn}?include_mappings=true
```
适用于处理 odds_change 消息中的 variant specifier。

**获取产品特定 variant：**
```
GET /{product}/descriptions/en/markets/{market_id}/variants/{variant_urn}
```
适用于需要明确产品上下文的场景（prematch、live、wns）。

**发现所有 variant 类型：**
```
GET /descriptions/en/variants.xml
```
适用于了解系统中存在哪些 variant 类型。

### 2. 获取完整映射信息

在所有支持的 API 请求中添加 `include_mappings=true` 参数以获取完整的 outcome mapping 信息。这对于需要将 Unified Odds 映射回传统产品的集成场景至关重要。

### 3. 处理动态市场

对于包含 variant specifier 的市场，**必须**额外调用 variant market descriptions API 来获取实际的市场和结果名称。不能仅依赖静态的市场描述。

### 4. 处理 API 重定向

Variant Market Descriptions API 可能会返回 301 重定向到产品特定端点。客户端应正确处理 HTTP 重定向，或直接使用 Variant Market Description Direct API 并指定产品类型。

### 5. 认证和基础配置

**基础 URL：** `https://global.api.betradar.com/v1`

**认证方式：** 所有 API 都需要在请求头中包含 `x-access-token` 进行身份验证：
```
x-access-token: YOUR_ACCESS_TOKEN
```

**响应格式：** 所有端点返回 XML 格式的响应

**HTTP 状态码：**
- `200`: 成功
- `301`: 重定向（仅限 Variant Market Descriptions API）
- `401`: 未授权
- `403`: 访问被拒绝
- `500`: 内部服务器错误

### 6. 缓存策略

**静态数据（可长期缓存）：**
- Market Descriptions（市场描述）
- Variant Descriptions（variant 类型列表）

**动态数据（需实时获取）：**
- 特定 variant 的市场描述（因为 variant URN 是动态的）
- 产品特定的 variant 描述

---

## 三种 API 的区别与联系

### 常规 vs Variant Market Descriptions

| 特性 | Market Descriptions | Variant Market Descriptions |
|------|---------------------|----------------------------|
| **端点** | `/descriptions/{language}/markets.xml` | `/descriptions/{language}/markets/{market_id}/variants/{variant_urn}` |
| **范围** | 所有静态市场 | 特定 variant 市场 |
| **使用场景** | 初始化、缓存 | 处理动态市场 |
| **是否需要 market_id** | 否 | 是 |
| **是否需要 variant_urn** | 否 | 是 |

### Variant Market Descriptions vs Variant Market Description Direct

| 特性 | Variant Market Descriptions | Variant Market Description Direct |
|------|----------------------------|-----------------------------------|
| **端点** | `/descriptions/{language}/markets/{market_id}/variants/{variant_urn}` | `/{product}/descriptions/{language}/markets/{market_id}/variants/{variant_urn}` |
| **产品指定** | 自动（可能重定向） | 显式指定 |
| **重定向** | 可能发生 301 | 不会重定向 |
| **使用场景** | 通用 variant 查询 | 明确产品上下文 |

### Variant Descriptions vs Variant Market Descriptions

| 特性 | Variant Descriptions | Variant Market Descriptions |
|------|---------------------|----------------------------|
| **端点** | `/descriptions/{language}/variants.xml` | `/descriptions/{language}/markets/{market_id}/variants/{variant_urn}` |
| **返回内容** | 所有 variant 类型列表 | 特定 variant 的市场详情 |
| **粒度** | 概览级别 | 详细级别 |
| **使用场景** | 发现 variants | 获取具体 variant 数据 |

---

## 实际应用示例

### 示例 1：获取足球所有市场及映射

**请求：**
```http
GET https://global.api.betradar.com/v1/descriptions/en/markets.xml?include_mappings=true
x-access-token: YOUR_ACCESS_TOKEN
```

**响应片段：**
```xml
<market_descriptions response_code="OK">
  <market id="139" name="Total bookings">
    <outcomes>
      <outcome id="13" name="under {total}"/>
      <outcome id="12" name="over {total}"/>
    </outcomes>
    <specifiers>
      <specifier name="total" type="decimal"/>
    </specifiers>
    <mappings>
      <mapping product_id="1" sport_id="sr:sport:1" market_id="8:153" sov_template="{total}">
        <mapping_outcome outcome_id="12" product_outcome_id="573" product_outcome_name="over"/>
        <mapping_outcome outcome_id="13" product_outcome_id="571" product_outcome_name="under"/>
      </mapping>
      <mapping product_id="3" sport_id="sr:sport:1" market_id="236" sov_template="{total}">
        <mapping_outcome outcome_id="12" product_outcome_id="6" product_outcome_name="over"/>
        <mapping_outcome outcome_id="13" product_outcome_id="7" product_outcome_name="under"/>
      </mapping>
    </mappings>
  </market>
</market_descriptions>
```

### 示例 2：获取特定 variant 市场（网球精确局数）

**请求：**
```http
GET https://global.api.betradar.com/v1/descriptions/en/markets/241/variants/sr:exact_games:bestof:5?include_mappings=true
x-access-token: YOUR_ACCESS_TOKEN
```

**响应：**
```xml
<market_descriptions response_code="OK">
  <market id="241" name="Exact games" variant="sr:exact_games:bestof:5">
    <outcomes>
      <outcome id="sr:exact_games:bestof:5:39" name="3"/>
      <outcome id="sr:exact_games:bestof:5:40" name="4"/>
      <outcome id="sr:exact_games:bestof:5:41" name="5"/>
    </outcomes>
    <mappings>
      <mapping product_id="1" product_ids="1|4" sport_id="sr:sport:5" market_id="8:25">
        <mapping_outcome outcome_id="sr:exact_games:bestof:5:39" product_outcome_id="31" product_outcome_name="3"/>
        <mapping_outcome outcome_id="sr:exact_games:bestof:5:40" product_outcome_id="32" product_outcome_name="4"/>
        <mapping_outcome outcome_id="sr:exact_games:bestof:5:41" product_outcome_id="33" product_outcome_name="5"/>
      </mapping>
    </mappings>
  </market>
</market_descriptions>
```

### 示例 3：获取赛前产品特定 variant

**请求：**
```http
GET https://global.api.betradar.com/v1/pre/descriptions/en/markets/534/variants/pre:markettext:33421
x-access-token: YOUR_ACCESS_TOKEN
```

### 示例 4：获取所有 variant 类型列表

**请求：**
```http
GET https://global.api.betradar.com/v1/descriptions/en/variants.xml
x-access-token: YOUR_ACCESS_TOKEN
```

**响应概念示例：**
```xml
<variant_descriptions response_code="OK">
  <variant id="sr:exact_games:bestof:5">
    <!-- variant 详情 -->
  </variant>
  <variant id="sr:correct_score:bestof:3">
    <!-- variant 详情 -->
  </variant>
  <!-- 更多 variants -->
</variant_descriptions>
```

---

## 参考文档链接

### 活跃 API 端点文档
- [Market Descriptions Endpoint](https://docs.sportradar.com/uof/api-and-structure/api/betting-descriptions/market-descriptions/endpoint)
- [Variant Market Descriptions](https://docs.sportradar.com/uof/api-and-structure/api/betting-descriptions/variant-market-descriptions)
- [Variant Market Descriptions Endpoint](https://docs.sportradar.com/uof/api-and-structure/api/betting-descriptions/variant-market-descriptions/endpoint)
- [Variant Market Description Direct Endpoint](https://docs.sportradar.com/uof/api-and-structure/api/betting-descriptions/variant-market-description-direct/endpoint)
- [Variant Descriptions Endpoint](https://docs.sportradar.com/uof/api-and-structure/api/betting-descriptions/variant-descriptions/endpoint)

### 概念和特性文档
- [Market Mapping](https://docs.sportradar.com/uof/data-and-features/markets-and-outcomes/market-mapping)
- [Outcome Variant Description](https://docs.sportradar.com/uof/data-and-features/markets-and-outcomes/market-types/outcome-variant-description)

### 已废弃端点（仅供参考）
- [Deprecated: Variant Description](https://docs.sportradar.com/uof/support-and-history/archived/deprecated-uof-endpoints/variant-description)
- [Deprecated: Variant Market Description](https://docs.sportradar.com/uof/support-and-history/archived/deprecated-uof-endpoints/variant-market-description)
- [Deprecated: Variant Market Description Direct](https://docs.sportradar.com/uof/support-and-history/archived/deprecated-uof-endpoints/variant-market-description-direct)

---

## 总结

SportRader 提供了完整的 outcome mapping API 体系，包括：

1. **一个常规 API**：获取所有市场描述和映射
2. **两个 variant API**：
   - Variant Market Descriptions - 通用 variant 查询（可能重定向）
   - Variant Market Description Direct - 产品特定 variant 查询（直接访问）
3. **一个辅助 API**：Variant Descriptions - 列出所有 variant 类型

这些 API 共同构成了从 Unified Odds Feed 到传统 Betradar 产品的完整映射解决方案，支持静态市场、动态市场和冠军盘口等多种场景。
