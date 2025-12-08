---
id: get-menu-sports
type: api
title: 获取体育项目列表
status: completed
createdAt: '2025-12-07'
updatedAt: '2025-12-07'
description: '获取所有可用的体育项目列表，用于左侧导航菜单。'
owner: 'Manus AI'
tags: ['导航', '菜单', '体育项目']
version: '1.0'
apiType: REST
endpoint: '/v1/menu/sports'
method: 'GET'
---

# GET /v1/menu/sports 接口文档

**版本:** 1.0  
**生成日期:** 2025-12-07  
**作者:** Manus AI

---

## 1. 接口概述

获取所有可用的体育项目列表，用于左侧导航菜单。

该接口是UOF首页API的一部分，用于提供前端应用所需的数据支持。

---

## 2. 请求参数


无需参数


---

## 3. 响应格式

### 3.1 成功响应

**HTTP 状态码:** 200

**响应体示例:**

```json
{
    "code": "0",
    "data": [
        {
            "id": 1,
            "sport_id": "sr:sport:1",
            "name": "Soccer"
        },
        {
            "id": 109,
            "sport_id": "sr:sport:109",
            "name": "ESport Counter-Strike"
        },
        {
            "id": 111,
            "sport_id": "sr:sport:111",
            "name": "ESport Dota"
        },
        {
            "id": 2,
            "sport_id": "sr:sport:2",
            "name": "Basketball"
        }
    ],
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
    "message": "verify ID token failed: ID token has expired at: 1758875631\n"
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
  '/v1/menu/sports' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json'
```

### 4.2 JavaScript 示例

```javascript
const response = await fetch('/v1/menu/sports', {
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
