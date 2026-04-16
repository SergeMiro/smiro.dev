import { useState, useRef, useEffect, useCallback, type FC } from 'react';
import { insights, type Insight } from '../data/insights';

/* ═══════════════════════════════════════════════════
   TTS Reader
   ═══════════════════════════════════════════════════ */
const TTSReader: FC<{ text: string; lang: string }> = ({ text, lang }) => {
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    speechSynthesis.cancel();
    setPlaying(false);
    setProgress(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const play = useCallback(() => {
    if (playing) { stop(); return; }
    const plain = text.replace(/#{1,6}\s/g, '').replace(/\*\*/g, '').replace(/\n{2,}/g, '. ');
    const u = new SpeechSynthesisUtterance(plain);
    u.lang = lang; u.rate = rate;
    const voices = speechSynthesis.getVoices();
    const pref = voices.find(v => v.lang.startsWith(lang.slice(0, 2)) && (v.name.includes('Google') || v.name.includes('Microsoft') || v.name.includes('Samantha') || v.name.includes('Daniel')));
    if (pref) u.voice = pref;
    else { const fb = voices.find(v => v.lang.startsWith(lang.slice(0, 2))); if (fb) u.voice = fb; }
    u.onend = () => { setPlaying(false); setProgress(0); if (intervalRef.current) clearInterval(intervalRef.current); };
    u.onboundary = (e) => { if (e.charIndex && plain.length) setProgress((e.charIndex / plain.length) * 100); };
    speechSynthesis.speak(u);
    setPlaying(true);
    intervalRef.current = setInterval(() => { if (!speechSynthesis.speaking) { setPlaying(false); setProgress(0); if (intervalRef.current) clearInterval(intervalRef.current); } }, 500);
  }, [playing, text, lang, rate, stop]);

  useEffect(() => () => { speechSynthesis.cancel(); if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)]">
      <button onClick={play} className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-primary)] text-white hover:scale-105 active:scale-95 transition-transform flex-shrink-0" aria-label={playing ? 'Stop' : 'Play'}>
        {playing ? <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
        : <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>}
      </button>
      <div className="flex-1 min-w-0">
        <div className="h-1.5 rounded-full bg-[var(--color-surface-offset)] overflow-hidden"><div className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-300" style={{ width: `${progress}%` }}/></div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10px] text-[var(--color-text-faint)] font-mono uppercase tracking-wider">{playing ? 'Reading...' : 'Listen to article'}</span>
          <div className="flex items-center gap-1">
            {[0.75, 1, 1.25, 1.5].map(r => (<button key={r} onClick={() => setRate(r)} className={`px-1.5 py-0.5 rounded text-[9px] font-mono transition-colors ${rate === r ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-faint)] hover:text-[var(--color-text-muted)]'}`}>{r}x</button>))}
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
   BrowserOS-style 3D Coverflow Carousel
   ═══════════════════════════════════════════════════

   Uses the exact same transform model as browseros.com:
   - position: absolute; top:50%; left:50%
   - transform: translateX() translateZ() rotateY()
   - opacity fades on distant cards, display:none for very far ones
   - Each card has unique bg color + slight rotate() tilt
   - Large SVG icon at bottom-right, opacity 0.1
   ═══════════════════════════════════════════════════ */

const CARD_W_CSS = 'clamp(260px, 70vw, 320px)';
const CARD_H_CSS = 'clamp(360px, 50vw, 440px)';
const CARD_W = 320; // reference for math
const TOTAL = insights.length;

// BrowserOS transform formula (extracted from their inline styles)
function getTransform(diff: number) {
  // diff = signed distance from active (can be fractional during drag)
  // Each step: ~380px X, ~250px Z-depth, ~30deg rotateY
  const x = diff * 380;
  const z = -Math.abs(diff) * 250;
  const ry = diff * 30;
  const opacity = 1 - Math.abs(diff) * 0.65;
  const zIndex = Math.round(100 - Math.abs(diff) * 50);
  const visible = Math.abs(diff) <= 3;
  return { x, z, ry, opacity: Math.max(-0.5, opacity), zIndex, visible };
}

const InsightCarousel: FC = () => {
  const [active, setActive] = useState(0);
  const [reader, setReader] = useState<Insight | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const dragRef = useRef({ startX: 0, moved: false });
  const containerRef = useRef<HTMLDivElement>(null);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-rotate
  useEffect(() => {
    autoRef.current = setInterval(() => {
      if (!dragging && !reader) setActive(p => (p + 1) % TOTAL);
    }, 5000);
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [dragging, reader]);

  const goTo = useCallback((i: number) => setActive(((i % TOTAL) + TOTAL) % TOTAL), []);

  // Keyboard + wheel
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (reader) return;
      if (e.key === 'ArrowLeft') goTo(active - 1);
      if (e.key === 'ArrowRight') goTo(active + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, reader, goTo]);

  const wheelLock = useRef(false);
  const onWheel = (e: React.WheelEvent) => {
    if (wheelLock.current) return;
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(d) < 20) return;
    wheelLock.current = true;
    goTo(active + (d > 0 ? 1 : -1));
    setTimeout(() => { wheelLock.current = false; }, 500);
  };

  // Drag handlers
  const onDown = (e: React.PointerEvent) => {
    dragRef.current = { startX: e.clientX, moved: false };
    setDragging(true);
    containerRef.current?.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    if (Math.abs(dx) > 5) dragRef.current.moved = true;
    setDragX(dx);
  };
  const onUp = (e: React.PointerEvent) => {
    if (!dragging) return;
    containerRef.current?.releasePointerCapture(e.pointerId);
    setDragging(false);
    if (Math.abs(dragX) > 60) {
      const steps = Math.max(1, Math.round(Math.abs(dragX) / 150));
      goTo(active + (dragX > 0 ? -steps : steps));
    }
    setDragX(0);
  };

  const openReader = (insight: Insight, idx: number) => {
    if (dragRef.current.moved) return;
    if (idx !== active) { goTo(idx); return; }
    setReader(insight);
  };

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
          className="relative mx-auto select-none touch-pan-y"
          style={{
            height: 'clamp(380px, 55vw, 480px)',
            maxWidth: '100vw',
            perspective: '1200px',
            cursor: dragging ? 'grabbing' : 'grab',
          }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onWheel={onWheel}
        >
          {/* Center stage — preserve-3d container */}
          <div style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d' }}>
            {insights.map((ins, i) => {
              let diff = i - active;
              if (diff > TOTAL / 2) diff -= TOTAL;
              if (diff < -TOTAL / 2) diff += TOTAL;
              // add drag offset as fraction of a card step
              const adjustedDiff = diff + (dragX / -250);
              const t = getTransform(adjustedDiff);

              return (
                <div
                  key={ins.id}
                  className="carousel-card-wrapper"
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
                    display: t.visible ? 'block' : 'none',
                    transform: `translateX(${t.x}px) translateZ(${t.z}px) rotateY(${t.ry}deg)`,
                    opacity: Math.max(0, t.opacity),
                    zIndex: t.zIndex,
                    transition: dragging ? 'none' : 'transform 0.7s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.7s ease',
                    cursor: Math.abs(adjustedDiff) < 0.5 ? 'pointer' : 'grab',
                  }}
                  onClick={() => openReader(ins, i)}
                >
                  {/* ── Card Face ── */}
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
                      transform: `rotate(${ins.tilt}deg)`,
                      borderRadius: '2px',
                    }}
                  >
                    {/* Top content */}
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

                    {/* Bottom content */}
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

                    {/* Large background SVG icon */}
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
            onClick={() => goTo(active - 1)}
            className="w-10 h-10 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all hover:scale-110 active:scale-95"
            aria-label="Previous"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>

          <div className="flex items-center gap-2">
            {insights.map((_, i) => (
              <button key={i} onClick={() => goTo(i)} className="transition-all"
                style={{
                  width: i === active ? 28 : 8,
                  height: 8,
                  borderRadius: 4,
                  background: i === active ? insights[active].tagColor : 'var(--color-border)',
                  transition: 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
                }}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={() => goTo(active + 1)}
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
