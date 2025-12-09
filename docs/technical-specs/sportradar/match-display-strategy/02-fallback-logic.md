# 比赛状态判断的兜底逻辑补充方案

**作者:** Manus AI  
**日期:** 2025年12月09日  
**版本:** 1.1 (补充)

---

## 1. 问题背景

在实际运营中，仅依赖 Sportradar 的 `sport_event_status` 来判断比赛是否结束或开赛，可能会遇到以下问题：

1. **消息延迟或丢失**：Sportradar 的消息可能因网络问题延迟或丢失
2. **状态更新不及时**：比赛实际已结束，但状态仍为 `live`
3. **异常状态**：比赛进入 `abandoned`、`interrupted` 等异常状态，但未明确标记为结束
4. **时间不同步**：计划开始时间已过，但状态仍为 `not_started`

因此，需要建立**多维度的兜底逻辑**，结合多个数据源来准确判断比赛状态。

---

## 2. 比赛结束判断的兜底逻辑（订阅了 liveodds）

### 2.1 判断维度

对于订阅了 liveodds 的比赛，应该从以下维度综合判断是否结束：

| 维度 | 判断依据 | 权重 | 说明 |
| :--- | :--- | :--- | :--- |
| **官方状态** | `sport_event_status` in [`ended`, `closed`] | **高** | 最直接的判断依据 |
| **异常状态** | `sport_event_status` in [`cancelled`, `abandoned`] | **高** | 这些状态也应视为"结束" |
| **消息超时** | 超过一定时间未收到任何消息 | **中** | 可能是数据源问题 |
| **比赛时长** | 比赛进行时间超过正常时长 | **中** | 不同运动有不同标准 |
| **盘口状态** | 所有盘口都是 `Settled` 或 `Cancelled` | **低** | 辅助判断 |

### 2.2 具体判断逻辑

```python
def is_match_ended_with_fallback(match):
    """
    判断比赛是否结束（带兜底逻辑）
    
    Args:
        match: Match 对象
        
    Returns:
        tuple: (is_ended: bool, reason: str)
    """
    # 1. 官方状态判断（最高优先级）
    if match.sport_event_status in ['ended', 'closed']:
        return (True, 'official_status_ended')
    
    # 2. 异常状态判断
    if match.sport_event_status in ['cancelled', 'abandoned', 'postponed']:
        return (True, 'abnormal_status')
    
    # 3. 消息超时判断（仅对 live 状态的比赛）
    if match.sport_event_status == 'live':
        if match.last_message_at:
            silence_duration = (datetime.now() - match.last_message_at).total_seconds()
            
            # 超过15分钟未收到任何消息，视为结束
            if silence_duration > 900:  # 15分钟
                return (True, 'message_timeout_15min')
    
    # 4. 比赛时长判断（基于运动类型）
    if match.sport_event_status == 'live':
        match_duration = get_match_duration_minutes(match)
        max_duration = get_sport_max_duration(match.sport_id)
        
        # 比赛时长超过正常时长的150%，视为结束
        if match_duration > max_duration * 1.5:
            return (True, f'duration_exceeded_{match_duration}min')
    
    # 5. 盘口状态判断（辅助）
    if match.total_markets_count > 0:
        settled_or_cancelled = (
            match.settled_markets_count + match.cancelled_markets_count
        )
        
        # 如果所有盘口都已结算或取消，且比赛已进行超过正常时长
        if settled_or_cancelled == match.total_markets_count:
            match_duration = get_match_duration_minutes(match)
            min_duration = get_sport_min_duration(match.sport_id)
            
            if match_duration > min_duration:
                return (True, 'all_markets_settled')
    
    # 6. 计划时间判断（极端情况）
    if match.sport_event_status == 'live':
        time_since_scheduled = (datetime.now() - match.scheduled_start_time).total_seconds() / 60
        max_duration = get_sport_max_duration(match.sport_id)
        
        # 距离计划开始时间超过正常时长的200%，视为异常
        if time_since_scheduled > max_duration * 2:
            return (True, f'scheduled_time_exceeded_{time_since_scheduled}min')
    
    return (False, 'not_ended')


def get_sport_max_duration(sport_id):
    """
    获取运动的最大正常时长（分钟）
    
    Args:
        sport_id: 运动类型ID
        
    Returns:
        int: 最大时长（分钟）
    """
    sport_durations = {
        1: 120,   # 足球：90分钟 + 伤停补时 + 可能的加时
        2: 150,   # 篮球：48分钟 + 暂停 + 可能的加时
        5: 240,   # 网球：无固定时长，设置较大值
        12: 210,  # 冰球：60分钟 + 中场休息 + 可能的加时
        16: 240,  # 美式足球：60分钟 + 暂停 + 加时
        23: 180,  # 排球：无固定时长，设置较大值
    }
    return sport_durations.get(sport_id, 180)  # 默认3小时


def get_sport_min_duration(sport_id):
    """
    获取运动的最小正常时长（分钟）
    
    Args:
        sport_id: 运动类型ID
        
    Returns:
        int: 最小时长（分钟）
    """
    sport_durations = {
        1: 90,    # 足球：90分钟
        2: 48,    # 篮球：48分钟
        5: 60,    # 网球：至少1小时
        12: 60,   # 冰球：60分钟
        16: 60,   # 美式足球：60分钟
        23: 60,   # 排球：至少1小时
    }
    return sport_durations.get(sport_id, 60)  # 默认1小时


def get_match_duration_minutes(match):
    """
    获取比赛已进行时长（分钟）
    
    Args:
        match: Match 对象
        
    Returns:
        int: 已进行时长（分钟）
    """
    if match.sport_event_status == 'live':
        # 优先使用 match_time 字段（来自 Sportradar）
        if match.match_time:
            return match.match_time
        
        # 兜底：计算从开始时间到现在的时长
        if match.actual_start_time:
            return int((datetime.now() - match.actual_start_time).total_seconds() / 60)
        
        # 再兜底：使用计划开始时间
        return int((datetime.now() - match.scheduled_start_time).total_seconds() / 60)
    
    return 0
```

