# 知识图谱展示功能修改说明

## 修改时间
2025-12-12

## 修改文件
- `backend/client/src/pages/Graph.tsx`

## 修改内容

### 1. 添加所有实体类型支持

#### 新增类型定义
```typescript
const typeColors: Record<string, string> = {
  service: "#9333ea",      // 紫色
  api: "#ea580c",          // 橙色
  component: "#0891b2",    // 青色
  page: "#db2777",         // 粉色
  module: "#16a34a",       // 绿色
  documentation: "#607D8B", // 灰蓝色（新增）
  document: "#795548",     // 棕色（新增）
};

const typeIcons: Record<string, string> = {
  service: "🔧",
  api: "📡",
  component: "🧩",
  page: "📄",
  module: "📦",
  documentation: "📚",  // 新增
  document: "📝",       // 新增
};

const typeDisplayNames: Record<string, string> = {
  service: "Service",
  api: "API",
  component: "Component",
  page: "Page",
  module: "Module",
  documentation: "Documentation",  // 新增
  document: "Document",            // 新增
};
```

#### 默认隐藏文档类型
```typescript
// 默认选中核心类型，不包含文档类型
const [selectedTypes, setSelectedTypes] = useState<string[]>([
  "service", 
  "api", 
  "component", 
  "page", 
  "module"
]);
```

### 2. 添加图例（Legend）

#### ECharts 配置中添加图例
```typescript
const option: EChartsOption = {
  // ... 其他配置
  
  // 添加图例
  legend: [{
    data: categories.map(c => c.name),
    orient: 'vertical',
    left: 10,
    top: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    textStyle: {
      fontSize: 12,
      color: '#333',
    },
    formatter: (name: string) => {
      // 添加图标到图例
      const type = Object.keys(typeDisplayNames).find(
        key => typeDisplayNames[key] === name
      );
      const icon = type ? typeIcons[type] : "";
      return `${icon} ${name}`;
    },
  }],
  
  series: [{
    type: "graph",
    data: nodes,
    links: links,
    categories: categories,  // 添加分类数据
    // ... 其他配置
  }],
};
```

#### 创建分类数据
```typescript
const categories = Object.keys(typeColors).map((type) => ({
  name: typeDisplayNames[type] || type,
  itemStyle: {
    color: typeColors[type],
  },
}));
```

#### 节点添加分类属性
```typescript
const nodes = data.nodes.map((entity) => {
  const entityType = entity.type.toLowerCase();
  return {
    id: entity.id.toString(),
    name: `${typeIcons[entityType] || "📄"} ${entity.name}`,
    symbolSize: 60,
    category: entityType,  // 用于图例分类
    itemStyle: {
      color: typeColors[entityType] || "#999999",
    },
    // ... 其他属性
  };
});
```

### 3. 改进筛选UI

#### 更新筛选栏布局
```typescript
<div className="flex flex-col gap-4">
  {/* 类型筛选 */}
  <div className="flex items-center gap-3">
    <Label className="text-sm font-medium min-w-[60px]">类型:</Label>
    <div className="flex items-center gap-4 flex-wrap">
      {allEntityTypes.map((type) => (
        <div key={type} className="flex items-center gap-2">
          <Checkbox
            id={`type-${type}`}
            checked={selectedTypes.includes(type)}
            onCheckedChange={() => handleTypeToggle(type)}
          />
          <Label 
            htmlFor={`type-${type}`} 
            className="text-sm cursor-pointer flex items-center gap-1"
            style={{ color: typeColors[type] }}
          >
            <span>{typeIcons[type]}</span>
            <span>{typeDisplayNames[type]}</span>
          </Label>
        </div>
      ))}
    </div>
  </div>
  
  {/* 状态筛选 */}
  {/* ... */}
</div>
```

## 功能特性

### 1. 完整的实体类型支持
- ✅ Module（模块）- 绿色 📦
- ✅ Page（页面）- 粉色 📄
- ✅ Component（组件）- 青色 🧩
- ✅ API - 橙色 📡
- ✅ Service（服务）- 紫色 🔧
- ✅ Documentation（文档）- 灰蓝色 📚
- ✅ Document（普通文档）- 棕色 📝

### 2. 智能默认筛选
- 默认显示核心类型（Module, Page, Component, API, Service）
- 默认隐藏文档类型（Documentation, Document）
- 用户可以手动勾选显示文档类型

### 3. 可视化图例
- 位置：左上角
- 样式：白色半透明背景，带边框
- 内容：显示所有实体类型及其对应颜色和图标
- 交互：点击图例可以显示/隐藏对应类型的节点

### 4. 改进的筛选UI
- 类型筛选和状态筛选分行显示
- 每个类型选项带有对应的颜色和图标
- 更好的视觉层次和可读性

## 向后兼容性

所有修改都保持了向后兼容性：
- 原有的5种类型（Service, API, Component, Page, Module）功能不变
- 新增的类型不影响现有功能
- 默认状态与原有行为一致（不显示文档类型）

## 备份文件

原始文件已备份为：`Graph.tsx.backup`

如需回滚，执行：
```bash
cd backend/client/src/pages
mv Graph.tsx.backup Graph.tsx
```

## 测试建议

1. **基本功能测试**
   - 打开知识图谱页面
   - 确认图例正确显示在左上角
   - 确认默认只显示核心5种类型

2. **筛选功能测试**
   - 勾选/取消勾选不同类型
   - 确认图谱节点正确显示/隐藏
   - 确认图例与筛选联动

3. **文档类型测试**
   - 勾选 Documentation 和 Document 类型
   - 确认文档节点正确显示
   - 确认颜色和图标正确

4. **交互测试**
   - 点击图例项，确认对应类型节点显示/隐藏
   - 拖拽节点，确认布局正常
   - 缩放图谱，确认图例位置固定

5. **响应式测试**
   - 调整浏览器窗口大小
   - 确认图例和筛选栏正常显示
   - 确认图谱自适应调整

## 注意事项

1. **类型名称大小写**
   - 数据库中的类型可能是大写（如 "Service"）
   - 代码中统一转换为小写处理：`entity.type.toLowerCase()`
   - 确保类型匹配时使用小写

2. **颜色对比度**
   - 所有颜色都经过选择，确保在白色和深色背景下都有良好的可读性
   - 文档类型使用较暗的颜色（灰蓝色和棕色），与核心类型区分

3. **图标显示**
   - 使用 Emoji 图标，确保跨平台兼容性
   - 如果某些系统不支持 Emoji，会显示默认的方块字符

## 未来改进建议

1. **自定义图例位置**
   - 允许用户拖拽图例到不同位置
   - 提供图例显示/隐藏开关

2. **类型分组**
   - 将核心类型和文档类型分组显示
   - 添加"全选核心类型"和"全选文档类型"快捷按钮

3. **颜色主题**
   - 支持自定义颜色方案
   - 提供深色模式支持

4. **图例增强**
   - 显示每种类型的节点数量
   - 添加搜索功能，快速定位特定类型的节点

5. **导出功能**
   - 支持导出图谱为图片（PNG/SVG）
   - 导出时包含图例
