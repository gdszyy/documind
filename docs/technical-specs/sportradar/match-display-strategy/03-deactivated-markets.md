# 盘口全部停用场景的展示策略补充方案

**作者:** Manus AI  
**日期:** 2025年12月09日  
**版本:** 1.2 (补充)

---

## 1. 场景说明

### 1.1 问题描述

在极端情况下，一个比赛的所有盘口可能在中途全部停用（`status=0` Deactivated），即：
- **曾经有过可用盘口**（Active、Suspended 或 Handed Over）
- **但现在全部停用**（所有盘口都是 Deactivated 或 Cancelled/Settled）

在这种情况下，用户希望：
- ✅ **比赛信息依然出现在前端**
- ✅ **显示"暂无可用盘口"的提示**
- ✅ **保持展示直到比赛开始（未订阅 liveodds）或结束（订阅了 liveodds）**

### 1.2 可用盘口的定义

根据用户需求，**可用盘口**是指所有可以转换为 Active 的状态：
- `1` (Active)：活跃，可投注
- `-1` (Suspended)：暂停，但可能恢复为 Active
- `-2` (Handed Over)：交接中，会转换为 Active

**不可用盘口**（永久性停用）：
- `0` (Deactivated)：停用，不会再恢复
- `-3` (Settled)：已结算，最终状态
- `-4` (Cancelled)：已取消，最终状态

### 1.3 关键区别

这个场景与之前的"交接阶段无盘口"场景的区别：

| 维度 | 交接阶段无盘口 | 盘口全部停用 |
| :--- | :--- | :--- |
| **盘口状态** | 所有盘口都是 `-2` (Handed Over) | 所有盘口都是 `0` (Deactivated) |
| **持续时间** | 通常几秒到几十秒 | 可能持续很长时间 |
| **是否恢复** | 会恢复为 Active | 不会恢复，可能新增其他盘口 |
| **用户预期** | "盘口准备中..." | "暂无可用盘口" |

---

## 2. 核心策略调整

### 2.1 展示策略矩阵（更新）

在原有策略基础上，增加"曾有盘口"的判断维度：

| 订阅状态 | 比赛状态 | 当前可用盘口 | 曾有盘口 | 后端是否返回 | 前端展示策略 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **滚球订阅** | `not_started` | 是 | - | ✅ **是** | 展示赛前盘 |
| **滚球订阅** | `not_started` | 否 | **是** | ✅ **是** | **展示比赛，提示"暂无可用盘口"** |
| **滚球订阅** | `not_started` | 否 | 否 | ✅ **是** | 展示比赛，提示"即将开盘" |
| **滚球订阅** | `live` | 是 | - | ✅ **是** | 正常展示滚球盘 |
| **滚球订阅** | `live` | 否（交接） | - | ✅ **是** | 展示比赛，提示"盘口准备中..." |
| **滚球订阅** | `live` | 否（停用） | **是** | ✅ **是** | **展示比赛，提示"暂无可用盘口"** |
| **滚球订阅** | `ended`/`closed` | - | - | ❌ **否** | 从实时列表中移除 |
| **仅赛前订阅** | `not_started` | 是 | - | ✅ **是** | 展示赛前盘 |
| **仅赛前订阅** | `not_started` | 否 | **是** | ✅ **是** | **展示比赛，提示"暂无可用盘口"** |
| **仅赛前订阅** | `not_started` | 否 | 否 | ❌ **否** | 不展示（从未有过盘口） |
| **仅赛前订阅** | `live` | - | - | ❌ **否** | 无滚球数据，开赛后停止展示 |
| **仅赛前订阅** | `ended`/`closed` | - | - | ❌ **否** | 从实时列表中移除 |

**关键变化**：
- 增加了"曾有盘口"的判断维度
- 只要曾经有过可用盘口，即使现在全部停用，也要继续展示
- 前端提示从"即将开盘"改为"暂无可用盘口"

---

## 3. 数据库字段补充

### 3.1 新增字段

