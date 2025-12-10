
import { getDriver } from '../config/neo4j.js';

export const getGraphData = async (filters = {}) => {
  const driver = getDriver();
  const session = driver.session();
  try {
    // 1. 获取所有节点
    const nodesResult = await session.run('MATCH (n:Entity) RETURN n');
    const nodes = nodesResult.records.map(record => {
      const node = record.get('n').properties;
      return {
        id: node.id,
        label: node.name,
        ...node
      };
    });

    // 2. 获取所有关系
    const edgesResult = await session.run('MATCH (a:Entity)-[r]->(b:Entity) RETURN a.id AS source, b.id AS target, type(r) AS label');
    const edges = edgesResult.records.map(record => ({
      source: record.get('source'),
      target: record.get('target'),
      label: record.get('label')
    }));

    return { nodes, edges };
  } finally {
    await session.close();
  }
};
