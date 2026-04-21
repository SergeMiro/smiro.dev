// Vercel serverless function — Deepgram Aura TTS proxy.
// Keeps DEEPGRAM_API_KEY server-side; returns audio/mpeg bytes.
// Deployed automatically from /api/*.ts (no Astro adapter needed).

const VOICES_EN = [
  'aura-asteria-en',
  'aura-luna-en',
  'aura-stella-en',
  'aura-athena-en',
  'aura-hera-en',
  'aura-orion-en',
  'aura-arcas-en',
  'aura-perseus-en',
  'aura-angus-en',
  'aura-orpheus-en',
  'aura-helios-en',
  'aura-zeus-en',
];

function pickVoice(lang: string | undefined): string {
  const l = (lang ?? 'en-US').toLowerCase();
  // Deepgram Aura currently ships English voices; non-English falls back to Asteria
  // and the client will use Web Speech if this proxy 4xxs.
  if (l.startsWith('en')) return 'aura-asteria-en';
  return 'aura-asteria-en';
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
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) {
    return new Response(
      JSON.stringify({ error: 'DEEPGRAM_API_KEY not configured' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body: { text?: string; lang?: string; voice?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const text = (body.text ?? '').trim();
  if (!text) {
    return new Response(JSON.stringify({ error: 'text is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (text.length > 2000) {
    return new Response(JSON.stringify({ error: 'text exceeds 2000 chars — chunk client-side' }), {
      status: 413,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const requestedVoice = body.voice && VOICES_EN.includes(body.voice) ? body.voice : pickVoice(body.lang);

  const dgRes = await fetch(`https://api.deepgram.com/v1/speak?model=${requestedVoice}&encoding=mp3`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!dgRes.ok) {
    const detail = await dgRes.text().catch(() => '');
    return new Response(
      JSON.stringify({ error: 'Deepgram upstream error', status: dgRes.status, detail: detail.slice(0, 500) }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(dgRes.body, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

export const config = { runtime: 'edge' };
