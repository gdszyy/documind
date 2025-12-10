/**
 * 飞书文档模拟服务
 * MVP 阶段使用模拟实现，未来可替换为真实的飞书 API 调用
 */

export async function createLarkDoc(entityName: string, entityId: number): Promise<string> {
  console.log(`📄 [Mock] Creating Lark document for entity: ${entityName} (ID: ${entityId})`);
  
  // 模拟 API 调用延迟
  await new Promise(resolve => setTimeout(resolve, 300));

  // 生成模拟的飞书文档链接
  const mockUrl = `https://feishu.cn/docs/doccn${entityId.toString().padStart(10, '0')}`;
  
  console.log(`✅ [Mock] Lark document created: ${mockUrl}`);
  
  return mockUrl;
}
