import { Router } from "express";
import { z } from "zod";
import * as linkerService from "../../services/linkerService";
import { successResponse, badRequestResponse, notFoundResponse } from "../../utils/response";

const router = Router();

/**
 * 获取用户配置
 * GET /api/linker/settings/:userId
 */
router.get("/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;

    const settings = await linkerService.getUserSettings(userId);

    if (!settings) {
      // 如果用户没有配置，返回默认配置
      return successResponse(res, {
        userId,
        settings: {
          autoComplete: {
            minChars: 1,
            maxResults: 10,
          },
          preview: {
            delayMs: 500,
            showRelatedEntities: true,
          },
        },
        updatedAt: new Date(),
      });
    }

    return successResponse(res, settings);
  } catch (error: any) {
    next(error);
  }
});

/**
 * 保存用户配置
 * PUT /api/linker/settings/:userId
 */
router.put("/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;

    const schema = z.object({
      settings: z.record(z.string(), z.any()),
    });

    const parseResult = schema.safeParse(req.body);
    if (!parseResult.success) {
      return badRequestResponse(res, "Invalid request body", parseResult.error.issues);
    }

    const { settings } = parseResult.data;
    await linkerService.saveUserSettings(userId, settings);

    return successResponse(res, { userId, updatedAt: new Date() });
  } catch (error: any) {
    next(error);
  }
});

export default router;
