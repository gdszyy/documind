import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { checkDocumindRepo } from "./fileSystem";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("docs API", () => {
  let repoExists = false;

  beforeAll(async () => {
    repoExists = await checkDocumindRepo();
  });

  it("should check if documind repo exists", () => {
    expect(typeof repoExists).toBe("boolean");
  });

  it("should get file tree without authentication", async () => {
    if (!repoExists) {
      console.log("Skipping test: documind repo not found");
      return;
    }

    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const tree = await caller.docs.getFileTree();
    expect(Array.isArray(tree)).toBe(true);
    if (tree.length > 0) {
      expect(tree[0]).toHaveProperty("name");
      expect(tree[0]).toHaveProperty("path");
      expect(tree[0]).toHaveProperty("type");
    }
  });

  it("should get file content for README.md", async () => {
    if (!repoExists) {
      console.log("Skipping test: documind repo not found");
      return;
    }

    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.docs.getFileContent({ path: "README.md" });
    expect(result).toHaveProperty("path");
    expect(result).toHaveProperty("content");
    expect(result.path).toBe("README.md");
    expect(typeof result.content).toBe("string");
    expect(result.content.length).toBeGreaterThan(0);
  });

  it("should require authentication for file updates", async () => {
    if (!repoExists) {
      console.log("Skipping test: documind repo not found");
      return;
    }

    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.docs.updateFileContent({
        path: "test.md",
        content: "test content",
      })
    ).rejects.toThrow();
  });

  it("should allow authenticated users to update files", async () => {
    if (!repoExists) {
      console.log("Skipping test: documind repo not found");
      return;
    }

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a test file path
    const testPath = "test-file-" + Date.now() + ".md";
    const testContent = "# Test Content\n\nThis is a test file.";

    const result = await caller.docs.updateFileContent({
      path: testPath,
      content: testContent,
    });

    expect(result.success).toBe(true);

    // Verify the file was created
    const fileContent = await caller.docs.getFileContent({ path: testPath });
    expect(fileContent.content).toBe(testContent);
  });
});
