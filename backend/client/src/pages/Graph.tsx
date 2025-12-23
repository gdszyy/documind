import { useAuth } from "@/_core/hooks/useAuth";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Trash2, Edit2, Download, Link2, Network, FileEdit, Search } from "lucide-react";
import EntityEditSidebar from "@/components/EntityEditSidebar";
import { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import * as echarts from "echarts";
import type { EChartsOption } from "echarts";

const typeColors = {
  Service: "#9333ea",
  API: "#ea580c",
  Component: "#0891b2",
  Page: "#db2777",
  Module: "#16a34a",
  Documentation: "#607D8B",
  Document: "#795548",
};

const typeIcons = {
  Service: "🔧",
  API: "📡",
  Component: "🧩",
  Page: "📄",
  Module: "📦",
  Documentation: "📚",
  Document: "📝",
};

const typeDisplayNames = {
  Service: "Service",
  API: "API",
  Component: "Component",
  Page: "Page",
  Module: "Module",
  Documentation: "Documentation",
  Document: "Document",
};

const statusColors = {
  Development: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Testing: "bg-blue-100 text-blue-800 border-blue-300",
  Production: "bg-green-100 text-green-800 border-green-300",
  Deprecated: "bg-gray-100 text-gray-800 border-gray-300",
};

const relationTypeLabels = {
  EXPOSES_API: "暴露 API",
  DEPENDS_ON: "依赖于",
  USES_COMPONENT: "使用组件",
  CONTAINS: "包含",
};

const relationTypeBadgeColors = {
  EXPOSES_API: "bg-blue-100 text-blue-800",
  DEPENDS_ON: "bg-purple-100 text-purple-800",
  USES_COMPONENT: "bg-green-100 text-green-800",
  CONTAINS: "bg-orange-100 text-orange-800",
};

// 节点类型层级定义：模块 > 页面 > 组件 > API < 服务
// 层级数字越小表示越高级，展开时只展示同级或下级节点
const typeHierarchy: Record<string, number> = {
  Module: 1,      // 模块 - 最高级
  Page: 2,        // 页面
  Component: 3,   // 组件
  API: 4,         // API
  Service: 4,     // 服务 - 与 API 同级
  Documentation: 5, // 文档
  Document: 5,    // 说明文档
};

// 节点大小配置：按层级调整大小
const typeSizes: Record<string, number> = {
  Module: 70,
  Page: 65,
  Component: 60,
  API: 55,
  Service: 55,
  Documentation: 50,
  Document: 50,
};

// 检查目标节点是否为同级或下级节点
const isAllowedExpansion = (sourceType: string, targetType: string): boolean => {
  const sourceLevel = typeHierarchy[sourceType] ?? 99;
  const targetLevel = typeHierarchy[targetType] ?? 99;
  // 允许同级或下级节点（目标层级 >= 源层级）
  return targetLevel >= sourceLevel;
};

export default function Graph() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["Service", "API", "Component", "Page", "Module"]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["Development", "Testing", "Production"]);
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);
  const [deleteEntityId, setDeleteEntityId] = useState<number | null>(null);
  const [contextMenuEntity, setContextMenuEntity] = useState<{ id: number; x: number; y: number; name: string } | null>(null); // 右键菜单状态
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  // 双击展开功能：跟踪当前聚焦的节点和展开层级
  const [focusedNodeId, setFocusedNodeId] = useState<number | null>(null);
  const [expandLevel, setExpandLevel] = useState<number>(1);
  const [visibleEntityIds, setVisibleEntityIds] = useState<Set<number> | null>(null);

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

  // 添加关系对话框状态
  const [addRelationState, setAddRelationState] = useState<{ open: boolean; sourceId: number | null; sourceName: string }>({ open: false, sourceId: null, sourceName: "" });
  const [newRelationType, setNewRelationType] = useState<string>("DEPENDS_ON");
  const [newRelationTargetIds, setNewRelationTargetIds] = useState<number[]>([]);
  const [newRelationTargetType, setNewRelationTargetType] = useState<string | null>(null);
  const [entitySearchQuery, setEntitySearchQuery] = useState("");

  // 创建实体对话框状态
  const [createEntityDialog, setCreateEntityDialog] = useState<{ open: boolean; relatedNodeId: number | null; relatedNodeName: string }>({ open: false, relatedNodeId: null, relatedNodeName: "" });
  const [newEntityFormData, setNewEntityFormData] = useState({
    name: "",
    uniqueId: "",
    type: "Service" as "Service" | "API" | "Component" | "Page" | "Module" | "Documentation" | "Document",
    owner: "",
    status: "Development" as "Development" | "Testing" | "Production" | "Deprecated",
    description: "",
    createRelation: true,
    relationType: "DEPENDS_ON" as "EXPOSES_API" | "DEPENDS_ON" | "USES_COMPONENT" | "CONTAINS",
    relationDirection: "to" as "from" | "to", // from: 新实体 -> 相关节点, to: 相关节点 -> 新实体
  });

  // 添加日志：监控selectedTypes和selectedStatuses的变化
  useEffect(() => {
    console.log("[Graph] selectedTypes changed:", selectedTypes);
  }, [selectedTypes]);

  useEffect(() => {
    console.log("[Graph] selectedStatuses changed:", selectedStatuses);
  }, [selectedStatuses]);

  const { data, isLoading } = trpc.graph.getData.useQuery({
    types: selectedTypes as any,
    statuses: selectedStatuses as any,
  });

  // 使用 ref 存储 data，解决 ECharts 事件回调中的闭包问题
  const dataRef = useRef<typeof data>(null);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // 添加日志：监控data的变化
  useEffect(() => {
    if (data) {
      console.log("[Graph] data received from API:", {
        nodesCount: data.nodes?.length || 0,
        edgesCount: data.edges?.length || 0,
      });
    } else {
      console.log("[Graph] data is null/undefined");
    }
  }, [data]);

  const utils = trpc.useUtils();

  // 获取实体列表用于添加关系对话框
  const { data: entitiesList } = trpc.entities.list.useQuery({ page: 1, pageSize: 1000 });

  // 创建关系的 mutation
  const createRelationMutation = trpc.relationships.create.useMutation({
    onSuccess: () => {
      toast.success("关系创建成功");
      utils.graph.getData.invalidate();
      setAddRelationState({ open: false, sourceId: null, sourceName: "" });
      setNewRelationTargetIds([]);
      setNewRelationType("DEPENDS_ON");
      setNewRelationTargetType(null);
      setEntitySearchQuery("");
    },
    onError: (error) => {
      toast.error(`创建关系失败: ${error.message}`);
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
          console.error("创建关系失败:", error);
        }
      }
      
      utils.graph.getData.invalidate();
      utils.entities.list.invalidate();
      setCreateEntityDialog({ open: false, relatedNodeId: null, relatedNodeName: "" });
      // 重置表单
      setNewEntityFormData({
        name: "",
        uniqueId: "",
        type: "Service",
        owner: "",
        status: "Development",
        description: "",
        createRelation: true,
        relationType: "DEPENDS_ON",
        relationDirection: "to",
      });
    },
    onError: (error) => {
      toast.error(`创建实体失败: ${error.message}`);
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

  const handleDelete = () => {
    if (deleteEntityId) {
      deleteMutation.mutate({ id: deleteEntityId });
    }
  };

  // 从右键菜单打开侧边栏
  const handleOpenSidebarFromContextMenu = () => {
    if (contextMenuEntity) {
      setSelectedEntityId(contextMenuEntity.id);
      setContextMenuEntity(null);
    }
  };

  // 关闭右键菜单
  const handleCloseContextMenu = () => {
    setContextMenuEntity(null);
  };

  // 处理右键菜单 - 创建新实体
  const handleContextMenuCreateEntity = () => {
    if (contextMenuEntity) {
      setCreateEntityDialog({
        open: true,
        relatedNodeId: contextMenuEntity.id,
        relatedNodeName: contextMenuEntity.name,
      });
    }
    handleCloseContextMenu();
  };

  // 处理右键菜单 - 创建新关系
  const handleContextMenuCreateRelation = () => {
    if (contextMenuEntity) {
      setAddRelationState({ open: true, sourceId: contextMenuEntity.id, sourceName: contextMenuEntity.name });
    }
    handleCloseContextMenu();
  };

  // 处理添加关系
  const handleAddRelation = async () => {
    if (!addRelationState.sourceId || newRelationTargetIds.length === 0) {
      toast.error("源实体或目标实体未选择");
      return;
    }
    
    // 为每个目标实体创建关系
    for (const targetId of newRelationTargetIds) {
      try {
        await createRelationMutation.mutateAsync({
          sourceId: addRelationState.sourceId,
          targetId,
          type: newRelationType as any,
        });
      } catch (error) {
        console.error("创建关系失败:", error);
      }
    }
  };

  // 处理名称变化，自动生成 uniqueId
  const handleNewEntityNameChange = (name: string) => {
    setNewEntityFormData((prev) => ({
      ...prev,
      name,
      uniqueId: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    }));
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

  // 导出 MMD
  const handleExportMmd = async () => {
    try {
      const mmdContent = await utils.client.graph.exportMmd.query({
        types: selectedTypes as any,
        statuses: selectedStatuses as any,
      });
      
      // 创建下载链接
      const blob = new Blob([mmdContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `knowledge-graph-${new Date().toISOString().split('T')[0]}.mmd`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('知识图谱已导出为 MMD 格式');
    } catch (error) {
      toast.error(`导出失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 获取指定层级的关联节点（仅限同级和下级节点）
  const getNodesAtLevel = (centerNodeId: number, level: number): Set<number> => {
    const currentData = dataRef.current;
    if (!currentData) return new Set([centerNodeId]);
    
    const result = new Set<number>();
    result.add(centerNodeId);
    
    // 获取中心节点的类型
    const centerNode = currentData.nodes.find(n => n.id === centerNodeId);
    if (!centerNode) return result;
    const centerType = centerNode.type;
    
    // 当前层的节点集合
    let currentLevelNodes = new Set<number>([centerNodeId]);
    
    // 逐层向外扩展
    for (let i = 0; i < level; i++) {
      const nextLevelNodes = new Set<number>();
      
      currentLevelNodes.forEach(nodeId => {
        currentData.edges.forEach(edge => {
          // 检查出边
          if (edge.sourceId === nodeId && !result.has(edge.targetId)) {
            const targetNode = currentData.nodes.find(n => n.id === edge.targetId);
            if (targetNode && isAllowedExpansion(centerType, targetNode.type)) {
              nextLevelNodes.add(edge.targetId);
              result.add(edge.targetId);
            }
          }
          // 检查入边
          if (edge.targetId === nodeId && !result.has(edge.sourceId)) {
            const sourceNode = currentData.nodes.find(n => n.id === edge.sourceId);
            if (sourceNode && isAllowedExpansion(centerType, sourceNode.type)) {
              nextLevelNodes.add(edge.sourceId);
              result.add(edge.sourceId);
            }
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
    const currentData = dataRef.current;
    if (!currentData) return;
    
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
      toast.success(`已展开第 ${newLevel} 层关系，共 ${relatedNodeIds.size} 个节点（仅同级和下级）`);
    } else {
      // 首次双击或双击了不同的节点，重置为第1层
      const relatedNodeIds = getNodesAtLevel(nodeId, 1);
      
      setFocusedNodeId(nodeId);
      setExpandLevel(1);
      setVisibleEntityIds(relatedNodeIds);
      toast.success(`已聚焦到节点，展示 ${relatedNodeIds.size} 个直接关联节点（仅同级和下级）`);
    }
  };

  // 显示全部节点
  const handleShowAllNodes = () => {
    setFocusedNodeId(null);
    setExpandLevel(1);
    setVisibleEntityIds(null);
    toast.success("已显示全部节点");
  };

  // 初始化和更新 ECharts
  useEffect(() => {
    console.log("[ECharts] useEffect triggered with data:", {
      hasChartRef: !!chartRef.current,
      hasData: !!data,
      dataNodesCount: data?.nodes?.length || 0,
      dataEdgesCount: data?.edges?.length || 0,
    });

    if (!chartRef.current || !data) {
      console.log("[ECharts] Early return: chartRef.current or data is missing");
      return;
    }

    // 初始化 ECharts 实例
    if (!chartInstanceRef.current) {
      console.log("[ECharts] Initializing ECharts instance");
      chartInstanceRef.current = echarts.init(chartRef.current);
      
      // 添加点击事件
      chartInstanceRef.current.on("click", (params: any) => {
        if (params.dataType === "node") {
          console.log("[ECharts] Node clicked:", params.data.id);
          setSelectedEntityId(parseInt(params.data.id));
          // 关闭右键菜单
          setContextMenuEntity(null);
        }
      });

      // 添加双击事件 - 展示该节点及其所有关联节点
      chartInstanceRef.current.on("dblclick", (params: any) => {
        if (params.dataType === "node") {
          const nodeId = parseInt(params.data.id);
          console.log("[ECharts] Node double-clicked:", nodeId);
          handleShowRelatedNodes(nodeId);
        }
      });

      // 添加右键菜单事件
      chartInstanceRef.current.on("contextmenu", (params: any) => {
        if (params.dataType === "node") {
          console.log("[ECharts] Node right-clicked:", params.data.id);
          params.event.event.preventDefault();
          const nodeName = params.data.entityData?.name || "";
          setContextMenuEntity({
            id: parseInt(params.data.id),
            x: params.event.event.clientX,
            y: params.event.event.clientY,
            name: nodeName,
          });
        }
      });
    }

    console.log("[ECharts] Converting data to ECharts format");

    // 根据 visibleEntityIds 过滤节点
    const filteredNodes = visibleEntityIds 
      ? data.nodes.filter(entity => visibleEntityIds.has(entity.id))
      : data.nodes;

    // 转换数据为 ECharts 格式
    const nodes = filteredNodes.map((entity) => ({
      id: entity.id.toString(),
      name: `${typeIcons[entity.type]} ${entity.name}`,
      symbolSize: typeSizes[entity.type] || 55, // 根据类型调整大小
      itemStyle: {
        color: typeColors[entity.type],
      },
      label: {
        show: true,
        color: "#000", // 修改为黑色
        fontSize: 12,
      },
      // 存储原始数据用于点击事件
      entityData: entity,
    }));

    // 根据可见节点过滤边
    const visibleNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = data.edges.filter(
      edge => visibleNodeIds.has(edge.sourceId) && visibleNodeIds.has(edge.targetId)
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

    console.log("[ECharts] Nodes and links converted:", {
      nodesCount: nodes.length,
      linksCount: links.length,
    });

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
      series: [
        {
          type: "graph",
          layout: "force",
          data: nodes,
          links: links,
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

    console.log("[ECharts] Setting ECharts option");
    chartInstanceRef.current.setOption(option);
    console.log("[ECharts] ECharts option set successfully");

    // 窗口大小变化时重新调整图表
    const handleResize = () => {
      console.log("[ECharts] Window resize event triggered");
      chartInstanceRef.current?.resize();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [data, visibleEntityIds]);

  // 清理 ECharts 实例
  useEffect(() => {
    return () => {
      console.log("[ECharts] Disposing ECharts instance");
      chartInstanceRef.current?.dispose();
      chartInstanceRef.current = null;
    };
  }, []);

  const handleTypeToggle = (type: string) => {
    console.log("[Filter] Type toggled:", type);
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleStatusToggle = (status: string) => {
    console.log("[Filter] Status toggled:", status);
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const allEntityTypes = ["Module", "Page", "Component", "API", "Service", "Documentation", "Document"];

  return (
    <div className="h-screen bg-gray-50">
      {/* 主内容区域 */}
      <div className="flex flex-col h-screen">
        {/* 顶部工具栏 */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">知识图谱</h1>
              <p className="text-sm text-gray-600 mt-1">可视化展示所有实体及其关联关系</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleExportMmd}
                disabled={isLoading || !data?.nodes?.length}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4 mr-2 inline" />
                导出 MMD
              </button>
              <Link href="/entities">
                <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                  实体列表
                </button>
              </Link>
              <Link href="/entities/new">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2 inline" />
                  创建实体
                </button>
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
              <span className="text-xs text-gray-500">双击同一节点可继续展开（仅同级和下级）</span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={handleShowAllNodes}
              >
                <Network className="h-3 w-3 mr-1" />
                显示全部
              </Button>
            </div>
          )}
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div ref={chartRef} className="w-full h-full" />
          )}
        </div>

        {/* 右侧面板 - 实体编辑侧边栏 */}
        {selectedEntityId && (
          <EntityEditSidebar
            entityId={selectedEntityId}
            onClose={() => setSelectedEntityId(null)}
            onSuccess={() => {
              utils.graph.getData.invalidate();
            }}
            onEntitySelect={(id) => setSelectedEntityId(id)}
          />
        )}

        {/* 右键菜单 */}
        {contextMenuEntity && (
          <>
            {/* 透明遮罩层，点击关闭菜单 */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={handleCloseContextMenu}
              onContextMenu={(e) => {
                e.preventDefault();
                handleCloseContextMenu();
              }}
            />
            {/* 右键菜单 */}
            <div
              className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[180px]"
              style={{
                left: contextMenuEntity.x,
                top: contextMenuEntity.y,
              }}
            >
              <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100">
                节点: {contextMenuEntity.name}
              </div>
              {isAdmin && (
                <>
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                    onClick={handleContextMenuCreateEntity}
                  >
                    <Plus className="h-4 w-4 text-blue-500" />
                    创建新实体
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                    onClick={handleContextMenuCreateRelation}
                  >
                    <Link2 className="h-4 w-4 text-green-500" />
                    创建新关系
                  </button>
                  <div className="border-t border-gray-200 my-1" />
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                    onClick={handleOpenSidebarFromContextMenu}
                  >
                    <Edit2 className="h-4 w-4" />
                    查看/编辑实体
                  </button>
                  <div className="border-t border-gray-200 my-1" />
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                    onClick={() => {
                      setDeleteEntityId(contextMenuEntity.id);
                      setContextMenuEntity(null);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    删除实体
                  </button>
                </>
              )}
              {!isAdmin && (
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                  onClick={() => {
                    setSelectedEntityId(contextMenuEntity.id);
                    setContextMenuEntity(null);
                  }}
                >
                  <Edit2 className="h-4 w-4" />
                  查看详情
                </button>
              )}
              {/* 显示全部节点按钮，仅在聚焦状态时显示 */}
              {focusedNodeId !== null && (
                <>
                  <div className="border-t border-gray-200 my-1" />
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                    onClick={() => {
                      handleShowAllNodes();
                      handleCloseContextMenu();
                    }}
                  >
                    <Network className="h-4 w-4 text-purple-500" />
                    显示全部节点
                  </button>
                </>
              )}
            </div>
          </>
        )}

        {/* 添加关系对话框 */}
        <Dialog open={addRelationState.open} onOpenChange={(open) => setAddRelationState({ ...addRelationState, open })}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>添加关系</DialogTitle>
              <DialogDescription>
                为 "{addRelationState.sourceName}" 添加新的关系
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* 关系类型选择 */}
              <div className="space-y-2">
                <Label>关系类型</Label>
                <Select value={newRelationType} onValueChange={setNewRelationType}>
                  <SelectTrigger>
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

              {/* 目标实体类型筛选 */}
              <div className="space-y-2">
                <Label>目标实体类型</Label>
                <Select
                  value={newRelationTargetType || "all"}
                  onValueChange={(value) => setNewRelationTargetType(value === "all" ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="全部类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类型</SelectItem>
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

              {/* 目标实体选择 */}
              <div className="space-y-2">
                <Label>目标实体 (可多选)</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="搜索实体..."
                    value={entitySearchQuery}
                    onChange={(e) => setEntitySearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    已选择 <span className="font-medium text-blue-600">{newRelationTargetIds.length}</span> 个实体
                  </span>
                  {newRelationTargetIds.length > 0 && (
                    <button
                      className="text-blue-600 hover:text-blue-800 text-xs"
                      onClick={() => setNewRelationTargetIds([])}
                    >
                      清空选择
                    </button>
                  )}
                </div>
                <div className="border rounded-md max-h-[200px] overflow-y-auto">
                  {entitiesList?.items
                    ?.filter((e) => e.id !== addRelationState.sourceId)
                    ?.filter((e) => !newRelationTargetType || e.type === newRelationTargetType)
                    ?.filter((e) => 
                      !entitySearchQuery || 
                      e.name.toLowerCase().includes(entitySearchQuery.toLowerCase()) ||
                      e.uniqueId.toLowerCase().includes(entitySearchQuery.toLowerCase())
                    )
                    ?.map((entity) => (
                      <div
                        key={entity.id}
                        className={`px-3 py-2 flex items-center gap-2 cursor-pointer hover:bg-gray-50 ${
                          newRelationTargetIds.includes(entity.id) ? "bg-blue-50" : ""
                        }`}
                        onClick={() => {
                          setNewRelationTargetIds((prev) =>
                            prev.includes(entity.id)
                              ? prev.filter((id) => id !== entity.id)
                              : [...prev, entity.id]
                          );
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={newRelationTargetIds.includes(entity.id)}
                          onChange={() => {}}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm truncate block">{entity.name}</span>
                          <span className="text-xs text-gray-400">{entity.type}</span>
                        </div>
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
              <Button variant="outline" onClick={() => setAddRelationState({ open: false, sourceId: null, sourceName: "" })}>
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
              </div>

              {/* 关系设置 */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-gray-700 border-b pb-2">关系设置</h4>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>创建关系</Label>
                    <p className="text-xs text-gray-500">同时与 "{createEntityDialog.relatedNodeName}" 建立关系</p>
                  </div>
                  <Switch
                    checked={newEntityFormData.createRelation}
                    onCheckedChange={(checked) => setNewEntityFormData({ ...newEntityFormData, createRelation: checked })}
                  />
                </div>

                {newEntityFormData.createRelation && (
                  <div className="space-y-4 pl-4 border-l-2 border-blue-200">
                    <div className="space-y-2">
                      <Label>关系类型</Label>
                      <Select
                        value={newEntityFormData.relationType}
                        onValueChange={(value: any) => setNewEntityFormData({ ...newEntityFormData, relationType: value })}
                      >
                        <SelectTrigger>
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

                    <div className="space-y-2">
                      <Label>关系方向</Label>
                      <Select
                        value={newEntityFormData.relationDirection}
                        onValueChange={(value: any) => setNewEntityFormData({ ...newEntityFormData, relationDirection: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="from">新实体 → {createEntityDialog.relatedNodeName}</SelectItem>
                          <SelectItem value="to">{createEntityDialog.relatedNodeName} → 新实体</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateEntityDialog({ open: false, relatedNodeId: null, relatedNodeName: "" })}>
                取消
              </Button>
              <Button onClick={handleCreateEntity} disabled={createEntityMutation.isPending}>
                {createEntityMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                创建
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
