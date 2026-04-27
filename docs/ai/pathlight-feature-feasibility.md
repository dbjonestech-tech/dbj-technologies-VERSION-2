# Pathlight Feature Feasibility Analysis

Last updated: April 27, 2026.

Stack assumptions: Next.js 16 App Router on Vercel (serverless functions, Fluid
Compute), Inngest orchestration, Neon Postgres, Browserless v2, Anthropic
(Claude Sonnet 4.6 + Haiku 4.5), Resend, Upstash Redis, Cloudflare Turnstile.
All cost figures are per-month at 100 scans/month unless otherwise noted, and
they include only NEW marginal cost on top of today's pipeline.

## Summary Ranking

| #  | Feature                                | Impact (1-5) | Effort (days) | Monthly cost @100 | Priority order | Key dependency                     |
|----|----------------------------------------|--------------|---------------|--------------------|----------------|-------------------------------------|
| 8  | QR Code Scan Trigger                   | 2            | 0.25          | $0                 | 1              | None                                |
| 11 | Resend Bounce/Complaint Webhook        | 4            | 0.5           | $0                 | 2              | Resend account                      |
| 12 | Cost Monitoring Dashboard              | 3            | 1.5           | $0                 | 3              | Existing Postgres logging           |
| 10 | PDF Report Download                    | 4            | 1             | ~$1                | 4              | Browserless or @sparticuz/chromium  |
| 5  | Voice Report Delivery                  | 3            | 2             | ~$2                | 5              | Provider API key                    |
| 1  | Before/After Projection Rendering      | 5            | 4-6           | ~$5                | 6              | Phase 11 + Phase 12 first           |
| 6  | Monthly Automated Re-scan + Trends     | 4            | 3-4           | ~$30 at 500 sites  | 7              | Inngest cron + history table        |
| 7  | Industry Percentile Ranking            | 3            | 2             | $0                 | 8              | 30+ scans per vertical              |
| 3  | Google Business Profile Audit          | 4            | 3-5           | ~$5-15             | 9              | Google Places API key + GBP scope   |
| 9  | SERP Rank Tracking                     | 3            | 2-3           | ~$10-50            | 10             | SerpAPI / ValueSERP key             |
| 2  | Competitor Side-by-Side                | 5            | 5-8           | ~$30-50            | 11             | Phase 9 (or Google Places)          |
| 4  | Live Conversion Leak Detection         | 5            | 8-12          | ~$25-100           | 12             | PostHog (self-host) or Hotjar       |

Top conviction picks for the next 30 days: **#11 (bounce webhook)**, **#12
(cost dashboard)**, **#8 (QR codes)**, then **#10 (PDF)**. They are cheap,
ship fast, and remove operational blind spots before the bigger swings.

---

## Feature 1: Before/After Projection Rendering

Show the prospect a mockup of what their site COULD look like with the top
fixes applied. Two viable shapes:

A. **Annotated screenshot overlay** (low risk, highest fidelity)
- Take the existing desktop screenshot and overlay callout pins tied to each
  remediation item (number, short label, line drawn to the affected area).
- Generation: Claude vision pass that, given the screenshot + the 3
  remediation items, returns `{ x, y, label, fixIndex }` JSON for each pin.
- Render: client-side SVG overlay on top of the existing screenshot.

B. **AI-generated HTML prototype** (high risk, high reward)
- Have Claude emit a single-file HTML/CSS rebuild of the hero section using
  the remediation items as the change spec.
- Render: a sandboxed iframe pointed at a `srcdoc` blob, side-by-side with
  the original screenshot.
- Risk: outputs are visually inconsistent across scans, can hallucinate
  copy that misrepresents the business, and add 10-30s to scan time. Not
  recommended for v1.

Recommended v1: option A.

- Effort: 4-6 days for production-ready (vision call, server-side
  transformation, client overlay component, print stylesheet, fallback when
  the model fails to ground a pin).
