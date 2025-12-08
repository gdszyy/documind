---
id: get-balance
type: api
title: 查询余额
relatedService: wallet-service
method: GET
path: /api/wallet/balance
status: completed
createdAt: '2025-12-08'
updatedAt: '2025-12-08'
author: '后端工程师'
---

# 查询余额

## 1. 接口定义

**请求方法**: `GET`  
**请求路径**: `/api/wallet/balance`  
**所属服务**: 钱包服务（待补充）

**功能描述**: 查询当前用户的钱包余额

---

## 2. 请求参数

### 2.1. 请求头

| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| Authorization | String | 是 | 用户认证令牌 | `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

---

## 3. 响应数据

### 3.1. 成功响应 (200)

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| balance | Number | 当前余额 | `1234.56` |
| currency | String | 货币单位 | `"CNY"` |
| lastUpdatedAt | String | 最后更新时间 | `"2025-12-08T10:30:00Z"` |

### 3.2. 错误响应

所有错误响应遵循统一格式:

```json
{
  "code": "ERROR_CODE",
  "message": "错误描述",
  "details": {}
}
```

---

## 4. 错误码

| 错误码 | 说明 | HTTP 状态码 | 解决方案 |
|--------|------|-------------|---------|
| WALLET_001 | 钱包账户不存在 | 404 | 联系客服 |

### 通用错误码

| 错误码 | 说明 | HTTP 状态码 |
|--------|------|-------------|
| UNAUTHORIZED | 未授权，需要登录 | 401 |
| INTERNAL_ERROR | 服务器内部错误 | 500 |

---

## 5. 业务逻辑

**核心流程**:
1. 从 JWT token 中解析用户 ID
2. 查询用户的钱包账户
3. 返回当前余额

> 💡 此 API 业务逻辑简单，不需要单独的服务文档。

---

## 6. 示例

### 6.1. 请求示例

**cURL**:
```bash
curl -X GET https://api.example.com/api/wallet/balance \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**JavaScript (Fetch)**:
```javascript
fetch('https://api.example.com/api/wallet/balance', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }
})
  .then(response => response.json())
  .then(data => {
    console.log('当前余额:', data.balance);
  });
```

### 6.2. 响应示例

**成功响应**:
```json
{
  "balance": 1234.56,
  "currency": "CNY",
  "lastUpdatedAt": "2025-12-08T10:30:00Z"
}
```

**错误响应**:
```json
{
  "code": "WALLET_001",
  "message": "钱包账户不存在",
  "details": {}
}
```

---

## 7. 变更历史

| 日期 | 版本 | 变更内容 | 变更人 |
|------|------|---------|--------|
| 2025-12-08 | v1.0.0 | 初始版本 | 后端工程师 |
