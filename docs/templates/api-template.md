# API 文档模板

> 本模板用于创建 API 接口文档。API 文档是接口契约,定义请求和响应的规格,业务逻辑引用所属的服务文档。

---

```yaml
---
id: {api-id}                     # API 唯一标识符,使用 kebab-case,如: create-deposit
type: api                        # 固定值: api
title: {API 标题}                # API 的中文名称,如: 创建充值订单
relatedService: {service-id}     # 所属服务的 ID,如: deposit-service
method: POST                     # HTTP 方法: GET | POST | PUT | DELETE | PATCH
path: /api/{path}                # API 路径,如: /api/wallet/deposits
status: draft                    # 文档状态: draft | in-design | in-progress | completed | outdated
createdAt: YYYY-MM-DD           # 创建日期
updatedAt: YYYY-MM-DD           # 最后更新日期
author: {作者}                   # 文档作者
---
```

# {API 标题}

## 1. 接口定义

**请求方法**: `{HTTP 方法}`  
**请求路径**: `{API 路径}`  
**所属服务**: [@{服务标题}](../services/{service-id}.md)

**功能描述**: {一句话描述此 API 的功能}

---

## 2. 请求参数

### 2.1. 路径参数

> 如果没有路径参数,可以删除此小节。

| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| {param} | {Type} | 是 | {说明} | `{示例值}` |

### 2.2. 查询参数

> 如果没有查询参数,可以删除此小节。

| 参数 | 类型 | 必填 | 说明 | 默认值 | 示例 |
|------|------|------|------|--------|------|
| {param} | {Type} | 是/否 | {说明} | {默认值} | `{示例值}` |

### 2.3. 请求体参数

> 如果没有请求体,可以删除此小节。

| 参数 | 类型 | 必填 | 说明 | 约束 | 示例 |
|------|------|------|------|------|------|
| {param1} | {Type} | 是 | {说明} | {约束条件} | `{示例值}` |
| {param2} | {Type} | 否 | {说明} | {约束条件} | `{示例值}` |

### 2.4. 请求头

| 参数 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| Authorization | String | 是 | 用户认证令牌 | `Bearer {token}` |
| Content-Type | String | 是 | 请求内容类型 | `application/json` |

---

## 3. 响应数据

### 3.1. 成功响应 (200)

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| {field1} | {Type} | {说明} | `{示例值}` |
| {field2} | {Type} | {说明} | `{示例值}` |

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
| {ERROR_CODE_1} | {错误说明} | 400 | {如何解决} |
| {ERROR_CODE_2} | {错误说明} | 404 | {如何解决} |
| {ERROR_CODE_3} | {错误说明} | 500 | {如何解决} |

### 通用错误码

| 错误码 | 说明 | HTTP 状态码 |
|--------|------|-------------|
| UNAUTHORIZED | 未授权,需要登录 | 401 |
| FORBIDDEN | 无权限访问 | 403 |
| INTERNAL_ERROR | 服务器内部错误 | 500 |

---

## 5. 业务逻辑

详见 [@{服务标题}](../services/{service-id}.md) 的 `{methodName}` 方法。

**核心流程**:
1. {步骤 1}
2. {步骤 2}
3. {步骤 3}

> 💡 如果业务逻辑简单,可以在此直接描述。如果复杂,应引用服务文档。

---

## 6. 示例

### 6.1. 请求示例

**cURL**:
```bash
curl -X {METHOD} https://api.example.com{path} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "{param1}": {value1},
    "{param2}": {value2}
  }'
```

**JavaScript (Fetch)**:
```javascript
fetch('https://api.example.com{path}', {
  method: '{METHOD}',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer {token}'
  },
  body: JSON.stringify({
    {param1}: {value1},
    {param2}: {value2}
  })
})
  .then(response => response.json())
  .then(data => console.log(data));
```

### 6.2. 响应示例

**成功响应**:
```json
{
  "{field1}": {value1},
  "{field2}": {value2}
}
```

**错误响应**:
```json
{
  "code": "{ERROR_CODE}",
  "message": "{错误描述}",
  "details": {}
}
```

---

## 7. 变更历史

| 日期 | 版本 | 变更内容 | 变更人 |
|------|------|---------|--------|
| YYYY-MM-DD | v1.0.0 | 初始版本 | {作者} |

---

## 填写说明

### 必填章节
- 1. 接口定义
- 2. 请求参数
- 3. 响应数据
- 4. 错误码
- 6. 示例

### 可选章节
- 5. 业务逻辑（简单 API 可以在此直接描述,复杂 API 引用服务文档）

### 填写技巧

1. **接口定义**: 明确标注所属服务,方便查找业务逻辑
2. **请求参数**: 
   - 必填字段一定要标注
   - 约束条件要写清楚（如: 10-50000,最多 2 位小数）
   - 提供真实的示例值
3. **响应数据**: 
   - 成功响应和错误响应都要定义
   - 字段说明要完整
4. **错误码**: 
   - 列出所有可能的业务错误码
   - 提供解决方案,方便前端处理
5. **示例**: 
   - 提供可直接运行的 cURL 示例
   - 提供常用编程语言的示例代码

### 参数类型规范

| 类型 | 说明 | 示例 |
|------|------|------|
| String | 字符串 | `"hello"` |
| Number | 数字 | `100` |
| Boolean | 布尔值 | `true` |
| Array | 数组 | `[1, 2, 3]` |
| Object | 对象 | `{"key": "value"}` |
| Enum | 枚举 | `"alipay" \| "wechat" \| "bank"` |
| DateTime | 日期时间 | `"2025-12-08T10:00:00Z"` |
| Decimal | 小数 | `100.50` |

### HTTP 状态码规范

| 状态码 | 说明 | 使用场景 |
|--------|------|---------|
| 200 | 成功 | 请求成功处理 |
| 201 | 已创建 | 资源创建成功 |
| 400 | 请求错误 | 参数校验失败 |
| 401 | 未授权 | 需要登录 |
| 403 | 禁止访问 | 无权限 |
| 404 | 未找到 | 资源不存在 |
| 500 | 服务器错误 | 服务器内部错误 |
