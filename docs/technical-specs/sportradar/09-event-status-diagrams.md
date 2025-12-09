# Sportradar sport_event_status Mermaid 图表集合

本文档包含6个详细的Mermaid图表，全面展示sport_event_status元素的各个方面。

---

## 📊 图表总览

### 1. 比赛状态流转图（State Transition Diagram）
**文件**：`01_state_transition.png`

这个图表展示了所有12种比赛状态之间的转换关系，包括：
- **初始状态**（黄色）：not_started, match_about_to_start
- **进行中状态**（蓝色）：live
- **完成状态**（紫色）：ended, aet, match_after_penalties
- **最终状态**（绿色）：closed
- **延迟/中断状态**（红色）：delayed, interrupted, suspended, postponed
- **终止状态**（深红色）：cancelled

**关键流转路径**：
```
正常流程：not_started → live → ended → closed
延迟流程：not_started → delayed → not_started → live
中断流程：live → interrupted → suspended → live/postponed
取消流程：任何状态 → cancelled（可能创建新ID）
```

**适用场景**：
- 理解比赛状态的完整生命周期
- 识别可能的状态转换
- 调试状态转换逻辑

---

### 2. AMQP vs API 对比图（Data Source Comparison）
**文件**：`02_amqp_vs_api.png`

这个图表对比了两种数据源中的状态覆盖范围：

**AMQP Feed（左侧）**：
- 仅包含4个核心状态：not_started, live, ended, closed
- 使用整数代码表示（性能优化）
- 实时性最强，延迟<几秒
- 通过odds_change消息推送

**API Endpoint（右侧）**：
- 包含所有12个状态（AMQP的超集）
- 使用字符串表示（便于理解）
- 可能有轻微延迟
- 按需查询

**优先级建议**：
```
✓ AMQP优先（实时性强，延迟<几秒）
  ↓
API补充（覆盖完整，扩展状态）
```

**适用场景**：
- 选择合适的数据源
- 理解两种数据源的优缺点
- 制定数据获取策略

---

### 3. 数据获取流程图（Data Retrieval Flow）
**文件**：`03_data_retrieval_flow.png`

这个流程图展示了如何获取和处理sport_event_status数据：

**主要步骤**：
1. **判断需求**：是否需要实时赔率信息？
2. **选择数据源**：
   - 需要实时赔率 → AMQP Feed
   - 需要扩展信息 → API Endpoint
3. **选择API端点**：
   - Summary：获取汇总信息
   - Timeline：获取历史事件
4. **解析数据**：提取status, home_score, away_score等属性
5. **缓存策略**：
   - not_started：缓存5分钟
   - live/suspended：不缓存，实时查询
   - ended：缓存30分钟
   - closed：缓存24小时
6. **处理显示**：根据状态更新UI

**适用场景**：
- 设计数据获取架构
- 优化API调用频率
- 实现缓存策略

---

### 4. 状态处理决策树（Status Decision Tree）
**文件**：`04_status_decision_tree.png`

这个决策树展示了每种状态下应该采取的处理措施：

**状态分类处理**：

| 状态 | 处理方式 |
|------|---------|
| not_started | 显示计划信息，不处理实时数据 |
| match_about_to_start | 更新倒计时，准备实时接收 |
| delayed | 更新计划时间，继续等待 |
| postponed | 检查推迟时间，>3天创建新ID |
| cancelled | 清除数据，通知用户 |
| abandoned | 记录覆盖丢失，保留数据 |
| live | 实时更新，高频刷新 |
| interrupted | 暂停更新，等待恢复 |
| suspended | 长期中断，等待恢复或推迟 |
| ended | 等待结果确认（或视为最终） |
| aet/match_after_penalties | 标记特殊结束方式，等待closed |
| closed | 锁定结果，存储数据库 |

**适用场景**：
- 编写状态处理逻辑
- 测试各种状态场景
- 处理异常情况

---

### 5. 完整的比赛生命周期图（Match Lifecycle）
**文件**：`05_match_lifecycle.png`

这个图表展示了比赛从创建到完成的完整生命周期：

**生命周期阶段**：

1. **📅 赛事创建阶段**
   - 创建比赛记录
   - 设置计划时间
   - 分配队伍信息
   - 初始状态：not_started

2. **⏰ 赛前阶段**
   - 显示计划时间
   - 处理可能的延迟（delayed）
   - 处理可能的推迟（postponed）
   - 处理可能的取消（cancelled）

3. **🎮 比赛进行阶段**
   - 状态转换为：live
   - 实时更新得分和统计数据
   - 处理中断（interrupted）
   - 处理长期中断（suspended）
   - 处理覆盖丢失（abandoned）

