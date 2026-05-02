/* Gmail REST API client for Phase 4 ingest. Wraps the handful of
 * endpoints we actually use; intentionally narrow scope. The OAuth
 * token comes from getValidAccessToken in google-oauth.ts (which
 * auto-refreshes); this module is the side that talks to Gmail. */

const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";
const GMAIL_INITIAL_BACKFILL_DAYS = 7;
const GMAIL_LIST_PAGE_SIZE = 50;

export class GmailApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly detail?: string
  ) {
    super(message);
    this.name = "GmailApiError";
  }
}

interface GmailMessageListEntry {
  id: string;
  threadId: string;
}

interface GmailMessageListResponse {
  messages?: GmailMessageListEntry[];
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

export interface GmailHeader {
  name: string;
  value: string;
}

interface GmailMessagePart {
  partId?: string;
  mimeType?: string;
  filename?: string;
  headers?: GmailHeader[];
  body?: { size?: number; data?: string };
  parts?: GmailMessagePart[];
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  historyId?: string;
  internalDate?: string;
  payload?: GmailMessagePart;
}

interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

interface GmailHistoryRecord {
  id: string;
  messages?: Array<{ id: string; threadId: string }>;
  messagesAdded?: Array<{
    message: { id: string; threadId: string; labelIds?: string[] };
  }>;
}

interface GmailHistoryResponse {
  history?: GmailHistoryRecord[];
  nextPageToken?: string;
  historyId?: string;
}

async function gmailFetch(
  accessToken: string,
  path: string,
  params?: Record<string, string | number | undefined>
): Promise<Response> {
  const url = new URL(`${GMAIL_API_BASE}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined) continue;
      url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { authorization: `Bearer ${accessToken}` },
  });
  return res;
}

async function gmailGet<T>(
  accessToken: string,
  path: string,
  params?: Record<string, string | number | undefined>
): Promise<T> {
  const res = await gmailFetch(accessToken, path, params);
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new GmailApiError(
      `Gmail API ${path} failed (${res.status})`,
      res.status,
      detail.slice(0, 200)
    );
  }
  return (await res.json()) as T;
}

export async function getProfile(accessToken: string): Promise<GmailProfile> {
  return gmailGet<GmailProfile>(accessToken, "/profile");
}

export async function listRecentMessageIds(
  accessToken: string
): Promise<string[]> {
  const ids: string[] = [];
  let pageToken: string | undefined;
  const query = `newer_than:${GMAIL_INITIAL_BACKFILL_DAYS}d`;
  do {
    const resp = await gmailGet<GmailMessageListResponse>(
      accessToken,
      "/messages",
      {
        q: query,
        maxResults: GMAIL_LIST_PAGE_SIZE,
        pageToken,
      }
    );
    for (const m of resp.messages ?? []) {
      ids.push(m.id);
    }
    pageToken = resp.nextPageToken;
    /* Cap the initial backfill at 200 messages; anything older is
     * better seeded by a manual import than by burning cron budget. */
    if (ids.length >= 200) break;
  } while (pageToken);
  return ids;
}

export async function listMessageIdsSinceHistory(
  accessToken: string,
  startHistoryId: string
): Promise<{ ids: string[]; latestHistoryId: string | null }> {
  const ids = new Set<string>();
  let pageToken: string | undefined;
  let latestHistoryId: string | null = null;

  do {
    const resp = await gmailGet<GmailHistoryResponse>(
      accessToken,
      "/history",
      {
        startHistoryId,
        historyTypes: "messageAdded",
        pageToken,
      }
    );

    for (const record of resp.history ?? []) {
      for (const added of record.messagesAdded ?? []) {
        if (added.message?.id) ids.add(added.message.id);
      }
      for (const msg of record.messages ?? []) {
        if (msg.id) ids.add(msg.id);
      }
      if (record.id) latestHistoryId = record.id;
    }
    if (resp.historyId) latestHistoryId = resp.historyId;
    pageToken = resp.nextPageToken;
    if (ids.size >= 500) break;
  } while (pageToken);

  return { ids: Array.from(ids), latestHistoryId };
}

export async function getMessage(
  accessToken: string,
  messageId: string
): Promise<GmailMessage> {
  return gmailGet<GmailMessage>(accessToken, `/messages/${messageId}`, {
    format: "full",
  });
}

export function findHeader(
  headers: GmailHeader[] | undefined,
  name: string
): string | null {
  if (!headers) return null;
  const lower = name.toLowerCase();
  for (const h of headers) {
    if (h.name.toLowerCase() === lower) return h.value;
  }
  return null;
}

export interface ParsedAddress {
  name: string | null;
  email: string;
}

export function parseAddressList(raw: string | null): ParsedAddress[] {
  if (!raw) return [];
  const out: ParsedAddress[] = [];
  /* Gmail Address headers can be commas inside quoted display names so
   * we tokenize by recognized delimiters that appear OUTSIDE quotes /
   * brackets. The pattern below handles the common shapes:
   *   "Name, Inc." <a@b.com>, plain@b.com, Other Name <c@d.com>
   * Anything more pathological we accept best-effort. */
  let depth = 0;
  let buf = "";
  let inQuotes = false;
  for (const ch of raw) {
    if (ch === '"' && depth === 0) {
      inQuotes = !inQuotes;
      buf += ch;
      continue;
    }
    if (!inQuotes) {
      if (ch === "<") depth++;
      else if (ch === ">") depth--;
      if (ch === "," && depth === 0) {
        const parsed = parseSingleAddress(buf);
        if (parsed) out.push(parsed);
        buf = "";
        continue;
      }
    }
    buf += ch;
  }
  if (buf.trim().length > 0) {
    const parsed = parseSingleAddress(buf);
    if (parsed) out.push(parsed);
  }
  return out;
}

function parseSingleAddress(raw: string): ParsedAddress | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const angleMatch = trimmed.match(/^(.*?)<\s*([^>\s]+)\s*>$/);
  if (angleMatch) {
    const name = angleMatch[1]!.replace(/^"|"$/g, "").trim() || null;
    const email = angleMatch[2]!.trim().toLowerCase();
    if (!email.includes("@")) return null;
    return { name, email };
  }
  const bare = trimmed.replace(/^"|"$/g, "").trim().toLowerCase();
  if (!bare.includes("@")) return null;
  return { name: null, email: bare };
}

export interface ParsedBody {
  text: string | null;
  html: string | null;
}

export function extractBody(payload: GmailMessagePart | undefined): ParsedBody {
  if (!payload) return { text: null, html: null };
  let text: string | null = null;
  let html: string | null = null;

  const visit = (part: GmailMessagePart): void => {
    const mime = part.mimeType ?? "";
    if (part.body?.data) {
      const decoded = decodeBase64Url(part.body.data);
      if (mime === "text/plain" && !text) text = decoded;
      else if (mime === "text/html" && !html) html = decoded;
    }
    for (const child of part.parts ?? []) {
      visit(child);
    }
  };
  visit(payload);
  return { text, html };
}

function decodeBase64Url(data: string): string {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return Buffer.from(normalized, "base64").toString("utf8");
  } catch {
    return "";
  }
}

export interface SendMessageInput {
  accessToken: string;
  fromAddress: string;
  to: string[];
  cc?: string[];
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  inReplyTo?: string;
  references?: string;
  threadId?: string;
}

export interface SendMessageResult {
  messageId: string;
  threadId: string;
  rawMessageId: string;
}

export async function sendMessage(input: SendMessageInput): Promise<SendMessageResult> {
  const boundary = `canopy-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const headerLines: string[] = [
    `From: ${input.fromAddress}`,
    `To: ${input.to.join(", ")}`,
  ];
  if (input.cc && input.cc.length > 0) {
    headerLines.push(`Cc: ${input.cc.join(", ")}`);
  }
  headerLines.push(`Subject: ${encodeMimeHeader(input.subject)}`);
  if (input.inReplyTo) headerLines.push(`In-Reply-To: ${input.inReplyTo}`);
  if (input.references) headerLines.push(`References: ${input.references}`);
  headerLines.push("MIME-Version: 1.0");

  const messageIdHost = input.fromAddress.split("@")[1] ?? "canopy.local";
  const rawMessageId = `<canopy-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}@${messageIdHost}>`;
  headerLines.push(`Message-ID: ${rawMessageId}`);

  let body: string;
  if (input.bodyHtml) {
    headerLines.push(
      `Content-Type: multipart/alternative; boundary="${boundary}"`
    );
    body = [
      "",
      `--${boundary}`,
      'Content-Type: text/plain; charset="utf-8"',
      "Content-Transfer-Encoding: 7bit",
      "",
      input.bodyText,
      "",
      `--${boundary}`,
      'Content-Type: text/html; charset="utf-8"',
      "Content-Transfer-Encoding: 7bit",
      "",
      input.bodyHtml,
      "",
      `--${boundary}--`,
      "",
    ].join("\r\n");
  } else {
    headerLines.push('Content-Type: text/plain; charset="utf-8"');
    headerLines.push("Content-Transfer-Encoding: 7bit");
    body = `\r\n${input.bodyText}\r\n`;
  }

  const raw = [...headerLines, body].join("\r\n");
  const encoded = Buffer.from(raw, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_");

  const url = new URL(`${GMAIL_API_BASE}/messages/send`);
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      authorization: `Bearer ${input.accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      raw: encoded,
      ...(input.threadId ? { threadId: input.threadId } : {}),
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new GmailApiError(
      `Gmail send failed (${res.status})`,
      res.status,
      detail.slice(0, 200)
    );
  }
  const json = (await res.json()) as { id: string; threadId: string };
  return { messageId: json.id, threadId: json.threadId, rawMessageId };
}

function encodeMimeHeader(s: string): string {
  /* If the subject is pure ASCII, return as-is. Otherwise wrap in
   * RFC 2047 encoded-word UTF-8 base64. */
  const isAscii = /^[\x20-\x7e]*$/.test(s);
  if (isAscii) return s;
  const b64 = Buffer.from(s, "utf8").toString("base64");
  return `=?UTF-8?B?${b64}?=`;
}
