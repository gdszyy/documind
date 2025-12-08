---
id: create-deposit
type: api
title: 创建充值订单
relatedService: deposit-service
method: POST
path: /api/wallet/deposits
status: completed
createdAt: '2025-12-08'
updatedAt: '2025-12-08'
author: '后端工程师'
---

# 创建充值订单

## 1. 接口定义

**请求方法**: `POST`  
**请求路径**: `/api/wallet/deposits`  
**所属服务**: [@充值服务](../services/deposit-service.md)

**功能描述**: 创建充值订单并返回支付链接

---

## 2. 请求参数

### 2.1. 请求体参数

| 参数 | 类型 | 必填 | 说明 | 约束 | 示例 |
|------|------|------|------|------|------|
| amount | Number | 是 | 充值金额 | 10.00-50000.00，最多 2 位小数 | `100.00` |
| paymentMethod | String | 是 | 支付方式 | alipay \| wechat \| bank | `"alipay"` |

### 2.2. 请求头

| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| Authorization | String | 是 | 用户认证令牌 | `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| Content-Type | String | 是 | 请求内容类型 | `application/json` |

---

## 3. 响应数据

### 3.1. 成功响应 (200)

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| orderId | String | 订单 ID | `"550e8400-e29b-41d4-a716-446655440000"` |
| paymentUrl | String | 支付链接 | `"https://pay.example.com/order/xxx"` |
| expiredAt | String | 订单过期时间 | `"2025-12-08T11:00:00Z"` |

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
| DEPOSIT_001 | 充值金额不符合规则 | 400 | 检查金额是否在 10-50000 元之间 |
| DEPOSIT_002 | 不支持的支付方式 | 400 | 使用 alipay、wechat 或 bank |
| DEPOSIT_003 | 触发风控规则 | 429 | 24小时内充值次数过多，请稍后再试 |
| DEPOSIT_004 | 创建支付订单失败 | 500 | 第三方支付接口异常，请稍后重试 |

### 通用错误码

| 错误码 | 说明 | HTTP 状态码 |
|--------|------|-------------|
| UNAUTHORIZED | 未授权，需要登录 | 401 |
| FORBIDDEN | 无权限访问 | 403 |
| INTERNAL_ERROR | 服务器内部错误 | 500 |

---

## 5. 业务逻辑

详见 [@充值服务](../services/deposit-service.md) 的 `createDepositOrder` 方法。

**核心流程**:
1. 验证充值金额（10-50000 元）
2. 验证支付方式
3. 风控检查（24小时充值次数、单日充值总额）
4. 创建充值订单记录
5. 调用第三方支付接口生成支付链接
6. 返回订单信息和支付链接

---

## 6. 示例

### 6.1. 请求示例

**cURL**:
```bash
curl -X POST https://api.example.com/api/wallet/deposits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "amount": 100.00,
    "paymentMethod": "alipay"
  }'
```

**JavaScript (Fetch)**:
```javascript
fetch('https://api.example.com/api/wallet/deposits', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  },
  body: JSON.stringify({
    amount: 100.00,
    paymentMethod: 'alipay'
  })
})
  .then(response => response.json())
  .then(data => {
    // 跳转到支付链接
    window.location.href = data.paymentUrl;
  });
```

### 6.2. 响应示例

**成功响应**:
```json
{
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "paymentUrl": "https://pay.example.com/order/xxx",
  "expiredAt": "2025-12-08T11:00:00Z"
}
```

**错误响应**:
```json
{
  "code": "DEPOSIT_001",
  "message": "充值金额不符合规则，金额必须在 10-50000 元之间",
  "details": {
    "minAmount": 10.00,
    "maxAmount": 50000.00,
    "providedAmount": 5.00
  }
}
```

---

## 7. 变更历史

| 日期 | 版本 | 变更内容 | 变更人 |
|------|------|---------|--------|
| 2025-12-08 | v1.0.0 | 初始版本 | 后端工程师 |
