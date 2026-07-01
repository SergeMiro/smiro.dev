/* ════════════════════════════════════════════════════════════════════════
   pc3d.js — enhanced interactive 3D PC for the hero (smiro.dev)

   2025 rewrite — larger screen, richer details, better materials.
   Same state machine, same interaction model, same bilingual content.

   Story / state machine (unchanged):
     idle      → cursor far. Screen shows an editor at rest.
     typing    → cursor approaches. Screen auto-types code. Speed ∝ proximity.
     ready     → cursor near keyboard. Enter key glows.
     building  → user clicked Enter. Terminal runs fake `build`.
     result    → "browser" pops up with CV preview, clickable.

   Rendering: Three.js (CDN ESM). Monitor screen = high-res CanvasTexture.
   Clicks/hover on screen resolved via raycasting → UV → canvas pixels.
   Bilingual (EN/FR) via window.I18N.getLang() — re-read every frame.
   ════════════════════════════════════════════════════════════════════════ */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.183.2/build/three.module.js';

const mount = document.getElementById('pc3d-mount');
if (mount) boot(mount);

function boot(container) {
  try {
    const test = document.createElement('canvas');
    if (!(test.getContext('webgl2') || test.getContext('webgl'))) throw 0;
  } catch (_) {
    container.classList.add('is-engaged');
    return;
  }
  const reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ─────────────────────────────────────────── content (EN / FR)
  const C = {
    en: {
      file: 'hire-serge.html',
      code: [
        [['<!-- ', 'c'], ['employer.persuasion.engine ⚙', 'c'], [' -->', 'c']],
        [['<candidate ', 't'], ['id', 'a'], ['=', 'p'], ['"serge"', 's'], [' risk', 'a'], ['=', 'p'], ['"0.00"', 's'], ['>', 't']],
        [['  <skill>', 't'], ['ships in days, not quarters', 'x'], ['</skill>', 't']],
        [['  <skill>', 't'], ['multi-agent systems that ship', 'x'], ['</skill>', 't']],
        [['  <skill>', 't'], ['15 yrs in IT · 5 yrs in prod', 'x'], ['</skill>', 't']],
        [['  <whisper>', 't'], ['you already want to hire him…', 'k'], ['</whisper>', 't']],
        [['  <whisper>', 't'], ['your competitor just emailed him', 'k'], ['</whisper>', 't']],
        [['  <metric ', 't'], ['roi', 'a'], ['=', 'p'], ['"+∞"', 's'], [' ops', 'a'], ['=', 'p'], ['"-90%"', 's'], [' bugs', 'a'], ['=', 'p'], ['"≈0"', 's'], ['/>', 't']],
        [['  <guarantee>', 't'], ['revenue, not slideware', 'x'], ['</guarantee>', 't']],
        [['  <cta ', 't'], ['key', 'a'], ['=', 'p'], ['"Enter"', 's'], ['>', 't'], ['believe → press ⏎', 'o'], ['</cta>', 't']],
        [['</candidate>', 't']],
      ],
      term: [
        '$ npm run build',
        '▲ bundling reality-distortion field…',
        '✓ compiled 1 irresistible candidate',
        '✓ 0 red flags found',
        '✓ built in 0.42s — opening offer…',
      ],
      url: 'smiro.dev/your-best-hire',
      big: 'Thank you for your risk 😉',
      big2: '— you won’t regret it.',
      sub: 'But seriously → take a look at my CV',
      cvName: 'Sergiy Mirochnyk',
      cvRole: 'AI Engineer · Full-Stack',
      cvChips: ['Claude Code', 'n8n', 'RAG', 'TypeScript'],
      cvOpen: 'open CV ↗',
      hint: 'move closer to the keyboard →',
      hintReady: 'press  ⏎  Enter',
    },
    fr: {
      file: 'recruter-serge.html',
      code: [
        [['<!-- ', 'c'], ['moteur.de.persuasion ⚙', 'c'], [' -->', 'c']],
        [['<candidat ', 't'], ['id', 'a'], ['=', 'p'], ['"serge"', 's'], [' risque', 'a'], ['=', 'p'], ['"0.00"', 's'], ['>', 't']],
        [['  <atout>', 't'], ['livre en jours, pas en trimestres', 'x'], ['</atout>', 't']],
        [['  <atout>', 't'], ['systèmes multi-agents qui tournent', 'x'], ['</atout>', 't']],
        [['  <atout>', 't'], ['15 ans IT · 5 ans en prod', 'x'], ['</atout>', 't']],
        [['  <murmure>', 't'], ['vous voulez déjà l’embaucher…', 'k'], ['</murmure>', 't']],
        [['  <murmure>', 't'], ['votre concurrent vient de l’écrire', 'k'], ['</murmure>', 't']],
        [['  <metrique ', 't'], ['roi', 'a'], ['=', 'p'], ['"+∞"', 's'], [' ops', 'a'], ['=', 'p'], ['"-90%"', 's'], [' bugs', 'a'], ['=', 'p'], ['"≈0"', 's'], ['/>', 't']],
        [['  <garantie>', 't'], ['du revenu, pas des slides', 'x'], ['</garantie>', 't']],
        [['  <cta ', 't'], ['touche', 'a'], ['=', 'p'], ['"Entrée"', 's'], ['>', 't'], ['osez → appuyez ⏎', 'o'], ['</cta>', 't']],
        [['</candidat>', 't']],
      ],
      term: [
        '$ npm run build',
        '▲ compilation du champ de distorsion…',
        '✓ 1 candidat irrésistible compilé',
        '✓ 0 signal d’alarme trouvé',
        '✓ prêt en 0,42 s — ouverture de l’offre…',
      ],
      url: 'smiro.dev/votre-meilleure-recrue',
      big: 'Merci pour votre risque 😉',
      big2: '— vous ne le regretterez pas.',
      sub: 'Plus sérieusement → jetez un œil à mon CV',
      cvName: 'Sergiy Mirochnyk',
      cvRole: 'Développeur Full-Stack · IA',
      cvChips: ['Claude Code', 'n8n', 'RAG', 'TypeScript'],
      cvOpen: 'ouvrir le CV ↗',
      hint: 'rapprochez-vous du clavier →',
      hintReady: 'appuyez  ⏎  Entrée',
    },
  };
  const TOK = { c: '#7a8a6a', t: '#7ee787', a: '#79c0ff', p: '#c9d1d9', s: '#a5d6ff', x: '#f0ede6', k: '#d2a8ff', o: '#e86830' };
  const lang = () => (window.I18N && window.I18N.getLang && (window.I18N.getLang() === 'fr')) ? 'fr' : 'en';
  const txt = () => C[lang()];

  // ─────────────────────────────────────────── three core
  let w = container.clientWidth || 520;
  let h = container.clientHeight || 500;

  const scene = new THREE.Scene();

  // subtle fog for depth
  scene.fog = new THREE.Fog(0x2a2622, 8, 20);

  const camera = new THREE.PerspectiveCamera(34, w / h, 0.1, 100);
  camera.position.set(3.0, 2.35, 5.6);
  camera.lookAt(0, 1.15, 0.45);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  // ─────────────────────────────────────────── materials
  const texLoader = new THREE.TextureLoader();

  // wood desk texture (procedural via canvas)
  function makeWoodTex(w, h) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.fillStyle = '#b89b76'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 800; i++) {
      const y = Math.random() * h, alpha = Math.random() * 0.12;
      g.strokeStyle = `rgba(80,50,20,${alpha})`;
      g.lineWidth = 1 + Math.random() * 2.5;
      g.beginPath();
      g.moveTo(0, y);
      // gentle curves for wood grain
      const cx = w / 2 + (Math.random() - 0.5) * w * 0.6;
      g.quadraticCurveTo(cx, y + (Math.random() - 0.5) * 18, w, y + (Math.random() - 0.5) * 6);
      g.stroke();
    }
    // darken edges
    const grad = g.createRadialGradient(w / 2, h / 2, w * 0.4, w / 2, h / 2, w * 0.8);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.25)');
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 1);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }
  const woodTex = makeWoodTex(512, 256);

  // toon ramp
  const gradData = new Uint8Array([35, 80, 140, 200, 250]);
  const ramp = new THREE.DataTexture(gradData, 5, 1, THREE.RedFormat);
  ramp.minFilter = ramp.magFilter = THREE.NearestFilter; ramp.needsUpdate = true;
  const toon = (color, overrides = {}) => new THREE.MeshToonMaterial({ color, gradientMap: ramp, ...overrides });

  // materials
  const matDesk  = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.65, metalness: 0.0, color: 0xc8a882 });
  const matCase  = new THREE.MeshStandardMaterial({ color: 0x2c2a28, roughness: 0.4, metalness: 0.3 });
  const matBezel = new THREE.MeshStandardMaterial({ color: 0x1a1a18, roughness: 0.3, metalness: 0.5 });
  const matStand = new THREE.MeshStandardMaterial({ color: 0x3a3835, roughness: 0.35, metalness: 0.6 });
  const matStandBase = new THREE.MeshStandardMaterial({ color: 0x2a2826, roughness: 0.3, metalness: 0.7 });
  const matKey   = new THREE.MeshStandardMaterial({ color: 0x3a3836, roughness: 0.5, metalness: 0.1 });
  const matKeyLt = new THREE.MeshStandardMaterial({ color: 0x4a4845, roughness: 0.45, metalness: 0.15 });
  const matMouse  = new THREE.MeshStandardMaterial({ color: 0x2c2a28, roughness: 0.35, metalness: 0.3 });
  const matCord  = new THREE.MeshStandardMaterial({ color: 0x1a1816, roughness: 0.6, metalness: 0.0 });
  const matOutline = new THREE.MeshBasicMaterial({ color: 0x111110, side: THREE.BackSide });
  const matScreenGlow = new THREE.MeshBasicMaterial({ color: 0xfff8ee, transparent: true, opacity: 0.06 });

  // Enter key — special emissive material
  const matEnter = new THREE.MeshStandardMaterial({ color: 0x4a4845, emissive: 0xe86830, emissiveIntensity: 0, roughness: 0.4, metalness: 0.2 });
  const matEnterRing = new THREE.MeshBasicMaterial({ color: 0xe86830, transparent: true, opacity: 0 });

  function roundedBox(bw, bh, bd, r) {
    const sh = new THREE.Shape();
    const x = -bw / 2, y = -bh / 2;
    sh.moveTo(x + r, y);
    sh.lineTo(x + bw - r, y); sh.quadraticCurveTo(x + bw, y, x + bw, y + r);
    sh.lineTo(x + bw, y + bh - r); sh.quadraticCurveTo(x + bw, y + bh, x + bw - r, y + bh);
    sh.lineTo(x + r, y + bh); sh.quadraticCurveTo(x, y + bh, x, y + bh - r);
    sh.lineTo(x, y + r); sh.quadraticCurveTo(x, y, x + r, y);
    const g = new THREE.ExtrudeGeometry(sh, { depth: bd, bevelEnabled: true, bevelThickness: r * 0.5, bevelSize: r * 0.5, bevelSegments: 4 });
    g.center();
    return g;
  }

  // ═══════════════════════════ DESK ═══════════════════════════
  const deskGroup = new THREE.Group();
  scene.add(deskGroup);

  // main desk surface — wider and deeper
  const desk = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.22, 4.5), matDesk);
  desk.position.set(0, 0.1, 0.5);
  desk.receiveShadow = true;
  desk.castShadow = true;
  deskGroup.add(desk);

  // desk front face (slightly darker edge)
  const deskFront = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.6, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x5a4530, roughness: 0.5, metalness: 0.05 }));
  deskFront.position.set(0, -0.28, 2.72);
  deskGroup.add(deskFront);

  // ═══════════════════════════ MONITOR ═══════════════════════════
  const mon = new THREE.Group();
  mon.position.set(0, 1.48, -0.3);
  mon.rotation.y = 0.12;
  scene.add(mon);

  // ── screen canvas texture (HIGH-RES: 1600×1067) ──
  const SC_W = 1600, SC_H = 1067;
  const sc = document.createElement('canvas');
  sc.width = SC_W; sc.height = SC_H;
  const g2 = sc.getContext('2d');
  const screenTex = new THREE.CanvasTexture(sc);
  screenTex.minFilter = THREE.LinearFilter;
  screenTex.magFilter = THREE.LinearFilter;
  screenTex.colorSpace = THREE.SRGBColorSpace;

  // Screen mesh — LARGER: 3.2×2.13 units (was 2.34×1.78)
  const SCREEN_W = 3.2, SCREEN_H = 2.13;
  const screenMat = new THREE.MeshBasicMaterial({ map: screenTex });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN_W, SCREEN_H), screenMat);
  screen.position.z = 0.22;
  screen.name = 'screen';
  mon.add(screen);

  // ── monitor body: chunky frame around the screen ──
  const frameThick = 0.18;
  const frameW = SCREEN_W + frameThick * 2;
  const frameH = SCREEN_H + frameThick * 2;
  const frameDepth = 0.15;

  // main front frame
  const monFrame = new THREE.Mesh(roundedBox(frameW, frameH, frameDepth, 0.12), matCase);
  monFrame.castShadow = true; monFrame.receiveShadow = true;
  mon.add(monFrame);

  // inner bezel (darker, recessed)
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(SCREEN_W + 0.08, SCREEN_H + 0.08, 0.03), matBezel);
  bezel.position.z = frameDepth / 2 + 0.015;
  mon.add(bezel);

  // bottom chin — thicker with subtle brand area
  const chin = new THREE.Mesh(new THREE.BoxGeometry(frameW * 0.85, 0.09, 0.04), matStand);
  chin.position.set(0, -frameH / 2 + 0.1, frameDepth / 2 + 0.03);
  mon.add(chin);

  // LED indicator dot
  const ledMat = new THREE.MeshStandardMaterial({ color: 0x7ee787, emissive: 0x7ee787, emissiveIntensity: 2.5 });
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 16), ledMat);
  led.position.set(0, -frameH / 2 + 0.1, frameDepth / 2 + 0.06);
  mon.add(led);

  // ── CRT-style tapered back ──
  const backBody = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.4, 1.1, 4), 
    new THREE.MeshStandardMaterial({ color: 0x22201e, roughness: 0.35, metalness: 0.4 }));
  backBody.rotation.set(Math.PI / 2, Math.PI / 4, 0);
  backBody.position.z = -0.55;
  backBody.scale.set(1.5, 1, 1);
  backBody.castShadow = true;
  mon.add(backBody);

  // ventilation slits on back
  for (let i = 0; i < 5; i++) {
    const slit = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.015, 0.03),
      new THREE.MeshStandardMaterial({ color: 0x111010, roughness: 0.9 }));
    slit.position.set(0, 0.55 - i * 0.22, -0.62);
    slit.rotation.x = -0.5;
    mon.add(slit);
  }

  // ── outline for crisp silhouette ──
  const outline = new THREE.Mesh(roundedBox(frameW, frameH, frameDepth, 0.12), matOutline);
  outline.scale.set(1.015, 1.015, 1.0);
  mon.add(outline);

  // ── screen glow (subtle ambient light on the desk) ──
  const screenGlow = new THREE.PointLight(0x7ec8e3, 1.8, 5.5);
  screenGlow.position.set(0, 0, 1.5);
  mon.add(screenGlow);

  // screen spill plane (fake light cast on desk)
  const spillGeo = new THREE.PlaneGeometry(4.0, 2.5);
  const spillPlane = new THREE.Mesh(spillGeo, matScreenGlow);
  spillPlane.rotation.x = -Math.PI / 2;
  spillPlane.position.set(0, 0.21, 1.6);
  deskGroup.add(spillPlane);

  // ═══════════════════════════ STAND ═══════════════════════════
  const standGroup = new THREE.Group();
  standGroup.position.set(0, 0.55, -0.15);
  scene.add(standGroup);

  // neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.18, 0.55, 24), matStand);
  neck.position.y = 0.27;
  neck.castShadow = true;
  standGroup.add(neck);

  // base plate (elliptical)
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.72, 0.09, 32), matStandBase);
  base.position.y = 0.04;
  base.castShadow = true;
  base.receiveShadow = true;
  standGroup.add(base);

  // ═══════════════════════════ KEYBOARD ═══════════════════════════
  const kb = new THREE.Group();
  kb.position.set(-0.1, 0.27, 1.6);
  kb.rotation.x = -0.05;
  scene.add(kb);

  // keyboard body
  const kbBody = new THREE.Mesh(roundedBox(2.8, 0.14, 1.05, 0.06), matKey);
  kbBody.castShadow = true; kbBody.receiveShadow = true;
  kb.add(kbBody);

  // keyboard top surface with painted key labels
  const kbTopCanvas = document.createElement('canvas');
  kbTopCanvas.width = 560; kbTopCanvas.height = 210;
  const kbg = kbTopCanvas.getContext('2d');
  kbg.fillStyle = '#3a3836'; kbg.fillRect(0, 0, 560, 210);
  // draw key grid
  const keyW = 42, keyH = 28, gap = 4, rows = 5, cols = 13;
  const keys = [
    ['Esc','1','2','3','4','5','6','7','8','9','0','-','='],
    ['Tab','Q','W','E','R','T','Y','U','I','O','P','[',']'],
    ['Caps','A','S','D','F','G','H','J','K','L',';',"'",'Enter'],
    ['Shift','Z','X','C','V','B','N','M',',','.','/','↑',''],
    ['Ctrl','Opt','Cmd','','','','','','','←','↓','→',''],
  ];
  const startX = 14, startY = 12;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < keys[r].length; c++) {
      const label = keys[r][c];
      if (!label) continue;
      const kx = startX + c * (keyW + gap);
      const ky = startY + r * (keyH + gap + 2);
      // keycap
      kbg.fillStyle = '#4a4845';
      kbg.beginPath();
      const rr2 = 4;
      kbg.moveTo(kx + rr2, ky);
      kbg.lineTo(kx + keyW - rr2, ky);
      kbg.quadraticCurveTo(kx + keyW, ky, kx + keyW, ky + rr2);
      kbg.lineTo(kx + keyW, ky + keyH - rr2);
      kbg.quadraticCurveTo(kx + keyW, ky + keyH, kx + keyW - rr2, ky + keyH);
      kbg.lineTo(kx + rr2, ky + keyH);
      kbg.quadraticCurveTo(kx, ky + keyH, kx, ky + keyH - rr2);
      kbg.lineTo(kx, ky + rr2);
      kbg.quadraticCurveTo(kx, ky, kx + rr2, ky);
      kbg.fill();
      // key highlight
      kbg.fillStyle = 'rgba(255,255,255,0.06)';
      kbg.fillRect(kx + 2, ky + 1, keyW - 4, keyH / 2);
      // label
      kbg.fillStyle = '#b8b4ae';
      kbg.font = '9px ui-monospace, monospace';
      kbg.textAlign = 'center';
      kbg.textBaseline = 'middle';
      kbg.fillText(label, kx + keyW / 2, ky + keyH / 2 + 1);
    }
  }
  const kbTopTex = new THREE.CanvasTexture(kbTopCanvas);
  kbTopTex.minFilter = THREE.LinearFilter;
  kbTopTex.colorSpace = THREE.SRGBColorSpace;
  const kbTopPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(2.75, 1.0),
    new THREE.MeshBasicMaterial({ map: kbTopTex, transparent: true, opacity: 0.85 })
  );
  kbTopPlane.rotation.x = -Math.PI / 2;
  kbTopPlane.position.y = 0.08;
  kb.add(kbTopPlane);

  // ── Enter key (hero, right side of home row) ──
  const enterKey = new THREE.Mesh(roundedBox(0.42, 0.09, 0.19, 0.028), matEnter);
  enterKey.position.set(1.1, 0.12, 0.06);
  enterKey.castShadow = true;
  enterKey.name = 'enter';
  kb.add(enterKey);

  // Enter nub
  const enterNub = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.015, 0.1),
    new THREE.MeshStandardMaterial({ color: 0x6a6560, roughness: 0.3, metalness: 0.5 }));
  enterNub.position.set(1.1, 0.17, 0.06);
  kb.add(enterNub);

  // Enter ring
  const enterRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.34, 0.014, 10, 40), matEnterRing
  );
  enterRing.rotation.x = -Math.PI / 2;
  enterRing.position.set(1.1, 0.18, 0.06);
  kb.add(enterRing);

  // ═══════════════════════════ MOUSE + MOUSEPAD ═══════════════════════════
  // mousepad
  const padGeo = new THREE.BoxGeometry(0.65, 0.02, 0.8);
  const padMat = new THREE.MeshStandardMaterial({ color: 0x1a1a18, roughness: 0.9, metalness: 0.0 });
  const mousepad = new THREE.Mesh(padGeo, padMat);
  mousepad.position.set(1.95, 0.22, 1.4);
  mousepad.receiveShadow = true;
  scene.add(mousepad);

  // mouse
  const mouse = new THREE.Group();
  mouse.position.set(1.95, 0.27, 1.48);
  scene.add(mouse);
  const mBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.1, 8, 20), matMouse);
  mBody.rotation.x = -Math.PI / 2; mBody.rotation.z = 0.08;
  mBody.scale.set(1, 1, 0.65);
  mBody.castShadow = true;
  mouse.add(mBody);
  // scroll wheel
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.16, 12),
    new THREE.MeshStandardMaterial({ color: 0x5a5550, roughness: 0.2, metalness: 0.6 }));
  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(0, 0.08, 0);
  mouse.add(wheel);
  // split line
  const mSplit = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.015, 0.14),
    new THREE.MeshBasicMaterial({ color: 0x888078 }));
  mSplit.position.set(0, 0.1, -0.02);
  mouse.add(mSplit);

  // ── cord from mouse toward monitor base ──
  const cordCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.95, 0.27, 1.25),
    new THREE.Vector3(1.4, 0.25, 1.1),
    new THREE.Vector3(0.8, 0.24, 1.15),
    new THREE.Vector3(0.35, 0.28, 0.65),
    new THREE.Vector3(0.05, 0.32, 0.15),
  ]);
  const cord = new THREE.Mesh(new THREE.TubeGeometry(cordCurve, 50, 0.018, 8, false), matCord);
  scene.add(cord);

  // keyboard cable
  const kbCordCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.5, 0.27, 2.05),
    new THREE.Vector3(0.4, 0.23, 1.55),
    new THREE.Vector3(0.15, 0.3, 0.65),
    new THREE.Vector3(0.05, 0.32, 0.2),
  ]);
  const kbCord = new THREE.Mesh(new THREE.TubeGeometry(kbCordCurve, 40, 0.016, 8, false), matCord);
  scene.add(kbCord);

  // ═══════════════════════════ DESK PROPS ═══════════════════════════

  // ── coffee mug ──
  const mug = new THREE.Group();
  mug.position.set(-2.2, 0.22, 1.0);
  scene.add(mug);
  const mugBody = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.28, 20),
    new THREE.MeshStandardMaterial({ color: 0xe86830, roughness: 0.3, metalness: 0.1 }));
  mug.add(mugBody);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.018, 8, 14, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0xe86830, roughness: 0.3, metalness: 0.1 }));
  handle.position.set(0.15, 0, 0); handle.rotation.z = Math.PI / 2;
  mug.add(handle);
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.13, 20),
    new THREE.MeshStandardMaterial({ color: 0x2a1810, roughness: 0.9 }));
  coffee.position.y = 0.141; coffee.rotation.x = -Math.PI / 2;
  mug.add(coffee);
  // steam wisps (small semi-transparent cylinders)
  for (let i = 0; i < 3; i++) {
    const steam = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.03, 0.12 + Math.random() * 0.1, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 }));
    steam.position.set((i - 1) * 0.04, 0.18 + i * 0.06, (Math.random() - 0.5) * 0.06);
    steam.name = 'steam' + i;
    mug.add(steam);
  }

  // ── notebook ──
  const notebook = new THREE.Group();
  notebook.position.set(2.2, 0.21, 0.7);
  notebook.rotation.y = -0.15;
  scene.add(notebook);
  const nbBody = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.7),
    new THREE.MeshStandardMaterial({ color: 0xf5f0e0, roughness: 0.6 }));
  nbBody.castShadow = true;
  notebook.add(nbBody);
  // cover slightly visible
  const nbCover = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.01, 0.72),
    new THREE.MeshStandardMaterial({ color: 0x2a4a3a, roughness: 0.4 }));
  nbCover.position.y = -0.02;
  notebook.add(nbCover);
  // spiral binding dots
  for (let i = 0; i < 6; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.006, 6, 12),
      new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.2, metalness: 0.8 }));
    ring.position.set(-0.25, 0.025, -0.25 + i * 0.1);
    notebook.add(ring);
  }
  // pen on notebook
  const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.55, 12),
    new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3, metalness: 0.4 }));
  pen.rotation.z = Math.PI / 2;
  pen.rotation.y = 0.3;
  pen.position.set(0.1, 0.04, -0.05);
  notebook.add(pen);
  // pen tip
  const penTip = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.04, 8),
    new THREE.MeshStandardMaterial({ color: 0xc0b090, roughness: 0.2, metalness: 0.5 }));
  penTip.rotation.z = -Math.PI / 2;
  penTip.position.set(0.38, 0.04, -0.05);
  notebook.add(penTip);

  // ── sticky note on monitor bezel ──
  const sticky = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3),
    new THREE.MeshStandardMaterial({ color: 0xfff385, roughness: 0.7, side: THREE.DoubleSide }));
  sticky.position.set(0.9, 0.6, frameDepth / 2 + 0.04);
  sticky.rotation.z = 0.08;
  mon.add(sticky);
  // small text on sticky (just a squiggle line)
  const sticky2 = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.22),
    new THREE.MeshStandardMaterial({ color: 0xff9ee6, roughness: 0.7, side: THREE.DoubleSide }));
  sticky2.position.set(0.65, 0.75, frameDepth / 2 + 0.041);
  sticky2.rotation.z = -0.05;
  mon.add(sticky2);

  // ── small plant / succulent ──
  const plantGroup = new THREE.Group();
  plantGroup.position.set(-2.3, 0.22, 1.95);
  scene.add(plantGroup);
  // pot
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.2, 16),
    new THREE.MeshStandardMaterial({ color: 0xcd853f, roughness: 0.5 }));
  pot.position.y = 0.1;
  pot.castShadow = true;
  plantGroup.add(pot);
  // leaves (several small green spheres)
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0x5a8a4a, roughness: 0.7 }));
    leaf.position.set(
      (Math.random() - 0.5) * 0.14,
      0.22 + Math.random() * 0.1,
      (Math.random() - 0.5) * 0.14
    );
    leaf.scale.set(1, 1.3, 1);
    plantGroup.add(leaf);
  }

  // ═══════════════════════════ DUST PARTICLES ═══════════════════════════
  const particlesGeo = new THREE.BufferGeometry();
  const particleCount = 80;
  const particlePositions = new Float32Array(particleCount * 3);
  const particleData = []; // { baseX, baseY, baseZ, phase, speed }
  for (let i = 0; i < particleCount; i++) {
    particlePositions[i * 3] = (Math.random() - 0.5) * 3.5;
    particlePositions[i * 3 + 1] = Math.random() * 2.5 + 0.3;
    particlePositions[i * 3 + 2] = -0.2 + Math.random() * 3.0;
    particleData.push({
      baseX: particlePositions[i * 3],
      baseY: particlePositions[i * 3 + 1],
      baseZ: particlePositions[i * 3 + 2],
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.8,
    });
  }
  particlesGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  const particlesMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.018,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const particles = new THREE.Points(particlesGeo, particlesMat);
  scene.add(particles);

  // ═══════════════════════════ LIGHTING ═══════════════════════════
  scene.add(new THREE.AmbientLight(0xfff6ea, 0.45));

  // key light (warm, top-right)
  const keyLight = new THREE.DirectionalLight(0xfff0dd, 2.0);
  keyLight.position.set(5, 8, 4);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.near = 1; keyLight.shadow.camera.far = 28;
  keyLight.shadow.camera.left = -7; keyLight.shadow.camera.right = 7;
  keyLight.shadow.camera.top = 7; keyLight.shadow.camera.bottom = -7;
  keyLight.shadow.radius = 4;
  keyLight.shadow.bias = -0.0003;
  scene.add(keyLight);

  // fill light (cool, left)
  const fillLight = new THREE.DirectionalLight(0x8899cc, 0.55);
  fillLight.position.set(-4, 3, 2);
  scene.add(fillLight);

  // rim light (warm accent from behind)
  const rimLight = new THREE.DirectionalLight(0xe89850, 0.7);
  rimLight.position.set(-3, 1.5, 8);
  scene.add(rimLight);

  // bounce light from below (simulates desk reflection)
  const bounceLight = new THREE.DirectionalLight(0xc8b898, 0.25);
  bounceLight.position.set(0, -1, 3);
  scene.add(bounceLight);

  // ─────────────────────────────────────────── state + interaction
  let state = 'idle';
  let typed = 0;
  let proximity = 0;
  let mouseX = -1e4, mouseY = -1e4, hasPointer = false;
  let hoverCV = false;
  let buildStart = 0;
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const vWorld = new THREE.Vector3();

  function totalChars() {
    return txt().code.reduce((a, line) => a + line.reduce((b, [t]) => b + t.length, 0), 0);
  }

  function enterScreenPx() {
    enterKey.getWorldPosition(vWorld);
    vWorld.project(camera);
    return {
      x: (vWorld.x * 0.5 + 0.5) * w,
      y: (-vWorld.y * 0.5 + 0.5) * h,
    };
  }

  function onMove(e) {
    const r = renderer.domElement.getBoundingClientRect();
    mouseX = e.clientX - r.left;
    mouseY = e.clientY - r.top;
    hasPointer = true;
    if (state === 'result') updateHover();
  }
  function onLeave() { hasPointer = false; proximity = 0; }

  function rayHit() {
    ndc.x = (mouseX / w) * 2 - 1;
    ndc.y = -(mouseY / h) * 2 + 1;
    ray.setFromCamera(ndc, camera);
    return ray;
  }

  function screenUV() {
    const hit = rayHit().intersectObject(screen, false)[0];
    return hit ? hit.uv : null;
  }

  // CV preview rectangle (result mode) — canvas pixels
  const CV_RECT = { x: 280, y: 560, w: 1040, h: 400 };
  function updateHover() {
    const uv = screenUV();
    let over = false;
    if (uv) {
      const px = uv.x * SC_W, py = (1 - uv.y) * SC_H;
      over = px >= CV_RECT.x && px <= CV_RECT.x + CV_RECT.w && py >= CV_RECT.y && py <= CV_RECT.y + CV_RECT.h;
    }
    hoverCV = over;
    container.style.cursor = over ? 'pointer' : 'default';
  }

  function onDown() {
    if (!hasPointer) return;
    if ((state === 'idle' || state === 'typing') && proximity > 0.3) {
      const hit = rayHit().intersectObjects([enterKey, enterRing, kbBody], false).length > 0;
      if (hit || proximity > 0.5) startBuild();
    } else if (state === 'result' && hoverCV) {
      location.href = lang() === 'fr' ? '/cv-fr' : '/cv';
    }
  }

  function startBuild() {
    state = 'building';
    buildStart = performance.now();
    container.style.cursor = 'default';
  }

  const dom = renderer.domElement;
  dom.addEventListener('pointermove', onMove);
  dom.addEventListener('pointerleave', onLeave);
  dom.addEventListener('pointerdown', onDown);

  // ─────────────────────────────────────────── screen drawing
  function rr(c, x, y, bw, bh, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + bw, y, x + bw, y + bh, r);
    c.arcTo(x + bw, y + bh, x, y + bh, r);
    c.arcTo(x, y + bh, x, y, r);
    c.arcTo(x, y, x + bw, y, r);
    c.closePath();
  }

  function drawEditor(t) {
    const T = txt();
    g2.fillStyle = '#0d1117'; g2.fillRect(0, 0, SC_W, SC_H);

    // activity bar (left sidebar)
    g2.fillStyle = '#0a0d12'; g2.fillRect(0, 0, 72, SC_H);
    g2.fillStyle = '#e86830'; g2.fillRect(0, 94, 4, 46);

    // tab bar
    g2.fillStyle = '#10151c'; g2.fillRect(72, 0, SC_W - 72, 60);
    g2.fillStyle = '#0d1117'; g2.fillRect(72, 0, 320, 60);
    g2.fillStyle = '#e86830'; g2.fillRect(72, 0, 320, 4);
    g2.fillStyle = '#e6edf3';
    g2.font = '600 28px ui-monospace, monospace';
    g2.textBaseline = 'alphabetic';
    g2.fillText('◗ ' + T.file, 102, 40);

    // watermark logo (subtle)
    g2.fillStyle = 'rgba(255,255,255,0.02)';
    g2.font = '700 120px ui-monospace, monospace';
    g2.textAlign = 'center';
    g2.fillText('</>', SC_W / 2, SC_H / 2 + 30);
    g2.textAlign = 'left';

    const reveal = Math.floor(typed);
    let seen = 0;
    const lineH = 54, x0 = 130, y0 = 126;
    let cursorX = x0, cursorY = y0, drewCursor = false;

    for (let i = 0; i < T.code.length; i++) {
      const y = y0 + i * lineH;
      // line numbers
      g2.fillStyle = '#3a4250';
      g2.font = '22px ui-monospace, monospace';
      g2.fillText(String(i + 1).padStart(2), 90, y);
      let x = x0;
      for (const [t0, cls] of T.code[i]) {
        for (let ci = 0; ci < t0.length; ci++) {
          if (seen >= reveal) {
            cursorX = x; cursorY = y; drewCursor = true;
            break;
          }
          const ch = t0[ci];
          g2.fillStyle = TOK[cls] || '#e6edf3';
          g2.font = '26px ui-monospace, monospace';
          g2.fillText(ch, x, y);
          x += g2.measureText(ch).width;
          seen++;
        }
        if (drewCursor) break;
      }
      if (drewCursor) break;
    }

    // blinking caret
    if (Math.floor(t / 480) % 2 === 0) {
      g2.fillStyle = '#e86830';
      g2.fillRect(cursorX + 2, cursorY - 24, 4, 32);
    }

    // prompt chip bottom-right
    const ready = proximity > 0.45;
    const label = ready ? T.hintReady : T.hint;
    g2.font = '600 24px ui-monospace, monospace';
    const tw = g2.measureText(label).width + 46;
    const bx = SC_W - tw - 34, by = SC_H - 82;
    g2.fillStyle = ready ? '#e86830' : 'rgba(230,237,243,0.10)';
    rr(g2, bx, by, tw, 52, 26); g2.fill();
    g2.fillStyle = ready ? '#0d1117' : '#9aa4b2';
    g2.fillText(label, bx + 23, by + 34);

    screenTex.needsUpdate = true;
  }

  const TERM_PER_LINE = 580;
  const TERM_HOLD = 1200;
  function drawTerminal(t) {
    const T = txt();
    g2.fillStyle = '#0d1117'; g2.fillRect(0, 0, SC_W, SC_H);

    // terminal header
    g2.fillStyle = '#10151c'; g2.fillRect(0, 0, SC_W, 68);
    g2.fillStyle = '#e86830'; g2.beginPath(); g2.arc(40, 34, 8, 0, 7); g2.fill();
    g2.fillStyle = '#8b949e';
    g2.font = '600 26px ui-monospace, monospace';
    g2.fillText('TERMINAL — build', 62, 44);

    const n = Math.min(T.term.length, Math.floor(t / TERM_PER_LINE) + 1);
    for (let i = 0; i < n; i++) {
      const line = T.term[i];
      g2.font = '30px ui-monospace, monospace';
      g2.fillStyle = line[0] === '$' ? '#d2a8ff' : line[0] === '✓' ? '#7ee787' : '#e6edf3';
      let shown = line, typing = false;
      if (i === n - 1) {
        const cc = Math.max(1, Math.floor((t - i * TERM_PER_LINE) / 26));
        if (cc < line.length) typing = true;
        shown = line.slice(0, cc);
      }
      const ly = 150 + i * 72;
      g2.fillText(shown, 44, ly);
      if (i === n - 1 && (typing || Math.floor(t / 350) % 2 === 0)) {
        const cw = g2.measureText(shown).width;
        g2.fillStyle = '#e86830';
        g2.fillRect(52 + cw, ly - 26, 16, 34);
      }
    }

    // progress bar
    const p = Math.min(1, t / (TERM_PER_LINE * T.term.length));
    g2.fillStyle = '#7ee787';
    g2.font = '600 24px ui-monospace, monospace';
    g2.fillText('▲ astro build', 44, SC_H - 120);
    g2.textAlign = 'right';
    g2.fillText(Math.round(p * 100) + '%', SC_W - 44, SC_H - 120);
    g2.textAlign = 'left';

    g2.fillStyle = '#161b22';
    rr(g2, 44, SC_H - 100, SC_W - 88, 24, 12); g2.fill();
    g2.fillStyle = '#e86830';
    rr(g2, 44, SC_H - 100, (SC_W - 88) * p, 24, 12); g2.fill();

    screenTex.needsUpdate = true;
  }

  let avatarImg = null, avatarReady = false;
  (function loadAvatar() {
    const im = new Image();
    im.onload = () => { avatarImg = im; avatarReady = true; };
    im.src = '/assets/avatar-serge.png';
  })();

  function drawResult(t) {
    const T = txt();
    // browser bg
    g2.fillStyle = '#f4f1e8'; g2.fillRect(0, 0, SC_W, SC_H);

    // browser chrome
    g2.fillStyle = '#e7e1d3'; g2.fillRect(0, 0, SC_W, 96);
    const dots = ['#ec6a5e', '#f4bf4f', '#61c554'];
    dots.forEach((c, i) => { g2.fillStyle = c; g2.beginPath(); g2.arc(52 + i * 48, 48, 14, 0, 7); g2.fill(); });
    g2.fillStyle = '#fbfaf6';
    rr(g2, 220, 22, SC_W - 300, 54, 27); g2.fill();
    g2.fillStyle = '#9a9385';
    g2.font = '26px ui-monospace, monospace';
    g2.fillText('🔒 ' + T.url, 252, 58);

    // entrance animation
    const a = Math.min(1, t / 440);
    g2.save();
    g2.globalAlpha = a;
    g2.translate(0, (1 - a) * 40);

    // big headline
    g2.textAlign = 'center';
    g2.fillStyle = '#1b1a18';
    g2.font = '700 82px "Fraunces", Georgia, serif';
    g2.fillText(T.big, SC_W / 2, 240);
    g2.fillStyle = '#b4502a';
    g2.font = 'italic 600 62px "Fraunces", Georgia, serif';
    g2.fillText(T.big2, SC_W / 2, 330);
    // subline
    g2.fillStyle = '#6b655a';
    g2.font = '600 38px "Quicksand", system-ui, sans-serif';
    g2.fillText(T.sub, SC_W / 2, 430);
    g2.textAlign = 'left';

    // ── CV preview card ──
    const R = CV_RECT;
    g2.fillStyle = '#fffdf8';
    rr(g2, R.x, R.y, R.w, R.h, 26); g2.fill();
    // left brick accent
    g2.fillStyle = '#b4502a';
    rr(g2, R.x, R.y, 14, R.h, 6); g2.fill();
    // avatar
    const asz = 160, ax = R.x + 60, ay = R.y + 60;
    g2.save();
    g2.beginPath();
    g2.arc(ax + asz / 2, ay + asz / 2, asz / 2, 0, 7);
    g2.closePath();
    g2.fillStyle = '#efe7d6'; g2.fill();
    g2.clip();
    if (avatarReady) g2.drawImage(avatarImg, ax, ay, asz, asz);
    g2.restore();
    // name + role
    const tx = R.x + 260;
    g2.fillStyle = '#1b1a18';
    g2.font = '700 54px "Fraunces", Georgia, serif';
    g2.fillText(T.cvName, tx, R.y + 100);
    g2.fillStyle = '#6b655a';
    g2.font = '500 28px "Geist Mono", ui-monospace, monospace';
    g2.fillText(T.cvRole, tx, R.y + 148);
    // chips
    let cx = tx;
    g2.font = '600 26px "Quicksand", system-ui, sans-serif';
    T.cvChips.forEach((chip) => {
      const cw = g2.measureText(chip).width + 44;
      g2.fillStyle = '#f1ece0';
      rr(g2, cx, R.y + 180, cw, 50, 24); g2.fill();
      g2.fillStyle = '#7a5a3a';
      g2.fillText(chip, cx + 22, R.y + 214);
      cx += cw + 16;
    });
    // resume teaser lines
    g2.fillStyle = '#e3dccc';
    [0, 1, 2].forEach((k) => {
      rr(g2, R.x + 60, R.y + 270 + k * 32, R.w - (k === 2 ? 380 : 280), 12, 6); g2.fill();
    });
    // open CV affordance
    g2.fillStyle = hoverCV ? '#b4502a' : '#9a9385';
    g2.font = '600 28px "Geist Mono", ui-monospace, monospace';
    g2.textAlign = 'right';
    g2.fillText(T.cvOpen, R.x + R.w - 34, R.y + R.h - 34);
    g2.textAlign = 'left';
    // hover border
    if (hoverCV) {
      g2.strokeStyle = '#e86830';
      g2.lineWidth = 4;
      rr(g2, R.x + 3, R.y + 3, R.w - 6, R.h - 6, 26); g2.stroke();
    }
    g2.restore();
    screenTex.needsUpdate = true;
  }

  // ─────────────────────────────────────────── animation loop
  const t0 = performance.now();
  let prev = t0;
  let raf;

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    const elapsed = now - t0;

    // proximity from cursor → Enter key
    if (hasPointer && (state === 'idle' || state === 'typing')) {
      const ep = enterScreenPx();
      const d = Math.hypot(mouseX - ep.x, mouseY - ep.y);
      const radius = Math.max(140, Math.min(w, h) * 0.7);
      proximity = Math.max(0, Math.min(1, 1 - d / radius));
    }

    // typing speed based on proximity
    if (state === 'idle' || state === 'typing') {
      if (proximity > 0.04) {
        state = 'typing';
        const cps = 5 + proximity * proximity * 160;
        typed = Math.min(totalChars(), typed + cps * dt);
      }
      container.classList.toggle('is-engaged', proximity > 0.12);

      // Enter key animation
      const want = Math.max(0, Math.min(1, (proximity - 0.24) / 0.52));
      matEnter.emissiveIntensity += (want * 1.8 - matEnter.emissiveIntensity) * 0.16;
      enterKey.position.y = 0.12 + (Math.sin(elapsed * 0.006) * 0.014 + 0.014) * want;
      enterRing.material.opacity += ((want > 0.15 ? 0.6 + Math.sin(elapsed * 0.006) * 0.3 : 0) - enterRing.material.opacity) * 0.18;
      enterRing.scale.setScalar(1 + want * 0.14);

      drawEditor(elapsed);
    } else if (state === 'building') {
      matEnter.emissiveIntensity = 1.9;
      enterKey.position.y = 0.095; // pressed down
      const be = now - buildStart;
      drawTerminal(be);
      const total = TERM_PER_LINE * txt().term.length + TERM_HOLD;
      if (be > total) { state = 'result'; buildStart = now; }
    } else if (state === 'result') {
      enterKey.position.y = 0.12;
      matEnter.emissiveIntensity += (0 - matEnter.emissiveIntensity) * 0.08;
      enterRing.material.opacity += (0 - enterRing.material.opacity) * 0.18;
      drawResult(now - buildStart);
    }

    // gentle float animations
    if (!reduceMotion) {
      mon.position.y = 1.48 + Math.sin(elapsed * 0.0009) * 0.025;
      ledMat.emissiveIntensity = 2.2 + Math.sin(elapsed * 0.004) * 1.0;
    }

    // screen glow color transition
    screenGlow.color.set(state === 'result' ? 0xffe7c4 : 0x7ec8e3);
    screenGlow.intensity = state === 'result' ? 3.0 : 1.8;

    // steam animation
    if (!reduceMotion) {
      mug.children.forEach((child) => {
        if (child.name && child.name.startsWith('steam')) {
          child.position.y += 0.0004;
          child.material.opacity -= 0.001;
          if (child.position.y > 0.35) {
            child.position.y = 0.15 + Math.random() * 0.05;
            child.material.opacity = 0.2;
          }
        }
      });
    }

    // particles gentle drift
    if (!reduceMotion) {
      const pos = particlesGeo.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        const pd = particleData[i];
        pos[i * 3] = pd.baseX + Math.sin(elapsed * 0.001 * pd.speed + pd.phase) * 0.3;
        pos[i * 3 + 1] = pd.baseY + Math.cos(elapsed * 0.0007 * pd.speed + pd.phase) * 0.2;
        pos[i * 3 + 2] = pd.baseZ + Math.cos(elapsed * 0.0005 * pd.speed + pd.phase + 1) * 0.25;
      }
      particlesGeo.attributes.position.needsUpdate = true;
      // fade particles based on state
      particlesMat.opacity = (state === 'building' || state === 'result') ? 0.15 : 0.35;
    }

    renderer.render(scene, camera);
  }

  raf = requestAnimationFrame(frame);

  // ─────────────────────────────────────────── resize + pause offscreen
  const ro = new ResizeObserver(() => {
    w = container.clientWidth || w;
    h = container.clientHeight || h;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
  ro.observe(container);

  const io = new IntersectionObserver((es) => {
    es.forEach((e) => {
      if (e.isIntersecting && !raf) raf = requestAnimationFrame(frame);
      else if (!e.isIntersecting && raf) { cancelAnimationFrame(raf); raf = 0; }
    });
  }, { threshold: 0.01 });
  io.observe(container);
}
