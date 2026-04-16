import { useState, useRef, useEffect, useCallback, type FC } from 'react';
import { insights, type Insight } from '../data/insights';

/* ─── TTS Reader ─── */
const TTSReader: FC<{ text: string; lang: string }> = ({ text, lang }) => {
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [progress, setProgress] = useState(0);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
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
    u.lang = lang;
    u.rate = rate;
    // pick a good voice
    const voices = speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang.startsWith(lang.slice(0, 2)) && (v.name.includes('Google') || v.name.includes('Microsoft') || v.name.includes('Samantha') || v.name.includes('Daniel')));
    if (preferred) u.voice = preferred;
    else {
      const fallback = voices.find(v => v.lang.startsWith(lang.slice(0, 2)));
      if (fallback) u.voice = fallback;
    }
    u.onend = () => { setPlaying(false); setProgress(0); if (intervalRef.current) clearInterval(intervalRef.current); };
    u.onboundary = (e) => {
      if (e.charIndex && plain.length) setProgress((e.charIndex / plain.length) * 100);
    };
    utterRef.current = u;
    speechSynthesis.speak(u);
    setPlaying(true);
    // fallback progress estimate
    intervalRef.current = setInterval(() => {
      if (!speechSynthesis.speaking) {
        setPlaying(false);
        setProgress(0);
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, 500);
  }, [playing, text, lang, rate, stop]);

  useEffect(() => () => { speechSynthesis.cancel(); if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)]">
      <button
        onClick={play}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity flex-shrink-0"
        aria-label={playing ? 'Stop reading' : 'Read aloud'}
      >
        {playing ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className="h-1.5 rounded-full bg-[var(--color-surface-offset)] overflow-hidden">
          <div className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-300" style={{ width: `${progress}%` }}/>
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10px] text-[var(--color-text-faint)] font-mono uppercase tracking-wider">
            {playing ? 'Reading...' : 'Listen to article'}
          </span>
          <div className="flex items-center gap-1">
            {[0.75, 1, 1.25, 1.5].map(r => (
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

/* ─── Article Reader Overlay ─── */
const ArticleReader: FC<{ insight: Insight; onClose: () => void; cardRect: DOMRect | null }> = ({ insight, onClose, cardRect }) => {
  const [phase, setPhase] = useState<'entering' | 'open' | 'exiting'>('entering');
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setPhase('open'), 50);
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; clearTimeout(timer); };
  }, []);

  const handleClose = () => {
    setPhase('exiting');
    setTimeout(onClose, 400);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const renderBody = (body: string) => {
    return body.split('\n').map((line, i) => {
      if (line.startsWith('## ')) {
        return <h2 key={i} className="font-[var(--font-serif)] text-xl sm:text-2xl mt-8 mb-4" style={{ fontWeight: 400 }}>{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} className="font-semibold text-[var(--color-text)] mt-4 mb-1">{line.replace(/\*\*/g, '')}</p>;
      }
      if (line.startsWith('- **')) {
        const match = line.match(/^- \*\*(.+?)\*\*\s*[-—]\s*(.+)$/);
        if (match) {
          return (
            <div key={i} className="flex gap-3 pl-4 py-1.5">
              <span className="text-[var(--color-primary)] mt-0.5 flex-shrink-0">*</span>
              <p><strong className="text-[var(--color-text)]">{match[1]}</strong> <span className="text-[var(--color-text-muted)]">— {match[2]}</span></p>
            </div>
          );
        }
      }
      if (line.startsWith('- ')) {
        return (
          <div key={i} className="flex gap-3 pl-4 py-1">
            <span className="text-[var(--color-primary)] mt-0.5 flex-shrink-0">*</span>
            <p className="text-[var(--color-text-muted)]">{line.slice(2)}</p>
          </div>
        );
      }
      if (line.startsWith('"') || line.startsWith('\u201c')) {
        return (
          <blockquote key={i} className="border-l-2 border-[var(--color-primary)] pl-5 py-2 my-4 italic text-[var(--color-text-muted)]">
            {line}
          </blockquote>
        );
      }
      if (line.trim() === '') return <div key={i} className="h-3" />;
      // inline bold
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={i} className="text-[var(--color-text-muted)] leading-[1.85]">
          {parts.map((part, j) =>
            part.startsWith('**') && part.endsWith('**')
              ? <strong key={j} className="text-[var(--color-text)] font-medium">{part.slice(2, -2)}</strong>
              : part
          )}
        </p>
      );
    });
  };

  const startTransform = cardRect
    ? `translate(${cardRect.left - window.innerWidth / 2 + cardRect.width / 2}px, ${cardRect.top - window.innerHeight / 2 + cardRect.height / 2}px) scale(${cardRect.width / window.innerWidth})`
    : 'scale(0.8)';

  return (
    <div
      ref={overlayRef}
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-500 ${
        phase === 'entering' ? 'bg-black/0' : phase === 'open' ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/0'
      }`}
      onClick={(e) => { if (e.target === overlayRef.current) handleClose(); }}
    >
      <div
        className="relative w-full max-w-3xl max-h-[92vh] mx-4 overflow-hidden rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border)] shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          transform: phase === 'entering' ? startTransform : phase === 'open' ? 'translate(0,0) scale(1)' : startTransform,
          opacity: phase === 'exiting' ? 0 : 1,
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[var(--color-bg)]/95 backdrop-blur-md border-b border-[var(--color-border)] px-6 sm:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{insight.icon}</span>
              <div>
                <span
                  className="inline-block px-2 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase text-white mb-1"
                  style={{ background: insight.tagColor }}
                >
                  {insight.tag}
                </span>
                <p className="text-[11px] text-[var(--color-text-faint)] font-mono">{insight.author} · {insight.year}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-9 h-9 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-primary)] transition-colors"
              aria-label="Close"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(92vh-140px)] overscroll-contain">
          <div className="px-6 sm:px-8 pt-6 pb-8">
            <h1 className="font-[var(--font-serif)] text-2xl sm:text-3xl md:text-4xl leading-tight mb-3" style={{ fontWeight: 400 }}>
              {insight.title}
            </h1>
            <p className="text-sm text-[var(--color-text-muted)] leading-relaxed mb-6 font-mono italic">
              {insight.summary}
            </p>

            {/* TTS Reader */}
            <div className="mb-8">
              <TTSReader text={insight.body} lang={insight.lang} />
            </div>

            {/* Article body */}
            <article className="text-[15px] sm:text-[16px] font-[var(--font-mono)] leading-[1.85] space-y-1">
              {renderBody(insight.body)}
            </article>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Card ─── */
const InsightCard: FC<{ insight: Insight; index: number; onOpen: (insight: Insight, rect: DOMRect) => void }> = ({ insight, index, onOpen }) => {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      onClick={() => ref.current && onOpen(insight, ref.current.getBoundingClientRect())}
      className="group relative flex-shrink-0 w-[300px] sm:w-[340px] cursor-pointer select-none"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="relative h-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-6 sm:p-7 transition-all duration-400 ease-out hover:border-[var(--color-primary)]/40 hover:-translate-y-2 hover:shadow-[0_20px_60px_-12px_rgba(232,104,48,0.15)]">
        {/* Glow */}
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 50% 0%, ${insight.tagColor}10 0%, transparent 70%)` }}
        />

        {/* Tag */}
        <div className="flex items-center justify-between mb-5">
          <span
            className="inline-block px-2.5 py-1 rounded-md text-[10px] font-mono font-medium tracking-wider uppercase text-white/90"
            style={{ background: insight.tagColor }}
          >
            {insight.tag}
          </span>
          <span className="text-2xl">{insight.icon}</span>
        </div>

        {/* Title */}
        <h3 className="font-[var(--font-serif)] text-lg sm:text-xl leading-snug mb-2 group-hover:text-[var(--color-primary)] transition-colors duration-300" style={{ fontWeight: 400 }}>
          {insight.title}
        </h3>

        {/* Meta */}
        <p className="text-[11px] font-mono text-[var(--color-text-faint)] mb-3 tracking-wide">
          {insight.author} · {insight.year}
        </p>

        {/* Summary */}
        <p className="text-[13px] font-mono text-[var(--color-text-muted)] leading-relaxed line-clamp-3">
          {insight.summary}
        </p>

        {/* Read more */}
        <div className="mt-5 flex items-center gap-2 text-[12px] font-mono text-[var(--color-primary)] opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <span className="tracking-wider uppercase">Read article</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Carousel ─── */
