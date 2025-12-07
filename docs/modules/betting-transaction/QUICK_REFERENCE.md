# 投注交易模块快速参考

## 页面 (5个)

| 页面名称 | ID | 路由 |
| :--- | :--- | :--- |
| 赛事列表页 | `event-list` | `/events` |
| 赛事详情页 | `event-detail` | `/events/:eventId` |
| 实时赛事页 | `live-event` | `/live` |
| 赛果查询页 | `results` | `/results` |
| 数据中心页 | `data-hub` | `/data-hub` |

---

## 全局组件 (6个)

| 组件名称 | ID | 类型 | 说明 |
| :--- | :--- | :--- | :--- |
| 投注栏 | `bet-slip` | `global` | 包含Slip/Open/Settled三Tab |
| 顶部导航栏 | `navbar` | `global` | 站点级导航 |
| 体育/联赛导航 | `league-navigation` | `global` | 侧边栏筛选 |
| 底部导航 | `bottom-nav` | `global` | 移动端导航 |
| 模态消息 | `modal-message` | `global` | 中断式提示 |
| Toast | `toast` | `global` | 非侵入式通知 |

---

## 普通组件 (12个)

### 赛事展示类 (3个)
- `event-card` - 赛事卡片
- `event-info` - 赛事信息
- `odds-list` - 盘口列表

### 交互与筛选类 (3个)
- `match-filter` - 比赛筛选器
- `breadcrumb-nav` - 面包屑导航
- `search-box` - 搜索框

### 内容展示类 (2个)
- `carousel-banner` - 轮播Banner
- `hot-matches` - 热门赛事

### 投注单管理类 (4个)
- `bet-item` - 注单项
- `bet-amount-input` - 投注额输入框
- `quick-amount-selector` - 快捷金额选择器
- `parlay-type-selector` - 串关类型选择器

---

## API (7个)

| API 名称 | ID |
| :--- | :--- |
| 提交投注 | `place-bet` |
| 获取用户余额 | `get-user-balance` |
| 验证投注 | `validate-bet` |
| 获取赛事列表 | `get-event-list` |
| 获取赛事详情 | `get-event-detail` |
| 获取待结算注单 | `get-open-bets` |
| 获取已结算注单 | `get-settled-bets` |

---

## 投注栏Tab结构

| Tab | 功能 |
| :--- | :--- |
| **Slip** (注单) | 用户当前选择的、尚未提交的投注项 |
| **Open** (待结算) | 已提交但尚未结算的注单 |
| **Settled** (已结算) | 已完成结算的注单，可跳转到完整历史 |