```sql
ALTER TABLE `matches` ADD COLUMN `ever_had_available_markets` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否曾经有过可用盘口';
ALTER TABLE `matches` ADD COLUMN `first_market_available_at` TIMESTAMP NULL COMMENT '首次有可用盘口的时间';
ALTER TABLE `matches` ADD COLUMN `last_market_available_at` TIMESTAMP NULL COMMENT '最后一次有可用盘口的时间';
ALTER TABLE `matches` ADD COLUMN `available_markets_count` INT NOT NULL DEFAULT 0 COMMENT '可用盘口数量（status in 1,-1,-2）';
ALTER TABLE `matches` ADD COLUMN `deactivated_markets_count` INT NOT NULL DEFAULT 0 COMMENT '停用盘口数量（status=0）';
```

### 3.2 字段说明

| 字段 | 说明 | 用途 |
| :--- | :--- | :--- |
| `ever_had_available_markets` | 是否曾经有过可用盘口 | 判断是否应该继续展示 |
| `first_market_available_at` | 首次有可用盘口的时间 | 统计分析 |
| `last_market_available_at` | 最后一次有可用盘口的时间 | 判断停用持续时间 |
| `available_markets_count` | 当前可用盘口数量 | 实时判断 |
| `deactivated_markets_count` | 停用盘口数量 | 辅助判断 |

---

## 4. 消息处理逻辑更新

### 4.1 更新 odds_change 处理逻辑

```python
def process_odds_change_v2(message):
    """
    处理 odds_change 消息（更新版本）
    
    Args:
        message: Sportradar odds_change 消息对象
    """
    # 1. 查找或创建赛事记录
    match = Match.objects.get_or_create(match_id=message.event_id)
    
    # 2. 更新订阅状态
    if message.product == 1:  # Live Odds
        match.has_live_subscription = True
        match.last_live_message_at = datetime.now()
    elif message.product == 3:  # Prematch
        match.last_prematch_message_at = datetime.now()
    
    # 3. 更新比赛状态
    if message.sport_event_status:
        match.sport_event_status = message.sport_event_status.status
        match.home_score = message.sport_event_status.home_score or 0
        match.away_score = message.sport_event_status.away_score or 0
        match.match_time = message.sport_event_status.match_time or 0
    
    # 4. 更新盘口统计（重点更新）
    if message.odds and message.odds.market:
        active_count = 0
        suspended_count = 0
        handover_count = 0
        deactivated_count = 0
        settled_count = 0
        cancelled_count = 0
        total_count = len(message.odds.market)
        
        for market in message.odds.market:
            # 更新单个盘口状态
            update_market_status(market.id, market.status)
            
            # 统计各状态盘口数量
            if market.status == 1:
                active_count += 1
            elif market.status == -1:
                suspended_count += 1
            elif market.status == -2:
                handover_count += 1
            elif market.status == 0:
                deactivated_count += 1
            elif market.status == -3:
                settled_count += 1
            elif market.status == -4:
                cancelled_count += 1
        
        # 更新基础统计
        match.total_markets_count = total_count
        match.active_markets_count = active_count
        match.suspended_markets_count = suspended_count
        match.handover_markets_count = handover_count
        match.deactivated_markets_count = deactivated_count
        match.settled_markets_count = settled_count
        match.cancelled_markets_count = cancelled_count
        
        # 计算可用盘口数量（status in 1, -1, -2）
        available_count = active_count + suspended_count + handover_count
        match.available_markets_count = available_count
        
        # 更新"曾有盘口"标记
        if available_count > 0:
            if not match.ever_had_available_markets:
                match.ever_had_available_markets = True
                match.first_market_available_at = datetime.now()
            match.last_market_available_at = datetime.now()
    
    # 5. 判断是否进入交接状态
    previous_handover_state = match.is_in_handover
    
    if (match.sport_event_status == 'live' and 
        match.total_markets_count > 0 and 
        match.handover_markets_count == match.total_markets_count):
        # 进入交接状态
        if not previous_handover_state:
            match.is_in_handover = True
            match.handover_started_at = datetime.now()
            match.handover_timeout = False
    else:
        # 退出交接状态
        if previous_handover_state:
            match.is_in_handover = False
            match.handover_started_at = None
            match.handover_timeout = False
    
    # 6. 检查交接超时
    if match.is_in_handover and match.handover_started_at:
        elapsed = (datetime.now() - match.handover_started_at).total_seconds()
        if elapsed > 60:
            match.handover_timeout = True
            alert_handover_timeout(match.match_id)
    
    # 7. 更新最后消息时间
    match.last_message_at = datetime.now()
    
    # 8. 保存到数据库
    match.save()
    
    # 9. 推送到前端（如果需要展示）
    if should_display_match_v3(match):
        push_to_frontend(match)
```