- Cost per scan: ~1-2k input tokens + ~1k output tokens against Sonnet ≈
  $0.012/scan. ~$1.20/mo at 100 scans.
- New Claude call: yes (1 additional vision pass per scan).
- New third-party key: no.
- Complexity: 4/5. Vision-grounded pin coordinates are notoriously brittle
  (pixel coordinates drift with viewport, Retina scaling, lazy-loaded
  images). Mitigate with bbox-as-percentage rather than absolute pixels and
  a server-side sanity check that pins fall inside the screenshot.
- Stack risk: vision call would push us closer to the 420s pipeline ceiling.
  Move it to a deferred step that runs AFTER `markScanComplete` so the
  report is delivered first and the overlay populates lazily.

## Feature 2: Competitor Side-by-Side

Auto-identify 2-3 local competitors (same vertical + city) and run abbreviated
scans alongside the main report.

- Effort: 5-8 days.
  - Discovery: Google Places "nearby search" with the inferred vertical as
    `keyword` and the scan city as the search radius center. Returns top
    rated competitors and their websites.
  - Abbreviated scan: PSI + screenshot only, no Claude vision, no revenue.
  - Storage: new `competitor_scans` table referencing the parent scan.
  - Display: a "How you compare" section under the score hero with three
    mini-cards (logo from clearbit, score, top 1 fix headline).
- Cost per scan, marginal: 3 Browserless desktop+mobile screenshots ($0.30) +
  3 PSI calls (free with key) + 3 Google Places lookups (~$0.05) ≈ $0.35. At
  100 scans/month, ~$35/mo. Without Claude vision on competitors that's the
  hard floor.
- New Claude call: optional. Recommended NOT to run vision on competitors;
  the value is the score gap, not the design audit.
- New third-party key: yes - Google Maps Platform / Places API key with
  Places Nearby + Place Details enabled.
- Complexity: 4/5. Vertical-to-Places-keyword mapping is the hard part
  ("commercial soil brokerage" returns nothing useful in Places; "auto repair"
  returns 30+ matches). Need a curated mapping per parent vertical.
- Privacy/legal: scanning competitor sites with our PathlightBot UA from
  Browserless is identical to what Lighthouse does. Low risk if we cap
  competitor scans per parent scan and keep it best-effort (no email to the
  competitor, no public exposure of the result).
- Async ordering: kick off competitor scans AFTER the main scan delivers, in
  a second Inngest function chained via event. Don't extend the perceived
  scan time.

## Feature 3: Google Business Profile Audit

Pull GBP data: review count, average rating, photo count, last photo date,
response rate, hours, NAP, primary category.

- Effort: 3-5 days.
- API options:
  - **Google Places API (Place Details)**: free for up to ~$200/mo of usage
    on Google Maps Platform free tier. Returns rating, user_ratings_total,
    types, opening_hours, photos (URLs only), reviews (5 most recent),
    formatted_address, formatted_phone, website. Does NOT return last photo
    date, response rate, or post cadence.
  - **BrightLocal API**: $39+/mo, includes review velocity, response rate,
    GBP categories, post insights. Real GBP audit data but adds a vendor.
- Recommended v1: Google Places only. Cover the basics (rating, review count,
  category match, hours, NAP consistency vs the website's JSON-LD). Defer
  response rate / photo cadence to v2.
- Cost per scan: 1 Place Search ($0.017) + 1 Place Details ($0.017) ≈ $0.04.
  ~$4/mo at 100 scans, well within Google's $200/mo Maps free credit (so
  effectively $0 at this scale).
- New Claude call: no (could add a small Haiku pass to compare GBP NAP vs
  website schema and surface inconsistencies, but a string comparator works
  well enough for v1).
- New third-party key: yes - GOOGLE_MAPS_API_KEY with Places API enabled.
- Complexity: 3/5. Matching the scanned URL to the right GBP listing is the
  hard part. Strategy: query Place Search by `${businessName} ${city}` from
  the existing scan inputs, then verify the returned `website` field
  matches the scanned URL's domain. If no match, return null and surface
  "GBP not found" rather than guessing.
