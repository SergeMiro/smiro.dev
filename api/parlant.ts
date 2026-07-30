/**
 * /api/parlant — the avatar's behaviour engine, proxied.
 *
 * Parlant runs on my VPS (parlant.smiro.dev) and decides *how* the avatar
 * answers: guidelines, a recruiter journey, a retriever over the dossier, and
 * hard refusals for salary/notice/visa questions. Its REST API ships without
 * auth, so Traefik only routes requests carrying X-Avatar-Key — which is why
 * this proxy exists: the browser never sees the secret and never talks to the
 * VPS directly.
 *
 * It answers in one shot rather than streaming, because Parlant emits whole
 * messages. If the engine has not produced the real reply inside DEADLINE_MS,
 * this returns 504 and the client falls back to /api/agent-chat — the free-tier
 * Gemini quota behind Parlant is 15 requests a minute and one turn spends about
 * a dozen, so "slow" is a normal state, not an outage.
 *
 * Env: PARLANT_URL (default https://parlant.smiro.dev), AVATAR_KEY.
 */

export const config = { runtime: 'edge' };

const BASE = (process.env.PARLANT_URL || 'https://parlant.smiro.dev').replace(/\/+$/, '');
const KEY = process.env.AVATAR_KEY || '';

const DEADLINE_MS = 9000;   // Vercel edge caps the invocation; stay well inside it
const POLL_MS = 700;
const MAX_QUESTION = 600;

// same shape as the sandbox's limiter: a portfolio page, not an API product
const RATE_LIMIT = 20;
const WINDOW_MS = 60 * 60 * 1000;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const seen = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (seen.length >= RATE_LIMIT) return true;
  seen.push(now);
  hits.set(ip, seen);
  if (hits.size > 4000) hits.clear();
  return false;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

async function call(path: string, init?: RequestInit) {
  const res = await fetch(BASE + path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Avatar-Key': KEY,
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`parlant ${path} → ${res.status}`);
  return res.json();
}

/** Parlant sends a short "__preamble__" message first; the answer is the one without it. */
function realReply(events: any[]): string | null {
  for (const e of events) {
    if (e?.kind !== 'message' || e?.source !== 'ai_agent') continue;
    const tags: string[] = e.data?.tags || [];
    if (tags.includes('__preamble__')) continue;
    const text = (e.data?.message || '').trim();
    if (text) return text;
  }
  return null;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (!KEY) return json({ error: 'not_configured' }, 503);

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (rateLimited(ip)) return json({ error: 'rate_limited' }, 429);

  let body: { message?: string; sessionId?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad_json' }, 400);
  }

  const message = (body.message || '').trim().slice(0, MAX_QUESTION);
  if (!message) return json({ error: 'empty' }, 400);

  const started = Date.now();
  try {
    let sessionId = body.sessionId;
    if (!sessionId) {
      const agents = (await call('/agents')) as any[];
      const agentId = agents?.[0]?.id;
      if (!agentId) return json({ error: 'no_agent' }, 502);
      const session = (await call('/sessions', {
        method: 'POST',
        body: JSON.stringify({ agent_id: agentId, allow_greeting: false }),
      })) as any;
      sessionId = session.id;
    }

    await call(`/sessions/${sessionId}/events`, {
      method: 'POST',
      body: JSON.stringify({ kind: 'message', source: 'customer', message }),
    });

    // poll until the real reply lands or we run out of the client's patience
    while (Date.now() - started < DEADLINE_MS) {
      await new Promise((r) => setTimeout(r, POLL_MS));
      const events = (await call(`/sessions/${sessionId}/events?min_offset=0`)) as any[];
      const reply = realReply(events);
      if (reply) {
        return json({ reply, sessionId, source: 'parlant', ms: Date.now() - started });
      }
    }

    // the session keeps generating; handing back its id lets a later question
    // reuse the same conversation instead of starting a third one
    return json({ error: 'slow', sessionId, ms: Date.now() - started }, 504);
  } catch (err: any) {
    return json({ error: 'upstream', message: String(err?.message || err) }, 502);
  }
}
