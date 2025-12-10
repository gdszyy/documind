import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
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

  return ctx;
}

describe("entities procedures", () => {
  it("should create an entity successfully", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const entityData = {
      name: "Test Service",
      uniqueId: "test-service",
      type: "Service" as const,
      owner: "Test User",
      status: "Development" as const,
      description: "A test service for unit testing",
    };

    const result = await caller.entities.create(entityData);

    expect(result).toBeDefined();
    expect(result.name).toBe(entityData.name);
    expect(result.uniqueId).toBe(entityData.uniqueId);
    expect(result.type).toBe(entityData.type);
    expect(result.larkDocUrl).toBeDefined();
    expect(result.larkDocUrl).toContain("feishu.cn/docs");
  });

  it("should list entities with pagination", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.entities.list({
      page: 1,
      limit: 10,
      sortBy: "updatedAt",
      order: "desc",
    });

    expect(result).toBeDefined();
    expect(result.items).toBeInstanceOf(Array);
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
  });

  it("should get graph data with filters", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.graph.getData({
      types: ["Service", "API"],
      statuses: ["Development", "Production"],
    });

    expect(result).toBeDefined();
    expect(result.nodes).toBeInstanceOf(Array);
    expect(result.edges).toBeInstanceOf(Array);
  });
});
