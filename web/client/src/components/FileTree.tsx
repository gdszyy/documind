import { ChevronRight, ChevronDown, File, Folder } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface FileNode {
  name: string;
  displayName: string;
  path: string;
  type: 'file' | 'directory';
  assetType?: 'module' | 'page' | 'component' | 'api';
  children?: FileNode[];
}

interface FileTreeProps {
  nodes: FileNode[];
  onFileSelect: (path: string) => void;
  selectedPath?: string;
  level?: number;
}

function FileTreeNode({ 
  node, 
  onFileSelect, 
  selectedPath, 
  level = 0 
}: { 
  node: FileNode; 
  onFileSelect: (path: string) => void; 
  selectedPath?: string; 
  level?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels

  const isSelected = selectedPath === node.path;
  const isDirectory = node.type === 'directory';

  const handleClick = () => {
    if (isDirectory) {
      setIsExpanded(!isExpanded);
    } else {
      onFileSelect(node.path);
    }
  };

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-accent rounded-sm transition-colors",
          isSelected && "bg-accent font-medium"
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
      >
        {isDirectory && (
          <span className="flex-shrink-0">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </span>
        )}
        {!isDirectory && <span className="w-4" />}
        <span className="flex-shrink-0">
          {isDirectory ? (
            <Folder className="w-4 h-4 text-blue-500" />
          ) : (
            <File className="w-4 h-4 text-gray-500" />
          )}
        </span>
        <span className="truncate text-sm">{node.displayName}</span>
      </div>
      {isDirectory && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              onFileSelect={onFileSelect}
              selectedPath={selectedPath}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTree({ nodes, onFileSelect, selectedPath, level = 0 }: FileTreeProps) {
  return (
    <div className="w-full">
      {nodes.map((node) => (
        <FileTreeNode
          key={node.path}
          node={node}
          onFileSelect={onFileSelect}
          selectedPath={selectedPath}
          level={level}
        />
      ))}
    </div>
  );
}
