import neo4j, { Driver, Session } from "neo4j-driver";
// 使用any类型，因为Entity类型已经在db.ts中转换
type Entity = any;
type EntityRelationship = any;

let driver: Driver | null = null;

// 初始化Neo4j驱动
export function initNeo4jDriver(): Driver {
  if (driver) {
    return driver;
  }

  const uri = process.env.NEO4J_URI || "bolt://localhost:7687";
  const user = process.env.NEO4J_USER || "neo4j";
  const password = process.env.NEO4J_PASSWORD || "";

  driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

  console.log("[Neo4j] Driver initialized");
  return driver;
}

// 关闭Neo4j连接
export async function closeNeo4jDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
    console.log("[Neo4j] Driver closed");
  }
}

// 获取session
function getSession(): Session {
  if (!driver) {
    initNeo4jDriver();
  }
  return driver!.session();
}

// 创建实体节点
export async function createEntityNode(entity: Entity): Promise<void> {
  const session = getSession();
  try {
    await session.run(
      `
      CREATE (e:Entity {
        id: $id,
        name: $name,
        uniqueId: $uniqueId,
        type: $type,
        owner: $owner,
        status: $status,
        description: $description,
        httpMethod: $httpMethod,
        apiPath: $apiPath,
        larkDocUrl: $larkDocUrl,
        createdAt: datetime($createdAt),
        updatedAt: datetime($updatedAt)
      })
      `,
      {
        id: entity.id,
        name: entity.name,
        uniqueId: entity.uniqueId,
        type: entity.type,
        owner: entity.owner,
        status: entity.status,
        description: entity.description || null,
        httpMethod: entity.httpMethod || null,
        apiPath: entity.apiPath || null,
        larkDocUrl: entity.larkDocUrl || null,
        createdAt: entity.createdAt.toISOString(),
        updatedAt: entity.updatedAt.toISOString(),
      }
    );
    console.log(`[Neo4j] Created entity node: ${entity.name} (ID: ${entity.id})`);
  } catch (error) {
    console.error("[Neo4j] Failed to create entity node:", error);
    throw error;
  } finally {
    await session.close();
  }
}

// 更新实体节点
export async function updateEntityNode(id: number, updates: Partial<Entity>): Promise<void> {
  const session = getSession();
  try {
    const setClauses = Object.keys(updates)
      .filter(key => key !== 'id')
      .map(key => `e.${key} = $${key}`)
      .join(", ");

    if (setClauses) {
      await session.run(
        `
        MATCH (e:Entity {id: $id})
        SET ${setClauses}, e.updatedAt = datetime()
        `,
        { id, ...updates }
      );
      console.log(`[Neo4j] Updated entity node: ID ${id}`);
    }
  } catch (error) {
    console.error("[Neo4j] Failed to update entity node:", error);
    throw error;
  } finally {
    await session.close();
  }
}

// 删除实体节点
export async function deleteEntityNode(id: number): Promise<void> {
  const session = getSession();
  try {
    await session.run(
      `
      MATCH (e:Entity {id: $id})
      DETACH DELETE e
      `,
      { id }
    );
    console.log(`[Neo4j] Deleted entity node: ID ${id}`);
  } catch (error) {
    console.error("[Neo4j] Failed to delete entity node:", error);
    throw error;
  } finally {
    await session.close();
  }
}

// 创建关系
export async function createRelationship(relationship: EntityRelationship): Promise<void> {
  const session = getSession();
  try {
    await session.run(
      `
      MATCH (source:Entity {id: $sourceId})
      MATCH (target:Entity {id: $targetId})
      CREATE (source)-[r:${relationship.type} {
        id: $id,
        createdAt: datetime($createdAt)
      }]->(target)
      `,
      {
        sourceId: relationship.sourceId,
        targetId: relationship.targetId,
        id: relationship.id,
        createdAt: relationship.createdAt.toISOString(),
      }
    );
    console.log(`[Neo4j] Created relationship: ${relationship.type} (${relationship.sourceId} -> ${relationship.targetId})`);
  } catch (error) {
    console.error("[Neo4j] Failed to create relationship:", error);
    throw error;
  } finally {
    await session.close();
  }
}

