import { Router } from "express";
import { z } from "zod";
import * as linkerService from "../../services/linkerService";
import { successResponse, badRequestResponse, notFoundResponse } from "../../utils/response";

const router = Router();

/**
 * 获取实体详情（包含关系和引用统计）
 * GET /api/linker/entities/:entityId
 */
router.get("/:entityId", async (req, res, next) => {
  try {
    const { entityId } = req.params;

    const entityDetail = await linkerService.getEntityDetail(entityId);

    if (!entityDetail) {
      return notFoundResponse(res, "实体不存在或已被删除");
    }

    return successResponse(res, entityDetail);
  } catch (error: any) {
    next(error);
  }
});

/**
 * 获取实体的引用记录
 * GET /api/linker/entities/:entityId/references
 */
router.get("/:entityId/references", async (req, res, next) => {
  try {
    const { entityId } = req.params;

    const schema = z.object({
      limit: z.coerce.number().min(1).max(100).optional().default(50),
      offset: z.coerce.number().min(0).optional().default(0),
    });

    const parseResult = schema.safeParse(req.query);
    if (!parseResult.success) {
      return badRequestResponse(res, "Invalid query parameters", parseResult.error.issues);
    }

    const { limit, offset } = parseResult.data;
    const result = await linkerService.getEntityReferences(entityId, limit, offset);

    return successResponse(res, result);
  } catch (error: any) {
    next(error);
  }
});

export default router;
