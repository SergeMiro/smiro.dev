// Vercel Edge function — agent sandbox with multi-provider streaming.
//
// Supported providers (env vars):
//   OPENROUTER_API_KEY  → free GLM, DeepSeek, Qwen, Llama via openrouter.ai (OpenAI-compatible)
//   GROQ_API_KEY        → ultra-fast Llama / Qwen via groq.com (OpenAI-compatible)
//   GEMINI_API_KEY      → Google Gemini 2.5 Flash (Google REST)
//
// Client picks `model` per request. We keep one shared SSE proxy that
// adapts each upstream's chunk shape into a single `{delta, done}` stream.

export const config = { runtime: 'edge' };

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const MAX_SYSTEM_PROMPT_CHARS = 6000;
const MAX_USER_MESSAGE_CHARS = 1500;
const MAX_HISTORY_MESSAGES = 8;

interface ChatMessage {
  role: 'user' | 'model' | 'assistant';
  content: string;
}

type ProviderId = 'openrouter' | 'groq' | 'gemini';

interface ModelDef {
  id: string;            // model id we expose to the client
  upstreamId: string;    // model id sent to provider
  provider: ProviderId;
  label: string;
  free: boolean;
}

const MODELS: ModelDef[] = [
  { id: 'glm-4.5-air',     upstreamId: 'z-ai/glm-4.5-air:free',                  provider: 'openrouter', label: 'GLM 4.5 Air',           free: true },
  { id: 'deepseek-v3.1',   upstreamId: 'deepseek/deepseek-chat-v3.1:free',       provider: 'openrouter', label: 'DeepSeek V3.1',         free: true },
  { id: 'qwen3-coder',     upstreamId: 'qwen/qwen3-coder:free',                  provider: 'openrouter', label: 'Qwen3 Coder',           free: true },
  { id: 'llama-3.3-70b',   upstreamId: 'meta-llama/llama-3.3-70b-instruct:free', provider: 'openrouter', label: 'Llama 3.3 70B',         free: true },
  { id: 'groq-llama-3.3',  upstreamId: 'llama-3.3-70b-versatile',                provider: 'groq',       label: 'Llama 3.3 70B (Groq)',  free: true },
  { id: 'gemini-2.5-flash',upstreamId: 'gemini-2.5-flash',                       provider: 'gemini',     label: 'Gemini 2.5 Flash',      free: true },
];

const DEFAULT_MODEL_ID = 'glm-4.5-air';

const PROVIDER_ENV: Record<ProviderId, string> = {
  openrouter: 'OPENROUTER_API_KEY',
  groq: 'GROQ_API_KEY',
  gemini: 'GEMINI_API_KEY',
};

