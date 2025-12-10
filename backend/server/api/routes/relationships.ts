import { Router } from "express";
import { z } from "zod";
import * as relationshipService from "../services/relationshipService";
import { successResponse, badRequestResponse } from "../utils/response";

const router = Router();

/**
 * 创建关系
 * POST /api/relationships
 */
router.post("/", async (req, res, next) => {
  try {
    const schema = z.object({
      source_id: z.string().min(1),
      target_id: z.string().min(1),
      relationship_type: z.string().min(1),
      metadata: z.record(z.string(), z.any()).optional(),
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      return badRequestResponse(res, "Validation error", result.error.issues);
    }
    const data = result.data;

    const relationship = await relationshipService.createRelationship(data);

    return successResponse(res, relationship);
  } catch (error: any) {
    next(error);
  }
});

/**
 * 删除关系
 * DELETE /api/relationships/:relationship_id
 */
router.delete("/:relationship_id", async (req, res, next) => {
  try {
    const { relationship_id } = req.params;
    const result = await relationshipService.deleteRelationship(relationship_id);

    return successResponse(res, result, "Relationship deleted successfully");
  } catch (error: any) {
    next(error);
  }
});

export default router;
