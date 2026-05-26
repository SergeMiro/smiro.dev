// n8n Code node — recherche-entreprises.api.gouv.fr
// Open public API, no auth. Returns companies (siren-level) with siege +
// matching_etablissements. We pick the etablissement in our target department
// for display purposes.
//
// Output schema (per company):
//   { siren, name, naf, naf_label, sector,
//     local_address, local_commune, local_postal,
//     employees_range, date_creation,
//     prospect_url,   // annuaire-entreprises.data.gouv.fr/entreprise/{siren}
//     source }
//
// Dedup is downstream (Code node uses $workflow.staticData).

const config = $input.first().json;

const TRANCHE_LABELS = {
  '00': '0 salarié', '01': '1-2', '02': '3-5', '03': '6-9',
  '11': '10-19', '12': '20-49', '21': '50-99', '22': '100-199',
  '31': '200-249', '32': '250-499', '41': '500-999',
  '42': '1000-1999', '51': '2000-4999', '52': '5000-9999', '53': '10000+',
};
const trancheOrder = ['00','01','02','03','11','12','21','22','31','32','41','42','51','52','53'];

function meetsMinTranche(t, minT) {
  if (!t) return false;
  return trancheOrder.indexOf(t) >= trancheOrder.indexOf(minT);
}

const sl = ms => new Promise(r => setTimeout(r, ms));
const naf = config.nafCodes.join(',');
const dept = config.departementsOffice.join(',');

const out = [];

for (let page = 1; page <= config.maxPagesPerRequest; page++) {
  const url = `https://recherche-entreprises.api.gouv.fr/search?activite_principale=${encodeURIComponent(naf)}&departement=${encodeURIComponent(dept)}&est_employeur=true&etat_administratif=A&page=${page}&per_page=${config.perPage}`;
  let r;
  try {
    r = await this.helpers.httpRequest({
      method: 'GET', url,
      headers: { 'Accept': 'application/json' },
      json: true,
      returnFullResponse: true,
      ignoreHttpStatusErrors: true,
    });
  } catch (_) { break; }
  if (r.statusCode !== 200 || !r.body || !Array.isArray(r.body.results)) break;
  if (r.body.results.length === 0) break;

  for (const c of r.body.results) {
    if (!meetsMinTranche(c.tranche_effectif_salarie, config.minTrancheEffectif)) continue;
    // Find an etablissement whose postal code starts with our target dept(s).
    // matching_etablissements[].departement is unreliable (often null) so we use code_postal prefix.
    const deptPrefixes = config.departementsOffice.map(d => String(d).padStart(2, '0'));
    const targetEt = (c.matching_etablissements || [])
      .find(e => deptPrefixes.some(p => (e.code_postal || '').startsWith(p)));
    // If no local etablissement matched, skip — this means the company doesn't
    // actually have a presence in our target zone (probably picked up via NAF only).
    if (!targetEt) continue;
    out.push({
      siren: c.siren,
      name: c.nom_complet || c.nom_raison_sociale || '',
      naf: c.activite_principale || '',
      sector: c.section_activite_principale || '',
      local_address: targetEt.geo_adresse || targetEt.adresse || '',
      local_commune: targetEt.libelle_commune || '',
      local_postal: targetEt.code_postal || '',
      employees_range: TRANCHE_LABELS[c.tranche_effectif_salarie] || c.tranche_effectif_salarie || '?',
      date_creation: c.date_creation || '',
      prospect_url: `https://annuaire-entreprises.data.gouv.fr/entreprise/${c.siren}`,
      source: 'rech-entreprises',
    });
  }
  // Stop early if last page
  if (r.body.results.length < config.perPage) break;
  await sl(400);
}

return out.map(j => ({ json: j }));
