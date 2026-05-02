import { randomBytes } from "node:crypto";
import {
  getOAuthTokenForUser,
  updateAccessTokenAfterRefresh,
  type DecryptedOAuthToken,
} from "@/lib/canopy/email/oauth-tokens";

/* Google OAuth 2.0 helpers for Canopy email integration.
 *
 * Scope set is fixed at the application boundary so a future code path
 * cannot quietly request additional scopes without an audit. If a new
 * scope is needed, add it here AND make sure it's also declared on the
 * Google Auth Platform consent screen for the project.
 *
 * Token storage is delegated to lib/canopy/email/oauth-tokens.ts which
 * encrypts at rest. This file is the boundary with Google's APIs and
 * should NEVER touch the database directly. */

export const GOOGLE_OAUTH_SCOPES: readonly string[] = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
];

const GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

export const OAUTH_STATE_COOKIE = "canopy_oauth_state";
export const OAUTH_STATE_TTL_SECONDS = 600;

const ACCESS_TOKEN_REFRESH_BUFFER_MS = 60_000;

export class GoogleOAuthConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GoogleOAuthConfigError";
  }
}

export class GoogleOAuthRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly detail?: string
  ) {
    super(message);
    this.name = "GoogleOAuthRequestError";
  }
}

interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

function loadConfig(): GoogleConfig {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new GoogleOAuthConfigError(
      "GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET must be set in Vercel env vars."
    );
  }
  const siteUrl =
    process.env.GOOGLE_OAUTH_REDIRECT_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "http://localhost:3000";
  const normalized = siteUrl.replace(/\/+$/, "");
  return {
    clientId,
    clientSecret,
    redirectUri: `${normalized}/api/integrations/google/callback`,
  };
}

export function isGoogleOAuthConfigured(): boolean {
  try {
    loadConfig();
    return true;
  } catch {
    return false;
  }
}

export function getRedirectUri(): string {
  return loadConfig().redirectUri;
}

export function generateOAuthState(): string {
  return randomBytes(24).toString("hex");
}

export function buildAuthorizeUrl(state: string): string {
  const cfg = loadConfig();
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    response_type: "code",
    scope: GOOGLE_OAUTH_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `${GOOGLE_AUTHORIZE_URL}?${params.toString()}`;
}

export interface GoogleTokenExchangeResult {
  accessToken: string;
  refreshToken: string | null;
  expiresInSeconds: number;
  scope: string[];
  idToken: string | null;
  tokenType: string;
}

interface GoogleTokenApiResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  id_token?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
}

export async function exchangeCodeForTokens(
  code: string
): Promise<GoogleTokenExchangeResult> {
  const cfg = loadConfig();
  const body = new URLSearchParams({
    code,
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    redirect_uri: cfg.redirectUri,
    grant_type: "authorization_code",
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const json = (await res.json().catch(() => null)) as
    | GoogleTokenApiResponse
    | null;

  if (!res.ok || !json) {
    throw new GoogleOAuthRequestError(
      "Google token exchange failed",
      res.status,
      json ? `${json.error ?? "?"}: ${json.error_description ?? ""}` : undefined
    );
  }
  if (!json.access_token) {
    throw new GoogleOAuthRequestError(
      "Google token exchange returned no access_token",
      res.status,
      json.error
        ? `${json.error}: ${json.error_description ?? ""}`
        : undefined
    );
  }

  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? null,
    expiresInSeconds: typeof json.expires_in === "number" ? json.expires_in : 3600,
    scope: typeof json.scope === "string" ? json.scope.split(/\s+/) : [],
    idToken: json.id_token ?? null,
    tokenType: json.token_type ?? "Bearer",
  };
}

export interface GoogleRefreshResult {
  accessToken: string;
  expiresInSeconds: number;
  scope: string[];
  tokenType: string;
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<GoogleRefreshResult> {
  const cfg = loadConfig();
  const body = new URLSearchParams({
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const json = (await res.json().catch(() => null)) as
    | GoogleTokenApiResponse
    | null;

  if (!res.ok || !json || !json.access_token) {
    throw new GoogleOAuthRequestError(
      "Google access-token refresh failed",
      res.status,
      json
        ? `${json.error ?? "?"}: ${json.error_description ?? ""}`
        : undefined
    );
  }

  return {
    accessToken: json.access_token,
    expiresInSeconds: typeof json.expires_in === "number" ? json.expires_in : 3600,
    scope: typeof json.scope === "string" ? json.scope.split(/\s+/) : [],
    tokenType: json.token_type ?? "Bearer",
  };
}

export async function revokeToken(token: string): Promise<void> {
  const body = new URLSearchParams({ token });
  const res = await fetch(GOOGLE_REVOKE_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok && res.status !== 400) {
    /* 400 from /revoke means the token was already invalid; that's
     * fine for our purposes. Other failures are real. */
    const detail = await res.text().catch(() => "");
    throw new GoogleOAuthRequestError(
      "Google token revocation failed",
      res.status,
      detail.slice(0, 200)
    );
  }
}

export interface GoogleUserInfo {
  sub: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
}

export async function fetchUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch(GOOGLE_USERINFO_URL, {
    method: "GET",
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new GoogleOAuthRequestError(
      "Google userinfo fetch failed",
      res.status,
      detail.slice(0, 200)
    );
  }
  const json = (await res.json()) as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
  };
  if (!json.sub || !json.email) {
    throw new GoogleOAuthRequestError(
      "Google userinfo response missing sub or email",
      res.status
    );
  }
  return {
    sub: json.sub,
    email: json.email,
    emailVerified: json.email_verified === true,
    name: json.name,
    picture: json.picture,
  };
}

export async function getValidAccessToken(
  userEmail: string
): Promise<{ accessToken: string; connectedEmail: string } | null> {
  const stored = await getOAuthTokenForUser(userEmail);
  if (!stored) return null;

  const expiresAt = stored.accessTokenExpiresAt;
  const stillValid =
    expiresAt &&
    expiresAt.getTime() - ACCESS_TOKEN_REFRESH_BUFFER_MS > Date.now();
  if (stillValid) {
    return {
      accessToken: stored.accessToken,
      connectedEmail: stored.connectedEmail,
    };
  }

  if (!stored.refreshToken) {
    return null;
  }

  const refreshed = await refreshAccessToken(stored.refreshToken);
  const newExpiresAt = new Date(Date.now() + refreshed.expiresInSeconds * 1000);
  await updateAccessTokenAfterRefresh({
    userEmail,
    provider: "google",
    accessToken: refreshed.accessToken,
    accessTokenExpiresAt: newExpiresAt,
  });
  return {
    accessToken: refreshed.accessToken,
    connectedEmail: stored.connectedEmail,
  };
}

export type StoredOAuthToken = DecryptedOAuthToken;
