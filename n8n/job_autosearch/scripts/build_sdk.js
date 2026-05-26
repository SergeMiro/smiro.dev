// Build n8n Workflow SDK code from existing node JS files and live workflow.
// Run from repo root. Requires /tmp/wf_details.json — fetch via:
//   curl -s -X POST $MCP_URL -H "Authorization: $MCP_TOK" \
//     -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' \
//     -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_workflow_details","arguments":{"workflowId":"2Zpk5qEVwjbHHnXk"}}}' \
//     | sed -n 's/^data: //p' | head -1 > /tmp/wf_details.json
const fs = require('fs');

const liveWf = JSON.parse(JSON.parse(fs.readFileSync('/tmp/wf_details.json', 'utf8')).result.content[0].text).workflow;
const linkedinNode = liveWf.nodes.find(n => n.name === 'LinkedIn Job Search');
const configNode = liveWf.nodes.find(n => n.name === 'Config Filters');
const groupNode = liveWf.nodes.find(n => n.name === 'Group by Type');
const dupesNode = liveWf.nodes.find(n => n.name === 'Check Duplicates');
const saveNode = liveWf.nodes.find(n => n.name === 'Save New Jobs');
const trigNode = liveWf.nodes.find(n => n.name === 'Every 7 Minutes');
const ifNode = liveWf.nodes.find(n => n.name === 'Has New Jobs');
const telegramNode = liveWf.nodes.find(n => n.name === 'Send to Telegram');

const helloworkCode = fs.readFileSync('/home/dev/smiro.dev/n8n/job_autosearch/nodes/hellowork-fetch.js', 'utf8');
const apecCode = fs.readFileSync('/home/dev/smiro.dev/n8n/job_autosearch/nodes/apec-fetch.js', 'utf8');
const ftCode = fs.readFileSync('/home/dev/smiro.dev/n8n/job_autosearch/nodes/france-travail-fetch.js', 'utf8');

// Patch LinkedIn jsCode to tag source="linkedin"
let linkedinCode = linkedinNode.parameters.jsCode;
linkedinCode = linkedinCode.replace(
  'return filtered.map(j => ({ json: j }));',
  'return filtered.map(j => ({ json: { ...j, source: "linkedin" } }));'
);

// New Group by Type code (source-aware)
const groupCode = `const items = $input.all();
const SOURCE_LABEL = { linkedin: 'LinkedIn', hellowork: 'HelloWork', apec: 'APEC', francetravail: 'France Travail' };
const groups = { remote: [], hybrid: [], 'on site': [] };
for (const item of items) {
  const j = item.json;
  let rf = j.searchRemoteFilter;
  if (!groups[rf]) rf = 'on site';
  groups[rf].push(j);
}
const results = [];
for (const [type, jobs] of Object.entries(groups)) {
  if (jobs.length === 0) continue;
  const label = type === 'remote' ? 'REMOTE' : type === 'hybrid' ? 'HYBRIDE' : 'OFFICE';
  let msg = '<b>' + label + ' — ' + jobs.length + ' nouvelle(s) offre(s)</b>\\n\\n';
  for (const j of jobs) {
    const src = SOURCE_LABEL[j.source] || j.source || '?';
    msg += '<b>' + j.position + '</b>\\n';
    msg += j.company + ' | ' + j.location + '\\n';
    if (j.salary) msg += j.salary + '\\n';
    msg += (j.agoTime || j.date || '') + ' | ' + j.searchKeyword + '\\n';
    if (j.jobUrl) msg += '<a href="' + j.jobUrl + '">Voir sur ' + src + '</a>\\n';
    msg += '\\n';
  }
  results.push({ json: { chatId: '387442030', message: msg, jobCount: jobs.length } });
}
if (results.length === 0) {
  results.push({ json: { chatId: '387442030', message: '', jobCount: 0 } });
}
return results;`;

const ftCredsCode = 'return [{ json: { client_id: "REPLACE_ME", client_secret: "REPLACE_ME" } }];';

// Helper: stringify a JS string for embedding in template
const J = s => JSON.stringify(s);

// Build the SDK code
const sdk = `import { workflow, node, trigger, merge, ifElse } from '@n8n/workflow-sdk';

const every7Min = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.3,
  config: {
    name: 'Every 7 Minutes',
    parameters: ${JSON.stringify(trigNode.parameters)},
    position: [192, 272]
  }
});

const configFilters = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Config Filters',
    parameters: { jsCode: ${J(configNode.parameters.jsCode)} },
    position: [432, 304]
  }
});

const linkedinSearch = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'LinkedIn Job Search',
    parameters: { jsCode: ${J(linkedinCode)} },
    position: [656, 304],
    onError: 'continueRegularOutput'
  }
});

const helloworkSearch = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'HelloWork Job Search',
    parameters: { jsCode: ${J(helloworkCode)} },
    position: [656, 480],
    onError: 'continueRegularOutput'
  }
});

const apecSearch = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'APEC Job Search',
    parameters: { jsCode: ${J(apecCode)} },
    position: [656, 656],
    onError: 'continueRegularOutput'
  }
});

const ftCredentials = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'FT Credentials',
    parameters: { jsCode: ${J(ftCredsCode)} },
    position: [432, 832]
  }
});

const ftSearch = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'France Travail Job Search',
    parameters: { jsCode: ${J(ftCode)} },
    position: [656, 832],
    onError: 'continueRegularOutput'
  }
});

const mergeAll = merge({
  version: 3.2,
  config: {
    name: 'Merge All Sources',
    parameters: { mode: 'append' },
    position: [880, 480]
  }
});

const checkDuplicates = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Check Duplicates',
    parameters: ${JSON.stringify(dupesNode.parameters)},
    position: [1100, 304]
  }
});

const groupByType = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Group by Type',
    parameters: { jsCode: ${J(groupCode)} },
    position: [1328, 304]
  }
});

const saveNewJobs = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Save New Jobs',
    parameters: ${JSON.stringify(saveNode.parameters)},
    position: [1344, 480]
  }
});

const hasNewJobs = ifElse({
  version: 2.3,
  config: {
    name: 'Has New Jobs',
    parameters: ${JSON.stringify(ifNode.parameters)},
    position: [1552, 304]
  }
});

const sendTelegram = node({
  type: 'n8n-nodes-base.telegram',
  version: 1.2,
  config: {
    name: 'Send to Telegram',
    parameters: ${JSON.stringify(telegramNode.parameters)},
    position: [1808, 192]
  }
});

export default workflow('${liveWf.id}', 'LinkedIn Job Search — Auto 7min')
  .add(every7Min)
  .to(configFilters)
  .to(linkedinSearch.to(mergeAll.input(0)))
  .add(configFilters)
  .to(helloworkSearch.to(mergeAll.input(1)))
  .add(configFilters)
  .to(apecSearch.to(mergeAll.input(2)))
  .add(configFilters)
  .to(ftCredentials.to(ftSearch.to(mergeAll.input(3))))
  .add(mergeAll)
  .to(checkDuplicates)
  .to(saveNewJobs)
  .add(checkDuplicates)
  .to(groupByType)
  .to(hasNewJobs.onTrue(sendTelegram));
`;

fs.writeFileSync('/tmp/workflow.sdk.js', sdk);
console.log('SDK written, length:', sdk.length);
console.log('first 600 chars:');
console.log(sdk.slice(0, 600));
