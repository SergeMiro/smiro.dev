import { useEffect, useRef, useState, type FC } from 'react';
import type { Agent } from '../data/agents.generated';

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface ModelMeta {
  id: string;
  label: string;
  provider: string;
  free: boolean;
  ready: boolean;
}

const SUGGESTIONS: Record<string, string[]> = {
  default: [
    'What would you do first on a new project?',
    'Tell me about your quality bar in one paragraph.',
    'Give me a 5-step checklist you use.',
  ],
};

const AgentChat: FC<{ agent: Agent }> = ({ agent }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [models, setModels] = useState<ModelMeta[]>([]);
  const [model, setModel] = useState<string>('glm-4.5-air');
  const abortRef = useRef<AbortController | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/agent-chat')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d || !Array.isArray(d.models)) return;
        setModels(d.models);
        const first = d.models.find((m: ModelMeta) => m.ready);
        if (first) setModel(first.id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [messages, busy]);

  const send = async (text: string) => {
    if (!text.trim() || busy) return;
    setError(null);
    const next: Message[] = [...messages, { role: 'user', content: text.trim() }];
    setMessages(next);
    setInput('');
    setBusy(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch('/api/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentSlug: agent.slug,
          agentName: agent.name,
          systemPrompt: agent.systemPrompt,
          messages: next,
          model,
        }),
        signal: ctrl.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || data.error || `Error ${res.status}`);
        setBusy(false);
        return;
      }

      // SSE: append chunks into a new model message.
      setMessages((m) => [...m, { role: 'model', content: '' }]);
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() || '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (!payload) continue;
          try {
            const obj = JSON.parse(payload);
            if (obj.delta) {
              setMessages((m) => {
                const last = m[m.length - 1];
                if (!last || last.role !== 'model') return m;
                return [...m.slice(0, -1), { ...last, content: last.content + obj.delta }];
              });
            }
            if (obj.done && typeof obj.remaining === 'number') setRemaining(obj.remaining);
            if (obj.error) setError(obj.error);
          } catch {}
        }
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  return (
    <div className="flex flex-col h-[calc(92vh-220px)] min-h-[360px]">
      <div ref={scrollerRef} className="flex-1 overflow-y-auto overscroll-contain px-6 sm:px-8 py-5 space-y-4">
        {messages.length === 0 && (
          <div className="py-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: agent.color }} />
              <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: agent.color }}>
                {agent.name} is ready
              </span>
            </div>
            <p className="text-[13px] font-mono text-[var(--color-text-muted)] leading-relaxed mb-4">
              This is a live Gemini 2.5 Flash sandbox running the agent's system prompt. No tool access —
              the agent describes what it would do. 5 messages per hour.
            </p>
            <div className="flex flex-wrap gap-2">
              {(SUGGESTIONS[agent.slug] || SUGGESTIONS.default).map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="px-3 py-1.5 rounded-full text-[11px] font-mono border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div
              className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-mono"
              style={{
                background: m.role === 'user' ? 'var(--color-surface-2)' : `${agent.color}22`,
                color: m.role === 'user' ? 'var(--color-text-muted)' : agent.color,
              }}
            >
              {m.role === 'user' ? 'U' : agent.emoji}
            </div>
            <div
              className={`flex-1 rounded-xl px-4 py-2.5 text-[13px] font-mono leading-[1.7] whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-[var(--color-surface-2)] text-[var(--color-text)]'
                  : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)]'
              }`}
            >
              {m.content || (busy && i === messages.length - 1 ? '▍' : '')}
            </div>
          </div>
        ))}

        {error && (
          <div className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-[12px] font-mono text-red-500">
            {error}
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="flex items-end gap-2 px-6 sm:px-8 py-3 border-t border-[var(--color-border)] bg-[var(--color-bg)]">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
          }}
          placeholder={busy ? 'Thinking…' : `Ask ${agent.name.split(' ')[0]} anything…`}
          disabled={busy}
          rows={1}
          className="flex-1 resize-none bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3.5 py-2 text-[13px] font-mono leading-[1.6] focus:outline-none focus:border-[var(--color-primary)] transition-colors max-h-32"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="w-10 h-10 rounded-xl text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex-shrink-0"
          style={{ background: agent.color }}
          aria-label="Send"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </form>

      <div className="px-6 sm:px-8 pb-3 flex items-center justify-between gap-3 text-[10px] font-mono text-[var(--color-text-faint)] tracking-wider">
        {models.length > 0 ? (
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="bg-transparent border border-[var(--color-border)] rounded px-2 py-1 text-[10px] font-mono text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
            disabled={busy}
          >
            {models.map((m) => (
              <option key={m.id} value={m.id} disabled={!m.ready}>
                {m.label}{m.free ? ' · free' : ''}{!m.ready ? ' (offline)' : ''}
              </option>
            ))}
          </select>
        ) : (
          <span>· 600 tokens max</span>
        )}
        {remaining !== null && <span>{remaining} messages left this hour</span>}
      </div>
    </div>
  );
};

export default AgentChat;
