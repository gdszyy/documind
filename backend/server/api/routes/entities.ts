import { Router } from "express";
import { z } from "zod";
import * as entityService from "../services/entityService";
import {
  successResponse,
  badRequestResponse,
  notFoundResponse,
  internalErrorResponse,
} from "../utils/response";

const router = Router();

/**
 * 创建实体
 * POST /api/entities
 */
router.post("/", async (req, res, next) => {
  try {
    const schema = z.object({
      id: z.string().optional(),
      type: z.string().min(1),
      title: z.string().min(1),
      status: z.string().optional(),
      documentUrl: z.string().optional(),
      metadata: z.record(z.string(), z.any()).optional(),
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      return badRequestResponse(res, "Validation error", result.error.issues);
    }
    const data = result.data;
    
    const entity = await entityService.createEntity(data);

    return successResponse(res, entity);
  } catch (error: any) {
    next(error);
  }
});

/**
 * 批量创建实体
 * POST /api/entities/batch
 */
router.post("/batch", async (req, res, next) => {
  try {
    const schema = z.object({
      entities: z.array(
        z.object({
          id: z.string().optional(),
          type: z.string().min(1),
          title: z.string().min(1),
          status: z.string().optional(),
          documentUrl: z.string().optional(),
          metadata: z.record(z.string(), z.any()).optional(),
        })
      ),
    });

    const parseResult = schema.safeParse(req.body);
    if (!parseResult.success) {
      return badRequestResponse(res, "Validation error", parseResult.error.issues);
    }
    const data = parseResult.data;
    
    const result = await entityService.batchCreateEntities(data.entities);

    return successResponse(res, result);
  } catch (error: any) {
    next(error);
  }
});

/**
 * 获取实体详情
 * GET /api/entities/:entity_id
 */
router.get("/:entity_id", async (req, res, next) => {
  try {
    const { entity_id } = req.params;
    const entity = await entityService.getEntityById(entity_id);

    if (!entity) {
      return notFoundResponse(res, "Entity not found");
    }

    // TODO: 获取关系信息并添加到响应中

    return successResponse(res, entity);
  } catch (error: any) {
    next(error);
  }
});

/**
 * 更新实体（完整更新）
 * PUT /api/entities/:entity_id
 */
router.put("/:entity_id", async (req, res, next) => {
  try {
    const { entity_id } = req.params;

    const schema = z.object({
      type: z.string().min(1),
      title: z.string().min(1),
      status: z.string(),
      documentUrl: z.string().optional(),
      metadata: z.record(z.string(), z.any()).optional(),
    });

    const parseResult = schema.safeParse(req.body);
    if (!parseResult.success) {
      return badRequestResponse(res, "Validation error", parseResult.error.issues);
    }
    const data = parseResult.data;
    
    const entity = await entityService.updateEntity(entity_id, data);

    return successResponse(res, entity);
  } catch (error: any) {
    next(error);
  }
});

/**
 * 部分更新实体
 * PATCH /api/entities/:entity_id
 */
router.patch("/:entity_id", async (req, res, next) => {
  try {
    const { entity_id } = req.params;

    const schema = z.object({
      status: z.string().optional(),
      metadata: z.record(z.string(), z.any()).optional(),
    });

    const parseResult = schema.safeParse(req.body);
    if (!parseResult.success) {
      return badRequestResponse(res, "Validation error", parseResult.error.issues);
    }
    const data = parseResult.data;
    
    const entity = await entityService.patchEntity(entity_id, data);

    return successResponse(res, entity);
  } catch (error: any) {
    next(error);
  }
});

/**
 * 删除实体
 * DELETE /api/entities/:entity_id
 */
router.delete("/:entity_id", async (req, res, next) => {
  try {
    const { entity_id } = req.params;
    const { soft_delete = "true", cascade = "false" } = req.query;

    const softDelete = soft_delete === "true";

    // TODO: 实现 cascade 删除关系

    const result = await entityService.deleteEntity(entity_id, softDelete);

    return successResponse(res, result, "Entity deleted successfully");
  } catch (error: any) {
    next(error);
  }
});

/**
 * 查询实体列表
 * GET /api/entities
 */
router.get("/", async (req, res, next) => {
  try {
    const schema = z.object({
      type: z.string().optional(),
      status: z.string().optional(),
      category: z.string().optional(),
      tags: z.string().optional(),
      search: z.string().optional(),
      page: z.coerce.number().min(1).optional().default(1),
      page_size: z.coerce.number().min(1).max(100).optional().default(20),
      sort_by: z.enum(["created_at", "updated_at", "title"]).optional().default("created_at"),
      sort_order: z.enum(["asc", "desc"]).optional().default("desc"),
    });

    const parseResult = schema.safeParse(req.query);
    if (!parseResult.success) {
      return badRequestResponse(res, "Validation error", parseResult.error.issues);
    }
    const params = parseResult.data;
    
    const result = await entityService.getEntities(params);

    return successResponse(res, result);
  } catch (error: any) {
    next(error);
  }
});

export default router;
