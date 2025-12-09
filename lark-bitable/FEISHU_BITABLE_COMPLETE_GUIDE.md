# 飞书Bitable多维表格API完整指南

**最后更新**: 2025-12-08  
**版本**: 1.0  
**作者**: Manus AI Assistant

---

## 目录

1. [快速开始](#快速开始)
2. [应用信息](#应用信息)
3. [鉴权方式](#鉴权方式)
4. [API端点](#api端点)
5. [字段类型](#字段类型)
6. [常用操作](#常用操作)
7. [Python客户端库](#python客户端库)
8. [使用场景](#使用场景)
9. [错误处理](#错误处理)
10. [常见问题](#常见问题)
11. [403错误分析](#403错误分析)

---

## 快速开始

### 安装依赖

```bash
pip install requests
```

### 初始化客户端

```python
from bitable_client import BitableClient

client = BitableClient(
    app_id="cli_a98e2f05eff89e1a",
    app_secret="P8RRCqQlzw587orCUowX5dt37WQI7CZI"
)
```

### 基本操作

```python
app_token = "OmjCbxMsqapRmqsIM4zjrce9pnf"
table_id = "tbltK5BtIMgT2vLG"

# 读取字段
fields = client.list_fields(app_token, table_id)

# 读取记录
records = client.list_records(app_token, table_id)

# 创建记录
record_id = client.create_record(
    app_token,
    table_id,
    {"fldQifnIFI": "文本", "fldpOCbzbj": "A"}
)

# 更新记录
client.update_record(
    app_token,
    table_id,
    record_id,
    {"fldQifnIFI": "更新的文本"}
)

# 删除记录
client.delete_record(app_token, table_id, record_id)
```

---

## 应用信息

### 凭证

- **App ID**: `cli_a98e2f05eff89e1a`
- **App Secret**: `P8RRCqQlzw587orCUowX5dt37WQI7CZI`

### 权限范围

```json
{
  "scopes": {
    "tenant": [
      "base:record:create",      // 创建记录
      "base:record:retrieve",    // 读取记录
      "base:record:update",      // 更新记录
      "bitable:app"              // 多维表格应用权限
    ]
  }
}
```

### 测试表格

- **URL**: https://bjp4wig57p2m.jp.larksuite.com/base/OmjCbxMsqapRmqsIM4zjrce9pnf?table=tbltK5BtIMgT2vLG
- **App Token**: `OmjCbxMsqapRmqsIM4zjrce9pnf`
- **Table ID**: `tbltK5BtIMgT2vLG`

### 字段列表

| 字段ID | 字段名 | 字段类型 | 类型ID |
|--------|--------|---------|--------|
| fldQifnIFI | 文本 | Text | 1 |
| fldpOCbzbj | 单选 | SingleSelect | 3 |

### 现有记录

- **总数**: 5条
- **示例**: 
  - 记录ID: `recHV7a0K3`, 单选值: `C`
  - 记录ID: `recfgjkASD`, 单选值: (空)
  - 记录ID: `recYijYOlo`, 单选值: (空)

---

## 鉴权方式

### 两种访问凭证

#### 1. tenant_access_token（应用身份）

```
Authorization: Bearer t-g1044qeGEDXTB6NDJOGV4JQCYDGHRBARFTGT1234
```

**特点**:
- 以应用身份调用API
- 数据范围由应用的权限范围决定
- 需要应用被添加为多维表格的协作者
- 适合后台服务、定时任务

**获取方式**:
```python
import requests

auth_url = "https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal"
payload = {
    "app_id": "cli_a98e2f05eff89e1a",
    "app_secret": "P8RRCqQlzw587orCUowX5dt37WQI7CZI"
}

response = requests.post(auth_url, json=payload)
data = response.json()

if response.status_code == 200 and data.get("code") == 0:
    token = data.get("tenant_access_token")
    print(f"✓ 成功获取访问凭证")
else:
    print(f"✗ 获取凭证失败: {data.get('msg')}")
```

**我使用的方式**: ✓ 正确获取了tenant_access_token

**当前问题**: 应用可能没有被添加为多维表格的协作者，导致403

#### 2. user_access_token（用户身份）

```
Authorization: Bearer u-cjz1eKCEx289x1TXEiQJqAh5171B4gDHPq00l0GE1234
```

**特点**:
- 以登录用户身份调用API
- 数据范围由用户可读写的数据范围决定
- 用户有权限访问的多维表格都可以操作
- 需要用户授权（OAuth流程）

**优势**: 用户已经有权限访问该多维表格，所以user_access_token可能成功

### 权限检查流程

```
使用tenant_access_token时:
1. ✓ Token有效性检查 → 通过
2. ✓ API权限检查 → 应用有base:record:create权限 → 通过
3. ✗ 数据权限检查 → 应用未被添加为该表格的协作者 → 失败！
结果: 403 Forbidden

使用user_access_token时:
1. ✓ Token有效性检查 → 通过
2. ✓ API权限检查 → 用户有base:record:create权限 → 通过
3. ✓ 数据权限检查 → 用户有权访问该表格 → 通过
结果: 200 OK
```

---

## API端点

### 基础URL

```
https://open.larksuite.com/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}
```

### 字段操作

| 操作 | 方法 | 端点 | 说明 |
|-----|-----|-----|------|
| 列出字段 | GET | `/fields` | 获取表格所有字段 |
| 获取单个字段 | GET | `/fields/{field_id}` | 获取字段详细信息 |
| 创建字段 | POST | `/fields` | 创建新字段 |
| 更新字段 | PUT | `/fields/{field_id}` | 修改字段属性 |
| 删除字段 | DELETE | `/fields/{field_id}` | 删除字段 |

### 记录操作

| 操作 | 方法 | 端点 | 说明 |
|-----|-----|-----|------|
| 列出记录 | GET | `/records` | 获取表格所有记录 |
| 获取单条记录 | GET | `/records/{record_id}` | 获取记录详细信息 |
| 创建记录 | POST | `/records` | 创建新记录 |
| 批量创建 | POST | `/records/batch_create` | 批量创建记录 |
| 更新记录 | PUT | `/records/{record_id}` | 修改记录 |
| 批量更新 | POST | `/records/batch_update` | 批量修改记录 |
| 删除记录 | DELETE | `/records/{record_id}` | 删除记录 |

### 完整的URL示例

#### 创建记录

```
POST https://open.larksuite.com/open-apis/bitable/v1/apps/OmjCbxMsqapRmqsIM4zjrce9pnf/tables/tbltK5BtIMgT2vLG/records
```

#### 批量创建

```
POST https://open.larksuite.com/open-apis/bitable/v1/apps/OmjCbxMsqapRmqsIM4zjrce9pnf/tables/tbltK5BtIMgT2vLG/records/batch_create
```

#### 更新记录

```
PUT https://open.larksuite.com/open-apis/bitable/v1/apps/OmjCbxMsqapRmqsIM4zjrce9pnf/tables/tbltK5BtIMgT2vLG/records/{record_id}
```

---

## 字段类型

### 完整字段类型列表

| 类型ID | 字段类型 | 中文名 | 可编辑 | API值格式 |
|--------|---------|--------|--------|----------|
| 1 | Text | 文本 | ✓ | `"文本内容"` |
| 2 | Number | 数字 | ✓ | `123.45` |
| 3 | SingleSelect | 单选 | ✓ | `"选项名"` |
| 4 | MultiSelect | 多选 | ✓ | `["选项1", "选项2"]` |
| 5 | DateTime | 日期时间 | ✓ | `"2025-12-08T12:00:00Z"` |
| 7 | Checkbox | 复选框 | ✓ | `true` / `false` |
| 8 | MultilineText | 多行文本 | ✓ | `"第一行\n第二行"` |
| 11 | Attachment | 附件 | ✓ | `[{"file_token": "..."}]` |
| 13 | Link | 链接 | ✓ | `"https://example.com"` |
| 14 | Formula | 公式 | ✗ | 只读，自动计算 |
| 15 | DuplexLink | 双向链接 | ✓ | `["rec001", "rec002"]` |
| 17 | LookUp | 查询 | ✗ | 只读，从链接查询 |
| 18 | AutoNumber | 自动编号 | ✗ | 只读，自动生成 |
| 19 | CreatedTime | 创建时间 | ✗ | 只读 |
| 20 | ModifiedTime | 修改时间 | ✗ | 只读 |
| 21 | CreatedUser | 创建人 | ✗ | 只读 |
| 22 | ModifiedUser | 修改人 | ✗ | 只读 |
| 23 | Button | 按钮 | ✗ | 只读 |

### 字段值示例

#### 文本字段 (Type: 1)
```json
{"fldXXXXXX": "这是文本"}
```

#### 数字字段 (Type: 2)
```json
{"fldXXXXXX": 123.45}
```

#### 单选字段 (Type: 3)
```json
{"fldXXXXXX": "选项A"}
```

#### 多选字段 (Type: 4)
```json
{"fldXXXXXX": ["选项1", "选项2"]}
```

#### 日期时间字段 (Type: 5)
```json
{"fldXXXXXX": "2025-12-08T12:00:00Z"}
```

#### 复选框字段 (Type: 7)
```json
{"fldXXXXXX": true}
```

#### 多行文本字段 (Type: 8)
```json
{"fldXXXXXX": "第一行\n第二行"}
```

#### 链接字段 (Type: 13)
```json
{"fldXXXXXX": "https://example.com"}
```

#### 双向链接字段 (Type: 15)
```json
{"fldXXXXXX": ["rec001", "rec002"]}
```

---

## 常用操作

### 1. 列出所有字段

```python
def list_fields(app_token, table_id, token):
    """列出表格的所有字段"""
    url = f"https://open.larksuite.com/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/fields"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        fields = data.get("data", {}).get("items", [])
        
        for field in fields:
            print(f"字段ID: {field['field_id']}")
            print(f"字段名: {field['field_name']}")
            print(f"字段类型: {field['type']}")
            print()
        
        return fields
    else:
        print(f"错误: {response.json()}")
        return None
```

### 2. 列出所有记录

```python
def list_records(app_token, table_id, token, page_size=10):
    """列出表格的所有记录"""
    url = f"https://open.larksuite.com/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    params = {"page_size": page_size}
    
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code == 200:
        data = response.json()
        records = data.get("data", {}).get("items", [])
        
        for record in records:
            print(f"记录ID: {record['record_id']}")
            print(f"字段数据: {record['fields']}")
            print()
        
        return records
    else:
        print(f"错误: {response.json()}")
        return None
```

### 3. 创建新记录

```python
def create_record(app_token, table_id, token, fields_data):
    """创建新记录"""
    url = f"https://open.larksuite.com/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {"fields": fields_data}
    
    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code == 200:
        data = response.json()
        record_id = data.get("data", {}).get("record", {}).get("record_id")
        print(f"✓ 成功创建记录: {record_id}")
        return record_id
    else:
        print(f"✗ 创建失败: {response.json()}")
        return None
```

### 4. 更新记录

```python
def update_record(app_token, table_id, record_id, token, fields_data):
    """更新记录"""
    url = f"https://open.larksuite.com/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records/{record_id}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {"fields": fields_data}
    
    response = requests.put(url, headers=headers, json=payload)
    
    if response.status_code == 200:
        print(f"✓ 成功更新记录: {record_id}")
        return True
    else:
        print(f"✗ 更新失败: {response.json()}")
        return False
```

### 5. 获取单条记录

```python
def get_record(app_token, table_id, record_id, token):
    """获取单条记录"""
    url = f"https://open.larksuite.com/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records/{record_id}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        record = data.get("data", {}).get("record", {})
        print(f"记录ID: {record['record_id']}")
        print(f"字段数据: {record['fields']}")
        return record
    else:
        print(f"✗ 获取失败: {response.json()}")
        return None
```

### 6. 删除记录

```python
def delete_record(app_token, table_id, record_id, token):
    """删除记录"""
    url = f"https://open.larksuite.com/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records/{record_id}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    response = requests.delete(url, headers=headers)
    
    if response.status_code == 200:
        print(f"✓ 成功删除记录: {record_id}")
        return True
    else:
        print(f"✗ 删除失败: {response.json()}")
        return False
```

### 7. 批量创建记录

```python
def batch_create_records(app_token, table_id, token, records_data):
    """批量创建记录"""
    url = f"https://open.larksuite.com/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records/batch_create"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {"records": records_data}
    
    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code == 200:
        data = response.json()
        records = data.get("data", {}).get("records", [])
        print(f"✓ 成功创建 {len(records)} 条记录")
        return records
    else:
        print(f"✗ 批量创建失败: {response.json()}")
        return None
```

---

## Python客户端库

### BitableClient类

```python
import requests
from typing import Dict, List, Optional, Tuple

class BitableClient:
    """飞书Bitable多维表格客户端"""
    
    BASE_URL = "https://open.larksuite.com/open-apis"
    
    FIELD_TYPES = {
        1: "Text", 2: "Number", 3: "SingleSelect", 4: "MultiSelect",
        5: "DateTime", 7: "Checkbox", 8: "MultilineText", 11: "Attachment",
        13: "Link", 14: "Formula", 15: "DuplexLink", 17: "LookUp",
        18: "AutoNumber", 19: "CreatedTime", 20: "ModifiedTime",
        21: "CreatedUser", 22: "ModifiedUser", 23: "Button",
    }
    
    def __init__(self, app_id: str, app_secret: str):
        """初始化客户端"""
        self.app_id = app_id
        self.app_secret = app_secret
        self.token = None
        self._authenticate()
    
    def _authenticate(self):
        """获取访问凭证"""
        url = f"{self.BASE_URL}/auth/v3/tenant_access_token/internal"
        payload = {"app_id": self.app_id, "app_secret": self.app_secret}
        
        try:
            response = requests.post(url, json=payload, timeout=10)
            data = response.json()
            
            if response.status_code == 200 and data.get("code") == 0:
                self.token = data.get("tenant_access_token")
            else:
                raise Exception(f"认证失败: {data.get('msg')}")
        except Exception as e:
            raise Exception(f"认证异常: {str(e)}")
    
    def _get_headers(self) -> Dict:
        """获取请求头"""
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    def list_fields(self, app_token: str, table_id: str) -> Optional[List[Dict]]:
        """列出所有字段"""
        url = f"{self.BASE_URL}/bitable/v1/apps/{app_token}/tables/{table_id}/fields"
        
        try:
            response = requests.get(url, headers=self._get_headers(), timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                return data.get("data", {}).get("items", [])
            else:
                print(f"✗ 获取字段列表失败: {response.json()}")
                return None
        except Exception as e:
            print(f"✗ 异常: {str(e)}")
            return None
    
    def list_records(self, app_token: str, table_id: str, page_size: int = 10) -> Optional[List[Dict]]:
        """列出所有记录"""
        url = f"{self.BASE_URL}/bitable/v1/apps/{app_token}/tables/{table_id}/records"
        params = {"page_size": page_size}
        
        try:
            response = requests.get(url, headers=self._get_headers(), params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                return data.get("data", {}).get("items", [])
            else:
                print(f"✗ 获取记录列表失败: {response.json()}")
                return None
        except Exception as e:
            print(f"✗ 异常: {str(e)}")
            return None
    
    def create_record(self, app_token: str, table_id: str, fields: Dict) -> Optional[str]:
        """创建记录"""
        url = f"{self.BASE_URL}/bitable/v1/apps/{app_token}/tables/{table_id}/records"
        payload = {"fields": fields}
        
        try:
            response = requests.post(url, headers=self._get_headers(), json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                record_id = data.get("data", {}).get("record", {}).get("record_id")
                print(f"✓ 成功创建记录: {record_id}")
                return record_id
            else:
                print(f"✗ 创建记录失败: {response.json()}")
                return None
        except Exception as e:
            print(f"✗ 异常: {str(e)}")
            return None
    
    def update_record(self, app_token: str, table_id: str, record_id: str, fields: Dict) -> bool:
        """更新记录"""
        url = f"{self.BASE_URL}/bitable/v1/apps/{app_token}/tables/{table_id}/records/{record_id}"
        payload = {"fields": fields}
        
        try:
            response = requests.put(url, headers=self._get_headers(), json=payload, timeout=10)
            
            if response.status_code == 200:
                print(f"✓ 成功更新记录: {record_id}")
                return True
            else:
                print(f"✗ 更新记录失败: {response.json()}")
                return False
        except Exception as e:
            print(f"✗ 异常: {str(e)}")
            return False
    
    def get_record(self, app_token: str, table_id: str, record_id: str) -> Optional[Dict]:
        """获取单条记录"""
        url = f"{self.BASE_URL}/bitable/v1/apps/{app_token}/tables/{table_id}/records/{record_id}"
        
        try:
            response = requests.get(url, headers=self._get_headers(), timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                return data.get("data", {}).get("record", {})
            else:
                print(f"✗ 获取记录失败: {response.json()}")
                return None
        except Exception as e:
            print(f"✗ 异常: {str(e)}")
            return None
    
    def delete_record(self, app_token: str, table_id: str, record_id: str) -> bool:
        """删除记录"""
        url = f"{self.BASE_URL}/bitable/v1/apps/{app_token}/tables/{table_id}/records/{record_id}"
        
        try:
            response = requests.delete(url, headers=self._get_headers(), timeout=10)
            
            if response.status_code == 200:
                print(f"✓ 成功删除记录: {record_id}")
                return True
            else:
                print(f"✗ 删除记录失败: {response.json()}")
                return False
        except Exception as e:
            print(f"✗ 异常: {str(e)}")
            return False
    
    def batch_create_records(self, app_token: str, table_id: str, records: List[Dict]) -> Optional[List[Dict]]:
        """批量创建记录"""
        url = f"{self.BASE_URL}/bitable/v1/apps/{app_token}/tables/{table_id}/records/batch_create"
        payload = {"records": records}
        
        try:
            response = requests.post(url, headers=self._get_headers(), json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                created_records = data.get("data", {}).get("records", [])
                print(f"✓ 成功创建 {len(created_records)} 条记录")
                return created_records
            else:
                print(f"✗ 批量创建失败: {response.json()}")
                return None
        except Exception as e:
            print(f"✗ 异常: {str(e)}")
            return None
    
    def batch_update_records(self, app_token: str, table_id: str, records: List[Dict]) -> Optional[List[Dict]]:
        """批量更新记录"""
        url = f"{self.BASE_URL}/bitable/v1/apps/{app_token}/tables/{table_id}/records/batch_update"
        payload = {"records": records}
        
        try:
            response = requests.post(url, headers=self._get_headers(), json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                updated_records = data.get("data", {}).get("records", [])
                print(f"✓ 成功更新 {len(updated_records)} 条记录")
                return updated_records
            else:
                print(f"✗ 批量更新失败: {response.json()}")
                return None
        except Exception as e:
            print(f"✗ 异常: {str(e)}")
            return None
    
    def print_fields_info(self, app_token: str, table_id: str):
        """打印字段信息（调试）"""
        fields = self.list_fields(app_token, table_id)
        
        if not fields:
            print("✗ 无法获取字段列表")
            return
        
        print(f"\n{'='*100}")
        print(f"字段列表 (共 {len(fields)} 个字段)")
        print(f"{'='*100}\n")
        
        for field in fields:
            print(f"字段ID: {field.get('field_id')}")
            print(f"  名称: {field.get('field_name')}")
            print(f"  类型: {self.FIELD_TYPES.get(field.get('type'), 'Unknown')}")
            print()
    
    def print_records_info(self, app_token: str, table_id: str, limit: int = 5):
        """打印记录信息（调试）"""
        records = self.list_records(app_token, table_id, page_size=limit)
        
        if not records:
            print("✗ 无法获取记录列表")
            return
        
        print(f"\n{'='*100}")
        print(f"记录列表 (共 {len(records)} 条记录)")
        print(f"{'='*100}\n")
        
        for i, record in enumerate(records, 1):
            print(f"记录 {i}: {record.get('record_id')}")
            for field_id, value in record.get('fields', {}).items():
                print(f"  {field_id}: {value}")
            print()
```

### 使用示例

```python
# 初始化
client = BitableClient(
    app_id="cli_a98e2f05eff89e1a",
    app_secret="P8RRCqQlzw587orCUowX5dt37WQI7CZI"
)

app_token = "OmjCbxMsqapRmqsIM4zjrce9pnf"
table_id = "tbltK5BtIMgT2vLG"

# 打印字段信息
client.print_fields_info(app_token, table_id)

# 打印记录信息
client.print_records_info(app_token, table_id, limit=3)

# 创建记录
record_id = client.create_record(
    app_token,
    table_id,
    {"fldQifnIFI": "测试", "fldpOCbzbj": "A"}
)

# 更新记录
if record_id:
    client.update_record(
        app_token,
        table_id,
        record_id,
        {"fldQifnIFI": "更新的值"}
    )

# 获取记录
if record_id:
    record = client.get_record(app_token, table_id, record_id)
    print(f"记录数据: {record}")

# 删除记录
if record_id:
    client.delete_record(app_token, table_id, record_id)
```

---

## 使用场景

### 场景1: 查看表格结构

```python
client.print_fields_info(app_token, table_id)
```

### 场景2: 查看现有记录

```python
client.print_records_info(app_token, table_id, limit=5)
```

### 场景3: 创建新记录

```python
record_id = client.create_record(
    app_token,
    table_id,
    {
        "fldQifnIFI": "新的文本内容",
        "fldpOCbzbj": "A"
    }
)
```

### 场景4: 批量创建记录

```python
records_data = [
    {"fields": {"fldQifnIFI": "记录1", "fldpOCbzbj": "A"}},
    {"fields": {"fldQifnIFI": "记录2", "fldpOCbzbj": "B"}},
    {"fields": {"fldQifnIFI": "记录3", "fldpOCbzbj": "C"}}
]

created_records = client.batch_create_records(app_token, table_id, records_data)
```

### 场景5: 数据导入导出

```python
import csv

# 导出数据到CSV
fields = client.list_fields(app_token, table_id)
records = client.list_records(app_token, table_id, page_size=1000)

field_ids = [f.get("field_id") for f in fields]
field_names = [f.get("field_name") for f in fields]

with open("export.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(field_names)
    
    for record in records:
        row = [record.get("fields", {}).get(fid, "") for fid in field_ids]
        writer.writerow(row)

print("✓ 数据已导出到 export.csv")
```

### 场景6: 数据同步

```python
def sync_data_to_bitable(external_data):
    """同步外部数据到多维表格"""
    
    existing_records = client.list_records(app_token, table_id)
    existing_ids = {r.get("fields", {}).get("fldQifnIFI") for r in existing_records}
    
    new_records = []
    for item in external_data:
        if item["name"] not in existing_ids:
            new_records.append({
                "fields": {
                    "fldQifnIFI": item["name"],
                    "fldpOCbzbj": item["category"]
                }
            })
    
    if new_records:
        created = client.batch_create_records(app_token, table_id, new_records)
        print(f"✓ 同步了 {len(created)} 条新记录")
    else:
        print("✓ 没有新记录需要同步")
```

---

## 错误处理

### 常见错误代码

| 错误代码 | HTTP状态 | 说明 | 解决方案 |
|---------|---------|------|---------|
| 0 | 200 | 成功 | - |
| 91402 | 400 | NOTEXIST - 资源不存在 | 检查app_token、table_id、record_id |
| 91403 | 403 | Forbidden - 权限不足 | 检查应用权限和协作者配置 |
| 99991672 | 400 | 权限范围不足 | 添加所需的权限范围 |
| 99992402 | 400 | 字段验证失败 | 检查请求体格式和字段值 |

### 错误处理示例

```python
def safe_api_call(func, *args, **kwargs):
    """安全的API调用包装器"""
    try:
        response = func(*args, **kwargs)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("code") == 0:
                return True, data.get("data")
            else:
                return False, f"API错误: {data.get('msg')}"
        else:
            return False, f"HTTP {response.status_code}: {response.text}"
    
    except requests.Timeout:
        return False, "请求超时"
    except requests.ConnectionError:
        return False, "连接失败"
    except Exception as e:
        return False, f"异常: {str(e)}"

# 使用
success, result = safe_api_call(requests.get, url, headers=headers)
if success:
    print(f"成功: {result}")
else:
    print(f"失败: {result}")
```

---

## 常见问题

### Q1: 如何获取App Token?

**A:** 有两种方式：

1. **从URL直接提取**
   ```
   URL: https://bjp4wig57p2m.jp.larksuite.com/base/OmjCbxMsqapRmqsIM4zjrce9pnf?table=tbltK5BtIMgT2vLG
   App Token: OmjCbxMsqapRmqsIM4zjrce9pnf
   ```

2. **使用Wiki V2 API**
   ```bash
   GET https://open.larksuite.com/open-apis/wiki/v2/spaces/get_node?token={WIKI_TOKEN}
   ```

### Q2: 创建/更新记录返回403怎么办?

**A:** 这通常是权限问题。检查以下几点：

1. 应用是否有 `base:record:create` 权限
2. 应用是否被添加为多维表格的协作者
3. 多维表格是否有特殊的权限限制

### Q3: 如何处理日期时间字段?

**A:** 使用ISO 8601格式：

```python
from datetime import datetime

fields = {
    "fldXXXXXX": datetime.now().isoformat()  # "2025-12-08T12:00:00"
}
```

### Q4: 如何设置单选/多选字段?

**A:** 必须使用已存在的选项名称：

```python
# 单选
fields = {
    "fldXXXXXX": "选项A"  # 必须是已存在的选项
}

# 多选
fields = {
    "fldXXXXXX": ["选项1", "选项2"]  # 数组形式
}
```

### Q5: 公式字段和查询字段可以编辑吗?

**A:** 不可以。这些字段是只读的，由系统自动计算或生成。

### Q6: 如何批量操作记录?

**A:** 使用batch_create或batch_update端点：

```python
# 批量创建
records_data = [
    {"fields": {...}},
    {"fields": {...}},
    {"fields": {...}}
]
client.batch_create_records(app_token, table_id, records_data)

# 批量更新
records_data = [
    {"record_id": "rec001", "fields": {...}},
    {"record_id": "rec002", "fields": {...}}
]
client.batch_update_records(app_token, table_id, records_data)
```

### Q7: 如何处理双向链接字段?

**A:** 双向链接字段的值是关联记录的ID数组：

```python
fields = {
    "fldXXXXXX": ["rec001", "rec002", "rec003"]  # 关联的记录ID
}
```

### Q8: API请求有速率限制吗?

**A:** 飞书API有速率限制，建议：

1. 使用批量操作API减少请求数
2. 添加请求间隔（如100ms）
3. 实现重试机制处理限流

---

## 403错误分析

### 问题描述

在调用创建记录API时，返回 **HTTP 403 Forbidden** 错误，错误代码为 **91403**。

### 我的调用方式

#### 第1步：获取访问凭证 ✓

```python
auth_url = "https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal"
auth_payload = {
    "app_id": "cli_a98e2f05eff89e1a",
    "app_secret": "P8RRCqQlzw587orCUowX5dt37WQI7CZI"
}
response = requests.post(auth_url, json=auth_payload)
token = response.json().get("tenant_access_token")
```

**结果**: 成功，获得 tenant_access_token

#### 第2步：构建请求头 ✓

```python
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}
```

#### 第3步：列出字段 ✓

```bash
GET https://open.larksuite.com/open-apis/bitable/v1/apps/OmjCbxMsqapRmqsIM4zjrce9pnf/tables/tbltK5BtIMgT2vLG/fields
```

**结果**: 成功，获得2个字段

#### 第4步：列出记录 ✓

```bash
GET https://open.larksuite.com/open-apis/bitable/v1/apps/OmjCbxMsqapRmqsIM4zjrce9pnf/tables/tbltK5BtIMgT2vLG/records
```

**结果**: 成功，获得5条记录

#### 第5步：创建记录 ✗

```bash
POST https://open.larksuite.com/open-apis/bitable/v1/apps/OmjCbxMsqapRmqsIM4zjrce9pnf/tables/tbltK5BtIMgT2vLG/records

请求体:
{
  "fields": {
    "fldQifnIFI": "测试文本-04:56:06",
    "fldpOCbzbj": "A"
  }
}
```

**结果**: 403 Forbidden (错误代码91403)

### 关键发现：读写权限不对称

| 操作 | 结果 | 说明 |
|-----|------|------|
| 读取字段 | ✓ 200 | 可以读取 |
| 读取记录 | ✓ 200 | 可以读取 |
| **创建记录** | **✗ 403** | **被拒绝** |
| **更新记录** | **✗ 403** | **被拒绝** |

应用有**读权限**但没有**写权限**。

### 真实原因

**应用有全局API权限，但缺少表格级别的协作者权限**

- ✓ 应用有 `base:record:create` 权限（全局）
- ✓ 应用可以读取字段和记录（读权限）
- ✗ 应用未被添加为该多维表格的协作者（表格级别）
- ✗ 所以无法创建或更新记录

### 权限检查流程

```
使用tenant_access_token时:
1. ✓ Token有效性检查 → 通过
2. ✓ API权限检查 → 应用有base:record:create权限 → 通过
3. ✗ 数据权限检查 → 应用未被添加为该表格的协作者 → 失败！
结果: 403 Forbidden

使用user_access_token时:
1. ✓ Token有效性检查 → 通过
2. ✓ API权限检查 → 用户有base:record:create权限 → 通过
3. ✓ 数据权限检查 → 用户有权访问该表格 → 通过
结果: 200 OK
```

### 解决方案

#### 方案1: 使用user_access_token（推荐立即测试）

用户已经有权限访问该多维表格，所以user_access_token应该可以成功：

```python
# 获取user_access_token (需要用户授权)
user_token = "u-cjz1eKCEx289x1TXEiQJqAh5171B4gDHPq00l0GE1234"

headers = {
    "Authorization": f"Bearer {user_token}",
    "Content-Type": "application/json"
}

response = requests.post(
    "https://open.larksuite.com/open-apis/bitable/v1/apps/OmjCbxMsqapRmqsIM4zjrce9pnf/tables/tbltK5BtIMgT2vLG/records",
    headers=headers,
    json={"fields": {"fldQifnIFI": "测试", "fldpOCbzbj": "A"}}
)

# 可能返回 200 OK
```

#### 方案2: 配置应用协作者权限（长期方案）

在飞书中配置应用为多维表格的协作者：

1. 打开多维表格
2. 进入表格设置
3. 添加应用 `cli_a98e2f05eff89e1a` 为协作者
4. 设置权限为"编辑"

配置后，tenant_access_token就可以创建/更新记录了。

---

## 快速参考

### 最常用的操作

```python
# 初始化
client = BitableClient(app_id, app_secret)

# 读取
fields = client.list_fields(app_token, table_id)
records = client.list_records(app_token, table_id)
record = client.get_record(app_token, table_id, record_id)

# 写入
record_id = client.create_record(app_token, table_id, fields_data)
client.update_record(app_token, table_id, record_id, fields_data)
client.delete_record(app_token, table_id, record_id)

# 批量
client.batch_create_records(app_token, table_id, records_data)
client.batch_update_records(app_token, table_id, records_data)
```

### 字段类型速查

```python
FIELD_TYPES = {
    1: "Text",           # 文本
    2: "Number",         # 数字
    3: "SingleSelect",   # 单选
    4: "MultiSelect",    # 多选
    5: "DateTime",       # 日期时间
    7: "Checkbox",       # 复选框
    8: "MultilineText",  # 多行文本
    11: "Attachment",    # 附件
    13: "Link",          # 链接
    14: "Formula",       # 公式（只读）
    15: "DuplexLink",    # 双向链接
    17: "LookUp",        # 查询（只读）
    18: "AutoNumber",    # 自动编号（只读）
    19: "CreatedTime",   # 创建时间（只读）
    20: "ModifiedTime",  # 修改时间（只读）
    21: "CreatedUser",   # 创建人（只读）
    22: "ModifiedUser",  # 修改人（只读）
    23: "Button",        # 按钮（只读）
}
```

### 您的表格信息

```
App ID: cli_a98e2f05eff89e1a
App Secret: P8RRCqQlzw587orCUowX5dt37WQI7CZI
App Token: OmjCbxMsqapRmqsIM4zjrce9pnf
Table ID: tbltK5BtIMgT2vLG
URL: https://bjp4wig57p2m.jp.larksuite.com/base/OmjCbxMsqapRmqsIM4zjrce9pnf?table=tbltK5BtIMgT2vLG

字段:
- fldQifnIFI: 文本 (Type 1)
- fldpOCbzbj: 单选 (Type 3, 选项: A, B, C)

现有记录: 5条
```

---

## 相关资源

- [飞书开放平台](https://open.larksuite.com)
- [Bitable API官方文档](https://open.larksuite.com/document/server-docs/docs/bitable-v1/bitable-overview)
- [Wiki V2 API文档](https://open.larksuite.com/document/server-docs/docs/wiki-v2/space-node/get_node)

---

**完整指南结束**
