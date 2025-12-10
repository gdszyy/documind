
import * as entityService from '../services/entityService.js';
import * as larkService from '../services/larkService.js';

export const createEntity = async (req, res) => {
  try {
    const entityData = req.body;

    // 1. 在 Neo4j 中创建实体
    const newEntity = await entityService.createEntity(entityData);

    // 2. (模拟) 创建飞书文档
    const larkDoc = await larkService.createLarkDoc(newEntity);

    // 3. 更新实体，加入飞书文档链接
    const updatedEntity = await entityService.updateEntity(newEntity.id, { lark_doc_url: larkDoc.url });

    res.status(201).json(updatedEntity);
  } catch (error) {
    console.error('Error creating entity:', error);
    res.status(500).json({ error: 'Failed to create entity' });
  }
};

export const getAllEntities = async (req, res) => {
    try {
        const entities = await entityService.getAllEntities();
        res.status(200).json(entities);
    } catch (error) {
        console.error('Error getting all entities:', error);
        res.status(500).json({ error: 'Failed to get entities' });
    }
};

export const getEntityById = async (req, res) => {
    try {
        const entity = await entityService.getEntityById(req.params.id);
        if (entity) {
            res.status(200).json(entity);
        } else {
            res.status(404).json({ error: 'Entity not found' });
        }
    } catch (error) {
        console.error('Error getting entity by id:', error);
        res.status(500).json({ error: 'Failed to get entity' });
    }
};

export const updateEntity = async (req, res) => {
    try {
        const updatedEntity = await entityService.updateEntity(req.params.id, req.body);
        if (updatedEntity) {
            res.status(200).json(updatedEntity);
        } else {
            res.status(404).json({ error: 'Entity not found' });
        }
    } catch (error) {
        console.error('Error updating entity:', error);
        res.status(500).json({ error: 'Failed to update entity' });
    }
};

export const deleteEntity = async (req, res) => {
    try {
        await entityService.deleteEntity(req.params.id);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting entity:', error);
        res.status(500).json({ error: 'Failed to delete entity' });
    }
};