4. **🏁 比赛结束阶段**
   - 状态转换为：ended / aet / match_after_penalties
   - 显示最终得分
   - 检查覆盖范围
   - 等待结果确认

5. **✅ 结果确认阶段**
   - 状态转换为：closed
   - 锁定最终结果
   - 存储数据库
   - 清理临时数据

**适用场景**：
- 理解比赛的完整流程
- 设计系统架构
- 规划数据存储策略

---

### 6. sport_event_status 元素结构图（Element Structure）
**文件**：`06_element_structure.png`

这个图表展示了sport_event_status元素的完整结构：

**属性（Attributes）**：
- `status` ⭐ 必需：比赛当前状态（12种可能值）
- `home_score`：主队得分（整数）
- `away_score`：客队得分（整数）
- `winner_id`：获胜队伍ID（字符串）
- `status_code`：状态的数值代码（整数）
- `match_status_code`：比赛阶段代码（因体育项目而异）

**子元素（Children）**：
- `<period_scores>`：各阶段得分
  - `<period_score>`：单个阶段
    - 属性：home_score, away_score, type, number, match_status_code
    - type可能值：regular_period, overtime, penalty_shootout
    - number含义因体育项目而异

- `<results>`：比赛结果
  - `<result>`：单个结果
    - 属性：home_score, away_score, match_status_code
    - 多个result表示不同阶段结果

**match_status_code 映射**：
- 篮球：13-16（常规期各节）, 40（加时赛）, 110（加时赛后）
- 足球：0（未开始）, 1-2（上下半场）, 3（加时赛）, 4（点球）
- 网球：不同盘数和局数组合

**适用场景**：
- 理解XML结构
- 编写数据解析代码
- 验证API响应

---

## 🎯 使用建议

### 根据场景选择图表

| 场景 | 推荐图表 |
|------|---------|
| 理解状态转换 | 图1、图5 |
| 选择数据源 | 图2、图3 |
| 编写处理逻辑 | 图4 |
| 理解数据结构 | 图6 |
| 系统设计 | 图1、图2、图5 |
| 调试问题 | 图3、图4 |

### 学习路径建议

**初级开发者**：
1. 先看图5（比赛生命周期）- 理解整体流程
2. 再看图1（状态流转）- 理解状态转换
3. 最后看图6（元素结构）- 理解数据结构

**中级开发者**：
1. 看图2（AMQP vs API）- 理解数据源选择
2. 看图3（数据获取流程）- 理解获取策略
3. 看图4（决策树）- 理解处理逻辑

**高级开发者**：
1. 看图2和图3 - 优化数据获取
2. 看图4 - 处理边界情况
3. 结合所有图表 - 设计完整系统

---

## 📝 图表源文件

所有图表的Mermaid源代码都可用，便于修改和扩展：

- `01_state_transition.mmd` - 状态流转图源代码
- `02_amqp_vs_api.mmd` - AMQP vs API对比图源代码
- `03_data_retrieval_flow.mmd` - 数据获取流程图源代码
- `04_status_decision_tree.mmd` - 状态决策树源代码
- `05_match_lifecycle.mmd` - 比赛生命周期图源代码
- `06_element_structure.mmd` - 元素结构图源代码

### 修改图表

如需修改图表，可以：
1. 编辑对应的`.mmd`文件
2. 使用 `manus-render-diagram` 命令重新生成PNG
3. 或在在线Mermaid编辑器中预览和修改

### 在线编辑

访问 https://mermaid.live 可以：
- 实时预览Mermaid代码
- 导出为PNG/SVG
- 分享图表链接

---

## 🎨 图表颜色说明

| 颜色 | 含义 |
|------|------|
| 黄色 (#fff4e6) | 初始状态/赛前阶段 |
| 蓝色 (#e6f3ff) | 进行中状态/实时数据 |
| 紫色 (#f0e6ff) | 完成状态/结果确认 |
| 绿色 (#e6ffe6) | 最终状态/数据锁定 |
| 红色 (#ffe6e6) | 延迟/中断状态 |
| 深红 (#ffcccc) | 终止状态/取消 |

---

## 💡 最佳实践总结

1. **数据获取**：优先使用AMQP Feed，API作为补充
2. **状态处理**：根据决策树处理各种状态
3. **缓存策略**：根据状态设置不同的缓存时间
4. **错误处理**：处理状态不一致和网络异常
5. **性能优化**：批量查询，合理缓存，避免频繁调用

---

*本文档与6个Mermaid图表配套使用，帮助理解Sportradar sport_event_status元素的完整概念体系。*
