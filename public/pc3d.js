/* ════════════════════════════════════════════════════════════════════════
   pc3d.js — interactive WIREFRAME 3D LAPTOP for the hero (smiro.dev)

   Blueprint aesthetic, inverted: pure-white hairlines drawn over the warm
   terracotta hero stage (.hero-r.pc-stage). No shading, no model file, no
   post-processing — the canvas stays transparent so the CSS gradient shows
   through. Everything is built from Three.js primitives / raw line buffers:
     · base       — rounded slab outline + key deck + touchpad + speaker grilles
     · lid        — slab hinged at the back, open ~110°, with a screen aperture
     · hinge      — two short barrels bridging base and lid
     · headphones — two ear cups (flat ellipses), arched headband, cable
     · mug + desk — a little life, plus a line grid that fades out to nothing

   The ONLY solid surface is the screen plane: a CanvasTexture showing the
   live editor / terminal / CV, and the surface raycasting reads for hover
   and click on the CV card. Glow is faked with additive sprites plus a
   slightly-scaled additive copy of the wireframe — no post-processing, so
   the canvas stays transparent over the CSS background of .hero-r.

   Story / state machine, driven by cursor proximity to the deck's Enter key:
     idle      → cursor far. Editor at rest, first lines already typed.
     typing    → cursor approaches. Screen auto-types. Speed ∝ proximity.
     ready     → cursor near the deck. Enter ring glows + rises.
     building  → user clicked Enter. Terminal runs a fake `build`.
     result    → a "browser" pops up with a clickable CV preview.

   Screen clicks/hover resolved via raycasting → UV → canvas pixels.
   Bilingual (EN/FR) via window.I18N.getLang() — re-read every frame.
   Live tuning: window.__pc3d (TUNE + apply()). apply() rebuilds the
   wireframe from TUNE and re-derives the Enter key pose; to hand-place the
   Enter key, set __pc3d.TUNE.enter then call placeEnter() (not apply()).
   The camera is framed, not placed: TUNE.cam only gives the direction, and
   the distance is solved so TUNE.frame always fits the column (any aspect).
   ════════════════════════════════════════════════════════════════════════ */

