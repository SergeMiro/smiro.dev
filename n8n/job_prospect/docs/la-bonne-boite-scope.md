# La Bonne Boite v2 — OAuth2 scope + endpoints (verified)

Discovered by fetching the OpenAPI spec at
`https://francetravail.io/api-peio/v2/api/360/openapi`.

## Required OAuth2 scopes (clientCredentials flow)

All three together:
```
api_labonneboitev2 search office
```

Plus the standard `application_<client_id>` per FT convention.

Example token request:
```bash
curl -X POST "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=/partenaire" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=$FT_CLIENT_ID&client_secret=$FT_SECRET&scope=api_labonneboitev2 search office application_$FT_CLIENT_ID"
```

The `search` and `office` scopes are what the previous OAuth2 attempts were
missing — without them the token works but every API call returns
`403 Invalid scope`.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/recherche` | Search companies with high hiring potential |
| GET | `/nombreEntreprise` | Count only — number of matching companies |
| GET | `/potentielEmbauche` | Detailed company info (input: list of `siret`) |

Base URL: `https://api.francetravail.io/partenaire/labonneboite/v2`

## /recherche key params

At least ONE of `job | granddomain | domain | rome | naf` is required.

| Param | Notes |
|---|---|
| `rome` | ROME code (e.g. `M1805` = Études et dév info) |
| `naf` | NAF code |
| `latitude` / `longitude` / `distance` | Geo search (km) |
| `region_number` / `department_number` / `citycode` / `postcode` | Discrete location filters |
| `page` / `page_size` | Pagination (max 100/page) |
| `sort_by` | `score` (default), `distance`, `headcount`, etc. |

## Response shape (one item)

```js
{
  rome, id, siret, email, company_name, office_name,
  headcount_min, headcount_max,
  naf, naf_label,
  location: { lat, lon },
  city, citycode, postcode,
  department, department_number, region,
  hiring_potential,        // float, higher = stronger signal
  is_high_potential        // bool
}
```

## Rate limit

2 calls/second per the FT app configuration. The `lbb-fetch.js` Code node
inserts `await sleep(600)` between requests to stay under the limit.
