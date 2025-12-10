import express, { Router, Request, Response, NextFunction } from "express";
import entitiesRouter from "./routes/entities";
import relationshipsRouter from "./routes/relationships";
import entityRelationshipsRouter from "./routes/entityRelationships";
import searchRouter from "./routes/search";
import statsRouter from "./routes/stats";
import healthRouter from "./routes/health";
import importRouter from "./routes/import";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

/**
 * 创建 REST API 路由器
 */
export function createApiRouter() {
  const router = Router();

  // CORS 配置
  router.use((req: Request, res: Response, next: NextFunction) => {
    res.header("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");
    
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    
    next();
  });

  // JSON 解析
  router.use(express.json());
  router.use(express.urlencoded({ extended: true }));

  // 健康检查（独立路由，不在 /api 下）
  router.use("/health", healthRouter);

  // API 路由
  router.use("/api/entities", entityRelationshipsRouter); // 必须在 entitiesRouter 之前
  router.use("/api/entities/import", importRouter); // CSV 导入
  router.use("/api/entities", entitiesRouter);
  router.use("/api/relationships", relationshipsRouter);
  router.use("/api/search", searchRouter);
  router.use("/api/stats", statsRouter);
  router.use("/api/health", healthRouter);

  // 404 处理
  router.use(notFoundHandler);

  // 错误处理
  router.use(errorHandler);

  return router;
}