### 2.3 处理流程

```python
def should_display_match_with_fallback(match):
    """
    判断是否应该展示比赛（带兜底逻辑）
    
    Args:
        match: Match 对象
        
    Returns:
        tuple: (should_display: bool, reason: str)
    """
    # 1. 使用兜底逻辑判断是否结束
    is_ended, end_reason = is_match_ended_with_fallback(match)
    
    if is_ended:
        # 记录日志
        logger.info(
            f"Match {match.match_id} marked as ended",
            extra={
                'official_status': match.sport_event_status,
                'end_reason': end_reason,
                'match_duration': get_match_duration_minutes(match)
            }
        )
        return (False, f'ended_{end_reason}')
    
    # 2. 订阅了 liveodds 的比赛，只要没结束就展示
    if match.has_live_subscription:
        if match.sport_event_status in ['not_started', 'match_about_to_start', 'live']:
            return (True, 'live_subscription_active')
    
    # 3. 仅赛前订阅的比赛，只在赛前且有盘口时展示
    if not match.has_live_subscription:
        if match.sport_event_status == 'not_started' and match.active_markets_count > 0:
            return (True, 'prematch_with_markets')
    
    return (False, 'no_display_condition_met')
```

---

## 3. 比赛开赛判断的兜底逻辑（未订阅 liveodds）

### 3.1 判断维度

对于未订阅 liveodds 的比赛，需要准确判断是否已开赛，以便及时停止展示：

| 维度 | 判断依据 | 权重 | 说明 |
| :--- | :--- | :--- | :--- |
| **官方状态** | `sport_event_status` in [`live`, `ended`, `closed`] | **高** | 最直接的判断依据 |
| **计划时间** | 当前时间 > 计划开始时间 + 缓冲时间 | **中** | 防止状态更新延迟 |
| **比分变化** | `home_score > 0` 或 `away_score > 0` | **中** | 有比分说明已开赛 |
| **盘口状态** | 收到 `bet_stop` 且 `market_status=0` | **低** | 辅助判断 |
| **消息类型** | 收到过 `product=1` 的消息 | **低** | 可能是订阅状态误判 |

### 3.2 具体判断逻辑

