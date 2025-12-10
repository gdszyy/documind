import { Router } from "express";
import { z } from "zod";
import * as entityService from "../services/entityService";
import { successResponse, badRequestResponse } from "../utils/response";

const router = Router();

/**
 * 全文搜索
 * GET /api/search
 */
router.get("/", async (req, res, next) => {
  try {
    const schema = z.object({
      q: z.string().min(1),
      type: z.string().optional(),
      category: z.string().optional(),
      page: z.coerce.number().min(1).optional().default(1),
      page_size: z.coerce.number().min(1).max(50).optional().default(10),
    });

    const params = schema.parse(req.query);

    if (!params.q) {
      return badRequestResponse(res, "Search query is required", {
        field: "q",
        reason: "Query parameter 'q' is required",
      });
    }

    const result = await entityService.searchEntities(params);

    return successResponse(res, result);
  } catch (error: any) {
    next(error);
  }
});

export default router;