---

## 5. 展示判断逻辑更新

### 5.1 核心判断函数

```python
def should_display_match_v3(match):
    """
    判断是否应该展示比赛（最终版本，包含所有兜底逻辑）
    
    Args:
        match: Match 对象
        
    Returns:
        tuple: (should_display: bool, reason: str, display_status: str)
    """
    # 1. 使用兜底逻辑判断是否结束
    is_ended, end_reason = is_match_ended_with_fallback(match)
    
    if is_ended:
        return (False, f'ended_{end_reason}', 'ended')
    
    # 2. 订阅了 liveodds 的比赛
    if match.has_live_subscription:
        if match.sport_event_status in ['not_started', 'match_about_to_start', 'live']:
            # 判断展示状态
            display_status = determine_display_status(match)
            return (True, 'live_subscription_active', display_status)
    
    # 3. 仅赛前订阅的比赛
    if not match.has_live_subscription:
        # 使用兜底逻辑判断是否已开赛
        is_started, start_reason = is_match_started_with_fallback(match)
        
        if is_started:
            return (False, f'started_{start_reason}', 'started')
        
        # 赛前阶段
        if match.sport_event_status == 'not_started':
            # 关键变化：只要曾经有过可用盘口，就继续展示
            if match.available_markets_count > 0:
                return (True, 'prematch_with_markets', 'prematch_active')
            elif match.ever_had_available_markets:
                # 曾经有过盘口，但现在全部停用
                return (True, 'prematch_had_markets_now_deactivated', 'prematch_no_markets')
            else:
                # 从未有过盘口
                return (False, 'prematch_never_had_markets', 'prematch_no_markets')
    
    return (False, 'no_display_condition_met', 'unknown')


def determine_display_status(match):
    """
    判断比赛的展示状态
    
    Args:
        match: Match 对象
        
    Returns:
        str: 展示状态
    """
    # 1. 交接状态（最高优先级）
    if match.is_in_handover:
        if match.handover_timeout:
            return 'handover_timeout'
        return 'handover'
    
    # 2. 有可用盘口
    if match.available_markets_count > 0:
        if match.sport_event_status == 'live':
            return 'live_active'
        else:
            return 'prematch_active'
    
    # 3. 无可用盘口，但曾经有过
    if match.ever_had_available_markets:
        if match.sport_event_status == 'live':
            return 'live_no_markets'
        else:
            return 'prematch_no_markets'
    
    # 4. 从未有过盘口
    if match.sport_event_status == 'live':
        return 'live_waiting_markets'
    else:
        return 'prematch_waiting_markets'
```

### 5.2 展示状态说明

| 展示状态 | 说明 | 前端提示 |
| :--- | :--- | :--- |
| `prematch_active` | 赛前，有可用盘口 | 正常显示盘口 |
| `prematch_no_markets` | 赛前，无可用盘口，但曾有过 | "暂无可用盘口" |
| `prematch_waiting_markets` | 赛前，从未有过盘口 | "即将开盘" |
| `live_active` | 滚球，有可用盘口 | 正常显示盘口 |
| `live_no_markets` | 滚球，无可用盘口，但曾有过 | "暂无可用盘口" |
| `live_waiting_markets` | 滚球，从未有过盘口 | "盘口准备中..." |
| `handover` | 交接中 | "盘口准备中..." |
| `handover_timeout` | 交接超时 | "盘口暂不可用，请稍候" |

---

## 6. API 响应格式更新

### 6.1 返回字段补充

