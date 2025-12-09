#!/usr/bin/env python3
"""
飞书多维表格操作工具类

使用示例:
    from bitable_agent import BitableAgent
    
    agent = BitableAgent(
        app_id="cli_a98e2f05eff89e1a",
        app_secret="P8RRCqQlzw587orCUowX5dt37WQI7CZI",
        app_token="OmjCbxMsqapRmqsIM4zjrce9pnf"
    )
    
    # 列出所有表格
    tables = agent.list_tables()
    
    # 创建记录
    record_id = agent.create_record(table_id, {"字段名": "值"})
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
    
    def get_table_info(self, table_id: str) -> Dict:
        """获取表格信息"""
        endpoint = f"/bitable/v1/apps/{self.app_token}/tables/{table_id}"
        return self._request("GET", endpoint)
    
    # ========== 字段操作 ==========
    
    def list_fields(self, table_id: str) -> List[Dict]:
        """列出字段"""
        endpoint = f"/bitable/v1/apps/{self.app_token}/tables/{table_id}/fields"
        data = self._request("GET", endpoint)
        return data.get("items", [])
    
    def create_field(self, table_id: str, field_name: str, field_type: int, **kwargs) -> str:
        """
        创建字段
        
        Args:
            table_id: 表格ID
            field_name: 字段名称
            field_type: 字段类型（1=文本, 2=数字, 3=单选, 4=多选, 5=日期, 7=复选框, 等）
            **kwargs: 其他属性（如单选的options、关联的table_id等）
        
        Returns:
            字段ID
        """
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
    
    def list_records(self, table_id: str, page_size: int = 100, page_token: str = None) -> Dict:
        """
        列出记录
        
        Args:
            table_id: 表格ID
            page_size: 每页记录数（最大500）
            page_token: 分页标记
        
        Returns:
            包含items和has_more的字典
        """
        endpoint = f"/bitable/v1/apps/{self.app_token}/tables/{table_id}/records"
        params = {"page_size": page_size}
        if page_token:
            params["page_token"] = page_token
        
        return self._request("GET", endpoint, params=params)
    
    def list_all_records(self, table_id: str) -> List[Dict]:
        """
        列出所有记录（自动分页）
        
        Args:
            table_id: 表格ID
        
        Returns:
            所有记录的列表
        """
        all_records = []
        page_token = None
        
        while True:
            data = self.list_records(table_id, page_size=500, page_token=page_token)
            records = data.get("items", [])
            all_records.extend(records)
            
            if not data.get("has_more"):
                break
            
            page_token = data.get("page_token")
        
        return all_records
    
    def create_record(self, table_id: str, fields: Dict) -> str:
        """
        创建记录
        
        Args:
            table_id: 表格ID
            fields: 字段值字典，格式为 {"字段名": "值"}
        
        Returns:
            记录ID
        """
        endpoint = f"/bitable/v1/apps/{self.app_token}/tables/{table_id}/records"
        data = self._request("POST", endpoint, json={"fields": fields})
        return data.get("record", {}).get("record_id")
    
    def update_record(self, table_id: str, record_id: str, fields: Dict) -> bool:
        """
        更新记录
        
        Args:
            table_id: 表格ID
            record_id: 记录ID
            fields: 要更新的字段值字典
        
        Returns:
            是否成功
        """
        endpoint = f"/bitable/v1/apps/{self.app_token}/tables/{table_id}/records/{record_id}"
        self._request("PUT", endpoint, json={"fields": fields})
        return True
    
    def delete_record(self, table_id: str, record_id: str) -> bool:
        """
        删除记录
        
        Args:
            table_id: 表格ID
            record_id: 记录ID
        
        Returns:
            是否成功
        """
        endpoint = f"/bitable/v1/apps/{self.app_token}/tables/{table_id}/records/{record_id}"
        self._request("DELETE", endpoint)
        return True
    
    def batch_create_records(self, table_id: str, records: List[Dict]) -> List[Dict]:
        """
        批量创建记录
        
        Args:
            table_id: 表格ID
            records: 记录列表，每个记录是字段值字典
        
        Returns:
            创建的记录列表
        """
        endpoint = f"/bitable/v1/apps/{self.app_token}/tables/{table_id}/records/batch_create"
        payload = {"records": [{"fields": record} for record in records]}
        data = self._request("POST", endpoint, json=payload)
        return data.get("records", [])
    
    def batch_update_records(self, table_id: str, records: List[Dict]) -> List[Dict]:
        """
        批量更新记录
        
        Args:
            table_id: 表格ID
            records: 记录列表，每个记录包含record_id和fields
                    格式: [{"record_id": "xxx", "fields": {"字段": "值"}}]
        
        Returns:
            更新的记录列表
        """
        endpoint = f"/bitable/v1/apps/{self.app_token}/tables/{table_id}/records/batch_update"
        data = self._request("POST", endpoint, json={"records": records})
        return data.get("records", [])
    
    def batch_delete_records(self, table_id: str, record_ids: List[str]) -> bool:
        """
        批量删除记录
        
        Args:
            table_id: 表格ID
            record_ids: 记录ID列表
        
        Returns:
            是否成功
        """
        endpoint = f"/bitable/v1/apps/{self.app_token}/tables/{table_id}/records/batch_delete"
        self._request("POST", endpoint, json={"records": record_ids})
        return True
    
    # ========== 便捷方法 ==========
    
    def get_table_id_by_name(self, table_name: str) -> Optional[str]:
        """
        根据表格名称获取ID
        
        Args:
            table_name: 表格名称
        
        Returns:
            表格ID，如果不存在返回None
        """
        tables = self.list_tables()
        for table in tables:
            if table.get("name") == table_name:
                return table.get("table_id")
        return None
    
    def get_field_id_by_name(self, table_id: str, field_name: str) -> Optional[str]:
        """
        根据字段名称获取ID
        
        Args:
            table_id: 表格ID
            field_name: 字段名称
        
        Returns:
            字段ID，如果不存在返回None
        """
        fields = self.list_fields(table_id)
        for field in fields:
            if field.get("field_name") == field_name:
                return field.get("field_id")
        return None
    
    def print_table_structure(self, table_id: str):
        """
        打印表格结构
        
        Args:
            table_id: 表格ID
        """
        fields = self.list_fields(table_id)
        print(f"表格字段 ({len(fields)}个):")
        for field in fields:
            field_type = field.get("type")
            field_name = field.get("field_name")
            field_id = field.get("field_id")
            print(f"  - {field_name} (ID: {field_id}, 类型: {field_type})")
    
    def print_records(self, table_id: str, limit: int = 10):
        """
        打印记录
        
        Args:
            table_id: 表格ID
            limit: 最多打印的记录数
        """
        data = self.list_records(table_id, page_size=limit)
        records = data.get("items", [])
        
        print(f"记录 (共{len(records)}条):")
        for i, record in enumerate(records, 1):
            print(f"\n记录 {i}:")
            print(f"  ID: {record.get('record_id')}")
            print(f"  字段:")
            for field_name, field_value in record.get("fields", {}).items():
                print(f"    - {field_name}: {field_value}")


# ========== 字段类型常量 ==========

class FieldType:
    """字段类型常量"""
    TEXT = 1              # 单行文本
    NUMBER = 2            # 数字
    SINGLE_SELECT = 3     # 单选
    MULTI_SELECT = 4      # 多选
    DATE = 5              # 日期
    CHECKBOX = 7          # 复选框
    USER = 11             # 人员
    PHONE = 13            # 电话号码
    URL = 15              # 超链接
    ATTACHMENT = 17       # 附件
    LINK = 18             # 关联
    FORMULA = 20          # 公式
    CREATED_TIME = 1001   # 创建时间
    MODIFIED_TIME = 1002  # 最后编辑时间
    CREATED_USER = 1003   # 创建人
    MODIFIED_USER = 1004  # 修改人
    AUTO_NUMBER = 1005    # 自动编号


# ========== 使用示例 ==========

if __name__ == "__main__":
    # 初始化
    agent = BitableAgent(
        app_id="cli_a98e2f05eff89e1a",
        app_secret="P8RRCqQlzw587orCUowX5dt37WQI7CZI",
        app_token="OmjCbxMsqapRmqsIM4zjrce9pnf"
    )
    
    # 列出所有表格
    print("=== 列出所有表格 ===")
    tables = agent.list_tables()
    for table in tables:
        print(f"{table['name']}: {table['table_id']}")
    
    # 获取服务表ID
    service_table_id = agent.get_table_id_by_name("服务")
    if service_table_id:
        print(f"\n=== 服务表结构 ===")
        agent.print_table_structure(service_table_id)
        
        print(f"\n=== 服务表记录 ===")
        agent.print_records(service_table_id, limit=3)
