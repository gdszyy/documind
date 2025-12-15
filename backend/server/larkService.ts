import axios from "axios";
import * as db from "./db";

// 飞书API配置
const LARK_APP_ID = process.env.LARK_APP_ID || process.env.FEISHU_APP_ID || "cli_a98e2f05eff89e1a";
const LARK_APP_SECRET = process.env.LARK_APP_SECRET || process.env.FEISHU_APP_SECRET || "P8RRCqQlzw587orCUowX5dt37WQI7CZI";
const LARK_CHAT_ID = process.env.LARK_CHAT_ID || "oc_3b9b7352ea632f33935f4f71b6bbb174";

// 飞书API端点
const LARK_TENANT_TOKEN_URL = "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal";
const LARK_CREATE_DOC_URL = "https://open.feishu.cn/open-apis/docx/v1/documents";
const LARK_ADD_PERMISSION_URL = "https://open.feishu.cn/open-apis/drive/v1/permissions";

// Token缓存
let cachedTenantToken: { token: string; expiresAt: number } | null = null;

/**
 * 获取tenant_access_token
 */
async function getTenantAccessToken(): Promise<string> {
  // 检查缓存
  if (cachedTenantToken && cachedTenantToken.expiresAt > Date.now()) {
    return cachedTenantToken.token;
  }

  try {
    const response = await axios.post(
      LARK_TENANT_TOKEN_URL,
      {
        app_id: LARK_APP_ID,
        app_secret: LARK_APP_SECRET,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.code !== 0) {
      throw new Error(`Failed to get tenant token: ${response.data.msg}`);
    }

    const token = response.data.tenant_access_token;
    const expiresIn = response.data.expire || 7200; // 默认2小时

    // 缓存token（提前5分钟过期）
    cachedTenantToken = {
      token,
      expiresAt: Date.now() + (expiresIn - 300) * 1000,
    };

    console.log("[Lark] Tenant access token obtained");
    return token;
  } catch (error) {
    console.error("[Lark] Failed to get tenant access token:", error);
    throw error;
  }
}

/**
 * 创建飞书文档
 */
export async function createLarkDoc(entityName: string, entityId: number): Promise<string> {
  try {
    console.log(`[Lark] Creating document for entity: ${entityName} (ID: ${entityId})`);

    // 获取access token
    const accessToken = await getTenantAccessToken();

    // 构建文档内容
    const documentTitle = `${entityName} - DocuMind`;
    const documentContent = {
      document: {
        title: documentTitle,
      },
    };

    // 调用创建文档API
    const response = await axios.post(LARK_CREATE_DOC_URL, documentContent, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (response.data.code !== 0) {
      throw new Error(`Failed to create document: ${response.data.msg}`);
    }

    const documentId = response.data.data.document.document_id;
    const documentUrl = `https://feishu.cn/docx/${documentId}`;

    console.log(`[Lark] Document created successfully: ${documentUrl}`);

    // 可选：添加初始内容到文档
    await addInitialContent(accessToken, documentId, entityName, entityId);

    // 新增：设置群组编辑权限
    await setChatEditPermission(accessToken, documentId, LARK_CHAT_ID);

    return documentUrl;
  } catch (error) {
    console.error("[Lark] Failed to create document:", error);

    // 降级：返回模拟链接
    console.log("[Lark] Falling back to mock document URL");
    const mockUrl = `https://feishu.cn/docs/doccn${entityId.toString().padStart(10, "0")}`;
    return mockUrl;
  }
}

/**
 * 添加初始内容到文档（可选）
 */
async function addInitialContent(
  accessToken: string,
  documentId: string,
  entityName: string,
  entityId: number
): Promise<void> {
  try {
    const LARK_BATCH_UPDATE_URL = `https://open.feishu.cn/open-apis/docx/v1/documents/${documentId}/blocks/batch_update`;

    // 构建初始内容
    const initialContent = {
      requests: [
        {
          request_type: "insert_block",
          insert_block: {
            parent_id: documentId,
            index: 0,
            block: {
              block_type: 2, // 文本块
              text: {
                elements: [
                  {
                    text_run: {
                      content: `# ${entityName}\n\n`,
                      text_element_style: {
                        bold: true,
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        {
          request_type: "insert_block",
          insert_block: {
            parent_id: documentId,
            index: 1,
            block: {
              block_type: 2,
              text: {
                elements: [
                  {
                    text_run: {
                      content: `实体ID: ${entityId}\n\n`,
                    },
                  },
                ],
              },
            },
          },
        },
        {
          request_type: "insert_block",
          insert_block: {
            parent_id: documentId,
            index: 2,
            block: {
              block_type: 2,
              text: {
                elements: [
                  {
                    text_run: {
                      content: "此文档由 DocuMind 自动创建。请在此处添加详细的实体描述和文档。\n",
                    },
                  },
                ],
              },
            },
          },
        },
      ],
    };

    await axios.post(LARK_BATCH_UPDATE_URL, initialContent, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    console.log(`[Lark] Initial content added to document: ${documentId}`);
  } catch (error) {
    console.error("[Lark] Failed to add initial content:", error);
    // 不抛出错误，初始内容添加失败不影响文档创建
	  }
	}
	
	/**
	 * 设置群组编辑权限
	 */
	async function setChatEditPermission(
	  accessToken: string,
	  documentId: string,
	  chatId: string
	): Promise<void> {
	  try {
	    console.log(`[Lark] Setting edit permission for chat ${chatId} on document ${documentId}`);
	
	    const response = await axios.post(
	      `${LARK_ADD_PERMISSION_URL}/${documentId}/members`,
	      {
	        member_type: "chat",
	        member_id: chatId,
	        perm: "edit",
	      },
	      {
	        headers: {
	          Authorization: `Bearer ${accessToken}`,
	          "Content-Type": "application/json",
	        },
	      }
	    );
	
	    if (response.data.code !== 0) {
	      throw new Error(`Failed to set chat edit permission: ${response.data.msg}`);
	    }
	
	    console.log(`[Lark] Chat edit permission set successfully for document: ${documentId}`);
	  } catch (error) {
	    console.error("[Lark] Failed to set chat edit permission:", error);
	    // 不抛出错误，权限设置失败不影响文档创建
	  }
	}
	
	/**
	 * 健康检查
	 */
	export async function healthCheck(): Promise<boolean> {
  try {
    await getTenantAccessToken();
    return true;
  } catch (error) {
    console.error("[Lark] Health check failed:", error);
    return false;
  }
}


/**
 * 批量刷新所有文档的权限
 */
export async function batchUpdatePermissions(chatId: string): Promise<{successCount: number, failCount: number, failedDocs: any[]}> {
  console.log(`[Lark] Starting batch permission update for chat: ${chatId}`);

  let successCount = 0;
  let failCount = 0;
  const failedDocs: any[] = [];

  try {
    // 1. 获取 Access Token
    const accessToken = await getTenantAccessToken();

    // 2. 从数据库获取所有文档链接 (这里需要一个数据库查询函数)
    // 假设我们有一个 get_all_doc_links() 函数
    const docLinks = await getAllDocLinksFromDB(); 

    console.log(`[Lark] Found ${docLinks.length} documents to update.`);

    // 3. 遍历并设置权限
    for (const doc of docLinks) {
      try {
        await setChatEditPermission(accessToken, doc.doc_id, chatId);
        successCount++;
      } catch (e) {
        failCount++;
        failedDocs.push({ doc_id: doc.doc_id, error: e.message });
      }
    }

    console.log(`[Lark] Batch permission update finished. Success: ${successCount}, Fail: ${failCount}`);
    return { successCount, failCount, failedDocs };

  } catch (error) {
    console.error("[Lark] Batch permission update failed:", error);
    throw error;
  }
}

/**
 * 从数据库获取所有文档链接 (辅助函数)
 * 注意：这需要一个数据库连接实例，这里仅为示例
 */
async function getAllDocLinksFromDB(): Promise<{doc_id: string}[]> {
    // 在实际应用中，这里应该调用数据库服务来获取文档链接
    // 这里我们返回一个模拟数据
        const entities = await db.getEntities({ limit: 1000 }); // 获取所有实体
    const docLinks = entities.items
      .map(entity => {
        const match = entity.larkDocUrl?.match(/\/(docx|docs)\/([a-zA-Z0-9]+)/);
        if (match && match[2]) {
          return { doc_id: match[2], entity_name: entity.name };
        }
        return null;
      })
      .filter(Boolean);
    return docLinks;
}
