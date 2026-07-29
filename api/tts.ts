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

// An English voice reading French is worse than no voice at all — the browser's
// own French synthesis takes over instead. So for a non-English request we ask
// Deepgram what it actually speaks rather than guessing a model name: if it has
// a voice for that language we use it, otherwise we hand the job back with 415
// and the client falls back to Web Speech.
let voiceIndex: Record<string, string> | null = null;

async function findVoice(key: string, lang: string): Promise<string | null> {
  const want = lang.slice(0, 2).toLowerCase();
  if (!voiceIndex) {
    try {
      const res = await fetch('https://api.deepgram.com/v1/models', {
        headers: { Authorization: `Token ${key}` },
      });
      if (!res.ok) return null;
      const data = (await res.json()) as {
        tts?: Array<{ canonical_name?: string; name?: string; languages?: string[] }>;
      };
      const index: Record<string, string> = {};
      for (const m of data.tts ?? []) {
        const id = m.canonical_name || m.name;
        if (!id) continue;
        for (const l of m.languages ?? []) {
          const two = l.slice(0, 2).toLowerCase();
          if (!index[two]) index[two] = id;
        }
      }
      voiceIndex = index;
    } catch {
      return null;
    }
  }
  return voiceIndex[want] ?? null;
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

  const lang = (body.lang ?? 'en-US').toLowerCase();
  let requestedVoice: string;
  if (body.voice && VOICES_EN.includes(body.voice)) {
    requestedVoice = body.voice;
  } else if (lang.startsWith('en')) {
    requestedVoice = pickVoice(lang);
  } else {
    const found = await findVoice(key, lang);
    if (!found) {
      return new Response(
        JSON.stringify({ error: 'no_voice', lang, message: 'No TTS voice for this language — speak it in the browser.' }),
        { status: 415, headers: { 'Content-Type': 'application/json' } }
      );
    }
    requestedVoice = found;
  }

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
      // which voice answered — the only way to tell a real French voice from an
      // English one reading French without listening to the bytes
      'X-TTS-Voice': requestedVoice,
    },
  });
}

export const config = { runtime: 'edge' };
