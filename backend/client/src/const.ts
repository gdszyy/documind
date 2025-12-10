export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate Lark/Feishu OAuth login URL
export const getLoginUrl = () => {
  const feishuAppId = import.meta.env.VITE_FEISHU_APP_ID || "cli_a98e2f05eff89e1a";
  const apiBase = import.meta.env.VITE_LARK_API_BASE || "https://open.larksuite.com";
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  
  // Generate random state for CSRF protection
  const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  // Store state in sessionStorage for verification (optional)
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('oauth_state', state);
  }

  // Construct Lark/Feishu OAuth URL
  const url = new URL(`${apiBase}/open-apis/authen/v1/authorize`);
  url.searchParams.set("app_id", feishuAppId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);

  return url.toString();
};
