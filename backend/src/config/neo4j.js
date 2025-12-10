import neo4j from 'neo4j-driver';

let driver = null;

export async function connectNeo4j() {
  const uri = process.env.NEO4J_URI || process.env.NEO4J_URL;
  const user = process.env.NEO4J_USER || 'neo4j';
  const password = process.env.NEO4J_PASSWORD;

  if (!uri || !password) {
    console.warn('⚠️  Neo4j connection details not provided. Skipping Neo4j connection.');
    return null;
  }

  try {
    driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    
    // 验证连接
    await driver.verifyConnectivity();
    
    return driver;
  } catch (error) {
    console.error('Failed to connect to Neo4j:', error);
    throw error;
  }
}

export async function disconnectNeo4j() {
  if (driver) {
    await driver.close();
    console.log('Neo4j connection closed');
  }
}

export function getDriver() {
  if (!driver) {
    throw new Error('Neo4j driver not initialized. Call connectNeo4j() first.');
  }
  return driver;
}

export async function executeQuery(query, params = {}) {
  const session = driver.session();
  try {
    const result = await session.run(query, params);
    return result.records;
  } finally {
    await session.close();
  }
}
