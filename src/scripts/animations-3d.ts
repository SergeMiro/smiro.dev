import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ─── Matrix Rain Canvas ───
function initMatrixCanvas() {
  const canvas = document.getElementById('matrixCanvas') as HTMLCanvasElement;
  const mask = document.getElementById('matrixMask') as HTMLElement;
  if (!canvas || !mask) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const chars = 'アイウエオカキクケコサシスセソタチツテト01{}[]<>/=;:.()#$%&*+-~^|\\!?@ABCDEFabcdef';
  const fontSize = 14;
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

    const style = getComputedStyle(document.documentElement);
    const primary = style.getPropertyValue('--color-primary').trim() || '#00c8a0';

    ctx!.font = `${fontSize}px 'Courier New', monospace`;

    for (let i = 0; i < columns.length; i++) {
      const char = chars[Math.floor(Math.random() * chars.length)];
      const x = i * fontSize;
      const y = columns[i] * fontSize;

      const brightness = 0.15 + Math.random() * 0.25;
      ctx!.fillStyle = `color-mix(in srgb, ${primary} ${Math.floor(brightness * 100)}%, transparent)`;
      ctx!.fillText(char, x, y);

      if (y > h && Math.random() > 0.975) {
        columns[i] = 0;
      }
      columns[i]++;
    }

    if (isActive) animId = requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize);

  // Press-to-reveal: show matrix rain under a circular mask
  let pressTimer: number;
  const sticky = document.querySelector('.cinematic__sticky') as HTMLElement;
  if (!sticky) return;

  function startPress(x: number, y: number) {
    isActive = true;
    canvas.style.opacity = '1';
    mask.style.opacity = '1';

    // Clear canvas for fresh rain
    ctx!.fillStyle = 'rgba(15, 14, 12, 1)';
    ctx!.fillRect(0, 0, w, h);

    draw();
    expandMask(x, y);
  }

  function expandMask(x: number, y: number) {
    const rect = sticky.getBoundingClientRect();
    const px = x - rect.left;
    const py = y - rect.top;

    gsap.to(mask, {
      '--mask-size': '250px',
      duration: 0.6,
      ease: 'power2.out',
      onUpdate() {
        const size = getComputedStyle(mask).getPropertyValue('--mask-size') || '0px';
        mask.style.maskImage = `radial-gradient(circle ${size} at ${px}px ${py}px, transparent 0%, black 100%)`;
        mask.style.webkitMaskImage = `radial-gradient(circle ${size} at ${px}px ${py}px, transparent 0%, black 100%)`;
      },
    });
    gsap.set(mask, { '--mask-size': '0px' });
  }

  function endPress() {
    isActive = false;
    cancelAnimationFrame(animId);
    gsap.to(canvas, { opacity: 0, duration: 0.4 });
    gsap.to(mask, { opacity: 0, duration: 0.3 });
  }

  sticky.addEventListener('mousedown', (e) => {
    startPress(e.clientX, e.clientY);
    spawnRipple(e.clientX, e.clientY);
  });
  sticky.addEventListener('mouseup', endPress);
  sticky.addEventListener('mouseleave', endPress);

  sticky.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    startPress(t.clientX, t.clientY);
    spawnRipple(t.clientX, t.clientY);
  }, { passive: true });
  sticky.addEventListener('touchend', endPress);
}

// ─── Click Ripple Effect ───
function spawnRipple(x: number, y: number) {
  const container = document.getElementById('rippleContainer');
  if (!container) return;

  const sticky = document.querySelector('.cinematic__sticky') as HTMLElement;
  const rect = sticky.getBoundingClientRect();

  const ripple = document.createElement('div');
  ripple.className = 'click-ripple';
  ripple.style.left = (x - rect.left) + 'px';
  ripple.style.top = (y - rect.top) + 'px';
  ripple.style.width = '300px';
  ripple.style.height = '300px';
  container.appendChild(ripple);

  // Second wider ripple
  setTimeout(() => {
    const r2 = document.createElement('div');
    r2.className = 'click-ripple';
    r2.style.left = (x - rect.left) + 'px';
    r2.style.top = (y - rect.top) + 'px';
    r2.style.width = '500px';
    r2.style.height = '500px';
    r2.style.borderColor = 'var(--color-accent)';
    container.appendChild(r2);
    setTimeout(() => r2.remove(), 900);
  }, 100);

  setTimeout(() => ripple.remove(), 900);
}

// ─── Cursor Glow ───
function initCursorGlow() {
  const glow = document.getElementById('cursorGlow');
  if (!glow) return;

  const sticky = document.querySelector('.cinematic__sticky') as HTMLElement;
  if (!sticky) return;

  sticky.addEventListener('mouseenter', () => {
    gsap.to(glow, { opacity: 1, duration: 0.3 });
  });

  sticky.addEventListener('mouseleave', () => {
    gsap.to(glow, { opacity: 0, duration: 0.3 });
  });

  sticky.addEventListener('mousemove', (e) => {
    const rect = sticky.getBoundingClientRect();
    gsap.to(glow, {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      duration: 0.4,
      ease: 'power2.out',
    });
  });
}

