import { useEffect, useRef, useState, useCallback } from "react";
import Vditor from "vditor";
import "vditor/dist/index.css";

interface VditorEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  onSave?: (value: string) => void;
  placeholder?: string;
  height?: number | string;
  readOnly?: boolean;
  className?: string;
}

/**
 * Vditor 编辑器组件
 * 使用 IR（Instant Rendering）模式，实现所见即所得的编辑体验
 */
export default function VditorEditor({
  value = "",
  onChange,
  onSave,
  placeholder = "请输入内容...",
  height = 500,
  readOnly = false,
  className = "",
}: VditorEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const vditorRef = useRef<Vditor | null>(null);
  const [isReady, setIsReady] = useState(false);
  const initialValueRef = useRef(value);

  // 初始化编辑器
  useEffect(() => {
    if (!editorRef.current) return;

    // 如果已经初始化过，先销毁
    if (vditorRef.current) {
      vditorRef.current.destroy();
    }

    const vditor = new Vditor(editorRef.current, {
      mode: "ir", // IR 模式：所见即所得
      height: typeof height === "number" ? height : undefined,
      placeholder,
      value: initialValueRef.current,
      cache: {
        enable: false, // 禁用本地缓存
      },
      toolbar: readOnly
        ? []
        : [
            "emoji",
            "headings",
            "bold",
            "italic",
            "strike",
            "link",
            "|",
            "list",
            "ordered-list",
            "check",
            "outdent",
            "indent",
            "|",
            "quote",
            "line",
            "code",
            "inline-code",
            "insert-before",
            "insert-after",
            "|",
            "table",
            "upload",
            "|",
            "undo",
            "redo",
            "|",
            "fullscreen",
            "edit-mode",
            {
              name: "more",
              toolbar: [
                "both",
                "code-theme",
                "content-theme",
                "export",
                "outline",
                "preview",
                "devtools",
                "info",
                "help",
              ],
            },
          ],
      preview: {
        markdown: {
          toc: true,
          mark: true,
          footnotes: true,
          autoSpace: true,
        },
        math: {
          inlineDigit: true,
          engine: "KaTeX",
        },
        hljs: {
          lineNumber: true,
          style: "github",
        },
      },
      hint: {
        emoji: {
          "+1": "👍",
          "-1": "👎",
          confused: "😕",
          eyes: "👀",
          heart: "❤️",
          rocket: "🚀",
          smile: "😄",
          tada: "🎉",
        },
      },
      counter: {
        enable: true,
        type: "text",
      },
      outline: {
        enable: true,
        position: "right",
      },
      after: () => {
        setIsReady(true);
        vditorRef.current = vditor;
        
        // 如果是只读模式，禁用编辑
        if (readOnly) {
          vditor.disabled();
        }
      },
      input: (val: string) => {
        onChange?.(val);
      },
      blur: (val: string) => {
        // 失去焦点时触发保存
        onSave?.(val);
      },
      ctrlEnter: (val: string) => {
        // Ctrl+Enter 快捷键保存
        onSave?.(val);
      },
      theme: "classic",
      icon: "material",
      lang: "zh_CN",
    });

    return () => {
      vditor.destroy();
      vditorRef.current = null;
      setIsReady(false);
    };
  }, [height, placeholder, readOnly]); // 注意：不要把 value 放在依赖中，避免重复初始化

  // 当外部 value 变化时更新编辑器内容
  useEffect(() => {
    if (isReady && vditorRef.current && value !== vditorRef.current.getValue()) {
      vditorRef.current.setValue(value);
    }
  }, [value, isReady]);

  // 提供获取当前值的方法
  const getValue = useCallback(() => {
    return vditorRef.current?.getValue() || "";
  }, []);

  // 提供设置值的方法
  const setValue = useCallback((newValue: string) => {
    if (vditorRef.current) {
      vditorRef.current.setValue(newValue);
    }
  }, []);

  // 提供聚焦方法
  const focus = useCallback(() => {
    if (vditorRef.current) {
      vditorRef.current.focus();
    }
  }, []);

  return (
    <div className={`vditor-editor-wrapper ${className}`}>
      <div ref={editorRef} className="vditor-container" />
      {!isReady && (
        <div className="flex items-center justify-center h-32 text-gray-500">
          正在加载编辑器...
        </div>
      )}
    </div>
  );
}

// 导出工具函数
export { VditorEditor };
