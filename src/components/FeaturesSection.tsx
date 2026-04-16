import { useState, useRef, useEffect, useCallback, type FC } from 'react';

/* ═══════════════════════════════════════════════════
   Matrix Rain Canvas
   ═══════════════════════════════════════════════════ */
const MatrixRain: FC<{ active: boolean }> = ({ active }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const dropsRef = useRef<number[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.offsetWidth;
      canvas.height = parent.offsetHeight;
      dropsRef.current = Array.from(
        { length: Math.floor(canvas.width / 18) },
        () => Math.random() * canvas.height / 18
      );
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.fillStyle = active ? 'rgba(245,243,237,0.06)' : 'rgba(245,243,237,0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (!active) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      const fs = 18;
      const cols = Math.floor(canvas.width / fs);
      for (let i = 0; i < cols; i++) {
        const x = i * fs;
        const y = dropsRef.current[i] * fs;
        const b = Math.random();
        ctx.fillStyle = b > 0.7
          ? 'rgba(30,28,24,0.95)'
          : b > 0.4
            ? 'rgba(30,28,24,0.5)'
            : 'rgba(30,28,24,0.2)';
        ctx.font = `${b > 0.7 ? 'bold ' : ''}${fs}px "IBM Plex Mono",monospace`;
        ctx.fillText(Math.random() > 0.5 ? '1' : '0', x, y);
        if (y > canvas.height && Math.random() > 0.975) dropsRef.current[i] = 0;
        dropsRef.current[i] += 0.6 + Math.random() * 0.4;
      }
      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 1,
        transition: 'opacity 0.4s', opacity: active ? 1 : 0,
      }}
    />
  );
};

/* ═══════════════════════════════════════════════════
   Post-It Tag
   ═══════════════════════════════════════════════════ */
const palettes = {
  sage:  { bg: 'linear-gradient(145deg, #d5dac8 0%, #c9cfbb 100%)', t: '#3a3f32', s: '#5a6050' },
  cream: { bg: 'linear-gradient(145deg, #e8dfc8 0%, #ddd4bb 100%)', t: '#3a3520', s: '#6a6050' },
  blush: { bg: 'linear-gradient(145deg, #e8d5cc 0%, #ddc8bf 100%)', t: '#3f302a', s: '#6a5550' },
  sand:  { bg: 'linear-gradient(145deg, #ddd8c8 0%, #d0cbb7 100%)', t: '#3a3828', s: '#605e48' },
};

type PaletteKey = keyof typeof palettes;

interface PostItProps {
  title: string;
  subtitle?: string;
  color?: PaletteKey;
  rotation?: number;
  extraStyle?: React.CSSProperties;
}

