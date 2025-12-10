import { Router } from "express";
import { z } from "zod";
import * as relationshipService from "../services/relationshipService";
import { successResponse } from "../utils/response";

const router = Router();

/**
 * 查询实体关系
 * GET /api/entities/:entity_id/relationships
 */
router.get("/:entity_id/relationships", async (req, res, next) => {
  try {
    const { entity_id } = req.params;

    const schema = z.object({
      type: z.string().optional(),
      direction: z.enum(["outgoing", "incoming", "both"]).optional().default("both"),
    });

    const params = schema.parse(req.query);
    const result = await relationshipService.getEntityRelationships(entity_id, params);

    return successResponse(res, result);
  } catch (error: any) {
    next(error);
  }
});

export default router;