```python
def is_match_started_with_fallback(match):
    """
    判断比赛是否已开赛（带兜底逻辑）
    
    Args:
        match: Match 对象
        
    Returns:
        tuple: (is_started: bool, reason: str)
    """
    # 1. 官方状态判断（最高优先级）
    if match.sport_event_status in ['live', 'ended', 'closed', 'interrupted', 'suspended']:
        return (True, 'official_status_started')
    
    # 2. 计划时间判断（防止状态更新延迟）
    if match.scheduled_start_time:
        time_since_scheduled = (datetime.now() - match.scheduled_start_time).total_seconds() / 60
        
        # 超过计划开始时间15分钟，视为已开赛
        if time_since_scheduled > 15:
            return (True, f'scheduled_time_passed_{time_since_scheduled}min')
    
    # 3. 比分变化判断
    if match.home_score > 0 or match.away_score > 0:
        return (True, 'score_changed')
    
    # 4. 盘口状态判断（辅助）
    if match.total_markets_count > 0 and match.active_markets_count == 0:
        # 所有盘口都不活跃，且距离开始时间较近
        if match.scheduled_start_time:
            time_since_scheduled = (datetime.now() - match.scheduled_start_time).total_seconds() / 60
            if -5 < time_since_scheduled < 30:  # 开赛前5分钟到开赛后30分钟
                return (True, 'all_markets_inactive_near_start')
    
    # 5. 消息类型判断（可能是订阅状态误判）
    if match.last_live_message_at:
        # 如果收到过 live 消息，说明可能订阅了 liveodds
        logger.warning(
            f"Match {match.match_id} has live messages but not marked as live subscription",
            extra={
                'has_live_subscription': match.has_live_subscription,
                'last_live_message_at': match.last_live_message_at
            }
        )
        # 更新订阅状态
        match.has_live_subscription = True
        match.save()
        return (False, 'subscription_status_corrected')
    
    return (False, 'not_started')


def should_hide_prematch_only_match(match):
    """
    判断仅赛前订阅的比赛是否应该隐藏
    
    Args:
        match: Match 对象
        
    Returns:
        tuple: (should_hide: bool, reason: str)
    """
    # 只处理未订阅 liveodds 的比赛
    if match.has_live_subscription:
        return (False, 'has_live_subscription')
    
    # 使用兜底逻辑判断是否已开赛
    is_started, start_reason = is_match_started_with_fallback(match)
    
    if is_started:
        # 记录日志
        logger.info(
            f"Prematch-only match {match.match_id} marked as started, hiding from display",
            extra={
                'official_status': match.sport_event_status,
                'start_reason': start_reason,
                'time_since_scheduled': (datetime.now() - match.scheduled_start_time).total_seconds() / 60
            }
        )
        return (True, f'started_{start_reason}')
    
    return (False, 'not_started')
```

---

## 4. 数据库字段补充

为了支持兜底逻辑，需要在数据库中增加以下字段：

```sql
ALTER TABLE `matches` ADD COLUMN `actual_start_time` TIMESTAMP NULL COMMENT '实际开始时间';
ALTER TABLE `matches` ADD COLUMN `settled_markets_count` INT NOT NULL DEFAULT 0 COMMENT '已结算盘口数量';
ALTER TABLE `matches` ADD COLUMN `cancelled_markets_count` INT NOT NULL DEFAULT 0 COMMENT '已取消盘口数量';
ALTER TABLE `matches` ADD COLUMN `fallback_ended` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '通过兜底逻辑判断为已结束';
ALTER TABLE `matches` ADD COLUMN `fallback_ended_reason` VARCHAR(50) NULL COMMENT '兜底逻辑判断结束的原因';
ALTER TABLE `matches` ADD COLUMN `fallback_ended_at` TIMESTAMP NULL COMMENT '兜底逻辑判断结束的时间';
```

---

## 5. 定期检查任务

建议设置定期任务，主动检查可能状态异常的比赛：

