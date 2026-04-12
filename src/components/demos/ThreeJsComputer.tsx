import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Three.js + MeshToonMaterial — Pixar/Anime style 3D computer
 * Cel-shaded, with outline effect and soft lighting
 */
export default function ThreeJsComputer() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const w = container.clientWidth;
    const h = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f0e0c);

    // Camera
    const camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 100);
    camera.position.set(3, 2.5, 5);
    camera.lookAt(0, 0.5, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Toon gradient texture
    const toonGradient = new THREE.DataTexture(
      new Uint8Array([40, 80, 140, 200, 255]),
      5, 1, THREE.RedFormat
    );
    toonGradient.minFilter = THREE.NearestFilter;
    toonGradient.magFilter = THREE.NearestFilter;
    toonGradient.needsUpdate = true;

    // Materials
    const matBody = new THREE.MeshToonMaterial({
      color: 0x2a2a2e,
      gradientMap: toonGradient,
    });
    const matScreen = new THREE.MeshStandardMaterial({
      color: 0x0d1117,
      emissive: 0x0a3060,
      emissiveIntensity: 0.3,
    });
    const matBezel = new THREE.MeshToonMaterial({
      color: 0x111115,
      gradientMap: toonGradient,
    });
    const matDesk = new THREE.MeshToonMaterial({
      color: 0x3a3228,
      gradientMap: toonGradient,
    });
    const matStand = new THREE.MeshToonMaterial({
      color: 0x1a1a1e,
      gradientMap: toonGradient,
    });
    const matKeyboard = new THREE.MeshToonMaterial({
      color: 0x222226,
      gradientMap: toonGradient,
    });
    const matKeycap = new THREE.MeshToonMaterial({
      color: 0x333338,
      gradientMap: toonGradient,
    });
    const matAccent = new THREE.MeshToonMaterial({
      color: 0x5eead4,
      gradientMap: toonGradient,
    });
    const matLed = new THREE.MeshStandardMaterial({
      color: 0x5eead4,
      emissive: 0x5eead4,
      emissiveIntensity: 2,
    });

    // ===== Monitor =====
    // Body
    const monitorBody = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 1.6, 0.12),
      matBody
    );
    monitorBody.position.set(0, 1.5, 0);
    monitorBody.castShadow = true;
    scene.add(monitorBody);

    // Bezel (slightly smaller, in front)
    const bezel = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 1.5, 0.01),
      matBezel
    );
    bezel.position.set(0, 1.5, 0.065);
    scene.add(bezel);

    // Screen
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(2.3, 1.3),
      matScreen
    );
    screen.position.set(0, 1.5, 0.072);
    scene.add(screen);

    // Screen content texture (code lines)
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 512;
    screenCanvas.height = 256;
    const sctx = screenCanvas.getContext('2d')!;
    const screenTexture = new THREE.CanvasTexture(screenCanvas);

    function drawScreenContent(time: number) {
      sctx.fillStyle = '#0d1117';
      sctx.fillRect(0, 0, 512, 256);
      // Activity bar
      sctx.fillStyle = '#161b22';
      sctx.fillRect(0, 0, 30, 256);
      // Tab bar
      sctx.fillStyle = '#161b22';
      sctx.fillRect(30, 0, 482, 18);
      sctx.fillStyle = '#0d1117';
      sctx.fillRect(30, 0, 80, 18);
      // Code lines
      const codeColors = ['#ff7b72', '#79c0ff', '#a5d6ff', '#c9d1d9', '#7ee787', '#d2a8ff', '#ffa657'];
      const lineHeight = 14;
      const numLines = Math.floor(time / 200) % 30;
      for (let i = 0; i < Math.min(numLines, 16); i++) {
        const y = 28 + i * lineHeight;
        // Line number
        sctx.fillStyle = '#484f58';
        sctx.font = '10px monospace';
        sctx.fillText(String(i + 1), 38, y);
        // Code "line" (colored blocks)
        const indent = (Math.sin(i * 1.5) > 0 ? 20 : 0) + 10;
        const segCount = 2 + Math.floor(Math.random() * 3);
        let x = 60 + indent;
        for (let j = 0; j < segCount; j++) {
          const w = 20 + Math.random() * 50;
          sctx.fillStyle = codeColors[(i + j) % codeColors.length];
          sctx.globalAlpha = 0.8;
          sctx.fillRect(x, y - 8, w, 9);
          sctx.globalAlpha = 1;
          x += w + 6;
        }
      }
      // Cursor blink
      if (Math.floor(time / 500) % 2 === 0 && numLines > 0) {
        const y = 28 + (Math.min(numLines, 16) - 1) * lineHeight;
        sctx.fillStyle = '#5eead4';
        sctx.fillRect(70 + 60, y - 8, 2, 10);
      }
      // Terminal
      sctx.fillStyle = '#0d1117';
      sctx.fillRect(30, 200, 482, 56);
      sctx.fillStyle = '#1e2530';
      sctx.fillRect(30, 200, 482, 14);
      sctx.fillStyle = '#8b949e';
      sctx.font = '9px monospace';
      sctx.fillText('TERMINAL', 36, 210);
      sctx.fillStyle = '#7ee787';
      sctx.font = '9px monospace';
      sctx.fillText('$ claude code --build', 36, 228);
      sctx.fillStyle = '#8b949e';
      sctx.fillText('Building...', 36, 242);
      screenTexture.needsUpdate = true;
    }

    const screenMat = new THREE.MeshBasicMaterial({ map: screenTexture });
    screen.material = screenMat;

    // Screen glow
    const glowLight = new THREE.PointLight(0x5eead4, 0.5, 4);
    glowLight.position.set(0, 1.5, 0.5);
    scene.add(glowLight);

    // ===== Stand =====
    const standNeck = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.6, 0.15),
      matStand
    );
    standNeck.position.set(0, 0.45, 0);
    standNeck.castShadow = true;
    scene.add(standNeck);

    const standBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.55, 0.06, 32),
      matStand
    );
    standBase.position.set(0, 0.13, 0);
    standBase.castShadow = true;
    scene.add(standBase);

    // ===== Keyboard =====
    const keyboard = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.06, 0.6),
      matKeyboard
    );
    keyboard.position.set(0, 0.13, 1.2);
    keyboard.castShadow = true;
    scene.add(keyboard);

    // Keycaps (rows of small boxes)
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 12; col++) {
        const keycap = new THREE.Mesh(
          new THREE.BoxGeometry(0.11, 0.04, 0.1),
          col === 6 && row === 0 ? matAccent : matKeycap
        );
        keycap.position.set(
          -0.72 + col * 0.13,
          0.18,
          0.98 + row * 0.13
        );
        scene.add(keycap);
      }
    }

    // LED strip under monitor
    const ledGeom = new THREE.BoxGeometry(2.2, 0.02, 0.02);
    const ledMat = new THREE.MeshStandardMaterial({
      color: 0x5eead4,
      emissive: 0x5eead4,
      emissiveIntensity: 3,
    });
    const ledStrip = new THREE.Mesh(ledGeom, ledMat);
    ledStrip.position.set(0, 0.7, 0.07);
    scene.add(ledStrip);

    // Power LED
    const powerLed = new THREE.Mesh(
      new THREE.SphereGeometry(0.02, 16, 16),
      matLed
    );
    powerLed.position.set(0, 0.72, 0.07);
    scene.add(powerLed);

    // ===== Desk =====
    const desk = new THREE.Mesh(
      new THREE.BoxGeometry(5, 0.12, 3),
      matDesk
    );
    desk.position.set(0, 0.04, 0.8);
    desk.receiveShadow = true;
    scene.add(desk);

    // ===== Mouse =====
    const mouse = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.08, 0.12, 8, 16),
      matBody
    );
    mouse.position.set(1.4, 0.16, 1.3);
    mouse.rotation.x = -Math.PI / 2;
    mouse.castShadow = true;
    scene.add(mouse);

    // ===== Lights =====
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffeedd, 1.2);
    keyLight.position.set(3, 5, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.far = 20;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3);
    fillLight.position.set(-3, 3, -2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x5eead4, 0.4);
    rimLight.position.set(-2, 2, 4);
    scene.add(rimLight);

    // ===== Outline effect via edge rendering =====
    // We'll use a second pass with slightly larger geometry
    const outlineMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      side: THREE.BackSide,
    });

    [monitorBody, standNeck, keyboard].forEach((mesh) => {
      const outline = new THREE.Mesh(mesh.geometry.clone(), outlineMat);
      outline.position.copy(mesh.position);
      outline.rotation.copy(mesh.rotation);
      outline.scale.multiplyScalar(1.04);
      scene.add(outline);
    });

    // ===== Animate =====
    let animId: number;
    let startTime = Date.now();

    function animate() {
      animId = requestAnimationFrame(animate);
      const elapsed = Date.now() - startTime;

      // Gentle floating
      monitorBody.position.y = 1.5 + Math.sin(elapsed * 0.001) * 0.015;
      bezel.position.y = monitorBody.position.y;
      screen.position.y = monitorBody.position.y;

      // Slow rotation
      const rotY = Math.sin(elapsed * 0.0003) * 0.08 - 0.05;
      camera.position.x = 3 * Math.cos(rotY + 0.6);
      camera.position.z = 5 * Math.cos(rotY * 0.5);
      camera.lookAt(0, 0.8, 0);

      // Screen content
      drawScreenContent(elapsed);

      // LED color shift
      const hue = (elapsed * 0.0002) % 1;
      const ledColor = new THREE.Color().setHSL(hue, 0.8, 0.6);
      ledMat.color.copy(ledColor);
      ledMat.emissive.copy(ledColor);
      glowLight.color.copy(ledColor);

      renderer.render(scene, camera);
    }
    animate();

    // Resize
    const ro = new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100%', height: '100%', minHeight: '350px' }} />;
}
