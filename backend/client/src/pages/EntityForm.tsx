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
import { trpc } from "@/lib/trpc";
import { ExternalLink, Loader2, Trash2, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function EntityForm() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/entities/:id/edit");
  const isEdit = !!params?.id;
  const entityId = params?.id ? parseInt(params.id) : undefined;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddRelationDialog, setShowAddRelationDialog] = useState(false);
  const [newRelationType, setNewRelationType] = useState<"EXPOSES_API" | "DEPENDS_ON" | "USES_COMPONENT" | "CONTAINS">("DEPENDS_ON");
  const [newRelationTargetId, setNewRelationTargetId] = useState<number | null>(null);

  // 从 URL 参数获取预填充信息
  const searchParams = new URLSearchParams(window.location.search);
  const prefilledType = searchParams.get("type") as "Service" | "API" | "Component" | "Page" | "Document" | null;
  const relatedToId = searchParams.get("relatedTo") ? parseInt(searchParams.get("relatedTo")!) : undefined;
  const relationshipType = searchParams.get("relationshipType") as "EXPOSES_API" | "DEPENDS_ON" | "USES_COMPONENT" | "CONTAINS" | null;

  const [formData, setFormData] = useState({
    name: "",
    uniqueId: "",
    type: prefilledType || ("Service" as "Service" | "API" | "Component" | "Page" | "Document"),
    owner: "",
    status: "Development" as "Development" | "Testing" | "Production" | "Deprecated",
    description: "",
    httpMethod: "GET" as "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
    apiPath: "",
  });

  // 获取实体数据（编辑模式）
  const { data: entity, isLoading: isLoadingEntity } = trpc.entities.getById.useQuery(
    { id: entityId! },
    { enabled: isEdit && !!entityId }
  );

  // 获取实体关系
  const { data: relationships, refetch: refetchRelationships } = trpc.entities.getRelationships.useQuery(
    { id: entityId! },
    { enabled: isEdit && !!entityId }
  );

  // 获取所有实体列表（用于选择关系目标）
  const { data: entitiesList } = trpc.entities.list.useQuery(
    { page: 1, limit: 100, sortBy: "name", order: "asc" },
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
      });
    }
  }, [entity]);

  const utils = trpc.useUtils();
  const createMutation = trpc.entities.create.useMutation({
    onSuccess: () => {
      toast.success("实体创建成功");
      utils.entities.list.invalidate();
      navigate("/entities");
    },
    onError: (error) => {
      toast.error(`创建失败: ${error.message}`);
    },
  });

  const updateMutation = trpc.entities.update.useMutation({
    onSuccess: () => {
      toast.success("实体更新成功");
      utils.entities.list.invalidate();
      navigate("/entities");
    },
    onError: (error) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });

  const deleteMutation = trpc.entities.delete.useMutation({
    onSuccess: () => {
      toast.success("实体删除成功");
      utils.entities.list.invalidate();
      navigate("/entities");
    },
    onError: (error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  const createRelationMutation = trpc.relationships.create.useMutation({
    onSuccess: () => {
      toast.success("关系创建成功");
      refetchRelationships();
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
    },
    onError: (error) => {
      toast.error(`删除关系失败: ${error.message}`);
    },
  });

  const handleDelete = () => {
    if (entityId) {
      deleteMutation.mutate({ id: entityId });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEdit && entityId) {
      updateMutation.mutate({
        id: entityId,
        ...formData,
        httpMethod: formData.type === "API" ? formData.httpMethod : undefined,
        apiPath: formData.type === "API" ? formData.apiPath : undefined,
      });
    } else {
      createMutation.mutate({
        ...formData,
        httpMethod: formData.type === "API" ? formData.httpMethod : undefined,
        apiPath: formData.type === "API" ? formData.apiPath : undefined,
        relatedToId,
        relationshipType: relationshipType || undefined,
      });
    }
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      uniqueId: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    }));
  };

  const handleAddRelation = () => {
    if (!entityId || !newRelationTargetId) {
      toast.error("请选择目标实体");
      return;
    }

    createRelationMutation.mutate({
      sourceId: entityId,
      targetId: newRelationTargetId,
      type: newRelationType,
    });
  };

  const handleDeleteRelation = (relationId: number) => {
    deleteRelationMutation.mutate({ id: relationId });
  };

  const getRelationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      EXPOSES_API: "暴露 API",
      DEPENDS_ON: "依赖于",
      USES_COMPONENT: "使用组件",
      CONTAINS: "包含",
    };
    return labels[type] || type;
  };

  const getRelationTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      EXPOSES_API: "bg-blue-100 text-blue-800",
      DEPENDS_ON: "bg-purple-100 text-purple-800",
      USES_COMPONENT: "bg-green-100 text-green-800",
      CONTAINS: "bg-orange-100 text-orange-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  if (isEdit && isLoadingEntity) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? "编辑实体" : "创建新实体"}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEdit ? "修改实体信息" : "填写实体信息以创建新的技术实体"}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>填写实体的基本信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 名称 */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  名称 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="例如：用户认证服务"
                  required
                />
              </div>

              {/* 唯一标识 */}
              <div className="space-y-2">
                <Label htmlFor="uniqueId">
                  唯一标识 (ID) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="uniqueId"
                  value={formData.uniqueId}
                  onChange={(e) => setFormData({ ...formData, uniqueId: e.target.value })}
                  placeholder="例如：user-auth-service"
                  required
                />
                <p className="text-sm text-gray-500">必须使用 kebab-case，如：my-new-service</p>
              </div>

              {/* 类型和负责人 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">
                    类型 <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    key={`type-${formData.type}`}
                    value={formData.type}
                    onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Service">服务</SelectItem>
                      <SelectItem value="API">API</SelectItem>
                      <SelectItem value="Component">组件</SelectItem>
                      <SelectItem value="Page">页面</SelectItem>
                      <SelectItem value="Document">说明文档</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="owner">
                    负责人 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="owner"
                    value={formData.owner}
                    onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                    placeholder="例如：张三"
                    required
                  />
                </div>
              </div>

              {/* API 类型专属字段 */}
              {formData.type === "API" && (
                <div className="space-y-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm font-medium text-orange-800">API 类型专属字段</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="httpMethod">
                        HTTP 方法 <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        key={`httpMethod-${formData.httpMethod}`}
                        value={formData.httpMethod}
                        onValueChange={(value: any) => setFormData({ ...formData, httpMethod: value })}
                      >
                        <SelectTrigger id="httpMethod">
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

                    <div className="space-y-2">
                      <Label htmlFor="apiPath">
                        API 路径 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="apiPath"
                        value={formData.apiPath}
                        onChange={(e) => setFormData({ ...formData, apiPath: e.target.value })}
                        placeholder="/api/v1/auth/login"
                        required={formData.type === "API"}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 状态 */}
              <div className="space-y-2">
                <Label htmlFor="status">
                  状态 <span className="text-red-500">*</span>
                </Label>
                <Select
                  key={`status-${formData.status}`}
                  value={formData.status}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger id="status">
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

              {/* 描述 */}
              <div className="space-y-2">
                <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="提供实体的详细描述..."
                  rows={4}
                />
              </div>

              {/* 关联信息（仅编辑模式） */}
              {isEdit && (entity?.larkDocUrl || relationships) && (
                <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Label>关联信息</Label>
                  {entity?.larkDocUrl && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700">飞书文档:</span>
                      <a
                        href={entity.larkDocUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        在飞书中查看
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 关系管理（仅编辑模式） */}
          {isEdit && relationships && (
            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>关系管理</CardTitle>
                    <CardDescription>管理此实体与其他实体的关系</CardDescription>
                  </div>
                  <Dialog open={showAddRelationDialog} onOpenChange={setShowAddRelationDialog}>
                    <DialogTrigger asChild>
                      <Button type="button" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        添加关系
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
                                ?.filter((e) => e.id !== entityId)
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
                {relationships.outgoing.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      此实体依赖的其他实体（出站关系）
                    </Label>
                    <div className="space-y-2">
                      {relationships.outgoing.map((rel) => (
                        <div
                          key={rel.id}
                          className="flex items-center justify-between p-3 bg-white border rounded-lg hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <Badge className={getRelationTypeBadgeColor(rel.type)}>
                              {getRelationTypeLabel(rel.type)}
                            </Badge>
                            <span className="text-gray-400">→</span>
                            {rel.targetEntity ? (
                              <button
                                type="button"
                                onClick={() => navigate(`/entities/${rel.targetEntity!.id}/edit`)}
                                className="text-blue-600 hover:underline font-medium flex items-center gap-1"
                              >
                                {rel.targetEntity.name}
                                <span className="text-xs text-gray-500">
                                  ({rel.targetEntity.type})
                                </span>
                              </button>
                            ) : (
                              <span className="text-gray-500">
                                目标实体不存在 (ID: {rel.targetId})
                              </span>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRelation(rel.id)}
                            disabled={deleteRelationMutation.isPending}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 入站关系 */}
                {relationships.incoming.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">
                      依赖此实体的其他实体（入站关系）
                    </Label>
                    <div className="space-y-2">
                      {relationships.incoming.map((rel) => (
                        <div
                          key={rel.id}
                          className="flex items-center justify-between p-3 bg-white border rounded-lg hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            {rel.sourceEntity ? (
                              <button
                                type="button"
                                onClick={() => navigate(`/entities/${rel.sourceEntity!.id}/edit`)}
                                className="text-blue-600 hover:underline font-medium flex items-center gap-1"
                              >
                                {rel.sourceEntity.name}
                                <span className="text-xs text-gray-500">
                                  ({rel.sourceEntity.type})
                                </span>
                              </button>
                            ) : (
                              <span className="text-gray-500">
                                源实体不存在 (ID: {rel.sourceId})
                              </span>
                            )}
                            <span className="text-gray-400">→</span>
                            <Badge className={getRelationTypeBadgeColor(rel.type)}>
                              {getRelationTypeLabel(rel.type)}
                            </Badge>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRelation(rel.id)}
                            disabled={deleteRelationMutation.isPending}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 无关系提示 */}
                {relationships.outgoing.length === 0 && relationships.incoming.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>暂无关系</p>
                    <p className="text-sm mt-1">点击"添加关系"按钮创建新关系</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 操作按钮 */}
          <div className="flex items-center justify-between mt-6">
            {isEdit ? (
              <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    删除实体
                  </Button>
                </AlertDialogTrigger>
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
            ) : (
              <div />
            )}
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/entities")}
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {isEdit ? "保存更改" : "创建实体"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
