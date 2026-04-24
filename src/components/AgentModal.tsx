import { useEffect, useRef, useState, type FC } from 'react';
import type { Agent } from '../data/agents.generated';
import AgentChat from './AgentChat';

interface Props {
  agent: Agent;
  onClose: () => void;
}

const AgentModal: FC<Props> = ({ agent, onClose }) => {
  const [tab, setTab] = useState<'about' | 'try' | 'prompt'>('about');
  const [phase, setPhase] = useState<'entering' | 'open' | 'exiting'>('entering');
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setPhase('open'), 30);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      clearTimeout(t);
    };
  }, []);

  const handleClose = () => {
    setPhase('exiting');
    setTimeout(onClose, 250);
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-6"
      style={{
        background: phase === 'open' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0)',
        backdropFilter: phase === 'open' ? 'blur(12px)' : 'blur(0px)',
        transition: 'background 0.25s ease, backdrop-filter 0.25s ease',
      }}
      onClick={(e) => { if (e.target === overlayRef.current) handleClose(); }}
    >
      <div
        className="relative w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border)] flex flex-col"
        style={{
          transform: phase === 'open' ? 'scale(1)' : 'scale(0.9)',
          opacity: phase === 'open' ? 1 : 0,
          boxShadow: `0 40px 100px -20px rgba(0,0,0,0.6), 0 0 80px -20px ${agent.color}40`,
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
        }}
      >
        <div className="h-1 w-full flex-shrink-0" style={{ background: `linear-gradient(90deg, ${agent.color}, transparent)` }} />

        <div className="flex items-start gap-4 px-6 sm:px-8 py-4 border-b border-[var(--color-border)] flex-shrink-0">
          <span className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: `${agent.color}22`, color: agent.color }}>
            {agent.emoji}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded text-white"
                style={{ background: agent.color }}>
                {agent.division}
              </span>
              <span className="text-[10px] font-mono text-[var(--color-text-faint)] tracking-wider uppercase">
                {agent.model}
              </span>
            </div>
            <h2 className="font-[var(--font-serif)] text-xl sm:text-2xl leading-tight mt-1" style={{ fontWeight: 400 }}>
              {agent.name}
            </h2>
            {agent.vibe && (
              <p className="text-[12px] font-mono italic text-[var(--color-text-muted)] mt-1">"{agent.vibe}"</p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-primary)] transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex border-b border-[var(--color-border)] px-4 sm:px-6 flex-shrink-0">
          {(['about', 'try', 'prompt'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-[11px] font-mono tracking-wider uppercase transition-colors relative ${
                tab === t
                  ? 'text-[var(--color-text)]'
                  : 'text-[var(--color-text-faint)] hover:text-[var(--color-text-muted)]'
              }`}
            >
              {t === 'try' ? '▸ Try it' : t}
              {tab === t && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: agent.color }} />
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          {tab === 'about' && (
            <div className="px-6 sm:px-8 py-6">
              <p className="text-[14px] font-mono leading-[1.8] text-[var(--color-text-muted)]">
                {agent.description}
              </p>
              {agent.tools && (
                <div className="mt-6">
                  <h4 className="text-[10px] font-mono tracking-wider uppercase text-[var(--color-text-faint)] mb-2">Tools</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {agent.tools.split(/\s*,\s*/).filter(Boolean).map((tool) => (
                      <span key={tool} className="px-2 py-0.5 rounded text-[11px] font-mono bg-[var(--color-surface)] border border-[var(--color-border)]">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() => setTab('try')}
                  className="px-5 py-2.5 rounded-lg font-mono text-[12px] tracking-wide text-white hover:opacity-90 transition-opacity"
                  style={{ background: agent.color }}
                >
                  ▸ Talk to this agent
                </button>
                <a
                  href={`https://github.com/SergeMiro/ai-agents-config/blob/main/agents/${agent.githubPath.replace(/^agents\//, '')}`}
                  target="_blank"
                  rel="noopener"
                  className="px-5 py-2.5 rounded-lg font-mono text-[12px] tracking-wide border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
                >
                  Source on GitHub ↗
                </a>
              </div>
            </div>
          )}

          {tab === 'try' && <AgentChat agent={agent} />}

          {tab === 'prompt' && (
            <pre className="px-6 sm:px-8 py-6 text-[12px] font-mono leading-[1.7] text-[var(--color-text-muted)] whitespace-pre-wrap">
              {agent.systemPrompt.slice(0, 4000)}
              {agent.systemPrompt.length > 4000 && '\n\n… (truncated — see full file on GitHub)'}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentModal;
