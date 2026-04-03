import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);

// ── Easing map (wodniack-style named curves) ──
const ease = {
  expo: 'expo.inOut',
  expoOut: 'expo.out',
  expoIn: 'expo.in',
  smooth: 'power3.out',
  smooth2: 'power4.out',
  bounce: 'back.out(1.4)',
};

export function init3DAnimations() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  // ── Smooth scroll ──
  const lenis = new Lenis({ lerp: 0.06, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  (window as any).__lenis = lenis;

  // ── Nav entrance ──
  gsap.from('nav', { y: -30, opacity: 0, duration: 0.8, ease: ease.smooth });

  // ── Scroll progress bar ──
  const progressBar = document.querySelector('[data-scroll-progress]');
  if (progressBar) {
    gsap.to(progressBar, {
      scaleX: 1, ease: 'none',
      scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 },
    });
  }

  // ── Sections ──
  initHero();
  initAbout();
  initProjects();
  initContact();
}

// ═══════════════════════════════════════
// HERO — pinned, scroll-driven typography
// ═══════════════════════════════════════
function initHero() {
  const section = document.getElementById('hero-3d');
  if (!section) return;

  const sticky = section.querySelector('.hero-3d__sticky') as HTMLElement;
  const lines = section.querySelectorAll('[data-hero-line]');
  const badge = section.querySelector('[data-hero-badge]');
  const sub = section.querySelector('[data-hero-sub]');
  const scroll = section.querySelector('[data-hero-scroll]');
  const ticker = section.querySelector('[data-hero-ticker]');
  const grid = section.querySelector('.hero-3d__grid');
  const crosses = section.querySelectorAll('.hero-3d__cross');

  // ── Entrance timeline (plays once) ──
  const entrance = gsap.timeline({ delay: 0.2 });

  // Grid fades in
  entrance.from(grid, { opacity: 0, duration: 1.2, ease: ease.smooth });

  // Crosses
  entrance.from(crosses, { opacity: 0, scale: 0, duration: 0.6, stagger: 0.1, ease: ease.bounce }, 0.3);

  // Lines appear one by one with stagger
  lines.forEach((line, i) => {
    const split = new SplitText(line, { type: 'chars' });
    entrance.to(line, { opacity: 1, duration: 0.01 }, 0.3 + i * 0.2);
    entrance.from(split.chars, {
      y: 120,
      rotateX: -80,
      opacity: 0,
      stagger: 0.02,
      duration: 0.8,
      ease: ease.smooth2,
    }, 0.3 + i * 0.2);
  });

  // Badge
  entrance.to(badge, { opacity: 1, duration: 0.6, ease: ease.smooth }, 0.9);

  // Ticker
  entrance.to(ticker, { opacity: 1, duration: 0.8, ease: ease.smooth }, 1.0);

  // Sub text
  entrance.to(sub, { opacity: 1, duration: 0.6, ease: ease.smooth }, 1.1);

  // Scroll indicator
  entrance.to(scroll, { opacity: 1, duration: 0.6, ease: ease.smooth }, 1.3);

  // ── Scroll-driven exit timeline (pinned) ──
  const scrollTl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: '+=200%',
      scrub: 1,
      pin: sticky,
      pinSpacing: false,
    },
  });

  // Lines spread apart and scale
  scrollTl.to(lines[0], { y: '-30vh', scale: 1.3, opacity: 0.2, ease: 'none' }, 0);
  scrollTl.to(lines[1], { scale: 1.5, opacity: 0.15, ease: 'none' }, 0);
  scrollTl.to(lines[2], { y: '30vh', scale: 1.3, opacity: 0.2, ease: 'none' }, 0);

  // Grid rotates slightly in 3D
  scrollTl.to(grid, { rotateX: 15, rotateY: -5, opacity: 0, ease: 'none' }, 0);

  // Badge, sub, scroll fade out
  scrollTl.to(badge, { y: -100, opacity: 0, ease: 'none' }, 0);
  scrollTl.to(sub, { y: 100, opacity: 0, ease: 'none' }, 0);
  scrollTl.to(scroll, { y: 50, opacity: 0, ease: 'none' }, 0);
  scrollTl.to(ticker, { opacity: 0, ease: 'none' }, 0);

  // Crosses fly out
  scrollTl.to(crosses, { scale: 3, opacity: 0, ease: 'none' }, 0);
}

