import { Request, Response, NextFunction } from "express";
import { errorResponse } from "../utils/response";

/**
 * 全局错误处理中间件
 */
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error("[API Error]", err);

  // Zod 验证错误
  if (err.name === "ZodError") {
    return errorResponse(res, 400, "Validation error", "VALIDATION_ERROR", err.errors);
  }

  // 自定义错误
  if (err.statusCode) {
    return errorResponse(res, err.statusCode, err.message, err.error, err.details);
  }

  // 默认服务器错误
  return errorResponse(res, 500, "Internal server error", "INTERNAL_ERROR", 
    process.env.NODE_ENV === "development" ? err.stack : undefined
  );
}

/**
 * 404 处理中间件
 */
export function notFoundHandler(req: Request, res: Response) {
  return errorResponse(res, 404, `Route ${req.method} ${req.path} not found`, "NOT_FOUND");
}

/**
 * 自定义错误类
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public error?: string,
    public details?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}
