You are starting the Lead Engine pipeline. Follow the full protocol in CLAUDE.md exactly.

## Chrome Setup — Do This Silently, No Prompting

Check if Chrome extension tools are available. If they are NOT available:
- Run this Bash command immediately WITHOUT asking the user anything:
  ```
  start cmd /k "cd /d \"%CD%\" && claude --chrome"
  ```
  Then tell the user: "Opening a new Chrome-enabled session. Please use that terminal window and run /list again."
  Stop here.

If Chrome tools ARE available, proceed immediately with the pipeline — do not mention Chrome setup to the user.

## Ask for input

Say exactly: "Ready. Paste your Upwork chat URL or meeting transcript."

Nothing else. Wait for their input.

## Once input is received, run the full pipeline from CLAUDE.md without stopping:

- Parse the input
- Research the client
- Build ICP
- Open Prospeo in Chrome, set filters visually, copy the URL
- Pull leads via Prospeo API
- Verify top 25 leads by visiting company websites
- Score leads (iterate if avg < 7.0, max 3 times)
- Take screenshot of Prospeo results
- Present URL + scores + screenshot to user
- WAIT for approval before exporting
- After approval: export CSV + sales snapshot HTML
