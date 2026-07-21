/* ════════════════════════════════════════════════════════════════════════
   pc3d.js — interactive retro 3D PC for the hero (smiro.dev)

   Story / state machine, driven by cursor proximity to the Enter key:
     idle      → cursor far. Screen shows an editor at rest.
     typing    → cursor approaches. The screen auto-types the (joke) "employer
                 persuasion" HTML. The closer the cursor to Enter, the faster.
     ready     → cursor near the keyboard. The Enter key glows, inviting a click.
     building  → user clicked Enter. Terminal runs a fake `build`.
     result    → a "browser" pops up: "Thank you for your risk 😉 …" + a clickable
                 preview of the real CV. Hover = orange border + pointer.
                 Click = navigate to /cv (or /cv-fr when the site is in French).

   Rendering: Three.js (CDN ESM). The PC body is a DRACO-compressed GLB model
   (public/models/pc.glb); the monitor screen is a high-res CanvasTexture overlaid
   on the model, and clicks/hover are resolved by raycasting → UV → canvas pixels.
   Bilingual (EN/FR) via window.I18N.getLang(); re-read every frame so the
   language toggle (⚙ → Language) updates the screen live.
   ════════════════════════════════════════════════════════════════════════ */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.183.2/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.183.2/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'https://cdn.jsdelivr.net/npm/three@0.183.2/examples/jsm/loaders/DRACOLoader.js';

const mount = document.getElementById('pc3d-mount');
if (mount) boot(mount);

