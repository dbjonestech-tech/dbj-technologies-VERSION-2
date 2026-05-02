import {
  GmailApiError,
  extractBody,
  findHeader,
  getMessage,
  getProfile,
  listMessageIdsSinceHistory,
  listRecentMessageIds,
  parseAddressList,
  type GmailMessage,
  type ParsedAddress,
} from "@/lib/integrations/gmail-api";
import {
  getValidAccessToken,
} from "@/lib/integrations/google-oauth";
import {
  findContactIdByEmail,
  findMostRecentOpenDealForContact,
  insertEmailMessage,
  listConnectedAdminEmails,
} from "./messages";
import {
  getOAuthTokenForUser,
  updateIngestCheckpoint,
} from "./oauth-tokens";

/* Gmail ingest core called by the Inngest cron (every 5 min). For each
 * connected admin user, pulls newly-arrived messages since the last
 * checkpoint and writes matched ones to email_messages. Unmatched
 * messages (no contact for either side) are silently dropped - we are
 * NOT a general inbox tool, only a CRM activity capture surface.
 *
 * The DB UNIQUE on gmail_message_id prevents double-insert on retries
 * or overlap between the History API and a backfill list. */

export interface IngestRunResult {
  userEmail: string;
  scanned: number;
  inserted: number;
  errors: string[];
}

export async function ingestAllConnectedAccounts(): Promise<IngestRunResult[]> {
  const userEmails = await listConnectedAdminEmails();
  const results: IngestRunResult[] = [];
  for (const userEmail of userEmails) {
    try {
      const result = await ingestForUser(userEmail);
      results.push(result);
    } catch (err) {
      results.push({
        userEmail,
        scanned: 0,
        inserted: 0,
        errors: [err instanceof Error ? err.message : String(err)],
      });
    }
  }
  return results;
}

export async function ingestForUser(
  userEmail: string
): Promise<IngestRunResult> {
  const result: IngestRunResult = {
    userEmail,
    scanned: 0,
    inserted: 0,
    errors: [],
  };

  const tokenInfo = await getValidAccessToken(userEmail);
  if (!tokenInfo) {
    result.errors.push("no valid access token (refresh token missing or revoked)");
    return result;
  }
  const { accessToken, connectedEmail } = tokenInfo;
  const stored = await getOAuthTokenForUser(userEmail);
  if (!stored) {
    result.errors.push("token row vanished mid-ingest");
    return result;
  }

  let messageIds: string[] = [];
  let nextHistoryId: string | null = null;

  try {
    if (stored.lastIngestHistoryId) {
      const since = await listMessageIdsSinceHistory(
        accessToken,
        stored.lastIngestHistoryId
      );
      messageIds = since.ids;
      nextHistoryId = since.latestHistoryId;
      if (!nextHistoryId) {
        const profile = await getProfile(accessToken);
        nextHistoryId = profile.historyId;
      }
    } else {
      messageIds = await listRecentMessageIds(accessToken);
      const profile = await getProfile(accessToken);
      nextHistoryId = profile.historyId;
    }
  } catch (err) {
    if (err instanceof GmailApiError && err.status === 404) {
      /* History ID expired (Gmail keeps history for ~7 days). Reset to
       * a fresh recent-messages backfill. */
      messageIds = await listRecentMessageIds(accessToken);
      const profile = await getProfile(accessToken);
      nextHistoryId = profile.historyId;
    } else {
      throw err;
    }
  }

  result.scanned = messageIds.length;

  for (const messageId of messageIds) {
    try {
      const message = await getMessage(accessToken, messageId);
      const inserted = await ingestSingleMessage({
        message,
        userEmail,
        connectedEmail,
      });
      if (inserted) result.inserted += 1;
    } catch (err) {
      result.errors.push(
        `${messageId}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  if (nextHistoryId) {
    try {
      await updateIngestCheckpoint({
        userEmail,
        provider: "google",
        historyId: nextHistoryId,
      });
    } catch (err) {
      result.errors.push(
        `checkpoint update failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return result;
}

async function ingestSingleMessage(input: {
  message: GmailMessage;
  userEmail: string;
  connectedEmail: string;
}): Promise<boolean> {
  const { message, userEmail, connectedEmail } = input;
  const headers = message.payload?.headers;
  const fromHeader = findHeader(headers, "from");
  const toHeader = findHeader(headers, "to");
  const ccHeader = findHeader(headers, "cc");
  const subject = findHeader(headers, "subject");
  const dateHeader = findHeader(headers, "date");

  const fromAddrs = parseAddressList(fromHeader);
  const toAddrs = parseAddressList(toHeader);
  const ccAddrs = parseAddressList(ccHeader);
  const fromAddr = fromAddrs[0] ?? null;
  if (!fromAddr) return false;

  const connectedLower = connectedEmail.toLowerCase();
  const fromIsConnected = fromAddr.email === connectedLower;
  const direction: "in" | "out" = fromIsConnected ? "out" : "in";

  /* The "other party" is the contact we want to attach to. For
   * outbound, that's anyone in TO+CC who isn't the connected user.
   * For inbound, it's the From address. */
  const candidateContacts: ParsedAddress[] = fromIsConnected
    ? [...toAddrs, ...ccAddrs].filter((a) => a.email !== connectedLower)
    : [fromAddr];

  let contactId: number | null = null;
  for (const candidate of candidateContacts) {
    const found = await findContactIdByEmail(candidate.email);
    if (found) {
      contactId = found;
      break;
    }
  }
  if (!contactId) return false;

  const dealId = await findMostRecentOpenDealForContact(contactId);
  const body = extractBody(message.payload);

  const internalMs = message.internalDate
    ? Number(message.internalDate)
    : null;
  const internalDate =
    internalMs && Number.isFinite(internalMs) ? new Date(internalMs) : null;
  const headerDate = dateHeader ? safeParseDate(dateHeader) : null;
  const messageDate = internalDate ?? headerDate;

  const inserted = await insertEmailMessage({
    contactId,
    dealId,
    userEmail,
    direction,
    gmailMessageId: message.id,
    threadId: message.threadId,
    subject: subject ?? null,
    fromAddress: fromAddr.email,
    toAddresses: toAddrs.map((a) => a.email),
    ccAddresses: ccAddrs.map((a) => a.email),
    bodyHtml: body.html,
    bodyText: body.text,
    sentAt: direction === "out" ? messageDate : null,
    receivedAt: direction === "in" ? messageDate : null,
    templateId: null,
  });

  return inserted !== null;
}

function safeParseDate(raw: string): Date | null {
  const ts = Date.parse(raw);
  if (!Number.isFinite(ts)) return null;
  return new Date(ts);
}
