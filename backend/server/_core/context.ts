import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { COOKIE_NAME } from "@shared/const";
import { jwtVerify } from "jose";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

// 从JWT token中提取用户信息
async function authenticateRequest(req: CreateExpressContextOptions["req"]): Promise<User | null> {
  try {
    // 从cookie中获取session token
    const token = req.cookies?.[COOKIE_NAME];
    
    if (!token) {
      return null;
    }

    // 验证JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret-change-in-production");
    const { payload } = await jwtVerify(token, secret);

    if (!payload.openId || typeof payload.openId !== "string") {
      return null;
    }

    // 尝试从数据库获取用户信息
    const user = await db.getUserByOpenId(payload.openId);
    
    // 如果数据库不可用，使用 JWT payload 中的信息构造用户对象
    if (!user) {
      console.log("[Auth] Database unavailable, using JWT payload for user info");
      return {
        id: 0, // 临时 ID，数据库不可用时使用
        openId: payload.openId as string,
        name: (payload.name as string) || null,
        email: null,
        loginMethod: "feishu",
        role: "user",
        lastSignedIn: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User;
    }
    
    return user;
  } catch (error) {
    console.error("[Auth] Authentication failed:", error);
    return null;
  }
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
