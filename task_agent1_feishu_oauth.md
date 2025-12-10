# Agent 1: 飞书OAuth认证系统实现

## 任务目标
替换当前的Manus OAuth为飞书（Lark）OAuth 2.0登录系统

## 输入文件路径
- `/home/ubuntu/documind/backend/server/_core/oauth.ts`
- `/home/ubuntu/documind/backend/server/_core/context.ts`
- `/home/ubuntu/documind/backend/drizzle/schema.ts`

## 技术要求

### 飞书OAuth 2.0流程
1. 用户点击登录 → 跳转到飞书授权页
2. 飞书回调 → 获取 code
3. 用 code 换取 access_token
4. 用 access_token 获取用户信息

### 环境变量
```bash
FEISHU_APP_ID=your_app_id
FEISHU_APP_SECRET=your_app_secret
FEISHU_REDIRECT_URI=http://localhost:5000/api/oauth/callback
```

### 飞书API端点
- 授权页面: `https://open.feishu.cn/open-apis/authen/v1/authorize`
- 获取access_token: `https://open.feishu.cn/open-apis/authen/v1/access_token`
- 获取用户信息: `https://open.feishu.cn/open-apis/authen/v1/user_info`

## 实现要求

### 1. 修改 `server/_core/oauth.ts`
- 实现飞书OAuth授权URL生成
- 实现回调处理逻辑
- 用code换取access_token
- 用access_token获取用户信息
- 创建session并设置cookie

### 2. 修改 `server/_core/context.ts`
- 更新用户上下文获取方式
- 从session token中提取用户信息
- 保持与现有tRPC context兼容

### 3. 检查 `drizzle/schema.ts`
- 确认users表结构是否需要调整
- 确保openId字段可以存储飞书的open_id
- 如需修改，提供迁移SQL

## 输出要求

### 文件输出
1. `/home/ubuntu/documind_output/agent1/oauth.ts` - 修改后的OAuth实现
2. `/home/ubuntu/documind_output/agent1/context.ts` - 修改后的context实现
3. `/home/ubuntu/documind_output/agent1/schema_changes.sql` - 数据库变更（如有）
4. `/home/ubuntu/documind_output/agent1/env_example.txt` - 环境变量配置示例
5. `/home/ubuntu/documind_output/agent1/implementation_notes.md` - 实现说明文档

### 测试要求
- 提供OAuth流程测试说明
- 确保与现有用户系统兼容
- 错误处理完善

## 参考文档
- 飞书OAuth文档: https://open.feishu.cn/document/common-capabilities/sso/api/get-user-info
- 当前实现: 使用Manus SDK进行OAuth

## 注意事项
⚠️ 保持与现有数据库schema兼容
⚠️ 保持session管理逻辑一致
⚠️ 确保cookie设置正确
⚠️ 添加完善的错误处理
