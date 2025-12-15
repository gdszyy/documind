import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { createLarkDoc } from "./larkService";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  entities: router({
    // 获取实体列表
    list: publicProcedure
      .input(
        z.object({
          search: z.string().optional(),
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(100).default(10),
          sortBy: z.enum(["name", "updatedAt"]).default("updatedAt"),
          order: z.enum(["asc", "desc"]).default("desc"),
        })
      )
      .query(async ({ input }) => {
        return db.getEntities(input);
      }),

    // 获取单个实体
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const entity = await db.getEntityById(input.id);
        if (!entity) {
          throw new Error("Entity not found");
        }
        return entity;
      }),

    // 创建实体
    create: publicProcedure
      .input(
        z.object({
          name: z.string().min(1),
          uniqueId: z.string().min(1),
          type: z.enum(["Service", "API", "Component", "Page", "Module", "Documentation", "Document"]),
          owner: z.string().min(1),
          status: z.enum(["Development", "Testing", "Production", "Deprecated"]),
          description: z.string().optional(),
          httpMethod: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]).optional(),
          apiPath: z.string().optional(),
          relatedToId: z.number().optional(), // 关联的实体 ID
          relationshipType: z.enum(["EXPOSES_API", "DEPENDS_ON", "USES_COMPONENT", "CONTAINS"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { relatedToId, relationshipType, ...entityData } = input;

        // 1. 创建实体
        const entity = await db.createEntity(entityData);

        if (!entity) {
          throw new Error("Failed to create entity");
        }

        // 2. 创建飞书文档（模拟）
        const larkDocUrl = await createLarkDoc(entity.name, entity.id);

        // 3. 更新实体，添加飞书文档链接
        const updatedEntity = await db.updateEntity(entity.id, { larkDocUrl });

        // 4. 如果有关联实体，创建关系
        if (relatedToId && relationshipType) {
          await db.createRelationship({
            sourceId: relatedToId,
            targetId: entity.id,
            type: relationshipType,
          });
        }

        return updatedEntity;
      }),

    // 更新实体
    update: publicProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).optional(),
          uniqueId: z.string().min(1).optional(),
          type: z.enum(["Service", "API", "Component", "Page", "Module", "Documentation", "Document"]).optional(),
          owner: z.string().min(1).optional(),
          status: z.enum(["Development", "Testing", "Production", "Deprecated"]).optional(),
          description: z.string().optional(),
          documentUrl: z.string().nullable().optional(), // 添加documentUrl字段
          httpMethod: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]).optional(),
          apiPath: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return db.updateEntity(id, data);
      }),

    // 删除实体
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteEntity(input.id);
        return { success: true };
      }),

    // 获取实体的关系
    getRelationships: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getEntityRelationships(input.id);
      }),

    // RAG语义搜索
    search: publicProcedure
      .input(
        z.object({
          query: z.string().min(1),
          limit: z.number().min(1).max(50).default(10),
        })
      )
      .query(async ({ input }) => {
        return db.searchEntitiesByVector(input.query, input.limit);
      }),
  }),

  graph: router({
    // 获取知识图谱数据
    getData: publicProcedure
      .input(
        z.object({
          types: z.array(z.enum(["Service", "API", "Component", "Page", "Module", "Documentation", "Document"])).optional(),
          statuses: z.array(z.enum(["Development", "Testing", "Production", "Deprecated"])).optional(),
        })
      )
      .query(async ({ input }) => {
        return db.getGraphData(input);
      }),
  }),

  relationships: router({
    // 创建实体关系
    create: publicProcedure
      .input(
        z.object({
          sourceId: z.number(),
          targetId: z.number(),
          type: z.enum(["EXPOSES_API", "DEPENDS_ON", "USES_COMPONENT", "CONTAINS"]),
        })
      )
      .mutation(async ({ input }) => {
        await db.createRelationship(input);
        return { success: true };
      }),

    // 删除实体关系
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteRelationship(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
