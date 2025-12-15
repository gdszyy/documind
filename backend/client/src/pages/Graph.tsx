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
import { ExternalLink, Loader2, Plus, Trash2, X, Save, Edit2, Check, EyeOff, Network } from "lucide-react";
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
	  const [newRelationTargetId, setNewRelationTargetId] = useState<number | null>(null);
	  const [newRelationTargetType, setNewRelationTargetType] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    // 对话框打开时重置状态，确保每次都是干净的表单
    if (addRelationState.open) {
      setNewRelationTargetId(null);
      setNewRelationTargetType(null);
      setNewRelationType("DEPENDS_ON");
    }
  }, [addRelationState.open]);



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
      toast.success("关系创建成功");
      refetchRelationships();
      utils.graph.getData.invalidate();
      setAddRelationState({ open: false, sourceId: null });
      setNewRelationTargetId(null);
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

const handleAddRelation = () => {
		    if (!addRelationState.sourceId || !newRelationTargetId) {
		      toast.error("源实体或目标实体未选择");
		      return;
		    }

		    createRelationMutation.mutate({
		      sourceId: addRelationState.sourceId,
		      targetId: newRelationTargetId,
		      type: newRelationType,
		    });
		  };

  const handleDeleteRelation = (relationId: number) => {
    deleteRelationMutation.mutate({ id: relationId });
  };

  // 隐藏节点功能（右键隐藏）
  const handleHideNode = (nodeId: number) => {
    if (!data) return;
    
    // 将节点添加到隐藏集合中
    const newHiddenIds = new Set(hiddenEntityIds);
    newHiddenIds.add(nodeId);
    setHiddenEntityIds(newHiddenIds);
    
    toast.success("节点已隐藏");
  };

  // 展示所有关联节点功能
  const handleShowRelatedNodes = (nodeId: number) => {
    if (!data) return;
    
    // 找到所有与该节点相关的边
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
    
    // 更新可见节点集合
    setVisibleEntityIds(relatedNodeIds);
    // 清空隐藏集合，因为双击展开关联节点时，应该显示所有关联节点
    setHiddenEntityIds(new Set());
    toast.success(`已展示 ${relatedNodeIds.size} 个关联节点`);
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

      // 添加右键事件 - 隐藏该节点
      chartInstanceRef.current.on("contextmenu", (params: any) => {
        if (params.dataType === "node") {
          params.event.event.preventDefault(); // 阻止默认右键菜单
          const nodeId = parseInt(params.data.id);
          handleHideNode(nodeId);
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
      return {
        id: entity.id.toString(),
        name: `${typeIcons[entityType] || "📄"} ${entity.name}`,
        symbolSize: 60,
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
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            <div ref={chartRef} className="w-full h-full" />
          </>
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
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAddRelationState({ open: true, sourceId: selectedEntityId })}
                      className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      添加关系
                    </Button>
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
                              <p className="text-sm font-medium">{rel.targetEntity?.name || `目标实体 ${rel.targetId}`}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                类型: {rel.targetEntity?.type || '未知'}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteRelation(rel.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
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
                              <p className="text-sm font-medium">{rel.sourceEntity?.name || `源实体 ${rel.sourceId}`}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                类型: {rel.sourceEntity?.type || '未知'}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteRelation(rel.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
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

                {/* 删除按钮 */}
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
	                  setNewRelationTargetId(null); // 切换类型时重置目标实体
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
	              <Label htmlFor="target-entity">目标实体</Label>
	              <Select
		                value={newRelationTargetId?.toString() || ""}
		                onValueChange={(value) => {
		                  const id = parseInt(value);
		                  setNewRelationTargetId(isNaN(id) ? null : id);
		                }}
	              >
	                <SelectTrigger id="target-entity">
	                  <SelectValue placeholder="选择目标实体" />
	                </SelectTrigger>
	                <SelectContent>
	                  {entitiesList?.items
	                    ?.filter((e) => e.id !== selectedEntityId)
	                    ?.filter((e) => !newRelationTargetType || e.type === newRelationTargetType)
	                    .map((entity) => (
	                      <SelectItem key={entity.id} value={entity.id.toString()}>
	                        {typeIcons[entity.type]} {entity.name} ({entity.type})
	                      </SelectItem>
	                    ))}
	                </SelectContent>
	              </Select>
	            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddRelationState({ open: false, sourceId: null })}>
              取消
            </Button>
            <Button onClick={handleAddRelation} disabled={!newRelationTargetId}>
              添加
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
