// n8n Code node — dedup prospects using $workflow.staticData.
// No external Data Table needed; n8n persists staticData across executions.
// First execution: emits everything. Subsequent executions: only NEW SIRENs.

const items = $input.all();
const store = $getWorkflowStaticData('global');
if (!store.seenSirens) store.seenSirens = {};

const newOnes = [];
for (const it of items) {
  const siren = it.json.siren;
  if (!siren) continue;
  if (store.seenSirens[siren]) continue;
  store.seenSirens[siren] = new Date().toISOString();
  newOnes.push(it);
}

// Optional: trim store if it gets huge (>20k entries)
const keys = Object.keys(store.seenSirens);
if (keys.length > 20000) {
  // Keep newest 10k
  const sorted = keys.sort((a, b) => store.seenSirens[b].localeCompare(store.seenSirens[a]));
  const keep = sorted.slice(0, 10000);
  const trimmed = {};
  for (const k of keep) trimmed[k] = store.seenSirens[k];
  store.seenSirens = trimmed;
}

return newOnes;
