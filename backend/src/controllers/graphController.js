
import * as graphService from '../services/graphService.js';

export const getGraphData = async (req, res) => {
  try {
    const filters = req.query; // 未来可以从查询参数获取筛选条件
    const graphData = await graphService.getGraphData(filters);
    res.status(200).json(graphData);
  } catch (error) {
    console.error('Error getting graph data:', error);
    res.status(500).json({ error: 'Failed to get graph data' });
  }
};
