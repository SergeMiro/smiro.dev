// n8n Code node — La Bonne Boite v2 fetch.
// Self-contained: gets its own OAuth2 token + iterates ROME codes around Dijon.
//
// REQUIRES upstream "FT Credentials" Code node returning:
//   { json: { client_id: "...", client_secret: "..." } }
//
// OUTPUT items use the same schema as rech-entreprises-fetch.js for dedup compatibility:
//   { siren, name, naf, sector, local_address, local_commune, local_postal,
//     employees_range, date_creation, prospect_url, source: 'lbb' }
//
// API docs: https://francetravail.io/produits-partages/catalogue/bonne-boite-v2/documentation
// Required scopes (verified via OpenAPI spec): api_labonneboitev2, search, office.

const config = $input.first().json;
const creds = $('FT Credentials').first().json;
const CLIENT_ID = creds.client_id;
const CLIENT_SECRET = creds.client_secret;

if (!CLIENT_ID || CLIENT_ID === 'REPLACE_ME' || !CLIENT_SECRET || CLIENT_SECRET === 'REPLACE_ME') {
  return [];
}

const TOKEN_URL = 'https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=/partenaire';
const SEARCH_URL = 'https://api.francetravail.io/partenaire/labonneboite/v2/recherche';

// ROME codes covering full stack + AI / automation / IT consulting roles
const romeCodes = config.romeCodes || [
  'M1805', // Études et développement informatique
  'M1806', // Conseil et MOA en SI
  'M1810', // Production et exploitation de SI
  'M1802', // Expertise et support en SI
];

// Search locations: Dijon centre + neighbour cities. lat/lon + distance=30km
// covers Dijon, Ahuy, Fontaine-lès-Dijon and surrounding communes.
const centers = config.lbbCenters || [
  { name: 'Dijon', latitude: 47.32, longitude: 5.04, distance: 30 },
];

// 1) Get token
let token;
try {
  const r = await this.helpers.httpRequest({
    method: 'POST',
    url: TOKEN_URL,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${encodeURIComponent(CLIENT_ID)}&client_secret=${encodeURIComponent(CLIENT_SECRET)}&scope=${encodeURIComponent('api_labonneboitev2 search office application_' + CLIENT_ID)}`,
    json: false,
    returnFullResponse: true,
    ignoreHttpStatusErrors: true,
  });
  if (r.statusCode !== 200) throw new Error(`FT token ${r.statusCode}: ${String(r.body).slice(0, 300)}`);
  const body = typeof r.body === 'string' ? JSON.parse(r.body) : r.body;
  token = body.access_token;
  if (!token) throw new Error('No access_token in response: ' + JSON.stringify(body).slice(0, 200));
} catch (e) {
  // Surface the error so we can see what's wrong; n8n's onError:continueRegularOutput
  // will keep the workflow alive
  throw new Error('LBB token failed: ' + e.message);
}

const sl = ms => new Promise(r => setTimeout(r, ms));
const qs = obj => Object.entries(obj)
  .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
  .join('&');
const out = [];
const PAGE_SIZE = 50;
const MAX_PAGES = config.lbbMaxPages || 3;

// LBB rate limit: 2 calls/second → keep 600ms between calls
for (const c of centers) {
  for (const rome of romeCodes) {
    for (let page = 1; page <= MAX_PAGES; page++) {
      const params = qs({
        latitude: c.latitude,
        longitude: c.longitude,
        distance: c.distance,
        rome,
        page,
        page_size: PAGE_SIZE,
      });
      // Inline retry on 429 (rate limit)
      let r;
      for (let attempt = 0; attempt < 3; attempt++) {
        r = await this.helpers.httpRequest({
          method: 'GET',
          url: SEARCH_URL + '?' + params,
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
          json: true,
          returnFullResponse: true,
          ignoreHttpStatusErrors: true,
        });
        if (r.statusCode !== 429) break;
        await sl(1500 * (attempt + 1));
      }
      try {
        if (r.statusCode !== 200) {
          // 429 after retries / other errors → silently skip this rome
          break;
        }
        const parsed = typeof r.body === 'string' ? JSON.parse(r.body) : r.body;
        if (!parsed || !Array.isArray(parsed.items)) {
          // Null-envelope (API param glitch) — skip this rome silently
          break;
        }
        const items = parsed.items;
        if (items.length === 0) break;
        for (const o of items) {
          const siret = o.siret || '';
          const siren = siret.slice(0, 9);
          if (!siren) continue;
          const hmin = o.headcount_min, hmax = o.headcount_max;
          const empRange = (hmin || hmax)
            ? (hmax === 0 ? '0' : `${hmin || 0}-${hmax || '?'}`)
            : '?';
          out.push({
            siren,
            name: o.company_name || o.office_name || '?',
            naf: o.naf || '',
            sector: o.naf_label || '',
            local_address: '',
            local_commune: o.city || '',
            local_postal: o.postcode || '',
            employees_range: empRange,
            date_creation: '',
            prospect_url: `https://annuaire-entreprises.data.gouv.fr/entreprise/${siren}`,
            source: 'lbb',
            // LBB-specific extras useful for scoring downstream
            lbb_hiring_potential: o.hiring_potential,
            lbb_is_high_potential: !!o.is_high_potential,
            lbb_rome: rome,
          });
        }
        if (items.length < PAGE_SIZE) break;
      } catch (_) { break; }
      await sl(800);
    }
  }
}

// Dedup within batch by SIREN (same company may surface under multiple ROME)
const seen = new Set();
const unique = [];
for (const o of out) {
  if (seen.has(o.siren)) continue;
  seen.add(o.siren);
  unique.push(o);
}

return unique.map(j => ({ json: j }));
