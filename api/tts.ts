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

// The avatar is Sergiy, so it speaks with a man's voice. Every Aura model costs
// the same, so this is a casting decision, not a billing one: arcas is the
// conversational male American voice — orion is warmer, zeus heavier, helios
// British, and any of them can still be requested per call via `voice`.
const MALE_EN = 'aura-arcas-en';

function pickVoice(lang: string | undefined): string {
  const l = (lang ?? 'en-US').toLowerCase();
  // Aura's own voices are English; a non-English request goes through findVoice(),
  // which asks Deepgram what it actually speaks, and the client falls back to Web
  // Speech when the answer is "nothing".
  if (l.startsWith('en')) return MALE_EN;
  return MALE_EN;
}

// An English voice reading French is worse than no voice at all — the browser's
// own French synthesis takes over instead. So for a non-English request we ask
// Deepgram what it actually speaks rather than guessing a model name: if it has
// a voice for that language we use it, otherwise we hand the job back with 415
// and the client falls back to Web Speech.
let voiceIndex: Record<string, string> | null = null;

// Deepgram tags each TTS model with the voice's gender. The wording has changed
// between Aura generations, so match on anything that means "male" rather than on
// one exact token — and if a language only offers feminine voices, take what there
// is instead of going silent over a casting preference.
const MALE_TAG = /\b(masculine|male|man)\b/i;

function isMale(m: { metadata?: { tags?: string[] }; tags?: string[] }): boolean {
  const tags = [...(m.metadata?.tags ?? []), ...(m.tags ?? [])];
  return tags.some((t) => MALE_TAG.test(t));
}

async function findVoice(key: string, lang: string): Promise<string | null> {
  const want = lang.slice(0, 2).toLowerCase();
  if (!voiceIndex) {
    try {
      const res = await fetch('https://api.deepgram.com/v1/models', {
        headers: { Authorization: `Token ${key}` },
      });
      if (!res.ok) return null;
      const data = (await res.json()) as {
        tts?: Array<{
          canonical_name?: string;
          name?: string;
          languages?: string[];
          tags?: string[];
          metadata?: { tags?: string[] };
        }>;
      };
      const index: Record<string, string> = {};
      const male: Record<string, string> = {};
      for (const m of data.tts ?? []) {
        const id = m.canonical_name || m.name;
        if (!id) continue;
        for (const l of m.languages ?? []) {
          const two = l.slice(0, 2).toLowerCase();
          if (!index[two]) index[two] = id;
          if (isMale(m) && !male[two]) male[two] = id;
        }
      }
      // a male voice per language where one exists, otherwise the first voice
      voiceIndex = { ...index, ...male };
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