```json
{
  "match_id": "sr:match:12345678",
  "sport_event_status": "not_started",
  "has_live_subscription": false,
  "active_markets_count": 0,
  "available_markets_count": 0,
  "deactivated_markets_count": 85,
  "total_markets_count": 85,
  "ever_had_available_markets": true,
  "first_market_available_at": "2025-12-09T12:00:00Z",
  "last_market_available_at": "2025-12-09T14:30:00Z",
  "is_in_handover": false,
  "display_status": "prematch_no_markets",
  "display_message": "暂无可用盘口",
  "display_hint": "所有盘口已停用，请关注其他比赛或等待新盘口开放",
  "markets": []
}
```

### 6.2 display_message 映射

```python
DISPLAY_MESSAGES = {
    'prematch_active': None,  # 不显示特殊提示
    'prematch_no_markets': '暂无可用盘口',
    'prematch_waiting_markets': '即将开盘',
    'live_active': None,
    'live_no_markets': '暂无可用盘口',
    'live_waiting_markets': '盘口准备中...',
    'handover': '盘口准备中...',
    'handover_timeout': '盘口暂不可用，请稍候',
}

DISPLAY_HINTS = {
    'prematch_no_markets': '所有盘口已停用，请关注其他比赛或等待新盘口开放',
    'live_no_markets': '所有盘口已停用，请关注其他比赛或等待新盘口开放',
    'prematch_waiting_markets': '盘口即将开放，请稍候',
    'live_waiting_markets': '比赛已开始，盘口即将开放',
    'handover': '数据生产者正在切换，盘口即将恢复',
    'handover_timeout': '数据生产者切换异常，我们正在努力恢复',
}
```

---

## 7. 前端实现更新

### 7.1 渲染逻辑更新

```javascript
// 渲染比赛状态提示
function renderMatchStatus(match) {
  // 1. 交接状态（最高优先级）
  if (match.is_in_handover) {
    const timeoutClass = match.handover_timeout ? 'timeout' : '';
    const message = match.display_message || '盘口准备中...';
    const hint = match.display_hint || '';
    
    return `
      <div class="match-status handover ${timeoutClass}">
        <div class="status-icon">
          <div class="loading-spinner"></div>
        </div>
        <div class="status-content">
          <div class="status-message">${message}</div>
          ${hint ? `<div class="status-hint">${hint}</div>` : ''}
        </div>
      </div>
    `;
  }
  
  // 2. 无可用盘口状态
  if (match.available_markets_count === 0) {
    const message = match.display_message || '暂无可用盘口';
    const hint = match.display_hint || '';
    
    // 区分"曾有盘口"和"从未有盘口"
    const statusClass = match.ever_had_available_markets 
      ? 'no-markets-deactivated'  // 曾有盘口，现在停用
      : 'no-markets-waiting';      // 从未有盘口，等待开放
    
    const iconClass = match.ever_had_available_markets
      ? 'icon-warning'   // 警告图标
      : 'icon-clock';    // 时钟图标
    
    return `
      <div class="match-status ${statusClass}">
        <div class="status-icon">
          <i class="${iconClass}"></i>
        </div>
        <div class="status-content">
          <div class="status-message">${message}</div>
          ${hint ? `<div class="status-hint">${hint}</div>` : ''}
          ${renderMarketHistory(match)}
        </div>
      </div>
    `;
  }
  
  // 3. 有可用盘口，正常显示
  return '';
}

// 渲染盘口历史信息（可选）
function renderMarketHistory(match) {
  if (!match.ever_had_available_markets) {
    return '';
  }
  
  const lastAvailableTime = new Date(match.last_market_available_at);
  const now = new Date();
  const minutesAgo = Math.floor((now - lastAvailableTime) / 60000);
  
  return `
    <div class="market-history">
      <small>最后可用时间：${minutesAgo}分钟前</small>
    </div>
  `;
}

// 渲染盘口列表
function renderMarkets(match) {
  // 1. 无盘口或全部停用
  if (match.available_markets_count === 0) {
    const message = match.ever_had_available_markets
      ? '所有盘口已停用'
      : '盘口即将开放';
    
    return `
      <div class="markets-container empty">
        <div class="empty-state">
          <div class="empty-icon">
            ${match.ever_had_available_markets ? '🚫' : '⏳'}
          </div>
          <div class="empty-message">${message}</div>
          ${renderMarketStats(match)}
        </div>
      </div>
    `;
  }
  
  // 2. 有可用盘口，正常渲染
  let marketsHtml = '<div class="markets-container">';
  match.markets.forEach(market => {
    marketsHtml += renderMarket(market);
  });
  marketsHtml += '</div>';
  
  return marketsHtml;
}

// 渲染盘口统计信息（可选）
function renderMarketStats(match) {
  if (!match.ever_had_available_markets) {
    return '';
  }
  
  return `
    <div class="market-stats">
      <div class="stat-item">
        <span class="stat-label">总盘口数：</span>
        <span class="stat-value">${match.total_markets_count}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">已停用：</span>
        <span class="stat-value">${match.deactivated_markets_count}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">已结算：</span>
        <span class="stat-value">${match.settled_markets_count}</span>
      </div>
    </div>
  `;
}
```

