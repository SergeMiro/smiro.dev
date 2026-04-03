import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { Flip } from 'gsap/Flip';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText, Flip);

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const viewMode = localStorage.getItem('viewMode') || '2d';

// ── 3D Mode ──
if (viewMode === '3d') {
  document.documentElement.setAttribute('data-view', '3d');
  import('./animations-3d').then(({ init3DAnimations }) => {
    init3DAnimations();
  });

  // Theme toggle (shared between modes)
  initThemeToggle();
} else {
  // ── 2D Mode (original) ──
  document.documentElement.setAttribute('data-view', '2d');
  init2DAnimations();
}

function init2DAnimations() {
  // Smooth scroll
  if (!prefersReduced) {
    const lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    (window as any).__lenis = lenis;
  }

  // Nav entrance
  if (!prefersReduced) {
    gsap.from('nav', { y: -20, opacity: 0, duration: 0.4, ease: 'power3.out' });
  }

  // Hero SplitText chars
  const heroHeading = document.querySelector('[data-split="chars"]');
  if (heroHeading && !prefersReduced) {
    const split = new SplitText(heroHeading, { type: 'chars' });
    gsap.from(split.chars, {
      y: 80, opacity: 0, stagger: 0.02, duration: 0.8, ease: 'power4.out', delay: 0.2,
    });
  }

  // Hero sub + CTAs
  if (!prefersReduced) {
    const heroSub = document.querySelector('.hero-sub');
    if (heroSub) gsap.from(heroSub, { y: 30, opacity: 0, duration: 0.6, delay: 0.6, ease: 'power3.out' });

    const heroCtas = document.querySelector('.hero-ctas');
    if (heroCtas) gsap.from(heroCtas, { y: 20, opacity: 0, duration: 0.5, delay: 0.9, ease: 'power3.out' });
  }

  // Scroll-triggered animations
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

  // Theme toggle
  initThemeToggle();
}

function initThemeToggle() {
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
}
