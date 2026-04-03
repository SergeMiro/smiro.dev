import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);

export function init3DAnimations() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  // ── Smooth scroll ──
  const lenis = new Lenis({ lerp: 0.06, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  (window as any).__lenis = lenis;

  // ── Add perspective wrapper ──
  const main = document.getElementById('main-content');
  if (main) {
    main.style.perspective = '1200px';
    main.style.perspectiveOrigin = '50% 50%';
    main.style.overflowX = 'hidden';
  }

  // ── Create floating 3D shapes ──
  createFloatingShapes();

  // ── Nav entrance ──
  gsap.from('nav', {
    y: -40,
    opacity: 0,
    rotateX: -15,
    transformOrigin: 'top center',
    duration: 0.6,
    ease: 'power3.out',
  });

  // ── Hero 3D ──
  initHero3D();

  // ── Scroll-triggered 3D sections ──
  initSectionReveals();

  // ── About 3D ──
  initAbout3D();

  // ── Projects 3D ──
  initProjects3D();

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

  // ── Parallax background blobs ──
  initParallaxBlobs();
}

// ═══════════════════════════════════════
// Hero 3D animations
// ═══════════════════════════════════════
function initHero3D() {
  const heroHeading = document.querySelector('[data-split="chars"]');
  if (heroHeading) {
    const el = heroHeading as HTMLElement;
    el.style.transformStyle = 'preserve-3d';

    const split = new SplitText(heroHeading, { type: 'chars' });

    gsap.from(split.chars, {
      rotateY: -90,
      rotateX: 10,
      z: -300,
      opacity: 0,
      stagger: {
        each: 0.03,
        from: 'start',
      },
      duration: 1,
      ease: 'back.out(1.4)',
      delay: 0.3,
    });

    // Subtle parallax on hero heading while scrolling
    gsap.to(heroHeading, {
      z: -150,
      rotateX: 8,
      opacity: 0.3,
      scrollTrigger: {
        trigger: heroHeading,
        start: 'top 20%',
        end: 'bottom -50%',
        scrub: 1,
      },
    });
  }

  // Subheading flies up with 3D rotation
  const heroSub = document.querySelector('.hero-sub');
  if (heroSub) {
    gsap.from(heroSub, {
      y: 60,
      z: -200,
      rotateX: 25,
      opacity: 0,
      duration: 0.8,
      delay: 0.7,
      ease: 'power3.out',
    });
  }

  // CTAs scale in with bounce
  const heroCtas = document.querySelector('.hero-ctas');
  if (heroCtas) {
    gsap.from(heroCtas, {
      scale: 0.5,
      z: -100,
      opacity: 0,
      duration: 0.6,
      delay: 1,
      ease: 'back.out(2)',
    });
  }

  // Availability badge
  const badge = document.querySelector('[data-reveal]');
  if (badge) {
    gsap.from(badge, {
      y: -30,
      z: 100,
      rotateX: -20,
      opacity: 0,
      duration: 0.7,
      delay: 0.1,
      ease: 'power3.out',
    });
  }

  // Scroll indicator 3D
  const scrollIndicator = document.querySelector('.absolute.bottom-8');
  if (scrollIndicator) {
    gsap.from(scrollIndicator, {
      z: -200,
      opacity: 0,
      duration: 1,
      delay: 1.3,
      ease: 'power2.out',
    });
  }
}

// ═══════════════════════════════════════
// Section reveals — each section "unfolds" into view
// ═══════════════════════════════════════
function initSectionReveals() {
  const sections = document.querySelectorAll('section');

  sections.forEach((section, i) => {
    if (i === 0) return; // Skip hero

    const el = section as HTMLElement;
    el.style.transformStyle = 'preserve-3d';
    el.style.willChange = 'transform';

    // Alternate rotation direction for variety
    const rotateXStart = i % 2 === 0 ? -12 : -8;
    const rotateYStart = i % 2 === 0 ? -4 : 4;

    gsap.fromTo(
      section,
      {
        rotateX: rotateXStart,
        rotateY: rotateYStart,
        z: -200,
        opacity: 0,
        transformOrigin: 'center top',
      },
      {
        rotateX: 0,
        rotateY: 0,
        z: 0,
        opacity: 1,
        duration: 1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 90%',
          end: 'top 40%',
          scrub: 0.8,
        },
      }
    );
  });
}

