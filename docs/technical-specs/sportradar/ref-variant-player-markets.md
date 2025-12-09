# Sportradar 官方文档：Variant 和 Player Markets

## 1. Variant Markets 识别和处理

### 关键要点：
- **Variant 市场通过 `specifiers` 属性识别**，格式为 `variant=<variant_urn>`
- **两种 variant URN 前缀**：
  - `sr:` - Sportradar 标准 variant 市场（如 `sr:exact_games:bestof:5`）
  - `pre:` - Player props 市场（如 `pre:playerprops:41762859:547410`）

### Variant Market 描述获取：
- 需要额外的 API 调用：`/descriptions/en/markets/{market_id}/variants/{variant_urn}`
- 返回的 XML 根元素是 `<market_descriptions>`，不是 `<variant_descriptions>`
- 同一个 market_id 配合不同的 variant 应该被视为**不同的市场线**

### 示例：
```xml
<market_descriptions response_code="OK">
    <market id="241" name="Exact games" variant="sr:exact_games:bestof:5">
        <outcomes>
            <outcome id="sr:exact_games:bestof:5:39" name="3"/>
            <outcome id="sr:exact_games:bestof:5:40" name="4"/>
            <outcome id="sr:exact_games:bestof:5:41" name="5"/>
        </outcomes>
    </market>
</market_descriptions>
```

## 2. Player Markets 处理

### Pre-match Player Markets 特征：

#### Variant 格式的球员市场：
- **Specifier**: `variant=pre:playerprops:matchid:playerid`
- **Outcome ID**: `pre:playerprops:matchid:playerid:outcome`
- **Outcome Name**: 包含球员名称和结果（如 "Odegaard, Martin 1+"）

示例：
```xml
<market _name="Player shots on goal (incl. overtime)" 
        id="777" 
        specifiers="variant=pre:playerprops:41762859:547410" 
        status="1">
  <outcome _name="Odegaard, Martin 1+" 
           active="1" 
           id="pre:playerprops:41762859:547410:1" 
           odds="1.59" 
           probabilities="0.5455" 
           team="2"/>
  <outcome _name="Odegaard, Martin 2+" 
           active="1" 
           id="pre:playerprops:41762859:547410:2" 
           odds="3.65" 
           probabilities="0.2076" 
           team="2"/>
</market>
```

#### 标准 Specifier 格式的球员市场：
- **Specifier**: `player=sr:player:547410|total=0.5`
- **Outcome ID**: 标准 ID（如 "12", "13" 代表 over/under）
- **Market Name**: 包含球员名称（如 "Martin Odegaard total shots on goal"）

示例：
```xml
<market _name="Martin Odegaard total shots on goal (incl. overtime)" 
        id="1185" 
        specifiers="player=sr:player:547410|total=0.5" 
        status="1">
  <outcome _name="over 0.5" 
           active="1" 
           id="12" 
           odds="2.25" 
           probabilities="0.4196"/>
  <outcome _name="under 0.5" 
           active="1" 
           id="13" 
           odds="1.65" 
           probabilities="0.5802"/>
</market>
```

### 球员信息识别：
- Outcome ID 以 `sr:player:` 开头时，表示这是一个球员市场
- 需要通过 Player Profile API 获取球员名称：`/v1/sports/en/players/{player_id}/profile.xml`

## 3. Specifiers 处理规则

### 基本格式：
- 多个 specifier 用 `|` 分隔
- 每个 specifier 格式为 `key=value`
- 示例：`player=sr:player:547410|total=0.5`

### 特殊 Specifiers：
1. **variant**: 指向 variant market 描述
2. **player**: 指向球员 URN
3. **total**: 大小球总分
4. **hcp**: 让球数
5. **quarternr**: 节数
6. **goalnr**: 进球数

### Extended Specifiers：
- 提供额外显示信息，**不用于唯一标识市场**
- 示例：`extended_specifiers="score=0:1"`
- 仅用于展示目的，不影响市场唯一性

## 4. Market 唯一性识别

**唯一标识一个市场的组合**：
- `market_id` + `specifiers`

**注意**：
- `extended_specifiers` 不参与唯一性判断
- 同一 `market_id` 配合不同 `variant` 是不同的市场
- 同一 `market_id` 配合不同 `player` 是不同的市场

## 5. Odds Change 消息中的市场处理流程

1. **解析 market 元素**：提取 `id`, `specifiers`, `status`
2. **检查是否有 variant specifier**：
   - 如果有 `variant=sr:*`，需要调用 variant API 获取描述
   - 如果有 `variant=pre:*`，这是 player props，**不支持 variant API**
3. **检查是否有 player specifier**：
   - 如果有 `player=sr:player:*`，需要调用 Player Profile API
4. **解析 outcome 元素**：
   - 如果 `outcome_id` 以 `sr:player:` 开头，需要获取球员信息
   - 如果 `outcome_id` 以 `pre:playerprops:` 开头，outcome_name 已包含球员名称
5. **替换模板变量**：
   - `{$competitor1}` → 主队名称
   - `{$competitor2}` → 客队名称
   - `{total}`, `{hcp}` 等 → 从 specifiers 中提取的值
