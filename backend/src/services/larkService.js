
// Mock service for Feishu/Lark integration

export const createLarkDoc = async (entity) => {
  console.log(`📄 Simulating creation of Lark document for entity: ${entity.name}`);
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const mockUrl = `https://fake-feishu.cn/docs/doccn${Buffer.from(entity.id).toString('hex')}`;
  
  console.log(`✅ Simulated Lark document created at: ${mockUrl}`);
  
  return {
    url: mockUrl,
    title: entity.name,
  };
};

