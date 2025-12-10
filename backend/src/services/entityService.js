
import { getDriver } from '../config/neo4j.js';
import { v4 as uuidv4 } from 'uuid';

export const createEntity = async (entityData) => {
  const driver = getDriver();
  const session = driver.session();
  try {
    const { name, type, owner, description, status, http_method, api_path } = entityData;
    const id = uuidv4(); // Generate a unique ID

    const result = await session.run(
      'CREATE (e:Entity {id: $id, name: $name, type: $type, owner: $owner, description: $description, status: $status, http_method: $http_method, api_path: $api_path, createdAt: timestamp(), updatedAt: timestamp()}) RETURN e',
      {
        id,
        name,
        type,
        owner,
        description,
        status,
        http_method,
        api_path
      }
    );

    return result.records[0].get('e').properties;
  } finally {
    await session.close();
  }
};



// 获取所有实体
export const getAllEntities = async () => {
  const driver = getDriver();
  const session = driver.session();
  try {
    const result = await session.run('MATCH (e:Entity) RETURN e ORDER BY e.updatedAt DESC');
    return result.records.map(record => record.get('e').properties);
  } finally {
    await session.close();
  }
};

// 根据 ID 获取单个实体
export const getEntityById = async (id) => {
  const driver = getDriver();
  const session = driver.session();
  try {
    const result = await session.run('MATCH (e:Entity {id: $id}) RETURN e', { id });
    if (result.records.length === 0) {
      return null;
    }
    return result.records[0].get('e').properties;
  } finally {
    await session.close();
  }
};

// 更新实体
export const updateEntity = async (id, updateData) => {
  const driver = getDriver();
  const session = driver.session();
  try {
    

        const setClauses = Object.keys(updateData).map(key => `e.${key} = $${key}`).join(', ');
    if (Object.keys(updateData).length === 0) {
        return getEntityById(id); // No fields to update, return current entity
    }

    const result = await session.run(
      `MATCH (e:Entity {id: $id}) SET ${setClauses}, e.updatedAt = timestamp() RETURN e`,
      { id, ...updateData }
    );

    if (result.records.length === 0) {
      return null;
    }

    return result.records[0].get('e').properties;
  } finally {
    await session.close();
  }
};

// 删除实体
export const deleteEntity = async (id) => {
  const driver = getDriver();
  const session = driver.session();
  try {
    await session.run('MATCH (e:Entity {id: $id}) DETACH DELETE e', { id });
  } finally {
    await session.close();
  }
};
