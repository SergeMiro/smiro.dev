import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { perlin2 } from './perlin';

gsap.registerPlugin(ScrollTrigger, SplitText);

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = window.matchMedia('(max-width: 768px)').matches;
const isTouch = 'ontouchstart' in window;

// ═══════════════════════════════════════════════════
// VISIBILITY PAUSE SYSTEM (wodniack pattern)
// ═══════════════════════════════════════════════════

const activeTickers = new Set<() => void>();
let tickerRunning = false;

function startTicker(fn: () => void) {
  activeTickers.add(fn);
  if (!tickerRunning) {
    tickerRunning = true;
    gsap.ticker.add(tickAll);
  }
}

function stopTicker(fn: () => void) {
  activeTickers.delete(fn);
  if (activeTickers.size === 0 && tickerRunning) {
    tickerRunning = false;
    gsap.ticker.remove(tickAll);
  }
}

function tickAll() {
  activeTickers.forEach((fn) => fn());
}

// Pause/resume a tick function based on element visibility
function observeVisibility(el: HTMLElement, tickFn: () => void) {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        startTicker(tickFn);
      } else {
        stopTicker(tickFn);
      }
    },
    { threshold: 0 }
  );
  observer.observe(el);
}

// Also pause on tab hidden
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    activeTickers.forEach((fn) => gsap.ticker.remove(tickAll));
    tickerRunning = false;
  } else if (activeTickers.size > 0) {
    tickerRunning = true;
    gsap.ticker.add(tickAll);
  }
});

// ═══════════════════════════════════════════════════
// PERLIN WAVE SEPARATOR
// ═══════════════════════════════════════════════════

function initPerlinWave() {
  const path1 = document.querySelector('[data-wave-path="1"]') as SVGPathElement;
  const path2 = document.querySelector('[data-wave-path="2"]') as SVGPathElement;
  const waveEl = document.querySelector('[data-wave]') as HTMLElement;
  if (!path1 || !path2 || !waveEl) return;

  let time = 0;
  let mouseX = 0.5;
  let mouseForce = 0;
  let targetForce = 0;

  const sticky = document.querySelector('.cinematic__sticky') as HTMLElement;
  if (sticky && !isTouch) {
    sticky.addEventListener('mousemove', (e) => {
      const rect = sticky.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) / rect.width;
      targetForce = 0.3;
    });
    sticky.addEventListener('mouseleave', () => { targetForce = 0; });
  }

  function buildPath(t: number, amplitude: number, freq: number, yOffset: number): string {
    let d = `M 0 ${100 + yOffset}`;
    for (let x = 0; x <= 1440; x += 8) {
      const nx = x / 1440;
      const noise = perlin2(nx * freq + t, t * 0.3) * amplitude;
      // Cursor interaction: local force near mouseX
      const dist = Math.abs(nx - mouseX);
      const cursorEffect = mouseForce * Math.max(0, 1 - dist * 4) * 20;
      const y = 100 + yOffset + noise + cursorEffect;
      d += ` L ${x} ${y.toFixed(1)}`;
    }
    return d;
  }

  function tick() {
    time += 0.008;
    mouseForce += (targetForce - mouseForce) * 0.05; // inertia/friction

    path1.setAttribute('d', buildPath(time, 25, 3, 0));
    path2.setAttribute('d', buildPath(time + 10, 18, 4, 15));
  }

  observeVisibility(waveEl, tick);
}

// ═══════════════════════════════════════════════════
// MATRIX RAIN (press-to-reveal)
// ═══════════════════════════════════════════════════