- New pillar idea: "Local Presence" pillar with weight redistributed from
  Search Visibility (15% → 8%), with new Local Presence at 7%. Defer the
  pillar reshape to v2; v1 should surface the GBP card without changing
  the score formula.
- Handles missing GBP gracefully: render "We couldn't find a Google Business
  Profile for this site" with a one-line nudge to claim one.

## Feature 4: Live Conversion Leak Detection

48-hour behavioral analytics snippet tracking real visitor behavior on the
prospect's site.

- Effort: 8-12 days. This is the largest swing in the list.
- Build vs buy:
  - **PostHog self-host**: $0 license, ~$5-25/mo Vercel-adjacent infra,
    full ownership. PostHog's heatmaps, session replays, and funnel views
    are best-in-class. But 7-10 days of devops to get session replay
    durably storing video chunks somewhere durable (Vercel Blob or S3).
  - **Hotjar API**: ~$32-80/mo, no devops, but their API is read-only and
    the scripts they ship are heavy (~150KB). Would slow the prospect's
    site that we're trying to measure.
  - **Custom lightweight script**: 30-line vanilla JS shipping clicks,
    scroll depth, exit position to a Pathlight endpoint. ~3-5 days but
    misses session replay, which is half the value.
- Recommended: PostHog self-host if we go after this at all. Otherwise
  defer.
- Cost per site monitored: PostHog ingestion is event-based; 48h × 100
  visitors × 20 events/visitor = 4000 events/site/2-day window. At 100
  sites/month that's 400k events/mo. PostHog cloud free tier is 1M
  events/mo.
- Privacy/consent: GDPR and CCPA both require visitor consent for session
  replay. Need a banner. Even with consent, replay raises legal exposure.
  Prospects' visitors do not opt in to OUR analytics.
- Recommended scope reduction: skip session replay. Track only aggregate
  scroll depth, time-to-bounce, and CTA-click rate. No PII, no replay,
  one event per visitor per minute. Reduces effort to ~5 days and removes
  most of the legal surface area.
- Storage: ~50KB/site/day in Postgres. Negligible.
- Followup integration: at the 48h mark, replace the standard "top
  finding" email with a data-grounded one ("63% of your mobile visitors
  bounced before reaching your service list").
- Stack risk: 4/5. The vector for this feature is convincing the prospect
  to install a snippet on their LIVE production site. Most won't.
- Smallest viable version: a hosted heatmap PNG generated from 48h of
  click data, embedded in followup #2. No live dashboard, no replay.
  ~3-4 days, costs ~$0 at this volume.

## Feature 5: Voice Report Delivery

60-90 second audio summary of the report via TTS.

- Effort: 2 days.
- Provider comparison (per minute of audio output):
  - **ElevenLabs**: $0.18/min on creator tier ($22/mo includes 100k chars
    ≈ 100 minutes). Voice quality is best in class for narration.
  - **OpenAI TTS** (`tts-1` or `tts-1-hd`): $0.015 per 1k input chars ≈
    $0.001 per 60-second clip. Massively cheaper but less natural.
  - **Amazon Polly Neural**: $16 per 1M chars ≈ $0.0016 per 60-second
    clip. Comparable quality to OpenAI.
- Recommended: ElevenLabs voice (`Adam` or a custom Joshua-Jones-cloned
  voice). The conversion pitch of the audio summary is differentiation;
  if it sounds robotic it dilutes the brand more than not having it.
- Cost per scan: ~$0.18 with ElevenLabs. At 100 scans/mo: $18/mo. With
  OpenAI TTS: ~$0.10/mo total. Realistic budget: $5-20/mo.
- New Claude call: yes (1 small Haiku pass to script the audio from the
  report data: ~500 input + 200 output tokens = ~$0.0015/scan).
