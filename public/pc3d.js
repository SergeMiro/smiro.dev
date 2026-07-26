/* ════════════════════════════════════════════════════════════════════════
   pc3d.js — interactive WIREFRAME 3D PC for the hero (smiro.dev)

   Blueprint aesthetic: the whole machine is drawn with thin near-white
   lines over the dark hero stage — no shading, no model file, no textures.
   Everything is built from Three.js primitives:
     · monitor  — BoxGeometry → EdgesGeometry → LineSegments + screen rect
     · stand    — wireframe base plate + neck + hinge block
     · keyboard — wireframe shell + a rectangle per key (BufferGeometry)
     · desk     — vertex-alpha line grid that fades out towards the edges

   The ONLY solid surface is the screen plane: a CanvasTexture showing the
   live editor / terminal / CV, and the surface raycasting reads for hover
   and click on the CV card. Glow is faked with additive sprites plus a
   slightly-scaled additive copy of the wireframe — no post-processing, so
   the canvas stays transparent over the CSS background of .hero-r.

   Story / state machine, driven by cursor proximity to the Enter key:
     idle      → cursor far. Editor at rest, first lines already typed.
     typing    → cursor approaches. Screen auto-types. Speed ∝ proximity.
     ready     → cursor near keyboard. Enter ring glows + rises.
     building  → user clicked Enter. Terminal runs a fake `build`.
     result    → a "browser" pops up with a clickable CV preview.

   Screen clicks/hover resolved via raycasting → UV → canvas pixels.
   Bilingual (EN/FR) via window.I18N.getLang() — re-read every frame.
   Live tuning: window.__pc3d (TUNE + apply()). apply() rebuilds the
   wireframe from TUNE and re-derives the Enter key pose; to hand-place the
   Enter key, set __pc3d.TUNE.enter then call placeEnter() (not apply()).
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

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  // nothing is shaded any more — no shadow pass, no tone-mapping crush on
  // the near-white lines.
  renderer.shadowMap.enabled = false;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  // kept for reflections on the screen surface / any future lit part
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  if ('environmentIntensity' in scene) scene.environmentIntensity = 0.25;

  // ─────────────────────────────────────────── live-tuning values
  const LINE = 0xf0ece2;   // warm near-white — the blueprint ink
  const ACCENT = 0xe86830; // brick accent, only used on the Enter affordance

  const TUNE = {
    // wireframe dimensions (world units, desk surface at y = 0)
    mon: { w: 3.9, h: 2.9, d: 0.24, y: 2.52 },
    stand: { baseW: 1.72, baseD: 0.96, baseH: 0.07, neckW: 0.42, neckD: 0.2, neckH: 1.18 },
    kb: { w: 2.72, h: 0.13, d: 1.0, z: 2.02, tilt: -0.05, cols: 14, rows: 5 },
    desk: { w: 7.6, d: 4.2, z: 0.7, step: 0.38 },
    // ink weights (animated slightly around these)
    line: { edge: 0.82, detail: 0.4, halo: 0.13, desk: 0.5 },
    halo: 1.005,               // scale of the additive glow copy
    sway: 0.075,               // amplitude of the idle yaw sway (radians)
    rotY: -0.06,               // resting yaw
    cam: { x: 2.15, y: 3.05, z: 8.7 },
    look: { x: 0, y: 2.0, z: 0.45 },
    // screen plane pose (pc-local). 3:2 to match the canvas — do not distort.
    screen: { x: 0, y: 2.66, z: 0.145, w: 3.3, h: 2.2 },
    // Enter-key pose in keyboard-local space — re-derived by build()
    enter: { x: 1.1, y: 0.075, z: 0.09 },
  };

  // ─────────────────────────────────────────── wireframe materials
  const matEdge = new THREE.LineBasicMaterial({ color: LINE, transparent: true, opacity: TUNE.line.edge, depthWrite: false });
  const matDetail = new THREE.LineBasicMaterial({ color: LINE, transparent: true, opacity: TUNE.line.detail, depthWrite: false });
  const matHalo = new THREE.LineBasicMaterial({ color: LINE, transparent: true, opacity: TUNE.line.halo, depthWrite: false, blending: THREE.AdditiveBlending });
  const matDesk = new THREE.LineBasicMaterial({ color: 0xffffff, vertexColors: true, transparent: true, opacity: TUNE.line.desk, depthWrite: false });

  // soft radial sprite used for every glow in the scene (screen bloom, LED,
  // Enter light pool). Alpha reaches 0 at the rim so additive blending never
  // darkens the transparent canvas.
  function glowTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.42)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  const glowTex = glowTexture();

  // ─────────────────────────────────────────── geometry helpers
  function edgeBox(gw, gh, gd, mat) {
    return new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(gw, gh, gd)), mat);
  }
  // rectangle outline in the XY plane (LineLoop) — screen frame, key faces
  function rectXY(rw, rh, mat) {
    const hw = rw / 2, hh = rh / 2;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(
      [-hw, -hh, 0, hw, -hh, 0, hw, hh, 0, -hw, hh, 0], 3));
    return new THREE.LineLoop(g, mat);
  }
  // rectangle outline lying flat in the XZ plane, pushed into a segment list
  function pushRectXZ(out, cx, cz, rw, rd, y) {
    const x0 = cx - rw / 2, x1 = cx + rw / 2, z0 = cz - rd / 2, z1 = cz + rd / 2;
    out.push(x0, y, z0, x1, y, z0, x1, y, z0, x1, y, z1,
             x1, y, z1, x0, y, z1, x0, y, z1, x0, y, z0);
  }
  // flat ring in the XZ plane — the Enter affordance
  function circleGeom(radius, segments) {
    const pts = [];
    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      pts.push(Math.cos(a) * radius, 0, Math.sin(a) * radius);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }
  function glowPlane(gw, gd, color, opacity) {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(gw, gd),
      new THREE.MeshBasicMaterial({
        map: glowTex, color, transparent: true, opacity,
        blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
      })
    );
    m.rotation.x = -Math.PI / 2;
    return m;
  }

  // desk: line grid with per-vertex alpha so it dissolves at the edges
  // instead of ending on a hard rectangle.
  function buildDesk() {
    const D = TUNE.desk;
    const nx = Math.max(1, Math.round(D.w / D.step));
    const nz = Math.max(1, Math.round(D.d / D.step));
    const sx = D.w / nx, sz = D.d / nz;
    const pos = [], col = [];
    const fade = (x, z) => {
      const r = Math.min(1, Math.hypot(x / (D.w / 2), (z - D.z) / (D.d / 2)));
      return Math.pow(1 - r, 1.6);
    };
    const push = (x, z) => { pos.push(x, 0, z); col.push(1, 1, 1, fade(x, z)); };
    for (let i = 0; i <= nx; i++) {
      const x = -D.w / 2 + i * sx;
      for (let j = 0; j < nz; j++) {
        const z0 = D.z - D.d / 2 + j * sz;
        push(x, z0); push(x, z0 + sz);
      }
    }
    for (let j = 0; j <= nz; j++) {
      const z = D.z - D.d / 2 + j * sz;
      for (let i = 0; i < nx; i++) {
        const x0 = -D.w / 2 + i * sx;
        push(x0, z); push(x0 + sx, z);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4));
    return new THREE.LineSegments(g, matDesk);
  }

  // keyboard: shell + one rectangle per key. The Enter footprint (last
  // column, two middle rows) is left empty and drawn as its own wide key,
  // and its centre becomes the interaction anchor (TUNE.enter).
  function buildKeyboard() {
    const K = TUNE.kb;
    const g = new THREE.Group();
    g.add(edgeBox(K.w, K.h, K.d, matEdge));

    const top = K.h / 2 + 0.002;
    const pad = 0.09;
    const iw = K.w - pad * 2, id = K.d - pad * 2;
    const cw = iw / K.cols, cd = id / K.rows;
    const kw = cw * 0.76, kd = cd * 0.7;
    const eCol = K.cols - 1, eRow = 2;      // classic wide Enter, right edge

    const keys = [];
    for (let r = 0; r < K.rows; r++) {
      for (let c = 0; c < K.cols; c++) {
        if (c === eCol && (r === eRow || r === eRow + 1)) continue;
        pushRectXZ(keys,
          -iw / 2 + cw * (c + 0.5),
          -id / 2 + cd * (r + 0.5),
          kw, kd, top);
      }
    }
    const kg = new THREE.BufferGeometry();
    kg.setAttribute('position', new THREE.Float32BufferAttribute(keys, 3));
    g.add(new THREE.LineSegments(kg, matDetail));

    // the Enter key itself — brighter ink, spans two rows
    const ex = -iw / 2 + cw * (eCol + 0.5);
    const ez = -id / 2 + cd * (eRow + 1);
    const ew = kw, ed = cd * 2 * 0.8;
    const eg = new THREE.BufferGeometry();
    const eSegs = [];
    pushRectXZ(eSegs, ex, ez, ew, ed, top);
    eg.setAttribute('position', new THREE.Float32BufferAttribute(eSegs, 3));
    g.add(new THREE.LineSegments(eg, matEdge));

    TUNE.enter.x = ex;
    TUNE.enter.y = top + 0.005;
    TUNE.enter.z = ez;
    ENTER_SIZE.w = ew; ENTER_SIZE.d = ed;
    return g;
  }
  const ENTER_SIZE = { w: 0.15, d: 0.24 };

  function buildMonitor() {
    const M = TUNE.mon, S = TUNE.screen;
    const g = new THREE.Group();
    g.position.y = M.y;
    g.add(edgeBox(M.w, M.h, M.d, matEdge));

    // the screen aperture, drawn on the front face
    const frame = rectXY(S.w + 0.06, S.h + 0.06, matEdge);
    frame.position.set(S.x, S.y - M.y, M.d / 2 + 0.002);
    g.add(frame);

    // chin detail: a thin brand line + vents, keeps the box from reading empty
    const chinY = (S.y - M.y) - S.h / 2 - 0.24;
    const vents = [];
    for (let i = 0; i < 3; i++) {
      const y = chinY - i * 0.045;
      vents.push(-M.w * 0.13, y, M.d / 2 + 0.002, M.w * 0.13, y, M.d / 2 + 0.002);
    }
    const vg = new THREE.BufferGeometry();
    vg.setAttribute('position', new THREE.Float32BufferAttribute(vents, 3));
    g.add(new THREE.LineSegments(vg, matDetail));
    return g;
  }

  function buildStand() {
    const S = TUNE.stand, M = TUNE.mon;
    const g = new THREE.Group();
    const base = edgeBox(S.baseW, S.baseH, S.baseD, matEdge);
    base.position.set(0, S.baseH / 2, 0.04);
    g.add(base);

    const neck = edgeBox(S.neckW, S.neckH, S.neckD, matEdge);
    neck.position.set(0, S.baseH + S.neckH / 2, 0.04);
    g.add(neck);

    // hinge block where the neck meets the panel
    const hinge = edgeBox(S.neckW * 1.5, 0.16, S.neckD * 1.3, matDetail);
    hinge.position.set(0, M.y - TUNE.mon.h / 2 + 0.02, 0.02);
    g.add(hinge);
    return g;
  }

  // ─────────────────────────────────────────── scene graph
  //  pc ── wire      (rebuilt from TUNE by build())
  //     ├─ halo      (additive copy of wire, scaled a hair for the glow)
  //     ├─ screen    (the one solid surface — CanvasTexture)
  //     ├─ bloom     (additive sprite spilling around the screen)
  //     └─ kbFx ── enterFx ── invisible raycast box + ring + light pool
  const pc = new THREE.Group();
  scene.add(pc);

  let wire = null, halo = null;

  function disposeTree(root) {
    root.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
  }

  function build() {
    if (wire) { pc.remove(wire); disposeTree(wire); }
    if (halo) { pc.remove(halo); halo = null; }

    wire = new THREE.Group();
    wire.add(buildDesk());
    wire.add(buildStand());
    wire.add(buildMonitor());
    const kb = buildKeyboard();
    kb.position.set(0, TUNE.kb.h / 2, TUNE.kb.z);
    kb.rotation.x = TUNE.kb.tilt;
    wire.add(kb);
    pc.add(wire);

    // glow copy: same geometry, additive ink, scaled a hair so the lines
    // read as if they bleed light instead of being hairline-flat.
    halo = wire.clone(true);
    halo.traverse((o) => { if (o.isLine || o.isLineSegments) o.material = matHalo; });
    halo.scale.setScalar(TUNE.halo);
    pc.add(halo);

    // the Enter affordance rides on the keyboard so the tilt applies to it
    kbFx.position.copy(kb.position);
    kbFx.rotation.copy(kb.rotation);
  }

  // ─────────────────────────────────────────── screen (CanvasTexture plane)
  const SC_W = 1600, SC_H = 1067;      // canvas resolution the drawing code uses
  const sc = document.createElement('canvas');
  sc.width = SC_W; sc.height = SC_H;
  const g2 = sc.getContext('2d');
  const screenTex = new THREE.CanvasTexture(sc);
  screenTex.minFilter = THREE.LinearFilter;
  screenTex.magFilter = THREE.LinearFilter;
  screenTex.colorSpace = THREE.SRGBColorSpace;

  // reference plane size (3:2, matches the canvas ratio), scaled by TUNE
  const SCREEN_W = 3.3, SCREEN_H = 2.2;
  const screenMat = new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN_W, SCREEN_H), screenMat);
  screen.name = 'screen';
  pc.add(screen);

  // light spilling out of the panel (replaces the old point light — nothing
  // in the scene is lit any more, so the bloom is drawn, not computed)
  const bloomMat = new THREE.SpriteMaterial({
    map: glowTex, color: 0xffe9c8, transparent: true, opacity: 0.18,
    blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
  });
  const bloom = new THREE.Sprite(bloomMat);
  pc.add(bloom);

  // power LED on the monitor chin — breathes
  const ledMat = new THREE.SpriteMaterial({
    map: glowTex, color: ACCENT, transparent: true, opacity: 0.9,
    blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
  });
  const led = new THREE.Sprite(ledMat);
  led.scale.setScalar(0.17);
  pc.add(led);

  // ─────────────────────────────────────────── Enter-key interaction group
  const kbFx = new THREE.Group();
  pc.add(kbFx);
  const enterFx = new THREE.Group();
  kbFx.add(enterFx);

  // invisible raycast target. matEnter is never rendered (material.visible),
  // but three still raycasts the mesh — this is what the click test hits.
  const matEnter = new THREE.MeshBasicMaterial();
  matEnter.visible = false;
  const enterKey = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), matEnter);
  enterKey.name = 'enter';
  enterFx.add(enterKey);

  // glowing ring affordance (line loop, in keeping with the wireframe)
  const matEnterRing = new THREE.LineBasicMaterial({
    color: ACCENT, transparent: true, opacity: 0,
    depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const enterRing = new THREE.LineLoop(circleGeom(0.22, 48), matEnterRing);
  enterFx.add(enterRing);

  // pool of light under the key
  const enterPool = glowPlane(0.8, 0.8, ACCENT, 0);
  enterPool.position.y = -0.02;
  enterFx.add(enterPool);

  // ─────────────────────────────────────────── lighting (minimal — the
  // wireframe emits its own light; these only matter to the env-lit screen)
  scene.add(new THREE.AmbientLight(0xfff4e6, 0.5));
  const keyLight = new THREE.DirectionalLight(0xfff1de, 0.35);
  keyLight.position.set(4.5, 7.5, 4.5);
  scene.add(keyLight);

  // ─────────────────────────────────────────── placement
  function placeScreen() {
    const S = TUNE.screen;
    screen.position.set(S.x, S.y, S.z);
    screen.scale.set(S.w / SCREEN_W, S.h / SCREEN_H, 1);

    bloom.position.set(S.x, S.y, S.z - 0.03);
    bloom.scale.set(S.w * 1.55, S.h * 1.85, 1);

    led.position.set(S.x + S.w * 0.42, S.y - S.h / 2 - 0.24, TUNE.mon.d / 2 + 0.01);
  }

  function placeEnter() {
    enterFx.position.set(TUNE.enter.x, TUNE.enter.y, TUNE.enter.z);
    // forgiving click target: a little wider/deeper than the drawn key
    enterKey.scale.set(ENTER_SIZE.w * 2.2, 0.16, ENTER_SIZE.d * 1.4);
    enterRing.scale.setScalar(1);
  }

  function placeCamera() {
    camera.position.set(TUNE.cam.x, TUNE.cam.y, TUNE.cam.z);
    camera.lookAt(TUNE.look.x, TUNE.look.y, TUNE.look.z);
    camera.updateProjectionMatrix();
  }

  // re-apply TUNE live from the console: __pc3d.TUNE.mon.w = 4.2; __pc3d.apply()
  function apply() {
    build();
    placeScreen();
    placeEnter();
    placeCamera();
  }
  apply();
  pc.rotation.y = TUNE.rotY;

  // live-tuning handle exposed for console fiddling
  window.__pc3d = {
    scene, renderer, camera, pc, screen, enterKey, enterRing, TUNE,
    apply, build, placeScreen, placeEnter, placeCamera,
    get wire() { return wire; },
  };

  // ─────────────────────────────────────────── state + interaction
  let state = 'idle';
  let typed = 0;
  let proximity = 0;
  let mouseX = -1e4, mouseY = -1e4, hasPointer = false;
  let hoverCV = false;
  let buildStart = 0;
  let enterGlow = 0;
  const ray = new THREE.Raycaster();
  ray.params.Line.threshold = 0.12;   // the Enter ring is a line, not a mesh
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
      const hit = rayHit().intersectObjects([enterKey, enterRing], false).length > 0;
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

    // the whole blueprint floats and sways gently (graphify-style drift).
    // screen, keyboard and Enter affordance are children, so they ride along
    // and raycasting stays correct without extra bookkeeping.
    if (!reduceMotion) {
      pc.position.y = Math.sin(elapsed * 0.0009) * 0.035;
      pc.rotation.y = TUNE.rotY + Math.sin(elapsed * 0.00045) * TUNE.sway;
      pc.rotation.x = Math.sin(elapsed * 0.00062) * TUNE.sway * 0.2;
    }

    // ink breathing — the lines pulse very slightly, like a live blueprint
    const pulse = reduceMotion ? 0 : Math.sin(elapsed * 0.0016) * 0.07;
    matEdge.opacity = TUNE.line.edge + pulse;
    matDetail.opacity = TUNE.line.detail + pulse * 0.5;
    matHalo.opacity = Math.max(0, TUNE.line.halo + pulse * 0.6);

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
      enterGlow += (want - enterGlow) * 0.16;
      enterFx.position.y = TUNE.enter.y + (Math.sin(elapsed * 0.006) * 0.014 + 0.016) * want;
      const ringWant = want > 0.15 ? 0.55 + Math.sin(elapsed * 0.006) * 0.3 : 0;
      matEnterRing.opacity += (ringWant - matEnterRing.opacity) * 0.18;
      enterRing.scale.setScalar(1 + want * 0.16);
      enterPool.material.opacity += (enterGlow * 0.5 - enterPool.material.opacity) * 0.16;
      drawEditor(elapsed);
    } else if (state === 'building') {
      enterGlow = 1;
      enterFx.position.y = TUNE.enter.y - 0.02;
      enterPool.material.opacity += (0.62 - enterPool.material.opacity) * 0.2;
      const be = now - buildStart;
      drawTerminal(be);
      const total = TERM_PER_LINE * txt().term.length + TERM_HOLD;
      if (be > total) { state = 'result'; buildStart = now; }
    } else if (state === 'result') {
      enterFx.position.y = TUNE.enter.y;
      enterGlow += (0 - enterGlow) * 0.08;
      matEnterRing.opacity += (0 - matEnterRing.opacity) * 0.18;
      enterPool.material.opacity += (0 - enterPool.material.opacity) * 0.12;
      drawResult(now - buildStart);
    }

    // screen bloom + power LED breathe with the state
    const warm = state === 'result' ? 0xffe7c4 : 0xffe9c8;
    bloomMat.color.set(warm);
    bloomMat.opacity = (state === 'result' ? 0.26 : 0.18) +
      (reduceMotion ? 0 : Math.sin(elapsed * 0.004) * 0.035);
    ledMat.opacity = 0.55 + (reduceMotion ? 0.25 : Math.sin(elapsed * 0.0022) * 0.3 + 0.25);

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
