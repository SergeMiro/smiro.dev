// n8n Code node — France Travail official API "Offres d'emploi v2".
// Self-contained: gets OAuth2 token + paginates searches in one node.
//
// REQUIRES: a previous Code node named "FT Credentials" returning
//   { json: { client_id: "...", client_secret: "..." } }
// (Or replace with $env reads if you prefer.)
//
// Output schema: same as LinkedIn/HelloWork/APEC nodes; source="francetravail".

const config = $input.first().json;
const creds = $('FT Credentials').first().json;
const CLIENT_ID = creds.client_id;
const CLIENT_SECRET = creds.client_secret;

// Skip silently if user hasn't filled credentials yet
if (!CLIENT_ID || CLIENT_ID === 'REPLACE_ME' || !CLIENT_SECRET || CLIENT_SECRET === 'REPLACE_ME') {
  return [];
}

const PUBLISHED_DAYS = { '24hr': 1, 'past week': 7, 'past month': 31 };
const publieeDepuis = PUBLISHED_DAYS[config.dateSincePosted] || 1;

const TOKEN_URL = 'https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=/partenaire';
const SEARCH_URL = 'https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search';

// INSEE department codes — covers user's target zones
// 21=Côte-d'Or (Dijon), 75=Paris, 69=Rhône (Lyon),
// 13=Bouches-du-Rhône (Marseille), 31=Haute-Garonne (Toulouse),
// 44=Loire-Atlantique (Nantes), 33=Gironde (Bordeaux), 67=Bas-Rhin (Strasbourg),
// 59=Nord (Lille), 06=Alpes-Maritimes (Nice), 35=Ille-et-Vilaine (Rennes),
// 38=Isère (Grenoble), 34=Hérault (Montpellier), 57=Moselle (Metz), 54=Meurthe (Nancy)
const departements = config.ftDepartements || [
  '21', '75', '69', '13', '31', '44', '33', '67', '59', '06', '35', '38', '34', '57', '54',
];

// 1) Fetch OAuth2 token
let token;
try {
  const tokenResp = await this.helpers.httpRequest({
    method: 'POST',
    url: TOKEN_URL,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${encodeURIComponent(CLIENT_ID)}&client_secret=${encodeURIComponent(CLIENT_SECRET)}&scope=${encodeURIComponent('api_offresdemploiv2 o2dsoffre')}`,
    json: false,
    returnFullResponse: true,
    ignoreHttpStatusErrors: true,
  });
  if (tokenResp.statusCode !== 200) {
    throw new Error(`FT token endpoint returned ${tokenResp.statusCode}: ${String(tokenResp.body).slice(0, 200)}`);
  }
  const tokenBody = typeof tokenResp.body === 'string' ? JSON.parse(tokenResp.body) : tokenResp.body;
  token = tokenBody.access_token;
  if (!token) throw new Error('FT token response missing access_token');
} catch (e) {
  // Fail loud — without token nothing else can work
  throw new Error(`France Travail auth failed: ${e.message}`);
}

const sl = ms => new Promise(r => setTimeout(r, ms));
const allJobs = [];

for (const kw of config.keywords) {
  for (const dept of departements) {
    const params = new URLSearchParams();
    params.append('motsCles', kw);
    params.append('departement', dept);
    params.append('publieeDepuis', String(publieeDepuis));
    params.append('range', '0-49');
    // typeContrat=CDI keeps only CDI offers
    params.append('typeContrat', 'CDI');

    try {
      const r = await this.helpers.httpRequest({
        method: 'GET',
        url: SEARCH_URL + '?' + params.toString(),
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        json: true,
        returnFullResponse: true,
        ignoreHttpStatusErrors: true,
      });
      // FT returns 200 with full page or 206 Partial Content when more exist
      if ((r.statusCode === 200 || r.statusCode === 206) && r.body && Array.isArray(r.body.resultats)) {
        for (const o of r.body.resultats) {
          allJobs.push({
            position: o.intitule || '',
            company: (o.entreprise && o.entreprise.nom) || 'Non communiqué',
            location: (o.lieuTravail && o.lieuTravail.libelle) || `dept-${dept}`,
            date: o.dateActualisation || o.dateCreation || '',
            salary: (o.salaire && o.salaire.libelle) || '',
            jobUrl: (o.origineOffre && o.origineOffre.urlOrigine)
              || `https://candidat.francetravail.fr/offres/recherche/detail/${o.id}`,
            agoTime: '',
            searchKeyword: kw,
            searchLocation: `dept-${dept}`,
            searchRemoteFilter: o.dureeTravailLibelleConverti || '',
            source: 'francetravail',
          });
        }
      }
    } catch (_) { /* skip dept */ }
    await sl(400);
  }
}

// Dedup by jobUrl
const seen = new Set();
const unique = [];
for (const j of allJobs) {
  if (j.jobUrl && !seen.has(j.jobUrl)) { seen.add(j.jobUrl); unique.push(j); }
}

return unique.map(j => ({ json: j }));