const bucket = new Map<string, number[]>();
function rateLimit(ip: string) {
  const now = Date.now();
  const hits = (bucket.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (hits.length >= RATE_LIMIT_MAX) {
    return { ok: false as const, remaining: 0, resetInMs: RATE_LIMIT_WINDOW_MS - (now - hits[0]) };
  }
  hits.push(now);
  bucket.set(ip, hits);
  return { ok: true as const, remaining: RATE_LIMIT_MAX - hits.length, resetInMs: RATE_LIMIT_WINDOW_MS };
}

function pickFallbackModel(): ModelDef | null {
  for (const m of MODELS) {
    if (process.env[PROVIDER_ENV[m.provider]]) return m;
  }
  return null;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // GET /api/agent-chat → list models that are actually wired up
  if (req.method === 'GET') {
    const available = MODELS.map((m) => ({
      ...m,
      ready: !!process.env[PROVIDER_ENV[m.provider]],
    }));
    return json({ models: available, default: DEFAULT_MODEL_ID });
  }

  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  let body: {
    agentSlug?: string;
    agentName?: string;
    systemPrompt?: string;
    messages?: ChatMessage[];
    model?: string;
  };
  try { body = await req.json(); } catch { return json({ error: 'invalid json' }, 400); }

  const systemPrompt = (body.systemPrompt ?? '').slice(0, MAX_SYSTEM_PROMPT_CHARS).trim();
  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (!systemPrompt || messages.length === 0) {
    return json({ error: 'systemPrompt and messages are required' }, 400);
  }

  // Pick model: requested → fallback to first wired-up model
  const requested = MODELS.find((m) => m.id === (body.model || DEFAULT_MODEL_ID));
  const wiredUp = requested && process.env[PROVIDER_ENV[requested.provider]] ? requested : pickFallbackModel();
  if (!wiredUp) {
    return json({ error: 'no_provider_configured', message: 'No LLM provider is configured. Set OPENROUTER_API_KEY, GROQ_API_KEY, or GEMINI_API_KEY.' }, 503);
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'anon';
  const rate = rateLimit(ip);
  if (!rate.ok) {
    return json({
      error: 'rate_limit',
      message: `Demo limit reached (${RATE_LIMIT_MAX}/hour). Try again in ${Math.ceil(rate.resetInMs / 60000)} min.`,
    }, 429);
  }

  // Trim history
  const history = messages
    .slice(-MAX_HISTORY_MESSAGES)
    .map((m) => ({ role: m.role === 'model' ? 'assistant' : m.role, content: m.content.slice(0, MAX_USER_MESSAGE_CHARS) }));

  const fullSystem =
    `${systemPrompt}\n\n---\n\nDEMO CONSTRAINTS:\n` +
    `- You run inside a portfolio sandbox. Keep replies under 400 words.\n` +
    `- You have NO tool access in this demo — describe what you would do instead of doing it.\n` +
    `- For coding tasks: small representative example + high-level outline.\n` +
    `- Stay in the role above; never mention which model you are.`;

  const apiKey = process.env[PROVIDER_ENV[wiredUp.provider]]!;
  let upstream: Response;

  try {
    if (wiredUp.provider === 'openrouter' || wiredUp.provider === 'groq') {
      const endpoint =
        wiredUp.provider === 'openrouter'
          ? 'https://openrouter.ai/api/v1/chat/completions'
          : 'https://api.groq.com/openai/v1/chat/completions';

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      };
      if (wiredUp.provider === 'openrouter') {
        headers['HTTP-Referer'] = 'https://smiro.dev';
        headers['X-Title'] = 'smiro.dev agent sandbox';
      }

      upstream = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: wiredUp.upstreamId,
          stream: true,
          max_tokens: 600,
          temperature: 0.7,
          messages: [{ role: 'system', content: fullSystem }, ...history],
        }),
      });
    } else {
      // Gemini REST streaming
      const geminiHistory = history.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));
      upstream = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${wiredUp.upstreamId}:streamGenerateContent?alt=sse&key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: fullSystem }] },
            contents: geminiHistory,
            generationConfig: { maxOutputTokens: 600, temperature: 0.7, topP: 0.95 },
          }),
        }
      );
    }
  } catch (e) {
    return json({ error: 'upstream_fetch_failed', detail: String(e) }, 502);
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => '');
    return json({ error: 'upstream_error', status: upstream.status, detail: detail.slice(0, 500) }, 502);
  }

  // Adapter: parse upstream SSE chunk → text delta
  const parseChunk = (payload: string): string | null => {
    try {
      const obj = JSON.parse(payload);
      // OpenAI-compatible
      const oaText = obj?.choices?.[0]?.delta?.content;
      if (typeof oaText === 'string') return oaText;
      // Gemini
      const gText = obj?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof gText === 'string') return gText;
    } catch {}
    return null;
  };

  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader();
      const decoder = new TextDecoder();
      const enc = new TextEncoder();
      let buf = '';
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() || '';
          for (const raw of lines) {
            const line = raw.trim();
            if (!line.startsWith('data:')) continue;
            const payload = line.slice(5).trim();
            if (!payload || payload === '[DONE]') continue;
            const delta = parseChunk(payload);
            if (delta) controller.enqueue(enc.encode(`data: ${JSON.stringify({ delta })}\n\n`));
          }
        }
        controller.enqueue(enc.encode(`data: ${JSON.stringify({ done: true, remaining: rate.remaining, model: wiredUp.id })}\n\n`));
      } catch (e) {
        controller.enqueue(enc.encode(`data: ${JSON.stringify({ error: String(e) })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-RateLimit-Remaining': String(rate.remaining),
      'X-Model-Used': wiredUp.id,
    },
  });
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
