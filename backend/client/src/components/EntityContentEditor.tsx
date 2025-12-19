import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Save, X, ExternalLink, Maximize2, Minimize2 } from "lucide-react";
import VditorEditor from "./VditorEditor";

interface EntityContentEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: number;
  entityName: string;
  content: string;
  larkDocUrl?: string | null;
  onSave: (content: string) => Promise<void>;
  isLoading?: boolean;
}

/**
 * 实体内容编辑对话框
 * 使用 Vditor 编辑器编辑实体的 Markdown 内容
 * 默认宽度为屏幕宽度的 60%，全屏模式为 100%
 */
export default function EntityContentEditor({
  open,
  onOpenChange,
  entityId,
  entityName,
  content,
  larkDocUrl,
  onSave,
  isLoading = false,
}: EntityContentEditorProps) {
  const [editorContent, setEditorContent] = useState(content);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 当 content 属性变化时更新编辑器内容
  useEffect(() => {
    setEditorContent(content);
    setHasChanges(false);
  }, [content]);

  // 处理内容变化
  const handleContentChange = (value: string) => {
    setEditorContent(value);
    setHasChanges(value !== content);
  };

  // 处理保存
  const handleSave = async () => {
    if (!hasChanges) return;
    
    setIsSaving(true);
    try {
      await onSave(editorContent);
      setHasChanges(false);
    } catch (error) {
      console.error("保存失败:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // 处理关闭
  const handleClose = () => {
    if (hasChanges) {
      const confirmed = window.confirm("您有未保存的更改，确定要关闭吗？");
      if (!confirmed) return;
    }
    onOpenChange(false);
  };

  // 切换全屏
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // 计算编辑器高度
  const getEditorHeight = () => {
    if (isFullscreen) {
      return "calc(100vh - 180px)";
    }
    // 默认使用更大的高度
    return 600;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className={`
          ${isFullscreen 
            ? 'fixed inset-0 max-w-none w-screen h-screen max-h-screen m-0 rounded-none p-0' 
            : 'w-[60vw] max-h-[95vh]'
          } 
          flex flex-col
        `}
      >
        <DialogHeader className="flex-shrink-0 px-6 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                编辑内容 - {entityName}
                {hasChanges && (
                  <span className="text-xs text-orange-500 font-normal">
                    (有未保存的更改)
                  </span>
                )}
              </DialogTitle>
              <DialogDescription>
                使用 Markdown 编辑器编辑实体内容，支持所见即所得模式
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {larkDocUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(larkDocUrl, "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  飞书文档
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                title={isFullscreen ? "退出全屏" : "全屏编辑"}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div 
          className={`
            flex-1 overflow-hidden 
            ${isFullscreen 
              ? 'h-screen' 
              : 'min-h-[600px] h-[70vh]'
            }
          `}
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">加载中...</span>
            </div>
          ) : (
            <VditorEditor
              value={editorContent}
              onChange={handleContentChange}
              onSave={handleSave}
              height={getEditorHeight()}
              placeholder="请输入实体内容，支持 Markdown 格式..."
            />
          )}
        </div>

        <DialogFooter className={`flex-shrink-0 flex items-center justify-between sm:justify-between ${isFullscreen ? 'px-6 pb-6' : ''}`}>
          <div className="text-sm text-gray-500">
            提示：按 Ctrl+Enter 可快速保存
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleClose}>
              <X className="h-4 w-4 mr-1" />
              取消
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              保存
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
