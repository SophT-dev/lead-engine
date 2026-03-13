# Lead Engine — Claude Operating Instructions

This project builds cold email lead lists using Claude + Prospeo.
Follow every step exactly. Never skip the approval gate before exporting.

---

## Browser Usage — ALWAYS USE `/chrome`

For ALL web interactions in this project — navigating Prospeo, scraping results, taking screenshots, visiting company websites — use the Claude Code Chrome extension (`/chrome`).

This means:
- The user can **watch you work** in their actual Chrome browser
- You are already logged into Prospeo and all other sites via their Chrome profile
- Never use WebFetch for Prospeo — use the browser

To activate: type `/chrome` at the start of any session where you'll be doing browser work.

---

## Two Input Types — Protocol

### Input A: Upwork Chat URL
1. User gives you: `https://www.upwork.com/messages/rooms/...`
2. Use `/chrome` to navigate to that URL
3. Read the full conversation — scroll up to get everything
4. Extract: client name, company, product/service, their target market, pain points, any mentions of ICP or audience
5. Proceed to Step 1 below

### Input B: Meeting Transcript
1. User pastes transcript directly into the conversation
2. Parse it: extract client name, company, product/service, stated target audience, pain points
3. Proceed to Step 1 below

---

## The Pipeline — Follow This Exactly

### STEP 1 — Research the Client

Run these searches (use WebSearch or /chrome to visit sites):

1. `"[company name]" customer case studies`
2. `"[company name]" ideal customer target market`
3. `"[company name]" competitors`
4. `"[company name]" reviews site:g2.com OR site:capterra.com`
5. Visit their homepage, /about, /customers, /case-studies pages
6. Visit top 2 competitor homepages

Build a research brief with: what they sell, who buys it, company sizes/industries of existing customers, competitor positioning.

### STEP 2 — Build the ICP

Read `prompts/icp-builder.md` for the exact prompt format.

Synthesize your research into a structured ICP JSON. Save it to:
`output/[client-name-YYYY-MM-DD]/icp.json`

Show the user a clean summary of the ICP before proceeding.

### STEP 3 — Navigate Prospeo and Set Filters Using Chrome

**This is the most important step. Do it visually in the browser.**

1. Use `/chrome` to open `https://app.prospeo.io/people-search`
2. Apply each filter from the ICP:
   - Job titles (from `icp.json` → `prospeo_filters.person_job_title`)
   - Seniority levels
   - Department
   - Industries
   - Company headcount ranges
   - Location (type location names and select from dropdown)
   - Keywords (if applicable)
3. After all filters are set, **copy the URL from the browser address bar**
4. Paste the URL here in the conversation
5. Also note the total lead count shown by Prospeo

Save the URL to: `output/[campaign]/prospeo-url.txt`

If the URL doesn't encode filters (Prospeo may use session state), note that and instead call the API directly using the filters from icp.json.

### STEP 4 — Get Leads via API

Run:
```
node scripts/prospeo.js --filters output/[campaign]/prospeo-filters.json --campaign [campaign-name]
```

First, write the filters file from `icp.json → prospeo_filters` to:
`output/[campaign]/prospeo-filters.json`

Get at least 2-3 pages (75 leads minimum) for verification.

### STEP 5 — Verify Top 25 Leads (Autonomous Loop)

Run:
```
node scripts/verify.js --leads output/[campaign]/prospeo-page1.json --icp output/[campaign]/icp.json --campaign [campaign-name]
```

This fetches company profiles. Then score them using the prompt in `prompts/lead-scorer.md`.

**Scoring rules:**
- Average score ≥ 7.0 → PASS → proceed to Step 6
- Average score < 7.0 → adjust filters → go back to Step 3 → repeat
- Maximum 3 iterations. If still failing after 3, present results with a "Manual Review Recommended" flag.

Save scores to: `output/[campaign]/scores.json`

### STEP 6 — Take Screenshot and Present to User

1. Use `/chrome` to navigate to the Prospeo search URL
2. Take a full-page screenshot of the results (first page visible)
3. Save to: `output/[campaign]/screenshot.png`

Present to the user:
- The Prospeo search URL (clickable)
- Verification report: avg score, top 5 leads with score breakdown, which filters are weakest
- The screenshot
- Summary: "X leads found, avg ICP match score Y/10"

**STOP HERE. Wait for explicit approval before exporting.**

### STEP 7 — Wait for Approval (MANDATORY GATE)

Ask: "Does this list look good? Any changes to the filters or ICP before I export?"

- If user requests changes → go back to Step 3 (adjust filters in Prospeo via /chrome, copy new URL)
- If user edits filters in Prospeo manually → ask them to paste the new URL, then re-run from Step 4
- If user says "approve" or "export" → proceed to Step 8

**NEVER export without explicit approval.**

### STEP 8 — Export (Only After Approval)

1. Assemble `scores.json` with all needed data
2. Run:
```
node scripts/export.js --campaign [campaign-name] --scores output/[campaign]/scores.json
```

Outputs:
- `output/[campaign]/leads-export.csv` → ready for Clay/Trykitt import
- `output/[campaign]/sales-snapshot.html` → send to client

Tell the user: "Export complete. Files are in `output/[campaign]/`. Open `sales-snapshot.html` in your browser and screenshot it to send to the client."

---

## Campaign Naming Convention

`[client-company-slug]-[YYYY-MM-DD]`

Examples: `acme-corp-2026-03-13`, `stripe-2026-03-14`

---

## File Layout Per Campaign

```
output/[campaign]/
├── icp.json                ← structured ICP
├── prospeo-filters.json    ← filters sent to Prospeo API
├── prospeo-url.txt         ← URL copied from Prospeo browser
├── prospeo-page1.json      ← raw leads page 1
├── prospeo-page2.json      ← raw leads page 2 (if needed)
├── company-profiles.json   ← fetched company website data
├── scores.json             ← lead scores + reasoning
├── screenshot.png          ← Prospeo results page screenshot
├── leads-export.csv        ← FINAL — only after approval
└── sales-snapshot.html     ← FINAL — only after approval
```

---

## API Keys (already in .env)

- `PROSPEO_API_KEY` — Prospeo search
- `ANTHROPIC_API_KEY` — Claude API (used if running in standalone/team mode)
- `SERPER_API_KEY` — optional, only needed if WebSearch isn't available

---

## Error Handling

| Problem | Solution |
|---|---|
| Prospeo URL doesn't encode filters | Use API directly with filters from icp.json |
| Company website returns 403/timeout | Score conservatively from title+company name only |
| Verification loop fails 3 times | Present results with flag, explain weakest filter |
| `/chrome` not available | Notify user to run `claude --chrome` or install extension |
| Prospeo login required | Ask user to log in to Prospeo in Chrome, then retry |
