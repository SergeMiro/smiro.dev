// Build n8n Workflow SDK code for the job_prospect workflow.
//
// Usage:
//   node scripts/build_sdk.cjs           → regenerate /tmp/job_prospect.sdk.js only
//   node scripts/build_sdk.cjs --push    → also validate + update + publish via n8n MCP
//
// MCP token is read from $MCP_TOK or, failing that, from ~/.claude.json
// (any project with mcpServers.n8n).
const fs = require('fs');
const path = require('path');
const https = require('https');

const WORKFLOW_ID = 'TEvyg76X8keK4y4j';
const MCP_URL = process.env.MCP_URL || 'https://n8n.smiro.dev/mcp-server/http';

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

// --- optional: push via n8n MCP -----------------------------------------
if (process.argv.includes('--push')) {
  const readToken = () => {
    if (process.env.MCP_TOK) return process.env.MCP_TOK;
    const cj = JSON.parse(fs.readFileSync(`${process.env.HOME}/.claude.json`, 'utf8'));
    for (const p of Object.values(cj.projects || {})) {
      const n = (p.mcpServers || {}).n8n;
      if (n?.headers?.Authorization) return n.headers.Authorization;
    }
    throw new Error('MCP token not found in env or ~/.claude.json');
  };
  const mcp = (name, args) => new Promise((resolve, reject) => {
    const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } });
    const u = new URL(MCP_URL);
    const req = https.request({
      method: 'POST', hostname: u.hostname, port: 443, path: u.pathname,
      headers: { Authorization: readToken(), 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream', 'Content-Length': Buffer.byteLength(body) },
    }, res => {
      let buf = '';
      res.on('data', d => buf += d);
      res.on('end', () => {
        const line = buf.split('\n').find(l => l.startsWith('data: '));
        if (!line) return reject(new Error('no data line: ' + buf.slice(0, 200)));
        try {
          const parsed = JSON.parse(line.slice(6));
          if (parsed.error) return reject(new Error(JSON.stringify(parsed.error)));
          const text = parsed.result?.content?.[0]?.text;
          resolve(text ? JSON.parse(text) : parsed.result);
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body); req.end();
  });

  (async () => {
    console.log('[validate]…');
    const v = await mcp('validate_workflow', { code: sdk });
    console.log(`  valid=${v.valid} nodeCount=${v.nodeCount} warnings=${(v.warnings||[]).length}`);
    if (!v.valid) { console.error(v); process.exit(1); }
    console.log('[update]…');
    const u = await mcp('update_workflow', { workflowId: WORKFLOW_ID, code: sdk });
    console.log(`  → ${u.url}`);
    console.log('[publish]…');
    const p = await mcp('publish_workflow', { workflowId: WORKFLOW_ID });
    console.log(`  activeVersionId=${p.activeVersionId}`);
    console.log('done.');
  })().catch(e => { console.error('PUSH FAILED:', e.message); process.exit(1); });
}