// ═══════════════════════════════════════
// ABOUT — pinned, phased reveal
// ═══════════════════════════════════════
function initAbout() {
  const section = document.getElementById('about-3d');
  if (!section) return;

  const sticky = section.querySelector('.about-3d__sticky') as HTMLElement;
  const bio = section.querySelector('[data-about-bio]') as HTMLElement;
  const bioText = section.querySelector('[data-about-text]') as HTMLElement;
  const bioText2 = section.querySelector('[data-about-text-2]') as HTMLElement;
  const stats = section.querySelector('[data-about-stats]') as HTMLElement;
  const statItems = section.querySelectorAll('[data-about-stat]');
  const stack = section.querySelector('[data-about-stack]') as HTMLElement;
  const label = section.querySelector('[data-about-label]') as HTMLElement;

  // Split bio text into words for reveal
  const split1 = new SplitText(bioText, { type: 'words' });
  const split2 = new SplitText(bioText2, { type: 'words' });

  // Set initial state
  gsap.set(split1.words, { opacity: 0.1 });
  gsap.set(split2.words, { opacity: 0.1 });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: '+=350%',
      scrub: 1,
      pin: sticky,
      pinSpacing: false,
    },
  });

  // Phase 0: Section label flashes and fades
  tl.fromTo(label, { opacity: 0, scale: 0.8 }, { opacity: 0.04, scale: 1, duration: 0.1, ease: 'none' }, 0);
  tl.to(label, { opacity: 0.02, scale: 1.2, duration: 0.9, ease: 'none' }, 0.1);

  // Phase 1: Bio text reveals word by word (0 → 0.4)
  tl.to(split1.words, {
    opacity: 1,
    stagger: 0.01,
    duration: 0.3,
    ease: 'none',
  }, 0.02);

  tl.to(split2.words, {
    opacity: 1,
    stagger: 0.01,
    duration: 0.2,
    ease: 'none',
  }, 0.15);

  // Phase 2: Bio exits, stats enter (0.4 → 0.7)
  tl.to(bio, { y: -100, opacity: 0, duration: 0.15, ease: 'none' }, 0.4);

  tl.to(stats, { opacity: 1, duration: 0.05, ease: 'none' }, 0.45);
  tl.from(statItems, {
    y: 80,
    rotateX: -40,
    opacity: 0,
    stagger: 0.03,
    duration: 0.15,
    ease: 'none',
  }, 0.45);

  // Phase 3: Stack ticker enters (0.65 → 0.8)
  tl.to(stack, { opacity: 1, duration: 0.1, ease: 'none' }, 0.65);

  // Phase 4: Everything exits (0.8 → 1)
  tl.to(stats, { y: -80, opacity: 0, duration: 0.15, ease: 'none' }, 0.8);
  tl.to(stack, { y: -40, opacity: 0, duration: 0.1, ease: 'none' }, 0.85);
  tl.to(label, { opacity: 0, duration: 0.1, ease: 'none' }, 0.85);
}