// ═══════════════════════════════════════
// About 3D — stats flip in, tech stack cascades
// ═══════════════════════════════════════
function initAbout3D() {
  // Stats cards flip in
  const countElements = document.querySelectorAll('[data-count]');
  countElements.forEach((el: any, i) => {
    const parent = el.closest('.text-center, .md\\:text-left')?.parentElement;

    // Count-up animation
    const target = parseInt(el.dataset.count);
    const obj = { val: 0 };
    gsap.to(obj, {
      val: target,
      duration: 2,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
      onUpdate: () => {
        el.textContent = Math.floor(obj.val) + '+';
      },
    });

    // 3D flip entrance for each stat
    const statBox = el.parentElement;
    if (statBox) {
      gsap.from(statBox, {
        rotateY: 180,
        z: -100,
        opacity: 0,
        duration: 0.8,
        delay: i * 0.15,
        ease: 'back.out(1.5)',
        scrollTrigger: { trigger: statBox, start: 'top 85%' },
      });
    }
  });

  // Tech stack items cascade from different Z depths
  document.querySelectorAll('[data-scale-reveal]').forEach((container: any) => {
    const items = container.children;
    gsap.from(items, {
      scrollTrigger: { trigger: container, start: 'top 80%' },
      z: () => gsap.utils.random(-300, -100),
      rotateX: () => gsap.utils.random(-20, 20),
      rotateY: () => gsap.utils.random(-30, 30),
      opacity: 0,
      stagger: 0.06,
      duration: 0.7,
      ease: 'power3.out',
    });
  });

  // Word splits with 3D
  document.querySelectorAll('[data-split="words"]').forEach((el) => {
    const split = new SplitText(el, { type: 'words' });
    gsap.from(split.words, {
      scrollTrigger: { trigger: el, start: 'top 80%' },
      y: 60,
      z: -150,
      rotateX: -30,
      opacity: 0,
      stagger: 0.05,
      duration: 0.7,
      ease: 'power3.out',
    });
  });

  // Bio text reveal
  const bioContainer = document.querySelector('[data-reveal]');
  if (bioContainer) {
    const section = bioContainer.closest('section');
    if (section && section.id === 'about') {
      gsap.from(bioContainer, {
        scrollTrigger: { trigger: bioContainer, start: 'top 85%' },
        y: 50,
        z: -100,
        rotateX: -10,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      });
    }
  }
}

