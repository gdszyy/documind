/**
 * 数据一致性检查工具
 * 检查MySQL、Neo4j、Qdrant之间的实体数据同步状态
 */

import * as db from '../server/db';
import * as neo4j from '../server/config/neo4j';
import * as qdrant from '../server/config/qdrant';

interface SyncCheckResult {
  entityId: number;
  name: string;
  mysql: boolean;
  neo4j: boolean;
  qdrant: boolean;
  consistent: boolean;
  issues: string[];
}

async function checkEntitySync(entityId: number): Promise<SyncCheckResult> {
  const issues: string[] = [];
  let mysqlExists = false;
  let neo4jExists = false;
  let qdrantExists = false;

  // 检查MySQL
  try {
    const entity = await db.getEntityById(entityId);
    mysqlExists = !!entity;
    
    if (!mysqlExists) {
      issues.push('Entity not found in MySQL');
    } else {
      // 验证字段完整性
      if (!entity.title) issues.push('MySQL: Missing title');
      if (!entity.entityId) issues.push('MySQL: Missing entityId');
      if (!entity.type) issues.push('MySQL: Missing type');
      
      // 验证metadata
      if (entity.metadata) {
        try {
          const metadata = JSON.parse(entity.metadata as string);
          if (!metadata.owner) issues.push('MySQL: Missing owner in metadata');
        } catch (error) {
          issues.push('MySQL: Invalid metadata JSON');
        }
      }
    }
  } catch (error: any) {
    issues.push(`MySQL error: ${error.message}`);
  }

  // 检查Neo4j (需要实现getEntityNode函数)
  // TODO: 在neo4j.ts中添加getEntityNode函数
  neo4jExists = false; // 暂时标记为false
  issues.push('Neo4j: Check not implemented yet');

  // 检查Qdrant (需要实现getEntityVector函数)
  // TODO: 在qdrant.ts中添加getEntityVector函数
  qdrantExists = false; // 暂时标记为false
  issues.push('Qdrant: Check not implemented yet');

  const consistent = mysqlExists && neo4jExists && qdrantExists;

  return {
    entityId,
    name: mysqlExists ? (await db.getEntityById(entityId))!.title : 'Unknown',
    mysql: mysqlExists,
    neo4j: neo4jExists,
    qdrant: qdrantExists,
    consistent,
    issues,
  };
}

async function checkAllEntities() {
  console.log('=== Entity Sync Consistency Check ===\n');

  try {
    // 初始化数据库连接
    await db.initDatabase();
    console.log('Database initialized\n');

    // 获取所有实体
    const entities = await db.getEntities({ page: 1, limit: 100 });
    console.log(`Total entities in MySQL: ${entities.total}\n`);

    if (entities.total === 0) {
      console.log('No entities found. Nothing to check.\n');
      return;
    }

    const results: SyncCheckResult[] = [];
    let consistentCount = 0;
    let inconsistentCount = 0;

    for (const entity of entities.items) {
      const result = await checkEntitySync(entity.id);
      results.push(result);

      if (result.consistent) {
        consistentCount++;
        console.log(`✓ Entity ${entity.id}: ${entity.name} - Consistent`);
      } else {
        inconsistentCount++;
        console.log(`✗ Entity ${entity.id}: ${entity.name} - Inconsistent`);
        console.log(`  MySQL: ${result.mysql ? '✓' : '✗'}`);
        console.log(`  Neo4j: ${result.neo4j ? '✓' : '✗'}`);
        console.log(`  Qdrant: ${result.qdrant ? '✓' : '✗'}`);
        
        if (result.issues.length > 0) {
          console.log(`  Issues:`);
          result.issues.forEach(issue => console.log(`    - ${issue}`));
        }
      }
      console.log('');
    }

    console.log('=== Summary ===');
    console.log(`Total entities: ${entities.total}`);
    console.log(`Consistent: ${consistentCount}`);
    console.log(`Inconsistent: ${inconsistentCount}`);
    console.log(`Consistency rate: ${((consistentCount / entities.total) * 100).toFixed(2)}%`);

    // 输出详细报告
    if (inconsistentCount > 0) {
      console.log('\n=== Inconsistent Entities ===');
      results
        .filter(r => !r.consistent)
        .forEach(r => {
          console.log(`\nEntity ${r.entityId}: ${r.name}`);
          r.issues.forEach(issue => console.log(`  - ${issue}`));
        });
    }

  } catch (error) {
    console.error('Error during sync check:', error);
    process.exit(1);
  }

  // 关闭连接
  await neo4j.closeNeo4jDriver();
  process.exit(0);
}

// 运行检查
checkAllEntities();
