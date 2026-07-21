/* ════════════════════════════════════════════════════════════════════════
   pc3d.js — interactive retro 3D PC for the hero (smiro.dev)

   The PC is a single authored GLB model (public/models/pc.glb, DRACO-
   compressed). There is NO procedural geometry — the GLB is the only model.
   On top of the GLB we place two things the model can't provide:
     · a live CanvasTexture "screen" plane over the monitor face — this is
       what shows the editor / terminal / CV, and what raycasting reads for
       hover + click on the CV card.
     · an invisible Enter-key raycast zone + a glowing ring over the GLB
       keyboard's Enter key — the interaction affordance.

   Rendering: Three.js (CDN ESM), PBR lit by RoomEnvironment (PMREM) so the
   model's metal & glass reflect. Warm 3-light rig + soft contact shadows.

   Story / state machine, driven by cursor proximity to the Enter key:
     idle      → cursor far. Editor at rest, first lines already typed.
     typing    → cursor approaches. Screen auto-types. Speed ∝ proximity.
     ready     → cursor near keyboard. Enter ring glows + rises.
     building  → user clicked Enter. Terminal runs a fake `build`.
     result    → a "browser" pops up with a clickable CV preview.

   Screen clicks/hover resolved via raycasting → UV → canvas pixels.
   Bilingual (EN/FR) via window.I18N.getLang() — re-read every frame.
   Live tuning: window.__pc3d (TUNE + apply()).
   ════════════════════════════════════════════════════════════════════════ */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.183.2/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'https://cdn.jsdelivr.net/npm/three@0.183.2/examples/jsm/loaders/DRACOLoader.js';

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
  camera.position.set(2.8, 1.95, 8.0);
  camera.lookAt(0, 1.15, 0.1);

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

  // ─────────────────────────────────────────── live-tuning values
  const TUNE = {
    fitHeight: 3.4,             // world-units tall the GLB is auto-scaled to
    pos: { x: 0, y: 0, z: 0 },  // extra offset after auto-centre + grounding
    rotY: 0,                    // extra yaw (radians)
    deskTop: 0.22,              // surface height the model base rests on
    cam: { x: 2.8, y: 1.95, z: 8.0 },
    look: { x: 0, y: 1.15, z: 0.1 },
    // screen overlay pose (fallback when no named screen mesh is in the GLB)
    screen: { x: 0, y: 1.75, z: 0.55, w: 3.3, h: 2.2, rotY: 0.1, push: 0.02 },
    // invisible Enter-key raycast zone + glowing ring over the GLB keyboard
    enter: { x: 0.55, y: 0.5, z: 1.5 },
  };

  // ─────────────────────────────────────────── screen (CanvasTexture plane)
  const SC_W = 1600, SC_H = 1067;      // canvas resolution the drawing code uses
  const sc = document.createElement('canvas');
  sc.width = SC_W; sc.height = SC_H;
  const g2 = sc.getContext('2d');
  const screenTex = new THREE.CanvasTexture(sc);
  screenTex.minFilter = THREE.LinearFilter;
  screenTex.magFilter = THREE.LinearFilter;
  screenTex.colorSpace = THREE.SRGBColorSpace;

  // reference plane size (3:2, matches canvas ratio). Scaled to fit the GLB.
  const SCREEN_W = 3.3, SCREEN_H = 2.2;
  const screenMat = new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN_W, SCREEN_H), screenMat);
  screen.name = 'screen';
  screen.visible = false;               // shown once the GLB (or fallback) is placed
  scene.add(screen);

  // warm point light spilling from the screen onto the scene
  const screenGlow = new THREE.PointLight(0xffe9c8, 0.7, 6);
  scene.add(screenGlow);

  // ─────────────────────────────────────────── Enter-key interaction group
  // Invisible raycast zone (GLB provides the visible key). matEnter is not
  // rendered, but three's raycaster still tests invisible-material meshes.
  const matEnter = new THREE.MeshStandardMaterial({ color: 0xe9e0cb, emissive: 0xe86830, emissiveIntensity: 0, roughness: 0.45, metalness: 0.08 });
  matEnter.visible = false;
  const enterKey = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.24), matEnter);
  enterKey.name = 'enter';
  enterKey.position.set(TUNE.enter.x, TUNE.enter.y, TUNE.enter.z);
  scene.add(enterKey);

  // glowing ring affordance
  const matEnterRing = new THREE.MeshBasicMaterial({ color: 0xe86830, transparent: true, opacity: 0 });
  const enterRing = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.013, 12, 44), matEnterRing);
  enterRing.rotation.x = -Math.PI / 2;
  enterRing.position.set(TUNE.enter.x, TUNE.enter.y, TUNE.enter.z);
  enterRing.visible = false;
  scene.add(enterRing);

  // ─────────────────────────────────────────── lighting (warm, restrained)
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

  // ═══════════════════════════ GLB MODEL (the only PC) ═══════════════════════
  let model = null;
  let modelBaseY = 0;
  let glbScreenMesh = null;

  // auto-fit: centre on X/Z, scale to TUNE.fitHeight, sit base on the desk top
  function fitModel() {
    if (!model) return;
    model.position.set(0, 0, 0);
    model.rotation.set(0, TUNE.rotY, 0);
    model.scale.setScalar(1);
    model.updateMatrixWorld(true);
    let box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    model.scale.setScalar(TUNE.fitHeight / (size.y || 1));
    model.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(model);
    const c = box.getCenter(new THREE.Vector3());
    model.position.set(-c.x + TUNE.pos.x, (TUNE.deskTop - box.min.y) + TUNE.pos.y, -c.z + TUNE.pos.z);
    model.updateMatrixWorld(true);
    modelBaseY = model.position.y;
  }

  // place the live screen plane over the GLB monitor. If the GLB exposes a
  // named screen/display mesh we snap to its world box + orientation; otherwise
  // we fall back to the tunable TUNE.screen pose.
  function placeScreen() {
    if (glbScreenMesh) {
      glbScreenMesh.updateWorldMatrix(true, false);
      const box = new THREE.Box3().setFromObject(glbScreenMesh);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      glbScreenMesh.getWorldQuaternion(screen.quaternion);
      screen.position.copy(center);
      screen.scale.set((size.x || SCREEN_W) / SCREEN_W, (size.y || SCREEN_H) / SCREEN_H, 1);
      const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(screen.quaternion).multiplyScalar(TUNE.screen.push);
      screen.position.add(fwd);
    } else {
      screen.quaternion.identity();
      screen.rotation.set(0, TUNE.screen.rotY, 0);
      screen.position.set(TUNE.screen.x, TUNE.screen.y, TUNE.screen.z);
      screen.scale.set(TUNE.screen.w / SCREEN_W, TUNE.screen.h / SCREEN_H, 1);
    }
    screen.userData.baseY = screen.position.y;
    // put the screen glow just in front of the plane
    const glowFwd = new THREE.Vector3(0, 0, 1).applyQuaternion(screen.quaternion).multiplyScalar(1.4);
    screenGlow.position.copy(screen.position).add(glowFwd);
  }

  function placeEnter() {
    enterKey.position.set(TUNE.enter.x, TUNE.enter.y, TUNE.enter.z);
    enterRing.position.set(TUNE.enter.x, TUNE.enter.y, TUNE.enter.z);
  }

  // re-apply TUNE live from the console: __pc3d.TUNE.fitHeight = 3.6; __pc3d.apply()
  function apply() {
    fitModel();
    placeScreen();
    placeEnter();
    camera.position.set(TUNE.cam.x, TUNE.cam.y, TUNE.cam.z);
    camera.lookAt(TUNE.look.x, TUNE.look.y, TUNE.look.z);
    camera.updateProjectionMatrix();
  }

  const draco = new DRACOLoader();
  draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.183.2/examples/jsm/libs/draco/');
  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(draco);
  gltfLoader.load(
    '/models/pc.glb',
    (gltf) => {
      model = gltf.scene;
      model.traverse((o) => {
        if (!o.isMesh) return;
        o.castShadow = true;
        o.receiveShadow = true;
        if (!glbScreenMesh && /screen|display|monitor/i.test(o.name)) glbScreenMesh = o;
      });
      scene.add(model);
      // if the GLB has its own screen surface, darken it so our live overlay
      // reads cleanly on top of it.
      if (glbScreenMesh) glbScreenMesh.material = new THREE.MeshBasicMaterial({ color: 0x05070a });
      apply();
      screen.visible = true;
      enterRing.visible = true;
      window.__pc3d.model = model;
      window.__pc3d.screenMesh = glbScreenMesh;
    },
    undefined,
    (err) => {
      // No procedural fallback — show the live screen overlay on its own so the
      // hero still tells its story, and log the failure.
      console.warn('[pc3d] pc.glb failed to load — showing screen-only fallback', err);
      placeScreen();
      placeEnter();
      screen.visible = true;
      enterRing.visible = true;
    }
  );

  // live-tuning handle exposed for console fiddling
  window.__pc3d = { model, screen, enterKey, enterRing, camera, TUNE, apply, placeScreen, placeEnter };

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

    // shared, in-sync vertical float applied to model + screen + ring
    const floatY = reduceMotion ? 0 : Math.sin(elapsed * 0.0009) * 0.02;

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
      enterKey.position.y = TUNE.enter.y + floatY + (Math.sin(elapsed * 0.006) * 0.014 + 0.014) * want;
      enterRing.material.opacity += ((want > 0.15 ? 0.6 + Math.sin(elapsed * 0.006) * 0.3 : 0) - enterRing.material.opacity) * 0.18;
      enterRing.scale.setScalar(1 + want * 0.14);
      drawEditor(elapsed);
    } else if (state === 'building') {
      matEnter.emissiveIntensity = 1.9;
      enterKey.position.y = TUNE.enter.y + floatY - 0.02;
      const be = now - buildStart;
      drawTerminal(be);
      const total = TERM_PER_LINE * txt().term.length + TERM_HOLD;
      if (be > total) { state = 'result'; buildStart = now; }
    } else if (state === 'result') {
      enterKey.position.y = TUNE.enter.y + floatY;
      matEnter.emissiveIntensity += (0 - matEnter.emissiveIntensity) * 0.08;
      enterRing.material.opacity += (0 - enterRing.material.opacity) * 0.18;
      drawResult(now - buildStart);
    }

    // monitor float (whole model) + screen + ring move together
    if (model) model.position.y = modelBaseY + floatY;
    if (screen.userData.baseY != null) screen.position.y = screen.userData.baseY + floatY;
    enterRing.position.y = TUNE.enter.y + floatY;

    // screen glow: breathing intensity stands in for the monitor's power LED
    screenGlow.color.set(state === 'result' ? 0xffe7c4 : 0xffe9c8);
    screenGlow.intensity = (state === 'result' ? 1.1 : 0.7) +
      (reduceMotion ? 0 : Math.sin(elapsed * 0.004) * 0.12);

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
