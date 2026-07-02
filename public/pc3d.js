/* ════════════════════════════════════════════════════════════════════════
   pc3d.js — interactive retro 3D PC for the hero (smiro.dev)

   Art direction: WARM PREMIUM retro workstation, tuned to match the site
   (cream / editorial / brick-orange #e86830). Not a dark cyberpunk demo.
     · cream plastic case + warm brushed-metal trim + glossy CRT glass
     · PBR materials lit by an environment map (RoomEnvironment PMREM) so
       metal & glass actually reflect — the biggest "premium render" lever
     · restrained warm 3-light rig + soft contact shadows, no acid neon
     · larger, high-contrast screen; code is already visible at rest

   Story / state machine, driven by cursor proximity to the Enter key:
     idle      → cursor far. Editor at rest, first lines already typed.
     typing    → cursor approaches. Screen auto-types. Speed ∝ proximity.
     ready     → cursor near keyboard. Enter key glows + rises.
     building  → user clicked Enter. Terminal runs a fake `build`.
     result    → a "browser" pops up with a clickable CV preview.

   Rendering: Three.js (CDN ESM). Monitor screen = high-res CanvasTexture;
   clicks/hover on the screen resolved via raycasting → UV → canvas pixels.
   Bilingual (EN/FR) via window.I18N.getLang() — re-read every frame.
   ════════════════════════════════════════════════════════════════════════ */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

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
  const TOK = { c: '#8a9678', t: '#3fb950', a: '#4b9fea', p: '#57606a', s: '#0a7ea4', x: '#1b1a18', k: '#8957e5', o: '#e86830' };
  const lang = () => (window.I18N && window.I18N.getLang && (window.I18N.getLang() === 'fr')) ? 'fr' : 'en';
  const txt = () => C[lang()];

  // ─────────────────────────────────────────── three core
  let w = container.clientWidth || 520;
  let h = container.clientHeight || 500;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(34, w / h, 0.1, 100);
  camera.position.set(3.1, 2.35, 6.7);
  camera.lookAt(0, 1.32, 0.2);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  // environment map → realistic reflections on metal & glass (premium look)
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  if ('environmentIntensity' in scene) scene.environmentIntensity = 0.42;

  // ─────────────────────────────────────────── warm premium palette
  // procedural warm wood for the desk
  function makeWoodTex(cw, ch) {
    const c = document.createElement('canvas'); c.width = cw; c.height = ch;
    const g = c.getContext('2d');
    g.fillStyle = '#c9a878'; g.fillRect(0, 0, cw, ch);
    for (let i = 0; i < 620; i++) {
      const y = Math.random() * ch, alpha = Math.random() * 0.10;
      g.strokeStyle = `rgba(120,80,40,${alpha})`;
      g.lineWidth = 1 + Math.random() * 2.2;
      g.beginPath();
      g.moveTo(0, y);
      const cx = cw / 2 + (Math.random() - 0.5) * cw * 0.6;
      g.quadraticCurveTo(cx, y + (Math.random() - 0.5) * 16, cw, y + (Math.random() - 0.5) * 6);
      g.stroke();
    }
    const grad = g.createRadialGradient(cw / 2, ch / 2, cw * 0.35, cw / 2, ch / 2, cw * 0.85);
    grad.addColorStop(0, 'rgba(255,240,215,0.10)');
    grad.addColorStop(1, 'rgba(60,35,10,0.18)');
    g.fillStyle = grad; g.fillRect(0, 0, cw, ch);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 1);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }
  const woodTex = makeWoodTex(512, 256);

  // materials — cream plastic, warm metal, glossy glass
  const matCase   = new THREE.MeshStandardMaterial({ color: 0xece2cf, roughness: 0.52, metalness: 0.06 });
  const matCase2  = new THREE.MeshStandardMaterial({ color: 0xddd0b6, roughness: 0.58, metalness: 0.05 });
  const matMetal  = new THREE.MeshStandardMaterial({ color: 0xb7a98d, roughness: 0.34, metalness: 0.85 });
  const matGlass  = new THREE.MeshStandardMaterial({ color: 0x14120f, roughness: 0.14, metalness: 0.2 });
  const matDesk   = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.6, metalness: 0.0, color: 0xd8b98c });
  const matKey    = new THREE.MeshStandardMaterial({ color: 0xe5dcc6, roughness: 0.52, metalness: 0.05 });
  const matKeyDk  = new THREE.MeshStandardMaterial({ color: 0xcbbd9d, roughness: 0.5, metalness: 0.06 });
  const matMouse  = new THREE.MeshStandardMaterial({ color: 0xe7ddc7, roughness: 0.42, metalness: 0.08 });
  const matCord   = new THREE.MeshStandardMaterial({ color: 0x2c2620, roughness: 0.7, metalness: 0.0 });
  const matOutline = new THREE.MeshBasicMaterial({ color: 0x6b5f48, side: THREE.BackSide });
  const matEnter  = new THREE.MeshStandardMaterial({ color: 0xe9e0cb, emissive: 0xe86830, emissiveIntensity: 0, roughness: 0.45, metalness: 0.08 });
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
  const desk = new THREE.Mesh(new THREE.BoxGeometry(9, 0.24, 4.6), matDesk);
  desk.position.set(0, 0.1, 0.55);
  desk.receiveShadow = true;
  scene.add(desk);

  // ═══════════════════════════ MONITOR ═══════════════════════════
  const mon = new THREE.Group();
  mon.position.set(0, 1.5, -0.3);
  mon.rotation.y = 0.1;
  scene.add(mon);

  // screen canvas texture (HIGH-RES)
  const SC_W = 1600, SC_H = 1067;
  const sc = document.createElement('canvas');
  sc.width = SC_W; sc.height = SC_H;
  const g2 = sc.getContext('2d');
  const screenTex = new THREE.CanvasTexture(sc);
  screenTex.minFilter = THREE.LinearFilter;
  screenTex.magFilter = THREE.LinearFilter;
  screenTex.colorSpace = THREE.SRGBColorSpace;

  // LARGE screen mesh (3:2, matches canvas ratio)
  const SCREEN_W = 3.3, SCREEN_H = 2.2;
  const screenMat = new THREE.MeshBasicMaterial({ map: screenTex });
  // chunky cream frame around the screen (SOLID slab — screen mounts on its face)
  const frameThick = 0.16;
  const frameW = SCREEN_W + frameThick * 2;
  const frameH = SCREEN_H + frameThick * 2;
  const frameDepth = 0.3;
  const frameR = 0.16;
  const frontZ = frameDepth / 2 + frameR * 0.5; // true front face of the extruded slab
  const monFrame = new THREE.Mesh(roundedBox(frameW, frameH, frameDepth, frameR), matCase);
  monFrame.castShadow = true; monFrame.receiveShadow = true;
  mon.add(monFrame);

  // crisp silhouette outline
  const outline = new THREE.Mesh(roundedBox(frameW, frameH, frameDepth, frameR), matOutline);
  outline.scale.set(1.012, 1.012, 1.0);
  mon.add(outline);

  // glossy black glass bezel on the front face (forms a thin dark border)
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(SCREEN_W + 0.12, SCREEN_H + 0.12, 0.04), matGlass);
  bezel.position.z = frontZ + 0.005;
  mon.add(bezel);

  // the screen sits proud of the bezel (glass surface)
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN_W, SCREEN_H), screenMat);
  screen.position.z = frontZ + 0.03;
  screen.name = 'screen';
  mon.add(screen);

  // bottom chin + brushed-metal brand strip + LED (on the front face)
  const chin = new THREE.Mesh(new THREE.BoxGeometry(frameW * 0.9, 0.16, 0.05), matCase2);
  chin.position.set(0, -frameH / 2 + 0.16, frontZ - 0.02);
  mon.add(chin);
  const brand = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.02), matMetal);
  brand.position.set(-frameW * 0.28, -frameH / 2 + 0.16, frontZ + 0.02);
  mon.add(brand);
  const ledMat = new THREE.MeshStandardMaterial({ color: 0x7ee787, emissive: 0x6cd67a, emissiveIntensity: 2.2 });
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.028, 16, 16), ledMat);
  led.position.set(frameW * 0.3, -frameH / 2 + 0.16, frontZ + 0.02);
  mon.add(led);

  // tapered CRT back
  const backBody = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 0.5, 1.25, 4), matCase2);
  backBody.rotation.set(Math.PI / 2, Math.PI / 4, 0);
  backBody.position.z = -0.7;
  backBody.scale.set(1.5, 1, 1);
  backBody.castShadow = true;
  mon.add(backBody);
  // ventilation slits
  for (let i = 0; i < 6; i++) {
    const slit = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.02, 0.03),
      new THREE.MeshStandardMaterial({ color: 0xbdb096, roughness: 0.85 }));
    slit.position.set(0, 0.6 - i * 0.2, -0.78);
    slit.rotation.x = -0.5;
    mon.add(slit);
  }

  // subtle warm point light from the screen onto the scene
  const screenGlow = new THREE.PointLight(0xffe9c8, 0.7, 6);
  screenGlow.position.set(0, 0, 1.6);
  mon.add(screenGlow);

  // ═══════════════════════════ STAND ═══════════════════════════
  const standGroup = new THREE.Group();
  standGroup.position.set(0, 0.5, -0.2);
  scene.add(standGroup);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.19, 0.62, 24), matMetal);
  neck.position.y = 0.32; neck.castShadow = true; standGroup.add(neck);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.74, 0.09, 40), matMetal);
  base.position.y = 0.04; base.castShadow = true; base.receiveShadow = true; standGroup.add(base);

  // ═══════════════════════════ KEYBOARD ═══════════════════════════
  const kb = new THREE.Group();
  kb.position.set(-0.1, 0.28, 1.62);
  kb.rotation.x = -0.05;
  scene.add(kb);

  const kbBody = new THREE.Mesh(roundedBox(3.0, 0.16, 1.12, 0.07), matKey);
  kbBody.castShadow = true; kbBody.receiveShadow = true;
  kb.add(kbBody);

  // real 3D keycaps in staggered rows (subset animates while typing)
  const KEY = 0.185, GAP = 0.03, KH = 0.075;
  const animKeys = [];
  function keycap(cx, cz, units = 1, mat = matKeyDk) {
    const kw = KEY * units + GAP * (units - 1);
    const m = new THREE.Mesh(roundedBox(kw, KH, KEY, 0.028), mat);
    m.position.set(cx, 0.12, cz);
    m.userData.rest = 0.12;
    m.castShadow = true;
    kb.add(m);
    return m;
  }
  const rows = [
    { z: -0.38, n: 13, x0: -1.28 },
    { z: -0.15, n: 13, x0: -1.28 },
    { z: 0.08,  n: 12, x0: -1.28 },
    { z: 0.31,  n: 11, x0: -1.18 },
  ];
  rows.forEach((r) => {
    for (let i = 0; i < r.n; i++) animKeys.push(keycap(r.x0 + i * (KEY + GAP), r.z, 1));
  });
  // spacebar
  const spaceBar = keycap(-0.1, 0.5, 6, matKey); animKeys.push(spaceBar);

  // ── Enter key (hero, right of home row) ──
  const enterKey = new THREE.Mesh(roundedBox(KEY * 2.3 + GAP, KH + 0.012, KEY, 0.03), matEnter);
  enterKey.position.set(1.16, 0.125, 0.08);
  enterKey.castShadow = true;
  enterKey.name = 'enter';
  kb.add(enterKey);
  const enterNub = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.02, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x9a8f74, roughness: 0.4, metalness: 0.3 }));
  enterNub.position.set(1.16, 0.18, 0.08);
  kb.add(enterNub);
  const enterRing = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.013, 12, 44), matEnterRing);
  enterRing.rotation.x = -Math.PI / 2;
  enterRing.position.set(1.16, 0.2, 0.08);
  kb.add(enterRing);

  // ═══════════════════════════ MOUSE + PAD ═══════════════════════════
  const mousepad = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.02, 0.9),
    new THREE.MeshStandardMaterial({ color: 0x3a352c, roughness: 0.9, metalness: 0.0 }));
  mousepad.position.set(2.05, 0.23, 1.35);
  mousepad.receiveShadow = true;
  scene.add(mousepad);

  const mouse = new THREE.Group();
  mouse.position.set(2.05, 0.28, 1.45);
  scene.add(mouse);
  const mBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.1, 8, 20), matMouse);
  mBody.rotation.x = -Math.PI / 2; mBody.rotation.z = 0.08; mBody.scale.set(1, 1, 0.66);
  mBody.castShadow = true; mouse.add(mBody);
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.16, 12),
    new THREE.MeshStandardMaterial({ color: 0x6a6050, roughness: 0.3, metalness: 0.5 }));
  wheel.rotation.z = Math.PI / 2; wheel.position.set(0, 0.085, 0); mouse.add(wheel);
  const mSplit = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.016, 0.15),
    new THREE.MeshBasicMaterial({ color: 0xb6a987 }));
  mSplit.position.set(0, 0.1, -0.02); mouse.add(mSplit);

  const cordCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(2.05, 0.28, 1.2),
    new THREE.Vector3(1.5, 0.26, 1.05),
    new THREE.Vector3(0.85, 0.25, 1.1),
    new THREE.Vector3(0.35, 0.29, 0.6),
    new THREE.Vector3(0.05, 0.33, 0.1),
  ]);
  const cord = new THREE.Mesh(new THREE.TubeGeometry(cordCurve, 50, 0.017, 8, false), matCord);
  scene.add(cord);

  // ═══════════════════════════ DESK PROPS (curated) ═══════════════════════════
  // coffee mug (on-brand orange)
  const mug = new THREE.Group();
  mug.position.set(-2.35, 0.23, 1.05);
  scene.add(mug);
  mug.add(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.3, 24),
    new THREE.MeshStandardMaterial({ color: 0xe86830, roughness: 0.35, metalness: 0.05 })));
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 10, 18, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0xe86830, roughness: 0.35, metalness: 0.05 }));
  handle.position.set(0.16, 0, 0); handle.rotation.z = Math.PI / 2; mug.add(handle);
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.135, 24),
    new THREE.MeshStandardMaterial({ color: 0x2a1810, roughness: 0.5 }));
  coffee.position.y = 0.151; coffee.rotation.x = -Math.PI / 2; mug.add(coffee);
  mug.children[0].castShadow = true;

  // small notebook + pen (paper warmth)
  const notebook = new THREE.Group();
  notebook.position.set(2.5, 0.22, 0.55);
  notebook.rotation.y = -0.22;
  scene.add(notebook);
  const nbBody = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.04, 0.74),
    new THREE.MeshStandardMaterial({ color: 0xf3ecd9, roughness: 0.7 }));
  nbBody.castShadow = true; nbBody.receiveShadow = true; notebook.add(nbBody);
  const nbCover = new THREE.Mesh(new THREE.BoxGeometry(0.57, 0.015, 0.76),
    new THREE.MeshStandardMaterial({ color: 0xb4502a, roughness: 0.5 }));
  nbCover.position.y = -0.025; notebook.add(nbCover);
  const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.5, 12),
    new THREE.MeshStandardMaterial({ color: 0x2a2622, roughness: 0.4, metalness: 0.3 }));
  pen.rotation.z = Math.PI / 2; pen.rotation.y = 0.35; pen.position.set(0.05, 0.05, -0.06);
  pen.castShadow = true; notebook.add(pen);

  // ═══════════════════════════ LIGHTING (warm, restrained) ═══════════════════════════
  scene.add(new THREE.AmbientLight(0xfff4e6, 0.28));

  const keyLight = new THREE.DirectionalLight(0xfff1de, 2.5);
  keyLight.position.set(4.5, 7.5, 4.5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.near = 1; keyLight.shadow.camera.far = 26;
  keyLight.shadow.camera.left = -7; keyLight.shadow.camera.right = 7;
  keyLight.shadow.camera.top = 7; keyLight.shadow.camera.bottom = -7;
  keyLight.shadow.radius = 6; keyLight.shadow.bias = -0.0003;
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xdfe6f2, 0.35);
  fillLight.position.set(-5, 3, 3);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xe86830, 0.55);
  rimLight.position.set(-3.5, 2, 6.5);
  scene.add(rimLight);

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
  // reveal the first few lines at rest so the screen is never empty
  function restChars() {
    const code = txt().code;
    let n = 0;
    for (let i = 0; i < Math.min(5, code.length); i++)
      n += code[i].reduce((b, [t]) => b + t.length, 0);
    return n;
  }
  typed = restChars();

  function enterScreenPx() {
    enterKey.getWorldPosition(vWorld);
    vWorld.project(camera);
    return { x: (vWorld.x * 0.5 + 0.5) * w, y: (-vWorld.y * 0.5 + 0.5) * h };
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
  // subtle CRT overlay: scanlines + vignette (dark screens only)
  function crtOverlay() {
    g2.save();
    g2.globalAlpha = 0.05; g2.fillStyle = '#000';
    for (let y = 0; y < SC_H; y += 4) g2.fillRect(0, y, SC_W, 2);
    g2.restore();
    const vg = g2.createRadialGradient(SC_W / 2, SC_H / 2, SC_H * 0.34, SC_W / 2, SC_H / 2, SC_H * 0.78);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.30)');
    g2.fillStyle = vg; g2.fillRect(0, 0, SC_W, SC_H);
  }
  // faint glass glare across the whole screen (all states)
  function glassGlare() {
    const gr = g2.createLinearGradient(0, 0, SC_W * 0.9, SC_H);
    gr.addColorStop(0, 'rgba(255,255,255,0.07)');
    gr.addColorStop(0.18, 'rgba(255,255,255,0.0)');
    g2.fillStyle = gr; g2.fillRect(0, 0, SC_W, SC_H);
  }

  function drawEditor(t) {
    const T = txt();
    g2.fillStyle = '#0d1117'; g2.fillRect(0, 0, SC_W, SC_H);

    // activity bar
    g2.fillStyle = '#0a0d12'; g2.fillRect(0, 0, 78, SC_H);
    g2.fillStyle = '#e86830'; g2.fillRect(0, 100, 4, 50);

    // tab bar
    g2.fillStyle = '#10151c'; g2.fillRect(78, 0, SC_W - 78, 64);
    g2.fillStyle = '#0d1117'; g2.fillRect(78, 0, 360, 64);
    g2.fillStyle = '#e86830'; g2.fillRect(78, 0, 360, 4);
    g2.fillStyle = '#e6edf3';
    g2.font = '600 32px ui-monospace, monospace';
    g2.textBaseline = 'alphabetic';
    g2.fillText('◗ ' + T.file, 110, 44);

    const reveal = Math.floor(typed);
    let seen = 0;
    const lineH = 68, x0 = 152, y0 = 152;
    let cursorX = x0, cursorY = y0, drewCursor = false;

    for (let i = 0; i < T.code.length; i++) {
      const y = y0 + i * lineH;
      g2.fillStyle = '#3a4250';
      g2.font = '28px ui-monospace, monospace';
      g2.fillText(String(i + 1).padStart(2), 100, y);
      let x = x0;
      for (const [t0, cls] of T.code[i]) {
        for (let ci = 0; ci < t0.length; ci++) {
          if (seen >= reveal) { cursorX = x; cursorY = y; drewCursor = true; break; }
          const ch = t0[ci];
          g2.fillStyle = ({ c: '#7a8a6a', t: '#7ee787', a: '#79c0ff', p: '#c9d1d9', s: '#a5d6ff', x: '#f0ede6', k: '#d2a8ff', o: '#e86830' })[cls] || '#e6edf3';
          g2.font = '37px ui-monospace, monospace';
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
      g2.fillRect(cursorX + 2, cursorY - 30, 4, 40);
    }

    // prompt chip bottom-right
    const ready = proximity > 0.45;
    const label = ready ? T.hintReady : T.hint;
    g2.font = '600 27px ui-monospace, monospace';
    const tw = g2.measureText(label).width + 52;
    const bx = SC_W - tw - 40, by = SC_H - 92;
    g2.fillStyle = ready ? '#e86830' : 'rgba(230,237,243,0.12)';
    rr(g2, bx, by, tw, 58, 29); g2.fill();
    g2.fillStyle = ready ? '#0d1117' : '#9aa4b2';
    g2.fillText(label, bx + 26, by + 38);

    crtOverlay();
    glassGlare();
    screenTex.needsUpdate = true;
  }

  const TERM_PER_LINE = 580;
  const TERM_HOLD = 1200;
  function drawTerminal(t) {
    const T = txt();
    g2.fillStyle = '#0d1117'; g2.fillRect(0, 0, SC_W, SC_H);
    g2.fillStyle = '#10151c'; g2.fillRect(0, 0, SC_W, 72);
    g2.fillStyle = '#e86830'; g2.beginPath(); g2.arc(44, 36, 9, 0, 7); g2.fill();
    g2.fillStyle = '#8b949e'; g2.font = '600 28px ui-monospace, monospace';
    g2.fillText('TERMINAL — build', 68, 47);

    const n = Math.min(T.term.length, Math.floor(t / TERM_PER_LINE) + 1);
    for (let i = 0; i < n; i++) {
      const line = T.term[i];
      g2.font = '34px ui-monospace, monospace';
      g2.fillStyle = line[0] === '$' ? '#d2a8ff' : line[0] === '✓' ? '#7ee787' : '#e6edf3';
      let shown = line, typing = false;
      if (i === n - 1) {
        const cc = Math.max(1, Math.floor((t - i * TERM_PER_LINE) / 26));
        if (cc < line.length) typing = true;
        shown = line.slice(0, cc);
      }
      const ly = 165 + i * 80;
      g2.fillText(shown, 48, ly);
      if (i === n - 1 && (typing || Math.floor(t / 350) % 2 === 0)) {
        const cw = g2.measureText(shown).width;
        g2.fillStyle = '#e86830';
        g2.fillRect(56 + cw, ly - 30, 18, 38);
      }
    }
    const p = Math.min(1, t / (TERM_PER_LINE * T.term.length));
    g2.fillStyle = '#7ee787'; g2.font = '600 27px ui-monospace, monospace';
    g2.fillText('▲ astro build', 48, SC_H - 128);
    g2.textAlign = 'right';
    g2.fillText(Math.round(p * 100) + '%', SC_W - 48, SC_H - 128);
    g2.textAlign = 'left';
    g2.fillStyle = '#161b22'; rr(g2, 48, SC_H - 108, SC_W - 96, 26, 13); g2.fill();
    g2.fillStyle = '#e86830'; rr(g2, 48, SC_H - 108, (SC_W - 96) * p, 26, 13); g2.fill();

    crtOverlay();
    glassGlare();
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
    g2.fillStyle = '#f4f1e8'; g2.fillRect(0, 0, SC_W, SC_H);
    g2.fillStyle = '#e7e1d3'; g2.fillRect(0, 0, SC_W, 96);
    const dots = ['#ec6a5e', '#f4bf4f', '#61c554'];
    dots.forEach((c, i) => { g2.fillStyle = c; g2.beginPath(); g2.arc(52 + i * 48, 48, 14, 0, 7); g2.fill(); });
    g2.fillStyle = '#fbfaf6'; rr(g2, 220, 22, SC_W - 300, 54, 27); g2.fill();
    g2.fillStyle = '#9a9385'; g2.font = '26px ui-monospace, monospace';
    g2.fillText('🔒 ' + T.url, 252, 58);

    const a = Math.min(1, t / 440);
    g2.save();
    g2.globalAlpha = a;
    g2.translate(0, (1 - a) * 40);

    g2.textAlign = 'center';
    g2.fillStyle = '#1b1a18';
    g2.font = '700 82px "Fraunces", Georgia, serif';
    g2.fillText(T.big, SC_W / 2, 240);
    g2.fillStyle = '#b4502a';
    g2.font = 'italic 600 62px "Fraunces", Georgia, serif';
    g2.fillText(T.big2, SC_W / 2, 330);
    g2.fillStyle = '#6b655a';
    g2.font = '600 38px "Quicksand", system-ui, sans-serif';
    g2.fillText(T.sub, SC_W / 2, 430);
    g2.textAlign = 'left';

    const R = CV_RECT;
    g2.fillStyle = '#fffdf8'; rr(g2, R.x, R.y, R.w, R.h, 26); g2.fill();
    g2.fillStyle = '#b4502a'; rr(g2, R.x, R.y, 14, R.h, 6); g2.fill();
    const asz = 160, ax = R.x + 60, ay = R.y + 60;
    g2.save();
    g2.beginPath(); g2.arc(ax + asz / 2, ay + asz / 2, asz / 2, 0, 7); g2.closePath();
    g2.fillStyle = '#efe7d6'; g2.fill(); g2.clip();
    if (avatarReady) g2.drawImage(avatarImg, ax, ay, asz, asz);
    g2.restore();
    const tx = R.x + 260;
    g2.fillStyle = '#1b1a18'; g2.font = '700 54px "Fraunces", Georgia, serif';
    g2.fillText(T.cvName, tx, R.y + 100);
    g2.fillStyle = '#6b655a'; g2.font = '500 28px "Geist Mono", ui-monospace, monospace';
    g2.fillText(T.cvRole, tx, R.y + 148);
    let cx = tx;
    g2.font = '600 26px "Quicksand", system-ui, sans-serif';
    T.cvChips.forEach((chip) => {
      const cw = g2.measureText(chip).width + 44;
      g2.fillStyle = '#f1ece0'; rr(g2, cx, R.y + 180, cw, 50, 24); g2.fill();
      g2.fillStyle = '#7a5a3a'; g2.fillText(chip, cx + 22, R.y + 214);
      cx += cw + 16;
    });
    g2.fillStyle = '#e3dccc';
    [0, 1, 2].forEach((k) => { rr(g2, R.x + 60, R.y + 270 + k * 32, R.w - (k === 2 ? 380 : 280), 12, 6); g2.fill(); });
    g2.fillStyle = hoverCV ? '#b4502a' : '#9a9385';
    g2.font = '600 28px "Geist Mono", ui-monospace, monospace';
    g2.textAlign = 'right';
    g2.fillText(T.cvOpen, R.x + R.w - 34, R.y + R.h - 34);
    g2.textAlign = 'left';
    if (hoverCV) {
      g2.strokeStyle = '#e86830'; g2.lineWidth = 4;
      rr(g2, R.x + 3, R.y + 3, R.w - 6, R.h - 6, 26); g2.stroke();
    }
    g2.restore();
    glassGlare();
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

    if (hasPointer && (state === 'idle' || state === 'typing')) {
      const ep = enterScreenPx();
      const d = Math.hypot(mouseX - ep.x, mouseY - ep.y);
      const radius = Math.max(140, Math.min(w, h) * 0.7);
      proximity = Math.max(0, Math.min(1, 1 - d / radius));
    }

    if (state === 'idle' || state === 'typing') {
      if (proximity > 0.04) {
        state = 'typing';
        const cps = 5 + proximity * proximity * 160;
        typed = Math.min(totalChars(), typed + cps * dt);
      }
      container.classList.toggle('is-engaged', proximity > 0.12);

      const want = Math.max(0, Math.min(1, (proximity - 0.24) / 0.52));
      matEnter.emissiveIntensity += (want * 1.9 - matEnter.emissiveIntensity) * 0.16;
      enterKey.position.y = 0.125 + (Math.sin(elapsed * 0.006) * 0.014 + 0.014) * want;
      enterRing.material.opacity += ((want > 0.15 ? 0.6 + Math.sin(elapsed * 0.006) * 0.3 : 0) - enterRing.material.opacity) * 0.18;
      enterRing.scale.setScalar(1 + want * 0.14);

      // a realistic subset of keys "presses" while typing
      if (!reduceMotion) {
        const active = state === 'typing' && proximity > 0.06;
        animKeys.forEach((k, i) => {
          const rest = k.userData.rest;
          const down = active && (Math.floor(elapsed * 0.02 + i * 2.3) % 7 === 0)
            ? rest - 0.03 : rest;
          k.position.y += (down - k.position.y) * 0.35;
        });
      }
      drawEditor(elapsed);
    } else if (state === 'building') {
      matEnter.emissiveIntensity = 1.9;
      enterKey.position.y = 0.1;
      const be = now - buildStart;
      drawTerminal(be);
      const total = TERM_PER_LINE * txt().term.length + TERM_HOLD;
      if (be > total) { state = 'result'; buildStart = now; }
    } else if (state === 'result') {
      enterKey.position.y = 0.125;
      matEnter.emissiveIntensity += (0 - matEnter.emissiveIntensity) * 0.08;
      enterRing.material.opacity += (0 - enterRing.material.opacity) * 0.18;
      drawResult(now - buildStart);
    }

    if (!reduceMotion) {
      mon.position.y = 1.62 + Math.sin(elapsed * 0.0009) * 0.02;
      ledMat.emissiveIntensity = 2.0 + Math.sin(elapsed * 0.004) * 0.8;
    }
    screenGlow.color.set(state === 'result' ? 0xffe7c4 : 0xffe9c8);
    screenGlow.intensity = state === 'result' ? 1.1 : 0.7;

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
