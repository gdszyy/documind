import { Router } from "express";
import { z } from "zod";
import * as linkerService from "../../services/linkerService";
import { successResponse, badRequestResponse, notFoundResponse } from "../../utils/response";

const router = Router();

/**
 * 创建引用记录
 * POST /api/linker/references
 */
router.post("/", async (req, res, next) => {
  try {
    const schema = z.object({
      entityId: z.string().min(1, "entityId 不能为空"),
      documentId: z.string().min(1, "documentId 不能为空"),
      documentUrl: z.string().optional(),
      documentTitle: z.string().optional(),
      contextSnippet: z.string().optional(),
      userId: z.string().optional(),
    });

    const parseResult = schema.safeParse(req.body);
    if (!parseResult.success) {
      return badRequestResponse(res, "Invalid request body", parseResult.error.issues);
    }

    const data = parseResult.data;
    const referenceId = await linkerService.createReference(data);

    return successResponse(res, { referenceId });
  } catch (error: any) {
    next(error);
  }
});

/**
 * 删除引用记录
 * DELETE /api/linker/references/:referenceId
 */
router.delete("/:referenceId", async (req, res, next) => {
  try {
    const { referenceId } = req.params;

    const deleted = await linkerService.deleteReference(referenceId);

    if (!deleted) {
      return notFoundResponse(res, "引用记录不存在");
    }

    return successResponse(res, { referenceId });
  } catch (error: any) {
    next(error);
  }
});

export default router;