// ═══════════════════════════════════════
// Projects 3D — cards stack and spread
// ═══════════════════════════════════════
function initProjects3D() {
  const projectSection = document.getElementById('projects');
  if (!projectSection) return;

  const cards = projectSection.querySelectorAll('[class*="rounded-2xl"]');

  cards.forEach((card, i) => {
    const el = card as HTMLElement;
    el.style.transformStyle = 'preserve-3d';
    el.style.transition = 'transform 0.3s ease';

    // Cards fan in from stacked position
    gsap.from(card, {
      rotateY: i === 0 ? -20 : 15,
      rotateX: 5,
      z: -300 + i * -100,
      x: i === 0 ? -100 : 100,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: projectSection,
        start: 'top 75%',
      },
      delay: i * 0.2,
    });

    // 3D tilt on hover
    el.addEventListener('mousemove', (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / centerY * -8;
      const rotateY = (x - centerX) / centerX * 8;

      gsap.to(el, {
        rotateX,
        rotateY,
        z: 30,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    });

    el.addEventListener('mouseleave', () => {
      gsap.to(el, {
        rotateX: 0,
        rotateY: 0,
        z: 0,
        duration: 0.5,
        ease: 'power3.out',
        overwrite: 'auto',
      });
    });
  });
}

// ═══════════════════════════════════════
// Parallax background blobs
// ═══════════════════════════════════════
function initParallaxBlobs() {
  const blobs = document.querySelectorAll('.animate-pulse-slow, [class*="blur-"]');

  blobs.forEach((blob, i) => {
    gsap.to(blob, {
      y: i % 2 === 0 ? -300 : -200,
      z: i % 2 === 0 ? 100 : -100,
      rotation: i % 2 === 0 ? 15 : -15,
      scrollTrigger: {
        trigger: blob.closest('section') || blob,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.5,
      },
    });
  });
}

// ═══════════════════════════════════════
// Floating 3D geometric shapes
// ═══════════════════════════════════════
function createFloatingShapes() {
  const container = document.createElement('div');
  container.className = 'floating-shapes-3d';
  container.setAttribute('aria-hidden', 'true');
  container.style.cssText = `
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    perspective: 1000px;
    overflow: hidden;
  `;
  document.body.prepend(container);

  const shapes = [
    { type: 'cube', size: 40, x: '10%', y: '20%', color: 'var(--color-primary)' },
    { type: 'ring', size: 60, x: '85%', y: '15%', color: 'var(--color-primary)' },
    { type: 'diamond', size: 30, x: '75%', y: '60%', color: 'var(--color-primary)' },
    { type: 'cube', size: 25, x: '20%', y: '70%', color: 'var(--color-primary)' },
    { type: 'ring', size: 45, x: '50%', y: '45%', color: 'var(--color-primary)' },
    { type: 'diamond', size: 35, x: '90%', y: '80%', color: 'var(--color-primary)' },
  ];

  shapes.forEach((shape, i) => {
    const el = document.createElement('div');
    el.style.cssText = `
      position: absolute;
      left: ${shape.x};
      top: ${shape.y};
      width: ${shape.size}px;
      height: ${shape.size}px;
      transform-style: preserve-3d;
      opacity: 0;
    `;

    if (shape.type === 'cube') {
      el.innerHTML = createCubeHTML(shape.size, shape.color);
    } else if (shape.type === 'ring') {
      el.innerHTML = createRingHTML(shape.size, shape.color);
    } else {
      el.innerHTML = createDiamondHTML(shape.size, shape.color);
    }

    container.appendChild(el);

    // Fade in
    gsap.to(el, {
      opacity: 0.15,
      duration: 1.5,
      delay: 0.5 + i * 0.2,
      ease: 'power2.out',
    });

    // Continuous rotation
    gsap.to(el, {
      rotateX: `+=${gsap.utils.random(180, 360)}`,
      rotateY: `+=${gsap.utils.random(180, 360)}`,
      rotateZ: `+=${gsap.utils.random(90, 180)}`,
      duration: gsap.utils.random(15, 25),
      repeat: -1,
      ease: 'none',
    });

    // Scroll-linked depth movement
    gsap.to(el, {
      y: gsap.utils.random(-400, -200),
      z: gsap.utils.random(-200, 200),
      scrollTrigger: {
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 2,
      },
    });
  });
}

function createCubeHTML(size: number, color: string): string {
  const half = size / 2;
  const face = `border: 1px solid ${color}; background: transparent; position: absolute; width: ${size}px; height: ${size}px;`;
  return `
    <div style="transform-style: preserve-3d; width: ${size}px; height: ${size}px; position: relative;">
      <div style="${face} transform: translateZ(${half}px);"></div>
      <div style="${face} transform: rotateY(180deg) translateZ(${half}px);"></div>
      <div style="${face} transform: rotateY(90deg) translateZ(${half}px);"></div>
      <div style="${face} transform: rotateY(-90deg) translateZ(${half}px);"></div>
      <div style="${face} transform: rotateX(90deg) translateZ(${half}px);"></div>
      <div style="${face} transform: rotateX(-90deg) translateZ(${half}px);"></div>
    </div>
  `;
}

function createRingHTML(size: number, color: string): string {
  return `
    <div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      border: 1.5px solid ${color};
      transform-style: preserve-3d;
    "></div>
  `;
}

function createDiamondHTML(size: number, color: string): string {
  return `
    <div style="
      width: ${size}px;
      height: ${size}px;
      border: 1.5px solid ${color};
      transform: rotate(45deg);
      transform-style: preserve-3d;
    "></div>
  `;
}