### 7.2 CSS 样式补充

```css
/* 无盘口状态（曾有盘口，现在停用） */
.match-status.no-markets-deactivated {
  background: #fff3cd;
  border: 1px solid #ffc107;
  padding: 12px;
  border-radius: 4px;
  margin: 8px 0;
}

.match-status.no-markets-deactivated .icon-warning {
  color: #ffc107;
  font-size: 20px;
}

/* 无盘口状态（从未有盘口，等待开放） */
.match-status.no-markets-waiting {
  background: #e7f3ff;
  border: 1px solid #2196f3;
  padding: 12px;
  border-radius: 4px;
  margin: 8px 0;
}

.match-status.no-markets-waiting .icon-clock {
  color: #2196f3;
  font-size: 20px;
}

/* 状态提示内容 */
.status-content {
  flex: 1;
}

.status-message {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.status-hint {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

/* 盘口历史信息 */
.market-history {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.market-history small {
  color: #999;
  font-size: 11px;
}

/* 空状态容器 */
.markets-container.empty {
  padding: 24px;
  text-align: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.5;
}

.empty-message {
  font-size: 14px;
  color: #666;
}

/* 盘口统计信息 */
.market-stats {
  margin-top: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 4px;
  display: flex;
  gap: 16px;
  justify-content: center;
}

.stat-item {
  display: flex;
  gap: 4px;
  font-size: 12px;
}

.stat-label {
  color: #666;
}

.stat-value {
  font-weight: 500;
  color: #333;
}
```

---

## 8. 监控与告警补充

### 8.1 新增监控指标

| 指标名称 | 描述 | 告警阈值 | 处理建议 |
| :--- | :--- | :--- | :--- |
| **盘口全部停用比赛数** | 曾有盘口但现在全部停用的比赛数量 | > 10 | 检查 Sportradar 是否批量停用盘口 |
| **盘口停用持续时长** | 从最后可用到现在的时长 | > 30分钟 | 检查是否应该从展示列表中移除 |
| **从未有盘口比赛数** | 长时间从未有过盘口的比赛数量 | > 5 | 检查是否应该从展示列表中移除 |

### 8.2 告警规则

```python
def check_deactivated_markets():
    """
    检查盘口全部停用的比赛
    每10分钟执行一次
    """
    # 查找所有盘口全部停用的比赛
    deactivated_matches = Match.objects.filter(
        ever_had_available_markets=True,
        available_markets_count=0,
        sport_event_status__in=['not_started', 'live']
    )
    
    for match in deactivated_matches:
        # 计算停用持续时长
        if match.last_market_available_at:
            deactivated_duration = (datetime.now() - match.last_market_available_at).total_seconds() / 60
            
            # 超过30分钟，触发告警
            if deactivated_duration > 30:
                alert_long_term_deactivated(match, deactivated_duration)


def alert_long_term_deactivated(match, duration_minutes):
    """
    告警：盘口长期停用
    """
    alert_message = f"""
    【盘口长期停用告警】
    赛事ID: {match.match_id}
    赛事: {match.home_team.name} vs {match.away_team.name}
    比赛状态: {match.sport_event_status}
    总盘口数: {match.total_markets_count}
    停用盘口数: {match.deactivated_markets_count}
    停用持续时长: {duration_minutes:.0f}分钟
    最后可用时间: {match.last_market_available_at}
    
    请检查：
    1. 是否应该从展示列表中移除
    2. Sportradar 是否有新盘口开放
    3. 是否需要人工介入
    """
    
    send_alert(alert_message, level='medium')
```

