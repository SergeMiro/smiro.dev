// Vercel serverless function — the avatar's voice.
// Keeps DEEPGRAM_API_KEY and GEMINI_API_KEY server-side; returns audio bytes.
// Deployed automatically from /api/*.ts (no Astro adapter needed).
//
// Two providers, in this order:
//   Gemini  — French only, because it is the only way to give the avatar a French
//             male voice that is not Hector: Deepgram ships exactly two French
//             voices, agathe (feminine) and hector. Slower (a few seconds a
//             sentence) and rate-limited on the free tier.
//   Deepgram — everything else, and the safety net under Gemini. Fast.
// Whichever answers is named in the X-TTS-Voice header, so a wrong-sounding voice
// can be identified without listening to the bytes.

// Voices a caller may ask for by name. Aura-2 is the current generation and the
// only one with voices outside English; the first-generation `aura-*` ids stay
// callable so an older link or console experiment does not 400.
const VOICES = [
  // Aura-2, masculine, English
  'aura-2-odysseus-en',
  'aura-2-apollo-en',
  'aura-2-arcas-en',
  'aura-2-orion-en',
  'aura-2-orpheus-en',
  'aura-2-neptune-en',
  'aura-2-mars-en',
  'aura-2-zeus-en',
  // Aura-2, masculine, other languages
  'aura-2-hector-fr',
  // first generation, English only
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
// the same, so this is a casting decision, not a billing one: odysseus is the
// calm, professional male American voice of the second generation — apollo is
// more casual, mars and zeus are baritones, orion politer. It replaces
// first-generation arcas, which was thinner and a little brisk.
const MALE_EN = 'aura-2-odysseus-en';

// Casting for the languages Deepgram actually speaks, so the choice is made here
// rather than by whatever order /v1/models happens to return. French has exactly
// two Aura-2 voices — agathe (feminine) and hector — so hector is not a
// preference, it is the whole male French catalogue.
const MALE_BY_LANG: Record<string, string> = {
  en: MALE_EN,
  fr: 'aura-2-hector-fr',
};

// ── Gemini: the French voice ─────────────────────────────────────────────────
// Charon is a calm, informative male voice; the language is not requested, it is
// read off the text, which suits a site that answers in whatever language it was
// asked in. Swap the name to recast: Iapetus is clearer, Achird friendlier,
// Algieba smoother, Orus firmer — all masculine.
const GEMINI_MODEL = 'gemini-2.5-flash-preview-tts';
const GEMINI_VOICE = 'Charon';
// Where Gemini is preferred over Deepgram. Only French: English has a whole
// Aura-2 catalogue to cast from and Deepgram answers in about a second.
const GEMINI_LANGS = new Set(['fr']);
// The client sends one sentence at a time (220 chars before it forces a cut), so
// this is a guard against a pasted wall of text, not a normal path: a long
// request would spend a minute generating and blow the function's budget.
const GEMINI_MAX_CHARS = 700;
const GEMINI_TIMEOUT_MS = 20_000;

// The model is a chat model wearing a TTS hat, and a bare short line reads to it
// as something to answer rather than something to say: "Bonjour." comes back 400
// ("Model tried to generate text, but it should only be used for TTS"), and
// "Oui." comes back 200 with zero bytes of audio. An explicit instruction settles
// it — measured: with this prefix "Bonjour." speaks in 1.21 s, and the prefix
// itself is not read aloud. It is French because French is the only language
// routed here; Gemini takes the spoken language from the text, so an English
// instruction over a French line would be arguing with itself.
const GEMINI_READ_ALOUD = 'Lis ce texte à voix haute, mot pour mot : ';
// Shorter than an eighth of a second is not a spoken sentence. It is the empty
// answer above, which would otherwise reach the visitor as a valid, silent WAV
// and drop the sentence without a sound.
const GEMINI_MIN_PCM_BYTES = 6000;   // 24 kHz × 16 bit mono ≈ 48 000 bytes a second

// Gemini hands back raw signed 16-bit little-endian PCM, mono, at the rate named
// in its own mimeType (`audio/L16;codec=pcm;rate=24000`). No browser plays that,
// so it gets the 44-byte RIFF header that makes it a WAV file.
function wavFromPcm(pcm: Uint8Array, rate: number): ArrayBuffer {
  const buf = new ArrayBuffer(44 + pcm.length);
  const out = new Uint8Array(buf);
  const view = new DataView(buf);
  const ascii = (at: number, s: string) => {
    for (let i = 0; i < s.length; i++) out[at + i] = s.charCodeAt(i);
  };
  ascii(0, 'RIFF');
  view.setUint32(4, 36 + pcm.length, true); // size of everything after this field
  ascii(8, 'WAVE');
  ascii(12, 'fmt ');
  view.setUint32(16, 16, true);             // fmt chunk length
  view.setUint16(20, 1, true);              // 1 = uncompressed PCM
  view.setUint16(22, 1, true);              // mono
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);       // bytes per second: rate × 1 channel × 2 bytes
  view.setUint16(32, 2, true);              // bytes per frame
  view.setUint16(34, 16, true);             // bits per sample
  ascii(36, 'data');
  view.setUint32(40, pcm.length, true);
  out.set(pcm, 44);
  return buf;
}

