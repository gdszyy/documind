import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { 
  Loader2, Save, X, Plus, Trash2, Search, ArrowLeftRight, 
  ExternalLink, FileEdit, ChevronDown, ChevronUp 
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import EntityContentEditor from "@/components/EntityContentEditor";

// 关系类型配置
const RELATION_TYPE_CONFIG: Record<string, {
  label: string;
  reverseLabel: string;
  suggestedTargetType: string | null;
  description: string;
  reverseDescription: string;
}> = {
  EXPOSES_API: {
    label: "暴露 API",
    reverseLabel: "被暴露于",
    suggestedTargetType: "API",
    description: "当前实体暴露以下 API",
    reverseDescription: "当前实体被以下实体暴露为 API",
  },
  DEPENDS_ON: {
    label: "依赖于",
    reverseLabel: "被依赖于",
    suggestedTargetType: null,
    description: "当前实体依赖以下实体",
    reverseDescription: "当前实体被以下实体依赖",
  },
  USES_COMPONENT: {
    label: "使用组件",
    reverseLabel: "被使用于",
    suggestedTargetType: "Component",
    description: "当前实体使用以下组件",
    reverseDescription: "当前实体被以下实体作为组件使用",
  },
  CONTAINS: {
    label: "包含",
    reverseLabel: "被包含于",
    suggestedTargetType: null,
    description: "当前实体包含以下实体",
    reverseDescription: "当前实体被以下实体包含",
  },
};

// 关系类型标签颜色
const getRelationTypeBadgeColor = (type: string) => {
  const colors: Record<string, string> = {
    EXPOSES_API: "bg-blue-100 text-blue-800 border-blue-200",
    DEPENDS_ON: "bg-purple-100 text-purple-800 border-purple-200",
    USES_COMPONENT: "bg-green-100 text-green-800 border-green-200",
    CONTAINS: "bg-orange-100 text-orange-800 border-orange-200",
  };
  return colors[type] || "bg-gray-100 text-gray-800";
};

// 获取关系类型标签
const getRelationTypeLabel = (type: string, isReverse: boolean = false) => {
  const config = RELATION_TYPE_CONFIG[type];
  if (!config) return type;
  return isReverse ? config.reverseLabel : config.label;
};

interface EntityEditSidebarProps {
  entityId: number | null;
  onClose: () => void;
  onSuccess?: () => void;
  onEntitySelect?: (entityId: number) => void;
}

export default function EntityEditSidebar({
  entityId,
  onClose,
  onSuccess,
  onEntitySelect,
}: EntityEditSidebarProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // 表单数据
  const [formData, setFormData] = useState({
    name: "",
    uniqueId: "",
    type: "Service" as string,
    owner: "",
    status: "Development" as string,
    description: "",
    httpMethod: "GET" as string,
    apiPath: "",
    larkDocUrl: "",
    content: "",
  });

  // 折叠状态
  const [isBasicInfoExpanded, setIsBasicInfoExpanded] = useState(true);
  const [isRelationsExpanded, setIsRelationsExpanded] = useState(true);

  // 关系管理状态
  const [showAddRelationDialog, setShowAddRelationDialog] = useState(false);
  const [newRelationType, setNewRelationType] = useState<string>("DEPENDS_ON");
  const [newRelationTargetIds, setNewRelationTargetIds] = useState<number[]>([]);
  const [newRelationTargetType, setNewRelationTargetType] = useState<string | null>(null);
  const [entitySearchQuery, setEntitySearchQuery] = useState("");
  const [isRelationReversed, setIsRelationReversed] = useState(false);

  // 内容编辑器状态
  const [showContentEditor, setShowContentEditor] = useState(false);

  // 删除确认状态
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // 获取实体数据
  const { data: entity, isLoading: isLoadingEntity, refetch: refetchEntity } = trpc.entities.getById.useQuery(
    { id: entityId! },
    { enabled: !!entityId }
  );

  // 获取实体关系
  const { data: relationships, refetch: refetchRelationships } = trpc.entities.getRelationships.useQuery(
    { id: entityId! },
    { enabled: !!entityId }
  );

  // 获取所有实体列表（用于选择关系目标）
  const { data: entitiesList } = trpc.entities.list.useQuery(
    { page: 1, limit: 500, sortBy: "name", order: "asc" },
    { enabled: showAddRelationDialog }
  );

  // 填充表单数据
  useEffect(() => {
    if (entity) {
      setFormData({
        name: entity.name,
        uniqueId: entity.uniqueId,
        type: entity.type,
        owner: entity.owner,
        status: entity.status,
        description: entity.description || "",
        httpMethod: entity.httpMethod || "GET",
        apiPath: entity.apiPath || "",
        larkDocUrl: entity.larkDocUrl || "",
        content: entity.content || "",
      });
    }
  }, [entity]);

  // 关系类型变化时自动设置目标实体类型
  useEffect(() => {
    const config = RELATION_TYPE_CONFIG[newRelationType];
    if (config?.suggestedTargetType) {
      setNewRelationTargetType(config.suggestedTargetType);
    }
    setNewRelationTargetIds([]);
  }, [newRelationType]);

  // 计算过滤后的实体列表
  const filteredEntities = useMemo(() => {
    if (!entitiesList?.items) return [];
    
    return entitiesList.items
      .filter((e) => e.id !== entityId)
      .filter((e) => !newRelationTargetType || e.type === newRelationTargetType)
      .filter((e) => {
        if (!entitySearchQuery.trim()) return true;
        const query = entitySearchQuery.toLowerCase();
        return (
          e.name.toLowerCase().includes(query) ||
          e.type.toLowerCase().includes(query) ||
          e.uniqueId?.toLowerCase().includes(query)
        );
      });
  }, [entitiesList?.items, entityId, newRelationTargetType, entitySearchQuery]);

  const utils = trpc.useUtils();

  // 更新实体
  const updateMutation = trpc.entities.update.useMutation({
    onSuccess: () => {
      toast.success("实体更新成功");
      utils.entities.list.invalidate();
      utils.graph.getData.invalidate();
      refetchEntity();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });

  // 删除实体
  const deleteMutation = trpc.entities.delete.useMutation({
    onSuccess: () => {
      toast.success("实体删除成功");
      utils.entities.list.invalidate();
      utils.graph.getData.invalidate();
      onClose();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  // 创建关系
  const createRelationMutation = trpc.relationships.create.useMutation({
    onSuccess: () => {
      refetchRelationships();
      utils.graph.getData.invalidate();
    },
    onError: (error) => {
      toast.error(`创建关系失败: ${error.message}`);
    },
  });

  // 删除关系
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

  // 保存基本信息
  const handleSave = () => {
    if (!entityId) return;
    updateMutation.mutate({
      id: entityId,
      ...formData,
    });
  };

  // 删除实体
  const handleDelete = () => {
    if (!entityId) return;
    deleteMutation.mutate({ id: entityId });
  };

  // 添加关系
  const handleAddRelation = async () => {
    if (!entityId || newRelationTargetIds.length === 0) {
      toast.error("请选择目标实体");
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const targetId of newRelationTargetIds) {
      try {
        if (isRelationReversed) {
          await createRelationMutation.mutateAsync({
            sourceId: targetId,
            targetId: entityId,
            type: newRelationType as any,
          });
        } else {
          await createRelationMutation.mutateAsync({
            sourceId: entityId,
            targetId: targetId,
            type: newRelationType as any,
          });
        }
        successCount++;
      } catch {
        failCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`成功创建 ${successCount} 条关系`);
    }
    if (failCount > 0) {
      toast.error(`${failCount} 条关系创建失败`);
    }

    setShowAddRelationDialog(false);
    setNewRelationTargetIds([]);
    setEntitySearchQuery("");
  };

  // 删除关系
  const handleDeleteRelation = (relationId: number) => {
    deleteRelationMutation.mutate({ id: relationId });
  };

  // 获取当前关系描述
  const getCurrentRelationDescription = () => {
    const config = RELATION_TYPE_CONFIG[newRelationType];
    if (!config) return "";
    return isRelationReversed ? config.reverseDescription : config.description;
  };

  // 重置添加关系对话框
  const handleDialogOpenChange = (open: boolean) => {
    setShowAddRelationDialog(open);
    if (!open) {
      setNewRelationTargetIds([]);
      setEntitySearchQuery("");
      setIsRelationReversed(false);
    }
  };

  if (!entityId) {
    return (
      <div className="w-96 bg-white border-l flex items-center justify-center text-gray-500">
        <p>选择一个实体以查看详情</p>
      </div>
    );
  }

  if (isLoadingEntity) {
    return (
      <div className="w-96 bg-white border-l flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="w-96 bg-white border-l flex items-center justify-center text-gray-500">
        <p>实体不存在</p>
      </div>
    );
  }

  return (
    <div className="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-2xl flex flex-col z-50">
      {/* 头部 */}
      <div className="px-4 py-3 border-b flex items-center justify-between bg-gray-50">
        <h2 className="font-semibold text-gray-900 truncate flex-1">{entity.name}</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-200 rounded"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {/* 内容区域 - 可滚动 */}
      <div className="flex-1 overflow-y-auto">
        {/* 基本信息区块 */}
        <div className="border-b">
          <button
            onClick={() => setIsBasicInfoExpanded(!isBasicInfoExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
          >
            <span className="font-medium text-gray-700">基本信息</span>
            {isBasicInfoExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </button>
          
          {isBasicInfoExpanded && (
            <div className="px-4 pb-4 space-y-3">
              {/* 实体名称 */}
              <div>
                <Label htmlFor="name" className="text-xs text-gray-500">名称</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!isAdmin}
                  className="h-8 text-sm"
                />
              </div>

              {/* 唯一标识 */}
              <div>
                <Label htmlFor="uniqueId" className="text-xs text-gray-500">唯一标识</Label>
                <Input
                  id="uniqueId"
                  value={formData.uniqueId}
                  onChange={(e) => setFormData({ ...formData, uniqueId: e.target.value })}
                  disabled={!isAdmin}
                  className="h-8 text-sm"
                />
              </div>

              {/* 类型和负责人 */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="type" className="text-xs text-gray-500">类型</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                    disabled={!isAdmin}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
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
                <div>
                  <Label htmlFor="owner" className="text-xs text-gray-500">负责人</Label>
                  <Input
                    id="owner"
                    value={formData.owner}
                    onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                    disabled={!isAdmin}
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              {/* 状态 */}
              <div>
                <Label htmlFor="status" className="text-xs text-gray-500">状态</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                  disabled={!isAdmin}
                >
                  <SelectTrigger className="h-8 text-sm">
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

              {/* API 类型专属字段 */}
              {formData.type === "API" && (
                <div className="grid grid-cols-2 gap-2 p-2 bg-orange-50 rounded border border-orange-200">
                  <div>
                    <Label htmlFor="httpMethod" className="text-xs text-orange-700">HTTP 方法</Label>
                    <Select
                      value={formData.httpMethod}
                      onValueChange={(value) => setFormData({ ...formData, httpMethod: value })}
                      disabled={!isAdmin}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                        <SelectItem value="PATCH">PATCH</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="apiPath" className="text-xs text-orange-700">API 路径</Label>
                    <Input
                      id="apiPath"
                      value={formData.apiPath}
                      onChange={(e) => setFormData({ ...formData, apiPath: e.target.value })}
                      disabled={!isAdmin}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              )}

              {/* 描述 */}
              <div>
                <Label htmlFor="description" className="text-xs text-gray-500">描述</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={!isAdmin}
                  rows={2}
                  className="text-sm"
                />
              </div>

              {/* 飞书文档链接 */}
              {formData.larkDocUrl && (
                <div>
                  <Label className="text-xs text-gray-500">飞书文档</Label>
                  <a
                    href={formData.larkDocUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    在飞书中查看
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {/* 编辑内容按钮 */}
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowContentEditor(true)}
                  className="w-full"
                >
                  <FileEdit className="h-4 w-4 mr-2" />
                  编辑文档内容
                </Button>
              )}

              {/* 保存按钮 */}
              {isAdmin && (
                <Button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="w-full"
                  size="sm"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  保存更改
                </Button>
              )}
            </div>
          )}
        </div>

        {/* 关系管理区块 */}
        <div className="border-b">
          <button
            onClick={() => setIsRelationsExpanded(!isRelationsExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
          >
            <span className="font-medium text-gray-700">
              关系管理
              {relationships && (
                <span className="ml-2 text-xs text-gray-400">
                  ({(relationships.outgoing?.length || 0) + (relationships.incoming?.length || 0)})
                </span>
              )}
            </span>
            {isRelationsExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </button>

          {isRelationsExpanded && (
            <div className="px-4 pb-4 space-y-3">
              {/* 添加关系按钮 */}
              {isAdmin && (
                <Dialog open={showAddRelationDialog} onOpenChange={handleDialogOpenChange}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      添加关系
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>添加新关系</DialogTitle>
                      <DialogDescription>选择关系类型和目标实体</DialogDescription>
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

                      {/* 关系反转开关 */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-center gap-2">
                          <ArrowLeftRight className="h-4 w-4 text-gray-500" />
                          <div>
                            <Label className="text-sm font-medium cursor-pointer">反转关系方向</Label>
                            <p className="text-xs text-gray-500">
                              {isRelationReversed 
                                ? `目标实体 → ${getRelationTypeLabel(newRelationType)} → 当前实体`
                                : `当前实体 → ${getRelationTypeLabel(newRelationType)} → 目标实体`
                              }
                            </p>
                          </div>
                        </div>
                        <Switch checked={isRelationReversed} onCheckedChange={setIsRelationReversed} />
                      </div>

                      {/* 关系描述提示 */}
                      <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <span className="font-medium">关系说明：</span> {getCurrentRelationDescription()}
                      </div>

                      {/* 目标实体类型过滤 */}
                      <div className="space-y-2">
                        <Label>目标实体类型</Label>
                        <Select
                          value={newRelationTargetType || "all"}
                          onValueChange={(value) => {
                            setNewRelationTargetType(value === "all" ? null : value);
                            setNewRelationTargetIds([]);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="选择实体类型" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">所有类型</SelectItem>
                            <SelectItem value="Service">服务</SelectItem>
                            <SelectItem value="API">API</SelectItem>
                            <SelectItem value="Component">组件</SelectItem>
                            <SelectItem value="Page">页面</SelectItem>
                            <SelectItem value="Document">说明文档</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* 搜索框 */}
                      <div className="space-y-2">
                        <Label>目标实体 (可多选)</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="搜索实体名称..."
                            value={entitySearchQuery}
                            onChange={(e) => setEntitySearchQuery(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                      </div>

                      {/* 已选择数量提示 */}
                      {newRelationTargetIds.length > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">
                            已选择 <span className="font-medium text-blue-600">{newRelationTargetIds.length}</span> 个实体
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setNewRelationTargetIds([])}
                          >
                            清空选择
                          </Button>
                        </div>
                      )}

                      {/* 实体列表 */}
                      <div className="border rounded-md max-h-[200px] overflow-y-auto">
                        {filteredEntities.length > 0 ? (
                          filteredEntities.map((e) => (
                            <div
                              key={e.id}
                              className={`flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 ${
                                newRelationTargetIds.includes(e.id) ? "bg-blue-50" : ""
                              }`}
                              onClick={() => {
                                setNewRelationTargetIds((prev) =>
                                  prev.includes(e.id)
                                    ? prev.filter((id) => id !== e.id)
                                    : [...prev, e.id]
                                );
                              }}
                            >
                              <Checkbox checked={newRelationTargetIds.includes(e.id)} />
                              <div className="flex-1 min-w-0">
                                <span className="text-sm truncate block">{e.name}</span>
                                <span className="text-xs text-gray-400">{e.type}</span>
                              </div>
                              <Badge variant="outline" className="text-xs shrink-0">{e.type}</Badge>
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-4 text-sm text-gray-500 text-center">
                            {entitySearchQuery ? "没有匹配的实体" : "没有可选的实体"}
                          </div>
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => handleDialogOpenChange(false)}>取消</Button>
                      <Button
                        onClick={handleAddRelation}
                        disabled={createRelationMutation.isPending || newRelationTargetIds.length === 0}
                      >
                        {createRelationMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        添加 {newRelationTargetIds.length > 0 && `(${newRelationTargetIds.length})`}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {/* 出站关系 */}
              {relationships?.outgoing && relationships.outgoing.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">出站关系</Label>
                  <div className="space-y-1">
                    {relationships.outgoing.map((rel) => (
                      <div
                        key={rel.id}
                        className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-100 text-sm"
                      >
                        <div className="flex-1 min-w-0">
                          <Badge variant="outline" className={`text-xs ${getRelationTypeBadgeColor(rel.type)}`}>
                            {getRelationTypeLabel(rel.type)}
                          </Badge>
                          {rel.targetEntity ? (
                            <button
                              onClick={() => onEntitySelect?.(rel.targetEntity!.id)}
                              className="block text-sm text-gray-800 hover:text-blue-600 truncate mt-1"
                            >
                              → {rel.targetEntity.name}
                            </button>
                          ) : (
                            <p className="text-xs text-gray-500 mt-1">目标不存在</p>
                          )}
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteRelation(rel.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 入站关系 */}
              {relationships?.incoming && relationships.incoming.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">入站关系</Label>
                  <div className="space-y-1">
                    {relationships.incoming.map((rel) => (
                      <div
                        key={rel.id}
                        className="flex items-center justify-between p-2 bg-purple-50 rounded border border-purple-100 text-sm"
                      >
                        <div className="flex-1 min-w-0">
                          <Badge variant="outline" className={`text-xs ${getRelationTypeBadgeColor(rel.type)}`}>
                            {getRelationTypeLabel(rel.type, true)}
                          </Badge>
                          {rel.sourceEntity ? (
                            <button
                              onClick={() => onEntitySelect?.(rel.sourceEntity!.id)}
                              className="block text-sm text-gray-800 hover:text-blue-600 truncate mt-1"
                            >
                              ← {rel.sourceEntity.name}
                            </button>
                          ) : (
                            <p className="text-xs text-gray-500 mt-1">源不存在</p>
                          )}
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteRelation(rel.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 无关系提示 */}
              {(!relationships?.outgoing || relationships.outgoing.length === 0) &&
               (!relationships?.incoming || relationships.incoming.length === 0) && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  <p>暂无关系</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 删除按钮 */}
        {isAdmin && (
          <div className="p-4">
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full text-red-600 border-red-300 hover:bg-red-50">
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除实体
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认删除</AlertDialogTitle>
                  <AlertDialogDescription>
                    确定要删除实体 "{entity.name}" 吗？此操作无法撤销。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    删除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      {/* 内容编辑器对话框 */}
      <EntityContentEditor
        open={showContentEditor}
        onOpenChange={setShowContentEditor}
        entityId={entity.id}
        entityName={entity.name}
        content={formData.content}
        larkDocUrl={formData.larkDocUrl || null}
        onSave={async (content) => {
          setFormData(prev => ({ ...prev, content }));
          await updateMutation.mutateAsync({
            id: entityId!,
            content,
          });
        }}
      />
    </div>
  );
}
