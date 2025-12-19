import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { trpc } from "@/lib/trpc";
import { ExternalLink, Loader2, Trash2, Plus, Search, ArrowLeftRight, Edit3 } from "lucide-react";
import EntityContentEditor from "@/components/EntityContentEditor";
import { useEffect, useState, useMemo } from "react";
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

// 关系类型与目标实体类型的映射配置
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
    suggestedTargetType: null, // 依赖关系不限制类型
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
    suggestedTargetType: null, // 包含关系根据源实体类型动态确定
    description: "当前实体包含以下实体",
    reverseDescription: "当前实体被以下实体包含",
  },
};

// 根据源实体类型推荐包含关系的目标类型
const getContainsTargetType = (sourceType: string): string | null => {
  const containsMapping: Record<string, string> = {
    Service: "API", // 服务通常包含 API
    Page: "Component", // 页面通常包含组件
    Module: "Component", // 模块通常包含组件
  };
  return containsMapping[sourceType] || null;
};

export default function EntityForm() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/entities/:id/edit");
  const isEdit = !!params?.id;
  
  // 获取用户信息，用于权限控制
  const { user, loading: authLoading } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  // 如果不是管理员，重定向到实体列表页
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      toast.error("您没有权限访问此页面");
      navigate("/entities");
    }
  }, [authLoading, isAdmin, navigate]);
  const entityId = params?.id ? parseInt(params.id) : undefined;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddRelationDialog, setShowAddRelationDialog] = useState(false);
  const [newRelationType, setNewRelationType] = useState<"EXPOSES_API" | "DEPENDS_ON" | "USES_COMPONENT" | "CONTAINS">("DEPENDS_ON");
  const [newRelationTargetIds, setNewRelationTargetIds] = useState<number[]>([]);
	  const [newRelationTargetType, setNewRelationTargetType] = useState<string | null>(null);
	  // 新增：搜索关键词状态
	  const [entitySearchQuery, setEntitySearchQuery] = useState("");
	  // 新增：关系反转状态
	  const [isRelationReversed, setIsRelationReversed] = useState(false);
	  // 新增：内容编辑器状态
	  const [showContentEditor, setShowContentEditor] = useState(false);
	  
	  // 飞书文档创建 Mutation
	  const createLarkDocMutation = trpc.lark.createDoc.useMutation({
	    onSuccess: (data) => {
	      toast.success("飞书文档创建成功");
	      setFormData(prev => ({ ...prev, larkDocUrl: data.larkDocUrl }));
	      // 刷新实体数据以更新 UI
	      refetchEntity();
	    },
	    onError: (error) => {
	      toast.error(`飞书文档创建失败: ${error.message}`);
	    },
	  });
	
	  const handleCreateLarkDoc = () => {
	    if (!entity) {
	      toast.error("实体数据未加载");
	      return;
	    }
	    
	    // 检查实体类型是否支持模板
	    const supportedTypes = ["Service", "API", "Page", "Component"];
	    if (!supportedTypes.includes(entity.type)) {
	      toast.error(`实体类型 ${entity.type} 暂不支持自动创建飞书文档`);
	      return;
	    }
	
	    createLarkDocMutation.mutate({
	      entityId: entity.id,
	      entityName: entity.name,
	      entityType: entity.type as "Service" | "API" | "Page" | "Component",
	    });
	  };

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
    larkDocUrl: "", // 飞书文档链接字段
    content: "", // Markdown 内容字段
  });

	  // 获取实体数据（编辑模式）
	  const { data: entity, isLoading: isLoadingEntity, refetch: refetchEntity } = trpc.entities.getById.useQuery(
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
        larkDocUrl: entity.larkDocUrl || "", // 填充 larkDocUrl 字段
        content: entity.content || "", // 填充 content 字段
      });
    }
  }, [entity]);

  // 关系类型变化时自动设置目标实体类型（选项联动逻辑）
  useEffect(() => {
    const config = RELATION_TYPE_CONFIG[newRelationType];
    if (config) {
      let suggestedType = config.suggestedTargetType;
      
      // 特殊处理 CONTAINS 关系：根据当前实体类型推荐
      if (newRelationType === "CONTAINS" && entity) {
        suggestedType = getContainsTargetType(entity.type);
      }
      
      // 如果有推荐类型，自动设置
      if (suggestedType) {
        setNewRelationTargetType(suggestedType);
      }
      // 如果没有推荐类型（如 DEPENDS_ON），保持当前选择或设为全部
      // 不自动重置，让用户保持之前的选择
    }
    // 清空已选择的目标实体
    setNewRelationTargetIds([]);
  }, [newRelationType, entity]);

  // 计算过滤后的实体列表（搜索 + 类型过滤）
  const filteredEntities = useMemo(() => {
    if (!entitiesList?.items) return [];
    
    return entitiesList.items
      .filter((e) => e.id !== entityId) // 排除当前实体
      .filter((e) => !newRelationTargetType || e.type === newRelationTargetType) // 类型过滤
      .filter((e) => {
        // 搜索过滤：匹配名称或类型
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
      // 单条关系创建成功时不关闭对话框，由 handleAddRelation 统一处理
      refetchRelationships();
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
	        larkDocUrl: formData.larkDocUrl || undefined, // 确保 larkDocUrl 被传递
	      });
    } else {
      createMutation.mutate({
        ...formData,
        httpMethod: formData.type === "API" ? formData.httpMethod : undefined,
        apiPath: formData.type === "API" ? formData.apiPath : undefined,
        relatedToId,
        relationshipType: relationshipType || undefined,
      } as any); // 强制类型转换以避免 TypeScript 错误，因为 formData 包含所有字段，但 createMutation 只接受部分
    }
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      uniqueId: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    }));
  };

  const handleAddRelation = async () => {
    if (!entityId || newRelationTargetIds.length === 0) {
      toast.error("请选择目标实体");
      return;
    }

    // 批量创建关系
    let successCount = 0;
    let failCount = 0;
    
    for (const targetId of newRelationTargetIds) {
      try {
        // 根据是否反转来决定 sourceId 和 targetId
        const relationData = isRelationReversed
          ? {
              sourceId: targetId,
              targetId: entityId,
              type: newRelationType,
            }
          : {
              sourceId: entityId,
              targetId,
              type: newRelationType,
            };
        
        await createRelationMutation.mutateAsync(relationData);
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
    setShowAddRelationDialog(false);
    setNewRelationTargetIds([]);
    setEntitySearchQuery("");
    setIsRelationReversed(false);
  };

  const handleDeleteRelation = (relationId: number) => {
    deleteRelationMutation.mutate({ id: relationId });
  };

  // 重置对话框状态
  const handleDialogOpenChange = (open: boolean) => {
    setShowAddRelationDialog(open);
    if (!open) {
      // 关闭时重置所有状态
      setNewRelationTargetIds([]);
      setEntitySearchQuery("");
      setIsRelationReversed(false);
      setNewRelationType("DEPENDS_ON");
      setNewRelationTargetType(null);
    }
  };

  const getRelationTypeLabel = (type: string, reversed: boolean = false) => {
    const config = RELATION_TYPE_CONFIG[type];
    if (!config) return type;
    return reversed ? config.reverseLabel : config.label;
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

  // 获取当前关系类型的描述
  const getCurrentRelationDescription = () => {
    const config = RELATION_TYPE_CONFIG[newRelationType];
    if (!config) return "";
    return isRelationReversed ? config.reverseDescription : config.description;
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

	              {/* 飞书文档链接 (仅编辑模式) */}
	              {isEdit && (
	                <div className="space-y-2">
	                  <Label htmlFor="larkDocUrl">飞书文档链接 (Lark Doc URL)</Label>
	                  <Input
	                    id="larkDocUrl"
	                    value={formData.larkDocUrl}
	                    onChange={(e) => setFormData({ ...formData, larkDocUrl: e.target.value })}
	                    placeholder="例如：https://docs.feishu.cn/docs/doccn..."
	                  />
	                  <div className="flex items-center gap-2">
	                    {formData.larkDocUrl && (
	                      <a
	                        href={formData.larkDocUrl}
	                        target="_blank"
	                        rel="noopener noreferrer"
	                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
	                      >
	                        在飞书中查看当前文档
	                        <ExternalLink className="h-3 w-3" />
	                      </a>
	                    )}
	                    {!formData.larkDocUrl && (
		                    <Button
		                        type="button"
		                        variant="outline"
		                        size="sm"
		                        onClick={handleCreateLarkDoc}
		                        disabled={createLarkDocMutation.isPending || !isAdmin || !entity}
		                      >
		                        {createLarkDocMutation.isPending ? (
		                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
		                        ) : (
		                          <Plus className="h-4 w-4 mr-2" />
		                        )}
		                        创建飞书文档
		                      </Button>
	                    )}
	                  </div>
	                </div>
	              )}

	              {/* 内容编辑器 (仅编辑模式) */}
	              {isEdit && (
	                <div className="space-y-2">
	                  <Label>实体内容 (Markdown)</Label>
	                  <div className="flex items-center gap-2">
	                    <Button
	                      type="button"
	                      variant="outline"
	                      onClick={() => setShowContentEditor(true)}
	                    >
	                      <Edit3 className="h-4 w-4 mr-2" />
	                      编辑内容
	                    </Button>
	                    {formData.content && (
	                      <span className="text-sm text-gray-500">
	                        已有内容 ({formData.content.length} 字符)
	                      </span>
	                    )}
	                  </div>
	                  <p className="text-xs text-gray-500">
	                    使用 Vditor 编辑器编辑实体的详细内容，支持 Markdown 格式
	                  </p>
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
                  <Dialog open={showAddRelationDialog} onOpenChange={handleDialogOpenChange}>
                    <DialogTrigger asChild>
                            <Button type="button" size="sm" disabled={!isAdmin}>
                        <Plus className="h-4 w-4 mr-2" />
                        添加关系
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>添加新关系</DialogTitle>
                        <DialogDescription>
                          选择关系类型和目标实体
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        {/* 关系类型选择 */}
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

                        {/* 关系反转开关 */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                          <div className="flex items-center gap-2">
                            <ArrowLeftRight className="h-4 w-4 text-gray-500" />
                            <div>
                              <Label htmlFor="reverseRelation" className="text-sm font-medium cursor-pointer">
                                反转关系方向
                              </Label>
                              <p className="text-xs text-gray-500">
                                {isRelationReversed 
                                  ? `目标实体 → ${getRelationTypeLabel(newRelationType, false)} → 当前实体`
                                  : `当前实体 → ${getRelationTypeLabel(newRelationType, false)} → 目标实体`
                                }
                              </p>
                            </div>
                          </div>
                          <Switch
                            id="reverseRelation"
                            checked={isRelationReversed}
                            onCheckedChange={setIsRelationReversed}
                          />
                        </div>

                        {/* 关系描述提示 */}
                        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
                          <span className="font-medium">关系说明：</span>{" "}
                          {getCurrentRelationDescription()}
                        </div>

                        {/* 目标实体类型过滤 */}
                        <div className="space-y-2">
                          <Label htmlFor="targetEntityType">目标实体类型</Label>
                          <Select
                            value={newRelationTargetType || "all"}
                            onValueChange={(value) => {
                              setNewRelationTargetType(value === "all" ? null : value);
                              setNewRelationTargetIds([]); // 切换类型时重置目标实体
                            }}
                          >
                            <SelectTrigger id="targetEntityType">
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
                          {/* 类型推荐提示 */}
                          {RELATION_TYPE_CONFIG[newRelationType]?.suggestedTargetType && (
                            <p className="text-xs text-gray-500">
                              💡 已根据关系类型自动选择推荐的目标类型
                            </p>
                          )}
                        </div>

                        {/* 搜索框 */}
                        <div className="space-y-2">
                          <Label>目标实体 (可多选)</Label>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="搜索实体名称、类型或 ID..."
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
                              className="text-gray-500 hover:text-gray-700"
                            >
                              清空选择
                            </Button>
                          </div>
                        )}

                        {/* 实体列表 */}
                        <div className="border rounded-md max-h-[200px] overflow-y-auto">
                          {filteredEntities.length > 0 ? (
                            filteredEntities.map((entity) => (
                              <div
                                key={entity.id}
                                className={`flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 ${
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
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm truncate block">
                                    {entity.name}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {entity.type} · {entity.uniqueId}
                                  </span>
                                </div>
                                <Badge variant="outline" className="text-xs shrink-0">
                                  {entity.type}
                                </Badge>
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
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleDialogOpenChange(false)}
                        >
                          取消
                        </Button>
                        <Button
                          type="button"
                          onClick={handleAddRelation}
                          disabled={createRelationMutation.isPending || newRelationTargetIds.length === 0}
                        >
                          {createRelationMutation.isPending && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          添加 {newRelationTargetIds.length > 0 && `(${newRelationTargetIds.length})`}
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
                          className="flex items-start justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 hover:shadow-md transition-shadow"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant="outline"
                                className={`text-xs ${getRelationTypeBadgeColor(rel.type)}`}
                              >
                                {getRelationTypeLabel(rel.type)}
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
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRelation(rel.id)}
                              disabled={deleteRelationMutation.isPending}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
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
                          className="flex items-start justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 hover:shadow-md transition-shadow"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-gray-400">←</span>
                              <Badge
                                variant="outline"
                                className={`text-xs ${getRelationTypeBadgeColor(rel.type)}`}
                              >
                                {getRelationTypeLabel(rel.type)}
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
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRelation(rel.id)}
                              disabled={deleteRelationMutation.isPending}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
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

      {/* Vditor 内容编辑器对话框 */}
      {isEdit && entity && (
        <EntityContentEditor
          open={showContentEditor}
          onOpenChange={setShowContentEditor}
          entityId={entity.id}
          entityName={entity.name}
          content={formData.content}
          larkDocUrl={formData.larkDocUrl || null}
          onSave={async (content) => {
            setFormData(prev => ({ ...prev, content }));
          }}
        />
      )}
    </div>
  );
}
