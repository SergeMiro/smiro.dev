// Vercel Edge function — agent sandbox proxy to Gemini.
// Rate limit: per-IP sliding window, 5 messages / hour.
// System prompt comes from the client (source-of-truth is bundled on /agents page)
// but we cap prompt size to keep token usage sane.

export const config = { runtime: 'edge' };

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const MAX_SYSTEM_PROMPT_CHARS = 6000;
const MAX_USER_MESSAGE_CHARS = 1500;
const MAX_HISTORY_MESSAGES = 8;

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

// Naive in-memory sliding-window; one edge instance = one bucket.
// Good enough for a portfolio demo; real abuse would need KV.
const bucket = new Map<string, number[]>();

function rateLimit(ip: string): { ok: boolean; remaining: number; resetInMs: number } {
  const now = Date.now();
  const hits = bucket.get(ip) || [];
  const pruned = hits.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (pruned.length >= RATE_LIMIT_MAX) {
    const oldest = pruned[0];
    return { ok: false, remaining: 0, resetInMs: RATE_LIMIT_WINDOW_MS - (now - oldest) };
  }
  pruned.push(now);
  bucket.set(ip, pruned);
  return { ok: true, remaining: RATE_LIMIT_MAX - pruned.length, resetInMs: RATE_LIMIT_WINDOW_MS };
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return json({ error: 'GEMINI_API_KEY not configured' }, 503);
  }

  let body: {
    agentSlug?: string;
    agentName?: string;
    systemPrompt?: string;
    messages?: ChatMessage[];
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid json' }, 400);
  }

  const systemPrompt = (body.systemPrompt ?? '').slice(0, MAX_SYSTEM_PROMPT_CHARS).trim();
  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (!systemPrompt || messages.length === 0) {
    return json({ error: 'systemPrompt and messages are required' }, 400);
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'anon';
  const rate = rateLimit(ip);
  if (!rate.ok) {
    return json(
      {
        error: 'rate_limit',
        message: `Demo limit reached (${RATE_LIMIT_MAX}/hour). Try again in ${Math.ceil(rate.resetInMs / 60000)} min.`,
      },
      429
    );
  }

  const trimmedHistory = messages
    .slice(-MAX_HISTORY_MESSAGES)
    .map((m) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content.slice(0, MAX_USER_MESSAGE_CHARS) }],
    }));

  const geminiBody = {
    systemInstruction: {
      parts: [
        {
          text:
            `${systemPrompt}\n\n---\n\nIMPORTANT DEMO CONSTRAINTS:\n` +
            `- You are running inside a portfolio sandbox. Keep replies under 400 words.\n` +
            `- You have NO tool access in this demo — describe what you would do instead of doing it.\n` +
            `- If asked to write a lot of code, give a small representative example + high-level outline.\n` +
            `- Never mention that you are Gemini; stay in the role described above.`,
        },
      ],
    },
    contents: trimmedHistory,
    generationConfig: {
      maxOutputTokens: 600,
      temperature: 0.7,
      topP: 0.95,
    },
    safetySettings: [],
  };

  const dgRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
    }
  );

  if (!dgRes.ok || !dgRes.body) {
    const detail = await dgRes.text().catch(() => '');
    return json({ error: 'gemini_error', status: dgRes.status, detail: detail.slice(0, 500) }, 502);
  }

  const stream = new ReadableStream({
    async start(controller) {
      const reader = dgRes.body!.getReader();
      const decoder = new TextDecoder();
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
            try {
              const obj = JSON.parse(payload);
              const text = obj?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (typeof text === 'string') {
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ delta: text })}\n\n`));
              }
              const finish = obj?.candidates?.[0]?.finishReason;
              if (finish && finish !== 'STOP') {
                controller.enqueue(
                  new TextEncoder().encode(`data: ${JSON.stringify({ warn: `finished: ${finish}` })}\n\n`)
                );
              }
            } catch {
              // swallow malformed chunks
            }
          }
        }
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ done: true, remaining: rate.remaining })}\n\n`));
      } catch (e) {
        controller.enqueue(
          new TextEncoder().encode(`data: ${JSON.stringify({ error: String(e) })}\n\n`)
        );
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
    },
  });
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
