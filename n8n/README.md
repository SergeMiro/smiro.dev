# n8n workflows for smiro.dev

All job-search and prospecting automation orchestrated through self-hosted n8n at `https://n8n.smiro.dev`. Each subfolder corresponds to one production workflow.

| Folder | Workflow on n8n.smiro.dev | Schedule | Purpose |
|---|---|---|---|
| [`job_autosearch/`](./job_autosearch/) | `2Zpk5qEVwjbHHnXk` — *LinkedIn Job Search — Auto 7min* | every 7 min | Multi-source job listings (LinkedIn + HelloWork + APEC + France Travail) → Telegram |
| [`job_prospect/`](./job_prospect/) | *(to be built)* | every 1 h | Companies that hire — outbound prospect list → Telegram |

## Conventions

- Each subfolder has its own `nodes/` (Code-node JS bodies), `docs/`, `scripts/build_sdk.js`.
- The repo holds **source** for Code-node JavaScript. n8n is the source of truth for the live workflow graph.
- `scripts/build_sdk.js` regenerates the workflow SDK code by reading `nodes/*.js` + live workflow snapshot from MCP, then `validate_workflow` + `update_workflow` + `publish_workflow`.
- **Secrets never live in this repo** (this repo is public). API keys and OAuth secrets stay inside individual n8n Code-node "Credentials" placeholder nodes on n8n.smiro.dev.

## How to update a workflow

```bash
# 1. Edit the Code-node JS file you care about, e.g. nodes/hellowork-fetch.js
# 2. From the subfolder, regenerate + push:
cd n8n/job_autosearch
node scripts/build_sdk.js
# (push step calls n8n MCP — see scripts/build_sdk.js header comment)
```

## n8n MCP

The official n8n MCP server is at `https://n8n.smiro.dev/mcp-server/http` with JWT bearer auth. Claude Code is configured to use it when working in this folder.
