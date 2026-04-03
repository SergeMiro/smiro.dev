import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { Flip } from 'gsap/Flip';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText, Flip);

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ===== SMOOTH SCROLL =====
if (!prefersReduced) {
  const lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  (window as any).__lenis = lenis;
}

// ===== NAV ENTRANCE =====
if (!prefersReduced) {
  gsap.from('nav', { y: -20, opacity: 0, duration: 0.4, ease: 'power3.out' });
}

// ===== HERO SPLIT CHARS =====
const heroHeading = document.querySelector('[data-split="chars"]');
if (heroHeading && !prefersReduced) {
  const split = new SplitText(heroHeading, { type: 'chars' });
  gsap.from(split.chars, {
    y: 80, opacity: 0, stagger: 0.02, duration: 0.8, ease: 'power4.out', delay: 0.2,
  });
}

// ===== HERO SUB + CTAS =====
if (!prefersReduced) {
  const heroSub = document.querySelector('.hero-sub');
  if (heroSub) gsap.from(heroSub, { y: 30, opacity: 0, duration: 0.6, delay: 0.6, ease: 'power3.out' });

  const heroCtas = document.querySelector('.hero-ctas');
  if (heroCtas) gsap.from(heroCtas, { y: 20, opacity: 0, duration: 0.5, delay: 0.9, ease: 'power3.out' });
}

// ===== SCROLL-TRIGGERED ANIMATIONS =====
if (!prefersReduced) {
  // Word splits
  document.querySelectorAll('[data-split="words"]').forEach((el) => {
    const split = new SplitText(el, { type: 'words' });
    gsap.from(split.words, {
      scrollTrigger: { trigger: el, start: 'top 80%' },
      y: 40, opacity: 0, stagger: 0.04, duration: 0.6, ease: 'power3.out',
    });
  });

  // Fade-up reveals
  gsap.utils.toArray('[data-reveal]').forEach((el: any) => {
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 85%' },
      y: 40, opacity: 0, duration: 0.7, ease: 'power3.out',
    });
  });

  // Stagger reveals
  document.querySelectorAll('[data-stagger]').forEach((container: any) => {
    gsap.from(container.children, {
      scrollTrigger: { trigger: container, start: 'top 80%' },
      y: 30, opacity: 0, stagger: 0.08, duration: 0.6, ease: 'power3.out',
    });
  });

  // Count-up numbers
  document.querySelectorAll('[data-count]').forEach((el: any) => {
    const target = parseInt(el.dataset.count);
    const obj = { val: 0 };
    gsap.to(obj, {
      val: target, duration: 1.5, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
      onUpdate: () => { el.textContent = Math.floor(obj.val) + '+'; },
    });
  });

  // Scale reveals
  document.querySelectorAll('[data-scale-reveal]').forEach((container: any) => {
    gsap.from(container.children, {
      scrollTrigger: { trigger: container, start: 'top 80%' },
      scale: 0.8, opacity: 0, stagger: 0.05, duration: 0.5, ease: 'back.out(1.7)',
    });
  });

  // Scroll progress bar
  const progressBar = document.querySelector('[data-scroll-progress]');
  if (progressBar) {
    gsap.to(progressBar, {
      scaleX: 1, ease: 'none',
      scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 },
    });
  }
}

// ===== 3D CARD TILT (Mouse Tracking) =====
if (!prefersReduced) {
  document.querySelectorAll('[data-tilt]').forEach((el) => {
    const card = el as HTMLElement;
    const maxTilt = 12;

    card.addEventListener('mousemove', (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform =
        `perspective(1000px) rotateY(${x * maxTilt}deg) rotateX(${-y * maxTilt}deg) scale3d(1.02,1.02,1.02)`;
      card.style.transition = 'none';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateY(0) rotateX(0) scale3d(1,1,1)';
      card.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.5s ease';
    });
  });
}

// ===== CODE SNIPPET MATRIX EFFECT (on button/link click) =====
const codeSnippets = [
  'const ai = await claude.chat({\n  model: "opus",\n  prompt: query\n});',
  'docker compose up -d\n# deploying to prod...',
  'export async function POST() {\n  return json({ ok: true });\n}',
  'npx astro build\n✓ 12 pages built in 2.1s',
  'git push origin main\n→ deployed to vercel',
  'SELECT * FROM projects\nWHERE status = \'live\';',
  'import { pipeline } from\n  "langchain/chains";\nawait pipeline.run();',
  'const ws = new WebSocket(url);\nws.onmessage = handle;',
];

let activeSnippets: HTMLElement[] = [];

function spawnCodeSnippet(x: number, y: number) {
  const container = document.getElementById('code-snippets-container');
  if (!container) return;

  // Limit active snippets
  if (activeSnippets.length >= 3) {
    const old = activeSnippets.shift();
    old?.remove();
  }

  const snippet = document.createElement('div');
  snippet.className = 'code-snippet';
  snippet.textContent = codeSnippets[Math.floor(Math.random() * codeSnippets.length)];

  // Position near click with some offset
  const offsetX = (Math.random() - 0.5) * 200;
  const offsetY = (Math.random() - 0.5) * 120 - 60;
  snippet.style.left = Math.max(10, Math.min(window.innerWidth - 300, x + offsetX)) + 'px';
  snippet.style.top = Math.max(10, Math.min(window.innerHeight - 100, y + offsetY)) + 'px';

  container.appendChild(snippet);
  activeSnippets.push(snippet);

  // Trigger animation
  requestAnimationFrame(() => {
    snippet.classList.add('visible');
  });

  // Remove after delay
  setTimeout(() => {
    snippet.classList.remove('visible');
    setTimeout(() => {
      snippet.remove();
      activeSnippets = activeSnippets.filter(s => s !== snippet);
    }, 400);
  }, 2000);
}

// Attach to buttons and links with .code-trigger class
document.querySelectorAll('.code-trigger').forEach((el) => {
  el.addEventListener('click', (e: Event) => {
    const me = e as MouseEvent;
    spawnCodeSnippet(me.clientX, me.clientY);
  });
});

// Also attach to all main CTA-style buttons
document.querySelectorAll('a[href="/projects"], a[href="/contact"], button[type="submit"]').forEach((el) => {
  if (!el.classList.contains('code-trigger')) {
    el.addEventListener('click', (e: Event) => {
      const me = e as MouseEvent;
      spawnCodeSnippet(me.clientX, me.clientY);
    });
  }
});

// ===== LAZY LOAD OBSERVER =====
const lazyObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('loaded');
        lazyObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
);

document.querySelectorAll('[data-lazy]').forEach((el) => lazyObserver.observe(el));

// ===== THEME TOGGLE =====
const toggle = document.querySelector('[data-theme-toggle]');
if (toggle) {
  const saved = localStorage.getItem('theme');
  if (saved === 'light') document.documentElement.classList.add('light');

  toggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('light');
    const isLight = document.documentElement.classList.contains('light');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
  });
}

// ===== RE-INIT ON VIEW TRANSITIONS =====
document.addEventListener('astro:page-load', () => {
  ScrollTrigger.refresh();
});
