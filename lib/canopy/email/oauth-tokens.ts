import { getDb } from "@/lib/db";
import { decryptToken, encryptToken } from "./encryption";

export type OAuthProvider = "google";

export interface OAuthTokenRow {
  id: number;
  user_email: string;
  provider: OAuthProvider;
  connected_email: string;
  scopes: string[];
  encrypted_access_token: string;
  encrypted_refresh_token: string | null;
  access_token_expires_at: string | null;
  last_refreshed_at: string | null;
  last_ingest_history_id: string | null;
  last_ingest_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DecryptedOAuthToken {
  id: number;
  userEmail: string;
  provider: OAuthProvider;
  connectedEmail: string;
  scopes: string[];
  accessToken: string;
  refreshToken: string | null;
  accessTokenExpiresAt: Date | null;
  lastRefreshedAt: Date | null;
  lastIngestHistoryId: string | null;
  lastIngestAt: Date | null;
}

export interface UpsertOAuthTokenInput {
  userEmail: string;
  provider: OAuthProvider;
  connectedEmail: string;
  scopes: string[];
  accessToken: string;
  refreshToken: string | null;
  accessTokenExpiresAt: Date | null;
}

export async function upsertOAuthToken(
  input: UpsertOAuthTokenInput
): Promise<OAuthTokenRow> {
  const sql = getDb();
  const encryptedAccess = encryptToken(input.accessToken);
  const encryptedRefresh = input.refreshToken
    ? encryptToken(input.refreshToken)
    : null;
  const expiresAtIso = input.accessTokenExpiresAt
    ? input.accessTokenExpiresAt.toISOString()
    : null;

  const rows = (await sql`
    INSERT INTO oauth_tokens (
      user_email,
      provider,
      connected_email,
      scopes,
      encrypted_access_token,
      encrypted_refresh_token,
      access_token_expires_at,
      last_refreshed_at
    )
    VALUES (
      ${input.userEmail},
      ${input.provider},
      ${input.connectedEmail},
      ${input.scopes},
      ${encryptedAccess},
      ${encryptedRefresh},
      ${expiresAtIso},
      NOW()
    )
    ON CONFLICT (user_email, provider) DO UPDATE
    SET connected_email          = EXCLUDED.connected_email,
        scopes                   = EXCLUDED.scopes,
        encrypted_access_token   = EXCLUDED.encrypted_access_token,
        encrypted_refresh_token  = COALESCE(EXCLUDED.encrypted_refresh_token, oauth_tokens.encrypted_refresh_token),
        access_token_expires_at  = EXCLUDED.access_token_expires_at,
        last_refreshed_at        = NOW(),
        updated_at               = NOW()
    RETURNING *
  `) as OAuthTokenRow[];

  if (rows.length === 0) {
    throw new Error("upsertOAuthToken: insert returned no row");
  }
  return rows[0]!;
}

export async function getOAuthTokenForUser(
  userEmail: string,
  provider: OAuthProvider = "google"
): Promise<DecryptedOAuthToken | null> {
  const sql = getDb();
  const rows = (await sql`
    SELECT *
    FROM oauth_tokens
    WHERE user_email = ${userEmail} AND provider = ${provider}
    LIMIT 1
  `) as OAuthTokenRow[];

  const row = rows[0];
  if (!row) return null;
  return decryptRow(row);
}

export async function listConnectedAccounts(): Promise<
  Array<{
    userEmail: string;
    provider: OAuthProvider;
    connectedEmail: string;
    scopes: string[];
    accessTokenExpiresAt: Date | null;
    lastRefreshedAt: Date | null;
    lastIngestAt: Date | null;
    createdAt: Date;
  }>
> {
  const sql = getDb();
  const rows = (await sql`
    SELECT
      user_email,
      provider,
      connected_email,
      scopes,
      access_token_expires_at,
      last_refreshed_at,
      last_ingest_at,
      created_at
    FROM oauth_tokens
    ORDER BY created_at DESC
  `) as Array<{
    user_email: string;
    provider: OAuthProvider;
    connected_email: string;
    scopes: string[];
    access_token_expires_at: string | null;
    last_refreshed_at: string | null;
    last_ingest_at: string | null;
    created_at: string;
  }>;

  return rows.map((r) => ({
    userEmail: r.user_email,
    provider: r.provider,
    connectedEmail: r.connected_email,
    scopes: r.scopes,
    accessTokenExpiresAt: r.access_token_expires_at
      ? new Date(r.access_token_expires_at)
      : null,
    lastRefreshedAt: r.last_refreshed_at ? new Date(r.last_refreshed_at) : null,
    lastIngestAt: r.last_ingest_at ? new Date(r.last_ingest_at) : null,
    createdAt: new Date(r.created_at),
  }));
}

export async function deleteOAuthToken(
  userEmail: string,
  provider: OAuthProvider = "google"
): Promise<boolean> {
  const sql = getDb();
  const rows = (await sql`
    DELETE FROM oauth_tokens
    WHERE user_email = ${userEmail} AND provider = ${provider}
    RETURNING id
  `) as Array<{ id: number }>;
  return rows.length > 0;
}

export async function updateAccessTokenAfterRefresh(input: {
  userEmail: string;
  provider: OAuthProvider;
  accessToken: string;
  accessTokenExpiresAt: Date;
}): Promise<void> {
  const sql = getDb();
  const encrypted = encryptToken(input.accessToken);
  await sql`
    UPDATE oauth_tokens
    SET encrypted_access_token  = ${encrypted},
        access_token_expires_at = ${input.accessTokenExpiresAt.toISOString()},
        last_refreshed_at       = NOW(),
        updated_at              = NOW()
    WHERE user_email = ${input.userEmail} AND provider = ${input.provider}
  `;
}

export async function updateIngestCheckpoint(input: {
  userEmail: string;
  provider: OAuthProvider;
  historyId: string;
}): Promise<void> {
  const sql = getDb();
  await sql`
    UPDATE oauth_tokens
    SET last_ingest_history_id = ${input.historyId},
        last_ingest_at         = NOW(),
        updated_at             = NOW()
    WHERE user_email = ${input.userEmail} AND provider = ${input.provider}
  `;
}

function decryptRow(row: OAuthTokenRow): DecryptedOAuthToken {
  return {
    id: row.id,
    userEmail: row.user_email,
    provider: row.provider,
    connectedEmail: row.connected_email,
    scopes: row.scopes,
    accessToken: decryptToken(row.encrypted_access_token),
    refreshToken: row.encrypted_refresh_token
      ? decryptToken(row.encrypted_refresh_token)
      : null,
    accessTokenExpiresAt: row.access_token_expires_at
      ? new Date(row.access_token_expires_at)
      : null,
    lastRefreshedAt: row.last_refreshed_at
      ? new Date(row.last_refreshed_at)
      : null,
    lastIngestHistoryId: row.last_ingest_history_id,
    lastIngestAt: row.last_ingest_at ? new Date(row.last_ingest_at) : null,
  };
}
