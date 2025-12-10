import { Router } from "express";
import * as statsService from "../services/statsService";
import { successResponse } from "../utils/response";

const router = Router();

/**
 * 获取统计信息
 * GET /api/stats
 */
router.get("/", async (req, res, next) => {
  try {
    const stats = await statsService.getStats();
    return successResponse(res, stats);
  } catch (error: any) {
    next(error);
  }
});

export default router;
