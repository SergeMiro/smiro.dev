import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Pixar-style 3D Computer — cel-shaded, rounded, warm lighting
 * Half-turned toward text (rotated ~25deg Y)
 * Animated screen with code typing
 */
export default function PixarComputer() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    let w = container.clientWidth;
    let h = container.clientHeight;

    // === Scene ===
    const scene = new THREE.Scene();
    scene.background = null; // transparent

    // === Camera — angled to show 3D depth ===
    const camera = new THREE.PerspectiveCamera(30, w / h, 0.1, 100);
    camera.position.set(4.5, 2.8, 6);
    camera.lookAt(0, 0.6, 0);

    // === Renderer ===
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // === Toon gradient (5-step for Pixar look) ===
    const gradData = new Uint8Array([30, 60, 120, 180, 240]);
    const toonGradient = new THREE.DataTexture(gradData, 5, 1, THREE.RedFormat);
    toonGradient.minFilter = THREE.NearestFilter;
    toonGradient.magFilter = THREE.NearestFilter;
    toonGradient.needsUpdate = true;

    // === Materials ===
    const matMonitor = new THREE.MeshToonMaterial({
      color: 0x2a2a30,
      gradientMap: toonGradient,
    });
    const matMonitorBack = new THREE.MeshToonMaterial({
      color: 0x222228,
      gradientMap: toonGradient,
    });
    const matBezel = new THREE.MeshToonMaterial({
      color: 0x151518,
      gradientMap: toonGradient,
    });
    const matStand = new THREE.MeshToonMaterial({
      color: 0x202025,
      gradientMap: toonGradient,
    });
    const matDesk = new THREE.MeshToonMaterial({
      color: 0x4a4038,
      gradientMap: toonGradient,
    });
    const matKb = new THREE.MeshToonMaterial({
      color: 0x1a1a20,
      gradientMap: toonGradient,
    });
    const matKeycap = new THREE.MeshToonMaterial({
      color: 0x2a2a32,
      gradientMap: toonGradient,
    });
    const matAccentKey = new THREE.MeshToonMaterial({
      color: 0xe86830,
      gradientMap: toonGradient,
    });
    const matMouse = new THREE.MeshToonMaterial({
      color: 0x1e1e24,
      gradientMap: toonGradient,
    });
    const matOutline = new THREE.MeshBasicMaterial({
      color: 0x000000,
      side: THREE.BackSide,
    });

    // Shared geometry helpers
    function roundedBox(w: number, h: number, d: number, r: number) {
      const shape = new THREE.Shape();
      const x = -w / 2, y = -h / 2;
      shape.moveTo(x + r, y);
      shape.lineTo(x + w - r, y);
      shape.quadraticCurveTo(x + w, y, x + w, y + r);
      shape.lineTo(x + w, y + h - r);
      shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      shape.lineTo(x + r, y + h);
      shape.quadraticCurveTo(x, y + h, x, y + h - r);
      shape.lineTo(x, y + r);
      shape.quadraticCurveTo(x, y, x + r, y);
      const extrudeSettings = { depth: d, bevelEnabled: true, bevelThickness: r * 0.3, bevelSize: r * 0.3, bevelSegments: 3 };
      return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    }

    // === Monitor Group ===
    const monitorGroup = new THREE.Group();
    monitorGroup.position.set(0, 1.6, 0);
    // Slight half-turn toward text (left side where text is)
    monitorGroup.rotation.y = 0.15;
    scene.add(monitorGroup);

    // Monitor body (rounded)
    const monitorGeom = roundedBox(3.2, 2, 0.15, 0.08);
    const monitor = new THREE.Mesh(monitorGeom, matMonitor);
    monitor.castShadow = true;
    monitorGroup.add(monitor);

    // Monitor back
    const backGeom = roundedBox(3.0, 1.8, 0.2, 0.06);
    const monitorBack = new THREE.Mesh(backGeom, matMonitorBack);
    monitorBack.position.z = -0.18;
    monitorGroup.add(monitorBack);

    // Outline
    const outlineGeom = roundedBox(3.24, 2.04, 0.16, 0.08);
    const outline = new THREE.Mesh(outlineGeom, matOutline);
    outline.scale.set(1.015, 1.015, 1.015);
    monitorGroup.add(outline);

    // Screen bezel (dark inset)
    const bezelGeom = new THREE.BoxGeometry(2.95, 1.75, 0.01);
    const bezel = new THREE.Mesh(bezelGeom, matBezel);
    bezel.position.z = 0.085;
    monitorGroup.add(bezel);

    // Screen (with animated texture)
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 640;
    screenCanvas.height = 360;
    const sctx = screenCanvas.getContext('2d')!;
    const screenTexture = new THREE.CanvasTexture(screenCanvas);
    screenTexture.minFilter = THREE.LinearFilter;

    const screenMat = new THREE.MeshBasicMaterial({ map: screenTexture });
    const screenGeom = new THREE.PlaneGeometry(2.8, 1.6);
    const screen = new THREE.Mesh(screenGeom, screenMat);
    screen.position.z = 0.09;
    monitorGroup.add(screen);

    // Screen glow light
    const screenGlow = new THREE.PointLight(0xe86830, 0.3, 5);
    screenGlow.position.set(0, 0, 1);
    monitorGroup.add(screenGlow);

    // LED strip bottom of monitor
    const ledGeom = new THREE.BoxGeometry(2.0, 0.03, 0.02);
    const ledMat = new THREE.MeshStandardMaterial({
      color: 0xe86830,
      emissive: 0xe86830,
      emissiveIntensity: 3,
    });
    const led = new THREE.Mesh(ledGeom, ledMat);
    led.position.set(0, -0.98, 0.09);
    monitorGroup.add(led);

    // === Stand ===
    // Neck (cylinder)
    const neckGeom = new THREE.CylinderGeometry(0.08, 0.1, 0.7, 16);
    const neck = new THREE.Mesh(neckGeom, matStand);
    neck.position.set(0, 0.25, 0);
    neck.castShadow = true;
    scene.add(neck);

    // Base (rounded disc)
    const baseGeom = new THREE.CylinderGeometry(0.55, 0.6, 0.06, 32);
    const base = new THREE.Mesh(baseGeom, matStand);
    base.position.set(0, -0.1, 0);
    base.castShadow = true;
    base.receiveShadow = true;
    scene.add(base);

    // === Desk ===
    const deskGeom = new THREE.BoxGeometry(6, 0.1, 3.5);
    const desk = new THREE.Mesh(deskGeom, matDesk);
    desk.position.set(0, -0.18, 0.5);
    desk.receiveShadow = true;
    scene.add(desk);

    // === Keyboard ===
    const kbGroup = new THREE.Group();
    kbGroup.position.set(0, -0.08, 1.4);
    kbGroup.rotation.x = -0.08;
    scene.add(kbGroup);

    const kbBody = new THREE.Mesh(
      roundedBox(2.2, 0.06, 0.7, 0.04),
      matKb
    );
    kbBody.rotation.x = -Math.PI / 2;
    kbBody.castShadow = true;
    kbGroup.add(kbBody);

    // Keycaps
    for (let row = 0; row < 4; row++) {
      const cols = row === 3 ? 8 : 13;
      for (let col = 0; col < cols; col++) {
        const isAccent = (row === 0 && col === 12) || (row === 3 && col === 4);
        const keycap = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.05, 0.12),
          isAccent ? matAccentKey : matKeycap
        );
        const startX = row === 3 ? -0.56 : -0.84;
        const spacing = row === 3 ? 0.15 : 0.14;
        keycap.position.set(
          startX + col * spacing,
          0.04,
          -0.25 + row * 0.16
        );
        kbGroup.add(keycap);
      }
    }

    // === Mouse ===
    const mouseGroup = new THREE.Group();
    mouseGroup.position.set(1.5, -0.08, 1.5);
    scene.add(mouseGroup);

    const mouseBody = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.1, 0.16, 8, 16),
      matMouse
    );
    mouseBody.rotation.x = -Math.PI / 2;
    mouseBody.rotation.z = 0.1;
    mouseBody.castShadow = true;
    mouseGroup.add(mouseBody);

    // Scroll wheel
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.06, 12),
      matKeycap
    );
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(0, 0.06, -0.06);
    mouseGroup.add(wheel);

    // === Coffee mug (Pixar detail) ===
    const mugGroup = new THREE.Group();
    mugGroup.position.set(-1.6, -0.02, 1.2);
    scene.add(mugGroup);

    const mugBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.1, 0.22, 16),
      new THREE.MeshToonMaterial({ color: 0xe86830, gradientMap: toonGradient })
    );
    mugBody.castShadow = true;
    mugGroup.add(mugBody);

    // Mug handle
    const handleGeom = new THREE.TorusGeometry(0.06, 0.015, 8, 12, Math.PI);
    const handle = new THREE.Mesh(handleGeom, new THREE.MeshToonMaterial({ color: 0xe86830, gradientMap: toonGradient }));
    handle.position.set(0.13, 0, 0);
    handle.rotation.z = Math.PI / 2;
    mugGroup.add(handle);

    // Coffee surface
    const coffee = new THREE.Mesh(
      new THREE.CircleGeometry(0.11, 16),
      new THREE.MeshToonMaterial({ color: 0x3a2015, gradientMap: toonGradient })
    );
    coffee.position.y = 0.11;
    coffee.rotation.x = -Math.PI / 2;
    mugGroup.add(coffee);

    // === Plant pot (another Pixar detail) ===
    const potGroup = new THREE.Group();
    potGroup.position.set(-2.0, 0.1, -0.3);
    scene.add(potGroup);

    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.1, 0.2, 12),
      new THREE.MeshToonMaterial({ color: 0xc8a882, gradientMap: toonGradient })
    );
    pot.castShadow = true;
    potGroup.add(pot);

    // Leaves (simple spheres)
    const leafMat = new THREE.MeshToonMaterial({ color: 0x5a8a50, gradientMap: toonGradient });
    const positions = [[0, 0.22, 0], [0.08, 0.28, 0.05], [-0.06, 0.26, -0.04], [0.04, 0.3, -0.06]];
    positions.forEach(([x, y, z]) => {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), leafMat);
      leaf.position.set(x, y, z);
      leaf.scale.set(1, 0.7, 1);
      potGroup.add(leaf);
    });

    // === Lights (warm, cinematic) ===
    const ambient = new THREE.AmbientLight(0xfff8f0, 0.4);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffeedd, 1.4);
    keyLight.position.set(4, 6, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 20;
    keyLight.shadow.camera.left = -4;
    keyLight.shadow.camera.right = 4;
    keyLight.shadow.camera.top = 4;
    keyLight.shadow.camera.bottom = -4;
    keyLight.shadow.radius = 4;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x8888cc, 0.35);
    fillLight.position.set(-3, 3, -2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xe86830, 0.5);
    rimLight.position.set(-3, 2, 5);
    scene.add(rimLight);

    // === Screen content drawing ===
    const codeLines = [
      { tokens: [{ t: '---', c: '#e86830' }] },
      { tokens: [{ t: 'import ', c: '#e86830' }, { t: '{ gsap }', c: '#79c0ff' }, { t: ' from ', c: '#e86830' }, { t: "'gsap'", c: '#a5d6ff' }] },
      { tokens: [{ t: 'import ', c: '#e86830' }, { t: 'type { Props }', c: '#79c0ff' }] },
      { tokens: [{ t: '---', c: '#e86830' }] },
      { tokens: [] },
      { tokens: [{ t: '<section ', c: '#7ee787' }, { t: 'class=', c: '#79c0ff' }, { t: '"hero"', c: '#a5d6ff' }, { t: '>', c: '#7ee787' }] },
      { tokens: [{ t: '  <h1>', c: '#7ee787' }] },
      { tokens: [{ t: '    Full Stack', c: '#f0ede6' }] },
      { tokens: [{ t: '    Developer.', c: '#f0ede6' }] },
      { tokens: [{ t: '  </h1>', c: '#7ee787' }] },
      { tokens: [{ t: '  <span ', c: '#7ee787' }, { t: 'class=', c: '#79c0ff' }, { t: '"accent"', c: '#a5d6ff' }, { t: '>', c: '#7ee787' }] },
      { tokens: [{ t: '    AI Whisperer.', c: '#e86830' }] },
      { tokens: [{ t: '  </span>', c: '#7ee787' }] },
      { tokens: [{ t: '</section>', c: '#7ee787' }] },
    ];

    function drawScreen(time: number) {
      const w = 640, h = 360;
      sctx.fillStyle = '#0d1117';
      sctx.fillRect(0, 0, w, h);

      // Activity bar
      sctx.fillStyle = '#161b22';
      sctx.fillRect(0, 0, 36, h);

      // Tab bar
      sctx.fillStyle = '#161b22';
      sctx.fillRect(36, 0, w - 36, 24);
      sctx.fillStyle = '#0d1117';
      sctx.fillRect(36, 0, 100, 24);
      sctx.fillStyle = '#e6edf3';
      sctx.font = '11px monospace';
      sctx.fillText('Hero.astro', 44, 16);

      // Code lines (typing animation)
      const maxChars = Math.floor(time / 60);
      let total = 0;
      const lineH = 20;
      const startY = 44;

      for (let i = 0; i < codeLines.length; i++) {
        const y = startY + i * lineH;
        if (y > h - 20) break;

        // Line number
        sctx.fillStyle = '#484f58';
        sctx.font = '11px monospace';
        sctx.fillText(String(i + 1).padStart(2), 42, y);

        let x = 68;
        for (const tok of codeLines[i].tokens) {
          for (let c = 0; c < tok.t.length; c++) {
            if (total >= maxChars) {
              // Blinking cursor
              if (Math.floor(time / 500) % 2 === 0) {
                sctx.fillStyle = '#e86830';
                sctx.fillRect(x, y - 12, 2, 15);
              }
              screenTexture.needsUpdate = true;
              return;
            }
            total++;
          }
          sctx.fillStyle = tok.c;
          sctx.font = '12px monospace';
          sctx.fillText(tok.t, x, y);
          x += sctx.measureText(tok.t).width;
        }
      }

      // Terminal at bottom (after typing is done)
      sctx.fillStyle = '#0d1117';
      sctx.fillRect(36, h - 80, w - 36, 80);
      sctx.fillStyle = '#161b22';
      sctx.fillRect(36, h - 80, w - 36, 18);
      sctx.fillStyle = '#8b949e';
      sctx.font = '10px monospace';
      sctx.fillText('TERMINAL', 44, h - 66);
      sctx.fillStyle = '#d2a8ff';
      sctx.font = '11px monospace';
      sctx.fillText('claude> deploy --prod', 44, h - 46);
      sctx.fillStyle = '#7ee787';
      sctx.fillText('✓ Deployed to smiro.dev', 44, h - 28);

      screenTexture.needsUpdate = true;
    }

    // === Animate ===
    let animId: number;
    const startTime = Date.now();

    function animate() {
      animId = requestAnimationFrame(animate);
      const elapsed = Date.now() - startTime;

      // Gentle floating
      monitorGroup.position.y = 1.6 + Math.sin(elapsed * 0.0008) * 0.02;

      // Subtle breathing on LED
      const pulse = 0.5 + Math.sin(elapsed * 0.003) * 0.5;
      ledMat.emissiveIntensity = 2 + pulse;

      // Draw screen
      drawScreen(elapsed);

      renderer.render(scene, camera);
    }
    animate();

    // === Resize ===
    const ro = new ResizeObserver(() => {
      w = container.clientWidth;
      h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '320px',
        borderRadius: '16px',
        overflow: 'hidden',
      }}
    />
  );
}
