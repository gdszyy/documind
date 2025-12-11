import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { ExternalLink, Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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

export default function Graph() {
  const [, navigate] = useLocation();
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["Service", "API", "Component", "Page", "Module"]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["Development", "Testing", "Production"]);
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);
  const [deleteEntityId, setDeleteEntityId] = useState<number | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  const { data, isLoading } = trpc.graph.getData.useQuery({
    types: selectedTypes as any,
    statuses: selectedStatuses as any,
  });

  const { data: selectedEntity } = trpc.entities.getById.useQuery(
    { id: selectedEntityId! },
    { enabled: !!selectedEntityId }
  );

  const { data: relationships } = trpc.entities.getRelationships.useQuery(
    { id: selectedEntityId! },
    { enabled: !!selectedEntityId }
  );

  const utils = trpc.useUtils();
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
        <SheetContent className="w-[400px] overflow-y-auto" hideCloseButton showOverlay={false}>
          {selectedEntity && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <span className="text-2xl">{typeIcons[selectedEntity.type]}</span>
                  {selectedEntity.name}
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* 基本信息 */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm text-gray-500">类型</Label>
                    <div className="mt-1">
                      <Badge variant="secondary">{selectedEntity.type}</Badge>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-500">状态</Label>
                    <div className="mt-1">
                      <Badge variant="secondary">{selectedEntity.status}</Badge>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-500">负责人</Label>
                    <p className="mt-1 text-sm">{selectedEntity.owner}</p>
                  </div>

                  {selectedEntity.description && (
                    <div>
                      <Label className="text-sm text-gray-500">描述</Label>
                      <p className="mt-1 text-sm text-gray-700">{selectedEntity.description}</p>
                    </div>
                  )}
                </div>

                {/* 关联信息 */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">关联信息</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedEntity.larkDocUrl && (
                      <div>
                        <Label className="text-sm text-gray-500">飞书文档</Label>
                        <a
                          href={selectedEntity.larkDocUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          在飞书中查看
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}

                    {relationships && (
                      <>
                        {relationships.outgoing.length > 0 && (
                          <div>
                            <Label className="text-sm text-gray-500">依赖的实体（传出）</Label>
                            <ul className="mt-1 text-sm space-y-1">
                              {relationships.outgoing.map((rel) => (
                                <li key={rel.id} className="text-gray-700">
                                  • {rel.type} → 目标ID: {rel.targetId}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {relationships.incoming.length > 0 && (
                          <div>
                            <Label className="text-sm text-gray-500">被依赖的实体（传入）</Label>
                            <ul className="mt-1 text-sm space-y-1">
                              {relationships.incoming.map((rel) => (
                                <li key={rel.id} className="text-gray-700">
                                  • {rel.type} ← 来源ID: {rel.sourceId}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* 操作按钮 */}
                <div className="space-y-2">
                  <Link href={`/entities/${selectedEntity.id}/edit`}>
                    <Button className="w-full" variant="outline">
                      在 DocuMind 中编辑
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
