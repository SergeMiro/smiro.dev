import { useState, type FC } from 'react';

/* ═══════════════════════════════════════════════════
   Orchestrator Pipeline — animated SVG diagram
   Mirrors the real orchestragent/ + n8n workflow loop:
   User → Plan → [Executor ⇄ Reviewer × retry] → 3D score → n8n log → next
   ═══════════════════════════════════════════════════ */

interface Node {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  sub: string;
  color: string;
  detail: string;
}

const NODES: Node[] = [
  { id: 'user', x: 20, y: 200, w: 130, h: 60, label: 'User', sub: 'plain text task', color: '#9a9690',
    detail: 'Любой запрос в свободной форме — "deploy a rate-limited API", "audit a11y on /contact". Оркестратор решает, что делать дальше.' },
  { id: 'orch', x: 195, y: 200, w: 150, h: 60, label: 'Orchestrator', sub: 'routes → 170+ agents', color: '#e86830',
    detail: 'Классификатор на Claude Opus. Читает задачу, подбирает релевантных агентов, строит staff-level план шагов с критериями приёмки.' },
  { id: 'plan', x: 395, y: 100, w: 140, h: 60, label: 'Plan', sub: 'JSON steps', color: '#8b5cf6',
    detail: 'Артефакт plan.json: массив шагов с title, commands, tests, acceptance criteria. Хранится в SQLite state.' },
  { id: 'exec', x: 600, y: 60, w: 140, h: 60, label: 'Executor', sub: 'claude-code headless', color: '#10b981',
    detail: 'oa-executor запускается через run-step.sh. Пишет код, запускает тесты. Отчитывается в step_report.json.' },
  { id: 'review', x: 600, y: 160, w: 140, h: 60, label: 'Reviewer', sub: 'grades 0–100', color: '#3b82f6',
    detail: 'oa-reviewer читает diff, ищет баги, ставит оценку. Не может модифицировать код — только veto.' },
  { id: 'score', x: 820, y: 110, w: 150, h: 60, label: '3D Scoring', sub: 'pass gate', color: '#ec4899',
    detail: 'Финальный gate: score = f(objective tests, reviewer grade, policy pack). Ниже порога → retry loop.' },
  { id: 'n8n', x: 395, y: 280, w: 140, h: 60, label: 'n8n Workflow', sub: 'logs + telegram', color: '#ef4444',
    detail: 'OrchestrAgent — Plan Executor. Принимает план через webhook, ведёт SQLite, пингует Telegram на каждом blocked/done шаге.' },
  { id: 'done', x: 820, y: 240, w: 150, h: 60, label: 'Next step', sub: 'or complete', color: '#06b6d4',
    detail: 'Шаг закрыт → курсор двигается. Последний шаг → проект done, финальный пинг в Telegram.' },
];

const EDGES: Array<{ from: string; to: string; label?: string; dashed?: boolean; curve?: 'straight' | 'up' | 'down' }> = [
  { from: 'user', to: 'orch' },
  { from: 'orch', to: 'plan', curve: 'up' },
  { from: 'plan', to: 'exec' },
  { from: 'exec', to: 'review', label: 'diff', curve: 'down' },
  { from: 'review', to: 'exec', label: 'retry', dashed: true, curve: 'up' },
  { from: 'review', to: 'score' },
  { from: 'score', to: 'done', curve: 'down' },
  { from: 'orch', to: 'n8n', curve: 'down', dashed: true },
  { from: 'n8n', to: 'score', dashed: true },
];

function anchor(node: Node, side: 'l' | 'r' | 't' | 'b') {
  switch (side) {
    case 'l': return { x: node.x, y: node.y + node.h / 2 };
    case 'r': return { x: node.x + node.w, y: node.y + node.h / 2 };
    case 't': return { x: node.x + node.w / 2, y: node.y };
    case 'b': return { x: node.x + node.w / 2, y: node.y + node.h };
  }
}

function pathBetween(from: Node, to: Node, curve?: 'straight' | 'up' | 'down') {
  const fromCenter = from.x + from.w / 2;
  const toCenter = to.x + to.w / 2;
  const goingRight = toCenter > fromCenter;
  const start = anchor(from, goingRight ? 'r' : 'l');
  const end = anchor(to, goingRight ? 'l' : 'r');

  const dx = end.x - start.x;
  const offset = Math.max(40, Math.abs(dx) * 0.45);
  const c1x = start.x + (goingRight ? offset : -offset);
  const c2x = end.x + (goingRight ? -offset : offset);
  let c1y = start.y;
  let c2y = end.y;
  if (curve === 'up') { c1y -= 40; c2y -= 40; }
  if (curve === 'down') { c1y += 40; c2y += 40; }
  return `M ${start.x} ${start.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${end.x} ${end.y}`;
}

