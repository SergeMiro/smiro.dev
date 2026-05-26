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
const lbbCode    = read('lbb-fetch.js');
const ftCredsPlaceholder = 'return [{ json: { client_id: "REPLACE_ME", client_secret: "REPLACE_ME" } }];';

const J = s => JSON.stringify(s);

const sdk = `import { workflow, node, trigger, ifElse, merge } from '@n8n/workflow-sdk';

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

const ftCredentials = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'FT Credentials',
    parameters: { jsCode: ${J(ftCredsPlaceholder)} },
    position: [432, 480]
  }
});

const lbbFetch = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'LBB Fetch',
    parameters: { jsCode: ${J(lbbCode)} },
    position: [656, 480],
    onError: 'continueRegularOutput'
  }
});

const mergeAll = merge({
  version: 3.2,
  config: {
    name: 'Merge Sources',
    parameters: { mode: 'append' },
    position: [800, 392]
  }
});

const dedup = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Dedup by SIREN',
    parameters: { jsCode: ${J(dedupCode)} },
    position: [1024, 392]
  }
});

const formatTg = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Format Telegram Prospects',
    parameters: { jsCode: ${J(formatCode)} },
    position: [1248, 392]
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
    position: [1472, 392]
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
    position: [1728, 280]
  }
});

export default workflow('job-prospect', 'Job Prospect — Auto 1h')
  .add(everyHour)
  .to(configTargets)
  .to(rechFetch.to(mergeAll.input(0)))
  .add(configTargets)
  .to(ftCredentials.to(lbbFetch.to(mergeAll.input(1))))
  .add(mergeAll)
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
    // Inject real FT creds from the job_autosearch workflow (single source of truth
    // on the server; this repo stays clean of secrets).
    const FT_DONOR_WORKFLOW = '2Zpk5qEVwjbHHnXk';
    let sdkPatched = sdk;
    try {
      console.log('[creds] pulling FT Credentials from donor workflow…');
      const donor = (await mcp('get_workflow_details', { workflowId: FT_DONOR_WORKFLOW })).workflow;
      const donorNode = (donor.nodes || []).find(n => n.name === 'FT Credentials');
      const donorJs = donorNode?.parameters?.jsCode || '';
      const idM = donorJs.match(/client_id:\s*"([^"]+)"/);
      const secM = donorJs.match(/client_secret:\s*"([^"]+)"/);
      if (idM && secM && idM[1] !== 'REPLACE_ME' && secM[1] !== 'REPLACE_ME') {
        // SDK text has the placeholder as a JSON-stringified literal, e.g.
        //   parameters: { jsCode: "return [{ json: { client_id: \"REPLACE_ME\", ... } }];" }
        // so we substitute the JSON-stringified form on both sides.
        const oldEscaped = JSON.stringify(ftCredsPlaceholder);
        const newEscaped = JSON.stringify(
          `return [{ json: { client_id: "${idM[1]}", client_secret: "${secM[1]}" } }];`
        );
        if (!sdk.includes(oldEscaped)) throw new Error('placeholder literal not found in SDK');
        sdkPatched = sdk.replace(oldEscaped, newEscaped);
        console.log(`  ✓ injected (client_id=${idM[1].slice(0,30)}…)`);
      } else {
        console.log('  ⚠ donor has placeholder too — pushing with REPLACE_ME (LBB branch will skip)');
      }
    } catch (e) {
      console.log('  ⚠ cred fetch failed, pushing with placeholder:', e.message);
    }

    console.log('[validate]…');
    const v = await mcp('validate_workflow', { code: sdkPatched });
    console.log(`  valid=${v.valid} nodeCount=${v.nodeCount} warnings=${(v.warnings||[]).length}`);
    if (!v.valid) { console.error(v); process.exit(1); }
    console.log('[update]…');
    const u = await mcp('update_workflow', { workflowId: WORKFLOW_ID, code: sdkPatched });
    console.log(`  → ${u.url}`);
    console.log('[publish]…');
    const p = await mcp('publish_workflow', { workflowId: WORKFLOW_ID });
    console.log(`  activeVersionId=${p.activeVersionId}`);
    console.log('done.');
  })().catch(e => { console.error('PUSH FAILED:', e.message); process.exit(1); });
}