---

## 9. 测试用例补充

```python
class TestDeactivatedMarketsScenario(unittest.TestCase):
    
    def test_prematch_had_markets_now_deactivated_should_display(self):
        """测试：赛前，曾有盘口但现在全部停用 -> 应该展示"""
        match = Match(
            has_live_subscription=False,
            sport_event_status='not_started',
            available_markets_count=0,
            deactivated_markets_count=50,
            ever_had_available_markets=True,
            last_market_available_at=datetime.now() - timedelta(minutes=10)
        )
        should_display, reason, status = should_display_match_v3(match)
        self.assertTrue(should_display)
        self.assertEqual(reason, 'prematch_had_markets_now_deactivated')
        self.assertEqual(status, 'prematch_no_markets')
    
    def test_prematch_never_had_markets_should_not_display(self):
        """测试：赛前，从未有过盘口 -> 不应该展示"""
        match = Match(
            has_live_subscription=False,
            sport_event_status='not_started',
            available_markets_count=0,
            ever_had_available_markets=False
        )
        should_display, reason, status = should_display_match_v3(match)
        self.assertFalse(should_display)
        self.assertEqual(reason, 'prematch_never_had_markets')
    
    def test_live_had_markets_now_deactivated_should_display(self):
        """测试：滚球，曾有盘口但现在全部停用 -> 应该展示"""
        match = Match(
            has_live_subscription=True,
            sport_event_status='live',
            available_markets_count=0,
            deactivated_markets_count=100,
            ever_had_available_markets=True,
            last_market_available_at=datetime.now() - timedelta(minutes=5)
        )
        should_display, reason, status = should_display_match_v3(match)
        self.assertTrue(should_display)
        self.assertEqual(status, 'live_no_markets')
    
    def test_available_markets_count_calculation(self):
        """测试：可用盘口数量计算"""
        match = Match()
        message = mock_odds_change_message(
            markets=[
                {'status': 1},   # Active
                {'status': -1},  # Suspended
                {'status': -2},  # Handed Over
                {'status': 0},   # Deactivated
                {'status': -3},  # Settled
            ]
        )
        process_odds_change_v2(message)
        match.refresh_from_db()
        
        # 可用盘口数量应该是 3（1 + -1 + -2）
        self.assertEqual(match.available_markets_count, 3)
        self.assertEqual(match.deactivated_markets_count, 1)
        self.assertEqual(match.settled_markets_count, 1)
```

---

## 10. 总结

### 10.1 核心变化

1. **新增"曾有盘口"判断维度**：通过 `ever_had_available_markets` 字段记录
2. **重新定义"可用盘口"**：status in (1, -1, -2)，而不仅仅是 Active
3. **细化展示状态**：区分"曾有盘口但停用"和"从未有盘口"
4. **优化用户提示**：根据不同场景显示不同的提示信息

### 10.2 关键逻辑

```
如果比赛曾经有过可用盘口（status in 1, -1, -2）：
  ├─ 订阅了 liveodds：展示到比赛结束
  └─ 未订阅 liveodds：展示到比赛开始

如果比赛从未有过可用盘口：
  ├─ 订阅了 liveodds：展示到比赛结束（提示"即将开盘"）
  └─ 未订阅 liveodds：不展示
```

### 10.3 用户体验优化

1. **避免比赛"消失"**：即使盘口全部停用，比赛依然可见
2. **明确的状态提示**：用户清楚知道为什么没有盘口
3. **历史信息展示**：显示最后可用时间、盘口统计等
4. **视觉区分**：不同场景使用不同的图标和颜色

这个方案完美解决了盘口全部停用的极端场景，确保用户体验的连续性和一致性！
