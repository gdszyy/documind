import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CreateAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type AssetType = 'module' | 'page' | 'component' | 'api';

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  module: '模块',
  page: '页面',
  component: '组件',
  api: 'API',
};

export function CreateAssetDialog({ open, onOpenChange, onSuccess }: CreateAssetDialogProps) {
  const [assetType, setAssetType] = useState<AssetType>('module');
  const [moduleName, setModuleName] = useState('');
  const [fileName, setFileName] = useState('');
  const [title, setTitle] = useState('');

  const createAsset = trpc.docs.createAsset.useMutation({
    onSuccess: () => {
      toast.success('资产创建成功');
      onSuccess();
      handleClose();
    },
    onError: (error) => {
      toast.error(`创建失败: ${error.message}`);
    },
  });

  const handleClose = () => {
    setAssetType('module');
    setModuleName('');
    setFileName('');
    setTitle('');
    onOpenChange(false);
  };

  const handleSubmit = () => {
    if (!moduleName.trim()) {
      toast.error('请输入模块名称');
      return;
    }
    if (!title.trim()) {
      toast.error('请输入资产标题');
      return;
    }
    if (assetType !== 'module' && !fileName.trim()) {
      toast.error('请输入文件名');
      return;
    }

    createAsset.mutate({
      moduleName: moduleName.trim(),
      assetType,
      fileName: fileName.trim() || 'README',
      title: title.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>新增资产</DialogTitle>
          <DialogDescription>
            创建新的文档资产，将使用对应的模板初始化
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="assetType">资产类型</Label>
            <Select value={assetType} onValueChange={(v) => setAssetType(v as AssetType)}>
              <SelectTrigger id="assetType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ASSET_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="moduleName">模块名称</Label>
            <Input
              id="moduleName"
              placeholder="例如: betting-transaction"
              value={moduleName}
              onChange={(e) => setModuleName(e.target.value)}
            />
          </div>

          {assetType !== 'module' && (
            <div className="grid gap-2">
              <Label htmlFor="fileName">文件名</Label>
              <Input
                id="fileName"
                placeholder="例如: event-card (不含.md)"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="title">中文标题</Label>
            <Input
              id="title"
              placeholder="例如: 赛事卡片"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={createAsset.isPending}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={createAsset.isPending}>
            {createAsset.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            创建
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
