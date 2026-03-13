# Lead Engine

Cold email list building and enrichment engine. Input an Upwork chat URL or meeting transcript — get a verified, ICP-matched lead list.

## Setup (3 minutes)

**Requirements:** Node.js, Google Chrome, Claude Code with Chrome extension

```bash
# 1. Install dependencies
npm install

# 2. Add your API keys
cp .env.example .env
# Edit .env — fill in PROSPEO_API_KEY, ANTHROPIC_API_KEY

# 3. Install Claude Chrome extension (if not already)
# → https://chromewebstore.google.com/detail/claude/fcoeoabgfenejglbffodgkkbkcdhcgfn

# 4. Open Claude Code in this folder
code .
```

## Usage

Open Claude Code in this folder and run the slash command:

```
/build-list
```

Then paste either:
- An Upwork chat room URL: `https://www.upwork.com/messages/rooms/...`
- A meeting transcript (paste directly)

Claude will handle everything from there.

## What happens

1. Reads the chat or transcript
2. Researches the client's company + competitors + ICP
3. Opens Prospeo in your Chrome browser, sets all filters visually
4. Copies the search URL and pulls leads via API
5. Verifies top 25 leads by visiting company websites
6. Scores them against the ICP (iterates if score < 7.0)
7. Takes a screenshot of the results
8. **Pauses and waits for your approval**
9. After approval: exports CSV (for Clay/Trykitt) + HTML sales snapshot

## Output files

All outputs saved to `output/[client-name-date]/`:

| File | Purpose |
|---|---|
| `icp.json` | Structured ICP definition |
| `prospeo-url.txt` | Prospeo search URL |
| `scores.json` | Lead verification scores |
| `screenshot.png` | Prospeo results screenshot |
| `leads-export.csv` | Import into Clay or Trykitt |
| `sales-snapshot.html` | Send to client (open in browser, screenshot) |

## Sharing with team members

1. Copy this entire folder to the new machine
2. `npm install`
3. Fill in `.env` with API keys
4. Install Claude Chrome extension in their Chrome
5. Open in Claude Code — done

The `CLAUDE.md` file makes Claude behave identically for every team member.

## API Keys needed

| Key | Get it from |
|---|---|
| `PROSPEO_API_KEY` | app.prospeo.io/api |
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `SERPER_API_KEY` | serper.dev (optional) |
