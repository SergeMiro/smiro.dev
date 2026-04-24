import { useMemo, useRef, useState, useEffect, type FC } from 'react';
import workflowJson from '../data/n8n-workflow.json';

interface N8nNode {
  id: string;
  name: string;
  type: string;
  position: [number, number];
  parameters?: Record<string, any>;
}

interface N8nConnections {
  [nodeName: string]: {
    main?: Array<Array<{ node: string; type: string; index: number }>>;
  };
}

// Human-readable type label + accent color per common n8n node type
function typeMeta(type: string): { label: string; color: string; icon: string } {
  const map: Record<string, { label: string; color: string; icon: string }> = {
    'n8n-nodes-base.webhook': { label: 'Webhook', color: '#06b6d4', icon: '▶' },
    'n8n-nodes-base.respondToWebhook': { label: 'Respond', color: '#06b6d4', icon: '◀' },
    'n8n-nodes-base.code': { label: 'Code', color: '#8b5cf6', icon: '{ }' },
    'n8n-nodes-base.executeCommand': { label: 'Shell', color: '#f59e0b', icon: '$_' },
    'n8n-nodes-base.telegram': { label: 'Telegram', color: '#3b82f6', icon: '✈' },
    'n8n-nodes-base.splitInBatches': { label: 'Split', color: '#10b981', icon: '▦' },
    'n8n-nodes-base.if': { label: 'If', color: '#ec4899', icon: '?' },
    'n8n-nodes-base.set': { label: 'Set', color: '#a855f7', icon: '=' },
    'n8n-nodes-base.merge': { label: 'Merge', color: '#14b8a6', icon: '⤭' },
    'n8n-nodes-base.wait': { label: 'Wait', color: '#6b7280', icon: '⏱' },
    'n8n-nodes-base.httpRequest': { label: 'HTTP', color: '#ef4444', icon: '⇌' },
  };
  return (
    map[type] || { label: type.replace('n8n-nodes-base.', ''), color: '#e86830', icon: '◉' }
  );
}

const NODE_W = 180;
const NODE_H = 74;

