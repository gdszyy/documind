import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { 
  buildFileTree, 
  readFileContent, 
  writeFileContent, 
  checkDocumindRepo,
  getGitStatus,
  commitChanges 
} from "./fileSystem";
import {
  createAsset,
  deleteAsset,
  getTemplates
} from "./assetOperations";
import { 
  getAllDocuments, 
  getDocumentByPath, 
  upsertDocument 
} from "./db";

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

  docs: router({
    // Get file tree structure
    getFileTree: publicProcedure.query(async () => {
      const isRepo = await checkDocumindRepo();
      if (!isRepo) {
        throw new Error('Documind repository not found');
      }
      const tree = await buildFileTree();
      return tree;
    }),

    // Get file content by path
    getFileContent: publicProcedure
      .input(z.object({
        path: z.string(),
      }))
      .query(async ({ input }) => {
        const content = await readFileContent(input.path);
        // Also try to get from database for metadata
        const doc = await getDocumentByPath(input.path);
        return {
          path: input.path,
          content,
          metadata: doc ? {
            lastModified: doc.lastModified,
            modifiedBy: doc.modifiedBy,
          } : null,
        };
      }),

    // Update file content (protected - requires auth)
    updateFileContent: protectedProcedure
      .input(z.object({
        path: z.string(),
        content: z.string(),
        commitMessage: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Write to file system
        await writeFileContent(input.path, input.content);

        // Save to database
        const fileName = input.path.split('/').pop() || input.path;
        await upsertDocument({
          filePath: input.path,
          fileName,
          content: input.content,
          lastModified: new Date(),
          modifiedBy: ctx.user.id,
        });

        // Commit to git if message provided
        if (input.commitMessage) {
          await commitChanges(input.commitMessage, {
            name: ctx.user.name || 'Unknown',
            email: ctx.user.email || 'unknown@example.com',
          });
        }

        return { success: true };
      }),

    // Get git status
    getGitStatus: publicProcedure.query(async () => {
      const status = await getGitStatus();
      return status;
    }),

    // Get all documents from database
    getAllDocuments: publicProcedure.query(async () => {
      const docs = await getAllDocuments();
      return docs;
    }),

    // Create new asset
    createAsset: protectedProcedure
      .input(z.object({
        moduleName: z.string(),
        assetType: z.enum(['module', 'page', 'component', 'api']),
        fileName: z.string(),
        title: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const relativePath = await createAsset(
          input.moduleName,
          input.assetType,
          input.fileName,
          input.title
        );

        // Commit to git
        await commitChanges(
          `Add ${input.assetType}: ${input.title}`,
          {
            name: ctx.user.name || 'Unknown',
            email: ctx.user.email || 'unknown@example.com',
          }
        );

        return { success: true, path: relativePath };
      }),

    // Delete asset
    deleteAsset: protectedProcedure
      .input(z.object({
        path: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        await deleteAsset(input.path);

        // Commit to git
        await commitChanges(
          `Delete ${input.path}`,
          {
            name: ctx.user.name || 'Unknown',
            email: ctx.user.email || 'unknown@example.com',
          }
        );

        return { success: true };
      }),

    // Get available templates
    getTemplates: publicProcedure.query(async () => {
      const templates = await getTemplates();
      return templates;
    }),
  }),
});

export type AppRouter = typeof appRouter;
