# 知识图谱节点悬浮交互功能说明

## 功能概述

为documind项目的知识图谱添加了节点悬浮交互功能，提升用户操作体验。

## 新增功能

### 1. 隐藏节点按钮

**位置**：节点文本上方  
**图标**：EyeOff（眼睛关闭图标）  
**功能**：点击后隐藏当前节点  
**样式**：
- 白色背景，红色图标
- 悬浮时背景变为浅红色
- 带有阴影和边框效果
- 悬浮时有缩放动画

### 2. 展示全部关联节点按钮

**位置**：节点文本下方  
**图标**：Network（网络图标）  
**功能**：点击后展示所有与该节点直接关联的节点  
**特性**：
- 控制左侧树状导航的选中状态
- 不影响顶部的类型和状态筛选
- 自动计算并展示所有入站和出站关联节点
**样式**：
- 白色背景，蓝色图标
- 悬浮时背景变为浅蓝色
- 带有阴影和边框效果
- 悬浮时有缩放动画

## 技术实现

### 核心技术点

1. **ECharts事件监听**
   - 使用`mousemove`事件捕获节点悬浮
   - 使用`mouseout`事件处理鼠标离开
   - 使用`convertToPixel`方法获取节点在画布上的精确位置

2. **React状态管理**
   - `hoveredNodeId`：当前悬浮的节点ID
   - `hoveredNodePosition`：悬浮节点的屏幕坐标
   - `visibleEntityIds`：通过Context共享的可见节点集合

3. **悬浮层实现**
   - 使用绝对定位的div层覆盖在ECharts画布上
   - 通过`pointer-events-auto`确保按钮可点击
   - 使用`transform: translate(-50%, -50%)`实现居中对齐

4. **关联节点计算**
   ```typescript
   const relatedNodeIds = new Set<number>();
   relatedNodeIds.add(nodeId); // 包含自己
   
   data.edges.forEach(edge => {
     if (edge.sourceId === nodeId) {
       relatedNodeIds.add(edge.targetId);
     }
     if (edge.targetId === nodeId) {
       relatedNodeIds.add(edge.sourceId);
     }
   });
   ```

### 关键代码片段

#### 悬浮按钮层
```tsx
{hoveredNodeId !== null && hoveredNodePosition !== null && (
  <div
    ref={hoverButtonsRef}
    className="absolute pointer-events-auto z-50"
    style={{
      left: `${hoveredNodePosition.x}px`,
      top: `${hoveredNodePosition.y}px`,
      transform: 'translate(-50%, -50%)',
    }}
  >
    <div className="flex flex-col items-center gap-2">
      {/* 隐藏按钮 */}
      <button onClick={() => handleHideNode(hoveredNodeId)}>
        <EyeOff className="h-4 w-4" />
      </button>
      
      {/* 节点占位 */}
      <div className="h-[60px]" />
      
      {/* 展示关联节点按钮 */}
      <button onClick={() => handleShowRelatedNodes(hoveredNodeId)}>
        <Network className="h-4 w-4" />
      </button>
    </div>
  </div>
)}
```

## 用户体验优化

1. **延迟隐藏机制**
   - 鼠标离开节点后有100ms延迟
   - 允许用户将鼠标移动到按钮上
   - 避免按钮闪烁消失

2. **视觉反馈**
   - 按钮悬浮时有缩放动画（scale-110）
   - 不同功能使用不同颜色区分（红色/蓝色）
   - 使用阴影和边框增强立体感

3. **Toast提示**
   - 隐藏节点时提示"节点已隐藏"
   - 展示关联节点时提示节点数量

## 与现有功能的集成

### GraphVisibilityContext

功能通过现有的`GraphVisibilityContext`实现：
- 隐藏节点：从`visibleEntityIds`中移除节点ID
- 展示关联节点：更新`visibleEntityIds`为关联节点集合
- 与左侧树状导航完美联动

### 不影响顶部筛选

- 顶部筛选控制`selectedTypes`和`selectedStatuses`
- 节点交互功能只修改`visibleEntityIds`
- 两者独立工作，互不干扰

## 兼容性说明

- 保持所有原有功能不变
- 不影响节点点击事件（打开侧边栏）
- 不影响图例交互
- 不影响图谱缩放和拖拽

## 使用场景

1. **聚焦关注**：隐藏无关节点，专注于重要实体
2. **关系探索**：快速查看某个节点的所有直接关联
3. **复杂图谱简化**：逐步隐藏节点，简化视图
4. **关系链追踪**：从一个节点开始，逐步展开关联关系

## 后续优化建议

1. **批量操作**
   - 添加"显示所有节点"按钮
   - 添加"隐藏所有未关联节点"功能

2. **历史记录**
   - 记录隐藏/展示操作历史
   - 支持撤销/重做功能

3. **高级筛选**
   - 支持按关系类型筛选关联节点
   - 支持多级关联展示（二度、三度关联）

4. **视觉增强**
   - 高亮显示关联路径
   - 动画过渡效果

## 修改文件

- `backend/client/src/pages/Graph.tsx`

## 提交信息

```
feat: 添加知识图谱节点悬浮交互功能

- 在节点上方添加隐藏按钮（EyeOff图标）
- 在节点下方添加展示全部关联节点按钮（Network图标）
- 展示关联节点功能控制左侧树状导航选中状态
- 不影响顶部筛选功能
- 使用悬浮层实现交互按钮，提升用户体验
```

## 测试建议

1. **基本功能测试**
   - 鼠标悬浮在节点上，确认按钮正确显示
   - 点击隐藏按钮，确认节点被隐藏
   - 点击展示关联按钮，确认只显示关联节点

2. **交互测试**
   - 确认按钮不影响节点点击事件
   - 确认鼠标移动到按钮上时按钮不消失
   - 确认按钮悬浮效果正常

3. **集成测试**
   - 确认与顶部筛选功能独立工作
   - 确认与图例交互不冲突
   - 确认与侧边栏联动正常

4. **边界测试**
   - 测试孤立节点（无关联）的展示功能
   - 测试高度关联节点的展示功能
   - 测试快速切换节点的响应
