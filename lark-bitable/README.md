# Lark Bitable（飞书多维表格）集成项目

本项目包含DocuMind与飞书多维表格集成的完整文档和工具。

---

## 📚 文档列表

### 1. [AGENT_BITABLE_OPERATIONS_GUIDE.md](./AGENT_BITABLE_OPERATIONS_GUIDE.md)
**Agent操作飞书多维表格完整指南**

最重要的文档，包含：
- ✓ 完整的配置信息（App ID、App Secret、多维表格地址）
- ✓ 所有表格ID映射
- ✓ 完整的BitableAgent工具类（开箱即用）
- ✓ 表格、字段、记录的所有操作方法
- ✓ 5个实用示例
- ✓ 6个常见问题解决方案
- ✓ 5个最佳实践

**推荐**: 新手直接看这个文档即可快速上手。

### 2. [FEISHU_BITABLE_COMPLETE_GUIDE.md](./FEISHU_BITABLE_COMPLETE_GUIDE.md)
**飞书Bitable API完整汇总文档**

深入的技术文档，包含：
- ✓ 快速开始指南
- ✓ 鉴权方式详解（tenant_access_token vs user_access_token）
- ✓ 所有API端点详细说明
- ✓ 23种字段类型详细说明
- ✓ 7个常用操作代码示例
- ✓ Python客户端库
- ✓ 6个使用场景
- ✓ 错误处理和常见问题
- ✓ 403错误详细分析

**推荐**: 需要深入了解API细节时查阅。

### 3. [BITABLE_CREATION_REPORT.md](./BITABLE_CREATION_REPORT.md)
**飞书多维表格创建报告**

记录了多维表格的创建过程：
- ✓ 11张表格的创建状态
- ✓ 81个字段的创建详情
- ✓ 问题分析和解决方案
- ✓ 下一步建议

**推荐**: 了解当前多维表格的状态和待完成工作。

---

## 📊 数据文件

### 1. [existing_tables.json](./existing_tables.json)
所有表格的名称和ID映射

```json
{
  "字段映射": "tblZg3MWMYbqL88v",
  "模块": "tblCluOOEYysDthp",
  "服务": "tbl8h8thBybIWAGe",
  ...
}
```

### 2. [table_verification_report.json](./table_verification_report.json)
详细的表格验证报告，包含每张表的字段列表

### 3. [bitable_schema.json](./bitable_schema.json)
从模板解析的完整表格和字段定义

---

## 🚀 快速开始

### 1. 安装依赖

```bash
pip install requests
```

### 2. 使用BitableAgent

```python
from bitable_agent import BitableAgent

# 初始化
agent = BitableAgent(
    app_id="cli_a98e2f05eff89e1a",
    app_secret="P8RRCqQlzw587orCUowX5dt37WQI7CZI",
    app_token="OmjCbxMsqapRmqsIM4zjrce9pnf"
)

# 列出所有表格
tables = agent.list_tables()
for table in tables:
    print(f"{table['name']}: {table['table_id']}")

# 创建记录
service_table_id = agent.get_table_id_by_name("服务")
record_id = agent.create_record(service_table_id, {
    "服务名称": "测试服务",
    "服务标识": "test-service",
    "服务描述": "这是一个测试服务"
})
```

### 3. 查看完整示例

参考 [AGENT_BITABLE_OPERATIONS_GUIDE.md](./AGENT_BITABLE_OPERATIONS_GUIDE.md) 中的使用示例部分。

---

## 🔧 配置信息

### 应用凭证

| 配置项 | 值 |
|-------|---|
| App ID | `cli_a98e2f05eff89e1a` |
| App Secret | `P8RRCqQlzw587orCUowX5dt37WQI7CZI` |

### 多维表格

| 配置项 | 值 |
|-------|---|
| 访问地址 | https://bjp4wig57p2m.jp.larksuite.com/base/OmjCbxMsqapRmqsIM4zjrce9pnf |
| App Token | `OmjCbxMsqapRmqsIM4zjrce9pnf` |

### 表格列表

| 表格名称 | 表格ID | 字段数 | 状态 |
|---------|--------|--------|------|
| 字段映射 | `tblZg3MWMYbqL88v` | 15 | ✓ 完整 |
| 模块 | `tblCluOOEYysDthp` | 11 | ✓ 完整 |
| 服务 | `tbl8h8thBybIWAGe` | 13 | ✓ 完整 |
| API | `tblnRu6Xb9BLJMPr` | 15 | ✓ 完整 |
| 数据模型 | `tblsJu3CmFGoIeP1` | 12 | ✓ 完整 |
| 页面 | `tbl7Uvily9MeSUYd` | 8 | ⚠ 部分 |
| 组件 | `tbl4RJEl0BlLHQAX` | 1 | ⚠ 部分 |
| 引用记录 | `tblHODLjkNuyX7xt` | 1 | ⚠ 部分 |
| 需求池 | `tblL1qU6r3uIDoka` | 1 | ⚠ 部分 |
| 迭代 | `tblYeTM5idiWSqnD` | 1 | ⚠ 部分 |
| 标签 | `tblR1rdM99wjIBRX` | 1 | ⚠ 部分 |

---

## 📖 使用场景

### 场景1: 同步服务信息到多维表格

```python
# 从代码库扫描服务
services = scan_services_from_code()

# 批量同步到多维表格
service_table_id = agent.get_table_id_by_name("服务")
agent.batch_create_records(service_table_id, services)
```

### 场景2: 从多维表格读取配置

```python
# 读取字段映射配置
mapping_table_id = agent.get_table_id_by_name("字段映射")
mappings = agent.list_records(mapping_table_id)

# 构建映射字典
field_map = {}
for record in mappings:
    fields = record.get("fields", {})
    field_map[fields.get("逻辑字段名")] = fields.get("实际字段名")
```

### 场景3: 更新需求状态

```python
# 查询需求
requirement_table_id = agent.get_table_id_by_name("需求池")
records = agent.list_records(requirement_table_id)

# 更新状态
for record in records:
    if record["fields"].get("需求编号") == "REQ-001":
        agent.update_record(
            requirement_table_id,
            record["record_id"],
            {"状态": "已完成", "完成时间": "2025-12-08"}
        )
```

---

## ⚠️ 注意事项

### 1. 权限配置

确保应用已被添加为多维表格的协作者：
1. 打开多维表格
2. 点击右上角"..."菜单
3. 选择"协作者管理"
4. 添加应用 `cli_a98e2f05eff89e1a`
5. 设置权限为"编辑"

### 2. API限流

- 单次批量操作最多500条记录
- 建议在批量操作间添加延迟（0.5秒）
- 使用BitableAgent自动管理token刷新

### 3. 字段类型

- 关联字段需要指定目标表ID
- 单选/多选字段需要配置选项
- 公式字段只读，不能直接写入

---

## 🔗 相关链接

- [飞书开放平台](https://open.larksuite.com)
- [Bitable API文档](https://open.larksuite.com/document/server-docs/docs/bitable-v1/bitable-overview)
- [多维表格访问地址](https://bjp4wig57p2m.jp.larksuite.com/base/OmjCbxMsqapRmqsIM4zjrce9pnf)

---

## 📝 更新日志

### 2025-12-08
- ✓ 创建11张核心表格
- ✓ 创建81个字段
- ✓ 完成核心文档编写
- ✓ 创建BitableAgent工具类
- ✓ 同步到Git仓库

---

## 🤝 贡献

如有问题或建议，请提交Issue或Pull Request。

---

**项目维护**: DocuMind Team  
**最后更新**: 2025-12-08
