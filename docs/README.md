# DocuMind 文档中心

本目录包含 DocuMind 项目的所有文档,包括项目规划、设计文档、标准化规范和模板。

## 📂 目录结构

```
docs/
├── README.md                           # 本文件
├── DELIVERY-SUMMARY-V4.md              # v4 版本交付总结
├── standards/                          # 标准化规范
│   ├── 00-specification-v4.md          # 核心规范文档
│   ├── figma-naming-convention.md      # Figma 命名规范
│   ├── automation-workflow-guide.md    # 自动化工作流指南
│   └── 00-integration-plan.md          # 整合方案说明
├── templates/                          # 文档模板
│   ├── module-template.md              # 模块模板
│   ├── page-template.md                # 页面模板
│   ├── component-template-v4.md        # 组件模板 (v4)
│   └── api-template.md                 # API 模板
├── examples/                           # 示例文档 (待添加)
├── DocuMind_Project_Plan.md            # 项目计划书
├── documind_mvp_revised.md             # MVP 详细设计
├── functional_architecture_revised.png # 功能架构图
└── page_information_architecture_revised.png # 页面信息架构图
```

## 📚 核心文档

### 标准化规范 (v4)

1. **[v4 规范文档](./standards/00-specification-v4.md)**
   - 完整的文档标准和规范
   - Front Matter 元数据定义
   - 文件命名和目录结构规范
   - 文档引用语法
   - 组件文档的标准章节结构

2. **[Figma 命名规范](./standards/figma-naming-convention.md)**
   - 设计师必读的命名规则
   - 四级命名结构: 分类 / 组件 / 变体 / 元素
   - 详细的规则说明和示例

3. **[自动化工作流指南](./standards/automation-workflow-guide.md)**
   - 从 Figma 到文档的自动化流程
   - 四步工作流: 设计 → 提取 → 生成 → 审核
   - JSON 数据结构定义
   - AI 主提示词 (Master Prompt)

4. **[整合方案说明](./standards/00-integration-plan.md)**
   - v3 和 Figma 系统的整合思路
   - 统一组件模板的设计原则
   - 实施计划

5. **[v4 交付总结](./DELIVERY-SUMMARY-V4.md)**
   - 完整的项目交付说明
   - 核心成果和特性
   - 使用方式和最佳实践

### 文档模板

在 `templates/` 目录下提供了四种标准化模板:

1. **[模块模板](./templates/module-template.md)**
   - 用于定义业务功能模块
   - 包含模块概述、包含页面、技术架构等

2. **[页面模板](./templates/page-template.md)**
   - 用于描述用户交互页面
   - 包含用户故事、组件装配、交互协同等

3. **[组件模板 v4](./templates/component-template-v4.md)**
   - 用于定义 UI 组件
   - 支持手动编写和 Figma 自动化生成
   - 包含 9 个标准章节

4. **[API 模板](./templates/api-template.md)**
   - 用于描述后端接口
   - 支持 REST、WebSocket、三方数据源三种类型

### 项目规划文档

1. **[项目计划书](./DocuMind_Project_Plan.md)**
   - 完整的 MVP 项目计划
   - 开发阶段和时间表

2. **[MVP 详细设计](./documind_mvp_revised.md)**
   - MVP 版本的详细功能设计
   - 技术实现方案

3. **[功能架构图](./functional_architecture_revised.png)**
   - 系统功能架构
   - 模块关系图

4. **[页面信息架构图](./page_information_architecture_revised.png)**
   - 页面流程和跳转关系
   - 用户交互路径

## 🚀 快速开始

### 1. 了解文档体系

首先阅读以下文档,了解 DocuMind v4 的完整规范:

1. [v4 规范文档](./standards/00-specification-v4.md) - 核心规范
2. [v4 交付总结](./DELIVERY-SUMMARY-V4.md) - 快速概览

### 2. 选择工作方式

**方式 A: 手动编写文档**
- 选择合适的模板
- 按照规范填写内容
- 遵循命名和格式要求

**方式 B: 从 Figma 自动生成**
- 设计师遵循 [Figma 命名规范](./standards/figma-naming-convention.md)
- 开发者实施 [自动化工作流](./standards/automation-workflow-guide.md)
- 使用 AI 生成文档草稿
- 人工审核和补充

### 3. 创建文档

1. 复制相应的模板文件
2. 填写 Front Matter (YAML 元数据)
3. 按照标准章节结构编写内容
4. 使用 `[@标题](路径)` 语法引用其他文档

## 💡 最佳实践

- **文件命名**: 使用 kebab-case (小写、连字符分隔)
- **Front Matter**: 确保所有必填字段都已填写
- **文档引用**: 使用相对路径,确保链接准确
- **章节结构**: 严格按照规范的顺序组织章节
- **定期更新**: 及时更新 `updatedAt` 字段和变更历史

## 📞 支持

如有任何问题:

1. 查阅 [v4 规范文档](./standards/00-specification-v4.md)
2. 参考 [v4 交付总结](./DELIVERY-SUMMARY-V4.md)
3. 通过 GitHub Issues 联系团队

---

**版本**: 4.0.0  
**最后更新**: 2025-12-08  
**维护者**: Documentation Team