// null means "not this time" for every reason there is — no key, rate-limited,
// timed out, an empty candidate. The caller falls through to Deepgram, so none of
// them is worth telling the visitor about.
async function geminiSpeak(text: string, key: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
        body: JSON.stringify({
          contents: [{ parts: [{ text: GEMINI_READ_ALOUD + text }] }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: GEMINI_VOICE } } },
          },
        }),
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> } }>;
    };
    const part = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (!part?.data) return null;
    const rate = Number(/rate=(\d+)/.exec(part.mimeType ?? '')?.[1]) || 24000;
    const raw = atob(part.data);
    if (raw.length < GEMINI_MIN_PCM_BYTES) return null;   // silence is not an answer
    const pcm = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) pcm[i] = raw.charCodeAt(i);
    return wavFromPcm(pcm, rate);
  } catch {
    return null;
  }
}

// An English voice reading French is worse than no voice at all — the browser's
// own French synthesis takes over instead. So for a non-English request we ask
// Deepgram what it actually speaks rather than guessing a model name: if it has
// a voice for that language we use it, otherwise we hand the job back with 415
// and the client falls back to Web Speech. The cast above wins whenever the
// account really exposes that model, so a voice can be changed here without
// waiting to see how /v1/models is ordered that day.
let voiceIndex: Record<string, string> | null = null;
let voicesExposed: Set<string> = new Set();

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
      const exposed = new Set<string>();
      for (const m of data.tts ?? []) {
        const id = m.canonical_name || m.name;
        if (!id) continue;
        exposed.add(id);
        for (const l of m.languages ?? []) {
          const two = l.slice(0, 2).toLowerCase();
          if (!index[two]) index[two] = id;
          if (isMale(m) && !male[two]) male[two] = id;
        }
      }
      // a male voice per language where one exists, otherwise the first voice
      voiceIndex = { ...index, ...male };
      voicesExposed = exposed;
    } catch {
      return null;
    }
  }
  const cast = MALE_BY_LANG[want];
  if (cast && voicesExposed.has(cast)) return cast;
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
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!key && !geminiKey) {
    return new Response(
      JSON.stringify({ error: 'no TTS provider configured — set DEEPGRAM_API_KEY or GEMINI_API_KEY' }),
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

  // Gemini gets first refusal on the languages it is cast for. A caller who named
  // a Deepgram voice is asking for that voice, so it is left alone.
  if (geminiKey && !body.voice && GEMINI_LANGS.has(lang.slice(0, 2)) && text.length <= GEMINI_MAX_CHARS) {
    const audio = await geminiSpeak(text, geminiKey);
    if (audio) {
      return new Response(audio, {
        status: 200,
        headers: {
          'Content-Type': 'audio/wav',
          'Cache-Control': 'public, max-age=3600',
          'X-TTS-Voice': `gemini/${GEMINI_VOICE}`,
        },
      });
    }
    // Falling through is the point: hector is the second-choice casting, and a
    // second-choice voice beats the browser's robot or silence.
  }

  if (!key) {
    return new Response(
      JSON.stringify({ error: 'no_voice', lang, message: 'No TTS voice for this language — speak it in the browser.' }),
      { status: 415, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let requestedVoice: string;
  if (body.voice && VOICES.includes(body.voice)) {
    requestedVoice = body.voice;
  } else if (lang.startsWith('en')) {
    // Same lookup as every other language, but English can never come up empty:
    // if the model list is unreachable, or the cast above is not on this account,
    // the first-choice id still speaks English and Deepgram will say so.
    requestedVoice = (await findVoice(key, lang)) ?? MALE_EN;
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
