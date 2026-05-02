import {
  isGoogleOAuthConfigured,
} from "@/lib/integrations/google-oauth";
import { isTokenEncryptionConfigured } from "@/lib/canopy/email/encryption";
import { listConnectedAccounts } from "@/lib/canopy/email/oauth-tokens";

/* Phase 4: Connected Accounts panel for /admin/canopy.
 *
 * Shows every admin user's Gmail connection status (or a config nag
 * when OAUTH_TOKEN_ENCRYPTION_KEY / GOOGLE_OAUTH_CLIENT_ID / SECRET
 * are missing). Connect routes through the GET /start endpoint;
 * disconnect routes through the POST /disconnect endpoint via a plain
 * form so the panel stays a server component. */

const SCOPE_LABELS: Record<string, string> = {
  "https://www.googleapis.com/auth/gmail.send": "Send",
  "https://www.googleapis.com/auth/gmail.readonly": "Read",
  "https://www.googleapis.com/auth/gmail.modify": "Modify",
};

function formatTimestamp(d: Date | null): string {
  if (!d) return "never";
  return d.toLocaleString();
}

export default async function ConnectedAccountsPanel({
  currentUserEmail,
}: {
  currentUserEmail: string;
}) {
  const oauthConfigured = isGoogleOAuthConfigured();
  const cryptoConfigured = isTokenEncryptionConfigured();
  const accounts = oauthConfigured && cryptoConfigured
    ? await listConnectedAccounts().catch(() => [])
    : [];

  const myAccount = accounts.find((a) => a.userEmail === currentUserEmail);

  return (
    <section className="mt-8 rounded-xl border border-zinc-200 bg-white p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-display text-base font-semibold text-zinc-900">
          Connected accounts
        </h2>
        <span className="text-xs text-zinc-500">
          Gmail two-way sync for compose, reply tracking, and timeline ingestion
        </span>
      </div>

      {!oauthConfigured && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Set <code className="font-mono text-xs">GOOGLE_OAUTH_CLIENT_ID</code>{" "}
          and{" "}
          <code className="font-mono text-xs">GOOGLE_OAUTH_CLIENT_SECRET</code>{" "}
          in Vercel env vars to enable Gmail.
        </p>
      )}

      {oauthConfigured && !cryptoConfigured && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Generate an encryption key and set{" "}
          <code className="font-mono text-xs">OAUTH_TOKEN_ENCRYPTION_KEY</code>{" "}
          in Vercel env vars. Use{" "}
          <code className="font-mono text-xs">openssl rand -hex 32</code>.
        </p>
      )}

      {oauthConfigured && cryptoConfigured && (
        <>
          <div className="mb-5 rounded-md border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-sm font-medium text-zinc-900">Your account</p>
            <p className="mt-1 text-xs text-zinc-600">
              Signed in as{" "}
              <span className="font-mono">{currentUserEmail}</span>
            </p>

            {myAccount ? (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Connected
                </span>
                <span className="text-xs text-zinc-700">
                  {myAccount.connectedEmail}
                </span>
                <span className="text-xs text-zinc-500">
                  Refreshed {formatTimestamp(myAccount.lastRefreshedAt)}
                </span>
                <form
                  action="/api/integrations/google/disconnect"
                  method="post"
                  className="ml-auto"
                >
                  <button
                    type="submit"
                    className="rounded-md border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50"
                  >
                    Disconnect
                  </button>
                </form>
              </div>
            ) : (
              <div className="mt-3">
                <a
                  href="/api/integrations/google/start"
                  className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
                >
                  Connect Gmail
                </a>
                <p className="mt-2 text-xs text-zinc-500">
                  Opens Google's consent screen. Required scopes: send, read,
                  modify.
                </p>
              </div>
            )}
          </div>

          {accounts.length > 1 && (
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-zinc-500">
                All connected accounts
              </p>
              <ul className="divide-y divide-zinc-100">
                {accounts.map((a) => (
                  <li
                    key={`${a.userEmail}-${a.provider}`}
                    className="flex items-center gap-3 py-2 text-sm"
                  >
                    <span className="font-mono text-xs text-zinc-700">
                      {a.userEmail}
                    </span>
                    <span className="text-xs text-zinc-500">
                      → {a.connectedEmail}
                    </span>
                    <span className="ml-auto flex flex-wrap gap-1">
                      {a.scopes
                        .map((s) => SCOPE_LABELS[s])
                        .filter(Boolean)
                        .map((label) => (
                          <span
                            key={label}
                            className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-700"
                          >
                            {label}
                          </span>
                        ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
