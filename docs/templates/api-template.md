---
id: [api-id]
type: api
title: [API 标题]
status: draft
createdAt: '[YYYY-MM-DD]'
updatedAt: '[YYYY-MM-DD]'
description: '[API 的简短描述]'
owner: '[负责人]'
tags: ['[tag1]', '[tag2]']
version: '1.0.0'
apiType: REST # or WebSocket / ThirdParty
endpoint: '/api/v1/[path]'
method: 'GET' # or POST / PUT / DELETE
---

# [METHOD] [ENDPOINT]

## 基本信息

- **API ID**: `[api-id]`
- **状态**: `draft`
- **负责人**: `[负责人]`

## API 概述

[待补充: 详细描述此 API 的功能、用途和业务场景。]

## 请求参数

### 路径参数 (Path Parameters)

| 参数 | 类型 | 描述 |
|---|---|---|
| `[param]` | `[type]` | [参数说明] |

### 查询参数 (Query Parameters)

| 参数 | 类型 | 默认值 | 描述 |
|---|---|---|---|
| `[param]` | `[type]` | `[defaultValue]` | [参数说明] |

### 请求体 (Request Body)

```json
{
  "key": "value"
}
```

| 字段 | 类型 | 必填 | 描述 |
|---|---|---|---|
| `[key]` | `[type]` | [是/否] | [字段说明] |

## 响应格式

### 成功响应 (Success 2xx)

**Status Code**: `200 OK`

```json
{
  "status": "success",
  "data": {}
}
```

## 错误码

| 状态码 | 错误码 | 描述 |
|---|---|---|
| `400` | `INVALID_INPUT` | 请求参数无效。 |
| `404` | `NOT_FOUND` | 资源未找到。 |

## 调用示例

```bash
curl -X [METHOD] \
  https://api.example.com[ENDPOINT] \
  -H 'Content-Type: application/json' \
  -d '{
    "key": "value"
  }'
```

## 被使用的页面/组件

- [@页面或组件名称](../pages/[page-id].md)
- [@页面或组件名称](../components/[component-id].md)

## 变更历史

| 日期 | 版本 | 变更内容 | 变更人 |
|---|---|---|---|
| [YYYY-MM-DD] | v1.0.0 | 初始版本 | [变更人] |