const InsightCarousel: FC = () => {
  const [activeInsight, setActiveInsight] = useState<Insight | null>(null);
  const [cardRect, setCardRect] = useState<DOMRect | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, scroll: 0 });

  const handleOpen = (insight: Insight, rect: DOMRect) => {
    if (isDragging) return;
    setCardRect(rect);
    setActiveInsight(insight);
  };

  /* drag scroll */
  const onPointerDown = (e: React.PointerEvent) => {
    if (!trackRef.current) return;
    setIsDragging(false);
    dragStart.current = { x: e.clientX, scroll: trackRef.current.scrollLeft };
    trackRef.current.setPointerCapture(e.pointerId);
    trackRef.current.style.cursor = 'grabbing';
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!trackRef.current || !trackRef.current.hasPointerCapture(e.pointerId)) return;
    const dx = e.clientX - dragStart.current.x;
    if (Math.abs(dx) > 5) setIsDragging(true);
    trackRef.current.scrollLeft = dragStart.current.scroll - dx;
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!trackRef.current) return;
    trackRef.current.releasePointerCapture(e.pointerId);
    trackRef.current.style.cursor = 'grab';
    setTimeout(() => setIsDragging(false), 50);
  };

  /* scroll buttons */
  const scroll = (dir: number) => {
    trackRef.current?.scrollBy({ left: dir * 360, behavior: 'smooth' });
  };

  return (
    <>
      <section className="py-24 md:py-32 overflow-hidden">
        <div className="mx-auto max-w-7xl px-6">
          {/* Section header */}
          <div className="mb-4" data-reveal>
            <span className="section-label">[ insights ]</span>
          </div>
          <div className="flex items-end justify-between mb-12" data-reveal>
            <div>
              <h2
                className="font-[var(--font-serif)] text-[length:var(--text-2xl)] leading-tight"
                style={{ fontWeight: 400 }}
                data-split="words"
              >
                Ideas that shaped<br/>
                <span className="text-[var(--color-primary)]" style={{ fontStyle: 'italic' }}>our digital world</span>
              </h2>
              <p className="mt-4 max-w-lg text-[13px] font-mono text-[var(--color-text-muted)] leading-relaxed">
                Groundbreaking papers, essays, and moments in AI, programming, and quantum computing that changed everything.
              </p>
            </div>

            {/* Desktop nav arrows */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => scroll(-1)}
                className="w-10 h-10 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
                aria-label="Scroll left"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              </button>
              <button
                onClick={() => scroll(1)}
                className="w-10 h-10 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
                aria-label="Scroll right"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Carousel track */}
        <div
          ref={trackRef}
          className="flex gap-5 px-6 md:px-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))] pb-4 overflow-x-auto scrollbar-hide touch-pan-x"
          style={{ cursor: 'grab', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          {insights.map((insight, i) => (
            <div key={insight.id} style={{ scrollSnapAlign: 'start' }}>
              <InsightCard insight={insight} index={i} onOpen={handleOpen} />
            </div>
          ))}
          {/* Spacer */}
          <div className="flex-shrink-0 w-4" />
        </div>

        {/* Mobile swipe hint */}
        <div className="md:hidden flex justify-center mt-4">
          <span className="text-[10px] font-mono text-[var(--color-text-faint)] tracking-wider uppercase flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-50"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            Swipe to explore
          </span>
        </div>
      </section>

      {/* Reader overlay */}
      {activeInsight && (
        <ArticleReader
          insight={activeInsight}
          onClose={() => setActiveInsight(null)}
          cardRect={cardRect}
        />
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </>
  );
};

export default InsightCarousel;
