import { useMemo, useState, type FC } from 'react';
import { agents, divisions, type Agent } from '../data/agents.generated';
import AgentModal from './AgentModal';

const AgentGallery: FC = () => {
  const [division, setDivision] = useState<string | 'All'>('All');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<Agent | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return agents.filter((a) => {
      if (division !== 'All' && a.division !== division) return false;
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.slug.toLowerCase().includes(q)
      );
    });
  }, [division, query]);

  const tabs: (string | 'All')[] = ['All', ...divisions];

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 mb-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setDivision(tab)}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-mono tracking-wider uppercase transition-all ${
                  division === tab
                    ? 'bg-[var(--color-text)] text-[var(--color-bg)]'
                    : 'border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
                }`}
              >
                {tab}
                <span className="ml-1.5 opacity-60">
                  {tab === 'All' ? agents.length : agents.filter((a) => a.division === tab).length}
                </span>
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-faint)]"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search agents…"
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((a) => (
            <button
              key={a.slug}
              onClick={() => setOpen(a)}
              className="group text-left p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.35)] transition-all duration-300 relative overflow-hidden"
              style={{
                ['--accent' as any]: a.color,
              }}
            >
              <div
                className="absolute inset-x-0 top-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: a.color }}
              />
              <div className="flex items-center justify-between mb-3">
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: `${a.color}22`, color: a.color }}
                >
                  {a.emoji}
                </span>
                <span
                  className="text-[9px] font-mono tracking-wider uppercase px-2 py-0.5 rounded"
                  style={{ background: `${a.color}18`, color: a.color }}
                >
                  {a.division}
                </span>
              </div>
              <h3 className="font-[var(--font-serif)] text-[18px] leading-tight mb-1.5 text-[var(--color-text)]" style={{ fontWeight: 400 }}>
                {a.name}
              </h3>
              <p className="text-[12px] font-mono text-[var(--color-text-muted)] leading-[1.55] line-clamp-3">
                {a.tagline || a.description}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[10px] font-mono text-[var(--color-text-faint)] tracking-wider uppercase">
                  {a.model}
                </span>
                <span className="text-[11px] font-mono text-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  Try it
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-[var(--color-text-faint)] font-mono text-sm">
            No agents match "{query}".
          </div>
        )}
      </div>

      {open && <AgentModal agent={open} onClose={() => setOpen(null)} />}
    </>
  );
};

export default AgentGallery;
