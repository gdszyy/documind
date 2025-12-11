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
import { ExternalLink, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function EntityForm() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/entities/:id/edit");
  const isEdit = !!params?.id;
  const entityId = params?.id ? parseInt(params.id) : undefined;

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
              {isEdit && entity?.larkDocUrl && (
                <div className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Label>关联信息</Label>
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
                </div>
              )}
            </CardContent>
          </Card>

          {/* 操作按钮 */}
          <div className="flex items-center justify-end gap-4 mt-6">
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
        </form>
      </div>
    </div>
  );
}
