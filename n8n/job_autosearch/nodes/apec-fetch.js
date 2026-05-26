// n8n Code node — APEC job search.
// Uses APEC's public internal JSON API (no auth required from VPS).
// POST https://www.apec.fr/cms/webservices/rechercheOffre
// Output normalized to same schema as LinkedIn/HelloWork nodes; source="apec".
//
// Server-side filters proven to NOT work (silently ignored):
//   anciennetePublication, salaireMinimum
// → We sort by DATE DESC and filter on our side by datePublication + salaireTexte.

const config = $input.first().json;

const MAX_DAYS_MAP = { '24hr': 1, 'past week': 7, 'past month': 31 };
const maxDays = MAX_DAYS_MAP[config.dateSincePosted] || 1;
const minSalaryK = config.salary ? Math.round(parseInt(config.salary, 10) / 1000) : 0;

const UAs = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
];
const rUA = () => UAs[Math.floor(Math.random() * UAs.length)];
const sl = ms => new Promise(r => setTimeout(r, ms));

// Parse APEC salaireTexte → MAX annual salary in € (upper bound of range)
// Examples: "50 - 60 k€ brut annuel" → 60000, "35 k€ brut annuel" → 35000,
//           "A négocier" → null (don't drop)
function parseSalaryMax(s) {
  if (!s) return null;
  const nums = [...s.matchAll(/(\d{2,3})/g)].map(m => parseInt(m[1], 10));
  if (!nums.length) return null;
  return Math.max(...nums) * 1000;
}

// datePublication is ISO; compute age in days vs now
function daysSince(iso) {
  if (!iso) return 999;
  const t = Date.parse(iso);
  if (isNaN(t)) return 999;
  return Math.floor((Date.now() - t) / 86400000);
}

const allJobs = [];

for (const kw of config.keywords) {
  const body = {
    motsCles: kw,
    pagination: { range: 50, startIndex: 0 },
    sorts: [{ type: 'DATE', direction: 'DESCENDING' }],
  };
  try {
    const r = await this.helpers.httpRequest({
      method: 'POST',
      url: 'https://www.apec.fr/cms/webservices/rechercheOffre',
      headers: {
        'User-Agent': rUA(),
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body, json: true,
      returnFullResponse: true, ignoreHttpStatusErrors: true,
    });
    if (r.statusCode !== 200 || !r.body || !Array.isArray(r.body.resultats)) continue;
    for (const o of r.body.resultats) {
      const age = daysSince(o.datePublication);
      if (age > maxDays) continue;
      const sMax = parseSalaryMax(o.salaireTexte);
      // Only enforce salary if we successfully parsed a number (don't drop "A négocier")
      if (minSalaryK && sMax !== null && sMax < minSalaryK * 1000) continue;
      allJobs.push({
        position: o.intitule || '',
        company: o.nomCommercial || 'Non communiqué',
        location: o.lieuTexte || '',
        date: o.datePublication || '',
        salary: o.salaireTexte || '',
        jobUrl: `https://www.apec.fr/candidat/recherche-emploi.html/emploi/detail-offre/${o.numeroOffre}`,
        agoTime: '',
        searchKeyword: kw,
        searchLocation: 'France',
        searchRemoteFilter: o.idNomTeletravail ? 'telework-possible' : '',
        source: 'apec',
      });
    }
  } catch (_) { /* skip */ }
  await sl(1200);
}

// Dedup by jobUrl
const seen = new Set();
const unique = [];
for (const j of allJobs) {
  if (j.jobUrl && !seen.has(j.jobUrl)) { seen.add(j.jobUrl); unique.push(j); }
}

// allowedLocations whitelist
const allowed = (config.allowedLocations || []).map(s => s.toLowerCase());
const filtered = unique.filter(j => {
  if (!j.location) return false;
  const loc = j.location.toLowerCase();
  return allowed.some(a => loc.includes(a));
});

return filtered.map(j => ({ json: j }));