function initMatrixCanvas() {
  const canvas = document.getElementById('matrixCanvas') as HTMLCanvasElement;
  const mask = document.getElementById('matrixMask') as HTMLElement;
  if (!canvas || !mask) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const chars = 'アイウエオカキクケコ01{}[]<>/=;:.()#$&*+-~';
  const fontSize = isMobile ? 16 : 14;
  let columns: number[] = [];
  let w = 0, h = 0;
  let animId = 0;
  let isActive = false;

  function resize() {
    w = canvas.width = canvas.offsetWidth;
    h = canvas.height = canvas.offsetHeight;
    const colCount = Math.floor(w / fontSize);
    columns = Array(colCount).fill(0).map(() => Math.floor(Math.random() * h / fontSize));
  }

  function draw() {
    ctx!.fillStyle = 'rgba(15, 14, 12, 0.06)';
    ctx!.fillRect(0, 0, w, h);
    ctx!.font = `${fontSize}px 'Courier New', monospace`;
    ctx!.fillStyle = 'rgba(0, 200, 160, 0.2)';

    for (let i = 0; i < columns.length; i++) {
      const char = chars[Math.floor(Math.random() * chars.length)];
      ctx!.fillText(char, i * fontSize, columns[i] * fontSize);
      if (columns[i] * fontSize > h && Math.random() > 0.975) columns[i] = 0;
      columns[i]++;
    }
    if (isActive) animId = requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize);

  const sticky = document.querySelector('.cinematic__sticky') as HTMLElement;
  if (!sticky) return;

  function startPress(x: number, y: number) {
    isActive = true;
    canvas.style.opacity = '1';
    mask.style.opacity = '1';
    ctx!.fillStyle = 'rgba(15, 14, 12, 1)';
    ctx!.fillRect(0, 0, w, h);
    draw();

    const rect = sticky.getBoundingClientRect();
    const px = x - rect.left;
    const py = y - rect.top;
    const size = isMobile ? '150px' : '250px';

    gsap.fromTo(mask, { '--ms': '0' }, {
      '--ms': '1', duration: 0.6, ease: 'power2.out',
      onUpdate() {
        const s = parseFloat(gsap.getProperty(mask, '--ms') as string) * parseInt(size);
        mask.style.maskImage = `radial-gradient(circle ${s}px at ${px}px ${py}px, transparent 0%, black 100%)`;
        (mask.style as any).webkitMaskImage = mask.style.maskImage;
      },
    });

    spawnRipple(x, y);
  }

  function endPress() {
    isActive = false;
    cancelAnimationFrame(animId);
    gsap.to(canvas, { opacity: 0, duration: 0.4 });
    gsap.to(mask, { opacity: 0, duration: 0.3 });
  }

  sticky.addEventListener('mousedown', (e) => startPress(e.clientX, e.clientY));
  sticky.addEventListener('mouseup', endPress);
  sticky.addEventListener('mouseleave', endPress);
  sticky.addEventListener('touchstart', (e) => startPress(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
  sticky.addEventListener('touchend', endPress);
}

// ═══════════════════════════════════════════════════
// CLICK RIPPLE
// ═══════════════════════════════════════════════════

function spawnRipple(x: number, y: number) {
  const container = document.getElementById('rippleContainer');
  const sticky = document.querySelector('.cinematic__sticky') as HTMLElement;
  if (!container || !sticky) return;
  const rect = sticky.getBoundingClientRect();
  const lx = x - rect.left, ly = y - rect.top;

  [{ w: 300, delay: 0, color: '' }, { w: 500, delay: 100, color: 'var(--color-accent)' }].forEach(({ w, delay, color }) => {
    setTimeout(() => {
      const r = document.createElement('div');
      r.className = 'click-ripple';
      r.style.cssText = `left:${lx}px;top:${ly}px;width:${w}px;height:${w}px;${color ? `border-color:${color}` : ''}`;
      container.appendChild(r);
      setTimeout(() => r.remove(), 900);
    }, delay);
  });
}

// ═══════════════════════════════════════════════════
// CURSOR GLOW + CARD TILT + SCENE PARALLAX + MAGNETIC
// ═══════════════════════════════════════════════════

function initCursorGlow() {
  const glow = document.getElementById('cursorGlow');
  const sticky = document.querySelector('.cinematic__sticky') as HTMLElement;
  if (!glow || !sticky) return;

  sticky.addEventListener('mouseenter', () => gsap.to(glow, { opacity: 1, duration: 0.3 }));
  sticky.addEventListener('mouseleave', () => gsap.to(glow, { opacity: 0, duration: 0.3 }));
  sticky.addEventListener('mousemove', (e) => {
    const rect = sticky.getBoundingClientRect();
    gsap.to(glow, { x: e.clientX - rect.left, y: e.clientY - rect.top, duration: 0.4, ease: 'power2.out' });
  });
}

function initCardTilt() {
  document.querySelectorAll('[data-tilt-card]').forEach((card) => {
    const el = card as HTMLElement;
    el.addEventListener('mousemove', (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      gsap.to(el, { rotateY: x * 8, rotateX: -y * 8, scale: 1.02, duration: 0.4, ease: 'power2.out' });
    });
    el.addEventListener('mouseleave', () => {
      gsap.to(el, { rotateY: 0, rotateX: 0, scale: 1, duration: 0.6, ease: 'power3.out' });
    });
  });
}

function initSceneParallax() {
  const track = document.querySelector('[data-scene3d-track]') as HTMLElement;
  const sticky = document.querySelector('.cinematic__sticky') as HTMLElement;
  if (!track || !sticky) return;

  sticky.addEventListener('mousemove', (e) => {
    const rect = sticky.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    gsap.to(track, { rotateY: -18 + x * 5, rotateX: 2 + y * -3, duration: 0.8, ease: 'power2.out', overwrite: 'auto' });
  });
  sticky.addEventListener('mouseleave', () => {
    gsap.to(track, { rotateY: -18, rotateX: 2, duration: 1, ease: 'power3.out', overwrite: 'auto' });
  });
}

function initMagneticButton() {
  document.querySelectorAll('[data-magnetic]').forEach((wrap) => {
    const el = wrap as HTMLElement;
    const btn = el.querySelector('a, button') as HTMLElement;
    if (!btn) return;
    el.addEventListener('mousemove', (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      gsap.to(btn, { x: (e.clientX - rect.left - rect.width / 2) * 0.3, y: (e.clientY - rect.top - rect.height / 2) * 0.3, duration: 0.4, ease: 'power2.out' });
    });
    el.addEventListener('mouseleave', () => gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' }));
  });
}

// ═══════════════════════════════════════════════════
// BG PARALLAX + PARTICLES
// ═══════════════════════════════════════════════════

function initBgParallax(section: HTMLElement) {
  const factor = isMobile ? 0.4 : 1;
  const scrubBase = isMobile ? 3 : 2;

  section.querySelectorAll('.bg-snippet').forEach((el, i) => {
    gsap.to(el, { y: () => -window.innerHeight * (0.3 + (i % 3) * 0.15) * factor, scrollTrigger: { trigger: section, start: 'top top', end: 'bottom bottom', scrub: scrubBase } });
  });
  section.querySelectorAll('.bg-bracket').forEach((el, i) => {
    gsap.to(el, { y: () => -window.innerHeight * (0.2 + (i % 2) * 0.2) * factor * 0.5, rotate: isMobile ? 0 : ((i % 2 === 0) ? 15 : -10), scrollTrigger: { trigger: section, start: 'top top', end: 'bottom bottom', scrub: scrubBase + 1 } });
  });
  section.querySelectorAll('.bg-cross').forEach((el) => {
    gsap.to(el, { y: () => -window.innerHeight * 0.15 * factor, scrollTrigger: { trigger: section, start: 'top top', end: 'bottom bottom', scrub: scrubBase + 0.5 } });
  });
}

function initParticles() {
  document.querySelectorAll('.particle').forEach((p, i) => {
    gsap.to(p, { opacity: 0.12 + Math.random() * 0.08, duration: 2, delay: i * 0.05, ease: 'power2.out' });
  });
}

// ═══════════════════════════════════════════════════
// CARD COUNTER + SPOTLIGHT + PROGRESS
// ═══════════════════════════════════════════════════

function initCardCounter(section: HTMLElement) {
  const counter = section.querySelector('[data-counter-current]');
  const cards = section.querySelectorAll('.scene3d__card');
  if (!counter || !cards.length) return;

  const observer = new IntersectionObserver((entries) => {
    let best = -1, bestR = 0;
    entries.forEach((e) => { if (e.isIntersecting && e.intersectionRatio > bestR) { bestR = e.intersectionRatio; best = parseInt((e.target as HTMLElement).dataset.card || '0'); } });
    if (best >= 0) { const num = String(best + 1).padStart(2, '0'); if (counter.textContent !== num) counter.textContent = num; }
  }, { threshold: [0, 0.25, 0.5, 0.75, 1], rootMargin: '-30% 0px -30% 0px' });
  cards.forEach((c) => observer.observe(c));
}

function initCardSpotlight(section: HTMLElement) {
  const cards = section.querySelectorAll('.scene3d__card');
  if (!cards.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((e) => e.target.classList.toggle('is-spotlight', e.intersectionRatio > 0.6));
  }, { threshold: [0, 0.3, 0.6, 1], rootMargin: '-25% 0px -25% 0px' });
  cards.forEach((c) => observer.observe(c));
}

// ═══════════════════════════════════════════════════
// TERMINAL TYPING + PHASE INDICATOR + SCANLINE
// ═══════════════════════════════════════════════════

function initTerminalTyping(master: gsap.core.Timeline) {
  const textEl = document.querySelector('[data-terminal-text]');
  const terminalEl = document.querySelector('[data-hero-terminal]');
  if (!textEl || !terminalEl) return;

  const lines = ['npx astro build && vercel --prod', 'claude chat --model opus', 'docker compose up -d'];
  const fullText = lines[Math.floor(Math.random() * lines.length)];
  master.to(terminalEl, { opacity: 1, duration: 0.02, ease: 'none' }, 0.34);
  let currentText = '';
  fullText.split('').forEach((char, i) => {
    master.call(() => { currentText += char; textEl.textContent = currentText; }, undefined, 0.34 + (i * 0.03 / fullText.length));
  });
  master.to(terminalEl, { opacity: 0, duration: 0.02, ease: 'none' }, 0.38);
}

function initPhaseIndicator(master: gsap.core.Timeline) {
  gsap.set('[data-phase-indicator]', { opacity: 0 });
  master.to('[data-phase-indicator]', { opacity: 1, duration: 0.04, ease: 'none' }, 0.05);
  const phases = [{ dot: 1, start: 0, end: 0.22 }, { dot: 2, start: 0.22, end: 0.44 }, { dot: 3, start: 0.44, end: 0.78 }, { dot: 4, start: 0.78, end: 1.0 }];
  const trigger = master.scrollTrigger;
  if (trigger) {
    trigger.vars.onUpdate = function (self: ScrollTrigger) {
      const p = self.progress;
      phases.forEach(({ dot, start, end }) => {
        const el = document.querySelector(`[data-phase-dot="${dot}"]`);
        if (el) el.classList.toggle('phase-dot--active', p >= start && p < end);
      });
    };
  }
}

function fireScanline(master: gsap.core.Timeline, time: number) {
  const scanline = document.querySelector('[data-scanline]');
  if (!scanline) return;
  master.fromTo(scanline, { top: '0%', opacity: 0 }, { top: '100%', opacity: 0.8, duration: 0.04, ease: 'none' }, time);
  master.to(scanline, { opacity: 0, duration: 0.01, ease: 'none' }, time + 0.04);
}

// ═══════════════════════════════════════════════════
// MAIN INIT
// ═══════════════════════════════════════════════════

export function init3DAnimations() {
  // ── Smooth Scroll ──
  if (!prefersReduced) {
    const lenis = new Lenis({ lerp: 0.06, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    (window as any).__lenis = lenis;
  }

  // ── Scroll progress bar ──
  const progressBar = document.querySelector('[data-scroll-progress]');
  if (progressBar) {
    gsap.to(progressBar, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 } });
  }

  // ── Nav ──
  if (!prefersReduced) gsap.from('nav', { y: -20, opacity: 0, duration: 0.5, ease: 'power3.out' });

  // ── Interactive ──
  if (!prefersReduced) {
    initMatrixCanvas();
    initParticles();
    initPerlinWave();
    if (!isTouch) { initCursorGlow(); initSceneParallax(); initMagneticButton(); }
  }

  const section = document.getElementById('hero-3d');
  if (!section) return;
  const sticky = section.querySelector('.cinematic__sticky') as HTMLElement;
  if (!sticky) return;

  // ── Master Timeline (scrub: 1 = tighter scroll coupling) ──
  const master = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1,
      pin: sticky,
      pinSpacing: false,
      anticipatePin: 1,
    },
  });

  // ═══════════════════════════════════════════════
  // PHASE 1: Portal Reveal (0.00 → 0.22)
  // ═══════════════════════════════════════════════

  // Portal clip-path opens from small inset to full viewport
  master.to('[data-portal]', {
    clipPath: 'inset(0% 0% 0% 0% round 0px)',
    duration: 0.15,
    ease: 'none',
  }, 0);

  // Scene scales up from 0.8 → 1 (depth sensation)
  master.fromTo('.cinematic__scene-content',
    { opacity: 0, scale: 0.8 },
    { opacity: 1, scale: 1, duration: 0.18, ease: 'none' },
    0.04
  );

  // Shutters swing open inside the portal
  master.to('.portal__shutter--left', { rotateY: -120, duration: 0.14, ease: 'none' }, 0.02);
  master.to('.portal__shutter--right', { rotateY: 120, duration: 0.14, ease: 'none' }, 0.03);

  // Portal frame disappears once fully open
  master.to('[data-portal-frame]', { opacity: 0, duration: 0.04, ease: 'none' }, 0.16);
  // Then hide portal entirely to avoid clip-path overhead
  master.set('[data-portal]', { clipPath: 'none' }, 0.22);

  // Light rays
  master.to('[data-lightrays]', { opacity: 1, duration: 0.06, ease: 'none' }, 0.04);
  master.to('[data-lightrays]', { opacity: 0, duration: 0.06, ease: 'none' }, 0.16);

  // BG + orbs
  master.to('[data-bg-group="D"]', { opacity: 1, duration: 0.12, ease: 'none' }, 0.06);
  master.to('.ambient-orb--1', { opacity: 0.06, duration: 0.15, ease: 'none' }, 0.08);
  master.to('.ambient-orb--2', { opacity: 0.04, duration: 0.15, ease: 'none' }, 0.10);
  master.to('.ambient-orb--3', { opacity: 0.03, duration: 0.15, ease: 'none' }, 0.12);

  // ═══════════════════════════════════════════════
  // PHASE 2: Hero Text (0.22 → 0.42)
  // ═══════════════════════════════════════════════

  master.fromTo('[data-cursor-block]', { opacity: 0 }, { opacity: 1, duration: 0.02, ease: 'none' }, 0.19);
  master.to('[data-cursor-block]', { opacity: 0, display: 'none', duration: 0.01, ease: 'none' }, 0.22);

  const heroLines = section.querySelectorAll('[data-hero-line]');
  heroLines.forEach((line, i) => {
    const split = new SplitText(line, { type: 'chars' });
    master.fromTo(split.chars,
      { y: 100, rotateX: -80, opacity: 0, scale: 0.8 },
      { y: 0, rotateX: 0, opacity: 1, scale: 1, stagger: 0.003, duration: 0.06, ease: 'none' },
      0.22 + i * 0.045
    );
  });

  master.fromTo('[data-hero-badge]', { opacity: 0, y: -30, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.04, ease: 'none' }, 0.32);
  master.fromTo('[data-hero-sub]', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.04, ease: 'none' }, 0.35);
  master.fromTo('[data-scroll-hint]', { opacity: 0 }, { opacity: 0.6, duration: 0.03, ease: 'none' }, 0.37);
  master.to('[data-scroll-hint]', { opacity: 0, duration: 0.02, ease: 'none' }, 0.40);

  master.to('[data-bg-group="A"]', { opacity: 1, duration: 0.08, ease: 'none' }, 0.24);
  master.to('[data-bg-group="B"]', { opacity: 1, duration: 0.08, ease: 'none' }, 0.28);

  // Wave separator appears
  master.to('[data-wave]', { opacity: 1, duration: 0.06, ease: 'none' }, 0.34);
  master.to('[data-wave]', { opacity: 0, duration: 0.04, ease: 'none' }, 0.41);

  // ═══════════════════════════════════════════════
  // PHASE 2→3 Transition
  // ═══════════════════════════════════════════════

  fireScanline(master, 0.38);
  master.to('.cinematic__hero-content', { scale: 0.6, opacity: 0, y: -100, filter: 'blur(8px)', duration: 0.06, ease: 'none' }, 0.39);

  // ═══════════════════════════════════════════════
  // PHASE 3: 3D Conveyor with Progress (0.44 → 0.74)
  // ═══════════════════════════════════════════════

  master.fromTo('[data-cards-label]', { opacity: 0, letterSpacing: '0.5em' }, { opacity: 1, letterSpacing: '0.25em', duration: 0.04, ease: 'none' }, 0.43);
  master.to('[data-cards-label]', { opacity: 0, y: -20, duration: 0.03, ease: 'none' }, 0.52);

  const scene = section.querySelector('[data-scene3d]') as HTMLElement;
  const track = section.querySelector('[data-scene3d-track]') as HTMLElement;
  const cards = section.querySelectorAll('.scene3d__card');

  if (track && scene) {
    master.fromTo(scene, { opacity: 0 }, { opacity: 1, duration: 0.04, ease: 'none' }, 0.43);

    // Vertical conveyor scroll
    master.fromTo(track,
      { y: () => window.innerHeight * 0.8 },
      { y: () => -(track.scrollHeight - window.innerHeight * 0.3), duration: 0.30, ease: 'none' },
      0.44
    );

    // Progress-driven cards: animate progress attr from 1 → -1 with stagger
    // This drives CSS --progress which controls depth, scale, opacity
    cards.forEach((card, i) => {
      const el = card as HTMLElement;
      const zOffset = (i % 2 === 0) ? 20 : -15;
      const xOffset = (i % 2 === 0) ? -10 : 15;
      gsap.set(el, { z: zOffset, x: xOffset });

      // Animate progress: starts at 1 (upcoming), goes to 0 (center), then -1 (past)
      const staggerOffset = i * (0.28 / cards.length);
      master.fromTo(el,
        { attr: { progress: 1 } },
        {
          attr: { progress: -1 },
          duration: 0.28,
          ease: 'none',
          onUpdate() {
            const p = parseFloat(el.getAttribute('progress') || '0');
            el.style.setProperty('--progress', p.toFixed(3));
          },
        },
        0.44 + staggerOffset
      );
    });
  }

  master.to('.ambient-orb--1', { x: '20vw', opacity: 0.08, duration: 0.20, ease: 'none' }, 0.44);
  master.to('.ambient-orb--2', { x: '-15vw', opacity: 0.06, duration: 0.20, ease: 'none' }, 0.44);
  master.to('[data-bg-group="B"]', { opacity: 0, duration: 0.06, ease: 'none' }, 0.56);
  master.to('[data-bg-group="C"]', { opacity: 1, duration: 0.08, ease: 'none' }, 0.56);

  master.fromTo('[data-card-counter]', { opacity: 0 }, { opacity: 0.7, duration: 0.03, ease: 'none' }, 0.45);
  master.to('[data-card-counter]', { opacity: 0, duration: 0.03, ease: 'none' }, 0.72);

  // ═══════════════════════════════════════════════
  // PHASE 3→4 Transition
  // ═══════════════════════════════════════════════

  fireScanline(master, 0.73);
  if (scene) master.to(scene, { opacity: 0, filter: 'blur(6px)', duration: 0.05, ease: 'none' }, 0.74);
  master.to('[data-bg-group="A"]', { opacity: 0, duration: 0.05, ease: 'none' }, 0.74);

  // ═══════════════════════════════════════════════
  // PHASE 4: Contact CTA (0.78 → 1.00)
  // ═══════════════════════════════════════════════

  const ctaTitle = section.querySelector('[data-contact-title]');
  if (ctaTitle) {
    const split = new SplitText(ctaTitle, { type: 'chars' });
    master.fromTo(split.chars,
      { y: 80, rotateX: -60, opacity: 0, scale: 0.7 },
      { y: 0, rotateX: 0, opacity: 1, scale: 1, stagger: 0.006, duration: 0.08, ease: 'none' },
      0.80
    );
  }

  master.fromTo('[data-contact-sub]', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.05, ease: 'none' }, 0.88);
  master.fromTo('[data-contact-btn]', { opacity: 0, y: 30, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.05, ease: 'none' }, 0.91);

  master.to('[data-bg-group="C"]', { opacity: 0.02, duration: 0.15, ease: 'none' }, 0.85);
  master.to('[data-bg-group="D"]', { opacity: 0.1, duration: 0.15, ease: 'none' }, 0.85);
  master.to('.ambient-orb--1', { x: '0', y: '0', opacity: 0.08, duration: 0.15, ease: 'none' }, 0.80);
  master.to('.ambient-orb--2', { x: '0', y: '0', opacity: 0.06, duration: 0.15, ease: 'none' }, 0.80);
  master.to('.ambient-orb--3', { opacity: 0.05, scale: 1.3, duration: 0.15, ease: 'none' }, 0.80);

  // ── Init features ──
  initTerminalTyping(master);
  if (!prefersReduced) {
    initBgParallax(section);
    initCardCounter(section);
    initCardSpotlight(section);
    initPhaseIndicator(master);
  }
  if (!isTouch) requestAnimationFrame(() => initCardTilt());
}