// 删除关系
export async function deleteRelationship(id: number): Promise<void> {
  const session = getSession();
  try {
    await session.run(
      `
      MATCH ()-[r {id: $id}]->()
      DELETE r
      `,
      { id }
    );
    console.log(`[Neo4j] Deleted relationship: ID ${id}`);
  } catch (error) {
    console.error("[Neo4j] Failed to delete relationship:", error);
    throw error;
  } finally {
    await session.close();
  }
}

// 查询图谱数据
export async function queryGraph(filters?: {
  types?: string[];
  statuses?: string[];
}): Promise<{
  nodes: Array<{ id: number; data: Entity }>;
  edges: Array<{ id: number; source: number; target: number; type: string }>;
}> {
  const session = getSession();
  try {
    let whereClause = "";
    const params: any = {};

    if (filters?.types && filters.types.length > 0) {
      whereClause += " AND e.type IN $types";
      params.types = filters.types;
    }

    if (filters?.statuses && filters.statuses.length > 0) {
      whereClause += " AND e.status IN $statuses";
      params.statuses = filters.statuses;
    }

    const query = `
      MATCH (e:Entity)
      WHERE 1=1 ${whereClause}
      OPTIONAL MATCH (e)-[r]->(target:Entity)
      RETURN e, r, target
    `;

    const result = await session.run(query, params);

    const nodesMap = new Map<number, Entity>();
    const edges: Array<{ id: number; source: number; target: number; type: string }> = [];

    result.records.forEach(record => {
      const entityNode = record.get("e");
      if (entityNode) {
        const entity = entityNode.properties;
        nodesMap.set(entity.id, {
          ...entity,
          createdAt: new Date(entity.createdAt),
          updatedAt: new Date(entity.updatedAt),
        });
      }

      const relationship = record.get("r");
      const targetNode = record.get("target");
      if (relationship && targetNode) {
        const rel = relationship.properties;
        edges.push({
          id: rel.id,
          source: entityNode.properties.id,
          target: targetNode.properties.id,
          type: relationship.type,
        });
      }
    });

    const nodes = Array.from(nodesMap.entries()).map(([id, data]) => ({ id, data }));

    console.log(`[Neo4j] Queried graph: ${nodes.length} nodes, ${edges.length} edges`);
    return { nodes, edges };
  } catch (error) {
    console.error("[Neo4j] Failed to query graph:", error);
    throw error;
  } finally {
    await session.close();
  }
}

// 获取实体节点（用于数据一致性检查）
export async function getEntityNode(id: number): Promise<Entity | null> {
  const session = getSession();
  try {
    const result = await session.run(
      `
      MATCH (e:Entity {id: $id})
      RETURN e
      `,
      { id }
    );

    if (result.records.length === 0) {
      console.log(`[Neo4j] Entity node not found: ID ${id}`);
      return null;
    }

    const entityNode = result.records[0].get("e");
    const entity = entityNode.properties;
    
    console.log(`[Neo4j] Retrieved entity node: ${entity.name} (ID: ${entity.id})`);
    return {
      ...entity,
      createdAt: new Date(entity.createdAt),
      updatedAt: new Date(entity.updatedAt),
    };
  } catch (error) {
    console.error(`[Neo4j] Failed to get entity node ${id}:`, error);
    throw error;
  } finally {
    await session.close();
  }
}

// 检查实体节点是否存在
export async function entityNodeExists(id: number): Promise<boolean> {
  const session = getSession();
  try {
    const result = await session.run(
      `
      MATCH (e:Entity {id: $id})
      RETURN count(e) as count
      `,
      { id }
    );

    const count = result.records[0].get("count").toNumber();
    return count > 0;
  } catch (error) {
    console.error(`[Neo4j] Failed to check entity node existence ${id}:`, error);
    return false;
  } finally {
    await session.close();
  }
}

// 健康检查
export async function healthCheck(): Promise<boolean> {
  try {
    const session = getSession();
    await session.run("RETURN 1");
    await session.close();
    return true;
  } catch (error) {
    console.error("[Neo4j] Health check failed:", error);
    return false;
  }
}
