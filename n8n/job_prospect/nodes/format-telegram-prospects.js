// n8n Code node — format prospects as Telegram message(s).
// Groups by NAF sector. Returns one item per Telegram message (chunked at
// ~10 prospects per message to stay under Telegram's 4096-char body limit).

const items = $input.all();
if (items.length === 0) {
  return [{ json: { chatId: '387442030', message: '', jobCount: 0 } }];
}

// Group by NAF prefix (e.g. "62.01Z" → "62.01")
const groups = {};
for (const it of items) {
  const j = it.json;
  const grp = (j.naf || '?').slice(0, 5);
  if (!groups[grp]) groups[grp] = [];
  groups[grp].push(j);
}

const CHUNK = 8;
const results = [];

for (const [grp, prospects] of Object.entries(groups)) {
  // Chunk this group's prospects
  for (let i = 0; i < prospects.length; i += CHUNK) {
    const chunk = prospects.slice(i, i + CHUNK);
    let msg = `<b>🎯 NOUVEAUX PROSPECTS — NAF ${grp} (${prospects.length})</b>\n\n`;
    for (const p of chunk) {
      msg += `<b>${p.name}</b>\n`;
      const loc = [p.local_address, p.local_postal, p.local_commune].filter(Boolean).join(', ');
      msg += `${loc || '—'}\n`;
      msg += `Eff: ${p.employees_range} · Créée: ${(p.date_creation || '').slice(0, 4) || '?'} · NAF ${p.naf}\n`;
      msg += `<a href="${p.prospect_url}">Annuaire-entreprises</a>\n\n`;
    }
    results.push({ json: { chatId: '387442030', message: msg, jobCount: chunk.length } });
  }
}

return results;
