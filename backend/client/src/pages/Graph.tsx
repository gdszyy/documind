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
import { ExternalLink, Loader2, Plus, Trash2, X, Save, Edit2, Check } from "lucide-react";
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

const statusColors = {
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
  const { visibleEntityIds } = useGraphVisibility();
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);
  const [deleteEntityId, setDeleteEntityId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddRelationDialog, setShowAddRelationDialog] = useState(false);
  const [newRelationType, setNewRelationType] = useState<"EXPOSES_API" | "DEPENDS_ON" | "USES_COMPONENT" | "CONTAINS">("DEPENDS_ON");
  const [newRelationTargetId, setNewRelationTargetId] = useState<number | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  const [editFormData, setEditFormData] = useState({
    name: "",
    owner: "",
    status: "Development" as "Development" | "Testing" | "Production" | "Deprecated",
    description: "",
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
    { enabled: showAddRelationDialog }
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
      setShowAddRelationDialog(false);
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
        owner: selectedEntity.owner,
        status: selectedEntity.status,
        description: selectedEntity.description || "",
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
      });
    }
  };

  const handleAddRelation = () => {
    if (!selectedEntityId || !newRelationTargetId) {
      toast.error("请选择目标实体");
      return;
    }

    createRelationMutation.mutate({
      sourceId: selectedEntityId,
      targetId: newRelationTargetId,
      type: newRelationType,
    });
  };

  const handleDeleteRelation = (relationId: number) => {
    deleteRelationMutation.mutate({ id: relationId });
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
    }

    // 转换数据为 ECharts 格式
    // 如果 visibleEntityIds 不为 null，则只显示选中的实体
    const filteredNodes = visibleEntityIds === null 
      ? data.nodes 
      : data.nodes.filter(entity => visibleEntityIds.has(entity.id));

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
          color: "#fff",
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
  }, [data, visibleEntityIds]);

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
    <div className="h-screen flex flex-col bg-gray-50">
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
          <div ref={chartRef} className="w-full h-full" />
        )}
      </div>

      {/* 侧边信息面板 - 保持原有代码不变 */}
      <Sheet modal={false} open={!!selectedEntityId} onOpenChange={(open) => !open && setSelectedEntityId(null)}>
        <SheetContent className="w-[450px] overflow-y-auto" hideCloseButton showOverlay={false}>
          {selectedEntity && (
            <>
              <SheetHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{typeIcons[selectedEntity.type]}</span>
                    <div>
                      <SheetTitle className="text-xl">{selectedEntity.name}</SheetTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {selectedEntity.type}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`text-xs border ${statusColors[selectedEntity.status]}`}
                        >
                          {selectedEntity.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    className="ml-2"
                  >
                    {isEditing ? (
                      <X className="h-4 w-4" />
                    ) : (
                      <Edit2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </SheetHeader>

              <Separator className="my-4" />

              <div className="space-y-6">
                {/* 基本信息编辑区 */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      基本信息
                      {isEditing && (
                        <Badge variant="secondary" className="text-xs">
                          编辑模式
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isEditing ? (
                      <>
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
                                  owner: selectedEntity.owner,
                                  status: selectedEntity.status,
                                  description: selectedEntity.description || "",
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
                        <div>
                          <Label className="text-xs text-gray-500">负责人</Label>
                          <p className="mt-1 text-sm font-medium">{selectedEntity.owner}</p>
                        </div>

                        {selectedEntity.description && (
                          <div>
                            <Label className="text-xs text-gray-500">描述</Label>
                            <p className="mt-1 text-sm text-gray-700 leading-relaxed">
                              {selectedEntity.description}
                            </p>
                          </div>
                        )}

                        <div>
                          <Label className="text-xs text-gray-500">唯一标识</Label>
                          <p className="mt-1 text-xs font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded">
                            {selectedEntity.uniqueId}
                          </p>
                        </div>

                        {selectedEntity.documentUrl && (
                          <div>
                            <Label className="text-xs text-gray-500">文档链接</Label>
                            <a
                              href={selectedEntity.documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              查看文档
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* 关系管理区域 - 保持原有逻辑 */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">关联关系</CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowAddRelationDialog(true)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        添加关系
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {relationships && relationships.length > 0 ? (
                      <div className="space-y-3">
                        {relationships.map((rel) => (
                          <div
                            key={rel.id}
                            className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${relationTypeBadgeColors[rel.type]}`}
                                >
                                  {relationTypeLabels[rel.type]}
                                </Badge>
                              </div>
                              <p className="text-sm font-medium">{rel.targetName}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                类型: {rel.targetType}
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
                      <p className="text-sm text-gray-500 text-center py-4">
                        暂无关联关系
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* 删除按钮 */}
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setDeleteEntityId(selectedEntity.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除实体
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* 添加关系对话框 */}
      <Dialog open={showAddRelationDialog} onOpenChange={setShowAddRelationDialog}>
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
              <Label htmlFor="target-entity">目标实体</Label>
              <Select
                value={newRelationTargetId?.toString()}
                onValueChange={(value) => setNewRelationTargetId(parseInt(value))}
              >
                <SelectTrigger id="target-entity">
                  <SelectValue placeholder="选择目标实体" />
                </SelectTrigger>
                <SelectContent>
                  {entitiesList?.items
                    ?.filter((e) => e.id !== selectedEntityId)
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
            <Button variant="outline" onClick={() => setShowAddRelationDialog(false)}>
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
  );
}
