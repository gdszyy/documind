import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ExternalLink, Loader2, Plus, Trash2, X, Save, Edit2, Check, EyeOff, Network, Link2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useGraphVisibility } from "@/contexts/GraphVisibilityContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import * as echarts from "echarts";
import type { EChartsOption } from "echarts";

// 扩展类型颜色，包含所有实体类型
const typeColors: Record<string, string> = {
  Service: "#9333ea",
  API: "#ea580c",
  Component: "#0891b2",
  Page: "#db2777",
  Module: "#16a34a",
  Documentation: "#607D8B",
  Document: "#795548",
};

// 扩展类型图标
const typeIcons: Record<string, string> = {
  Service: "🔧",
  API: "📡",
  Component: "🧩",
  Page: "📄",
  Module: "📦",
  Documentation: "📚",
  Document: "📝",
};

// 类型显示名称
const typeDisplayNames: Record<string, string> = {
  Service: "Service",
  API: "API",
  Component: "Component",
  Page: "Page",
  Module: "Module",
  Documentation: "Documentation",
  Document: "Document",
};

// 节点大小配置：按层级设置不同大小
// 页面最大，服务次之，API较小，其他类型依次递减
const typeSizes: Record<string, number> = {
  Page: 80,           // 页面最大
  Service: 70,        // 服务次之（与API链接的服务大于API）
  Module: 65,         // 模块
  Component: 60,      // 组件
  API: 55,            // API
  Documentation: 50,  // 文档类型
  Document: 50,       // 文档
};

const statusColors: Record<string, string> = {
  Development: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Testing: "bg-blue-100 text-blue-800 border-blue-300",
  Production: "bg-green-100 text-green-800 border-green-300",
  Deprecated: "bg-gray-100 text-gray-800 border-gray-300",
};

const relationTypeLabels: Record<string, string> = {
  EXPOSES_API: "暴露 API",
  DEPENDS_ON: "依赖于",
  USES_COMPONENT: "使用组件",
  CONTAINS: "包含",
};

const relationTypeBadgeColors: Record<string, string> = {
  EXPOSES_API: "bg-blue-100 text-blue-800",
  DEPENDS_ON: "bg-purple-100 text-purple-800",
  USES_COMPONENT: "bg-green-100 text-green-800",
  CONTAINS: "bg-orange-100 text-orange-800",
};