```python
def check_stale_matches():
    """
    定期检查可能状态异常的比赛
    每5分钟执行一次
    """
    # 1. 检查长时间处于 live 状态的比赛
    stale_live_matches = Match.objects.filter(
        sport_event_status='live',
        last_message_at__lt=datetime.now() - timedelta(minutes=15)
    )
    
    for match in stale_live_matches:
        is_ended, reason = is_match_ended_with_fallback(match)
        if is_ended:
            match.fallback_ended = True
            match.fallback_ended_reason = reason
            match.fallback_ended_at = datetime.now()
            match.save()
            
            # 触发告警
            alert_stale_match(match, reason)
    
    # 2. 检查长时间处于 not_started 但已过开始时间的比赛
    stale_prematch_matches = Match.objects.filter(
        sport_event_status='not_started',
        scheduled_start_time__lt=datetime.now() - timedelta(minutes=15)
    )
    
    for match in stale_prematch_matches:
        is_started, reason = is_match_started_with_fallback(match)
        if is_started:
            # 如果未订阅 liveodds，从展示列表中移除
            if not match.has_live_subscription:
                logger.info(
                    f"Prematch-only match {match.match_id} started, removing from display",
                    extra={'reason': reason}
                )
    
    # 3. 检查订阅状态可能误判的比赛
    potential_live_subscription_matches = Match.objects.filter(
        has_live_subscription=False,
        last_live_message_at__isnull=False
    )
    
    for match in potential_live_subscription_matches:
        logger.warning(
            f"Match {match.match_id} has live messages but not marked as live subscription, correcting",
            extra={'last_live_message_at': match.last_live_message_at}
        )
        match.has_live_subscription = True
        match.save()


def alert_stale_match(match, reason):
    """
    告警：比赛状态异常
    """
    alert_message = f"""
    【比赛状态异常告警】
    赛事ID: {match.match_id}
    赛事: {match.home_team.name} vs {match.away_team.name}
    官方状态: {match.sport_event_status}
    最后消息时间: {match.last_message_at}
    兜底判断原因: {reason}
    
    请检查：
    1. Sportradar 消息是否正常
    2. 比赛是否实际已结束
    3. 是否需要手动更新状态
    """
    
    send_alert(alert_message, level='medium')
```

---

## 6. API 返回逻辑更新

更新 API 返回逻辑，整合兜底判断：

```python
def get_displayable_matches_v2(sport_id=None, limit=100):
    """
    获取应该在前端展示的赛事列表（带兜底逻辑）
    
    Args:
        sport_id: 运动类型ID（可选）
        limit: 返回数量限制
        
    Returns:
        List[Match]: 应该展示的赛事列表
    """
    displayable_matches = []
    
    # 构建基础查询
    query = Match.objects.all()
    if sport_id:
        query = query.filter(sport_id=sport_id)
    
    for match in query:
        # 使用兜底逻辑判断是否应该展示
        should_display, reason = should_display_match_with_fallback(match)
        
        if should_display:
            displayable_matches.append(match)
            
            # 记录展示决策
            logger.debug(
                f"Match {match.match_id} displayed",
                extra={
                    'reason': reason,
                    'official_status': match.sport_event_status,
                    'has_live_subscription': match.has_live_subscription
                }
            )
        else:
            # 记录不展示决策
            logger.debug(
                f"Match {match.match_id} hidden",
                extra={
                    'reason': reason,
                    'official_status': match.sport_event_status,
                    'has_live_subscription': match.has_live_subscription
                }
            )
    
    # 按开始时间排序
    displayable_matches.sort(key=lambda m: m.scheduled_start_time)
    
    # 限制返回数量
    return displayable_matches[:limit]
```

---

## 7. 监控指标补充

增加以下监控指标，确保兜底逻辑正常工作：

| 指标名称 | 描述 | 告警阈值 | 处理建议 |
| :--- | :--- | :--- | :--- |
| **兜底判断触发率** | 通过兜底逻辑判断结束的比赛占比 | > 10% | 检查 Sportradar 消息是否正常 |
| **状态异常比赛数** | 长时间未更新状态的比赛数量 | > 5 | 检查消息处理逻辑 |
| **订阅状态误判率** | 订阅状态需要修正的比赛占比 | > 5% | 检查订阅识别逻辑 |
| **消息静默时长** | 比赛进行中但长时间未收到消息 | > 10分钟 | 检查 Sportradar 连接 |

