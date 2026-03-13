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

**Steps 4–8 (mix of API + Chrome):**
- Pull leads via Prospeo API (node scripts/prospeo.js)
- Verify top 25 leads: use Chrome to open each company website one by one so the user can see you checking them — score each against the ICP (node scripts/verify.js for data extraction, then score with lead-scorer prompt)
- If avg score < 7.0: go back to Prospeo in Chrome, adjust filters, re-run — max 3 iterations
- Take screenshot of Prospeo results page using Chrome
- Present URL + scores + screenshot — WAIT for approval
- After approval only: run node scripts/export.js
