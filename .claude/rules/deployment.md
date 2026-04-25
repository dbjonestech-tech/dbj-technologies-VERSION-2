# Deployment Rules

## Git and Vercel
- All code pushes go to `origin main`. NOT new-origin, not any other remote.
- Vercel auto-deploys from pushes to main. Build takes 1-3 minutes.
- Commits use descriptive messages. Examples: "feat: integrate curated vertical database", "fix: word spacing collapse in ScrollWordBatch"
- After pushing, verify the deploy in the Vercel dashboard or wait 1-3 minutes for propagation before checking the live site.

## Pre-Commit Checklist
1. npx tsc --noEmit -- zero errors
2. npm run lint -- clean
3. git diff --stat HEAD -- review changed files
4. Verify no em dashes in changed files: grep -c $'\xe2\x80\x94' [changed files]
5. Verify no dbjonestech@gmail.com in production code: grep -rn "dbjonestech@gmail.com" --include="*.ts" --include="*.tsx" --include="*.md" | grep -vi "node_modules\|\.next\|\.env\.example\|\.claude"

## Environment Variables
- Production env vars live in Vercel dashboard, NOT in .env.local (which is local dev only).
- Key vars: RESEND_API_KEY, CONTACT_EMAIL, CONTACT_FROM_EMAIL, DATABASE_URL, ANTHROPIC_API_KEY, BROWSERLESS_TOKEN, INNGEST_EVENT_KEY, INNGEST_SIGNING_KEY, CLOUDFLARE_TURNSTILE_SECRET_KEY, NEXT_PUBLIC_TURNSTILE_SITE_KEY
- .env.local only has Postgres and Vercel OIDC locally. A local next build may fail on missing env vars that only exist in Vercel.
- Do NOT modify .env.example or .claude/settings.local.json in implementation prompts.

## Vercel Specifics
- Serverless function timeout: check plan tier. Inngest handles long-running work via step functions.
- Each Inngest step has its own timeout constraint. A single Claude call that takes 90s could hit the wall.
- CALL_TIMEOUT_MS is set to 90000 (90 seconds) for individual Claude API calls.
- The Inngest pipeline's total finish timeout is 420 seconds.

## DNS
- dbjtechnologies.com: Cloudflare DNS. Do not change records without understanding the full chain.
- thestarautoservice.com: Cloudflare DNS with CNAME to Vercel. DNS migration COMPLETE. Do not list as pending.
- joshua@dbjtechnologies.com: Google Workspace MX records in Cloudflare. SPF, DKIM, DMARC all authenticated.

## Danger Zones
- Never push directly to main without running tsc and lint first.
- Never change Resend from-domain without verifying domain authentication in Resend dashboard.
- Never modify email DNS records (MX, SPF, DKIM, DMARC) without understanding the authentication chain.
- Never run npx next build locally as a verification step -- it may fail on missing env vars. Use tsc + lint for code verification. Vercel handles the real build.