function boot(container) {
  // graceful bail if WebGL is unavailable
  try {
    const test = document.createElement('canvas');
    if (!(test.getContext('webgl2') || test.getContext('webgl'))) throw 0;
  } catch (_) {
    container.classList.add('is-engaged'); // hide hint
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
  let w = container.clientWidth || 480;
  let h = container.clientHeight || 460;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, w / h, 0.1, 100);
  camera.position.set(3.2, 2.55, 6.4);
  camera.lookAt(0, 1.05, 0.35);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  container.appendChild(renderer.domElement);

  // ─────────────────────────────────────────── tunables (align overlays to the GLB)
  // pc.glb is one merged, DRACO-compressed mesh with no named screen/keyboard parts,
  // so the live screen and the Enter interaction zone are our own objects positioned
  // over the model. Live-tune in devtools: window.__pc3d.TUNE.model.ry = 1.2; ...apply()
  const TUNE = {
    fitHeight: 3.4,                                 // world height the whole model scales to
    model: { scale: 1, x: 0, y: 0, z: 0, ry: 0 },   // manual offset applied on top of auto-fit
  };

  // ─────────────────────────────────────────── monitor float anchor
  // carries the live CanvasTexture screen + its glow; floats gently in the loop
  const mon = new THREE.Group();
  mon.position.set(0, 1.55, -0.15);
  mon.rotation.y = 0.16;
  scene.add(mon);

  // screen canvas texture (high-res for crisp text)
  const SC_W = 1024, SC_H = 768;
  const sc = document.createElement('canvas');
  sc.width = SC_W; sc.height = SC_H;
  const g2 = sc.getContext('2d');
  const screenTex = new THREE.CanvasTexture(sc);
  screenTex.minFilter = THREE.LinearFilter;
  screenTex.colorSpace = THREE.SRGBColorSpace;
  const screenMat = new THREE.MeshBasicMaterial({ map: screenTex });
  const SCREEN_W = 2.34, SCREEN_H = 1.78;
  let screen = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN_W, SCREEN_H), screenMat);
  screen.position.z = 0.215;
  screen.name = 'screen';
  mon.add(screen);

  // soft screen glow
  const glow = new THREE.PointLight(0x6fd0ff, 0.35, 6);
  glow.position.set(0, 0, 1.2);
  mon.add(glow);

  // power LED
  const ledMat = new THREE.MeshStandardMaterial({ color: 0x7ee787, emissive: 0x7ee787, emissiveIntensity: 2 });
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), ledMat);
  led.position.set(1.2, -1.05, 0.2);
  mon.add(led);

  // ─────────────────────────────────────────── keyboard anchor (Enter interaction)
  // The GLB has no named key, so the Enter target is an invisible mesh and a glowing
  // ring is the visible "press ⏎" affordance. Both live in a group whose local frame
  // matches the old keyboard, so the loop's enterKey.position.y bob works unchanged.
  const kb = new THREE.Group();
  kb.position.set(-0.15, 0.32, 1.75);
  kb.rotation.x = -0.06;
  scene.add(kb);

  const KEY = 0.18, KH = 0.085;
  // forgiving click zone over the keyboard (invisible; raycast target only)
  const kbBody = new THREE.Mesh(
    new THREE.BoxGeometry(2.7, 0.16, 1.0),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  kb.add(kbBody);

  // Enter key — invisible interaction mesh, named for raycasting
  const matEnter = new THREE.MeshStandardMaterial({ color: 0xe9e0cb, emissive: 0xe86830, emissiveIntensity: 0, roughness: 0.6, metalness: 0.0 });
  const enterKey = new THREE.Mesh(new THREE.BoxGeometry(KEY * 2.2, KH, KEY), matEnter);
  enterKey.position.set(1.10, 0.122, 0.08);
  enterKey.visible = false;
  enterKey.name = 'enter';
  kb.add(enterKey);

  // glowing ↵ ring affordance (opacity/scale animated in the loop)
  const enterRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.34, 0.018, 10, 40),
    new THREE.MeshBasicMaterial({ color: 0xe86830, transparent: true, opacity: 0 })
  );
  enterRing.rotation.x = -Math.PI / 2;
  enterRing.position.set(1.10, 0.2, 0.08);
  kb.add(enterRing);

  // ─────────────────────────────────────────── lights (warm, cinematic)
  scene.add(new THREE.AmbientLight(0xfff6ea, 0.55));
  const key = new THREE.DirectionalLight(0xfff0dd, 1.5);
  key.position.set(4, 7, 5); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1; key.shadow.camera.far = 24;
  key.shadow.camera.left = -6; key.shadow.camera.right = 6; key.shadow.camera.top = 6; key.shadow.camera.bottom = -6;
  key.shadow.radius = 5; key.shadow.bias = -0.0004;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x9aa6d6, 0.4); fill.position.set(-4, 3, 2); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xe86830, 0.55); rim.position.set(-3, 2, 6); scene.add(rim);

  // ─────────────────────────────────────────── GLB model (public/models/pc.glb)
  // Replaces the old procedural PC. One merged DRACO + WebP mesh: auto-fit to the
  // scene, then nudged to sit behind the screen/keyboard anchors above. Tune live via
  // window.__pc3d (e.g. window.__pc3d.TUNE.model.ry = 1.2; window.__pc3d.apply()).
  let pcModel = null;
  const draco = new DRACOLoader();
  draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.183.2/examples/jsm/libs/draco/');
  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(draco);

  function fitModel(model) {
    // reset, measure, uniformly scale to TUNE.fitHeight, recenter, then apply offsets
    model.scale.setScalar(1);
    model.position.set(0, 0, 0);
    model.rotation.set(0, TUNE.model.ry, 0);
    const size = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
    const s = (TUNE.fitHeight / (size.y || 1)) * TUNE.model.scale;
    model.scale.setScalar(s);
    const box = new THREE.Box3().setFromObject(model);
    const c = box.getCenter(new THREE.Vector3());
    model.position.set(-c.x + TUNE.model.x, -box.min.y + TUNE.model.y, -c.z + TUNE.model.z);
    console.info('[pc3d] GLB fitted — raw size', size, 'scale', s.toFixed(3), 'pos', model.position);
  }

  gltfLoader.load('/models/pc.glb', (gltf) => {
    pcModel = gltf.scene;
    let namedScreen = null;
    pcModel.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true;
      o.receiveShadow = true;
      const n = (o.name || '').toLowerCase();
      if (!namedScreen && /screen|display|monitor/.test(n)) namedScreen = o;
    });
    // if a future GLB ships a real screen mesh, drive it with the CanvasTexture and
    // raycast against it instead of the overlay plane
    if (namedScreen) {
      namedScreen.material = screenMat;
      namedScreen.name = 'screen';
      screen.visible = false;
      screen = namedScreen;
    }
    fitModel(pcModel);
    scene.add(pcModel);
    // live-tuning handle for dialing in alignment without re-editing the file
    window.__pc3d = { model: pcModel, mon, kb, screen, enterKey, enterRing, camera, TUNE, apply: () => fitModel(pcModel) };
  }, undefined, (err) => console.error('[pc3d] failed to load /models/pc.glb', err));

  // ─────────────────────────────────────────── state + interaction
  let state = 'idle';            // idle | typing | building | result
  let typed = 0;                 // chars revealed
  let proximity = 0;             // 0..1 (1 = cursor on Enter)
  let mouseX = -1e4, mouseY = -1e4, hasPointer = false;
  let hoverCV = false;
  let buildStart = 0;
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const vWorld = new THREE.Vector3();

  // total chars in the code (for completion checks)
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
    // raycast for CV hover in result mode
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

  // CV preview rectangle on the canvas (result mode), in canvas px
  const CV_RECT = { x: 200, y: 420, w: 624, h: 300 };
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
      // pressing Enter — forgiving: the key, the keyboard, or just being close
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
    // activity bar
    g2.fillStyle = '#0a0d12'; g2.fillRect(0, 0, 54, SC_H);
    g2.fillStyle = '#e86830'; g2.fillRect(0, 70, 3, 34);
    // tab bar
    g2.fillStyle = '#10151c'; g2.fillRect(54, 0, SC_W - 54, 46);
    g2.fillStyle = '#0d1117'; g2.fillRect(54, 0, 230, 46);
    g2.fillStyle = '#e86830'; g2.fillRect(54, 0, 230, 3);
    g2.fillStyle = '#e6edf3'; g2.font = '500 22px ui-monospace, monospace';
    g2.textBaseline = 'alphabetic';
    g2.fillText('◗ ' + T.file, 74, 31);

    const reveal = Math.floor(typed);
    let seen = 0;
    const lineH = 40, x0 = 96, y0 = 96;
    let cursorX = x0, cursorY = y0, drewCursor = false;

    for (let i = 0; i < T.code.length; i++) {
      const y = y0 + i * lineH;
      g2.fillStyle = '#3a4250'; g2.font = '18px ui-monospace, monospace';
      g2.fillText(String(i + 1).padStart(2), 66, y);
      let x = x0;
      for (const [t0, cls] of T.code[i]) {
        for (let ci = 0; ci < t0.length; ci++) {
          if (seen >= reveal) {
            cursorX = x; cursorY = y; drewCursor = true;
            break;
          }
          const ch = t0[ci];
          g2.fillStyle = TOK[cls] || '#e6edf3';
          g2.font = '20px ui-monospace, monospace';
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
      g2.fillRect(cursorX + 1, cursorY - 18, 3, 24);
    }
    // prompt chip bottom-right
    const ready = proximity > 0.45;
    const label = ready ? T.hintReady : T.hint;
    g2.font = '600 19px ui-monospace, monospace';
    const tw = g2.measureText(label).width + 34;
    const bx = SC_W - tw - 26, by = SC_H - 64;
    g2.fillStyle = ready ? '#e86830' : 'rgba(230,237,243,0.10)';
    rr(g2, bx, by, tw, 40, 20); g2.fill();
    g2.fillStyle = ready ? '#0d1117' : '#9aa4b2';
    g2.fillText(label, bx + 17, by + 27);

    screenTex.needsUpdate = true;
  }

  const TERM_PER_LINE = 620;   // ms a line takes to appear (slower = more drama)
  const TERM_HOLD = 1100;      // ms the finished build holds before the browser pops
  function drawTerminal(t) {
    const T = txt();
    g2.fillStyle = '#0d1117'; g2.fillRect(0, 0, SC_W, SC_H);
    g2.fillStyle = '#10151c'; g2.fillRect(0, 0, SC_W, 52);
    g2.fillStyle = '#e86830'; g2.beginPath(); g2.arc(30, 26, 6, 0, 7); g2.fill();
    g2.fillStyle = '#8b949e'; g2.font = '600 21px ui-monospace, monospace';
    g2.fillText('TERMINAL — build', 48, 34);
    const n = Math.min(T.term.length, Math.floor(t / TERM_PER_LINE) + 1);
    for (let i = 0; i < n; i++) {
      const line = T.term[i];
      g2.font = '25px ui-monospace, monospace';
      g2.fillStyle = line[0] === '$' ? '#d2a8ff' : line[0] === '✓' ? '#7ee787' : '#e6edf3';
      let shown = line, typing = false;
      if (i === n - 1) {
        const cc = Math.max(1, Math.floor((t - i * TERM_PER_LINE) / 30)); // ~30ms / char
        if (cc < line.length) typing = true;
        shown = line.slice(0, cc);
      }
      const ly = 116 + i * 58;
      g2.fillText(shown, 32, ly);
      // blinking block cursor on the active line
      if (i === n - 1 && (typing || Math.floor(t / 400) % 2 === 0)) {
        const cw = g2.measureText(shown).width;
        g2.fillStyle = '#e86830';
        g2.fillRect(38 + cw, ly - 20, 13, 26);
      }
    }
    // progress bar + percent
    const p = Math.min(1, t / (TERM_PER_LINE * T.term.length));
    g2.fillStyle = '#7ee787'; g2.font = '600 19px ui-monospace, monospace';
    g2.fillText('▲ astro build', 32, SC_H - 96);
    g2.textAlign = 'right';
    g2.fillText(Math.round(p * 100) + '%', SC_W - 32, SC_H - 96);
    g2.textAlign = 'left';
    g2.fillStyle = '#161b22'; rr(g2, 32, SC_H - 80, SC_W - 64, 18, 9); g2.fill();
    g2.fillStyle = '#e86830'; rr(g2, 32, SC_H - 80, (SC_W - 64) * p, 18, 9); g2.fill();
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
    // browser background
    g2.fillStyle = '#f4f1e8'; g2.fillRect(0, 0, SC_W, SC_H);
    // browser chrome
    g2.fillStyle = '#e7e1d3'; g2.fillRect(0, 0, SC_W, 74);
    const dots = ['#ec6a5e', '#f4bf4f', '#61c554'];
    dots.forEach((c, i) => { g2.fillStyle = c; g2.beginPath(); g2.arc(40 + i * 36, 37, 11, 0, 7); g2.fill(); });
    g2.fillStyle = '#fbfaf6'; rr(g2, 168, 17, SC_W - 230, 42, 21); g2.fill();
    g2.fillStyle = '#9a9385'; g2.font = '21px ui-monospace, monospace';
    g2.fillText('🔒 ' + T.url, 192, 45);

    // entrance animation
    const a = Math.min(1, t / 440);
    g2.save();
    g2.globalAlpha = a;
    g2.translate(0, (1 - a) * 30);

    // big headline
    g2.textAlign = 'center';
    g2.fillStyle = '#1b1a18';
    g2.font = '700 68px "Fraunces", Georgia, serif';
    g2.fillText(T.big, SC_W / 2, 188);
    g2.fillStyle = '#b4502a';
    g2.font = 'italic 600 52px "Fraunces", Georgia, serif';
    g2.fillText(T.big2, SC_W / 2, 258);
    // subline
    g2.fillStyle = '#6b655a';
    g2.font = '600 31px "Quicksand", system-ui, sans-serif';
    g2.fillText(T.sub, SC_W / 2, 344);
    g2.textAlign = 'left';

    // ── CV preview card (clickable region = CV_RECT) ──
    const R = CV_RECT;
    g2.fillStyle = '#fffdf8';
    rr(g2, R.x, R.y, R.w, R.h, 20); g2.fill();
    // left brick accent
    g2.fillStyle = '#b4502a'; rr(g2, R.x, R.y, 10, R.h, 5); g2.fill();
    // avatar
    const asz = 124, ax = R.x + 46, ay = R.y + 46;
    g2.save();
    g2.beginPath(); g2.arc(ax + asz / 2, ay + asz / 2, asz / 2, 0, 7); g2.closePath();
    g2.fillStyle = '#efe7d6'; g2.fill(); g2.clip();
    if (avatarReady) g2.drawImage(avatarImg, ax, ay, asz, asz);
    g2.restore();
    // name + role
    const tx = R.x + 200;
    g2.fillStyle = '#1b1a18'; g2.font = '700 46px "Fraunces", Georgia, serif';
    g2.fillText(T.cvName, tx, R.y + 80);
    g2.fillStyle = '#6b655a'; g2.font = '500 24px "Geist Mono", ui-monospace, monospace';
    g2.fillText(T.cvRole, tx, R.y + 118);
    // chips
    let cx = tx;
    g2.font = '600 22px "Quicksand", system-ui, sans-serif';
    T.cvChips.forEach((chip) => {
      const cw = g2.measureText(chip).width + 34;
      g2.fillStyle = '#f1ece0'; rr(g2, cx, R.y + 144, cw, 40, 20); g2.fill();
      g2.fillStyle = '#7a5a3a'; g2.fillText(chip, cx + 17, R.y + 171);
      cx += cw + 12;
    });
    // resume teaser lines (top of CV)
    g2.fillStyle = '#e3dccc';
    [0, 1].forEach((k) => { rr(g2, R.x + 46, R.y + 214 + k * 26, R.w - 250, 10, 5); g2.fill(); });
    // open CV affordance
    g2.fillStyle = hoverCV ? '#b4502a' : '#9a9385';
    g2.font = '600 23px "Geist Mono", ui-monospace, monospace';
    g2.textAlign = 'right';
    g2.fillText(T.cvOpen, R.x + R.w - 26, R.y + R.h - 26);
    g2.textAlign = 'left';
    // hover border (orange, border-1)
    if (hoverCV) {
      g2.strokeStyle = '#e86830'; g2.lineWidth = 3.5;
      rr(g2, R.x + 2, R.y + 2, R.w - 4, R.h - 4, 20); g2.stroke();
    }
    g2.restore();
    screenTex.needsUpdate = true;
  }

  // ─────────────────────────────────────────── loop
  const t0 = performance.now();
  let prev = t0;
  let raf;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
    const elapsed = now - t0;

    // proximity from cursor → Enter (projected)
    if (hasPointer && (state === 'idle' || state === 'typing')) {
      const ep = enterScreenPx();
      const d = Math.hypot(mouseX - ep.x, mouseY - ep.y);
      const radius = Math.max(150, Math.min(w, h) * 0.72);
      proximity = Math.max(0, Math.min(1, 1 - d / radius));
    }

    // typing advances with proximity (closer = faster)
    if (state === 'idle' || state === 'typing') {
      if (proximity > 0.04) {
        state = 'typing';
        const cps = 4 + proximity * proximity * 150; // chars/sec
        typed = Math.min(totalChars(), typed + cps * dt);
      }
      container.classList.toggle('is-engaged', proximity > 0.12);
      // Enter glow ramps with proximity (visible well before the click zone)
      const want = Math.max(0, Math.min(1, (proximity - 0.26) / 0.5));
      matEnter.emissiveIntensity += (want * 1.5 - matEnter.emissiveIntensity) * 0.18;
      enterKey.position.y = 0.122 + (Math.sin(elapsed * 0.006) * 0.012 + 0.012) * want;
      enterRing.material.opacity += ((want > 0.15 ? 0.55 + Math.sin(elapsed * 0.006) * 0.25 : 0) - enterRing.material.opacity) * 0.2;
      enterRing.scale.setScalar(1 + want * 0.12);
      drawEditor(elapsed);
    } else if (state === 'building') {
      matEnter.emissiveIntensity = 1.6;
      enterKey.position.y = 0.105; // pressed
      const be = now - buildStart;
      drawTerminal(be);
      const total = TERM_PER_LINE * txt().term.length + TERM_HOLD;
      if (be > total) { state = 'result'; buildStart = now; }
    } else if (state === 'result') {
      enterKey.position.y = 0.122;
      matEnter.emissiveIntensity += (0 - matEnter.emissiveIntensity) * 0.1;
      enterRing.material.opacity += (0 - enterRing.material.opacity) * 0.2;
      drawResult(now - buildStart);
    }

    // gentle float + LED breathing (skip if reduced motion)
    if (!reduceMotion) {
      mon.position.y = 1.55 + Math.sin(elapsed * 0.0009) * 0.02;
      ledMat.emissiveIntensity = 1.6 + Math.sin(elapsed * 0.004) * 0.8;
    }
    glow.color.set(state === 'result' ? 0xffe7c4 : 0x6fd0ff);

    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);

  // ─────────────────────────────────────────── resize + pause offscreen
  const ro = new ResizeObserver(() => {
    w = container.clientWidth || w;
    h = container.clientHeight || h;
    camera.aspect = w / h; camera.updateProjectionMatrix();
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
