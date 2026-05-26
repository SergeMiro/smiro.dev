// Build n8n Workflow SDK code for the job_prospect workflow.
// Run from this folder: node scripts/build_sdk.js
const fs = require('fs');
const path = require('path');

const NODE_DIR = path.join(__dirname, '..', 'nodes');
const read = name => fs.readFileSync(path.join(NODE_DIR, name), 'utf8');

const configCode = read('config-targets.js');
const fetchCode  = read('rech-entreprises-fetch.js');
const dedupCode  = read('dedup-prospects.js');
const formatCode = read('format-telegram-prospects.js');

const J = s => JSON.stringify(s);

const sdk = `import { workflow, node, trigger, ifElse } from '@n8n/workflow-sdk';

const everyHour = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.3,
  config: {
    name: 'Every 1 Hour',
    parameters: { rule: { interval: [{ field: 'hours', hoursInterval: 1 }] } },
    position: [192, 304]
  }
});

const configTargets = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Config Targets',
    parameters: { jsCode: ${J(configCode)} },
    position: [432, 304]
  }
});

const rechFetch = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Recherche Entreprises Fetch',
    parameters: { jsCode: ${J(fetchCode)} },
    position: [656, 304],
    onError: 'continueRegularOutput'
  }
});

const dedup = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Dedup by SIREN',
    parameters: { jsCode: ${J(dedupCode)} },
    position: [880, 304]
  }
});

const formatTg = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Format Telegram Prospects',
    parameters: { jsCode: ${J(formatCode)} },
    position: [1104, 304]
  }
});

const hasNew = ifElse({
  version: 2.3,
  config: {
    name: 'Has New Prospects',
    parameters: {
      conditions: {
        conditions: [{
          leftValue: '={{ $json.jobCount }}',
          operator: { type: 'number', operation: 'gt' },
          rightValue: 0
        }]
      },
      options: {}
    },
    position: [1328, 304]
  }
});

const sendTelegram = node({
  type: 'n8n-nodes-base.telegram',
  version: 1.2,
  config: {
    name: 'Send to Telegram',
    parameters: {
      chatId: '={{ $json.chatId }}',
      text: '={{ $json.message }}',
      additionalFields: { appendAttribution: false, disable_web_page_preview: true, parse_mode: 'HTML' }
    },
    position: [1584, 192]
  }
});

export default workflow('job-prospect', 'Job Prospect — Auto 1h')
  .add(everyHour)
  .to(configTargets)
  .to(rechFetch)
  .to(dedup)
  .to(formatTg)
  .to(hasNew.onTrue(sendTelegram));
`;

const out = '/tmp/job_prospect.sdk.js';
fs.writeFileSync(out, sdk);
console.log('SDK written:', out, 'length:', sdk.length);
