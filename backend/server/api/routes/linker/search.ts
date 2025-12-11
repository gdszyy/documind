import { Router } from "express";
import { z } from "zod";
import * as linkerService from "../../services/linkerService";
import { successResponse, badRequestResponse } from "../../utils/response";

const router = Router();

/**
 * Linker 搜索实体
 * GET /api/linker/search
 */
router.get("/", async (req, res, next) => {
  try {
    const schema = z.object({
      q: z.string().min(1, "搜索关键词不能为空"),
      type: z.string().optional(),
      status: z.string().optional().default("active"),
      limit: z.coerce.number().min(1).max(50).optional().default(10),
    });

    const parseResult = schema.safeParse(req.query);
    if (!parseResult.success) {
      return badRequestResponse(res, "Invalid search parameters", parseResult.error.issues);
    }

    const params = parseResult.data;
    const results = await linkerService.searchEntities(params);

    return successResponse(res, results);
  } catch (error: any) {
    next(error);
  }
});

export default router;
