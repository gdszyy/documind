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

const typeColors = {
  Service: "#9333ea",
  API: "#ea580c",
  Component: "#0891b2",
  Page: "#db2777",
  Module: "#16a34a",
};

const typeIcons = {
  Service: "🔧",
  API: "📡",
  Component: "🧩",
  Page: "📄",
  Module: "📦",
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
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["Service", "API", "Component", "Page", "Module"]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["Development", "Testing", "Production"]);
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
    const nodes = data.nodes.map((entity) => ({
      id: entity.id.toString(),
      name: `${typeIcons[entity.type]} ${entity.name}`,
      symbolSize: 60,
      itemStyle: {
        color: typeColors[entity.type],
      },
      label: {
        show: true,
        color: "#fff",
        fontSize: 12,
      },
      // 存储原始数据用于点击事件
      entityData: entity,
    }));

    const links = data.edges.map((edge) => ({
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

    chartInstanceRef.current.setOption(option);

    // 窗口大小变化时重新调整图表
    const handleResize = () => {
      chartInstanceRef.current?.resize();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [data]);

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
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Label className="text-sm font-medium">类型:</Label>
            {["Service", "API", "Component", "Page", "Module"].map((type) => (
              <div key={type} className="flex items-center gap-2">
                <Checkbox
                  id={`type-${type}`}
                  checked={selectedTypes.includes(type)}
                  onCheckedChange={() => handleTypeToggle(type)}
                />
                <Label htmlFor={`type-${type}`} className="text-sm cursor-pointer">
                  {type}
                </Label>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Label className="text-sm font-medium">状态:</Label>
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

      {/* 侧边信息面板 */}
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
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* 关系管理 */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">关系管理</CardTitle>
                      <Dialog open={showAddRelationDialog} onOpenChange={setShowAddRelationDialog}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Plus className="h-3 w-3 mr-1" />
                            添加
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>添加新关系</DialogTitle>
                            <DialogDescription>
                              选择关系类型和目标实体
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="relationType">关系类型</Label>
                              <Select
                                value={newRelationType}
                                onValueChange={(value: any) => setNewRelationType(value)}
                              >
                                <SelectTrigger id="relationType">
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
                              <Label htmlFor="targetEntity">目标实体</Label>
                              <Select
                                value={newRelationTargetId?.toString()}
                                onValueChange={(value) => setNewRelationTargetId(parseInt(value))}
                              >
                                <SelectTrigger id="targetEntity">
                                  <SelectValue placeholder="选择目标实体" />
                                </SelectTrigger>
                                <SelectContent>
                                  {entitiesList?.entities
                                    ?.filter((e) => e.id !== selectedEntityId)
                                    ?.map((e) => (
                                      <SelectItem key={e.id} value={e.id.toString()}>
                                        {e.name} ({e.type})
                                      </SelectItem>
                                    )) || (
                                    <div className="p-2 text-sm text-gray-500 text-center">
                                      加载中...
                                    </div>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowAddRelationDialog(false)}
                            >
                              取消
                            </Button>
                            <Button
                              type="button"
                              onClick={handleAddRelation}
                              disabled={createRelationMutation.isPending || !newRelationTargetId}
                            >
                              {createRelationMutation.isPending && (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              )}
                              添加
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* 出站关系 */}
                    {relationships && relationships.outgoing.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-600">
                          出站关系 ({relationships.outgoing.length})
                        </Label>
                        <div className="space-y-2">
                          {relationships.outgoing.map((rel) => (
                            <div
                              key={rel.id}
                              className="flex items-center justify-between p-2 bg-gray-50 border rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Badge className={`text-xs ${relationTypeBadgeColors[rel.type]}`}>
                                  {relationTypeLabels[rel.type]}
                                </Badge>
                                <span className="text-gray-400 text-xs">→</span>
                                {rel.targetEntity ? (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedEntityId(rel.targetEntity!.id)}
                                    className="text-sm text-blue-600 hover:underline font-medium truncate"
                                  >
                                    {rel.targetEntity.name}
                                  </button>
                                ) : (
                                  <span className="text-xs text-gray-500 truncate">
                                    目标不存在
                                  </span>
                                )}
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteRelation(rel.id)}
                                disabled={deleteRelationMutation.isPending}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 入站关系 */}
                    {relationships && relationships.incoming.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-gray-600">
                          入站关系 ({relationships.incoming.length})
                        </Label>
                        <div className="space-y-2">
                          {relationships.incoming.map((rel) => (
                            <div
                              key={rel.id}
                              className="flex items-center justify-between p-2 bg-gray-50 border rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {rel.sourceEntity ? (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedEntityId(rel.sourceEntity!.id)}
                                    className="text-sm text-blue-600 hover:underline font-medium truncate"
                                  >
                                    {rel.sourceEntity.name}
                                  </button>
                                ) : (
                                  <span className="text-xs text-gray-500 truncate">
                                    源不存在
                                  </span>
                                )}
                                <span className="text-gray-400 text-xs">→</span>
                                <Badge className={`text-xs ${relationTypeBadgeColors[rel.type]}`}>
                                  {relationTypeLabels[rel.type]}
                                </Badge>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteRelation(rel.id)}
                                disabled={deleteRelationMutation.isPending}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 无关系提示 */}
                    {relationships && 
                     relationships.outgoing.length === 0 && 
                     relationships.incoming.length === 0 && (
                      <div className="text-center py-6 text-gray-500">
                        <p className="text-sm">暂无关系</p>
                        <p className="text-xs mt-1">点击"添加"按钮创建新关系</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 关联信息 */}
                {selectedEntity.larkDocUrl && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">关联文档</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <a
                        href={selectedEntity.larkDocUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                        在飞书中查看
                      </a>
                    </CardContent>
                  </Card>
                )}

                {/* 操作按钮 */}
                <div className="space-y-2 pt-2">
                  <Link href={`/entities/${selectedEntity.id}/edit`}>
                    <Button className="w-full" variant="outline">
                      在详情页编辑
                    </Button>
                  </Link>

                  <Button
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
                    variant="outline"
                    onClick={() => setDeleteEntityId(selectedEntity.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    删除实体
                  </Button>

                  {selectedEntity.type === "Service" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="w-full">
                          创建关联实体
                          <Plus className="h-4 w-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={() => handleCreateRelatedEntity("EXPOSES_API")}>
                          创建暴露的 API
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCreateRelatedEntity("USES_COMPONENT")}>
                          创建使用的组件
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* 删除确认对话框 */}
      <AlertDialog open={!!deleteEntityId} onOpenChange={(open) => !open && setDeleteEntityId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个实体吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
