import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { FileTree, FileNode } from "@/components/FileTree";
import { CreateAssetDialog } from "@/components/CreateAssetDialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Loader2, 
  Edit, 
  Eye, 
  Save, 
  X, 
  Plus, 
  Trash2, 
  PanelLeftClose, 
  PanelLeft,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import MDEditor from "@uiw/react-md-editor";
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

export default function DocumentViewer() {
  const { user, isAuthenticated } = useAuth();
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const utils = trpc.useUtils();

  // Fetch file tree
  const { data: fileTree, isLoading: treeLoading, refetch: refetchTree } = trpc.docs.getFileTree.useQuery();

  // Fetch file content
  const { 
    data: fileData, 
    isLoading: contentLoading,
    refetch: refetchContent 
  } = trpc.docs.getFileContent.useQuery(
    { path: selectedPath! },
    { enabled: !!selectedPath }
  );

  // Update file mutation
  const updateFile = trpc.docs.updateFileContent.useMutation({
    onSuccess: () => {
      toast.success("文件保存成功");
      setIsEditing(false);
      refetchContent();
    },
    onError: (error) => {
      toast.error(`保存失败: ${error.message}`);
    },
  });

  // Delete file mutation
  const deleteFile = trpc.docs.deleteAsset.useMutation({
    onSuccess: () => {
      toast.success("文件删除成功");
      setSelectedPath(null);
      refetchTree();
    },
    onError: (error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  const handleFileSelect = (path: string) => {
    setSelectedPath(path);
    setIsEditing(false);
  };

  const handleEdit = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    setEditContent(fileData?.content || "");
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!selectedPath) return;
    updateFile.mutate({
      path: selectedPath,
      content: editContent,
      commitMessage: `Update ${selectedPath}`,
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditContent("");
  };

  const handleDelete = () => {
    if (!selectedPath) return;
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedPath) return;
    deleteFile.mutate({ path: selectedPath });
    setDeleteDialogOpen(false);
  };

  const handleCreateSuccess = () => {
    refetchTree();
  };

  const isMarkdown = selectedPath?.endsWith('.md');

  return (
    <div className="flex h-screen bg-background">
      {/* Left sidebar - File tree */}
      <div 
        className={`border-r border-border flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'w-0' : 'w-80'
        }`}
        style={{ overflow: sidebarCollapsed ? 'hidden' : 'visible' }}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold">文档架构</h2>
            <p className="text-sm text-muted-foreground mt-1">四层资产结构</p>
          </div>
          {isAuthenticated && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCreateDialogOpen(true)}
              title="新增资产"
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>
        <ScrollArea className="flex-1">
          {treeLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : fileTree && fileTree.length > 0 ? (
            <div className="p-2">
              <FileTree
                nodes={fileTree as FileNode[]}
                onFileSelect={handleFileSelect}
                selectedPath={selectedPath || undefined}
              />
            </div>
          ) : (
            <div className="p-4 text-center">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                未找到四层资产
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                请确保 docs/modules 目录下有模块文档
              </p>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Right content area */}
      <div className="flex-1 flex flex-col">
        {selectedPath ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  title={sidebarCollapsed ? "展开侧边栏" : "收起侧边栏"}
                >
                  {sidebarCollapsed ? (
                    <PanelLeft className="w-4 h-4" />
                  ) : (
                    <PanelLeftClose className="w-4 h-4" />
                  )}
                </Button>
                <div>
                  <h3 className="text-lg font-semibold">
                    {fileData?.content && fileData.content.includes('title:') 
                      ? fileData.content.match(/title:\s*(.+)/)?.[1] || selectedPath.split('/').pop()
                      : selectedPath.split('/').pop()}
                  </h3>
                  <p className="text-sm text-muted-foreground">{selectedPath}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isMarkdown && !isEditing && (
                  <>
                    <Button onClick={handleEdit} variant="default" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      编辑
                    </Button>
                    {isAuthenticated && (
                      <Button 
                        onClick={handleDelete} 
                        variant="destructive" 
                        size="sm"
                        disabled={deleteFile.isPending}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        删除
                      </Button>
                    )}
                  </>
                )}
                {isEditing && (
                  <>
                    <Button 
                      onClick={handleSave} 
                      variant="default" 
                      size="sm"
                      disabled={updateFile.isPending}
                    >
                      {updateFile.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      保存
                    </Button>
                    <Button 
                      onClick={handleCancel} 
                      variant="outline" 
                      size="sm"
                      disabled={updateFile.isPending}
                    >
                      <X className="w-4 h-4 mr-2" />
                      取消
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {contentLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : isEditing ? (
                <div className="h-full" data-color-mode="light">
                  <MDEditor
                    value={editContent}
                    onChange={(val) => setEditContent(val || "")}
                    height="100%"
                    preview="live"
                    hideToolbar={false}
                  />
                </div>
              ) : isMarkdown ? (
                <ScrollArea className="h-full">
                  <div className="prose prose-sm max-w-none p-8">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw, rehypeSanitize]}
                    >
                      {fileData?.content || ""}
                    </ReactMarkdown>
                  </div>
                </ScrollArea>
              ) : (
                <ScrollArea className="h-full">
                  <pre className="p-8 text-sm font-mono">
                    {fileData?.content || ""}
                  </pre>
                </ScrollArea>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="absolute top-4 left-4"
              title={sidebarCollapsed ? "展开侧边栏" : "收起侧边栏"}
            >
              {sidebarCollapsed ? (
                <PanelLeft className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </Button>
            <div className="text-center">
              <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>选择一个文件以查看内容</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Asset Dialog */}
      <CreateAssetDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除 {selectedPath} 吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
