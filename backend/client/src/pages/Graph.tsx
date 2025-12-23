import { useAuth } from "@/_core/hooks/useAuth";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Loader2, Trash2, Edit2, Download } from "lucide-react";
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

export default function Graph() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["Service", "API", "Component", "Page", "Module"]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["Development", "Testing", "Production"]);
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);
  const [deleteEntityId, setDeleteEntityId] = useState<number | null>(null);
  const [contextMenuEntity, setContextMenuEntity] = useState<{ id: number; x: number; y: number } | null>(null); // 右键菜单状态
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

// const [editFormData, setEditFormData] = useState({ ... }); // 移除 editFormData 状态

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

      // 添加右键菜单事件
      chartInstanceRef.current.on("contextmenu", (params: any) => {
        if (params.dataType === "node") {
          console.log("[ECharts] Node right-clicked:", params.data.id);
          params.event.event.preventDefault();
          setContextMenuEntity({
            id: parseInt(params.data.id),
            x: params.event.event.clientX,
            y: params.event.event.clientY,
          });
        }
      });
    }

    console.log("[ECharts] Converting data to ECharts format");

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
        color: "#000", // 修改为黑色
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
  }, [data]);

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
    <div className="h-screen flex bg-gray-50">
      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col h-screen">
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
              className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px]"
              style={{
                left: contextMenuEntity.x,
                top: contextMenuEntity.y,
              }}
            >
              {isAdmin && (
                <>
                  <button
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                    onClick={handleOpenSidebarFromContextMenu}
                  >
                    <Edit2 className="h-4 w-4" />
                    查看/编辑实体
                  </button>
                  <div className="border-t border-gray-200 my-1" />
                  <button
                    className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
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
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                  onClick={() => {
                    setSelectedEntityId(contextMenuEntity.id);
                    setContextMenuEntity(null);
                  }}
                >
                  <Edit2 className="h-4 w-4" />
                  查看详情
                </button>
              )}
            </div>
          </>
        )}


      </div>
    </div>
  );
}
