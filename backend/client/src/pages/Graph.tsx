import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import {
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ExternalLink, Loader2, Plus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const typeColors = {
  Service: "#9333ea",
  API: "#ea580c",
  Component: "#0891b2",
  Page: "#db2777",
};

const typeIcons = {
  Service: "🔧",
  API: "📡",
  Component: "🧩",
  Page: "📄",
};

export default function Graph() {
  const [, navigate] = useLocation();
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["Service", "API", "Component", "Page"]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["Development", "Testing", "Production"]);
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const { data, isLoading, refetch } = trpc.graph.getData.useQuery({
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

  // 转换数据为 ReactFlow 格式
  useEffect(() => {
    if (data) {
      const flowNodes: Node[] = data.nodes.map((entity, index) => ({
        id: entity.id.toString(),
        type: "default",
        data: {
          label: (
            <div className="flex items-center gap-2">
              <span>{typeIcons[entity.type]}</span>
              <span className="font-medium">{entity.name}</span>
            </div>
          ),
        },
        position: { x: (index % 5) * 250, y: Math.floor(index / 5) * 150 },
        style: {
          background: typeColors[entity.type],
          color: "white",
          border: "2px solid white",
          borderRadius: "8px",
          padding: "10px",
          minWidth: "150px",
        },
      }));

      const flowEdges: Edge[] = data.edges.map((edge) => ({
        id: `${edge.sourceId}-${edge.targetId}`,
        source: edge.sourceId.toString(),
        target: edge.targetId.toString(),
        label: edge.type,
        type: "smoothstep",
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      }));

      setNodes(flowNodes as any);
      setEdges(flowEdges as any);
    }
  }, [data, setNodes, setEdges]);

  const handleNodeClick = useCallback((_: any, node: Node) => {
    setSelectedEntityId(parseInt(node.id));
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
            {["Service", "API", "Component", "Page"].map((type) => (
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
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            fitView
          >
            <Background />
            <Controls />
          </ReactFlow>
        )}
      </div>

      {/* 侧边信息面板 */}
      <Sheet open={!!selectedEntityId} onOpenChange={(open) => !open && setSelectedEntityId(null)}>
        <SheetContent className="w-[400px] overflow-y-auto">
          {selectedEntity && (
            <>
              <SheetHeader>
                <div className="flex items-center justify-between">
                  <SheetTitle className="flex items-center gap-2">
                    <span className="text-2xl">{typeIcons[selectedEntity.type]}</span>
                    {selectedEntity.name}
                  </SheetTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedEntityId(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
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
                            <Label className="text-sm text-gray-500">关联实体</Label>
                            <ul className="mt-1 text-sm space-y-1">
                              {relationships.outgoing.map((rel) => (
                                <li key={rel.id}>• {rel.type}</li>
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
    </div>
  );
}