const PostIt: FC<PostItProps> = ({ title, subtitle, color = 'sage', rotation = 0, extraStyle = {} }) => {
  const c = palettes[color];
  return (
    <div style={{
      background: c.bg, borderRadius: 5, padding: '18px 22px 14px', position: 'relative',
      transform: `rotate(${rotation}deg)`, transition: 'transform 0.3s ease',
      boxShadow: '2px 3px 10px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)',
      minWidth: 150, ...extraStyle,
    }}>
      <div style={{
        position: 'absolute', top: -3, left: 18, width: 7, height: 7, borderRadius: '50%',
        background: 'linear-gradient(135deg, #c8c4b8, #b0aca2)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.18)',
      }} />
      <div style={{
        fontFamily: '"IBM Plex Mono",monospace', fontSize: 11, fontWeight: 600,
        letterSpacing: '0.08em', textTransform: 'uppercase', color: c.t, lineHeight: 1.4,
      }}>{title}</div>
      {subtitle && (
        <div style={{
          fontFamily: '"IBM Plex Mono",monospace', fontSize: 9, fontWeight: 400,
          letterSpacing: '0.06em', textTransform: 'uppercase', color: c.s, marginTop: 3, lineHeight: 1.4,
        }}>{subtitle}</div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   Feature Card with Matrix Rain
   ═══════════════════════════════════════════════════ */
interface FeatureCardProps {
  icon: string;
  title: string;
  subtitle: string;
  tag: string;
  index: number;
}

const FeatureCard: FC<FeatureCardProps> = ({ icon, title, subtitle, tag, index }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="feature-card-animated"
      style={{
        position: 'relative',
        background: hovered ? 'rgba(245,243,237,.95)' : 'rgba(245,243,237,.7)',
        borderRadius: 12,
        padding: '28px 24px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all .4s ease',
        border: `1px solid rgba(30,28,24,${hovered ? .15 : .06})`,
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? '0 8px 30px rgba(0,0,0,.08)' : '0 2px 8px rgba(0,0,0,.03)',
        animationDelay: `${index * 0.08}s`,
        minHeight: 130,
      }}
    >
      <MatrixRain active={hovered} />
      <div style={{ position: 'relative', zIndex: 2 }}>
        {tag && (
          <div style={{
            display: 'inline-block', fontFamily: '"IBM Plex Mono",monospace', fontSize: 10,
            fontWeight: 500, letterSpacing: '.1em', textTransform: 'uppercase', color: '#7a7670',
            background: 'rgba(30,28,24,.06)', padding: '4px 10px', borderRadius: 4, marginBottom: 12,
          }}>{tag}</div>
        )}
        <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
        <h3 style={{
          fontFamily: '"Instrument Serif",Georgia,serif', fontSize: 22, fontWeight: 400,
          color: '#1a1a1a', margin: '0 0 6px', lineHeight: 1.3,
        }}>{title}</h3>
        <p style={{
          fontFamily: '"IBM Plex Mono",monospace', fontSize: 13, color: '#6a665e',
          margin: 0, lineHeight: 1.6,
        }}>{subtitle}</p>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   Main Section
   ═══════════════════════════════════════════════════ */
const FeaturesSection: FC = () => {
  return (
    <section className="py-20 md:py-28">
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
        {/* Post-It Tags */}
        <div style={{
          display: 'flex', gap: 20, marginBottom: 36, flexWrap: 'wrap', alignItems: 'flex-start',
        }} data-reveal>
          <PostIt title="Agent Skills" subtitle="Deep research, compare prices & more" color="sage" rotation={-1.5} />
          <PostIt title="Bring Your LLM" subtitle="Local or cloud" color="cream" rotation={0.8} />
          <PostIt title="Your Executive Assistant" subtitle="Send emails, calendar using MCP" color="sand" rotation={-0.5} extraStyle={{ marginTop: 8 }} />
          <PostIt title="MCP Servers" subtitle="40+ built-in integrations" color="blush" rotation={1.2} extraStyle={{ marginTop: 4 }} />
        </div>

        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }} data-reveal>
          <span className="section-label">[ 02 ]</span>
          <span className="section-label">Features</span>
        </div>
        <h2
          className="font-[var(--font-serif)] text-[length:var(--text-2xl)] leading-tight"
          style={{ fontWeight: 400, marginBottom: 36 }}
          data-split="words"
        >
          Build. Automate.{' '}
          <span className="text-[var(--color-primary)]" style={{ fontStyle: 'italic' }}>Accelerate.</span>
        </h2>

        {/* Feature Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="features-grid" data-stagger>
          <FeatureCard
            icon="🤖"
            title="AI-Powered Development"
            subtitle="Claude, GPT, Gemini — multi-agent systems that write, test, and deploy code autonomously."
            tag="AI Agents"
            index={0}
          />
          <FeatureCard
            icon="🧠"
            title="Multi-LLM Orchestration"
            subtitle="Route tasks to the best model. Claude for reasoning, Gemini for speed, local LLMs for privacy."
            tag="Bring Your LLM"
            index={1}
          />
          <FeatureCard
            icon="🔗"
            title="40+ Integrations via MCP"
            subtitle="Connect Gmail, Slack, Notion, Supabase, GitHub — all through Model Context Protocol."
            tag="MCP Servers"
            index={2}
          />
          <FeatureCard
            icon="⚡"
            title="Automated Workflows"
            subtitle="n8n pipelines, cron jobs, webhook triggers — your infrastructure runs while you sleep."
            tag="Automation"
            index={3}
          />
          <FeatureCard
            icon="🛠️"
            title="Full Stack Architecture"
            subtitle="Next.js, FastAPI, Supabase, Docker, Traefik — production-grade from day one."
            tag="Developer Tools"
            index={4}
          />
          <FeatureCard
            icon="🔒"
            title="Self-Hosted & Private"
            subtitle="Everything runs on your infrastructure. Hetzner, Docker Compose, zero vendor lock-in."
            tag="Privacy First"
            index={5}
          />
        </div>

        {/* Hint */}
        <p style={{
          textAlign: 'center', fontFamily: '"IBM Plex Mono",monospace', fontSize: 11,
          color: '#aaa69e', marginTop: 36,
        }}>
          ↑ Hover over cards for the Matrix effect ↑
        </p>
      </div>

      <style>{`
        @keyframes featureFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .feature-card-animated {
          animation: featureFadeUp 0.5s ease both;
        }
        @media (max-width: 768px) {
          .features-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .features-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </section>
  );
};

export default FeaturesSection;
