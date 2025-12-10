import { Response } from "express";

/**
 * 标准API响应格式
 */
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
  error?: string;
  details?: any;
}

/**
 * 成功响应
 */
export function successResponse<T>(res: Response, data: T, message: string = "success") {
  const response: ApiResponse<T> = {
    code: 0,
    message,
    data,
  };
  return res.status(200).json(response);
}

/**
 * 错误响应
 */
export function errorResponse(
  res: Response,
  statusCode: number,
  message: string,
  error?: string,
  details?: any
) {
  const response: ApiResponse = {
    code: statusCode,
    message,
    error,
    details,
  };
  return res.status(statusCode).json(response);
}

/**
 * 400 - 请求参数错误
 */
export function badRequestResponse(res: Response, message: string = "Invalid request parameters", details?: any) {
  return errorResponse(res, 400, message, "INVALID_PARAMETERS", details);
}

/**
 * 404 - 资源不存在
 */
export function notFoundResponse(res: Response, message: string = "Resource not found") {
  return errorResponse(res, 404, message, "NOT_FOUND");
}

/**
 * 409 - 资源冲突
 */
export function conflictResponse(res: Response, message: string = "Resource conflict", error: string = "CONFLICT") {
  return errorResponse(res, 409, message, error);
}

/**
 * 500 - 服务器内部错误
 */
export function internalErrorResponse(res: Response, message: string = "Internal server error", details?: any) {
  return errorResponse(res, 500, message, "INTERNAL_ERROR", details);
}