export default function Graph() {
  const [, navigate] = useLocation();
  
  // 获取用户信息，用于权限控制
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  // 默认选中核心类型，不包含文档类型
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["Service", "API", "Component", "Page", "Module"]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["Development", "Testing", "Production"]);
  // 使用 Context 来共享节点可见性状态
  const { visibleEntityIds, setVisibleEntityIds } = useGraphVisibility();
  // 维护一个隐藏节点的集合，用于右键隐藏功能
  const [hiddenEntityIds, setHiddenEntityIds] = useState<Set<number>>(new Set());
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);
  const [viewDocUrl, setViewDocUrl] = useState<string | null>(null);
  const [deleteEntityId, setDeleteEntityId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [addRelationState, setAddRelationState] = useState<{ open: boolean; sourceId: number | null }>({ open: false, sourceId: null });
  const [newRelationType, setNewRelationType] = useState<"EXPOSES_API" | "DEPENDS_ON" | "USES_COMPONENT" | "CONTAINS">("DEPENDS_ON");
  const [newRelationTargetIds, setNewRelationTargetIds] = useState<number[]>([]);
  const [newRelationTargetType, setNewRelationTargetType] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  
  // 跟踪当前聚焦的节点和展开层级，用于渐进式展开功能
  const [focusedNodeId, setFocusedNodeId] = useState<number | null>(null);
  const [expandLevel, setExpandLevel] = useState<number>(1);
  
  // 使用 ref 来存储最新的状态值，解决 ECharts 事件回调中的闭包问题
  const focusedNodeIdRef = useRef<number | null>(null);
  const expandLevelRef = useRef<number>(1);
  const visibleEntityIdsRef = useRef<Set<number> | null>(null);
  
  // 同步更新 ref 值
  useEffect(() => {
    focusedNodeIdRef.current = focusedNodeId;
  }, [focusedNodeId]);
  
  useEffect(() => {
    expandLevelRef.current = expandLevel;
  }, [expandLevel]);
  
  useEffect(() => {
    visibleEntityIdsRef.current = visibleEntityIds;
  }, [visibleEntityIds]);

  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    nodeId: number | null;
    nodeName: string;
  }>({ visible: false, x: 0, y: 0, nodeId: null, nodeName: "" });

  // 创建新实体对话框状态（从右键菜单触发）
  const [createEntityDialog, setCreateEntityDialog] = useState<{
    open: boolean;
    relatedNodeId: number | null;
    relatedNodeName: string;
  }>({ open: false, relatedNodeId: null, relatedNodeName: "" });

  // 新建实体表单数据
  const [newEntityFormData, setNewEntityFormData] = useState({
    name: "",
    uniqueId: "",
    type: "Service" as "Service" | "API" | "Component" | "Page" | "Module" | "Documentation" | "Document",
    owner: "",
    status: "Development" as "Development" | "Testing" | "Production" | "Deprecated",
    description: "",
    // 与右键节点的关系配置
    createRelation: true,
    relationDirection: "from" as "from" | "to", // from: 新实体 -> 右键节点, to: 右键节点 -> 新实体
    relationType: "DEPENDS_ON" as "EXPOSES_API" | "DEPENDS_ON" | "USES_COMPONENT" | "CONTAINS",
  });

  useEffect(() => {
    // 对话框打开时重置状态，确保每次都是干净的表单
    if (addRelationState.open) {
      setNewRelationTargetIds([]);
      setNewRelationTargetType(null);
      setNewRelationType("DEPENDS_ON");
    }
  }, [addRelationState.open]);

  // 重置新建实体表单
  useEffect(() => {
    if (createEntityDialog.open) {
      setNewEntityFormData({
        name: "",
        uniqueId: "",
        type: "Service",
        owner: "",
        status: "Development",
        description: "",
        createRelation: true,
        relationDirection: "from",
        relationType: "DEPENDS_ON",
      });
    }
  }, [createEntityDialog.open]);

  const [editFormData, setEditFormData] = useState({
    name: "",
    type: "Service" as "Service" | "API" | "Component" | "Page" | "Module" | "Documentation" | "Document",
    owner: "",
    status: "Development" as "Development" | "Testing" | "Production" | "Deprecated",
    description: "",
    larkDocUrl: "", // 飞书文档链接，匹配后端字段
  });

  const { data, isLoading } = trpc.graph.getData.useQuery({
    types: selectedTypes as any,
    statuses: selectedStatuses as any,
  });

  const { data: selectedEntity, refetch: refetchEntity } = trpc.entities.getById.useQuery(
    { id: selectedEntityId! },
    { enabled: !!selectedEntityId }
  );

  const { data: relationships, refetch: refetchRelationships } = trpc.entities.getRelationships.useQuery(
    { id: selectedEntityId! },
    { enabled: !!selectedEntityId }
  );

  const { data: entitiesList } = trpc.entities.list.useQuery(
    { page: 1, limit: 100, sortBy: "name", order: "asc" },
    { enabled: addRelationState.open }
  );

  const utils = trpc.useUtils();

  const updateMutation = trpc.entities.update.useMutation({
    onSuccess: () => {
      toast.success("实体更新成功");
      utils.graph.getData.invalidate();
      refetchEntity();
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });

  const deleteMutation = trpc.entities.delete.useMutation({
    onSuccess: () => {
      toast.success("实体删除成功");
      utils.graph.getData.invalidate();
      setSelectedEntityId(null);
      setDeleteEntityId(null);
    },
    onError: (error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  const createRelationMutation = trpc.relationships.create.useMutation({
    onSuccess: () => {
      // 单条关系创建成功时不关闭对话框，由 handleAddRelation 统一处理
      refetchRelationships();
      utils.graph.getData.invalidate();
    },
    onError: (error) => {
      toast.error(`创建关系失败: ${error.message}`);
    },
  });

  const deleteRelationMutation = trpc.relationships.delete.useMutation({
    onSuccess: () => {
      toast.success("关系删除成功");
      refetchRelationships();
      utils.graph.getData.invalidate();
    },
    onError: (error) => {
      toast.error(`删除关系失败: ${error.message}`);
    },
  });

  // 创建实体的 mutation
  const createEntityMutation = trpc.entities.create.useMutation({
    onSuccess: async (newEntity) => {
      toast.success("实体创建成功");
      
      // 如果需要创建关系，等待实体创建完成后再创建关系
      if (newEntityFormData.createRelation && createEntityDialog.relatedNodeId && newEntity) {
        try {
          const sourceId = newEntityFormData.relationDirection === "from" 
            ? newEntity.id 
            : createEntityDialog.relatedNodeId;
          const targetId = newEntityFormData.relationDirection === "from" 
            ? createEntityDialog.relatedNodeId 
            : newEntity.id;
          
          await createRelationMutation.mutateAsync({
            sourceId,
            targetId,
            type: newEntityFormData.relationType,
          });
        } catch (error) {
          // 关系创建失败不影响实体创建成功的提示
          console.error("创建关系失败:", error);
        }
      }
      
      utils.graph.getData.invalidate();
      utils.entities.list.invalidate();
      setCreateEntityDialog({ open: false, relatedNodeId: null, relatedNodeName: "" });
    },
    onError: (error) => {
      toast.error(`创建实体失败: ${error.message}`);
    },
  });

  // 当选中实体变化时，更新编辑表单数据
  useEffect(() => {
    if (selectedEntity) {
      setEditFormData({
        name: selectedEntity.name,
        type: selectedEntity.type, // 填充类型字段
        owner: selectedEntity.owner,
        status: selectedEntity.status,
        description: selectedEntity.description || "",
        larkDocUrl: selectedEntity.larkDocUrl || "", // 飞书文档链接，匹配后端字段
      });
      setIsEditing(false);
    }
  }, [selectedEntity]);

  const handleDelete = () => {
    if (deleteEntityId) {
      deleteMutation.mutate({ id: deleteEntityId });
    }
  };

  const handleSave = () => {
    if (selectedEntityId) {
      updateMutation.mutate({
        id: selectedEntityId,
        ...editFormData,
        larkDocUrl: editFormData.larkDocUrl || null, // 确保空字符串被转换为null
      });
    }
  };

  const handleAddRelation = async () => {
    if (!addRelationState.sourceId || newRelationTargetIds.length === 0) {
      toast.error("源实体或目标实体未选择");
      return;
    }

    // 批量创建关系
    let successCount = 0;
    let failCount = 0;
    
    for (const targetId of newRelationTargetIds) {
      try {
        await createRelationMutation.mutateAsync({
          sourceId: addRelationState.sourceId,
          targetId,
          type: newRelationType,
        });
        successCount++;
      } catch (error) {
        failCount++;
        console.error(`创建关系失败 (targetId: ${targetId}):`, error);
      }
    }

    // 显示结果
    if (successCount > 0 && failCount === 0) {
      toast.success(`成功创建 ${successCount} 条关系`);
    } else if (successCount > 0 && failCount > 0) {
      toast.warning(`成功创建 ${successCount} 条关系，${failCount} 条失败`);
    } else {
      toast.error(`创建关系失败`);
    }

    // 关闭对话框并重置状态
    setAddRelationState({ open: false, sourceId: null });
    setNewRelationTargetIds([]);
  };

  const handleDeleteRelation = (relationId: number) => {
    deleteRelationMutation.mutate({ id: relationId });
  };

  // 获取指定层级的关联节点
  const getNodesAtLevel = (centerNodeId: number, level: number): Set<number> => {
    if (!data) return new Set([centerNodeId]);
    
    const result = new Set<number>();
    result.add(centerNodeId);
    
    // 当前层的节点集合
    let currentLevelNodes = new Set<number>([centerNodeId]);
    
    // 逐层向外扩展
    for (let i = 0; i < level; i++) {
      const nextLevelNodes = new Set<number>();
      
      currentLevelNodes.forEach(nodeId => {
        data.edges.forEach(edge => {
          if (edge.sourceId === nodeId && !result.has(edge.targetId)) {
            nextLevelNodes.add(edge.targetId);
            result.add(edge.targetId);
          }
          if (edge.targetId === nodeId && !result.has(edge.sourceId)) {
            nextLevelNodes.add(edge.sourceId);
            result.add(edge.sourceId);
          }
        });
      });
      
      currentLevelNodes = nextLevelNodes;
    }
    
    return result;
  };

  // 展示所有关联节点功能（支持渐进式展开）
  // 使用 ref 获取最新状态值，解决 ECharts 事件回调中的闭包问题
  const handleShowRelatedNodes = (nodeId: number) => {
    if (!data) return;
    
    // 从 ref 中获取最新的状态值
    const currentFocusedNodeId = focusedNodeIdRef.current;
    const currentExpandLevel = expandLevelRef.current;
    const currentVisibleEntityIds = visibleEntityIdsRef.current;
    
    // 检查是否已经处于聚焦状态，且双击的是同一个节点
    if (currentFocusedNodeId === nodeId && currentVisibleEntityIds !== null) {
      // 已经在聚焦状态，再次双击同一节点，向外展开一层
      const newLevel = currentExpandLevel + 1;
      const relatedNodeIds = getNodesAtLevel(nodeId, newLevel);
      
      setExpandLevel(newLevel);
      setVisibleEntityIds(relatedNodeIds);
      setHiddenEntityIds(new Set());
      toast.success(`已展开第 ${newLevel} 层关系，共 ${relatedNodeIds.size} 个节点`);
    } else {
      // 首次双击或双击了不同的节点，重置为第1层
      const relatedNodeIds = getNodesAtLevel(nodeId, 1);
      
      setFocusedNodeId(nodeId);
      setExpandLevel(1);
      setVisibleEntityIds(relatedNodeIds);
      setHiddenEntityIds(new Set());
      toast.success(`已聚焦到节点，展示 ${relatedNodeIds.size} 个直接关联节点`);
    }
  };

  // 关闭右键菜单
  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, nodeId: null, nodeName: "" });
  };

  // 点击页面其他地方关闭右键菜单
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        closeContextMenu();
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [contextMenu.visible]);

  // 处理右键菜单 - 创建新实体
  const handleContextMenuCreateEntity = () => {
    if (contextMenu.nodeId) {
      setCreateEntityDialog({
        open: true,
        relatedNodeId: contextMenu.nodeId,
        relatedNodeName: contextMenu.nodeName,
      });
    }
    closeContextMenu();
  };

  // 处理右键菜单 - 创建新关系
  const handleContextMenuCreateRelation = () => {
    if (contextMenu.nodeId) {
      setAddRelationState({ open: true, sourceId: contextMenu.nodeId });
    }
    closeContextMenu();
  };

  // 处理新建实体表单提交
  const handleCreateEntity = () => {
    if (!newEntityFormData.name || !newEntityFormData.uniqueId || !newEntityFormData.owner) {
      toast.error("请填写必填字段");
      return;
    }

    createEntityMutation.mutate({
      name: newEntityFormData.name,
      uniqueId: newEntityFormData.uniqueId,
      type: newEntityFormData.type,
      owner: newEntityFormData.owner,
      status: newEntityFormData.status,
      description: newEntityFormData.description || undefined,
    });
  };

  // 处理名称变化，自动生成 uniqueId
  const handleNewEntityNameChange = (name: string) => {
    setNewEntityFormData((prev) => ({
      ...prev,
      name,
      uniqueId: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    }));
  };

  // 初始化和更新 ECharts
  useEffect(() => {
    if (!chartRef.current || !data) return;

    // 初始化 ECharts 实例
    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current);
      
      // 添加点击事件
      chartInstanceRef.current.on("click", (params: any) => {
        if (params.dataType === "node") {
          setSelectedEntityId(parseInt(params.data.id));
        }
      });

      // 添加双击事件 - 展示该节点及其所有关联节点
      chartInstanceRef.current.on("dblclick", (params: any) => {
        if (params.dataType === "node") {
          const nodeId = parseInt(params.data.id);
          handleShowRelatedNodes(nodeId);
        }
      });

      // 添加右键事件 - 显示右键菜单
      chartInstanceRef.current.on("contextmenu", (params: any) => {
        if (params.dataType === "node") {
          params.event.event.preventDefault(); // 阻止默认右键菜单
          const nodeId = parseInt(params.data.id);
          const nodeName = params.data.entityData?.name || "";
          const event = params.event.event;
          
          setContextMenu({
            visible: true,
            x: event.clientX,
            y: event.clientY,
            nodeId,
            nodeName,
          });
        }
      });
    }

    // 转换数据为 ECharts 格式
    // 同时考虑 visibleEntityIds 和 hiddenEntityIds
    const filteredNodes = data.nodes.filter(entity => {
      // 如果节点在隐藏集合中，则不显示
      if (hiddenEntityIds.has(entity.id)) return false;
      
      // 如果 visibleEntityIds 为 null，表示所有节点都可见（除了隐藏的）
      if (visibleEntityIds === null) return true;
      
      // 否则，只显示 visibleEntityIds 中的节点
      return visibleEntityIds.has(entity.id);
    });

    const nodes = filteredNodes.map((entity) => {
      const entityType = entity.type; // 不再转换为小写，直接使用大写格式
      // 根据节点类型获取对应的大小，默认为55
      const nodeSize = typeSizes[entityType] || 55;
      return {
        id: entity.id.toString(),
        name: `${typeIcons[entityType] || "📄"} ${entity.name}`,
        symbolSize: nodeSize,
        category: entityType, // 用于图例分类
        itemStyle: {
          color: typeColors[entityType] || "#999999",
        },
          label: {
            show: true,
            color: "#333", // 将文字颜色改为深灰色，提高可读性
            fontSize: 12,
          },
        // 存储原始数据用于点击事件
        entityData: entity,
      };
    });

    // 过滤连线：只显示源和目标都在可见节点中的连线
    const visibleNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = data.edges.filter(edge => 
      visibleNodeIds.has(edge.sourceId) && visibleNodeIds.has(edge.targetId)
    );

    const links = filteredEdges.map((edge) => ({
      source: edge.sourceId.toString(),
      target: edge.targetId.toString(),
      label: {
        show: true,
        formatter: edge.type,
        fontSize: 10,
      },
      lineStyle: {
        curveness: 0.2,
      },
    }));

    // 创建分类数据用于图例
    const categories = Object.keys(typeColors).map((type) => ({
      name: typeDisplayNames[type] || type,
      itemStyle: {
        color: typeColors[type],
      },
    }));

    // 配置 ECharts 选项
    const option: EChartsOption = {
      tooltip: {
        trigger: "item",
        formatter: (params: any) => {
          if (params.dataType === "node") {
            const entity = params.data.entityData;
            return `
              <div style="padding: 8px;">
                <strong>${entity.name}</strong><br/>
                类型: ${entity.type}<br/>
                负责人: ${entity.owner}<br/>
                状态: ${entity.status}
              </div>
            `;
          }
          return "";
        },
      },
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
      series: [
        {
          type: "graph",
          layout: "force",
          data: nodes,
          links: links,
          categories: categories,
          roam: true, // 允许缩放和拖拽
          draggable: true, // 允许拖拽节点
          force: {
            repulsion: 300, // 节点之间的斥力，值越大节点越分散
            gravity: 0.1, // 节点受到的向中心的引力
            edgeLength: 150, // 边的长度
            layoutAnimation: true,
          },
          emphasis: {
            focus: "adjacency", // 高亮相邻节点
            lineStyle: {
              width: 3,
            },
          },
          lineStyle: {
            color: "source",
            curveness: 0.2,
            width: 2,
          },
          edgeSymbol: ["none", "arrow"],
          edgeSymbolSize: 8,
          label: {
            position: "inside",
            fontSize: 12,
          },
        },
      ],
    };

    chartInstanceRef.current.setOption(option);

    // 窗口大小变化时重新调整图表
    const handleResize = () => {
      chartInstanceRef.current?.resize();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [data, visibleEntityIds, hiddenEntityIds]);

  // 清理 ECharts 实例
  useEffect(() => {
    return () => {
      chartInstanceRef.current?.dispose();
      chartInstanceRef.current = null;
    };
  }, []);

  const handleTypeToggle = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleStatusToggle = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const handleCreateRelatedEntity = (relationshipType: string) => {
    if (selectedEntityId) {
      navigate(
        `/entities/new?type=API&relatedTo=${selectedEntityId}&relationshipType=${relationshipType}`
      );
    }
  };

  // 所有可用的实体类型
  const allEntityTypes = ["Module", "Page", "Component", "API", "Service", "Documentation", "Document"];

  return (
    <div className="h-screen flex bg-gray-50">
      {/* 内嵌文档查看器 */}
      {viewDocUrl && (
        <div className="w-1/2 border-r bg-white flex flex-col h-screen">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">文档预览</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(viewDocUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                外部浏览器打开
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewDocUrl(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <iframe
            src={viewDocUrl}
            className="flex-1 w-full"
            title="飞书文档"
          />
        </div>
      )}

      {/* 主内容区域 */}
      <div className={`flex flex-col ${viewDocUrl ? 'w-1/2' : 'flex-1'} h-screen`}>
      {/* 顶部工具栏 */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">知识图谱</h1>
            <p className="text-sm text-gray-600 mt-1">可视化展示所有实体及其关联关系</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/entities">
              <Button variant="outline">实体列表</Button>
            </Link>
            <Link href="/entities/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                创建实体
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="bg-white border-b px-6 py-3">
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
          <div className="flex items-center gap-3">
            <Label className="text-sm font-medium min-w-[60px]">状态:</Label>
            <div className="flex items-center gap-4 flex-wrap">
              {["Development", "Testing", "Production", "Deprecated"].map((status) => (
                <div key={status} className="flex items-center gap-2">
                  <Checkbox
                    id={`status-${status}`}
                    checked={selectedStatuses.includes(status)}
                    onCheckedChange={() => handleStatusToggle(status)}
                  />
                  <Label htmlFor={`status-${status}`} className="text-sm cursor-pointer">
                    {status}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 图谱画布 */}
      <div className="flex-1 relative">
        {/* 聚焦状态提示栏 */}
        {focusedNodeId !== null && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 px-4 py-2 flex items-center gap-3">
            <span className="text-sm text-gray-600">
              当前聚焦第 <span className="font-semibold text-purple-600">{expandLevel}</span> 层关系
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-xs text-gray-500">双击同一节点可继续展开</span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setFocusedNodeId(null);
                setExpandLevel(1);
                setVisibleEntityIds(null);
                setHiddenEntityIds(new Set());
                toast.success("已显示全部节点");
              }}
            >
              <Network className="h-3 w-3 mr-1" />
              显示全部
            </Button>
          </div>
        )}
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            <div ref={chartRef} className="w-full h-full" />
          </>
        )}

        {/* 右键菜单 */}
        {contextMenu.visible && (
          <div
            className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[180px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100">
              节点: {contextMenu.nodeName}
            </div>
            {isAdmin && (
              <>
                <button
                  className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 flex items-center gap-2"
                  onClick={handleContextMenuCreateEntity}
                >
                  <Plus className="h-4 w-4 text-blue-500" />
                  创建新实体
                </button>
                <button
                  className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 flex items-center gap-2"
                  onClick={handleContextMenuCreateRelation}
                >
                  <Link2 className="h-4 w-4 text-green-500" />
                  创建新关系
                </button>
              </>
            )}
            {/* 显示全部节点按钮，仅在聚焦状态时显示 */}
            {focusedNodeId !== null && (
              <button
                className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 flex items-center gap-2"
                onClick={() => {
                  setFocusedNodeId(null);
                  setExpandLevel(1);
                  setVisibleEntityIds(null);
                  setHiddenEntityIds(new Set());
                  closeContextMenu();
                  toast.success("已显示全部节点");
                }}
              >
                <Network className="h-4 w-4 text-purple-500" />
                显示全部节点
              </button>
            )}
          </div>
        )}
      </div>

      {/* 侧边信息面板 - 保持原有代码不变 */}
      <Sheet modal={false} open={!!selectedEntityId} onOpenChange={(open) => !open && setSelectedEntityId(null)}>
        <SheetContent className="w-[450px] overflow-y-auto" hideCloseButton showOverlay={false}>
          {selectedEntity && (
            <>
              <SheetHeader className="pb-6 border-b">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-xl">
                      <span className="text-4xl">{typeIcons[selectedEntity.type]}</span>
                    </div>
                    <div className="flex-1">
                      <SheetTitle className="text-2xl font-bold text-gray-900 mb-2">{selectedEntity.name}</SheetTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs font-medium px-2 py-1">
                          {selectedEntity.type}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`text-xs font-medium px-2 py-1 border ${statusColors[selectedEntity.status]}`}
                        >
                          {selectedEntity.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {isAdmin && (
                    <Button
                      variant={isEditing ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                      className="ml-2 flex-shrink-0"
                    >
                      {isEditing ? (
                        <><X className="h-4 w-4 mr-1" /> 取消</>
                      ) : (
                        <><Edit2 className="h-4 w-4 mr-1" /> 编辑</>
                      )}
                    </Button>
                  )}
                </div>
              </SheetHeader>



              <div className="space-y-5 pt-6">
                {/* 基本信息编辑区 */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                      📊 基本信息
                      {isEditing && (
                        <Badge variant="secondary" className="text-xs">
                          编辑中
                        </Badge>
                      )}
                    </h3>
                  </div>
                  <div className="px-5 py-5 space-y-5">
                    {isEditing ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="edit-type" className="text-sm">类型</Label>
                          <Select value={editFormData.type} disabled>
                            <SelectTrigger id="edit-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {allEntityTypes.map(type => (
                                <SelectItem key={type} value={type}>{typeDisplayNames[type]}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="edit-name" className="text-sm">名称</Label>
                          <Input
                            id="edit-name"
                            value={editFormData.name}
                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                            placeholder="实体名称"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="edit-owner" className="text-sm">负责人</Label>
                          <Input
                            id="edit-owner"
                            value={editFormData.owner}
                            onChange={(e) => setEditFormData({ ...editFormData, owner: e.target.value })}
                            placeholder="负责人"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="edit-status" className="text-sm">状态</Label>
                          <Select
                            value={editFormData.status}
                            onValueChange={(value: any) => setEditFormData({ ...editFormData, status: value })}
                          >
                            <SelectTrigger id="edit-status">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Development">开发中</SelectItem>
                              <SelectItem value="Testing">测试中</SelectItem>
                              <SelectItem value="Production">已上线</SelectItem>
                              <SelectItem value="Deprecated">已废弃</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="edit-description" className="text-sm">描述</Label>
                          <Textarea
                            id="edit-description"
                            value={editFormData.description}
                            onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                            placeholder="实体描述"
                            rows={3}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="edit-lark-doc-url" className="text-sm">文档链接</Label>
                          <Input
                            id="edit-lark-doc-url"
                            value={editFormData.larkDocUrl}
                            onChange={(e) => setEditFormData({ ...editFormData, larkDocUrl: e.target.value })}
                            placeholder="https://feishu.cn/docs/..."
                          />
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={handleSave}
                            disabled={updateMutation.isPending}
                            className="flex-1"
                          >
                            {updateMutation.isPending ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4 mr-2" />
                            )}
                            保存
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsEditing(false);
                              if (selectedEntity) {
                                setEditFormData({
                                  name: selectedEntity.name,
                                  type: selectedEntity.type, // 恢复类型
                                  owner: selectedEntity.owner,
                                  status: selectedEntity.status,
                                  description: selectedEntity.description || "",
                                  larkDocUrl: selectedEntity.larkDocUrl || "", // 确保取消时恢复larkDocUrl
                                });
                              }
                            }}
                            className="flex-1"
                          >
                            取消
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">负责人</Label>
                            <p className="mt-2 text-sm font-semibold text-gray-900">{selectedEntity.owner}</p>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">唯一标识</Label>
                            <p className="mt-2 text-xs font-mono text-gray-700 bg-gray-50 px-2 py-1.5 rounded border border-gray-200">
                              {selectedEntity.uniqueId}
                            </p>
                          </div>
                        </div>

                        {selectedEntity.description && (
                          <div>
                            <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">描述</Label>
                            <p className="mt-2 text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-200">
                              {selectedEntity.description}
                            </p>
                          </div>
                        )}

                        <div>
                          <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">文档链接</Label>
                          {selectedEntity.larkDocUrl ? (
                            <Button
                              onClick={() => setViewDocUrl(selectedEntity.larkDocUrl!)}
                              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all text-sm font-medium shadow-md hover:shadow-lg"
                            >
                              <ExternalLink className="h-4 w-4" />
                              查看文档
                            </Button>
                          ) : (
                            <p className="text-xs text-gray-400 italic">未设置文档链接</p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 关系管理区域 */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                      🔗 关联关系
                    </h3>
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAddRelationState({ open: true, sourceId: selectedEntityId })}
                        className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        添加关系
                      </Button>
                    )}
                  </div>
                  <div className="px-5 py-5">
                    {relationships && (relationships.outgoing?.length > 0 || relationships.incoming?.length > 0) ? (
                      <div className="space-y-3">
                        {/* 出站关系 */}
                        {relationships.outgoing?.map((rel) => (
                          <div
                            key={rel.id}
                            className="flex items-start justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 hover:shadow-md transition-shadow"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${relationTypeBadgeColors[rel.type]}`}
                                >
                                  {relationTypeLabels[rel.type]}
                                </Badge>
                                <span className="text-xs text-gray-400">→</span>
                              </div>
                              {rel.targetEntity ? (
                                <button
                                  type="button"
                                  onClick={() => navigate(`/entities/${rel.targetEntity!.id}/edit`)}
                                  className="text-sm font-medium text-gray-800 hover:text-blue-600 text-left"
                                >
                                  {rel.targetEntity.name}
                                  <span className="text-xs text-gray-500 ml-2">
                                    ({rel.targetEntity.type})
                                  </span>
                                </button>
                              ) : (
                                <p className="text-sm font-medium text-gray-500">
                                  目标实体不存在 (ID: {rel.targetId})
                                </p>
                              )}
                            </div>
                            {isAdmin && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteRelation(rel.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                        {/* 入站关系 */}
                        {relationships.incoming?.map((rel) => (
                          <div
                            key={rel.id}
                            className="flex items-start justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 hover:shadow-md transition-shadow"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-gray-400">←</span>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${relationTypeBadgeColors[rel.type]}`}
                                >
                                  {relationTypeLabels[rel.type]}
                                </Badge>
                              </div>
                              {rel.sourceEntity ? (
                                <button
                                  type="button"
                                  onClick={() => navigate(`/entities/${rel.sourceEntity!.id}/edit`)}
                                  className="text-sm font-medium text-gray-800 hover:text-blue-600 text-left"
                                >
                                  {rel.sourceEntity.name}
                                  <span className="text-xs text-gray-500 ml-2">
                                    ({rel.sourceEntity.type})
                                  </span>
                                </button>
                              ) : (
                                <p className="text-sm font-medium text-gray-500">
                                  源实体不存在 (ID: {rel.sourceId})
                                </p>
                              )}
                            </div>
                            {isAdmin && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteRelation(rel.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-2">🔗</div>
                        <p className="text-sm text-gray-500">暂无关联关系</p>
                        <p className="text-xs text-gray-400 mt-1">点击上方按钮添加关系</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 删除按钮 (仅管理员可见) */}
                {isAdmin && (
                  <div className="pt-2 border-t border-gray-200">
                    <Button
                      variant="destructive"
                      className="w-full bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg transition-all"
                      onClick={() => setDeleteEntityId(selectedEntity.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      删除实体
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* 添加关系对话框 */}
      <Dialog open={addRelationState.open} onOpenChange={(open) => setAddRelationState({ ...addRelationState, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加关联关系</DialogTitle>
            <DialogDescription>
              为当前实体添加一个新的关联关系
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="relation-type">关系类型</Label>
              <Select
                value={newRelationType}
                onValueChange={(value: any) => setNewRelationType(value)}
              >
                <SelectTrigger id="relation-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXPOSES_API">暴露 API</SelectItem>
                  <SelectItem value="DEPENDS_ON">依赖于</SelectItem>
                  <SelectItem value="USES_COMPONENT">使用组件</SelectItem>
                  <SelectItem value="CONTAINS">包含</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target-entity-type">目标实体类型 (可选)</Label>
              <Select
                value={newRelationTargetType || "all"}
                onValueChange={(value) => {
                  setNewRelationTargetType(value === "all" ? null : value);
                  setNewRelationTargetIds([]); // 切换类型时重置目标实体
                }}
              >
                <SelectTrigger id="target-entity-type">
                  <SelectValue placeholder="选择实体类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有类型</SelectItem>
                  <SelectItem value="Service">Service</SelectItem>
                  <SelectItem value="API">API</SelectItem>
                  <SelectItem value="Component">Component</SelectItem>
                  <SelectItem value="Page">Page</SelectItem>
                  <SelectItem value="Module">Module</SelectItem>
                  <SelectItem value="Documentation">Documentation</SelectItem>
                  <SelectItem value="Document">Document</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>目标实体 (可多选)</Label>
              {newRelationTargetIds.length > 0 && (
                <div className="text-sm text-gray-500 mb-2">
                  已选择 {newRelationTargetIds.length} 个实体
                </div>
              )}
              <div className="border rounded-md max-h-[200px] overflow-y-auto">
                {entitiesList?.items
                  ?.filter((e) => e.id !== addRelationState.sourceId)
                  ?.filter((e) => !newRelationTargetType || e.type === newRelationTargetType)
                  .map((entity) => (
                    <div
                      key={entity.id}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                      onClick={() => {
                        setNewRelationTargetIds((prev) =>
                          prev.includes(entity.id)
                            ? prev.filter((id) => id !== entity.id)
                            : [...prev, entity.id]
                        );
                      }}
                    >
                      <Checkbox
                        checked={newRelationTargetIds.includes(entity.id)}
                        onCheckedChange={(checked) => {
                          setNewRelationTargetIds((prev) =>
                            checked
                              ? [...prev, entity.id]
                              : prev.filter((id) => id !== entity.id)
                          );
                        }}
                      />
                      <span className="text-sm">
                        {typeIcons[entity.type]} {entity.name} ({entity.type})
                      </span>
                    </div>
                  ))}
                {entitiesList?.items?.filter((e) => e.id !== addRelationState.sourceId)?.filter((e) => !newRelationTargetType || e.type === newRelationTargetType).length === 0 && (
                  <div className="px-3 py-4 text-sm text-gray-500 text-center">
                    没有可选的实体
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddRelationState({ open: false, sourceId: null })}>
              取消
            </Button>
            <Button onClick={handleAddRelation} disabled={newRelationTargetIds.length === 0 || createRelationMutation.isPending}>
              {createRelationMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              添加 {newRelationTargetIds.length > 0 && `(${newRelationTargetIds.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 创建新实体对话框（从右键菜单触发） */}
      <Dialog open={createEntityDialog.open} onOpenChange={(open) => setCreateEntityDialog({ ...createEntityDialog, open })}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>创建新实体</DialogTitle>
            <DialogDescription>
              创建一个新实体，并可选择与 "{createEntityDialog.relatedNodeName}" 建立关系
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* 基本信息 */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-gray-700 border-b pb-2">基本信息</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-entity-name">
                    名称 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="new-entity-name"
                    value={newEntityFormData.name}
                    onChange={(e) => handleNewEntityNameChange(e.target.value)}
                    placeholder="例如：用户认证服务"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-entity-uniqueId">
                    唯一标识 (ID) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="new-entity-uniqueId"
                    value={newEntityFormData.uniqueId}
                    onChange={(e) => setNewEntityFormData({ ...newEntityFormData, uniqueId: e.target.value })}
                    placeholder="例如：user-auth-service"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-entity-type">
                    类型 <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={newEntityFormData.type}
                    onValueChange={(value: any) => setNewEntityFormData({ ...newEntityFormData, type: value })}
                  >
                    <SelectTrigger id="new-entity-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Service">服务</SelectItem>
                      <SelectItem value="API">API</SelectItem>
                      <SelectItem value="Component">组件</SelectItem>
                      <SelectItem value="Page">页面</SelectItem>
                      <SelectItem value="Module">模块</SelectItem>
                      <SelectItem value="Documentation">文档</SelectItem>
                      <SelectItem value="Document">说明文档</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-entity-owner">
                    负责人 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="new-entity-owner"
                    value={newEntityFormData.owner}
                    onChange={(e) => setNewEntityFormData({ ...newEntityFormData, owner: e.target.value })}
                    placeholder="例如：张三"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-entity-status">状态</Label>
                <Select
                  value={newEntityFormData.status}
                  onValueChange={(value: any) => setNewEntityFormData({ ...newEntityFormData, status: value })}
                >
                  <SelectTrigger id="new-entity-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Development">开发中</SelectItem>
                    <SelectItem value="Testing">测试中</SelectItem>
                    <SelectItem value="Production">已上线</SelectItem>
                    <SelectItem value="Deprecated">已废弃</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-entity-description">描述</Label>
                <Textarea
                  id="new-entity-description"
                  value={newEntityFormData.description}
                  onChange={(e) => setNewEntityFormData({ ...newEntityFormData, description: e.target.value })}
                  placeholder="实体描述..."
                  rows={3}
                />
              </div>
            </div>

            {/* 关系配置 */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-gray-700 border-b pb-2">
                与 "{createEntityDialog.relatedNodeName}" 的关系配置
              </h4>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="create-relation"
                  checked={newEntityFormData.createRelation}
                  onCheckedChange={(checked) => 
                    setNewEntityFormData({ ...newEntityFormData, createRelation: checked as boolean })
                  }
                />
                <Label htmlFor="create-relation" className="text-sm cursor-pointer">
                  创建与该节点的关系
                </Label>
              </div>

              {newEntityFormData.createRelation && (
                <div className="pl-6 space-y-4 border-l-2 border-blue-200">
                  <div className="space-y-2">
                    <Label htmlFor="relation-direction">关系方向</Label>
                    <Select
                      value={newEntityFormData.relationDirection}
                      onValueChange={(value: "from" | "to") => 
                        setNewEntityFormData({ ...newEntityFormData, relationDirection: value })
                      }
                    >
                      <SelectTrigger id="relation-direction">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="from">
                          新实体 → {createEntityDialog.relatedNodeName}
                        </SelectItem>
                        <SelectItem value="to">
                          {createEntityDialog.relatedNodeName} → 新实体
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-relation-type">关系类型</Label>
                    <Select
                      value={newEntityFormData.relationType}
                      onValueChange={(value: any) => 
                        setNewEntityFormData({ ...newEntityFormData, relationType: value })
                      }
                    >
                      <SelectTrigger id="new-relation-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DEPENDS_ON">依赖于</SelectItem>
                        <SelectItem value="EXPOSES_API">暴露 API</SelectItem>
                        <SelectItem value="USES_COMPONENT">使用组件</SelectItem>
                        <SelectItem value="CONTAINS">包含</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 关系预览 */}
                  <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    <span className="text-gray-500">关系预览：</span>
                    <div className="mt-1 font-medium text-gray-700">
                      {newEntityFormData.relationDirection === "from" ? (
                        <>
                          <span className="text-blue-600">{newEntityFormData.name || "新实体"}</span>
                          <span className="mx-2 text-gray-400">—[{relationTypeLabels[newEntityFormData.relationType]}]→</span>
                          <span className="text-green-600">{createEntityDialog.relatedNodeName}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-green-600">{createEntityDialog.relatedNodeName}</span>
                          <span className="mx-2 text-gray-400">—[{relationTypeLabels[newEntityFormData.relationType]}]→</span>
                          <span className="text-blue-600">{newEntityFormData.name || "新实体"}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setCreateEntityDialog({ open: false, relatedNodeId: null, relatedNodeName: "" })}
            >
              取消
            </Button>
            <Button 
              onClick={handleCreateEntity}
              disabled={createEntityMutation.isPending || !newEntityFormData.name || !newEntityFormData.uniqueId || !newEntityFormData.owner}
            >
              {createEntityMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={!!deleteEntityId} onOpenChange={(open) => !open && setDeleteEntityId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将永久删除该实体及其所有关联关系。此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
}