const N8nWorkflowViewer: FC = () => {
  const data = workflowJson as { name: string; nodes: N8nNode[]; connections: N8nConnections };
  const [selected, setSelected] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef({ active: false, startX: 0, startY: 0, origX: 0, origY: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const { bounds, nodeByName } = useMemo(() => {
    const names: Record<string, N8nNode> = {};
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of data.nodes) {
      names[n.name] = n;
      minX = Math.min(minX, n.position[0]);
      minY = Math.min(minY, n.position[1]);
      maxX = Math.max(maxX, n.position[0] + NODE_W);
      maxY = Math.max(maxY, n.position[1] + NODE_H);
    }
    return {
      bounds: { minX: minX - 40, minY: minY - 40, maxX: maxX + 40, maxY: maxY + 40 },
      nodeByName: names,
    };
  }, [data]);

  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;

  // fit-to-view scaling
  const [viewBox, setViewBox] = useState(`${bounds.minX} ${bounds.minY} ${width} ${height}`);
  useEffect(() => {
    setViewBox(`${bounds.minX - pan.x / zoom} ${bounds.minY - pan.y / zoom} ${width / zoom} ${height / zoom}`);
  }, [zoom, pan, bounds.minX, bounds.minY, width, height]);

  const edges = useMemo(() => {
    const out: Array<{ from: N8nNode; to: N8nNode; id: string }> = [];
    for (const [fromName, conns] of Object.entries(data.connections)) {
      const from = nodeByName[fromName];
      if (!from || !conns.main) continue;
      conns.main.forEach((branch) => {
        branch.forEach((c) => {
          const to = nodeByName[c.node];
          if (to) out.push({ from, to, id: `${fromName}->${c.node}` });
        });
      });
    }
    return out;
  }, [data.connections, nodeByName]);

  const onPointerDown = (e: React.PointerEvent) => {
    // only pan if clicking empty space
    if ((e.target as Element).closest('[data-node]')) return;
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      origX: pan.x,
      origY: pan.y,
    };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    setPan({
      x: dragRef.current.origX + (e.clientX - dragRef.current.startX),
      y: dragRef.current.origY + (e.clientY - dragRef.current.startY),
    });
  };
  const onPointerUp = () => {
    dragRef.current.active = false;
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((z) => Math.max(0.4, Math.min(2.5, z * factor)));
  };

  const selNode = selected ? nodeByName[selected] : null;
  const selMeta = selNode ? typeMeta(selNode.type) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="mb-6 text-center" data-reveal>
        <span className="section-label mb-4 block">[ n8n workflow ]</span>
        <h2 className="font-[var(--font-serif)] text-[length:var(--text-2xl)] leading-tight" style={{ fontWeight: 400 }}>
          Production n8n workflow —{' '}
          <span className="text-[var(--color-primary)]" style={{ fontStyle: 'italic' }}>read-only</span>
        </h2>
        <p className="mt-4 mx-auto max-w-lg text-[13px] font-mono text-[var(--color-text-muted)] leading-relaxed">
          "{data.name}". {data.nodes.length} nodes. Click one to see parameters. Drag to pan, scroll to zoom.
        </p>
      </div>

      <div className="relative rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden">
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-[var(--color-bg)]/80 backdrop-blur rounded-lg border border-[var(--color-border)] p-1">
          <button onClick={() => setZoom((z) => Math.max(0.4, z * 0.9))}
            className="w-7 h-7 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)]">−</button>
          <span className="text-[10px] font-mono text-[var(--color-text-muted)] w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(2.5, z * 1.1))}
            className="w-7 h-7 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)]">+</button>
          <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            className="px-2 h-7 flex items-center justify-center text-[10px] font-mono text-[var(--color-text-muted)] hover:text-[var(--color-text)] border-l border-[var(--color-border)]">fit</button>
        </div>

        <svg
          ref={svgRef}
          viewBox={viewBox}
          className="w-full"
          style={{ height: 'clamp(360px, 50vw, 560px)', cursor: dragRef.current.active ? 'grabbing' : 'grab', touchAction: 'none' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
        >
          <defs>
            <marker id="n8n-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-text-muted)" opacity="0.7" />
            </marker>
            <pattern id="n8n-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.8" fill="var(--color-text-faint)" opacity="0.25" />
            </pattern>
          </defs>

          <rect x={bounds.minX} y={bounds.minY} width={width} height={height} fill="url(#n8n-grid)" />

          {edges.map(({ from, to, id }) => {
            const fx = from.position[0] + NODE_W;
            const fy = from.position[1] + NODE_H / 2;
            const tx = to.position[0];
            const ty = to.position[1] + NODE_H / 2;
            const midX = (fx + tx) / 2;
            const active = selected && (selected === from.name || selected === to.name);
            return (
              <path
                key={id}
                d={`M ${fx} ${fy} C ${midX} ${fy}, ${midX} ${ty}, ${tx} ${ty}`}
                fill="none"
                stroke="var(--color-text-muted)"
                strokeWidth={active ? 2 : 1.2}
                strokeOpacity={active ? 0.9 : 0.5}
                markerEnd="url(#n8n-arrow)"
              />
            );
          })}

          {data.nodes.map((n) => {
            const meta = typeMeta(n.type);
            const isSel = selected === n.name;
            return (
              <g
                key={n.id}
                data-node
                transform={`translate(${n.position[0]}, ${n.position[1]})`}
                style={{ cursor: 'pointer', opacity: selected && !isSel ? 0.55 : 1, transition: 'opacity 0.2s ease' }}
                onClick={() => setSelected(isSel ? null : n.name)}
              >
                <rect
                  width={NODE_W}
                  height={NODE_H}
                  rx="10"
                  fill="var(--color-bg)"
                  stroke={meta.color}
                  strokeWidth={isSel ? 2.2 : 1.2}
                />
                <rect width="4" height={NODE_H} rx="2" fill={meta.color} />
                <text x={18} y={28} fontSize="11" fontFamily="IBM Plex Mono, monospace" fontWeight="600" fill="var(--color-text)">
                  {n.name.length > 22 ? n.name.slice(0, 20) + '…' : n.name}
                </text>
                <text x={18} y={46} fontSize="9" fontFamily="IBM Plex Mono, monospace" fill={meta.color} opacity="0.85">
                  {meta.icon} {meta.label}
                </text>
                <text x={18} y={62} fontSize="8" fontFamily="IBM Plex Mono, monospace" fill="var(--color-text-muted)" opacity="0.7">
                  {n.type.replace('n8n-nodes-base.', 'n8n:')}
                </text>
              </g>
            );
          })}
        </svg>

        {selNode && selMeta && (
          <div className="p-4 sm:p-5 border-t border-[var(--color-border)] bg-[var(--color-bg)]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded text-white"
                    style={{ background: selMeta.color }}>{selMeta.label}</span>
                  <span className="text-[10px] font-mono text-[var(--color-text-faint)] tracking-wider">{selNode.type}</span>
                </div>
                <h4 className="font-[var(--font-serif)] text-lg" style={{ fontWeight: 400 }}>{selNode.name}</h4>
              </div>
              <button onClick={() => setSelected(null)}
                className="text-[var(--color-text-faint)] hover:text-[var(--color-text)] text-lg leading-none">×</button>
            </div>
            {selNode.parameters && Object.keys(selNode.parameters).length > 0 && (
              <pre className="mt-3 text-[11px] font-mono leading-[1.6] text-[var(--color-text-muted)] whitespace-pre-wrap max-h-48 overflow-y-auto bg-[var(--color-surface)] rounded-lg p-3 border border-[var(--color-border)]">
                {JSON.stringify(selNode.parameters, null, 2).slice(0, 1200)}
                {JSON.stringify(selNode.parameters, null, 2).length > 1200 && '\n… (truncated)'}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default N8nWorkflowViewer;
