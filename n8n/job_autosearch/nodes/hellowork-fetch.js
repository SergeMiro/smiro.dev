// n8n Code node — HelloWork job search.
// Mirrors the existing LinkedIn node: builds URLs from Config Filters,
// fetches search HTML, parses serpCards, dedupes, applies allowedLocations.
// Output schema is identical to LinkedIn node so downstream "Check Duplicates",
// "Group by Type" and "Send to Telegram" work unchanged, with field source="hellowork".
//
// HelloWork URL: https://www.hellowork.com/fr-fr/emploi/recherche.html?k=<kw>&l=<loc>&p=<page>
// No URL-level date filter — we filter by parsing "il y a N jours" → keep ≤ 1 day.

const config = $input.first().json;

// Map our internal dateSincePosted to max days
const MAX_DAYS_MAP = { '24hr': 1, 'past week': 7, 'past month': 31 };
const maxDays = MAX_DAYS_MAP[config.dateSincePosted] || 1;

// Build queries: keyword × every location (remote/hybrid/office, dedup)
const locs = [...new Set([
  ...(config.remoteLocations || []),
  ...(config.hybridLocations || []),
  ...(config.officeLocations || []),
])];
const queries = [];
for (const kw of config.keywords) {
  for (const loc of locs) {
    queries.push({ keyword: kw, location: loc });
  }
}

const UAs = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
];
const rUA = () => UAs[Math.floor(Math.random() * UAs.length)];
const sl = ms => new Promise(r => setTimeout(r, ms));

// HTML entities decoder (limited but covers HelloWork output: &#xE9; etc)
function decodeEntities(s) {
  return (s || '')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)))
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;|&#x27;/g, "'").replace(/&nbsp;|&#x202F;/g, ' ');
}

// Parse "il y a 4 jours" / "il y a 12 heures" / "aujourd'hui" → days (number)
function parseAgo(s) {
  if (!s) return 999;
  const t = s.toLowerCase();
  if (t.includes("aujourd") || t.includes('moins d')) return 0;
  if (t.includes('hier')) return 1;
  const heures = t.match(/(\d+)\s*heure/);
  if (heures) return 0;
  const jours = t.match(/(\d+)\s*jour/);
  if (jours) return parseInt(jours[1], 10);
  const sem = t.match(/(\d+)\s*semaine/);
  if (sem) return parseInt(sem[1], 10) * 7;
  const mois = t.match(/(\d+)\s*mois/);
  if (mois) return parseInt(mois[1], 10) * 30;
  return 999;
}

function parseCards(html) {
  const jobs = [];
  // Split on serpCard boundaries
  const parts = html.split(/data-cy="serpCard"/);
  // First part is preamble; skip it
  for (let i = 1; i < parts.length; i++) {
    const card = parts[i].slice(0, 4000); // cap card window
    const linkM = card.match(/href="(\/fr-fr\/emplois\/\d+[^"]*)"/);
    const titleM = card.match(/title="([^"]+)"/);
    const h3M = card.match(/<h3[^>]*>([\s\S]{0,800}?)<\/h3>/);
    const locM = card.match(/data-cy="localisationCard"[^>]*>\s*([^<]+)/);
    const contractM = card.match(/data-cy="contractCard"[^>]*>\s*([^<]+)/);
    const salaryM = card.match(/data-cy="contractCard"[^>]*>[\s\S]*?<div[^>]*typo-s-bold[^>]*>([^<]+)/);
    const agoM = card.match(/typo-s[^"]*text-grey[^"]*"[^>]*>\s*([^<]+)/);

    if (!linkM) continue;
    const jobUrl = 'https://www.hellowork.com' + linkM[1].split('?')[0];

    let title = '', company = '';
    if (h3M) {
      const ps = [...h3M[1].matchAll(/<p[^>]*>([^<]+)<\/p>/g)];
      if (ps[0]) title = decodeEntities(ps[0][1].trim());
      if (ps[1]) company = decodeEntities(ps[1][1].trim());
    }
    if (!title && titleM) title = decodeEntities(titleM[1].trim());

    const location = locM ? decodeEntities(locM[1].trim()) : '';
    const ago = agoM ? decodeEntities(agoM[1].trim()) : '';
    const contract = contractM ? decodeEntities(contractM[1].trim()) : '';
    const salary = salaryM ? decodeEntities(salaryM[1].trim()) : '';

    if (!title) continue;
    jobs.push({
      position: title,
      company: company || 'Non communiqué',
      location,
      date: '',
      salary,
      jobUrl,
      agoTime: ago,
      _agoDays: parseAgo(ago),
      _contract: contract,
    });
  }
  return jobs;
}

const allJobs = [];
let err = 0;

for (const q of queries) {
  const url = `https://www.hellowork.com/fr-fr/emploi/recherche.html?k=${encodeURIComponent(q.keyword)}&l=${encodeURIComponent(q.location)}`;
  try {
    const r = await this.helpers.httpRequest({
      method: 'GET', url,
      headers: {
        'User-Agent': rUA(),
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'fr-FR,fr;q=0.9',
        'Referer': 'https://www.hellowork.com/fr-fr/',
      },
      returnFullResponse: true, ignoreHttpStatusErrors: true,
    });
    if (r.statusCode === 429) { err++; await sl(Math.pow(2, err) * 1000); continue; }
    if (r.statusCode === 200 && r.body) {
      const cards = parseCards(typeof r.body === 'string' ? r.body : '');
      for (const j of cards) {
        j.searchKeyword = q.keyword;
        j.searchLocation = q.location;
        j.searchRemoteFilter = (config.remoteLocations || []).includes(q.location) ? 'remote'
          : (config.hybridLocations || []).includes(q.location) ? 'hybrid' : 'on site';
        j.source = 'hellowork';
      }
      allJobs.push(...cards);
      err = 0;
    }
  } catch (_) { err++; if (err >= 3) break; }
  await sl(1500 + Math.random() * 1000);
}

// Filter by recency (HelloWork has no URL date filter, we do it here)
const recent = allJobs.filter(j => j._agoDays <= maxDays);

// Dedup by jobUrl within batch
const seen = new Set();
const unique = [];
for (const j of recent) {
  if (j.jobUrl && !seen.has(j.jobUrl)) { seen.add(j.jobUrl); unique.push(j); }
}

// allowedLocations whitelist (same logic as LinkedIn node)
const allowed = (config.allowedLocations || []).map(s => s.toLowerCase());
const filtered = unique.filter(j => {
  if (!j.location) return false;
  const loc = j.location.toLowerCase();
  return allowed.some(a => loc.includes(a));
});

// Strip internal fields before output
return filtered.map(j => {
  const { _agoDays, _contract, ...clean } = j;
  return { json: clean };
});
