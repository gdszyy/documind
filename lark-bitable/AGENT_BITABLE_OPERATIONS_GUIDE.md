# Agent操作飞书多维表格完整指南

本文档提供Agent操作飞书多维表格的完整方案，包括配置、认证、所有操作的代码示例。

---

## 目录

1. [快速开始](#快速开始)
2. [配置信息](#配置信息)
3. [认证方式](#认证方式)
4. [表格操作](#表格操作)
5. [字段操作](#字段操作)
6. [记录操作](#记录操作)
7. [完整工具类](#完整工具类)
8. [使用示例](#使用示例)
9. [常见问题](#常见问题)

---

## 快速开始

### 1. 安装依赖

```bash
pip install requests
```

### 2. 配置信息

```python
# 应用凭证
APP_ID = "cli_a98e2f05eff89e1a"
APP_SECRET = "P8RRCqQlzw587orCUowX5dt37WQI7CZI"

# 多维表格
BITABLE_URL = "https://bjp4wig57p2m.jp.larksuite.com/base/OmjCbxMsqapRmqsIM4zjrce9pnf"
APP_TOKEN = "OmjCbxMsqapRmqsIM4zjrce9pnf"  # 从URL中提取

# API基础地址
BASE_URL = "https://open.larksuite.com/open-apis"
```

### 3. 快速示例

```python
import requests

# 获取访问凭证
def get_token():
    url = f"{BASE_URL}/auth/v3/tenant_access_token/internal"
    response = requests.post(url, json={
        "app_id": APP_ID,
        "app_secret": APP_SECRET
    })
    return response.json().get("tenant_access_token")

# 列出所有表格
def list_tables():
    token = get_token()
    url = f"{BASE_URL}/bitable/v1/apps/{APP_TOKEN}/tables"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(url, headers=headers)
    return response.json()

# 执行
result = list_tables()
print(result)
```

---

## 配置信息

### 应用信息

| 配置项 | 值 | 说明 |
|-------|---|------|
| App ID | `cli_a98e2f05eff89e1a` | 应用唯一标识 |
| App Secret | `P8RRCqQlzw587orCUowX5dt37WQI7CZI` | 应用密钥 |

### 多维表格信息

| 配置项 | 值 | 说明 |
|-------|---|------|
| 多维表格URL | `https://bjp4wig57p2m.jp.larksuite.com/base/OmjCbxMsqapRmqsIM4zjrce9pnf` | 浏览器访问地址 |
| App Token | `OmjCbxMsqapRmqsIM4zjrce9pnf` | 从URL中提取 |

### 表格ID映射

| 表格名称 | 表格ID |
|---------|--------|
| 字段映射 | `tblZg3MWMYbqL88v` |
| 模块 | `tblCluOOEYysDthp` |
| 服务 | `tbl8h8thBybIWAGe` |
| API | `tblnRu6Xb9BLJMPr` |
| 数据模型 | `tblsJu3CmFGoIeP1` |
| 页面 | `tbl7Uvily9MeSUYd` |
| 组件 | `tbl4RJEl0BlLHQAX` |
| 引用记录 | `tblHODLjkNuyX7xt` |
| 需求池 | `tblL1qU6r3uIDoka` |
| 迭代 | `tblYeTM5idiWSqnD` |
| 标签 | `tblR1rdM99wjIBRX` |

### API端点

| 操作 | 端点 |
|-----|-----|
| 获取token | `POST /auth/v3/tenant_access_token/internal` |
| 列出表格 | `GET /bitable/v1/apps/{app_token}/tables` |
| 创建表格 | `POST /bitable/v1/apps/{app_token}/tables` |
| 列出字段 | `GET /bitable/v1/apps/{app_token}/tables/{table_id}/fields` |
| 创建字段 | `POST /bitable/v1/apps/{app_token}/tables/{table_id}/fields` |
| 列出记录 | `GET /bitable/v1/apps/{app_token}/tables/{table_id}/records` |
| 创建记录 | `POST /bitable/v1/apps/{app_token}/tables/{table_id}/records` |
| 更新记录 | `PUT /bitable/v1/apps/{app_token}/tables/{table_id}/records/{record_id}` |
| 删除记录 | `DELETE /bitable/v1/apps/{app_token}/tables/{table_id}/records/{record_id}` |
| 批量创建 | `POST /bitable/v1/apps/{app_token}/tables/{table_id}/records/batch_create` |
| 批量更新 | `POST /bitable/v1/apps/{app_token}/tables/{table_id}/records/batch_update` |
| 批量删除 | `POST /bitable/v1/apps/{app_token}/tables/{table_id}/records/batch_delete` |

---

## 认证方式

### tenant_access_token（推荐）

**适用场景**: Agent自动化操作

**优点**:
- ✓ 无需用户授权
- ✓ 长期有效（2小时）
- ✓ 适合后台任务

**缺点**:
- ✗ 需要将应用添加为多维表格的协作者
- ✗ 权限范围受应用权限限制

**获取方式**:

```python
def get_tenant_token(app_id, app_secret):
    """获取tenant_access_token"""
    url = "https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal"
    payload = {
        "app_id": app_id,
        "app_secret": app_secret
    }
    
    response = requests.post(url, json=payload)
    data = response.json()
    
    if data.get("code") == 0:
        return data.get("tenant_access_token")
    else:
        raise Exception(f"获取token失败: {data.get('msg')}")

# 使用
token = get_tenant_token(
    "cli_a98e2f05eff89e1a",
    "P8RRCqQlzw587orCUowX5dt37WQI7CZI"
)
```

### user_access_token（备选）

**适用场景**: 需要用户权限的操作

**优点**:
- ✓ 拥有用户的完整权限
- ✓ 无需配置应用协作者

**缺点**:
- ✗ 需要用户OAuth授权
- ✗ 有效期较短
- ✗ 不适合自动化

---

## 表格操作

### 1. 列出所有表格

```python
def list_tables(token, app_token):
    """列出多维表格中的所有表格"""
    url = f"https://open.larksuite.com/open-apis/bitable/v1/apps/{app_token}/tables"
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(url, headers=headers)
    data = response.json()
    
    if data.get("code") == 0:
        return data.get("data", {}).get("items", [])
    else:
        raise Exception(f"列出表格失败: {data.get('msg')}")

# 使用
tables = list_tables(token, "OmjCbxMsqapRmqsIM4zjrce9pnf")
for table in tables:
    print(f"{table['name']}: {table['table_id']}")
```

### 2. 创建表格

```python
def create_table(token, app_token, table_name):
    """创建新表格"""
    url = f"https://open.larksuite.com/open-apis/bitable/v1/apps/{app_token}/tables"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {
        "table": {
            "name": table_name
        }
    }
    
    response = requests.post(url, headers=headers, json=payload)
    data = response.json()
    
    if data.get("code") == 0:
        return data.get("data", {}).get("table_id")
    else:
        raise Exception(f"创建表格失败: {data.get('msg')}")

# 使用
table_id = create_table(token, "OmjCbxMsqapRmqsIM4zjrce9pnf", "新表格")
print(f"创建成功，表格ID: {table_id}")
```

### 3. 获取表格信息

```python
def get_table_info(token, app_token, table_id):
    """获取表格详细信息"""
    url = f"https://open.larksuite.com/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}"
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(url, headers=headers)
    data = response.json()
    
    if data.get("code") == 0:
        return data.get("data")
    else:
        raise Exception(f"获取表格信息失败: {data.get('msg')}")
```

---

## 字段操作

### 字段类型映射

| 飞书字段类型 | Type值 | 说明 |
|------------|--------|------|
| 单行文本 | 1 | 基础文本 |
| 数字 | 2 | 整数/浮点数 |
| 单选 | 3 | 从选项中选一个 |
| 多选 | 4 | 从选项中选多个 |
| 日期 | 5 | 日期时间 |
| 复选框 | 7 | 布尔值 |
| 人员 | 11 | 用户选择 |
| 电话号码 | 13 | 电话格式 |
| 超链接 | 15 | URL |
| 附件 | 17 | 文件 |
| 关联 | 18 | 关联其他表格 |
| 公式 | 20 | 自动计算 |
| 创建时间 | 1001 | 自动生成 |
| 最后编辑时间 | 1002 | 自动更新 |
| 创建人 | 1003 | 自动生成 |
| 修改人 | 1004 | 自动更新 |
| 自动编号 | 1005 | 自动递增 |

### 1. 列出字段

```python
def list_fields(token, app_token, table_id):
    """列出表格的所有字段"""
    url = f"https://open.larksuite.com/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/fields"
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(url, headers=headers)
    data = response.json()
    
    if data.get("code") == 0:
        return data.get("data", {}).get("items", [])
    else:
        raise Exception(f"列出字段失败: {data.get('msg')}")

# 使用
fields = list_fields(token, "OmjCbxMsqapRmqsIM4zjrce9pnf", "tbl8h8thBybIWAGe")
for field in fields:
    print(f"{field['field_name']}: {field['field_id']} (类型: {field['type']})")
```

### 2. 创建字段

```python
def create_field(token, app_token, table_id, field_name, field_type):
    """创建新字段"""
    url = f"https://open.larksuite.com/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/fields"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {
        "field_name": field_name,
        "type": field_type
    }
    
    response = requests.post(url, headers=headers, json=payload)
    data = response.json()
    
    if data.get("code") == 0:
        return data.get("data", {}).get("field_id")
    else:
        raise Exception(f"创建字段失败: {data.get('msg')}")

# 使用
field_id = create_field(
    token,
    "OmjCbxMsqapRmqsIM4zjrce9pnf",
    "tbl8h8thBybIWAGe",
    "测试字段",
    1  # 单行文本
)
print(f"创建成功，字段ID: {field_id}")
```

### 3. 创建单选字段（带选项）

```python
def create_select_field(token, app_token, table_id, field_name, options):
    """创建单选字段"""
    url = f"https://open.larksuite.com/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/fields"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {
        "field_name": field_name,
        "type": 3,  # 单选
        "property": {
            "options": [{"name": opt} for opt in options]
        }
    }
    
    response = requests.post(url, headers=headers, json=payload)
    data = response.json()
    
    if data.get("code") == 0:
        return data.get("data", {}).get("field_id")
    else:
        raise Exception(f"创建单选字段失败: {data.get('msg')}")

# 使用
field_id = create_select_field(
    token,
    "OmjCbxMsqapRmqsIM4zjrce9pnf",
    "tbl8h8thBybIWAGe",
    "状态",
    ["设计中", "开发中", "测试中", "已上线", "已废弃"]
)
```

### 4. 创建关联字段

```python
def create_link_field(token, app_token, table_id, field_name, target_table_id):
    """创建关联字段"""
    url = f"https://open.larksuite.com/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/fields"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {
        "field_name": field_name,
        "type": 18,  # 关联
        "property": {
            "table_id": target_table_id,
            "multiple": True  # 是否允许多选
        }
    }
    
    response = requests.post(url, headers=headers, json=payload)
    data = response.json()
    
    if data.get("code") == 0:
        return data.get("data", {}).get("field_id")
    else:
        raise Exception(f"创建关联字段失败: {data.get('msg')}")

# 使用
field_id = create_link_field(
    token,
    "OmjCbxMsqapRmqsIM4zjrce9pnf",
    "tblCluOOEYysDthp",  # 模块表
    "包含服务",
    "tbl8h8thBybIWAGe"   # 服务表
)
```

---

## 记录操作

### 1. 列出记录

```python
def list_records(token, app_token, table_id, page_size=100):
    """列出表格的所有记录"""
    url = f"https://open.larksuite.com/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records"
    headers = {"Authorization": f"Bearer {token}"}
    params = {"page_size": page_size}
    
    response = requests.get(url, headers=headers, params=params)
    data = response.json()
    
    if data.get("code") == 0:
        return data.get("data", {}).get("items", [])
    else:
        raise Exception(f"列出记录失败: {data.get('msg')}")

# 使用
records = list_records(token, "OmjCbxMsqapRmqsIM4zjrce9pnf", "tbl8h8thBybIWAGe")
for record in records:
    print(f"记录ID: {record['record_id']}")
    print(f"字段: {record['fields']}")
```

### 2. 创建记录

```python
def create_record(token, app_token, table_id, fields):
    """创建新记录"""
    url = f"https://open.larksuite.com/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {"fields": fields}
    
    response = requests.post(url, headers=headers, json=payload)
    data = response.json()
    
    if data.get("code") == 0:
        return data.get("data", {}).get("record", {}).get("record_id")
    else:
        raise Exception(f"创建记录失败: {data.get('msg')} (代码: {data.get('code')})")

# 使用
record_id = create_record(
    token,
    "OmjCbxMsqapRmqsIM4zjrce9pnf",
    "tbl8h8thBybIWAGe",
    {
        "服务名称": "测试服务",
        "服务标识": "test-service",
        "服务描述": "这是一个测试服务"
    }
)
print(f"创建成功，记录ID: {record_id}")
```

### 3. 更新记录

```python
def update_record(token, app_token, table_id, record_id, fields):
    """更新记录"""
    url = f"https://open.larksuite.com/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records/{record_id}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {"fields": fields}
    
    response = requests.put(url, headers=headers, json=payload)
    data = response.json()
    
    if data.get("code") == 0:
        return True
    else:
        raise Exception(f"更新记录失败: {data.get('msg')}")

# 使用
update_record(
    token,
    "OmjCbxMsqapRmqsIM4zjrce9pnf",
    "tbl8h8thBybIWAGe",
    "recXXXXXXX",
    {
        "服务名称": "更新后的服务名称",
        "状态": "开发中"
    }
)
```

### 4. 删除记录

```python
def delete_record(token, app_token, table_id, record_id):
    """删除记录"""
    url = f"https://open.larksuite.com/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records/{record_id}"
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.delete(url, headers=headers)
    data = response.json()
    
    if data.get("code") == 0:
        return True
    else:
        raise Exception(f"删除记录失败: {data.get('msg')}")

# 使用
delete_record(
    token,
    "OmjCbxMsqapRmqsIM4zjrce9pnf",
    "tbl8h8thBybIWAGe",
    "recXXXXXXX"
)
```

### 5. 批量创建记录

```python
def batch_create_records(token, app_token, table_id, records):
    """批量创建记录"""
    url = f"https://open.larksuite.com/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records/batch_create"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {
        "records": [{"fields": record} for record in records]
    }
    
    response = requests.post(url, headers=headers, json=payload)
    data = response.json()
    
    if data.get("code") == 0:
        return data.get("data", {}).get("records", [])
    else:
        raise Exception(f"批量创建记录失败: {data.get('msg')}")

# 使用
created_records = batch_create_records(
    token,
    "OmjCbxMsqapRmqsIM4zjrce9pnf",
    "tbl8h8thBybIWAGe",
    [
        {"服务名称": "服务1", "服务标识": "service-1"},
        {"服务名称": "服务2", "服务标识": "service-2"},
        {"服务名称": "服务3", "服务标识": "service-3"}
    ]
)
print(f"批量创建成功，共 {len(created_records)} 条记录")
```

---

## 完整工具类

```python
#!/usr/bin/env python3
"""
飞书多维表格操作工具类
"""

import requests
import time
from typing import List, Dict, Any, Optional

class BitableAgent:
    """飞书多维表格Agent"""
    
    def __init__(self, app_id: str, app_secret: str, app_token: str):
        """
        初始化
        
        Args:
            app_id: 应用ID
            app_secret: 应用密钥
            app_token: 多维表格Token（从URL中提取）
        """
        self.app_id = app_id
        self.app_secret = app_secret
        self.app_token = app_token
        self.base_url = "https://open.larksuite.com/open-apis"
        self._token = None
        self._token_expire_time = 0
    
    def get_token(self) -> str:
        """获取访问凭证（自动缓存）"""
        current_time = time.time()
        
        # 如果token还有效，直接返回
        if self._token and current_time < self._token_expire_time:
            return self._token
        
        # 获取新token
        url = f"{self.base_url}/auth/v3/tenant_access_token/internal"
        response = requests.post(url, json={
            "app_id": self.app_id,
            "app_secret": self.app_secret
        })
        data = response.json()
        
        if data.get("code") == 0:
            self._token = data.get("tenant_access_token")
            # token有效期2小时，提前5分钟刷新
            self._token_expire_time = current_time + 7200 - 300
            return self._token
        else:
            raise Exception(f"获取token失败: {data.get('msg')}")
    
    def _request(self, method: str, endpoint: str, **kwargs) -> Dict:
        """统一请求方法"""
        token = self.get_token()
        headers = kwargs.pop("headers", {})
        headers["Authorization"] = f"Bearer {token}"
        
        url = f"{self.base_url}{endpoint}"
        response = requests.request(method, url, headers=headers, **kwargs)
        data = response.json()
        
        if data.get("code") == 0:
            return data.get("data", {})
        else:
            raise Exception(f"请求失败: {data.get('msg')} (代码: {data.get('code')})")
    
    # ========== 表格操作 ==========
    
    def list_tables(self) -> List[Dict]:
        """列出所有表格"""
        endpoint = f"/bitable/v1/apps/{self.app_token}/tables"
        data = self._request("GET", endpoint)
        return data.get("items", [])
    
    def create_table(self, table_name: str) -> str:
        """创建表格"""
        endpoint = f"/bitable/v1/apps/{self.app_token}/tables"
        data = self._request("POST", endpoint, json={
            "table": {"name": table_name}
        })
        return data.get("table_id")
    
    # ========== 字段操作 ==========
    
    def list_fields(self, table_id: str) -> List[Dict]:
        """列出字段"""
        endpoint = f"/bitable/v1/apps/{self.app_token}/tables/{table_id}/fields"
        data = self._request("GET", endpoint)
        return data.get("items", [])
    
    def create_field(self, table_id: str, field_name: str, field_type: int, **kwargs) -> str:
        """创建字段"""
        endpoint = f"/bitable/v1/apps/{self.app_token}/tables/{table_id}/fields"
        payload = {
            "field_name": field_name,
            "type": field_type
        }
        if kwargs:
            payload["property"] = kwargs
        
        data = self._request("POST", endpoint, json=payload)
        return data.get("field_id")
    
    # ========== 记录操作 ==========
    
    def list_records(self, table_id: str, page_size: int = 100) -> List[Dict]:
        """列出记录"""
        endpoint = f"/bitable/v1/apps/{self.app_token}/tables/{table_id}/records"
        data = self._request("GET", endpoint, params={"page_size": page_size})
        return data.get("items", [])
    
    def create_record(self, table_id: str, fields: Dict) -> str:
        """创建记录"""
        endpoint = f"/bitable/v1/apps/{self.app_token}/tables/{table_id}/records"
        data = self._request("POST", endpoint, json={"fields": fields})
        return data.get("record", {}).get("record_id")
    
    def update_record(self, table_id: str, record_id: str, fields: Dict) -> bool:
        """更新记录"""
        endpoint = f"/bitable/v1/apps/{self.app_token}/tables/{table_id}/records/{record_id}"
        self._request("PUT", endpoint, json={"fields": fields})
        return True
    
    def delete_record(self, table_id: str, record_id: str) -> bool:
        """删除记录"""
        endpoint = f"/bitable/v1/apps/{self.app_token}/tables/{table_id}/records/{record_id}"
        self._request("DELETE", endpoint)
        return True
    
    def batch_create_records(self, table_id: str, records: List[Dict]) -> List[Dict]:
        """批量创建记录"""
        endpoint = f"/bitable/v1/apps/{self.app_token}/tables/{table_id}/records/batch_create"
        payload = {"records": [{"fields": record} for record in records]}
        data = self._request("POST", endpoint, json=payload)
        return data.get("records", [])
    
    # ========== 便捷方法 ==========
    
    def get_table_id_by_name(self, table_name: str) -> Optional[str]:
        """根据表格名称获取ID"""
        tables = self.list_tables()
        for table in tables:
            if table.get("name") == table_name:
                return table.get("table_id")
        return None
    
    def get_field_id_by_name(self, table_id: str, field_name: str) -> Optional[str]:
        """根据字段名称获取ID"""
        fields = self.list_fields(table_id)
        for field in fields:
            if field.get("field_name") == field_name:
                return field.get("field_id")
        return None
    
    def print_table_structure(self, table_id: str):
        """打印表格结构"""
        fields = self.list_fields(table_id)
        print(f"表格字段 ({len(fields)}个):")
        for field in fields:
            print(f"  - {field['field_name']} (ID: {field['field_id']}, 类型: {field['type']})")
```

---

## 使用示例

### 示例1: 初始化并列出所有表格

```python
# 初始化Agent
agent = BitableAgent(
    app_id="cli_a98e2f05eff89e1a",
    app_secret="P8RRCqQlzw587orCUowX5dt37WQI7CZI",
    app_token="OmjCbxMsqapRmqsIM4zjrce9pnf"
)

# 列出所有表格
tables = agent.list_tables()
for table in tables:
    print(f"{table['name']}: {table['table_id']}")
```

### 示例2: 创建服务记录

```python
# 获取服务表ID
service_table_id = agent.get_table_id_by_name("服务")

# 创建服务记录
record_id = agent.create_record(service_table_id, {
    "服务名称": "用户认证服务",
    "服务标识": "user-auth-service",
    "服务描述": "负责用户登录、注册、Token验证",
    "服务类型": "业务逻辑",
    "状态": "开发中"
})

print(f"创建成功，记录ID: {record_id}")
```

### 示例3: 批量导入数据

```python
# 准备数据
services = [
    {
        "服务名称": "用户管理服务",
        "服务标识": "user-management-service",
        "服务描述": "管理用户信息"
    },
    {
        "服务名称": "订单服务",
        "服务标识": "order-service",
        "服务描述": "处理订单相关业务"
    },
    {
        "服务名称": "支付服务",
        "服务标识": "payment-service",
        "服务描述": "处理支付相关业务"
    }
]

# 批量创建
service_table_id = agent.get_table_id_by_name("服务")
created = agent.batch_create_records(service_table_id, services)
print(f"批量创建成功，共 {len(created)} 条记录")
```

### 示例4: 查询并更新记录

```python
# 获取所有服务记录
service_table_id = agent.get_table_id_by_name("服务")
records = agent.list_records(service_table_id)

# 找到需要更新的记录
for record in records:
    fields = record.get("fields", {})
    if fields.get("服务标识") == "user-auth-service":
        # 更新状态
        agent.update_record(
            service_table_id,
            record["record_id"],
            {"状态": "已上线"}
        )
        print(f"更新成功: {fields.get('服务名称')}")
        break
```

### 示例5: 打印表格结构

```python
# 打印服务表的结构
service_table_id = agent.get_table_id_by_name("服务")
agent.print_table_structure(service_table_id)

# 输出:
# 表格字段 (13个):
#   - 多行文本 (ID: fldXXX, 类型: 1)
#   - 服务名称 (ID: fldYYY, 类型: 1)
#   - 服务标识 (ID: fldZZZ, 类型: 1)
#   ...
```

---

## 常见问题

### Q1: 403 Forbidden错误

**问题**: 调用API时返回403错误

**原因**: 应用没有被添加为多维表格的协作者

**解决方案**:
1. 打开多维表格
2. 点击右上角"..."菜单
3. 选择"协作者管理"
4. 添加应用 `cli_a98e2f05eff89e1a` 为协作者
5. 设置权限为"编辑"

### Q2: FieldNameDuplicated错误

**问题**: 创建字段时返回字段名重复错误

**原因**: 字段已存在

**解决方案**:
```python
# 先检查字段是否存在
field_id = agent.get_field_id_by_name(table_id, "字段名称")
if field_id:
    print("字段已存在")
else:
    # 创建新字段
    agent.create_field(table_id, "字段名称", 1)
```

### Q3: LinkFieldPropertyError错误

**问题**: 创建关联字段时返回错误

**原因**: 未提供目标表格ID

**解决方案**:
```python
# 创建关联字段时必须指定目标表ID
agent.create_field(
    table_id,
    "关联字段",
    18,  # 关联类型
    table_id="目标表格ID",
    multiple=True
)
```

### Q4: Token过期问题

**问题**: Token过期导致请求失败

**解决方案**: 使用BitableAgent类，它会自动管理token刷新

```python
# BitableAgent会自动刷新token
agent = BitableAgent(app_id, app_secret, app_token)

# 无需手动管理token
agent.list_tables()  # 自动使用有效token
```

### Q5: 如何获取App Token

**方法1**: 从URL中提取

```
URL: https://bjp4wig57p2m.jp.larksuite.com/base/OmjCbxMsqapRmqsIM4zjrce9pnf
                                                    ^^^^^^^^^^^^^^^^^^^^^^^^
                                                    这就是App Token
```

**方法2**: 使用API查询（需要Wiki Token）

```python
# 如果是Wiki中的多维表格
wiki_token = "HN19wu4xhi34OtkyQKpjIRe1pDg"
url = f"https://open.larksuite.com/open-apis/wiki/v2/spaces/get_node?token={wiki_token}"
# 从返回的obj_token中获取
```

### Q6: 批量操作的限制

**限制**:
- 批量创建: 最多500条/次
- 批量更新: 最多500条/次
- 批量删除: 最多500条/次

**解决方案**: 分批处理

```python
def batch_create_large(agent, table_id, records, batch_size=500):
    """分批创建大量记录"""
    results = []
    for i in range(0, len(records), batch_size):
        batch = records[i:i+batch_size]
        created = agent.batch_create_records(table_id, batch)
        results.extend(created)
        time.sleep(0.5)  # 避免请求过快
    return results
```

---

## 最佳实践

### 1. 错误处理

```python
try:
    record_id = agent.create_record(table_id, fields)
    print(f"创建成功: {record_id}")
except Exception as e:
    print(f"创建失败: {e}")
    # 记录日志或重试
```

### 2. 批量操作

```python
# 推荐: 使用批量API
agent.batch_create_records(table_id, records)

# 不推荐: 循环调用单条API
for record in records:
    agent.create_record(table_id, record)  # 慢且容易触发限流
```

### 3. Token缓存

```python
# 推荐: 使用BitableAgent（自动缓存）
agent = BitableAgent(app_id, app_secret, app_token)

# 不推荐: 每次都获取新token
token = get_token()  # 浪费资源
```

### 4. 字段ID vs 字段名

```python
# 推荐: 使用字段ID（更稳定）
fields = {"fldXXX": "值1", "fldYYY": "值2"}

# 可用: 使用字段名（更易读）
fields = {"服务名称": "值1", "服务标识": "值2"}
```

### 5. 限流处理

```python
import time

# 在批量操作中添加延迟
for i in range(0, len(records), 100):
    batch = records[i:i+100]
    agent.batch_create_records(table_id, batch)
    time.sleep(0.5)  # 避免触发限流
```

---

## 完整配置文件

```python
# config.py

# 应用配置
APP_ID = "cli_a98e2f05eff89e1a"
APP_SECRET = "P8RRCqQlzw587orCUowX5dt37WQI7CZI"

# 多维表格配置
BITABLE_URL = "https://bjp4wig57p2m.jp.larksuite.com/base/OmjCbxMsqapRmqsIM4zjrce9pnf"
APP_TOKEN = "OmjCbxMsqapRmqsIM4zjrce9pnf"

# 表格ID映射
TABLE_IDS = {
    "字段映射": "tblZg3MWMYbqL88v",
    "模块": "tblCluOOEYysDthp",
    "服务": "tbl8h8thBybIWAGe",
    "API": "tblnRu6Xb9BLJMPr",
    "数据模型": "tblsJu3CmFGoIeP1",
    "页面": "tbl7Uvily9MeSUYd",
    "组件": "tbl4RJEl0BlLHQAX",
    "引用记录": "tblHODLjkNuyX7xt",
    "需求池": "tblL1qU6r3uIDoka",
    "迭代": "tblYeTM5idiWSqnD",
    "标签": "tblR1rdM99wjIBRX"
}

# API配置
BASE_URL = "https://open.larksuite.com/open-apis"
REQUEST_TIMEOUT = 30  # 秒
MAX_RETRIES = 3
```

---

## 总结

本文档提供了Agent操作飞书多维表格的完整方案：

✓ **配置信息** - 应用凭证、多维表格地址、表格ID映射  
✓ **认证方式** - tenant_access_token的获取和使用  
✓ **表格操作** - 列出、创建、获取表格信息  
✓ **字段操作** - 列出、创建各种类型的字段  
✓ **记录操作** - 增删改查、批量操作  
✓ **完整工具类** - 开箱即用的BitableAgent类  
✓ **使用示例** - 5个实际场景的代码示例  
✓ **常见问题** - 6个常见问题的解决方案  
✓ **最佳实践** - 5个推荐的使用方式  

**快速开始**: 复制BitableAgent类和配置信息，即可开始使用！

---

**文档版本**: 1.0  
**创建日期**: 2025-12-08  
**多维表格**: https://bjp4wig57p2m.jp.larksuite.com/base/OmjCbxMsqapRmqsIM4zjrce9pnf