// ═══════════════════════════════════════
// PROJECTS — cards in 3D space with parallax
// ═══════════════════════════════════════
function initProjects() {
  const section = document.getElementById('projects-3d');
  if (!section) return;

  const sticky = section.querySelector('.proj-3d__sticky') as HTMLElement;
  const titleEl = section.querySelector('[data-proj-title]') as HTMLElement;
  const cards = section.querySelectorAll('[data-proj-card]');
  const cta = section.querySelector('[data-proj-cta]') as HTMLElement;

  // Card layout positions (spread in 3D space)
  const positions = [
    { x: '-30%', y: '-15%', z: -100, rotate: -3 },
    { x: '25%',  y: '-20%', z: -200, rotate: 4 },
    { x: '-25%', y: '15%',  z: -150, rotate: 2 },
    { x: '30%',  y: '10%',  z: -50,  rotate: -2 },
    { x: '-10%', y: '25%',  z: -250, rotate: 5 },
    { x: '15%',  y: '-5%',  z: -300, rotate: -4 },
  ];

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: '+=450%',
      scrub: 1,
      pin: sticky,
      pinSpacing: false,
    },
  });

  // Phase 0: Title zooms in and fades (0 → 0.15)
  tl.fromTo(titleEl,
    { scale: 0.3, opacity: 0 },
    { scale: 1, opacity: 1, duration: 0.1, ease: 'none' },
    0
  );
  tl.to(titleEl, { scale: 3, opacity: 0, duration: 0.15, ease: 'none' }, 0.1);

  // Phase 1: Cards fly in from far Z (0.15 → 0.5)
  cards.forEach((card, i) => {
    const pos = positions[i] || positions[0];
    const startTime = 0.15 + i * 0.04;

    // Initial state: far away, invisible
    gsap.set(card, {
      xPercent: parseFloat(pos.x),
      yPercent: parseFloat(pos.y),
      z: -800,
      rotateY: pos.rotate * 3,
      rotateX: 10,
      opacity: 0,
    });

    // Fly in to position
    tl.to(card, {
      z: pos.z,
      rotateY: pos.rotate,
      rotateX: 0,
      opacity: 1,
      duration: 0.25,
      ease: 'none',
    }, startTime);
  });

  // Phase 2: Cards drift with parallax (0.5 → 0.85)
  cards.forEach((card, i) => {
    const parallaxY = (i % 2 === 0 ? -1 : 1) * (30 + i * 10);
    const parallaxZ = (i % 2 === 0 ? 1 : -1) * 50;

    tl.to(card, {
      yPercent: `+=${parallaxY}`,
      z: `+=${parallaxZ}`,
      rotateY: `+=${(i % 2 === 0 ? -2 : 2)}`,
      duration: 0.35,
      ease: 'none',
    }, 0.5);
  });

  // CTA appears
  tl.to(cta, { opacity: 1, duration: 0.1, ease: 'none' }, 0.6);

  // Phase 3: Everything exits (0.85 → 1)
  cards.forEach((card, i) => {
    tl.to(card, {
      z: 500,
      opacity: 0,
      duration: 0.15,
      ease: 'none',
    }, 0.85 + i * 0.01);
  });

  tl.to(cta, { opacity: 0, duration: 0.1, ease: 'none' }, 0.9);

  // ── Mouse parallax on cards ──
  let mouseX = 0;
  let mouseY = 0;

  sticky.addEventListener('mousemove', (e: MouseEvent) => {
    const rect = sticky.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) / rect.width - 0.5;
    mouseY = (e.clientY - rect.top) / rect.height - 0.5;

    cards.forEach((card, i) => {
      const depth = 1 + i * 0.3;
      gsap.to(card, {
        x: mouseX * 30 * depth,
        y: mouseY * 20 * depth,
        duration: 0.8,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    });
  });
}

// ═══════════════════════════════════════
// CONTACT — entrance animation
// ═══════════════════════════════════════
function initContact() {
  const section = document.getElementById('contact-3d');
  if (!section) return;

  const title = section.querySelector('[data-contact-title]');
  const sub = section.querySelector('[data-contact-sub]');
  const btn = section.querySelector('[data-contact-btn]');

  if (title) {
    const split = new SplitText(title, { type: 'chars' });
    gsap.from(split.chars, {
      scrollTrigger: { trigger: section, start: 'top 80%' },
      y: 100,
      rotateX: -60,
      opacity: 0,
      stagger: 0.03,
      duration: 0.8,
      ease: ease.smooth2,
    });
  }

  if (sub) {
    gsap.from(sub, {
      scrollTrigger: { trigger: section, start: 'top 75%' },
      y: 30,
      opacity: 0,
      duration: 0.6,
      delay: 0.3,
      ease: ease.smooth,
    });
  }

  if (btn) {
    gsap.from(btn, {
      scrollTrigger: { trigger: section, start: 'top 70%' },
      y: 20,
      opacity: 0,
      duration: 0.5,
      delay: 0.5,
      ease: ease.smooth,
    });
  }
}
