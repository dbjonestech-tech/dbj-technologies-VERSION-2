import { NextRequest } from "next/server";
import {
  markUnsubscribed,
  verifyUnsubscribeToken,
} from "@/lib/services/unsubscribe";

/* runtime/dynamic exports removed; redundant with the default Node.js
   runtime for route handlers in Next 16 and incompatible with the
   experimental.cacheComponents option enabled in next.config.mjs. */

function renderPage(options: {
  title: string;
  message: string;
  status: number;
}): Response {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${options.title} — Pathlight</title>
  <style>
    html, body { margin: 0; padding: 0; background: #0a0a1a; color: #e7ebf2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-height: 100%; }
    main { max-width: 520px; margin: 0 auto; padding: 80px 24px; text-align: center; }
    .eyebrow { font-size: 13px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #3b82f6; }
    h1 { font-size: 28px; line-height: 1.2; margin: 18px 0 16px; font-weight: 700; color: #f8fafc; }
    p { font-size: 16px; line-height: 26px; color: #cbd5f5; margin: 12px 0; }
    a { color: #3b82f6; text-decoration: none; font-weight: 600; }
    a:hover { text-decoration: underline; }
    .card { margin-top: 40px; padding: 24px; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); }
  </style>
</head>
<body>
  <main>
    <div class="eyebrow">Pathlight</div>
    <h1>${options.title}</h1>
    <p>${options.message}</p>
    <div class="card">
      <p>You can always visit <a href="https://dbjtechnologies.com/pathlight">dbjtechnologies.com/pathlight</a> to run a new scan.</p>
    </div>
  </main>
</body>
</html>`;

  return new Response(html, {
    status: options.status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const rawEmail = searchParams.get("email");

  if (!token || !rawEmail) {
    return renderPage({
      title: "Invalid unsubscribe link",
      message:
        "This unsubscribe link is missing required information. If you keep getting emails you don't want, just reply to any of them.",
      status: 400,
    });
  }

  const email = rawEmail.trim().toLowerCase();
  if (!verifyUnsubscribeToken(email, token)) {
    return renderPage({
      title: "Invalid unsubscribe link",
      message:
        "This unsubscribe link could not be verified. If you keep getting emails you don't want, just reply to any of them.",
      status: 400,
    });
  }

  try {
    await markUnsubscribed(email);
  } catch (err) {
    console.error("[unsubscribe] failed to mark email as unsubscribed", err);
    return renderPage({
      title: "Something went wrong",
      message:
        "We couldn't complete your unsubscribe right now. Please reply to any Pathlight email and we'll remove you manually.",
      status: 500,
    });
  }

  return renderPage({
    title: "You've been unsubscribed",
    message: "You won't receive any more Pathlight emails.",
    status: 200,
  });
}

export async function POST(req: NextRequest): Promise<Response> {
  return GET(req);
}
