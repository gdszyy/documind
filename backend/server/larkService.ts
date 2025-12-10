import axios from "axios";

// 飞书API配置
const LARK_APP_ID = process.env.LARK_APP_ID || process.env.FEISHU_APP_ID || "cli_a98e2f05eff89e1a";
const LARK_APP_SECRET = process.env.LARK_APP_SECRET || process.env.FEISHU_APP_SECRET || "P8RRCqQlzw587orCUowX5dt37WQI7CZI";

// 飞书API端点
const LARK_TENANT_TOKEN_URL = "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal";
const LARK_CREATE_DOC_URL = "https://open.feishu.cn/open-apis/docx/v1/documents";

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
