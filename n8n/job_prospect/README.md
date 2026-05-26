# job_prospect

*(placeholder — workflow not yet built)*

Goal: hourly scan for **companies that hire** in IT/AI roles → Telegram alerts when a new prospect appears. Complement to [`../job_autosearch`](../job_autosearch) which finds individual postings; this one finds companies to approach directly.

## Planned sources

| Source | Status | Notes |
|---|---|---|
| `recherche-entreprises.api.gouv.fr` | ✅ ready — open, no auth, NAF+dept filter, `est_employeur` flag | Primary source |
| France Travail — La Bonne Boite v2 | ⚠️ blocked — `403 Invalid scope` despite auth ok | Needs resource scope to be enabled on the FT app config |
| Place de l'Emploi Public (embassies/consulates) | 🔜 Phase 2 — separate scraping branch | For French diplomatic IT roles abroad |

## Planned filters

- ROME codes: `M1805` (Études/dev info), `M1806` (Conseil/MOA), `M1810` (Production SI)
- NAF codes: `62.01Z` (Programmation), `62.02A` (Conseil SI), `63.11Z` (Traitement de données), `70.22Z`, `73.20Z`
- Departments: `21` (Côte-d'Or — Dijon/Ahuy/Fontaine-lès-Dijon) for office/hybrid
- All France for 100%-remote opportunities; targeting also for relocation if salary ≥ 8000€/month

## Schedule

Every 1 hour.

## Dedup key

SIREN — companies don't disappear, so once notified we never re-notify unless data materially changes.