- New third-party key: yes - ELEVENLABS_API_KEY (or OPENAI_API_KEY).
- Hosting: write the MP3 to Vercel Blob, return a signed URL. ~50KB
  per file × 100 = 5MB/mo. Free tier easily covers it.
- Delivery shape: render an `<audio controls>` element above the score
  hero, AND include the same audio as a Resend email attachment in the
  report email. Both. Auto-play is rude; user-initiated only.
- Complexity: 2/5. The script-generation prompt is the only nontrivial
  piece. Templated string interpolation works well enough since the
  scan data is structured.

## Feature 6: Monthly Automated Re-scan with Trend Tracking

Free monthly re-scan of every previously scanned site, delivered as a delta
email.

- Effort: 3-4 days.
- Architecture:
  - Inngest cron: `cron: "0 9 1 * *"` (9am the 1st of each month).
  - Job: query `scans` for distinct (email, url) pairs scanned in the last
    90 days where unsubscribed_at IS NULL.
  - For each: fire a `pathlight/scan.requested` event with a `mode: "rescan"`
    flag. The pipeline runs as today, except revenue impact is suppressed
    (rescan emails compare scores only, not dollars).
- Cost at scale:
  - Per scan: ~$0.18 in API costs today (Browserless + Anthropic +
    PSI). At 500 cumulative sites that's $90/month of marginal rescan
    cost.
  - Reduction option: skip the vision audit on rescans. Reuse the prior
    classification + run only PSI + screenshots + a delta-only Haiku pass
    that flags new issues. Drops to ~$0.05/scan, $25/mo at 500 sites.
- New Claude call: no new ones; reuse pipeline. Optional: a small "what
  changed?" Haiku pass.
- New third-party key: no.
- Complexity: 3/5. Edge cases:
  - Site no longer reachable: send a "we couldn't reach your site"
    courtesy note, then drop from the rescan list after 2 consecutive
    failures.
  - URL changed (now redirects elsewhere): require user re-confirmation
    via a one-click link in the rescan email.
  - User unsubscribed: respect the existing unsubscribe table.
- DB schema: add `is_rescan BOOLEAN DEFAULT FALSE` and
  `parent_scan_id UUID REFERENCES scans(id)` to `scans`. Delta computation
  is a join on parent_scan_id.
- Followup timing: rescan emails should NOT trigger the existing 48h/5d/8d
  followup chain. Suppress via an explicit check in `shouldSuppressFollowup`.

## Feature 7: Industry Percentile Ranking

"You rank in the 23rd percentile among auto repair sites we've analyzed."

- Effort: 2 days.
- Architecture:
  - Aggregate query: per (inferredVertical, businessModel, businessScale),
    compute median + percentile distribution of pathlight_score across all
    completed scans in the last 12 months.
  - Cache: nightly cron that materializes percentile buckets to
    `vertical_percentile_cache` table. Avoids running an expensive
    `percent_rank() OVER (PARTITION BY ...)` on every report load.
- Minimum sample size: 30 scans per (vertical, businessModel) tuple to
  make percentiles stable. Below that threshold, render
  "Industry comparison available after we've analyzed more $vertical sites."
  This matches the spec's "at what threshold does this feature activate
  per vertical" question - 30 is the standard floor.
- Privacy: percentile rendering aggregates anonymous numbers. We never
  show another scanned business's name, score, or URL. Single low-quality
  scan can't be reverse-engineered out of the bucket.
- New Claude call: no.
- New third-party key: no.
- Complexity: 2/5. Most of the effort is the cache materialization SQL
  and writing the "your rank" component to render a number with confidence
  bounds when the bucket is small.
- Cost: $0 marginal.
- Display: a single line under the Pathlight Score: "Better than 67% of
  auto repair sites Pathlight has scored." With a tiny `?` tooltip that
  explains the sample and the timeframe.

## Feature 8: QR Code Scan Trigger