const OrchestratorPipeline: FC = () => {
  const [hover, setHover] = useState<string | null>(null);
  const nodeMap = Object.fromEntries(NODES.map((n) => [n.id, n])) as Record<string, Node>;
  const focused = hover ? nodeMap[hover] : null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="mb-6 text-center" data-reveal>
        <span className="section-label mb-4 block">[ pipeline ]</span>
        <h2 className="font-[var(--font-serif)] text-[length:var(--text-2xl)] leading-tight" style={{ fontWeight: 400 }}>
          How the orchestrator{' '}
          <span className="text-[var(--color-primary)]" style={{ fontStyle: 'italic' }}>keeps itself honest</span>
        </h2>
        <p className="mt-4 mx-auto max-w-lg text-[13px] font-mono text-[var(--color-text-muted)] leading-relaxed">
          Every step runs through a retry-capable executor/reviewer loop, gated by a 3D score.
          The n8n workflow owns state, logging, and Telegram pings.
        </p>
      </div>

      <div className="relative rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 sm:p-6 overflow-hidden">
        <svg viewBox="0 0 1000 360" className="w-full h-auto" style={{ minHeight: 280 }}>
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" opacity="0.55" />
            </marker>
            {NODES.map((n) => (
              <linearGradient key={`g-${n.id}`} id={`g-${n.id}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={n.color} stopOpacity="0.20" />
                <stop offset="100%" stopColor={n.color} stopOpacity="0.05" />
              </linearGradient>
            ))}
          </defs>

          {/* edges */}
          <g className="text-[var(--color-text-faint)]">
            {EDGES.map((e, i) => {
              const from = nodeMap[e.from];
              const to = nodeMap[e.to];
              const isActive = hover === e.from || hover === e.to;
              return (
                <g key={i} style={{ opacity: hover ? (isActive ? 1 : 0.25) : 0.85, transition: 'opacity 0.25s ease' }}>
                  <path
                    d={pathBetween(from, to, e.curve)}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={isActive ? 2 : 1.25}
                    strokeDasharray={e.dashed ? '5 4' : undefined}
                    markerEnd="url(#arrow)"
                  />
                  {/* flow dot */}
                  <circle r="3" fill={to.color}>
                    <animateMotion
                      dur={`${3 + (i % 3) * 0.5}s`}
                      repeatCount="indefinite"
                      path={pathBetween(from, to, e.curve)}
                    />
                  </circle>
                  {e.label && (
                    <text
                      fontSize="9"
                      fontFamily="IBM Plex Mono, monospace"
                      fill="currentColor"
                      textAnchor="middle"
                    >
                      <textPath href={`#edge-${i}`} startOffset="50%">{e.label}</textPath>
                    </text>
                  )}
                  <path id={`edge-${i}`} d={pathBetween(from, to, e.curve)} fill="none" />
                </g>
              );
            })}
          </g>

          {/* nodes */}
          {NODES.map((n) => {
            const dim = hover && hover !== n.id;
            return (
              <g
                key={n.id}
                onMouseEnter={() => setHover(n.id)}
                onMouseLeave={() => setHover(null)}
                onTouchStart={() => setHover(n.id)}
                style={{ cursor: 'pointer', opacity: dim ? 0.35 : 1, transition: 'opacity 0.25s ease' }}
              >
                <rect
                  x={n.x}
                  y={n.y}
                  width={n.w}
                  height={n.h}
                  rx="10"
                  fill={`url(#g-${n.id})`}
                  stroke={n.color}
                  strokeWidth={hover === n.id ? 2 : 1.25}
                />
                <text
                  x={n.x + n.w / 2}
                  y={n.y + 24}
                  textAnchor="middle"
                  fontSize="13"
                  fontFamily="IBM Plex Mono, monospace"
                  fontWeight="600"
                  fill="var(--color-text)"
                >
                  {n.label}
                </text>
                <text
                  x={n.x + n.w / 2}
                  y={n.y + 42}
                  textAnchor="middle"
                  fontSize="9.5"
                  fontFamily="IBM Plex Mono, monospace"
                  fill="var(--color-text-muted)"
                  opacity="0.8"
                >
                  {n.sub}
                </text>
              </g>
            );
          })}
        </svg>

        {/* detail pane */}
        <div
          className="mt-4 p-4 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] min-h-[76px] transition-colors"
          style={{ borderColor: focused ? focused.color : undefined }}
        >
          {focused ? (
            <>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: focused.color }} />
                <span className="text-[11px] font-mono uppercase tracking-wider" style={{ color: focused.color }}>
                  {focused.label}
                </span>
              </div>
              <p className="text-[13px] font-mono text-[var(--color-text-muted)] leading-relaxed">{focused.detail}</p>
            </>
          ) : (
            <p className="text-[12px] font-mono italic text-[var(--color-text-faint)]">
              Hover a node to see what it does. Dashed arrows = retry / async logging.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrchestratorPipeline;
