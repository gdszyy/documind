/**
 * 映射函数测试脚本
 * 测试mapOldToNew和mapNewToOld函数的正确性
 */

import { nanoid } from 'nanoid';

// 复制映射函数用于测试
function mapOldToNew(oldData: {
  name?: string;
  uniqueId?: string;
  type?: string;
  owner?: string;
  status?: string;
  description?: string;
  httpMethod?: string;
  apiPath?: string;
  larkDocUrl?: string;
}): any {
  const metadata: Record<string, any> = {};
  
  if (oldData.owner !== undefined) metadata.owner = oldData.owner;
  if (oldData.description !== undefined) metadata.description = oldData.description;
  if (oldData.httpMethod !== undefined) metadata.httpMethod = oldData.httpMethod;
  if (oldData.apiPath !== undefined) metadata.apiPath = oldData.apiPath;

  return {
    entityId: oldData.uniqueId || `entity-${nanoid()}`,
    type: oldData.type?.toLowerCase() || 'unknown',
    title: oldData.name || 'Untitled',
    status: oldData.status?.toLowerCase() || 'active',
    documentUrl: oldData.larkDocUrl || null,
    metadata: Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : null,
  };
}

function mapNewToOld(newEntity: any): any {
  let metadata: Record<string, any> = {};
  
  if (newEntity.metadata) {
    try {
      metadata = typeof newEntity.metadata === 'string' 
        ? JSON.parse(newEntity.metadata) 
        : newEntity.metadata;
    } catch (error) {
      console.error('Failed to parse metadata:', error);
      metadata = {};
    }
  }

  return {
    id: newEntity.id,
    name: newEntity.title,
    uniqueId: newEntity.entityId,
    type: capitalizeFirst(newEntity.type),
    owner: metadata.owner || 'Unknown',
    status: capitalizeFirst(newEntity.status),
    description: metadata.description || null,
    httpMethod: metadata.httpMethod || null,
    apiPath: metadata.apiPath || null,
    larkDocUrl: newEntity.documentUrl,
    createdAt: newEntity.createdAt,
    updatedAt: newEntity.updatedAt,
  };
}

function capitalizeFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// 测试用例
const testCases = [
  {
    name: 'Service Entity',
    oldData: {
      name: 'User Authentication Service',
      uniqueId: 'user-auth-service',
      type: 'Service',
      owner: 'John Doe',
      status: 'Development',
      description: 'Handles user authentication and authorization',
      larkDocUrl: 'https://lark.com/doc/123',
    },
  },
  {
    name: 'API Entity',
    oldData: {
      name: 'Login API',
      uniqueId: 'login-api',
      type: 'API',
      owner: 'Jane Smith',
      status: 'Production',
      description: 'User login endpoint',
      httpMethod: 'POST',
      apiPath: '/api/v1/auth/login',
      larkDocUrl: 'https://lark.com/doc/456',
    },
  },
  {
    name: 'Component Entity',
    oldData: {
      name: 'Button Component',
      uniqueId: 'button-component',
      type: 'Component',
      owner: 'Alice Johnson',
      status: 'Testing',
      description: 'Reusable button component',
    },
  },
  {
    name: 'Page Entity',
    oldData: {
      name: 'Dashboard Page',
      uniqueId: 'dashboard-page',
      type: 'Page',
      owner: 'Bob Wilson',
      status: 'Production',
      description: 'Main dashboard page',
    },
  },
];

console.log('=== Mapping Function Tests ===\n');

let passedTests = 0;
let failedTests = 0;

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`);
  console.log('─'.repeat(50));
  
  // 测试 mapOldToNew
  console.log('\n1. Testing mapOldToNew:');
  console.log('Input (old format):', JSON.stringify(testCase.oldData, null, 2));
  
  const newData = mapOldToNew(testCase.oldData);
  console.log('\nOutput (new format):', JSON.stringify(newData, null, 2));
  
  // 验证新格式
  const newFormatValid = !!(
    newData.entityId &&
    newData.type &&
    newData.title &&
    newData.status
  );
  
  if (newFormatValid) {
    console.log('✓ New format validation passed');
    passedTests++;
  } else {
    console.log('✗ New format validation failed');
    failedTests++;
  }
  
  // 测试 mapNewToOld
  console.log('\n2. Testing mapNewToOld:');
  const mockNewEntity = {
    id: index + 1,
    ...newData,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };
  
  console.log('Input (new format):', JSON.stringify(mockNewEntity, null, 2));
  
  const oldData = mapNewToOld(mockNewEntity);
  console.log('\nOutput (old format):', JSON.stringify(oldData, null, 2));
  
  // 验证旧格式
  const oldFormatValid = !!(
    oldData.id &&
    oldData.name &&
    oldData.uniqueId &&
    oldData.type &&
    oldData.owner &&
    oldData.status
  );
  
  if (oldFormatValid) {
    console.log('✓ Old format validation passed');
    passedTests++;
  } else {
    console.log('✗ Old format validation failed');
    failedTests++;
  }
  
  // 测试往返转换
  console.log('\n3. Testing round-trip conversion:');
  const roundTripMatches = {
    name: testCase.oldData.name === oldData.name,
    uniqueId: testCase.oldData.uniqueId === oldData.uniqueId,
    type: testCase.oldData.type === oldData.type,
    owner: testCase.oldData.owner === oldData.owner,
    status: testCase.oldData.status === oldData.status,
    description: testCase.oldData.description === oldData.description,
    httpMethod: testCase.oldData.httpMethod === oldData.httpMethod,
    apiPath: testCase.oldData.apiPath === oldData.apiPath,
    larkDocUrl: testCase.oldData.larkDocUrl === oldData.larkDocUrl,
  };
  
  console.log('Field matches:', roundTripMatches);
  
  const allMatch = Object.values(roundTripMatches).every(v => v);
  if (allMatch) {
    console.log('✓ Round-trip conversion successful');
    passedTests++;
  } else {
    console.log('✗ Round-trip conversion failed');
    console.log('Mismatched fields:');
    Object.entries(roundTripMatches).forEach(([key, match]) => {
      if (!match) {
        console.log(`  - ${key}: expected "${(testCase.oldData as any)[key]}", got "${(oldData as any)[key]}"`);
      }
    });
    failedTests++;
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
});

console.log('=== Test Summary ===');
console.log(`Total tests: ${passedTests + failedTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);
console.log(`Success rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(2)}%`);

if (failedTests > 0) {
  console.log('\n⚠ Some tests failed. Please review the mapping functions.');
  process.exit(1);
} else {
  console.log('\n✓ All tests passed!');
  process.exit(0);
}