---

## 8. 测试用例补充

```python
class TestFallbackLogic(unittest.TestCase):
    
    def test_match_ended_by_timeout(self):
        """测试：消息超时判断比赛结束"""
        match = Match(
            sport_event_status='live',
            last_message_at=datetime.now() - timedelta(minutes=20),
            has_live_subscription=True
        )
        is_ended, reason = is_match_ended_with_fallback(match)
        self.assertTrue(is_ended)
        self.assertEqual(reason, 'message_timeout_15min')
    
    def test_match_ended_by_duration(self):
        """测试：比赛时长判断比赛结束"""
        match = Match(
            sport_id=1,  # 足球
            sport_event_status='live',
            match_time=180,  # 180分钟，超过正常时长
            has_live_subscription=True
        )
        is_ended, reason = is_match_ended_with_fallback(match)
        self.assertTrue(is_ended)
        self.assertIn('duration_exceeded', reason)
    
    def test_match_started_by_scheduled_time(self):
        """测试：计划时间判断比赛开赛"""
        match = Match(
            sport_event_status='not_started',
            scheduled_start_time=datetime.now() - timedelta(minutes=20),
            has_live_subscription=False
        )
        is_started, reason = is_match_started_with_fallback(match)
        self.assertTrue(is_started)
        self.assertIn('scheduled_time_passed', reason)
    
    def test_match_started_by_score(self):
        """测试：比分变化判断比赛开赛"""
        match = Match(
            sport_event_status='not_started',
            home_score=1,
            away_score=0,
            has_live_subscription=False
        )
        is_started, reason = is_match_started_with_fallback(match)
        self.assertTrue(is_started)
        self.assertEqual(reason, 'score_changed')
    
    def test_subscription_status_correction(self):
        """测试：订阅状态自动修正"""
        match = Match(
            has_live_subscription=False,
            last_live_message_at=datetime.now()
        )
        is_started, reason = is_match_started_with_fallback(match)
        match.refresh_from_db()
        self.assertTrue(match.has_live_subscription)
        self.assertEqual(reason, 'subscription_status_corrected')
```

---

## 9. 配置建议

建议将兜底逻辑的阈值配置化，方便根据实际情况调整：

```python
# config.py
FALLBACK_CONFIG = {
    # 消息超时阈值（秒）
    'message_timeout_seconds': 900,  # 15分钟
    
    # 计划时间缓冲（分钟）
    'scheduled_time_buffer_minutes': 15,
    
    # 运动时长配置（分钟）
    'sport_max_durations': {
        1: 120,   # 足球
        2: 150,   # 篮球
        5: 240,   # 网球
        12: 210,  # 冰球
        16: 240,  # 美式足球
        23: 180,  # 排球
    },
    
    # 运动最小时长配置（分钟）
    'sport_min_durations': {
        1: 90,    # 足球
        2: 48,    # 篮球
        5: 60,    # 网球
        12: 60,   # 冰球
        16: 60,   # 美式足球
        23: 60,   # 排球
    },
    
    # 时长超限倍数
    'duration_exceed_multiplier': 1.5,
    
    # 定期检查任务间隔（分钟）
    'check_interval_minutes': 5,
}
```

---

## 10. 总结

兜底逻辑的核心思想是：**不完全依赖单一数据源，而是通过多维度交叉验证，确保判断的准确性**。

### 关键要点

1. **多维度判断**：结合官方状态、时间、比分、盘口等多个维度
2. **分级处理**：不同维度有不同权重，优先使用高权重判断
3. **主动检查**：定期任务主动发现异常状态
4. **自动修正**：发现订阅状态误判时自动修正
5. **完整日志**：记录所有兜底判断，便于排查问题

### 实施建议

1. **灰度上线**：先在小范围内测试兜底逻辑
2. **监控告警**：密切监控兜底判断的触发频率
3. **参数调优**：根据实际情况调整阈值参数
4. **定期回顾**：定期分析兜底判断的准确性

通过这套兜底逻辑，可以大幅提升比赛状态判断的准确性和鲁棒性，避免因数据源问题导致的展示异常。
