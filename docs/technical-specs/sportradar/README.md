# Sportradar UOF 技术集成文档

本目录收录了与 Sportradar Unified Odds Feed (UOF) 服务集成的相关技术规范、分析报告、API 指南和参考资料。所有文档均旨在为开发人员提供清晰、准确的集成指导，确保数据处理的稳定性和一致性。

---

## 文档索引

为了方便查阅，所有文档已根据其内容和用途进行了分类和规范化命名。下表提供了所有文档的完整索引：

### 核心技术规范

这些文档构成了 UOF 集成的核心技术框架，详细定义了消息处理、API 调用和状态管理的各项规范。

| 序号 | 文件名                                     | 标题                                         |
| :--- | :----------------------------------------- | :------------------------------------------- |
| 01   | `01-uof-realtime-layer.md`                 | UOF 实时层消息处理规范                       |
| 02   | `02-uof-confirmation-layer.md`             | UOF 确认层消息处理规范                       |
| 03   | `03-outcome-mapping-api.md`                | Outcome Mapping API 规范                     |
| 04   | `04-odds-change-market-mapping.md`         | Odds Change 的市场映射与处理分析             |
| 05   | `05-market-handling-verification.md`       | 市场处理方法与官方文档对比验证               |
| 06   | `06-message-processing-market-state.md`    | 消息处理与 Market 状态流转分析               |
| 07   | `07-sport-event-status-guide.md`           | `<sport_event_status>` 元素完整指南          |
| 08   | `08-event-status-diagrams.md`              | `sport_event_status` Mermaid 图表集合        |

### 参考文档

这些文档提供了对特定市场类型或功能的技术参考，用于辅助开发。

| 前缀 | 文件名                           | 标题                                         |
| :--- | :------------------------------- | :------------------------------------------- |
| ref  | `ref-variant-player-markets.md`    | Variant 和 Player Markets 官方文档参考       |

### 指南文档

这些文档为特定任务或流程提供操作指导。

| 前缀  | 文件名                      | 标题                                         |
| :---- | :-------------------------- | :------------------------------------------- |
| guide | `guide-diagram-placement.md`  | 图表在文档中的放置指南                       |
