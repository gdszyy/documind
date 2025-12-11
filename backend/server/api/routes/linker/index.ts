import { Router } from "express";
import searchRouter from "./search";
import entitiesRouter from "./entities";
import referencesRouter from "./references";
import settingsRouter from "./settings";

const router = Router();

/**
 * Linker API 路由
 * 
 * - GET  /api/linker/search                        - 搜索实体
 * - GET  /api/linker/entities/:entityId            - 获取实体详情
 * - GET  /api/linker/entities/:entityId/references - 获取实体的引用记录
 * - POST /api/linker/references                    - 创建引用记录
 * - DELETE /api/linker/references/:referenceId     - 删除引用记录
 * - GET  /api/linker/settings/:userId              - 获取用户配置
 * - PUT  /api/linker/settings/:userId              - 保存用户配置
 */

router.use("/search", searchRouter);
router.use("/entities", entitiesRouter);
router.use("/references", referencesRouter);
router.use("/settings", settingsRouter);

export default router;
