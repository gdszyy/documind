// documind/backend/server/mmd.ts

interface DocumindNode {
  id: number;
  name: string;
  uniqueId: string;
  type: string; // e.g., "Service", "API", "Document"
  // ... other fields
}

interface DocumindEdge {
  sourceId: number;
  targetId: number;
  type: string; // e.g., "DEPENDS_ON", "EXPOSES_API"
}

interface GraphData {
  nodes: DocumindNode[];
  edges: DocumindEdge[];
}

/**
 * 根据节点类型返回 Mermaid 节点形状的开始和结束符号。
 * @param type 节点类型
 * @returns [startSymbol, endSymbol]
 */
function getNodeShape(type: string): [string, string] {
  switch (type.toUpperCase()) {
    case 'SERVICE':
    case 'MODULE':
      return ['((', '))']; // Circle
    case 'API':
    case 'DOCUMENTATION':
    case 'DOCUMENT':
      return ['{', '}']; // Rhombus
    case 'PAGE':
    case 'COMPONENT':
      return ['[', ']']; // Rectangle (default)
    default:
      return ['[', ']']; // Default to Rectangle
  }
}

/**
 * 将知识图谱数据转换为 Mermaid Markdown 格式的字符串。
 * @param data 包含节点和边的图数据
 * @returns Mermaid Markdown 字符串
 */
export function generateMmdFromGraphData(data: GraphData): string {
  const { nodes, edges } = data;
  const mmdLines: string[] = [];

  // 1. 图定义
  mmdLines.push('```mermaid');
  mmdLines.push('graph TD');
  
  // 2. 节点定义
  // 使用 Set 确保只处理一次节点，尽管输入应该是唯一的
  const nodeMap = new Map<number, DocumindNode>();
  for (const node of nodes) {
    nodeMap.set(node.id, node);
    const [start, end] = getNodeShape(node.type);
    // 格式: ID[Label]
    // 节点 ID 使用数字 id，标签使用 name，并对 name 中的特殊字符进行转义
    const safeName = node.name.replace(/"/g, '#quot;');
    mmdLines.push(`    ${node.id}${start}"${safeName}"${end}`);
  }

  // 3. 边定义
  for (const edge of edges) {
    const sourceNode = nodeMap.get(edge.sourceId);
    const targetNode = nodeMap.get(edge.targetId);

    // 仅处理源和目标节点都存在的边
    if (sourceNode && targetNode) {
      // 格式: SourceID -->|RelationshipType| TargetID
      // 关系类型也需要转义
      const safeType = edge.type.replace(/"/g, '#quot;');
      mmdLines.push(`    ${edge.sourceId} -->|${safeType}| ${edge.targetId}`);
    }
  }

  mmdLines.push('```');

  return mmdLines.join('\n');
}
