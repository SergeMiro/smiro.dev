import { useState, useRef, useEffect, useCallback, type FC } from 'react';
import { insights, type Insight } from '../data/insights';

/* ═══════════════════════════════════════════════════
   TTS Reader — Deepgram Aura + Web Speech fallback
   ═══════════════════════════════════════════════════ */
const TTS_MAX_CHARS = 1800;

const stripMarkdown = (s: string) =>
  s.replace(/#{1,6}\s/g, '')
    .replace(/\*\*/g, '')
    .replace(/[_`]/g, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();

function splitIntoChunks(text: string, max = TTS_MAX_CHARS): string[] {
  const clean = stripMarkdown(text);
  if (clean.length <= max) return [clean];
  const sentences = clean.match(/[^.!?]+[.!?]+|\S+$/g) ?? [clean];
  const out: string[] = [];
  let buf = '';
  for (const s of sentences) {
    if ((buf + s).length > max) {
      if (buf) out.push(buf.trim());
      buf = s;
    } else buf += s;
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

const TTSReader: FC<{ text: string; lang: string }> = ({ text, lang }) => {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rate, setRate] = useState(1);
  const [progress, setProgress] = useState(0);
  const [usingAI, setUsingAI] = useState<boolean | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const queueRef = useRef<string[]>([]);
  const chunkIdxRef = useRef(0);
  const chunkUrlsRef = useRef<string[]>([]);

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (abortRef.current) abortRef.current.abort();
    chunkUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    chunkUrlsRef.current = [];
    queueRef.current = [];
    chunkIdxRef.current = 0;
    speechSynthesis.cancel();
  }, []);

  const stop = useCallback(() => {
    cleanup();
    setPlaying(false);
    setLoading(false);
    setProgress(0);
  }, [cleanup]);

  const playWebSpeech = useCallback(() => {
    const plain = stripMarkdown(text);
    const u = new SpeechSynthesisUtterance(plain);
    u.lang = lang;
    u.rate = rate;
    const voices = speechSynthesis.getVoices();
    const pref = voices.find(
      (v) =>
        v.lang.startsWith(lang.slice(0, 2)) &&
        (v.name.includes('Google') ||
          v.name.includes('Microsoft') ||
          v.name.includes('Samantha') ||
          v.name.includes('Daniel'))
    );
    if (pref) u.voice = pref;
    else {
      const fb = voices.find((v) => v.lang.startsWith(lang.slice(0, 2)));
      if (fb) u.voice = fb;
    }
    u.onend = () => {
      setPlaying(false);
      setProgress(0);
    };
    u.onboundary = (e) => {
      if (e.charIndex && plain.length) setProgress((e.charIndex / plain.length) * 100);
    };
    speechSynthesis.speak(u);
    setPlaying(true);
    setUsingAI(false);
  }, [text, lang, rate]);

  const playChunkAt = useCallback(
    async (idx: number) => {
      const chunks = queueRef.current;
      if (idx >= chunks.length) {
        setPlaying(false);
        setProgress(100);
        return;
      }
      chunkIdxRef.current = idx;

      let url = chunkUrlsRef.current[idx];
      if (!url) {
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        try {
          const res = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: chunks[idx], lang }),
            signal: ctrl.signal,
          });
          if (!res.ok) throw new Error(`TTS ${res.status}`);
          const blob = await res.blob();
          url = URL.createObjectURL(blob);
          chunkUrlsRef.current[idx] = url;
        } catch (err) {
          if ((err as Error).name !== 'AbortError') {
            console.warn('[TTS] falling back to Web Speech:', err);
            playWebSpeech();
          }
          return;
        }
      }

      const audio = new Audio(url);
      audio.playbackRate = rate;
      audioRef.current = audio;

      audio.addEventListener('timeupdate', () => {
        if (!audio.duration) return;
        const totalDur = chunks.length;
        const local = audio.currentTime / audio.duration;
        setProgress(((chunkIdxRef.current + local) / totalDur) * 100);
      });
      audio.addEventListener('ended', () => {
        playChunkAt(chunkIdxRef.current + 1);
      });
      audio.addEventListener('error', () => {
        console.warn('[TTS] audio error, falling back');
        playWebSpeech();
      });

      // Prefetch next chunk in parallel (lower latency between sentences)
      if (idx + 1 < chunks.length && !chunkUrlsRef.current[idx + 1]) {
        fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: chunks[idx + 1], lang }),
        })
          .then((r) => (r.ok ? r.blob() : null))
          .then((b) => {
            if (b) chunkUrlsRef.current[idx + 1] = URL.createObjectURL(b);
          })
          .catch(() => {});
      }

      await audio.play();
      setUsingAI(true);
      setPlaying(true);
      setLoading(false);
    },
    [lang, rate, playWebSpeech]
  );

  const play = useCallback(async () => {
    if (playing) {
      stop();
      return;
    }
    cleanup();
    setLoading(true);
    queueRef.current = splitIntoChunks(text);
    chunkIdxRef.current = 0;
    chunkUrlsRef.current = [];
    await playChunkAt(0);
  }, [playing, text, cleanup, stop, playChunkAt]);

  // Keep playbackRate in sync while playing
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = rate;
  }, [rate]);

  useEffect(() => () => cleanup(), [cleanup]);

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)]">
      <button
        onClick={play}
        disabled={loading}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-primary)] text-white hover:scale-105 active:scale-95 transition-transform flex-shrink-0 disabled:opacity-60"
        aria-label={playing ? 'Stop' : 'Play'}
      >
        {loading ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
            <path d="M21 12a9 9 0 11-6.2-8.55" strokeLinecap="round" />
          </svg>
        ) : playing ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className="h-1.5 rounded-full bg-[var(--color-surface-offset)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5 gap-2">
          <span className="text-[10px] text-[var(--color-text-faint)] font-mono uppercase tracking-wider flex items-center gap-1.5">
            {loading ? 'Loading…' : playing ? 'Reading…' : 'Listen to article'}
            {usingAI === true && !loading && (
              <span className="px-1.5 py-0.5 rounded text-[8px] bg-[var(--color-primary)] text-white tracking-wider">AI</span>
            )}
          </span>
          <div className="flex items-center gap-1">
            {[0.75, 1, 1.25, 1.5].map((r) => (
              <button
                key={r}
                onClick={() => setRate(r)}
                className={`px-1.5 py-0.5 rounded text-[9px] font-mono transition-colors ${
                  rate === r
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'text-[var(--color-text-faint)] hover:text-[var(--color-text-muted)]'
                }`}
              >
                {r}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   Article Reader Overlay
   ═══════════════════════════════════════════════════ */
const ArticleReader: FC<{ insight: Insight; onClose: () => void }> = ({ insight, onClose }) => {
  const [phase, setPhase] = useState<'entering' | 'open' | 'exiting'>('entering');
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setPhase('open'), 30);
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; clearTimeout(t); };
  }, []);

  const handleClose = useCallback(() => { setPhase('exiting'); setTimeout(onClose, 500); }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleClose]);

  const renderBody = (body: string) => body.split('\n').map((line, i) => {
    if (line.startsWith('## ')) return <h2 key={i} className="font-[var(--font-serif)] text-xl sm:text-2xl mt-8 mb-4" style={{ fontWeight: 400 }}>{line.replace('## ', '')}</h2>;
    if (line.startsWith('- **')) { const m = line.match(/^- \*\*(.+?)\*\*\s*[-—]\s*(.+)$/); if (m) return <div key={i} className="flex gap-3 pl-4 py-1.5"><span className="text-[var(--color-primary)] mt-0.5 flex-shrink-0">*</span><p><strong className="text-[var(--color-text)]">{m[1]}</strong> <span className="text-[var(--color-text-muted)]">— {m[2]}</span></p></div>; }
    if (line.startsWith('- ')) return <div key={i} className="flex gap-3 pl-4 py-1"><span className="text-[var(--color-primary)] mt-0.5 flex-shrink-0">*</span><p className="text-[var(--color-text-muted)]">{line.slice(2)}</p></div>;
    if (line.startsWith('"') || line.startsWith('\u201c')) return <blockquote key={i} className="border-l-2 border-[var(--color-primary)] pl-5 py-2 my-4 italic text-[var(--color-text-muted)]">{line}</blockquote>;
    if (line.trim() === '') return <div key={i} className="h-3" />;
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return <p key={i} className="text-[var(--color-text-muted)] leading-[1.85]">{parts.map((p, j) => p.startsWith('**') && p.endsWith('**') ? <strong key={j} className="text-[var(--color-text)] font-medium">{p.slice(2, -2)}</strong> : p)}</p>;
  });

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: phase === 'open' ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0)', backdropFilter: phase === 'open' ? 'blur(12px)' : 'blur(0px)', transition: 'all 0.5s ease' }}
      onClick={(e) => { if (e.target === overlayRef.current) handleClose(); }}>
      <div className="relative w-full max-w-3xl max-h-[92vh] mx-4 overflow-hidden rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border)]"
        style={{
          transform: phase === 'open' ? 'scale(1) rotateY(0deg)' : 'scale(0.7) rotateY(20deg)',
          opacity: phase === 'entering' ? 0 : phase === 'open' ? 1 : 0,
          boxShadow: phase === 'open' ? `0 40px 100px -20px rgba(0,0,0,0.6), 0 0 80px -20px ${insight.tagColor}40` : 'none',
          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${insight.cardBg}, ${insight.tagColor}, transparent)` }} />
        <div className="sticky top-0 z-10 px-6 sm:px-8 py-4 bg-[var(--color-bg)] border-b border-[var(--color-border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{insight.icon}</span>
              <div>
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase text-white mb-1" style={{ background: insight.tagColor }}>{insight.tag}</span>
                <p className="text-[11px] text-[var(--color-text-faint)] font-mono">{insight.author} · {insight.year}</p>
              </div>
            </div>
            <button onClick={handleClose} className="w-9 h-9 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-primary)] transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
        <div className="overflow-y-auto max-h-[calc(92vh-140px)] overscroll-contain">
          <div className="px-6 sm:px-8 pt-6 pb-8">
            <h1 className="font-[var(--font-serif)] text-2xl sm:text-3xl md:text-4xl leading-tight mb-3" style={{ fontWeight: 400 }}>{insight.title}</h1>
            <p className="text-sm text-[var(--color-text-muted)] leading-relaxed mb-6 font-mono italic">{insight.summary}</p>
            <div className="mb-8"><TTSReader text={insight.body} lang={insight.lang} /></div>
            <article className="text-[15px] sm:text-[16px] font-[var(--font-mono)] leading-[1.85] space-y-1">{renderBody(insight.body)}</article>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   BrowserOS-style 3D Coverflow Carousel (smooth)
   ═══════════════════════════════════════════════════ */

const CARD_W_CSS = 'clamp(260px, 70vw, 320px)';
const CARD_H_CSS = 'clamp(360px, 50vw, 440px)';
const TOTAL = insights.length;
const STEP_PX = 180; // drag distance that maps to 1 card step

// BrowserOS transform formula — smoothed with damped depth curve.
// Using sqrt(|diff|) for Z/opacity instead of linear |diff| gives cards
// a proper "arc" feel while sliding instead of a V-notch at the center.
function getTransform(diff: number) {
  const abs = Math.abs(diff);
  const x = diff * 360;
  const z = -Math.sqrt(abs) * 320;
  const ry = Math.max(-45, Math.min(45, diff * 28));
  const opacity = Math.max(0, 1 - abs * 0.35);
  const scale = Math.max(0.6, 1 - abs * 0.08);
  const zIndex = Math.round(100 - abs * 10);
  return { x, z, ry, opacity, scale, zIndex };
}

const InsightCarousel: FC = () => {
  // active is an *unbounded* integer — wrap is only computed for dots/diff.
  const [active, setActive] = useState(0);
  const [reader, setReader] = useState<Insight | null>(null);
  const [dragOffset, setDragOffset] = useState(0); // fractional card offset during drag

  const dragRef = useRef({
    active: false,
    startX: 0,
    lastX: 0,
    lastT: 0,
    velocity: 0,
    moved: false,
    pointerId: 0 as number,
  });
  const rafRef = useRef<number | null>(null);
  const pendingOffsetRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wheelAccumRef = useRef(0);
  const wheelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = useCallback((i: number) => setActive(i), []);
  const step = useCallback((delta: number) => setActive((p) => p + delta), []);

  // Auto-rotate
  useEffect(() => {
    autoRef.current = setInterval(() => {
      if (!dragRef.current.active && !reader) setActive((p) => p + 1);
    }, 5500);
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [reader]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (reader) return;
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [reader, step]);

  // Wheel: accumulator, no hard lock — trackpad gestures feel continuous
  const onWheel = (e: React.WheelEvent) => {
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    wheelAccumRef.current += d;
    const threshold = 80;
    while (wheelAccumRef.current > threshold) {
      step(1);
      wheelAccumRef.current -= threshold;
    }
    while (wheelAccumRef.current < -threshold) {
      step(-1);
      wheelAccumRef.current += threshold;
    }
    if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
    wheelTimerRef.current = setTimeout(() => { wheelAccumRef.current = 0; }, 250);
  };

  // Drag — rAF throttled, velocity tracked for inertia on release
  const scheduleOffsetFlush = () => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      setDragOffset(pendingOffsetRef.current);
    });
  };

  const onDown = (e: React.PointerEvent) => {
    if (e.button && e.button !== 0) return;
    const now = performance.now();
    dragRef.current = {
      active: true,
      startX: e.clientX,
      lastX: e.clientX,
      lastT: now,
      velocity: 0,
      moved: false,
      pointerId: e.pointerId,
    };
    containerRef.current?.setPointerCapture(e.pointerId);
  };

  const onMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d.active) return;
    const now = performance.now();
    const dt = Math.max(1, now - d.lastT);
    d.velocity = (e.clientX - d.lastX) / dt; // px per ms
    d.lastX = e.clientX;
    d.lastT = now;
    const dx = e.clientX - d.startX;
    if (Math.abs(dx) > 5) d.moved = true;
    pendingOffsetRef.current = -dx / STEP_PX;
    scheduleOffsetFlush();
  };

  const onUp = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d.active) return;
    d.active = false;
    containerRef.current?.releasePointerCapture?.(d.pointerId);

    const dx = e.clientX - d.startX;
    const projected = dx + d.velocity * 180; // simple inertia projection (velocity*ms)
    const steps = Math.round(-projected / STEP_PX);
    if (steps !== 0) setActive((p) => p + steps);

    pendingOffsetRef.current = 0;
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setDragOffset(0);
  };

  const openReader = (insight: Insight, cardIndex: number) => {
    if (dragRef.current.moved) return;
    const activeMod = ((active % TOTAL) + TOTAL) % TOTAL;
    if (cardIndex !== activeMod) { goTo(active + (cardIndex - activeMod)); return; }
    setReader(insight);
  };

  useEffect(() => () => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
  }, []);

  const activeMod = ((active % TOTAL) + TOTAL) % TOTAL;

  return (
    <>
      <section className="py-20 md:py-28 overflow-hidden">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-6" data-reveal>
            <span className="section-label mb-4 block">[ insights ]</span>
            <h2 className="font-[var(--font-serif)] text-[length:var(--text-2xl)] leading-tight" style={{ fontWeight: 400 }} data-split="words">
              Ideas that shaped{' '}
              <span className="text-[var(--color-primary)]" style={{ fontStyle: 'italic' }}>our digital world</span>
            </h2>
            <p className="mt-4 mx-auto max-w-lg text-[13px] font-mono text-[var(--color-text-muted)] leading-relaxed">
              Groundbreaking papers, essays, and moments in AI, programming, and quantum computing.
            </p>
          </div>
        </div>

        {/* ── 3D Carousel Stage ── */}
        <div
          ref={containerRef}
          className="relative mx-auto select-none"
          style={{
            height: 'clamp(380px, 55vw, 480px)',
            maxWidth: '100vw',
            perspective: '1400px',
            cursor: dragRef.current.active ? 'grabbing' : 'grab',
            touchAction: 'pan-y',
          }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onWheel={onWheel}
        >
          <div style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d' }}>
            {insights.map((ins, i) => {
              // shortest signed distance from active, allowing fractional drag
              let diff = i - activeMod;
              if (diff > TOTAL / 2) diff -= TOTAL;
              if (diff < -TOTAL / 2) diff += TOTAL;
              const adjusted = diff + dragOffset;
              const t = getTransform(adjusted);
              const abs = Math.abs(adjusted);
              const isActive = abs < 0.5;

              return (
                <div
                  key={ins.id}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: CARD_W_CSS,
                    height: CARD_H_CSS,
                    marginLeft: 'clamp(-160px, -35vw, -130px)',
                    marginTop: 'clamp(-220px, -25vw, -180px)',
                    transformStyle: 'preserve-3d',
                    willChange: 'transform, opacity',
                    visibility: abs > 4.5 ? 'hidden' : 'visible',
                    pointerEvents: abs > 3 ? 'none' : 'auto',
                    transform: `translate3d(${t.x}px, 0, ${t.z}px) rotateY(${t.ry}deg) scale(${t.scale})`,
                    opacity: t.opacity,
                    zIndex: t.zIndex,
                    transition: dragRef.current.active
                      ? 'none'
                      : 'transform 0.55s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
                    cursor: isActive ? 'pointer' : 'grab',
                  }}
                  onClick={() => openReader(ins, i)}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      padding: '2.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                      position: 'relative',
                      overflow: 'hidden',
                      border: '1px solid rgba(0,0,0,0.1)',
                      backgroundColor: ins.cardBg,
                      color: ins.cardText,
                      borderRadius: '6px',
                    }}
                  >
                    <div style={{ position: 'relative', zIndex: 10 }}>
                      <div style={{
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        opacity: 0.7,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '1rem',
                        fontFamily: "'IBM Plex Mono', monospace",
                      }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'currentColor', opacity: 0.5, display: 'inline-block' }} />
                        {ins.tag}
                      </div>
                      <h3 style={{
                        fontFamily: "'IBM Plex Mono', 'Inter', sans-serif",
                        fontWeight: 700,
                        fontSize: 'clamp(1.3rem, 4.5vw, 2rem)',
                        lineHeight: 0.95,
                        textTransform: 'uppercase',
                        letterSpacing: '-0.02em',
                        margin: '0 0 0.5rem 0',
                      }}>
                        {ins.title.length > 40 ? ins.title.slice(0, 38) + '...' : ins.title}
                      </h3>
                      <p style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: '0.7rem',
                        opacity: 0.5,
                        margin: 0,
                        letterSpacing: '0.05em',
                      }}>
                        {ins.author} · {ins.year}
                      </p>
                    </div>

                    <div style={{ position: 'relative', zIndex: 10 }}>
                      <p style={{
                        fontFamily: "'Instrument Serif', Georgia, serif",
                        fontSize: '1.1rem',
                        lineHeight: 1.4,
                        opacity: 0.9,
                        margin: 0,
                      }}>
                        {ins.summary.length > 140 ? ins.summary.slice(0, 137) + '...' : ins.summary}
                      </p>
                    </div>

                    <svg
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        bottom: -20,
                        right: -20,
                        opacity: 0.1,
                        transform: 'rotate(-15deg)',
                        width: '16rem',
                        height: '16rem',
                      }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={0.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d={ins.svgIcon} />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-6 mt-6">
          <button
            onClick={() => step(-1)}
            className="w-10 h-10 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all hover:scale-110 active:scale-95"
            aria-label="Previous"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>

          <div className="flex items-center gap-2">
            {insights.map((_, i) => (
              <button key={i} onClick={() => goTo(active + (i - activeMod))} className="transition-all"
                style={{
                  width: i === activeMod ? 28 : 8,
                  height: 8,
                  borderRadius: 4,
                  background: i === activeMod ? insights[activeMod].tagColor : 'var(--color-border)',
                  transition: 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
                }}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={() => step(1)}
            className="w-10 h-10 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all hover:scale-110 active:scale-95"
            aria-label="Next"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>

        <div className="md:hidden flex justify-center mt-3">
          <span className="text-[10px] font-mono text-[var(--color-text-faint)] tracking-wider uppercase">
            Swipe to explore
          </span>
        </div>
      </section>

      {reader && <ArticleReader insight={reader} onClose={() => setReader(null)} />}
    </>
  );
};

export default InsightCarousel;
