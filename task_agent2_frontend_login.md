# Agent 2: 前端登录入口更新

## 任务目标
更新前端登录逻辑以适配飞书OAuth登录

## 输入文件路径
- `/home/ubuntu/documind/backend/client/src/const.ts`
- `/home/ubuntu/documind/backend/client/src/_core/` (认证相关组件)

## 技术要求

### 飞书登录URL格式
```
https://open.feishu.cn/open-apis/authen/v1/authorize?
  app_id={APP_ID}&
  redirect_uri={REDIRECT_URI}&
  state={STATE}
```

### 环境变量
```bash
VITE_FEISHU_APP_ID=your_app_id
VITE_FEISHU_REDIRECT_URI=http://localhost:5000/api/oauth/callback
```

## 实现要求

### 1. 修改 `client/src/const.ts`
- 更新 `getLoginUrl()` 函数
- 生成飞书OAuth授权URL
- 生成随机state参数
- 正确编码redirect_uri

### 2. 检查认证组件
- 检查 `client/src/_core/` 下的认证相关组件
- 确保登录按钮文案和样式适配飞书
- 更新登录流程说明（如有）

### 3. 用户体验优化
- 保持登录按钮位置和样式一致
- 添加"使用飞书登录"文案
- 确保登录跳转流畅

## 输出要求

### 文件输出
1. `/home/ubuntu/documind_output/agent2/const.ts` - 修改后的常量配置
2. `/home/ubuntu/documind_output/agent2/auth_components/` - 修改后的认证组件（如有）
3. `/home/ubuntu/documind_output/agent2/env_example.txt` - 前端环境变量示例
4. `/home/ubuntu/documind_output/agent2/implementation_notes.md` - 实现说明文档

### 测试要求
- 提供前端登录流程测试说明
- 确保登录跳转正确
- 验证state参数生成和验证

## 注意事项
⚠️ 确保redirect_uri与后端配置一致
⚠️ state参数需要随机生成并验证
⚠️ 处理登录失败的错误提示
⚠️ 保持用户体验流畅