import * as THREE from 'three';

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
  // the white lines, no environment map (there is no PBR surface left).
  renderer.shadowMap.enabled = false;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  // ─────────────────────────────────────────── live-tuning values
  const LINE = 0xe86830;   // warm orange — matches brick accent
  const ACCENT = 0xffd9a8; // warm highlight for the Enter affordance + webcam
  const SHADE = 0x6d2408;  // burnt-umber contact shadow on the "desk"

  const TUNE = {
    // world units, desk surface at y = 0, laptop centred on x = 0
    base: { w: 4.24, d: 2.86, h: 0.125, z: 0.6, r: 0.16 },  // the slab you type on
    lid: { w: 4.24, h: 2.86, d: 0.085, r: 0.15, open: 110 }, // degrees from the base
    hinge: { r: 0.052, len: 0.5, x: 1.38, inset: 0.09 },
    deck: { w: 3.62, d: 1.26, z: -0.62, cols: 14, rows: 5 }, // key block, base-local
    pad: { w: 1.52, d: 0.94, z: 0.78 },                      // touchpad, base-local
    hp: { x: 1.85, z: 0.58, rot: -0.32, s: 0.85 },            // headphones close to laptop
    mug: { x: -2.52, z: -0.42, r: 0.29, h: 0.42 },
    desk: { w: 9.8, d: 5.8, z: 0.45, step: 0.4 },
    // ink weights (animated slightly around these)
    line: { edge: 0.95, detail: 0.5, halo: 0.11, desk: 0.32 },
    halo: 1.004,               // scale of the additive glow copy
    sway: 0.058,               // amplitude of the idle yaw sway (radians)
    rotY: -0.075,              // resting yaw
    breathe: 0.008,            // lid open/close oscillation (radians)
    // the camera direction (from look → cam); the distance is solved so that
    // `frame` always fits, whatever the column's aspect ratio is
    cam: { x: 2.5, y: 4.25, z: 9.2 },
    look: { x: 0.4, y: 0.92, z: 0.3 },
    frame: { w: 7.7, h: 6.5 },
    // screen plane pose, LID-LOCAL. 3:2 to match the canvas — do not distort.
    screen: { x: 0, y: 1.44, z: 0.014, w: 3.84, h: 2.56 },
    // Enter-key pose in base-local space — re-derived by build()
    enter: { x: 1.5, y: 0.135, z: -0.32 },
  };

  const lidAngle = () => -(TUNE.lid.open - 90) * Math.PI / 180;
  const hingeZ = () => TUNE.base.z - TUNE.base.d / 2 + TUNE.hinge.inset;

  // ─────────────────────────────────────────── wireframe materials
  const matEdge = new THREE.LineBasicMaterial({ color: LINE, transparent: true, opacity: TUNE.line.edge, depthWrite: false });
  const matDetail = new THREE.LineBasicMaterial({ color: LINE, transparent: true, opacity: TUNE.line.detail, depthWrite: false });
  const matHalo = new THREE.LineBasicMaterial({ color: LINE, transparent: true, opacity: TUNE.line.halo, depthWrite: false, blending: THREE.AdditiveBlending });
  const matDesk = new THREE.LineBasicMaterial({ color: LINE, vertexColors: true, transparent: true, opacity: TUNE.line.desk, depthWrite: false });

  // soft radial sprite used for every glow AND every contact shadow in the
  // scene. Alpha reaches 0 at the rim, so additive blending never darkens
  // the transparent canvas and shadows never end on a hard edge.
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

  // ─────────────────────────────────────────── line-buffer helpers
  //  Every wireframe part pushes raw segments into one of two flat arrays
  //  (E = edge ink, D = detail ink) which become a single LineSegments each.
  function pushSeg(out, ax, ay, az, bx, by, bz) {
    out.push(ax, ay, az, bx, by, bz);
  }
  // polyline through a list of [x,y,z]
  function pushPath(out, pts) {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      out.push(a[0], a[1], a[2], b[0], b[1], b[2]);
    }
  }
  // parametric ellipse / arc, in the upright 'xy' plane or the flat 'xz' one.
  // k is the constant third coordinate; rot spins the ellipse in its plane.
  function arcPts(plane, cu, cv, ru, rv, k, segs, a0 = 0, a1 = Math.PI * 2, rot = 0) {
    const pts = [], cs = Math.cos(rot), sn = Math.sin(rot);
    for (let i = 0; i <= segs; i++) {
      const a = a0 + (a1 - a0) * (segs > 0 ? i / segs : 0);
      const u0 = Math.cos(a) * ru, v0 = Math.sin(a) * rv;
      const u = cu + u0 * cs - v0 * sn, v = cv + u0 * sn + v0 * cs;
      pts.push(plane === 'xy' ? [u, v, k] : [u, k, v]);
    }
    return pts;
  }
  // closed rounded-rectangle outline — the shape that makes the whole thing
  // read as a modern machine instead of a stack of boxes
  function rrPts(plane, cu, cv, ru, rv, r, seg, k) {
    const rad = Math.min(r, ru / 2, rv / 2);
    const hu = ru / 2 - rad, hv = rv / 2 - rad;
    const n = rad > 0 ? Math.max(1, seg) : 0;
    const corners = [[hu, hv, 0], [-hu, hv, Math.PI / 2], [-hu, -hv, Math.PI], [hu, -hv, Math.PI * 1.5]];
    const pts = [];
    for (const [ou, ov, a0] of corners) {
      for (let i = 0; i <= n; i++) {
        const a = a0 + (n > 0 ? i / n : 0) * (Math.PI / 2);
        const u = cu + ou + Math.cos(a) * rad, v = cv + ov + Math.sin(a) * rad;
        pts.push(plane === 'xy' ? [u, v, k] : [u, k, v]);
      }
    }
    pts.push(pts[0]);
    return pts;
  }
  // plain rectangle lying flat in the XZ plane — the keys
  function pushRectXZ(out, cx, cz, rw, rd, y) {
    const x0 = cx - rw / 2, x1 = cx + rw / 2, z0 = cz - rd / 2, z1 = cz + rd / 2;
    out.push(x0, y, z0, x1, y, z0, x1, y, z0, x1, y, z1,
             x1, y, z1, x0, y, z1, x0, y, z1, x0, y, z0);
  }
  function segments(arr, mat) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
    return new THREE.LineSegments(g, mat);
  }
  // flat ring in the XZ plane — the Enter affordance
  function circleGeom(radius, segs) {
    const pts = [];
    for (let i = 0; i < segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      pts.push(Math.cos(a) * radius, 0, Math.sin(a) * radius);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }
  function softPlane(gw, gd, color, opacity, additive) {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(gw, gd),
      new THREE.MeshBasicMaterial({
        map: glowTex, color, transparent: true, opacity, depthWrite: false,
        toneMapped: false,
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      })
    );
    m.rotation.x = -Math.PI / 2;
    return m;
  }

  // ─────────────────────────────────────────── desk
  // line grid with per-vertex alpha so it dissolves at the edges instead of
  // ending on a hard rectangle.
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

  // ─────────────────────────────────────────── laptop base
  // Rounded slab (top + bottom outline joined by short posts), the key deck,
  // the touchpad and the speaker grilles either side of the keys.
  // The Enter footprint (last column, two middle rows) is left empty and
  // drawn as its own wide key; its centre becomes TUNE.enter.
  const ENTER_SIZE = { w: 0.2, d: 0.36 };
  const SPACE_ROW = [1.35, 1.1, 1.45, 5.6, 1.45, 1.1, 1.35];

  function buildBase() {
    const B = TUNE.base, K = TUNE.deck, P = TUNE.pad;
    const g = new THREE.Group();
    g.name = 'base';
    g.position.set(0, 0, B.z);
    const E = [], D = [];

    // slab — the top face is the bright outline, the underside stays faint
    const top = rrPts('xz', 0, 0, B.w, B.d, B.r, 5, B.h);
    const bot = rrPts('xz', 0, 0, B.w - 0.03, B.d - 0.03, B.r, 5, 0.004);
    pushPath(E, top);
    pushPath(D, bot);
    for (let i = 0; i < top.length - 1; i += 2) {   // thickness posts
      pushSeg(D, top[i][0], B.h, top[i][2], top[i][0], 0.004, top[i][2]);
    }
    // the lip you hook a finger under to open the lid
    pushSeg(E, -0.42, B.h * 0.5, B.d / 2 + 0.002, 0.42, B.h * 0.5, B.d / 2 + 0.002);

    // key deck
    const kTop = B.h + 0.002;
    const iw = K.w, id = K.d;
    const cw = iw / K.cols, cd = id / K.rows;
    const kw = cw * 0.78, kd = cd * 0.72;
    const eCol = K.cols - 1, eRow = 2;      // classic wide Enter, right edge
    const kx = 0, kz = K.z;

    // the well the keys sit in
    pushPath(D, rrPts('xz', kx, kz, iw + 0.14, id + 0.14, 0.06, 3, kTop - 0.001));

    for (let r = 0; r < K.rows - 1; r++) {
      const z = kz - id / 2 + cd * (r + 0.5);
      const rowD = r === 0 ? cd * 0.5 : kd;    // short function row at the back
      for (let c = 0; c < K.cols; c++) {
        if (c === eCol && (r === eRow || r === eRow + 1)) continue;
        pushRectXZ(D, kx - iw / 2 + cw * (c + 0.5), z, kw, rowD, kTop);
      }
    }
    // front row: modifiers + a wide space bar, so the deck reads as a laptop
    const unit = iw / SPACE_ROW.reduce((a, b) => a + b, 0);
    let cx = kx - iw / 2;
    const frontZ = kz - id / 2 + cd * (K.rows - 0.5);
    for (const u of SPACE_ROW) {
      const cellW = u * unit;
      pushRectXZ(D, cx + cellW / 2, frontZ, cellW * 0.86, kd, kTop);
      cx += cellW;
    }

    // the Enter key itself — brighter ink, spans two rows
    const ex = kx - iw / 2 + cw * (eCol + 0.5);
    const ez = kz - id / 2 + cd * (eRow + 1);
    const ew = kw, ed = cd * 2 * 0.82;
    pushRectXZ(E, ex, ez, ew, ed, kTop);

    // touchpad — a rounded rectangle with a faint inner outline
    pushPath(E, rrPts('xz', 0, P.z, P.w, P.d, 0.09, 4, kTop));
    pushPath(D, rrPts('xz', 0, P.z, P.w - 0.07, P.d - 0.07, 0.07, 3, kTop));

    // speaker grilles either side of the key deck + a vent under the hinge
    const gx = (iw + B.w) / 4;
    for (let i = 0; i < 9; i++) {
      const z = kz - id / 2 + (i + 0.5) * (id / 9);
      pushSeg(D, gx - 0.055, kTop, z, gx + 0.055, kTop, z);
      pushSeg(D, -gx - 0.055, kTop, z, -gx + 0.055, kTop, z);
    }
    pushPath(D, rrPts('xz', 0, -B.d / 2 + 0.1, iw * 0.72, 0.055, 0.027, 2, kTop));

    g.add(segments(E, matEdge));
    g.add(segments(D, matDetail));

    TUNE.enter.x = ex;
    TUNE.enter.y = kTop + 0.006;
    TUNE.enter.z = ez;
    ENTER_SIZE.w = ew; ENTER_SIZE.d = ed;
    return g;
  }

  // ─────────────────────────────────────────── laptop lid
  // Hinged at the back edge of the base and tilted open by TUNE.lid.open.
  // Its +Z local face is the one you look at, so the screen plane, the bloom
  // and the webcam dot all ride at z = lid.d/2 + ε (see placeScreen).
  function buildLid() {
    const L = TUNE.lid, S = TUNE.screen;
    const g = new THREE.Group();
    g.name = 'lid';
    g.position.set(0, TUNE.base.h, hingeZ());
    g.rotation.x = lidAngle();
    const E = [], D = [];

    const zf = L.d / 2, zb = -L.d / 2;
    const front = rrPts('xy', 0, L.h / 2, L.w, L.h, L.r, 5, zf);
    const back = rrPts('xy', 0, L.h / 2, L.w - 0.02, L.h - 0.02, L.r, 5, zb);
    pushPath(E, front);
    pushPath(D, back);
    for (let i = 0; i < front.length - 1; i += 3) {   // panel thickness
      pushSeg(D, front[i][0], front[i][1], zf, front[i][0], front[i][1], zb);
    }

    // screen aperture — the rectangle the CanvasTexture sits inside
    pushPath(E, rrPts('xy', S.x, S.y, S.w + 0.07, S.h + 0.07, 0.05, 3, zf + 0.004));
    // webcam pinhole in the top bezel
    pushPath(D, arcPts('xy', S.x, S.y + S.h / 2 + 0.075, 0.022, 0.022, zf + 0.004, 12));
    // chin: a thin brand line, keeps the bezel from reading empty
    const chinY = S.y - S.h / 2 - 0.085;
    pushSeg(D, -0.34, chinY, zf + 0.003, 0.34, chinY, zf + 0.003);
    return { group: g, E, D };
  }

  // ─────────────────────────────────────────── hinge barrels
  function buildHinge(E, D) {
    const H = TUNE.hinge;
    for (const s of [-1, 1]) {
      const x0 = s * H.x - H.len / 2, x1 = s * H.x + H.len / 2;
      const y = TUNE.base.h, z = hingeZ();
      pushPath(E, arcPts('xy', y, z, H.r, H.r, x0, 12).map(([u, v, k]) => [k, u, v]));
      pushPath(D, arcPts('xy', y, z, H.r, H.r, x1, 12).map(([u, v, k]) => [k, u, v]));
      for (let i = 0; i < 4; i++) {                 // barrel seams
        const a = (i / 4) * Math.PI * 2;
        const py = y + Math.cos(a) * H.r, pz = z + Math.sin(a) * H.r;
        pushSeg(D, x0, py, pz, x1, py, pz);
      }
    }
  }

  // ─────────────────────────────────────────── headphones
  // Lying flat on the desk beside the touchpad: two ear cups splayed open,
  // an arched headband bridging them at the back, a cable trailing away.
  function buildHeadphones() {
    const H = TUNE.hp;
    const g = new THREE.Group();
    g.name = 'headphones';
    g.position.set(H.x, 0, H.z);
    g.rotation.y = H.rot;
    g.scale.setScalar(H.s);
    const E = [], D = [];

    const cupX = 0.6, rx = 0.4, rz = 0.33, yTop = 0.2, yBot = 0.018;
    for (const s of [-1, 1]) {
      const cx = cupX * s, tilt = 0.24 * s;
      pushPath(E, arcPts('xz', cx, 0, rx, rz, yTop, 30, 0, Math.PI * 2, tilt));
      pushPath(D, arcPts('xz', cx, 0, rx, rz, yBot, 30, 0, Math.PI * 2, tilt));
      pushPath(D, arcPts('xz', cx, 0, rx * 0.63, rz * 0.6, yTop + 0.004, 26, 0, Math.PI * 2, tilt));
      pushPath(D, arcPts('xz', cx, 0, rx * 0.3, rz * 0.28, yTop + 0.006, 20, 0, Math.PI * 2, tilt));
      for (let i = 0; i < 12; i++) {               // cup wall
        const a = (i / 12) * Math.PI * 2;
        const [px, , pz] = arcPts('xz', cx, 0, rx, rz, 0, 0, a, a, tilt)[0];
        pushSeg(D, px, yBot, pz, px, yTop, pz);
      }
    }

    // headband: two parallel arcs offset along the outward normal, arching up
    // over the middle, plus a few rungs so it reads as a band and not a wire
    const bandRz = 0.62, bandY = 0.21, lift = 0.17, half = 0.055;
    const rail = (side) => {
      const pts = [];
      for (let i = 0; i <= 32; i++) {
        const t = i / 32, a = Math.PI + t * Math.PI;
        const sa = Math.sin(a), ca = Math.cos(a);
        // tangent (−cupX·sin a, bandRz·cos a) → outward normal, normalised
        let nx = bandRz * ca, nz = cupX * sa;
        const nl = Math.hypot(nx, nz) || 1;
        nx /= nl; nz /= nl;
        pts.push([
          cupX * ca + nx * half * side,
          bandY + Math.sin(t * Math.PI) * lift,
          bandRz * sa + nz * half * side,
        ]);
      }
      return pts;
    };
    const inner = rail(-1), outer = rail(1);
    pushPath(E, inner);
    pushPath(E, outer);
    for (let i = 0; i <= 32; i += 4) {
      pushSeg(D, inner[i][0], inner[i][1], inner[i][2], outer[i][0], outer[i][1], outer[i][2]);
    }
    // yokes — the band ends dropping onto the cups
    for (const s of [-1, 1]) {
      const i = s < 0 ? 0 : 32;
      pushSeg(D, inner[i][0], inner[i][1], inner[i][2], cupX * s, yTop, 0);
      pushSeg(D, outer[i][0], outer[i][1], outer[i][2], cupX * s, yTop, 0);
    }

    // cable: a loose curl trailing off the right cup, flat on the desk
    const cable = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.96, 0.03, 0.2),
      new THREE.Vector3(1.32, 0.03, 0.62),
      new THREE.Vector3(1.06, 0.03, 1.12),
      new THREE.Vector3(0.55, 0.03, 1.3),
      new THREE.Vector3(0.28, 0.03, 1.56),
    ]);
    pushPath(D, cable.getPoints(48).map((p) => [p.x, p.y, p.z]));

    g.add(segments(E, matEdge));
    g.add(segments(D, matDetail));
    return g;
  }

  // ─────────────────────────────────────────── mug (a bit of life)
  function buildMug(E, D) {
    const M = TUNE.mug;
    const rb = M.r * 0.84;
    pushPath(E, arcPts('xz', M.x, M.z, M.r, M.r * 0.95, M.h, 26));
    pushPath(D, arcPts('xz', M.x, M.z, M.r * 0.86, M.r * 0.82, M.h - 0.02, 22));
    pushPath(D, arcPts('xz', M.x, M.z, rb, rb * 0.95, 0.005, 22));
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      pushSeg(D, M.x + Math.cos(a) * rb, 0.005, M.z + Math.sin(a) * rb * 0.95,
                 M.x + Math.cos(a) * M.r, M.h, M.z + Math.sin(a) * M.r * 0.95);
    }
    // handle, on the far side so it never crosses the laptop silhouette
    pushPath(E, arcPts('xy', M.x - M.r * 0.95, M.h * 0.55, 0.17, 0.13, M.z,
      18, Math.PI * 0.62, Math.PI * 1.38));
    // two wisps of steam
    for (const s of [-1, 1]) {
      const pts = [];
      for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        pts.push([
          M.x + s * 0.07 + Math.sin(t * 4.2 + s) * 0.045,
          M.h + 0.05 + t * 0.38,
          M.z - 0.02 + s * 0.03,
        ]);
      }
      pushPath(D, pts);
    }
  }

  // ─────────────────────────────────────────── scene graph
  //  pc ── wire      (rebuilt from TUNE by build())
  //     ├─ halo      (additive copy of wire, scaled a hair for the glow)
  //     ├─ shadows   (soft contact pools grounding the props on the desk)
  //     ├─ lidFx ─── screen (the one solid surface) + bloom + webcam dot
  //     └─ kbFx ──── enterFx ── invisible raycast box + ring + light pool
  const pc = new THREE.Group();
  scene.add(pc);

  let wire = null, halo = null, lidWire = null, haloLid = null;

  function disposeTree(root) {
    root.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
  }

  function build() {
    if (wire) { pc.remove(wire); disposeTree(wire); }
    if (halo) { pc.remove(halo); halo = null; }

    wire = new THREE.Group();
    wire.add(buildDesk());

    const base = buildBase();
    wire.add(base);

    // lid + hinge share one buffer pair so the barrels weld into the panel
    const lid = buildLid();
    buildHinge(lid.E, lid.D);
    // the hinge is authored in pc space, the panel in lid space — so the
    // barrels go on their own (unrotated) node next to the lid group.
    const hingeNode = new THREE.Group();
    lidWire = lid.group;
    lidWire.add(segments(lid.E.slice(0, lid.E.length), matEdge));
    wire.add(hingeNode);

    wire.add(lidWire);
    wire.add(buildHeadphones());

    const E = [], D = [];
    buildMug(E, D);
    wire.add(segments(E, matEdge));
    wire.add(segments(D, matDetail));

    pc.add(wire);

    // glow copy: same geometry, additive ink, scaled a hair so the lines
    // read as if they bleed light instead of being hairline-flat.
    halo = wire.clone(true);
    halo.traverse((o) => { if (o.isLine || o.isLineSegments) o.material = matHalo; });
    halo.scale.setScalar(TUNE.halo);
    haloLid = halo.getObjectByName('lid');
    pc.add(halo);

    // the Enter affordance rides on the base so any base pose applies to it
    kbFx.position.copy(base.position);
    kbFx.rotation.copy(base.rotation);

    // scale the whole rig so it fills the hero column
    pc.scale.setScalar(1.18);
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

  // the lid pose is mirrored here so the screen, its bloom and the webcam
  // dot ride the panel without living inside the rebuildable wireframe.
  const lidFx = new THREE.Group();
  pc.add(lidFx);

  // reference plane size (3:2, matches the canvas ratio), scaled by TUNE
  const SCREEN_W = 3.3, SCREEN_H = 2.2;
  const screenMat = new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN_W, SCREEN_H), screenMat);
  screen.name = 'screen';
  lidFx.add(screen);

  // light spilling out of the panel (nothing in the scene is lit any more,
  // so the bloom is drawn, not computed). Sits behind the plane so only the
  // spill past the bezel shows.
  const bloomMat = new THREE.SpriteMaterial({
    map: glowTex, color: 0xffe9c8, transparent: true, opacity: 0.18,
    blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
  });
  const bloom = new THREE.Sprite(bloomMat);
  lidFx.add(bloom);

  // webcam dot in the top bezel — breathes
  const ledMat = new THREE.SpriteMaterial({
    map: glowTex, color: ACCENT, transparent: true, opacity: 0.9,
    blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
  });
  const led = new THREE.Sprite(ledMat);
  led.scale.setScalar(0.12);
  lidFx.add(led);

  // ─────────────────────────────────────────── contact shadows
  // Normal-blended (not additive) dark pools: the canvas is transparent, so
  // these composite straight onto the terracotta CSS stage and ground the
  // props instead of leaving them floating over the grid.
  const shadowLaptop = softPlane(6.2, 4.2, SHADE, 0.3, false);
  const shadowHp = softPlane(2.5, 2.1, SHADE, 0.22, false);
  const shadowMug = softPlane(1.1, 1.1, SHADE, 0.2, false);
  [shadowLaptop, shadowHp, shadowMug].forEach((s) => { s.position.y = 0.002; pc.add(s); });

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
  const enterRing = new THREE.LineLoop(circleGeom(0.24, 48), matEnterRing);
  enterFx.add(enterRing);

  // pool of light under the key
  const enterPool = softPlane(0.85, 0.85, ACCENT, 0, true);
  enterPool.position.y = -0.02;
  enterFx.add(enterPool);

  // ─────────────────────────────────────────── lighting
  // Every line is an unlit LineBasicMaterial and the screen is unlit too, so
  // this ambient only matters if a shaded part is ever added — it is kept so
  // the white ink can never be dimmed by a missing light.
  scene.add(new THREE.AmbientLight(0xfff4e6, 1));

  // ─────────────────────────────────────────── placement
  function placeScreen() {
    const S = TUNE.screen, L = TUNE.lid, B = TUNE.base;
    lidFx.position.set(0, B.h, hingeZ());
    lidFx.rotation.x = lidAngle();

    const zf = L.d / 2 + S.z;
    screen.position.set(S.x, S.y, zf);
    screen.scale.set(S.w / SCREEN_W, S.h / SCREEN_H, 1);

    bloom.position.set(S.x, S.y, zf - 0.05);
    bloom.scale.set(S.w * 1.5, S.h * 1.78, 1);

    led.position.set(S.x, S.y + S.h / 2 + 0.075, zf);
  }

  function placeEnter() {
    enterFx.position.set(TUNE.enter.x, TUNE.enter.y, TUNE.enter.z);
    // forgiving click target: a little wider/deeper than the drawn key
    enterKey.scale.set(ENTER_SIZE.w * 2.4, 0.16, ENTER_SIZE.d * 1.5);
    enterRing.scale.setScalar(1);
  }

  function placeShadows() {
    shadowLaptop.position.set(0, 0.002, TUNE.base.z - 0.15);
    shadowHp.position.set(TUNE.hp.x, 0.003, TUNE.hp.z + 0.1);
    shadowMug.position.set(TUNE.mug.x, 0.003, TUNE.mug.z);
  }

  // The camera is framed rather than placed: TUNE.cam only sets the viewing
  // direction, and the distance is solved so TUNE.frame fits at any aspect —
  // a tall narrow column pulls back instead of cropping the laptop.
  const camDir = new THREE.Vector3();
  function placeCamera() {
    const K = TUNE.cam, L = TUNE.look, F = TUNE.frame;
    camDir.set(K.x - L.x, K.y - L.y, K.z - L.z).normalize();
    const halfTan = Math.tan((camera.fov * Math.PI / 180) / 2);
    const d = Math.max(F.h / 2 / halfTan, F.w / 2 / (halfTan * Math.max(0.2, camera.aspect)));
    camera.position.set(L.x + camDir.x * d, L.y + camDir.y * d, L.z + camDir.z * d);
    camera.lookAt(L.x, L.y, L.z);
    camera.updateProjectionMatrix();
  }

  // re-apply TUNE live from the console: __pc3d.TUNE.lid.open = 105; __pc3d.apply()
  function apply() {
    build();
    placeScreen();
    placeEnter();
    placeShadows();
    placeCamera();
  }
  apply();
  pc.rotation.y = TUNE.rotY;

  // live-tuning handle exposed for console fiddling
  window.__pc3d = {
    scene, renderer, camera, pc, screen, enterKey, enterRing, TUNE,
    apply, build, placeScreen, placeEnter, placeShadows, placeCamera,
    get wire() { return wire; },
    get lid() { return lidWire; },
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

    // the whole desk floats and sways gently. screen, deck and the Enter
    // affordance are children, so they ride along and raycasting stays
    // correct without extra bookkeeping.
    if (!reduceMotion) {
      pc.position.y = Math.sin(elapsed * 0.0009) * 0.035;
      pc.rotation.y = TUNE.rotY + Math.sin(elapsed * 0.00045) * TUNE.sway;
      pc.rotation.x = Math.sin(elapsed * 0.00062) * TUNE.sway * 0.18;
    }

    // the lid breathes open and shut by a fraction of a degree — the wire
    // panel, its halo copy and the screen node all share one angle.
    const la = lidAngle() + (reduceMotion ? 0 : Math.sin(elapsed * 0.0007) * TUNE.breathe);
    if (lidWire) lidWire.rotation.x = la;
    if (haloLid) haloLid.rotation.x = la;
    lidFx.rotation.x = la;

    // ink breathing — the lines pulse very slightly, like a live blueprint
    const pulse = reduceMotion ? 0 : Math.sin(elapsed * 0.0016) * 0.05;
    matEdge.opacity = Math.min(1, TUNE.line.edge + pulse);
    matDetail.opacity = TUNE.line.detail + pulse * 0.6;
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

    // screen bloom + webcam dot breathe with the state
    const warm = state === 'result' ? 0xffe7c4 : 0xffd9a8;
    bloomMat.color.set(warm);
    bloomMat.opacity = (state === 'result' ? 0.24 : 0.17) +
      (reduceMotion ? 0 : Math.sin(elapsed * 0.004) * 0.035);
    ledMat.opacity = 0.4 + (reduceMotion ? 0.2 : Math.sin(elapsed * 0.0022) * 0.22 + 0.22);

    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);

  // ─────────────────────────────────────────── resize + pause offscreen
  const ro = new ResizeObserver(() => {
    w = container.clientWidth || w;
    h = container.clientHeight || h;
    camera.aspect = w / h;
    renderer.setSize(w, h);
    placeCamera();          // re-solve the distance so the framing survives
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
