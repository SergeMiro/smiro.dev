// n8n Code node — Config Targets for Job Prospect workflow.
// All search parameters in one place. Mirrors the LinkedIn "Config Filters" pattern.

const config = {
  // NAF codes (with dots, as required by recherche-entreprises.api.gouv.fr)
  // Covers: Programmation informatique, Conseil SI, Édition logiciel,
  //         Tierce maintenance, Traitement de données, Portails internet,
  //         Conseil en gestion (souvent IT/AI), Activités spécialisées.
  nafCodes: [
    '62.01Z', // Programmation informatique
    '62.02A', // Conseil en systèmes et logiciels informatiques
    '62.02B', // Tierce maintenance de SI et applications
    '62.03Z', // Gestion d'installations informatiques
    '62.09Z', // Autres activités informatiques
    '63.11Z', // Traitement de données, hébergement
    '63.12Z', // Portails internet
    '58.29A', // Édition de logiciels système et de réseau
    '58.29C', // Édition de logiciels applicatifs
    '70.22Z', // Conseil pour les affaires et autres (souvent AI/automation consultancies)
  ],

  // Office / hybrid candidates — Dijon and neighbours (dept 21 = Côte-d'Or)
  // Use dept filter for primary scan
  departementsOffice: ['21'],

  // For 100% remote opportunities — scan all France with stricter NAF set
  // (toggled in fetcher; for now we cover all France through dept=21 hits
  // since most multi-site companies have a Dijon establishment if dept=21 matches)
  scanRemote: false,

  // Salary relocation threshold (used only by humans deciding: keep monitoring
  // even if outside Dijon if salary signal is strong)
  relocationSalaryEurMonthMin: 8000,

  // Filter quality: only employers with at least N employees
  // tranche_effectif_salarie codes (INSEE):
  //   '00' = 0 sal | '01' = 1-2 | '02' = 3-5 | '03' = 6-9 | '11' = 10-19
  //   '12' = 20-49 | '21' = 50-99 | '22' = 100-199 | '31' = 200-249
  //   '32' = 250-499 | '41' = 500-999 | '42' = 1000-1999 | '51' = 2000-4999
  //   '52' = 5000-9999 | '53' = 10000+
  // Keep only ≥ 6 employees → trancheEffectifMin = '03'
  minTrancheEffectif: '03',

  // Pagination cap to avoid runaway scans
  maxPagesPerRequest: 5,
  perPage: 25,
};

return [{ json: config }];
