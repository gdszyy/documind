# 技术规范文档

本目录包含 DocuMind 项目中涉及的各类技术集成规范、API 使用指南和技术实现细节。这些文档主要面向后端开发者、集成工程师和技术架构师。

## 目录结构

```
technical-specs/
├── README.md           # 本文档
└── sportradar/         # Sportradar 数据源集成规范
    ├── 01-uof-realtime-layer.md
    ├── 02-uof-confirmation-layer.md
    └── 03-outcome-mapping-api.md
```

## 文档分类

### Sportradar 集成规范

Sportradar 是领先的体育数据提供商，DocuMind 项目集成了其 Unified Odds Feed (UOF) 数据源。以下文档详细描述了 UOF 的消息处理机制和 API 使用规范。

| 文档 | 描述 | 目标读者 |
|------|------|---------|
| [01-uof-realtime-layer.md](./sportradar/01-uof-realtime-layer.md) | Sportradar UOF 实时层消息处理规范，包括 odds_change 等高频消息的处理逻辑 | 后端开发者、集成工程师 |
| [02-uof-confirmation-layer.md](./sportradar/02-uof-confirmation-layer.md) | Sportradar UOF 确认层消息处理规范，包括 bet_settlement 等官方结算消息的处理逻辑 | 后端开发者、集成工程师 |
| [03-outcome-mapping-api.md](./sportradar/03-outcome-mapping-api.md) | Sportradar Market Descriptions 和 Variant Market Descriptions API 的使用规范 | 后端开发者、集成工程师 |

## 阅读建议

1. **新成员入门**：建议按照文档编号顺序阅读 Sportradar 相关文档，先了解实时层，再学习确认层，最后掌握 API 使用
2. **问题排查**：遇到数据处理问题时，可根据消息类型快速定位到对应的规范文档
3. **集成开发**：在开发新的数据源集成时，可参考 Sportradar 的文档结构和规范编写方式

## 与其他文档的关系

- **[docs/standards](../standards/README.md)**: 文档体系规范，定义如何编写和组织产品文档
- **[docs/templates](../templates/)**: 文档模板，提供标准化的文档结构
- **[docs/planning](../planning/)**: 项目规划文档，包含项目计划和架构设计
- **[docs/research](../research/)**: 研究和分析文档，包含技术可行性研究和案例分析

## 贡献指南

添加新的技术规范文档时，请遵循以下原则：

1. **按技术栈或数据源分组**：为每个主要的技术栈或数据源创建独立的子目录
2. **使用编号前缀**：在子目录内使用两位数字前缀（01-, 02-...）表示推荐的阅读顺序
3. **包含 Front Matter**：技术规范文档应包含 YAML Front Matter，定义标题、类别、版本等元数据
4. **更新本索引**：添加新文档后，请及时更新本 README 文档

---

**最后更新**: 2025-12-08
