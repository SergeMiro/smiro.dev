# job_prospect

Hourly scan for **companies hiring in IT/AI** around Dijon → Telegram alerts.

## Live workflow

- ID: `TEvyg76X8keK4y4j`
- Name: *Job Prospect — Auto 1h*
- URL: https://n8n.smiro.dev/workflow/TEvyg76X8keK4y4j
- Schedule: every 1 hour

## Pipeline

```
[Every 1 Hour]
  ↓
[Config Targets]   ← NAF IT codes, dept 21, min ≥ 6 employees, pagination cap
  ↓
[Recherche Entreprises Fetch]   recherche-entreprises.api.gouv.fr
                                paginates, picks etablissement in dept 21
  ↓
[Dedup by SIREN]   $workflow.staticData (auto-trims to 10k entries)
  ↓
[Format Telegram Prospects]   groups by NAF, chunks at 8 per message
  ↓
[Has New Prospects]   only fire if jobCount > 0
  ↓
[Send to Telegram]
```

## Output schema (per company)

```js
{
  siren, name, naf, sector,
  local_address, local_commune, local_postal,
  employees_range,  // e.g. "50-99"
  date_creation,
  prospect_url,     // annuaire-entreprises.data.gouv.fr/entreprise/{siren}
  source: 'rech-entreprises'
}
```

## Sources

| Source | Status | Notes |
|---|---|---|
| `recherche-entreprises.api.gouv.fr` | ✅ live | Open, no auth. NAF codes use dot format (`62.01Z`). Filter by `code_postal` prefix in `matching_etablissements` to actually land in dept 21 (`departement` field is unreliable). |
| France Travail — La Bonne Boite v2 | ⛔ blocked | All endpoints return `403 Invalid scope` despite `api_labonneboitev2` token. Needs resource-level scope toggle on FT app config — unblock via francetravail.io app settings. |

## Files

- `nodes/config-targets.js` — NAF codes, target depts, employee size threshold
- `nodes/rech-entreprises-fetch.js` — API paginator with etablissement matching
- `nodes/dedup-prospects.js` — in-memory dedup via `$workflow.staticData`
- `nodes/format-telegram-prospects.js` — message composer, grouped by NAF
- `scripts/build_sdk.cjs` — regenerate + push via n8n MCP (use `.cjs` because `smiro.dev` root has `"type": "module"`)

## One-time manual setup needed

n8n's auto-credential assignment for the Telegram node didn't pick the right account on workflow creation. **Open the workflow in the n8n UI once and re-pick the Telegram credential** in the "Send to Telegram" node — same one that the `job_autosearch` workflow uses. This only needs to be done once.

## Dedup behaviour

- `staticData` persists between executions (survives `update_workflow`).
- First execution emits all matched companies; subsequent runs only **new** SIRENs.
- Store auto-trims at 20k entries, keeping the 10k newest.
- To reset (e.g. for re-testing): open workflow → settings → "Clear workflow static data" (or unpublish + re-publish).

## Tuning knobs (in `nodes/config-targets.js`)

| Var | Default | Meaning |
|---|---|---|
| `nafCodes` | 10 IT NAF codes | Add `58.21Z` for game publishers, drop `70.22Z` if too noisy |
| `departementsOffice` | `['21']` | Add `'25'` (Doubs) etc. for wider radius |
| `minTrancheEffectif` | `'03'` (6-9 sal) | Bump to `'11'` (10-19) to skip very small companies |
| `maxPagesPerRequest` | `5` | × `perPage:25` = max 125 prospects scanned per run |
| `perPage` | `25` | Per-page size |
