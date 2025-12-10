import express from 'express';
import * as entityController from '../controllers/entityController.js';

const router = express.Router();

// GET /api/entities - 获取实体列表
router.get('/', entityController.getAllEntities);

// POST /api/entities - 创建新实体
router.post('/', entityController.createEntity);

// GET /api/entities/:id - 获取单个实体
router.get('/:id', entityController.getEntityById);

// PUT /api/entities/:id - 更新实体
router.put('/:id', entityController.updateEntity);

// DELETE /api/entities/:id - 删除实体
router.delete('/:id', entityController.deleteEntity);

export default router;
