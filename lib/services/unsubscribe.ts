import { createHmac, timingSafeEqual } from "node:crypto";
import { getDb } from "../db";

const TOKEN_LENGTH = 32;

function getSecret(): string {
  const secret = process.env.RESEND_API_KEY;
  if (!secret) {
    throw new Error("RESEND_API_KEY is required to sign unsubscribe tokens.");
  }
  return secret;
}

function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://dbjtechnologies.com"
  );
}

function normalize(email: string): string {
  return email.trim().toLowerCase();
}

export function generateUnsubscribeToken(email: string): string {
  return createHmac("sha256", getSecret())
    .update(normalize(email))
    .digest("hex")
    .slice(0, TOKEN_LENGTH);
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expected = generateUnsubscribeToken(email);
  if (expected.length !== token.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
  } catch {
    return false;
  }
}

export function generateUnsubscribeUrl(email: string): string {
  const token = generateUnsubscribeToken(email);
  const encoded = encodeURIComponent(normalize(email));
  return `${getSiteUrl()}/pathlight/unsubscribe?token=${token}&email=${encoded}`;
}

export async function isUnsubscribed(email: string): Promise<boolean> {
  const sql = getDb();
  const normalized = normalize(email);

  const leadRows = (await sql`
    SELECT unsubscribed_at FROM leads
    WHERE lower(email) = ${normalized} AND unsubscribed_at IS NOT NULL
    LIMIT 1
  `) as { unsubscribed_at: string | null }[];
  if (leadRows.length > 0) return true;

  const optOutRows = (await sql`
    SELECT email FROM email_unsubscribes
    WHERE email = ${normalized}
    LIMIT 1
  `) as { email: string }[];
  return optOutRows.length > 0;
}

export async function markUnsubscribed(email: string): Promise<void> {
  const sql = getDb();
  const normalized = normalize(email);

  await sql`
    UPDATE leads
    SET unsubscribed_at = now()
    WHERE lower(email) = ${normalized} AND unsubscribed_at IS NULL
  `;

  await sql`
    INSERT INTO email_unsubscribes (email)
    VALUES (${normalized})
    ON CONFLICT (email) DO NOTHING
  `;
}
