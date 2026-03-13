You are starting the Lead Engine pipeline. Follow the full protocol in CLAUDE.md exactly.

## Start immediately — no Chrome check needed at the beginning

Say exactly: "Ready. Paste your Upwork chat URL or meeting transcript."

Wait for their input, then run the pipeline:

**Steps 1–2 (Chrome for Upwork, WebSearch + WebFetch for research):**
- If input is an Upwork URL: use Chrome to open the chat room, scroll up to load all messages, read the full conversation
- If input is a transcript: parse it directly
- Research the client's company, competitors, case studies via WebSearch + WebFetch
- Build the ICP, save to output/[campaign]/icp.json
- Show the user the ICP summary

**Step 3 — Prospeo (Chrome required here only):**
- Use the `computer` / Chrome tools to open https://app.prospeo.io/people-search
- Apply all filters from the ICP visually in the browser so the user can watch
- Copy the resulting URL from the address bar
- Save to output/[campaign]/prospeo-url.txt

**Steps 4–8 (Chrome only — NO API calls until approval):**
- On the Prospeo results page, scroll through and read the visible leads directly from the page — do NOT call the API
- For each of the top 25 leads shown: click their entry in Prospeo to open their profile, read their details (title, company, seniority, location), then open their company website in a new tab to check for ICP signals
- Score each lead 0–10 against the ICP using the lead-scorer prompt
- If avg score < 7.0: stay in Prospeo, adjust filters, re-run search — max 3 iterations
- Take a screenshot of the Prospeo results page
- Present the Prospeo URL + scores + screenshot — WAIT for approval
- After approval only: call Prospeo API (node scripts/prospeo.js) to pull the full enriched list, then run node scripts/export.js