// ─── 3D Card Tilt on Hover ───
function initCardTilt() {
  document.querySelectorAll('[data-tilt-card]').forEach((card) => {
    const el = card as HTMLElement;
    const maxTilt = 8;

    el.addEventListener('mousemove', (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      gsap.to(el, {
        rotateY: x * maxTilt,
        rotateX: -y * maxTilt,
        scale: 1.02,
        duration: 0.4,
        ease: 'power2.out',
      });
    });

    el.addEventListener('mouseleave', () => {
      gsap.to(el, {
        rotateY: 0,
        rotateX: 0,
        scale: 1,
        duration: 0.6,
        ease: 'power3.out',
      });
    });
  });
}

// ─── Mouse Parallax on 3D Scene ───
function initSceneParallax() {
  const scene = document.querySelector('[data-scene3d]') as HTMLElement;
  const track = document.querySelector('[data-scene3d-track]') as HTMLElement;
  if (!scene || !track) return;

  const sticky = document.querySelector('.cinematic__sticky') as HTMLElement;
  if (!sticky) return;

  sticky.addEventListener('mousemove', (e) => {
    const rect = sticky.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    // Subtle tilt of the whole 3D scene based on mouse position
    gsap.to(track, {
      rotateY: -18 + x * 5,
      rotateX: 2 + y * -3,
      duration: 0.8,
      ease: 'power2.out',
      overwrite: 'auto',
    });
  });

  sticky.addEventListener('mouseleave', () => {
    gsap.to(track, {
      rotateY: -18,
      rotateX: 2,
      duration: 1,
      ease: 'power3.out',
      overwrite: 'auto',
    });
  });
}

// ─── Background Parallax on Scroll ───
function initBgParallax(section: HTMLElement) {
  const snippets = section.querySelectorAll('.bg-snippet');
  const brackets = section.querySelectorAll('.bg-bracket');
  const crosses = section.querySelectorAll('.bg-cross');

  // Each element moves at a different rate based on its position
  snippets.forEach((el, i) => {
    const rate = 0.3 + (i % 3) * 0.15;
    gsap.to(el, {
      y: () => -window.innerHeight * rate,
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 2,
      },
    });
  });

  brackets.forEach((el, i) => {
    const rate = 0.2 + (i % 2) * 0.2;
    gsap.to(el, {
      y: () => -window.innerHeight * rate * 0.5,
      rotate: (i % 2 === 0) ? 15 : -10,
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 3,
      },
    });
  });

  crosses.forEach((el, i) => {
    gsap.to(el, {
      y: () => -window.innerHeight * 0.15,
      opacity: 0.15 + (i % 3) * 0.1,
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 2.5,
      },
    });
  });
}

// ─── Card Counter Update ───
function initCardCounter(section: HTMLElement) {
  const counter = section.querySelector('[data-counter-current]');
  const cards = section.querySelectorAll('.scene3d__card');
  if (!counter || !cards.length) return;

  // Observe which card is closest to viewport center
  const observer = new IntersectionObserver(
    (entries) => {
      let bestCard = -1;
      let bestRatio = 0;
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > bestRatio) {
          bestRatio = entry.intersectionRatio;
          bestCard = parseInt((entry.target as HTMLElement).dataset.card || '0');
        }
      });
      if (bestCard >= 0) {
        const num = String(bestCard + 1).padStart(2, '0');
        if (counter.textContent !== num) {
          counter.textContent = num;
        }
      }
    },
    { threshold: [0, 0.25, 0.5, 0.75, 1], rootMargin: '-30% 0px -30% 0px' }
  );

  cards.forEach((card) => observer.observe(card));
}

// ─── Scan Line Transition ───
function fireScanline(master: gsap.core.Timeline, time: number) {
  const scanline = document.querySelector('[data-scanline]');
  if (!scanline) return;

  master.fromTo(
    scanline,
    { top: '0%', opacity: 0 },
    { top: '100%', opacity: 0.8, duration: 0.04, ease: 'none' },
    time
  );
  master.to(scanline, { opacity: 0, duration: 0.01, ease: 'none' }, time + 0.04);
}

