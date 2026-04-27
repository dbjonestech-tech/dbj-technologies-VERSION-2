# Backlog

## Priority 1: Revenue-Generating Actions (Not Code)

- [ ] Follow up with Tyler on client referrals (he was texted, awaiting response)
- [ ] Ask Tyler for a one-sentence testimonial for the homepage/about page
- [ ] Build inbound lead response process: response template (acknowledge within 2 hours, 2-3 qualifying questions), discovery call structure (15-20 min), rough proposal format
- [ ] Set up Google Voice for Workspace ($10/month, dedicated business line, add to email signature)
- [ ] Run the Gemini Deep Research prompt for DFW competitive landscape, keyword research, and 90-day content plan
- [ ] Set up Google Business Profile (no physical storefront -- service area business setup)

## Priority 2: Site Polish (Quick Wins)

- [ ] Verify About page word spacing and headline fix deployed correctly
- [ ] Verify homepage white flash is resolved (hard refresh test)
- [ ] Add Tyler's testimonial to homepage or about page once received
- [ ] Verify all ~24 pages look correct (full visual audit -- Chrome MCP couldn't complete this due to scroll-triggered animations)

## Context Pack Maintenance (recurring)

- [ ] Watch for the `dbjcontext` "session-handoff.md > 30 KB" warning. When it fires, archive older session entries to docs/ai/history/.
- [ ] When the script flags new em dashes, replace with hyphens or restructure. Internal docs feed the chat that writes copy, so drift here propagates.
- [ ] When new long-lived docs are added under docs/ai/ or .claude/rules/, add them to the FILES array in scripts/dbj-context.sh.

## Priority 3: Pathlight Hardening

- [ ] Investigate intermittent "Some analysis steps could not be completed" banner (root cause traced April 27 to `s6` finalize: triggered when ANY of vision/remediation/revenue/score steps fail while audit + screenshots succeed; retry logic handles most cases, root cause for remaining occurrences still unknown)
- [ ] Pathlight admin dashboard for viewing captured lead data (scan data already persists to Postgres, just no UI to view it)
- [ ] Revenue confidence bands on reports (show range instead of single precise number)
- [ ] Input validation gate v2: extend lib/services/url.ts to also reject social media URLs (facebook/instagram/twitter/linkedin/youtube/tiktok), Google Docs/Sheets/Drive links, file:// and data:// schemes, and known parked-domain patterns (godaddysites.com, wixsite.com holding pages). Today the gate only blocks private IPs, embedded credentials, and sensitive query params.
- [x] Rate limiting per email/IP -- DONE (emailLimiter 3/24h + ipLimiter 5/24h enforced in app/(grade)/api/scan/route.ts:71-85; verified April 27)
- [ ] Pathlight landing page: add sample report screenshots (textual rewrite shipped April 25; remaining gap is visual proof of the report itself)
- [ ] Resend bounce/complaint webhook (gap identified April 27 -- bounced emails currently invisible; full feasibility in docs/ai/pathlight-feature-feasibility.md feature 11)
- [ ] Cost monitoring instrumentation: track Anthropic tokens, Browserless minutes, PSI calls per scan in a new api_usage_events table (feasibility doc feature 12)
- [ ] Pipeline 420s ceiling worst-case analysis: typical scan ~335s under ceiling, but worst-case (every Anthropic call hitting full retry chain) sums to ~1100s+. Steps would not run if cumulative time exceeds 420s. Consider raising ceiling to 600-720s OR moving the 4 Claude calls behind a deferred post-finalize event so report delivery is never blocked.

## Priority 4: Content and SEO

- [ ] Blog infrastructure (no blog exists yet)
- [ ] Email capture / lead magnets
- [ ] SEO content strategy (after Gemini Deep Research results come back)
- [ ] Content targeting underserved DFW industries

## Priority 5: Pathlight V1.5 Features (After Funnel Proves Itself)

- [ ] SERP rank tracking
- [ ] GBP audit integration
- [ ] Keyword volume analysis
- [ ] Competitor comparison scans
- [ ] Historical score tracking (recurring scans)
- [ ] White-label reports

## Completed (Remove from Lists)

- [x] Star Auto DNS migration to Cloudflare -- DONE
- [x] Pricing inconsistencies ($2,500 vs $4,500, $299 vs $499) -- FIXED, live site shows correct numbers
- [x] ParticleField RAF optimization -- DROPPED (not worth the effort, no business impact)
- [x] Logo rebuild -- PAUSED (current logo works fine)
- [x] Contact form gmail -> Resend migration -- DONE
- [x] Social links (LinkedIn + GitHub) in footer -- DONE
- [x] dbjonestech@gmail.com -> joshua@dbjtechnologies.com everywhere -- DONE
- [x] "Findability" -> "Search Visibility" rename -- DONE (type system, DB alias in coercePillarScores, and public case study copy in lib/work-data.ts)
- [x] Curated vertical database integration -- DONE (206 entries, 51 high/medium skip API)
- [x] All five pipeline hardening phases -- DONE
- [x] Retry logic (Anthropic + PSI) -- DONE
- [x] Mobile screenshot emulation -- DONE
- [x] Lighthouse scores on report + chat -- DONE
- [x] Work page with real case studies -- DONE
- [x] About page redesign -- SHIPPED (bugs being fixed)
- [x] Pathlight landing page cleanup (cards removed, tagline, logo) -- DONE
- [x] Soil Depot case study -- DONE
