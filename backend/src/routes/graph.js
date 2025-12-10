import express from 'express';
import * as graphController from '../controllers/graphController.js';

const router = express.Router();

// GET /api/graph - 获取知识图谱数据
router.get('/', graphController.getGraphData);

export default router;