// ─── Particle visibility tied to scroll ───
function initParticles() {
  const particles = document.querySelectorAll('.particle');
  if (!particles.length) return;

  particles.forEach((p, i) => {
    gsap.to(p, {
      opacity: 0.12 + Math.random() * 0.08,
      duration: 2,
      delay: i * 0.05,
      ease: 'power2.out',
    });
  });
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
    gsap.to(progressBar, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.3,
      },
    });
  }

  // ── Nav entrance ──
  if (!prefersReduced) {
    gsap.from('nav', { y: -20, opacity: 0, duration: 0.5, ease: 'power3.out' });
  }

  // ── Interactive effects ──
  if (!prefersReduced) {
    initMatrixCanvas();
    initCursorGlow();
    initParticles();
    initSceneParallax();
  }

  const section = document.getElementById('hero-3d');
  if (!section) return;

  const sticky = section.querySelector('.cinematic__sticky') as HTMLElement;
  if (!sticky) return;

  // ── Master Timeline ──
  const master = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.5,
      pin: sticky,
      pinSpacing: false,
    },
  });

  // ═══════════════════════════════════════════════
  // PHASE 1: Shutter Opening (0.00 → 0.22)
  // ═══════════════════════════════════════════════

  // Light leak pulses as shutters begin
  master.to('.cinematic__light-leak', { opacity: 1, duration: 0.08, ease: 'none' }, 0);

  // Shutters swing open with slight stagger
  master.to(
    '.cinematic__shutter--left',
    { rotateY: -120, duration: 0.18, ease: 'none' },
    0.02
  );
  master.to(
    '.cinematic__shutter--right',
    { rotateY: 120, duration: 0.18, ease: 'none' },
    0.03
  );

  // Window frame expands and disappears
  master.to(
    '.cinematic__window-frame',
    { scale: 3, opacity: 0, duration: 0.06, ease: 'none' },
    0.17
  );

  // Scene content fades in with slight scale
  master.fromTo(
    '.cinematic__scene-content',
    { opacity: 0, scale: 0.95 },
    { opacity: 1, scale: 1, duration: 0.08, ease: 'none' },
    0.14
  );

  // Background Group D (geometric) fades in early
  master.to('[data-bg-group="D"]', { opacity: 1, duration: 0.12, ease: 'none' }, 0.06);

  // Ambient orbs glow in
  master.to('.ambient-orb--1', { opacity: 0.06, duration: 0.15, ease: 'none' }, 0.08);
  master.to('.ambient-orb--2', { opacity: 0.04, duration: 0.15, ease: 'none' }, 0.10);
  master.to('.ambient-orb--3', { opacity: 0.03, duration: 0.15, ease: 'none' }, 0.12);

  // ═══════════════════════════════════════════════
  // PHASE 2: Hero Text Reveal (0.22 → 0.42)
  // ═══════════════════════════════════════════════

  // Hero lines — SplitText char animation with 3D depth
  const heroLines = section.querySelectorAll('[data-hero-line]');
  heroLines.forEach((line, i) => {
    const split = new SplitText(line, { type: 'chars' });
    master.fromTo(
      split.chars,
      { y: 100, rotateX: -80, opacity: 0, scale: 0.8 },
      {
        y: 0,
        rotateX: 0,
        opacity: 1,
        scale: 1,
        stagger: 0.003,
        duration: 0.06,
        ease: 'none',
      },
      0.22 + i * 0.045
    );
  });

  // Badge flies in from above
  master.fromTo(
    '[data-hero-badge]',
    { opacity: 0, y: -30, scale: 0.9 },
    { opacity: 1, y: 0, scale: 1, duration: 0.04, ease: 'none' },
    0.32
  );

  // Subtitle
  master.fromTo(
    '[data-hero-sub]',
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.04, ease: 'none' },
    0.35
  );

  // Scroll hint
  master.fromTo(
    '[data-scroll-hint]',
    { opacity: 0 },
    { opacity: 0.6, duration: 0.03, ease: 'none' },
    0.37
  );
  master.to('[data-scroll-hint]', { opacity: 0, duration: 0.02, ease: 'none' }, 0.40);

  // Background Group A (code) fades in
  master.to('[data-bg-group="A"]', { opacity: 1, duration: 0.08, ease: 'none' }, 0.24);

  // Background Group B (neural) fades in
  master.to('[data-bg-group="B"]', { opacity: 1, duration: 0.08, ease: 'none' }, 0.28);

  // ═══════════════════════════════════════════════
  // PHASE 2→3 Transition: Hero exits with depth
  // ═══════════════════════════════════════════════

  // Scan line wipe
  fireScanline(master, 0.38);

  master.to(
    '.cinematic__hero-content',
    { scale: 0.6, opacity: 0, y: -100, filter: 'blur(8px)', duration: 0.06, ease: 'none' },
    0.39
  );

  // ═══════════════════════════════════════════════
  // PHASE 3: 3D Perspective Conveyor (0.44 → 0.74)
  // ═══════════════════════════════════════════════

  // Cards label appears with tracking spread
  master.fromTo(
    '[data-cards-label]',
    { opacity: 0, letterSpacing: '0.5em' },
    { opacity: 1, letterSpacing: '0.25em', duration: 0.04, ease: 'none' },
    0.43
  );
  master.to('[data-cards-label]', { opacity: 0, y: -20, duration: 0.03, ease: 'none' }, 0.52);

  // 3D Conveyor: cards scroll vertically through perspective space
  const scene = section.querySelector('[data-scene3d]') as HTMLElement;
  const track = section.querySelector('[data-scene3d-track]') as HTMLElement;
  const cards = section.querySelectorAll('.scene3d__card');

  if (track && scene) {
    // Fade in the scene
    master.fromTo(
      scene,
      { opacity: 0 },
      { opacity: 1, duration: 0.04, ease: 'none' },
      0.43
    );

    // The conveyor scrolls cards upward through the 3D viewport
    // Calculate total distance: all cards + gaps need to scroll through
    master.fromTo(
      track,
      { y: () => window.innerHeight * 0.8 },
      {
        y: () => -(track.scrollHeight - window.innerHeight * 0.3),
        duration: 0.30,
        ease: 'none',
      },
      0.44
    );

    // Individual card depth stagger — each card has slightly different z
    cards.forEach((card, i) => {
      const zOffset = (i % 2 === 0) ? 20 : -15;
      const xOffset = (i % 2 === 0) ? -10 : 15;
      gsap.set(card, {
        z: zOffset,
        x: xOffset,
      });
    });
  }

  // Ambient orbs shift during card phase
  master.to('.ambient-orb--1', { x: '20vw', opacity: 0.08, duration: 0.20, ease: 'none' }, 0.44);
  master.to('.ambient-orb--2', { x: '-15vw', opacity: 0.06, duration: 0.20, ease: 'none' }, 0.44);

  // Background transitions during cards
  master.to('[data-bg-group="B"]', { opacity: 0, duration: 0.06, ease: 'none' }, 0.56);
  master.to('[data-bg-group="C"]', { opacity: 1, duration: 0.08, ease: 'none' }, 0.56);

  // Card counter shows during card phase
  master.fromTo(
    '[data-card-counter]',
    { opacity: 0 },
    { opacity: 0.7, duration: 0.03, ease: 'none' },
    0.45
  );
  master.to('[data-card-counter]', { opacity: 0, duration: 0.03, ease: 'none' }, 0.72);

  // ═══════════════════════════════════════════════
  // PHASE 3→4 Transition: Cards exit with blur
  // ═══════════════════════════════════════════════

  // Scan line wipe
  fireScanline(master, 0.73);

  if (scene) {
    master.to(scene, { opacity: 0, filter: 'blur(6px)', duration: 0.05, ease: 'none' }, 0.74);
  }
  master.to('[data-bg-group="A"]', { opacity: 0, duration: 0.05, ease: 'none' }, 0.74);

  // ═══════════════════════════════════════════════
  // PHASE 4: Contact CTA (0.78 → 1.00)
  // ═══════════════════════════════════════════════

  const ctaTitle = section.querySelector('[data-contact-title]');
  if (ctaTitle) {
    const split = new SplitText(ctaTitle, { type: 'chars' });
    master.fromTo(
      split.chars,
      { y: 80, rotateX: -60, opacity: 0, scale: 0.7 },
      {
        y: 0,
        rotateX: 0,
        opacity: 1,
        scale: 1,
        stagger: 0.006,
        duration: 0.08,
        ease: 'none',
      },
      0.80
    );
  }

  master.fromTo(
    '[data-contact-sub]',
    { opacity: 0, y: 30 },
    { opacity: 1, y: 0, duration: 0.05, ease: 'none' },
    0.88
  );

  master.fromTo(
    '[data-contact-btn]',
    { opacity: 0, y: 30, scale: 0.9 },
    { opacity: 1, y: 0, scale: 1, duration: 0.05, ease: 'none' },
    0.91
  );

  // Background groups fade out gently
  master.to('[data-bg-group="C"]', { opacity: 0.02, duration: 0.15, ease: 'none' }, 0.85);
  master.to('[data-bg-group="D"]', { opacity: 0.1, duration: 0.15, ease: 'none' }, 0.85);

  // Ambient orbs converge for CTA
  master.to('.ambient-orb--1', { x: '0', y: '0', opacity: 0.08, duration: 0.15, ease: 'none' }, 0.80);
  master.to('.ambient-orb--2', { x: '0', y: '0', opacity: 0.06, duration: 0.15, ease: 'none' }, 0.80);
  master.to('.ambient-orb--3', { opacity: 0.05, scale: 1.3, duration: 0.15, ease: 'none' }, 0.80);

  // Init interactive features after DOM is ready
  if (!prefersReduced) {
    initBgParallax(section);
    initCardCounter(section);
  }
  requestAnimationFrame(() => {
    initCardTilt();
  });
}
