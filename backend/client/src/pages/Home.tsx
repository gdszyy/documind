import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, GitBranch, List, Network } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto py-16">
        {/* 页面标题 */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            DocuMind
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            实体管理与知识图谱可视化平台
          </p>
          <p className="text-gray-500 mt-2">
            管理技术实体，构建知识网络，提升团队协作效率
          </p>
        </div>

        {/* 功能卡片 */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <List className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>实体管理</CardTitle>
              </div>
              <CardDescription>
                集中管理所有技术实体，包括服务、API、组件和页面。支持搜索、筛选和分页，轻松查找和编辑实体信息。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/entities">
                <Button className="w-full">进入实体列表</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Network className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>知识图谱</CardTitle>
              </div>
              <CardDescription>
                可视化展示实体间的关联关系，通过交互式图谱直观理解系统架构。支持按类型和状态筛选，快速定位关键节点。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/graph">
                <Button className="w-full" variant="outline">查看知识图谱</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* 核心特性 */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-900">核心特性</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                <Database className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">结构化管理</h3>
              <p className="text-sm text-gray-600">
                统一的数据模型，规范化的实体属性，确保信息的一致性和完整性
              </p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-4">
                <GitBranch className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-semibold mb-2">关系可视化</h3>
              <p className="text-sm text-gray-600">
                直观展示实体间的依赖和关联，帮助团队理解系统架构和数据流向
              </p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                <Network className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">飞书集成</h3>
              <p className="text-sm text-gray-600">
                自动创建飞书文档，将实体管理与文档协作无缝连接
              </p>
            </div>
          </div>
        </div>

        {/* 快速开始 */}
        <div className="text-center mt-16">
          <Link href="/entities/new">
            <Button size="lg" className="text-lg px-8">
              创建第一个实体
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
