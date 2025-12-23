import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Search, Trash2, Network, FileText, ExternalLink, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, XCircle, Edit3, X } from "lucide-react";
import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import EntityEditSidebar from "@/components/EntityEditSidebar";

const statusColors: Record<string, string> = {
  Development: "bg-blue-100 text-blue-800",
  Testing: "bg-yellow-100 text-yellow-800",
  Production: "bg-green-100 text-green-800",
  Deprecated: "bg-gray-100 text-gray-800",
};

const typeColors: Record<string, string> = {
  Service: "bg-purple-100 text-purple-800",
  API: "bg-orange-100 text-orange-800",
  Component: "bg-cyan-100 text-cyan-800",
  Page: "bg-pink-100 text-pink-800",
  Document: "bg-blue-100 text-blue-800",
  Module: "bg-green-100 text-green-800",
  Documentation: "bg-gray-100 text-gray-800",
};

const allEntityTypes = ["Service", "API", "Component", "Page", "Module", "Documentation", "Document"];
const allStatuses = ["Development", "Testing", "Production", "Deprecated"];

const pageSizeOptions = [10, 20, 50, 100];

export default function Entities() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteEntityId, setDeleteEntityId] = useState<number | null>(null);
  const [limit, setLimit] = useState(10);
  
  // 实体编辑侧边栏状态
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);
  
  // 筛选状态
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);

  // 获取用户信息，用于权限控制
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const { data, isLoading, refetch } = trpc.entities.list.useQuery({
    search,
    page,
    limit,
    sortBy: "updatedAt",
    order: "desc",
  });

  // 客户端筛选（因为后端 API 可能不支持类型和状态筛选）
  const filteredItems = useMemo(() => {
    if (!data?.items) return [];
    
    return data.items.filter(item => {
      const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(item.type);
      const statusMatch = selectedStatuses.length === 0 || selectedStatuses.includes(item.status);
      return typeMatch && statusMatch;
    });
  }, [data?.items, selectedTypes, selectedStatuses]);

  const utils = trpc.useUtils();
  
  // 删除实体 mutation
  const deleteMutation = trpc.entities.delete.useMutation({
    onSuccess: () => {
      toast.success("实体删除成功");
      utils.entities.list.invalidate();
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

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handlePageSizeChange = (value: string) => {
    setLimit(parseInt(value));
    setPage(1);
  };

  const handleTypeToggle = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleStatusToggle = (status: string) => {
    setSelectedStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const clearFilters = () => {
    setSelectedTypes([]);
    setSelectedStatuses([]);
    setSearch("");
    setPage(1);
  };

  const hasActiveFilters = selectedTypes.length > 0 || selectedStatuses.length > 0 || search.length > 0;
  const activeFilterCount = selectedTypes.length + selectedStatuses.length + (search.length > 0 ? 1 : 0);

  // 分页计算
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.total || 0;

  // 生成页码数组
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages + 2) {
      // 显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 始终显示第一页
      pages.push(1);
      
      if (page > 3) {
        pages.push("...");
      }
      
      // 显示当前页附近的页码
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (page < totalPages - 2) {
        pages.push("...");
      }
      
      // 始终显示最后一页
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 主内容区域 */}
      <div className="min-h-screen bg-gray-50 flex-1 overflow-auto">
        <div className="container mx-auto py-8">
          {/* 页面标题 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">实体管理</h1>
            <p className="text-gray-600 mt-2">管理所有技术实体，包括服务、API、组件等</p>
          </div>

          {/* 工具栏 */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                {/* 搜索框 */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="搜索实体名称..."
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {/* 筛选器弹出框 */}
                <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="relative">
                      <Filter className="h-4 w-4 mr-2" />
                      筛选
                      {activeFilterCount > 0 && (
                        <Badge 
                          variant="secondary" 
                          className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-blue-500 text-white"
                        >
                          {activeFilterCount}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="start">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">筛选条件</h4>
                        {hasActiveFilters && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="h-8 text-xs text-gray-500 hover:text-gray-700"
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            清除全部
                          </Button>
                        )}
                      </div>
                      
                      {/* 类型筛选 */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">实体类型</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {allEntityTypes.map(type => (
                            <div key={type} className="flex items-center space-x-2">
                              <Checkbox
                                id={`type-${type}`}
                                checked={selectedTypes.includes(type)}
                                onCheckedChange={() => handleTypeToggle(type)}
                              />
                              <Label
                                htmlFor={`type-${type}`}
                                className="text-sm cursor-pointer"
                              >
                                {type}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* 状态筛选 */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">状态</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {allStatuses.map(status => (
                            <div key={status} className="flex items-center space-x-2">
                              <Checkbox
                                id={`status-${status}`}
                                checked={selectedStatuses.includes(status)}
                                onCheckedChange={() => handleStatusToggle(status)}
                              />
                              <Label
                                htmlFor={`status-${status}`}
                                className="text-sm cursor-pointer"
                              >
                                {status}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* 已激活的筛选标签 */}
                {hasActiveFilters && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedTypes.map(type => (
                      <Badge
                        key={type}
                        variant="secondary"
                        className={`${typeColors[type]} cursor-pointer`}
                        onClick={() => handleTypeToggle(type)}
                      >
                        {type}
                        <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                    {selectedStatuses.map(status => (
                      <Badge
                        key={status}
                        variant="secondary"
                        className={`${statusColors[status]} cursor-pointer`}
                        onClick={() => handleStatusToggle(status)}
                      >
                        {status}
                        <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Link href="/graph">
                  <Button variant="outline">
                    <Network className="h-4 w-4 mr-2" />
                    知识图谱
                  </Button>
                </Link>
                {isAdmin && (
                  <Link href="/entities/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      创建新实体
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* 表格 */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : filteredItems.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>名称</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>负责人</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>最后更新时间</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((entity) => (
                      <TableRow key={entity.id}>
                        <TableCell className="font-medium">{entity.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={typeColors[entity.type] || "bg-gray-100 text-gray-800"}>
                            {entity.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{entity.owner}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={statusColors[entity.status] || "bg-gray-100 text-gray-800"}>
                            {entity.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(entity.updatedAt).toLocaleString("zh-CN")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* 编辑内容按钮 */}
                            {/* 飞书文档外部链接 */}
                            {entity.larkDocUrl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(entity.larkDocUrl!, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                飞书文档
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedEntityId(entity.id)}
                            >
                              <Edit3 className="h-4 w-4 mr-1" />
                              {isAdmin ? "编辑" : "查看"}
                            </Button>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteEntityId(entity.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* 优化的分页组件 */}
                <div className="flex items-center justify-between px-4 py-4 border-t">
                  {/* 左侧：显示统计信息和每页数量选择 */}
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">
                      共 {totalItems} 条记录
                      {(selectedTypes.length > 0 || selectedStatuses.length > 0) && 
                        `，筛选后 ${filteredItems.length} 条`
                      }
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">每页显示</span>
                      <Select value={limit.toString()} onValueChange={handlePageSizeChange}>
                        <SelectTrigger className="w-[70px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {pageSizeOptions.map(size => (
                            <SelectItem key={size} value={size.toString()}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-gray-600">条</span>
                    </div>
                  </div>

                  {/* 右侧：分页控制 */}
                  {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                      {/* 首页按钮 */}
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPage(1)}
                        disabled={page === 1}
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      
                      {/* 上一页按钮 */}
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      {/* 页码按钮 */}
                      {getPageNumbers().map((pageNum, index) => (
                        pageNum === "..." ? (
                          <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                            ...
                          </span>
                        ) : (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? "default" : "outline"}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setPage(pageNum as number)}
                          >
                            {pageNum}
                          </Button>
                        )
                      ))}
                      
                      {/* 下一页按钮 */}
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      
                      {/* 末页按钮 */}
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPage(totalPages)}
                        disabled={page === totalPages}
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                      
                      {/* 页码跳转 */}
                      <div className="flex items-center gap-2 ml-4">
                        <span className="text-sm text-gray-600">跳至</span>
                        <Input
                          type="number"
                          min={1}
                          max={totalPages}
                          className="w-16 h-8 text-center"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const value = parseInt((e.target as HTMLInputElement).value);
                              if (value >= 1 && value <= totalPages) {
                                setPage(value);
                              }
                            }
                          }}
                          onBlur={(e) => {
                            const value = parseInt(e.target.value);
                            if (value >= 1 && value <= totalPages) {
                              setPage(value);
                            }
                          }}
                          placeholder={page.toString()}
                        />
                        <span className="text-sm text-gray-600">页</span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  {hasActiveFilters ? "没有符合筛选条件的实体" : "暂无实体数据"}
                </p>
                {hasActiveFilters ? (
                  <Button variant="outline" className="mt-4" onClick={clearFilters}>
                    清除筛选条件
                  </Button>
                ) : isAdmin ? (
                  <Link href="/entities/new">
                    <Button variant="outline" className="mt-4">
                      创建第一个实体
                    </Button>
                  </Link>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

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

      {/* 实体编辑侧边栏 */}
      {selectedEntityId && (
        <EntityEditSidebar
          entityId={selectedEntityId}
          onClose={() => setSelectedEntityId(null)}
          onSuccess={() => {
            refetch();
          }}
          onEntitySelect={(id) => setSelectedEntityId(id)}
        />
      )}
    </div>
  );
}
