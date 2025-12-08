---
id: get-menu-category
type: api
title: 获取赛区列表
status: completed
createdAt: '2025-12-07'
updatedAt: '2025-12-07'
description: '根据体育项目ID获取对应的赛区列表，支持分页。'
owner: 'Manus AI'
tags: ['导航', '菜单', '赛区']
version: '1.0'
apiType: REST
endpoint: '/v1/menu/category'
method: 'GET'
---

# GET /v1/menu/category 接口文档

**版本:** 1.0  
**生成日期:** 2025-12-07  
**作者:** Manus AI

---

## 1. 接口概述

根据体育项目ID获取对应的赛区列表，支持分页。

该接口是UOF首页API的一部分，用于提供前端应用所需的数据支持。

---

## 2. 请求参数


| 参数名 | 类型 | 必填 | 描述 |
|---|---|---|---|
| `sport_id` | string | 是 | 体育项目ID |
| `start_id` | number | 是 | 分页游标，data结构中的子id |


---

## 3. 响应格式

### 3.1 成功响应

**HTTP 状态码:** 200

**响应体示例:**

```json
{
    "code": "0",
    "data": {
        "categories": [
            {
                "id": 1,
                "category_id": "sr:category:1",
                "sport_id": "sr:sport:1",
                "name": "England",
                "match_count": 0
            },
            {
                "id": 2,
                "category_id": "sr:category:4",
                "sport_id": "sr:sport:1",
                "name": "International",
                "match_count": 83
            }
        ]
    },
    "message": "success"
}
```

### 3.2 错误响应

**HTTP 状态码:** 200 (业务错误通过code字段标识)

**响应体示例:**

```json
{
    "code": 50000004,
    "data": null,
    "message": "verify ID token failed"
}
```

**错误说明:**

- `code != "0"`: 表示请求失败
- `message`: 包含具体的错误信息

---

## 4. 使用示例

### 4.1 cURL 示例

```bash
curl -X GET \
  '/v1/menu/category?sport_id=<value>&start_id=<value>' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json'
```

### 4.2 JavaScript 示例

```javascript
const response = await fetch('/v1/menu/category?sport_id=value&start_id=value', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
if (data.code === '0') {
  console.log('Success:', data.data);
} else {
  console.error('Error:', data.message);
}
```

---

## 5. 注意事项

1. **认证**: 所有请求需要在Header中携带有效的Authorization Token
2. **响应格式**: 所有响应都遵循统一的格式，通过`code`字段判断成功或失败
3. **错误处理**: 当`code != "0"`时，应该展示`message`中的错误信息给用户
4. **分页**: 对于支持分页的接口，使用返回的`next_cursor`进行下一页查询

---

## 6. 相关文档

- [投注交易模块 API 文档](./README.md)
- [UOF Service API Documentation](../../README.md)

---

**文档生成时间:** 2025-12-07  
**文档维护者:** Manus AI