Unique QR codes that pre-fill the prospect's URL on the Pathlight scan
form.

- Effort: 0.25 days. This is a few hours.
- Architecture:
  - The existing scan form already accepts `?url=...`. Extending it to
    also pre-fill `email` (when known from outreach) is one query-param
    handler.
  - Generate QR via `qrcode` npm package (server-side, Node Buffer to
    PNG/SVG).
  - Distribution: a `/internal/qr?url=...&utm=biz_card` page that returns
    a downloadable SVG or PNG for any URL. Behind a simple auth (env-var
    pin, or just gate to Joshua's email via Cloudflare Access).
- UTM tracking: yes, append `utm_source=qr&utm_medium=offline&utm_campaign={slug}`
  by default. The contact form already reads UTM params for attribution.
- Static vs dynamic: static SVGs are fine. The QR encodes a URL with
  query params; no redirect indirection needed.
- Cost: $0 marginal.
- New Claude call: no.
- New third-party key: no.
- Complexity: 1/5.

## Feature 9: SERP Rank Tracking

Where the business ranks on Google for relevant local keywords.

- Effort: 2-3 days.
- Provider comparison:
  - **SerpAPI**: $50/mo for 5k searches. Most reliable, JSON-clean, includes
    local pack data and Maps results.
  - **ValueSERP**: $50/mo for 12.5k searches. Cheaper at scale, less
    polished, occasionally misses the local pack.
  - **BrightLocal SERP API**: bundled with their citations product;
    doesn't make sense unless we also use BrightLocal for GBP audit.
- Recommended: SerpAPI for v1.
- Keywords per scan: 5 keywords is the sweet spot. More than 8 starts to
  feel like noise. Strategy:
  - 3 vertical-specific from the curated DB (auto repair → "auto repair
    near me", "{city} auto repair", "{vertical-specific service}")
  - 2 brand-specific generated from businessName ("{businessName}",
    "{businessName} {city}")
- Cost per scan: 5 SerpAPI queries × $0.01 each = $0.05. At 100 scans/mo:
  $5/mo. Well within the $50 SerpAPI floor (which covers 100 scans × 5
  searches = 500 searches against the 5000-search bucket).
- New Claude call: optional - Haiku pass to recommend keyword variants to
  add to the curated DB based on the scanned site's actual content.
- New third-party key: yes - SERPAPI_API_KEY.
- Complexity: 3/5. The hard part is keyword recommendation per vertical.
  ValueSERP is fine; SerpAPI's local pack data is just better.
- Display: don't make it a new pillar in v1. Render it as a subsection
  inside Search Visibility: "Where you rank for 5 local searches." Each
  line: keyword, position (or "not in top 100"), volume estimate.
- Defer to v2: rank trends over time. v1 is a snapshot.

## Feature 10: PDF Report Download

Polished branded PDF for forwarding to partners or decision-makers.

- Effort: 1 day.
- Three approaches:
  - **Browser print-to-PDF (current)**: works today. The print stylesheet
    is well-engineered (`pathlight-report` wrapper, `print-expand`,
    `print-grid-expand`). Output is acceptable but not branded.
  - **Server-side Puppeteer via Browserless**: hit Browserless `/pdf`
    endpoint with the report URL + a print-only auth token. Returns a
    PDF buffer in 5-10s. Same provider we already use for screenshots.
    Adds ~$0.05/scan if generated proactively, $0 if generated on demand.
  - **`@sparticuz/chromium` on Vercel Functions**: bundle a Chromium
    binary into a function and run Puppeteer locally. Free, but bundle
    size is ~50MB and Vercel function size limits are tight.
- Recommended: Browserless `/pdf`, generated on demand when the user
  clicks "Download PDF". Don't pre-generate; not every scan needs one.
- Cost: ~$1/mo at 100 scans assuming 20% click the button.
- New Claude call: no.
- New third-party key: no (already have BROWSERLESS_API_KEY).
- Complexity: 2/5. The current print stylesheet is the foundation. Need a
  one-time auth shortcut so Browserless can render the report (which is
  currently public-by-UUID, so Browserless just hits the URL with no
  auth gymnastics).
- File size: with screenshots embedded, ~1.5-3MB. Acceptable for email
  attach but better as a download link.
- Hosting: stream from the function directly, or write to Vercel Blob and
  return a signed URL. Streaming is simpler for v1.

## Feature 11: Resend Bounce/Complaint Webhook Integration

Endpoint that receives bounce and complaint notifications from Resend.

- Effort: 0.5 days.
- Architecture:
  - New route handler at `/api/email/webhook` (under marketing or grade
    route group; the route group doesn't matter, just don't pollute
    /api/scan).
  - Verify the Svix signature in the Resend webhook header.
  - Handle `email.bounced` and `email.complained` events: insert into
    `email_events` with status=`bounced` or `complained`, and
    automatically mark the email as unsubscribed in
    `email_unsubscribes` for hard bounces.
- Webhook format: Resend uses [Svix](https://www.svix.com/) under the hood.
  Headers: `svix-id`, `svix-timestamp`, `svix-signature`. Verify via the
  `svix` npm package (already a peer dep of `resend` in some versions).
- Auto-suppression: hard bounce → permanent unsubscribe. Soft bounce →
  one retry, then unsubscribe after 3 consecutive soft bounces.
- Alert: when bounce rate over the trailing 7 days exceeds 5%, log a
  Sentry event with `level: "warning"`. We're below Resend's 5% bounce
  ceiling (which would suspend the domain).
- Storage: extend `email_events.status` enum to include `bounced` and
  `complained`. Migration 006.
- Cost: $0 marginal.
- New Claude call: no.
- New third-party key: no.
- Complexity: 2/5.

## Feature 12: Cost Monitoring & Alerting Dashboard

Track Anthropic API spend, Browserless minutes, email sends, and total cost
per scan.

- Effort: 1.5 days.
- Architecture:
  - We already log `email_events`. We do NOT log Anthropic usage or
    Browserless usage. New table `api_usage_events`:
    `(scan_id, provider, operation, input_tokens, output_tokens, cost_cents, occurred_at)`.
  - Instrument: wrap `callClaude`, `callWithRetry`, `captureScreenshot`,
    `runPerformanceAudit` to log token counts (Anthropic) or call counts
    (Browserless, PSI) on every request.
  - Admin page: simple Next.js server component at `/internal/cost`
    behind same env-var pin as the QR generator. Shows today/7d/30d
    spend, breakdown by provider, average cost per scan, alerts when
    daily spend exceeds threshold.
- Existing data: Anthropic returns input/output token counts in every
  message response. We just need to capture and persist them. Browserless
  doesn't return per-call cost; track minutes used as a proxy.
- Cost: $0 marginal.
- New Claude call: no.
- New third-party key: no.
- Complexity: 3/5. Wrapping the existing call sites with logging without
  breaking retry semantics is the hard part.
- Alert mechanism: daily Inngest cron at 9am Central, query the prior
  day's spend, fire a Slack/email alert if over threshold.

---

## Cross-Cutting Notes

- Several features (1, 5, 6, 12) want a "post-finalize" hook so they can
  run AFTER the report is delivered to the user, without extending the
  perceived scan time. The cleanest pattern is: when the `s6` finalize
  step marks a scan complete, send a separate `pathlight/scan.delivered`
  event that other functions subscribe to. Keep them out of the main
  pipeline and out of the 420s ceiling.
- Features 2, 3, 9 all want vertical-to-keyword mapping. If we build any
  one of them we should build the mapping table once (per parent
  vertical: Places search keyword, SERP keywords, GBP category match)
  and reuse it.
- Features 1, 6, 10 will all want stable per-section "anchor" IDs in the
  report DOM. Worth normalizing before any of them ship.
