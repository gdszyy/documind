import { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";

// 实体类型图标
const typeIcons: Record<string, string> = {
  Module: "📦",
  Page: "📄",
  Component: "🧩",
  Service: "🔧",
  API: "📡",
};

// 实体类型颜色
const typeColors: Record<string, string> = {
  Module: "text-green-600",
  Page: "text-pink-600",
  Component: "text-cyan-600",
  Service: "text-purple-600",
  API: "text-orange-600",
};

interface Entity {
  id: number;
  uniqueId: string;
  name: string;
  type: string;
  status: string;
}

interface TreeNode {
  entity: Entity;
  children: TreeNode[];
}

interface EntityTreeNavProps {
  // 是否显示复选框（仅在知识图谱页面显示）
  showCheckboxes?: boolean;
  // 选中的实体ID集合
  selectedEntityIds?: Set<number>;
  // 选中状态变化回调
  onSelectionChange?: (entityIds: Set<number>) => void;
}

export function EntityTreeNav({
  showCheckboxes = false,
  selectedEntityIds = new Set(),
  onSelectionChange,
}: EntityTreeNavProps) {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [allEntityIds, setAllEntityIds] = useState<Set<number>>(new Set());

  // 获取所有实体和关系
  const { data: graphData, isLoading } = trpc.graph.getData.useQuery({});

  useEffect(() => {
    if (!graphData) return;

    // 构建树状结构
    const buildTree = () => {
      const { nodes, edges } = graphData;
      
      // 创建实体映射
      const entityMap = new Map<number, Entity>();
      nodes.forEach((node: any) => {
        entityMap.set(node.id, {
          id: node.id,
          uniqueId: node.uniqueId,
          name: node.name,
          type: node.type,
          status: node.status,
        });
      });

      // 创建父子关系映射
      const childrenMap = new Map<number, number[]>();
      edges.forEach((edge: any) => {
        if (edge.type === "CONTAINS") {
          const children = childrenMap.get(edge.sourceId) || [];
          children.push(edge.targetId);
          childrenMap.set(edge.sourceId, children);
        }
      });

      // 递归构建树节点
      const buildTreeNode = (entityId: number): TreeNode | null => {
        const entity = entityMap.get(entityId);
        if (!entity) return null;

        const childIds = childrenMap.get(entityId) || [];
        const children = childIds
          .map(childId => buildTreeNode(childId))
          .filter((node): node is TreeNode => node !== null);

        return { entity, children };
      };

      // 找到所有根节点（没有被其他节点包含的节点）
      const containedNodeIds = new Set<number>();
      edges.forEach((edge: any) => {
        if (edge.type === "CONTAINS") {
          containedNodeIds.add(edge.targetId);
        }
      });
      
      const rootNodes = nodes
        .filter((node: any) => !containedNodeIds.has(node.id))
        .map((node: any) => buildTreeNode(node.id))
        .filter((node): node is TreeNode => node !== null);

      return rootNodes;
    };

    const tree = buildTree();
    setTreeData(tree);

    // 默认展开所有顶级节点
    const containedNodeIds = new Set<number>();
    graphData.edges.forEach((edge: any) => {
      if (edge.type === "CONTAINS") {
        containedNodeIds.add(edge.targetId);
      }
    });
    const rootNodeIds = graphData.nodes
      .filter((node: any) => !containedNodeIds.has(node.id))
      .map((node: any) => node.id);
    setExpandedNodes(new Set(rootNodeIds));
    
    // 保存所有实体ID
    const allIds = new Set(graphData.nodes.map((node: any) => node.id));
    setAllEntityIds(allIds);
  }, [graphData]);

  const toggleExpand = (entityId: number) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entityId)) {
        newSet.delete(entityId);
      } else {
        newSet.add(entityId);
      }
      return newSet;
    });
  };

  const toggleSelection = (entityId: number, checked: boolean) => {
    if (!onSelectionChange) return;

    const newSelection = new Set(selectedEntityIds);
    if (checked) {
      newSelection.add(entityId);
    } else {
      newSelection.delete(entityId);
    }
    onSelectionChange(newSelection);
  };

  const toggleSelectionWithChildren = (node: TreeNode, checked: boolean) => {
    if (!onSelectionChange) return;

    const newSelection = new Set(selectedEntityIds);
    
    // 递归处理当前节点及其所有子节点
    const processNode = (n: TreeNode) => {
      if (checked) {
        newSelection.add(n.entity.id);
      } else {
        newSelection.delete(n.entity.id);
      }
      n.children.forEach(child => processNode(child));
    };

    processNode(node);
    onSelectionChange(newSelection);
  };

  const renderTreeNode = (node: TreeNode, level: number = 0) => {
    const { entity, children } = node;
    const isExpanded = expandedNodes.has(entity.id);
    const hasChildren = children.length > 0;
    const isSelected = selectedEntityIds.has(entity.id);

    return (
      <div key={entity.id} className="select-none">
        <div
          className={`flex items-center gap-2 py-1.5 px-2 hover:bg-accent/50 rounded-md transition-colors group ${
            level > 0 ? "ml-" + (level * 4) : ""
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          {/* 展开/折叠按钮 */}
          {hasChildren ? (
            <button
              onClick={() => toggleExpand(entity.id)}
              className="h-4 w-4 flex items-center justify-center hover:bg-accent rounded transition-colors shrink-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              )}
            </button>
          ) : (
            <div className="h-4 w-4 shrink-0" />
          )}

          {/* 复选框（仅在知识图谱页面显示） */}
          {showCheckboxes && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => {
                if (hasChildren) {
                  // 如果有子节点，同时选中/取消所有子节点
                  toggleSelectionWithChildren(node, checked as boolean);
                } else {
                  toggleSelection(entity.id, checked as boolean);
                }
              }}
              className="shrink-0"
            />
          )}

          {/* 实体信息 */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-base shrink-0">{typeIcons[entity.type] || "📄"}</span>
            <span
              className={`text-sm truncate ${typeColors[entity.type] || "text-foreground"}`}
              title={entity.name}
            >
              {entity.name}
            </span>
          </div>

          {/* 状态标识 */}
          <span className="text-xs text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            {entity.status}
          </span>
        </div>

        {/* 子节点 */}
        {hasChildren && isExpanded && (
          <div className="mt-0.5">
            {children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (treeData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <p className="text-sm text-muted-foreground">暂无实体数据</p>
      </div>
    );
  }

  // 全选/取消全选功能
  const handleSelectAll = () => {
    if (onSelectionChange) {
      onSelectionChange(new Set(allEntityIds));
    }
  };

  const handleDeselectAll = () => {
    if (onSelectionChange) {
      onSelectionChange(new Set());
    }
  };

  const isAllSelected = selectedEntityIds.size === allEntityIds.size && allEntityIds.size > 0;

  return (
    <div className="flex flex-col h-full">
      {/* 全选/取消全选按钮 */}
      {showCheckboxes && (
        <div className="flex items-center justify-between px-2 py-2 border-b">
          <span className="text-xs text-muted-foreground">
            已选 {selectedEntityIds.size} / {allEntityIds.size}
          </span>
          <div className="flex gap-1">
            <button
              onClick={handleSelectAll}
              className="text-xs px-2 py-1 hover:bg-accent rounded transition-colors"
              disabled={isAllSelected}
            >
              全选
            </button>
            <button
              onClick={handleDeselectAll}
              className="text-xs px-2 py-1 hover:bg-accent rounded transition-colors"
              disabled={selectedEntityIds.size === 0}
            >
              清空
            </button>
          </div>
        </div>
      )}
      
      {/* 树状列表 */}
      <div className="flex-1 overflow-y-auto py-2">
        {treeData.map(node => renderTreeNode(node))}
      </div>
    </div>
  );
}
