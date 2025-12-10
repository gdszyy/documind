import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import axios from "axios";
import { SignJWT } from "jose";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

// 飞书OAuth配置
const FEISHU_APP_ID = process.env.FEISHU_APP_ID || "";
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET || "";
const FEISHU_REDIRECT_URI = process.env.FEISHU_REDIRECT_URI || "";

// 启动时打印配置状态（隐藏敏感信息）
console.log("[Feishu OAuth] Configuration loaded:");
console.log(`  - FEISHU_APP_ID: ${FEISHU_APP_ID ? `${FEISHU_APP_ID.substring(0, 8)}...` : 'NOT SET'}`);
console.log(`  - FEISHU_APP_SECRET: ${FEISHU_APP_SECRET ? '***SET***' : 'NOT SET'}`);
console.log(`  - FEISHU_REDIRECT_URI: ${FEISHU_REDIRECT_URI || 'NOT SET'}`);

// Lark/飞书API端点（支持国际版和中国版）
const API_BASE = process.env.LARK_API_BASE || "https://open.larksuite.com";
const FEISHU_AUTH_URL = `${API_BASE}/open-apis/authen/v1/authorize`;
const FEISHU_TOKEN_URL = `${API_BASE}/open-apis/authen/v1/access_token`;
const FEISHU_USERINFO_URL = `${API_BASE}/open-apis/authen/v1/user_info`;

console.log(`[OAuth] Using API base: ${API_BASE}`);

// 生成飞书授权URL
export function getFeishuAuthUrl(state: string): string {
  const params = new URLSearchParams({
    app_id: FEISHU_APP_ID,
    redirect_uri: FEISHU_REDIRECT_URI,
    state: state,
  });
  return `${FEISHU_AUTH_URL}?${params.toString()}`;
}

// 用code换取access_token
async function exchangeCodeForToken(code: string): Promise<string> {
  try {
    console.log("[Feishu OAuth] Exchanging code for token...");
    console.log(`  - client_id: ${FEISHU_APP_ID ? `${FEISHU_APP_ID.substring(0, 8)}...` : 'EMPTY'}`);
    console.log(`  - client_secret: ${FEISHU_APP_SECRET ? '***SET***' : 'EMPTY'}`);
    console.log(`  - redirect_uri: ${FEISHU_REDIRECT_URI || 'EMPTY'}`);
    console.log(`  - code: ${code.substring(0, 10)}...`);

    const response = await axios.post(
      FEISHU_TOKEN_URL,
      {
        grant_type: "authorization_code",
        client_id: FEISHU_APP_ID,
        client_secret: FEISHU_APP_SECRET,
        code: code,
        redirect_uri: FEISHU_REDIRECT_URI,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.code !== 0) {
      console.error("[Feishu OAuth] Token exchange failed:", response.data);
      throw new Error(`Feishu token exchange failed: ${response.data.msg}`);
    }

    return response.data.data.access_token;
  } catch (error) {
    console.error("[Feishu OAuth] Token exchange failed:", error);
    throw error;
  }
}

// 获取用户信息
async function getUserInfo(accessToken: string): Promise<{
  openId: string;
  name?: string;
  email?: string;
  mobile?: string;
}> {
  try {
    const response = await axios.get(FEISHU_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.data.code !== 0) {
      throw new Error(`Feishu get user info failed: ${response.data.msg}`);
    }

    const userData = response.data.data;
    return {
      openId: userData.open_id,
      name: userData.name,
      email: userData.email,
      mobile: userData.mobile,
    };
  } catch (error) {
    console.error("[Feishu OAuth] Get user info failed:", error);
    throw error;
  }
}

// 创建session token
async function createSessionToken(
  openId: string,
  options: { name: string; expiresInMs: number }
): Promise<string> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret-change-in-production");
  
  const token = await new SignJWT({ openId, name: options.name })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + options.expiresInMs / 1000)
    .sign(secret);

  return token;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      // 1. 用code换取access_token
      const accessToken = await exchangeCodeForToken(code);

      // 2. 用access_token获取用户信息
      const userInfo = await getUserInfo(accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      // 3. 存储用户信息到数据库
      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: "feishu",
        lastSignedIn: new Date(),
      });

      // 4. 创建session token
      const sessionToken = await createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      // 5. 设置cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // 6. 重定向到首页
      res.redirect(302, "/");
    } catch (error) {
      console.error("[Feishu OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });

  // 添加登录端点，用于生成授权URL
  app.get("/api/oauth/login", (req: Request, res: Response) => {
    const state = Math.random().toString(36).substring(2, 15);
    const authUrl = getFeishuAuthUrl(state);
    res.redirect(302, authUrl);
  });
}
