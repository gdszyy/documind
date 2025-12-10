import { Router } from "express";
import { z } from "zod";
import * as importService from "../services/importService";
import { successResponse, badRequestResponse } from "../utils/response";

const router = Router();

/**
 * 从 CSV 导入实体
 * POST /api/entities/import/csv
 */
router.post("/csv", async (req, res, next) => {
  try {
    const schema = z.object({
      csvData: z.array(z.record(z.string(), z.any())),
      mapping: z.record(z.string(), z.string()).optional(),
    });

    const parseResult = schema.safeParse(req.body);
    if (!parseResult.success) {
      return badRequestResponse(res, "Validation error", parseResult.error.issues);
    }
    const data = parseResult.data;

    if (!data.csvData || data.csvData.length === 0) {
      return badRequestResponse(res, "CSV data is required and cannot be empty");
    }

    const result = await importService.importFromCsv(data.csvData, data.mapping);

    return successResponse(res, result);
  } catch (error: any) {
    next(error);
  }
});

/**
 * 从 CSV 文本导入实体
 * POST /api/entities/import/csv-text
 */
router.post("/csv-text", async (req, res, next) => {
  try {
    const schema = z.object({
      csvText: z.string().min(1),
      mapping: z.record(z.string(), z.string()).optional(),
    });

    const parseResult = schema.safeParse(req.body);
    if (!parseResult.success) {
      return badRequestResponse(res, "Validation error", parseResult.error.issues);
    }
    const data = parseResult.data;

    // 解析 CSV 文本
    const csvData = importService.parseCsv(data.csvText);

    if (csvData.length === 0) {
      return badRequestResponse(res, "CSV data is empty or invalid");
    }

    const result = await importService.importFromCsv(csvData, data.mapping);

    return successResponse(res, result);
  } catch (error: any) {
    next(error);
  }
});

export default router;
