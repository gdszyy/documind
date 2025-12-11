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
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Search } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

const statusColors = {
  Development: "bg-blue-100 text-blue-800",
  Testing: "bg-yellow-100 text-yellow-800",
  Production: "bg-green-100 text-green-800",
  Deprecated: "bg-gray-100 text-gray-800",
};

const typeColors = {
  Service: "bg-purple-100 text-purple-800",
  API: "bg-orange-100 text-orange-800",
  Component: "bg-cyan-100 text-cyan-800",
  Page: "bg-pink-100 text-pink-800",
  Document: "bg-blue-100 text-blue-800",
};

export default function Entities() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = trpc.entities.list.useQuery({
    search,
    page,
    limit,
    sortBy: "updatedAt",
    order: "desc",
  });

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1); // 重置到第一页
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">实体管理</h1>
          <p className="text-gray-600 mt-2">管理所有技术实体，包括服务、API、组件等</p>
        </div>

        {/* 工具栏 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索实体名称..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <Link href="/entities/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                创建新实体
              </Button>
            </Link>
          </div>
        </div>

        {/* 表格 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : data && data.items.length > 0 ? (
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
                  {data.items.map((entity) => (
                    <TableRow key={entity.id}>
                      <TableCell className="font-medium">{entity.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={typeColors[entity.type]}>
                          {entity.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{entity.owner}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={statusColors[entity.status]}>
                          {entity.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(entity.updatedAt).toLocaleString("zh-CN")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/entities/${entity.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            编辑
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* 分页 */}
              {data.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 py-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    上一页
                  </Button>
                  <span className="text-sm text-gray-600">
                    第 {page} 页，共 {data.totalPages} 页
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                    disabled={page === data.totalPages}
                  >
                    下一页
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">暂无实体数据</p>
              <Link href="/entities/new">
                <Button variant="outline" className="mt-4">
                  创建第一个实体
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
