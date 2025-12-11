/**
 * Linker API 类型定义
 */

/**
 * 搜索请求参数
 */
export interface LinkerSearchParams {
  q: string;           // 搜索关键词
  type?: string;       // 实体类型过滤
  status?: string;     // 状态过滤
  limit?: number;      // 结果数量
}

/**
 * 搜索结果项
 */
export interface LinkerSearchResult {
  entityId: string;
  type: string;
  title: string;
  status: string;
  documentUrl: string | null;
  metadata: any;
  referenceCount: number;
  updatedAt: Date;
}

/**
 * 实体详情响应
 */
export interface LinkerEntityDetail {
  entity: {
    entityId: string;
    type: string;
    title: string;
    status: string;
    documentUrl: string | null;
    metadata: any;
    createdAt: Date;
    updatedAt: Date;
  };
  relationships: {
    outbound: LinkerRelationship[];
    inbound: LinkerRelationship[];
  };
  referenceCount: number;
}

/**
 * 关系信息
 */
export interface LinkerRelationship {
  relationshipId: string;
  relationshipType: string;
  target?: {
    entityId: string;
    title: string;
    type: string;
  };
  source?: {
    entityId: string;
    title: string;
    type: string;
  };
}

/**
 * 引用记录
 */
export interface LinkerReference {
  referenceId: string;
  entityId: string;
  documentId: string;
  documentUrl: string | null;
  documentTitle: string | null;
  contextSnippet: string | null;
  userId: string | null;
  createdAt: Date;
}

/**
 * 创建引用记录请求
 */
export interface CreateLinkerReferenceRequest {
  entityId: string;
  documentId: string;
  documentUrl?: string;
  documentTitle?: string;
  contextSnippet?: string;
  userId?: string;
}

/**
 * 用户配置
 */
export interface LinkerUserSettings {
  userId: string;
  settings: any;  // JSON 对象
  updatedAt: Date;
}

/**
 * 保存用户配置请求
 */
export interface SaveLinkerSettingsRequest {
  settings: any;
}
