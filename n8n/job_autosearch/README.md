# job_autosearch

Multi-source job search workflow → Telegram alerts.

## Live workflow

- ID: `2Zpk5qEVwjbHHnXk`
- Name: *LinkedIn Job Search — Auto 7min*
- URL: https://n8n.smiro.dev/workflow/2Zpk5qEVwjbHHnXk
- Schedule: every 7 minutes

## Pipeline

```
[Every 7 Minutes]
  ↓
[Config Filters]   ← keywords, allowed locations, salary threshold, recency window
  ↓
  ├─ [LinkedIn Job Search]        (guest API + HTML parsing)
  ├─ [HelloWork Job Search]       (HTML parsing of /fr-fr/emploi/recherche.html)
  ├─ [APEC Job Search]            (POST /cms/webservices/rechercheOffre JSON API)
  └─ [FT Credentials] → [France Travail Job Search]   (OAuth2 + Offres d'emploi v2 REST)
  ↓
[Merge All Sources]   (mode: append)
  ↓
[Check Duplicates]   (Data Table `linkedin_seen_jobs`, key = jobUrl)
  ↓
  ├─ [Save New Jobs]
  └─ [Group by Type] → [Has New Jobs] → [Send to Telegram]
```

All source nodes emit the same normalized item:
```js
{
  position, company, location, date, salary,
  jobUrl, agoTime, searchKeyword, searchLocation,
  searchRemoteFilter,  // "remote" | "hybrid" | "on site" | ""
  source,              // "linkedin" | "hellowork" | "apec" | "francetravail"
}
```

## Source-specific notes

| Source | Reliable from datacenter IP | Notes |
|---|---|---|
| LinkedIn | ✅ guest API tolerates DC IP | Existing inline scraper, unchanged from earlier version |
| HelloWork | ✅ no Cloudflare challenge on basic UA | No URL-level date filter — client-side parse "il y a N jours" |
| APEC | ✅ open internal JSON API | `anciennetePublication` / `salaireMinimum` server-side filters silently ignored — filter on our side |
| France Travail | ✅ official OAuth2 API | Requires registration on francetravail.io. See [docs/france-travail-setup.md](docs/france-travail-setup.md). 15 INSEE departments covered. |
| Indeed / Glassdoor | ❌ blocked from DC IP | Excluded — would need residential proxies |

## Files

- `nodes/hellowork-fetch.js` — HelloWork Code-node source
- `nodes/apec-fetch.js` — APEC Code-node source
- `nodes/france-travail-fetch.js` — France Travail Code-node source (token + paginated search)
- `docs/france-travail-setup.md` — step-by-step FT registration
- `docs/initial-linkedin-only-5min-backup.json` — original LinkedIn-only workflow JSON (pre-multisource baseline)
- `scripts/build_sdk.js` — regenerate + redeploy via n8n MCP

The LinkedIn Code node body lives inside the n8n workflow itself (was authored before this repo refactor). Not duplicated here.

## How to redeploy after editing a node

1. Edit the relevant `nodes/*.js` file
2. Fetch latest workflow snapshot:
   ```bash
   MCP_URL="https://n8n.smiro.dev/mcp-server/http"
   MCP_TOK="Bearer <your-token>"
   curl -s -X POST "$MCP_URL" -H "Authorization: $MCP_TOK" \
     -H "Content-Type: application/json" -H "Accept: application/json, text/event-stream" \
     -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_workflow_details","arguments":{"workflowId":"2Zpk5qEVwjbHHnXk"}}}' \
     | sed -n 's/^data: //p' | head -1 > /tmp/wf_details.json
   ```
3. Build SDK: `node scripts/build_sdk.js` → produces `/tmp/workflow.sdk.js`
4. Validate + update + publish via MCP tools (`validate_workflow` → `update_workflow` → `publish_workflow`)

**Important:** `update_workflow` saves a draft. The running schedule keeps executing the previously-published version until you call `publish_workflow`. Don't forget this step.
