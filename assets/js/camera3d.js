// Câmera fotográfica 3D flutuante — Criar Araújo
import * as THREE from './three.module.min.js';
import { RoomEnvironment } from './RoomEnvironment.js';
import { RoundedBoxGeometry } from './RoundedBoxGeometry.js';

const YELLOW = 0xffdd5e;

function canvasTex(w, h, draw, opts = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (opts.srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (opts.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(opts.repeat[0], opts.repeat[1]); }
  t.anisotropy = 8;
  return t;
}

// Textura de couro granulado (bump)
const leatherBump = () => canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) {
    const x = Math.random() * w, y = Math.random() * h, r = 1 + Math.random() * 3.2;
    const v = 90 + Math.random() * 90;
    g.fillStyle = `rgb(${v},${v},${v})`;
    g.beginPath(); g.ellipse(x, y, r, r * (0.6 + Math.random() * 0.6), Math.random() * 3, 0, Math.PI * 2); g.fill();
  }
}, { repeat: [3, 3] });

// Estrias (anel de foco, dials)
const ridges = (n) => canvasTex(1024, 16, (g, w, h) => {
  const step = w / n;
  for (let i = 0; i < n; i++) {
    const grd = g.createLinearGradient(i * step, 0, (i + 1) * step, 0);
    grd.addColorStop(0, '#202020'); grd.addColorStop(0.5, '#f0f0f0'); grd.addColorStop(1, '#202020');
    g.fillStyle = grd; g.fillRect(i * step, 0, step, h);
  }
}, { repeat: [1, 1] });

// Texto gravado no anel frontal da lente
const lensRingText = () => canvasTex(2048, 64, (g, w, h) => {
  g.fillStyle = '#0c0c0c'; g.fillRect(0, 0, w, h);
  g.font = '600 30px Inter, Arial, sans-serif'; g.textBaseline = 'middle';
  g.fillStyle = '#d8d8d2';
  g.fillText('CRIAR ARAÚJO  LENS   35mm   1:1.4   Ø72', 60, h / 2);
  g.fillStyle = '#FFDD5E';
  g.fillText('●  CINEMA', 1180, h / 2);
  g.fillStyle = '#9a9a94';
  g.fillText('ASPHERICAL   ∞ – 0.3m/1ft', 1450, h / 2);
}, { srgb: true });

// Escala de distância no anel de foco
const focusScale = () => canvasTex(2048, 128, (g, w, h) => {
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
}, {});

const brandPlate = () => canvasTex(512, 160, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  g.font = '800 104px Unbounded, Arial Black, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#FFDD5E';
  g.fillText('CRIAR', w / 2, h / 2 + 4);
}, { srgb: true });

const softShadow = () => canvasTex(256, 256, (g, w, h) => {
  const grd = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  grd.addColorStop(0, 'rgba(0,0,0,0.85)');
  grd.addColorStop(0.45, 'rgba(0,0,0,0.35)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
}, {});

function buildCamera() {
  const cam = new THREE.Group();

  const bump = leatherBump();
  const leather = new THREE.MeshPhysicalMaterial({ color: 0x121212, roughness: 0.78, bumpMap: bump, bumpScale: 1.4, clearcoat: 0.15, clearcoatRoughness: 0.6 });
  const plate = new THREE.MeshPhysicalMaterial({ color: 0x1d1d20, metalness: 0.85, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.25 });
  const satin = new THREE.MeshPhysicalMaterial({ color: 0x0d0d0d, metalness: 0.4, roughness: 0.42, clearcoat: 0.4 });
  const chrome = new THREE.MeshPhysicalMaterial({ color: 0xd9d9d9, metalness: 1, roughness: 0.14 });
  const brushed = new THREE.MeshPhysicalMaterial({ color: 0xb8b8b8, metalness: 1, roughness: 0.3 });
  const yellow = new THREE.MeshPhysicalMaterial({ color: YELLOW, metalness: 0.3, roughness: 0.35, clearcoat: 0.8 });
  const rubberTex = ridges(160);
  const rubber = new THREE.MeshPhysicalMaterial({ color: 0x0b0b0b, roughness: 0.9, bumpMap: rubberTex, bumpScale: 3 });
  const knurlTex = ridges(90);
  const knurl = new THREE.MeshPhysicalMaterial({ color: 0x3a3a3c, metalness: 0.9, roughness: 0.35, bumpMap: knurlTex, bumpScale: 2 });

  // Corpo
  const body = new THREE.Mesh(new RoundedBoxGeometry(1.46, 0.86, 0.42, 6, 0.09), leather);
  cam.add(body);
  // Placa superior metálica
  const top = new THREE.Mesh(new RoundedBoxGeometry(1.48, 0.16, 0.45, 5, 0.06), plate);
  top.position.y = 0.39; cam.add(top);
  // Placa inferior
  const bottom = new THREE.Mesh(new RoundedBoxGeometry(1.48, 0.07, 0.44, 4, 0.03), plate);
  bottom.position.y = -0.42; cam.add(bottom);

  // Pentaprisma (corcova do visor)
  const s = new THREE.Shape();
  s.moveTo(-0.3, 0); s.lineTo(0.3, 0); s.lineTo(0.17, 0.27); s.lineTo(-0.17, 0.27); s.closePath();
  const humpGeo = new THREE.ExtrudeGeometry(s, { depth: 0.34, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 6, curveSegments: 8 });
  humpGeo.translate(0, 0, -0.17);
  const hump = new THREE.Mesh(humpGeo, plate);
  hump.position.set(-0.08, 0.45, 0); cam.add(hump);
  // Logo "CRIAR" na frente do prisma
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.106), new THREE.MeshBasicMaterial({ map: brandPlate(), transparent: true, toneMapped: false }));
  logo.position.set(-0.08, 0.58, 0.212); logo.rotation.x = -0.36; cam.add(logo);
  // Sapata de flash
  const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 0.2), brushed);
  shoe.position.set(-0.08, 0.76, 0); cam.add(shoe);

  // Empunhadura
  const grip = new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.84, 0.2, 6, 0.09), leather);
  grip.position.set(0.53, -0.01, 0.24); cam.add(grip);
  // Detalhe amarelo na empunhadura
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.42, 0.012), yellow);
  stripe.position.set(0.37, 0.08, 0.335); cam.add(stripe);

  // Botão disparador
  const shutterRing = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.09, 0.035, 48), knurl);
  shutterRing.position.set(0.52, 0.485, 0.2); cam.add(shutterRing);
  const shutter = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.055, 0.05, 48), chrome);
  shutter.position.set(0.52, 0.51, 0.2); cam.add(shutter);
  cam.userData.shutter = shutter;

  // Dials
  const dial1 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 64), knurl);
  dial1.position.set(-0.5, 0.51, -0.02); cam.add(dial1);
  const dial1cap = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.012, 64), satin);
  dial1cap.position.set(-0.5, 0.556, -0.02); cam.add(dial1cap);
  const dialMark = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.004, 0.07), yellow);
  dialMark.position.set(-0.5, 0.564, 0.03); cam.add(dialMark);
  const dial2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 64), knurl);
  dial2.position.set(0.3, 0.5, -0.06); cam.add(dial2);

  // Alças
  [-0.75, 0.75].forEach((x) => {
    const lug = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.014, 16, 32), brushed);
    lug.position.set(x, 0.3, 0); lug.rotation.y = Math.PI / 2; cam.add(lug);
  });

  // Tela traseira
  const lcd = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 0.52), new THREE.MeshPhysicalMaterial({ color: 0x050608, roughness: 0.05, metalness: 0.2, clearcoat: 1 }));
  lcd.position.set(-0.12, -0.02, -0.212); lcd.rotation.y = Math.PI; cam.add(lcd);
  const eyecup = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.2, 0.1, 4, 0.05), rubber);
  eyecup.position.set(-0.08, 0.55, -0.22); cam.add(eyecup);

  // ---------- Lente ----------
  const lens = new THREE.Group();
  lens.position.set(-0.08, -0.02, 0.21);
  cam.add(lens);
  const cyl = (r1, r2, len, mat, z, seg = 96, open = true) => {
    const g = new THREE.CylinderGeometry(r1, r2, len, seg, 1, open);
    g.rotateX(Math.PI / 2);
    const m = new THREE.Mesh(g, mat); m.position.z = z + len / 2; lens.add(m); return m;
  };
  cyl(0.37, 0.37, 0.04, chrome, 0, 96, false);      // baioneta
  cyl(0.34, 0.345, 0.12, satin, 0.04);              // tambor traseiro
  cyl(0.35, 0.35, 0.012, yellow, 0.16);             // anel amarelo
  const focus = cyl(0.365, 0.365, 0.2, rubber, 0.172); // anel de foco emborrachado
  rubberTex.repeat.set(1, 1);
  cyl(0.345, 0.345, 0.06, satin, 0.372);            // tambor
  cyl(0.338, 0.355, 0.1, satin, 0.432);             // alargamento frontal
  const ringMat = new THREE.MeshPhysicalMaterial({ map: lensRingText(), roughness: 0.4, metalness: 0.3, clearcoat: 0.5 });
  // anel frontal com texto: usa um cilindro curto em vez do disco
  const frontLip = cyl(0.356, 0.356, 0.03, ringMat, 0.532);
  // face frontal (disco preto)
  const face = new THREE.Mesh(new THREE.RingGeometry(0.27, 0.356, 128), satin);
  face.position.z = 0.562; lens.add(face);
  // degraus entre os anéis
  [[0.16,0.345,0.35],[0.172,0.35,0.365],[0.372,0.345,0.365],[0.432,0.338,0.345]].forEach(([z,a,b]) => { const r = new THREE.Mesh(new THREE.RingGeometry(Math.min(a,b), Math.max(a,b), 96), satin); r.position.z = z; lens.add(r); });
  // interior escuro
  const inner = cyl(0.27, 0.27, 0.16, new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.9, side: THREE.BackSide }), 0.4, 96, true);
  // anéis internos
  [0.47, 0.5].forEach((z, i) => {
    const r = new THREE.Mesh(new THREE.RingGeometry(0.2 + i * 0.03, 0.27, 96), new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.6, metalness: 0.5 }));
    r.position.z = z; lens.add(r);
  });
  // vidro frontal com coating (reflexos iridescentes)
  const glassGeo = new THREE.SphereGeometry(0.55, 96, 48, 0, Math.PI * 2, 0, 0.51);
  glassGeo.rotateX(Math.PI / 2);
  const glass = new THREE.Mesh(glassGeo, new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.02, transmission: 1, thickness: 0.25, ior: 1.52,
    clearcoat: 1, clearcoatRoughness: 0.03, iridescence: 0.7, iridescenceIOR: 1.45, iridescenceThicknessRange: [260, 520],
    envMapIntensity: 0.55, attenuationColor: new THREE.Color(0x24305a), attenuationDistance: 0.5, transparent: true
  }));
  glass.position.z = 0.565 - 0.55; lens.add(glass);
  // diafragma (lâminas) no fundo da lente
  const irisMat = new THREE.MeshStandardMaterial({ color: 0x0c0c0e, metalness: 0.7, roughness: 0.35 });
  for (let k = 0; k < 9; k++) {
    const blade = new THREE.Mesh(new THREE.RingGeometry(0.06, 0.27, 24, 1, 0, Math.PI / 4.2), irisMat);
    blade.rotation.z = (k / 9) * Math.PI * 2; blade.position.z = 0.405 + k * 0.0006; lens.add(blade);
  }
  const iris = new THREE.Mesh(new THREE.CircleGeometry(0.065, 48), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  iris.position.z = 0.4; lens.add(iris);
  // elemento interno (reflexo azul/violeta)
  const elemGeo = new THREE.SphereGeometry(0.3, 64, 32, 0, Math.PI * 2, 0, 0.7);
  elemGeo.rotateX(Math.PI / 2);
  const elem = new THREE.Mesh(elemGeo, new THREE.MeshPhysicalMaterial({ color: 0x0a1030, roughness: 0.04, metalness: 0.2, clearcoat: 1, iridescence: 1, iridescenceIOR: 1.9, iridescenceThicknessRange: [300, 700], envMapIntensity: 0.9, transparent: true, opacity: 0.85 }));
  elem.position.z = 0.17; lens.add(elem);

  cam.userData.focus = focus;
  // inclinação levemente "heroica"
  return cam;
}

export function initCamera3D({ canvas, stage, onOpen }) {
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    canvas.style.display = 'none';
    return { play: () => onOpen() };
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 50);
  const camHome = new THREE.Vector3(0, 0.15, 4.6);
  camera.position.copy(camHome);

  // Luzes
  const key = new THREE.DirectionalLight(0xfff3e0, 2.2); key.position.set(-3, 4, 4); scene.add(key);
  const rim = new THREE.PointLight(YELLOW, 18, 8, 2); rim.position.set(2.2, 1.2, -1.8); scene.add(rim);
  const fill = new THREE.PointLight(0x8fb4ff, 4, 8, 2); fill.position.set(-2.5, -0.8, 1.5); scene.add(fill);

  const model = buildCamera();
  const rig = new THREE.Group(); rig.add(model); scene.add(rig);

  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.1), new THREE.MeshBasicMaterial({ map: softShadow(), transparent: true, depthWrite: false, opacity: 0.7 }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -0.95; scene.add(shadow);

  // Partículas de poeira na luz
  const dustGeo = new THREE.BufferGeometry();
  const N = 140, pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - 0.5) * 5; pos[i * 3 + 1] = (Math.random() - 0.5) * 3; pos[i * 3 + 2] = (Math.random() - 0.5) * 2 - 0.5; }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: YELLOW, size: 0.012, transparent: true, opacity: 0.55, depthWrite: false }));
  scene.add(dust);

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // em telas estreitas, afasta a câmera para caber
    camHome.z = w < 560 ? 5.2 : 4.6;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  // Mouse / toque: leve parallax
  const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
  stage.addEventListener('pointermove', (e) => {
    const r = stage.getBoundingClientRect();
    target.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
    target.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
  });
  stage.addEventListener('pointerleave', () => { target.x = 0; target.y = 0; });

  let visible = true, raf = 0, running = true;
  const io = new IntersectionObserver((ents) => { visible = ents[0].isIntersecting; if (visible && running && !raf) loop(); }, { threshold: 0 });
  io.observe(stage);

  const clock = new THREE.Clock();
  let playT = -1; // >=0 durante a animação do play
  const PLAY_DUR = 1.6;
  const easeInOut = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  let opened = false;

  function loop() {
    raf = 0;
    if (!running || !visible) return;
    const t = clock.getElapsedTime();
    cur.x += (target.x - cur.x) * 0.05; cur.y += (target.y - cur.y) * 0.05;

    if (playT < 0) {
      const bob = reduce ? 0 : Math.sin(t * 1.1) * 0.07;
      rig.position.y = bob;
      rig.rotation.y = -0.62 + (reduce ? 0 : Math.sin(t * 0.35) * 0.32) + cur.x * 0.35;
      rig.rotation.x = 0.16 + (reduce ? 0 : Math.sin(t * 0.6) * 0.04) + cur.y * 0.15;
      rig.rotation.z = reduce ? 0 : Math.sin(t * 0.5) * 0.03;
      model.userData.focus.rotation.z = Math.sin(t * 0.4) * 0.6;
      shadow.material.opacity = 0.62 - bob * 1.6;
      shadow.scale.setScalar(1 - bob * 0.6);
      camera.position.lerp(camHome, 0.1);
    } else {
      // Animação: vira a lente para o espectador e "mergulha" nela
      const p = Math.min(1, (performance.now() - playStart) / (PLAY_DUR * 1000));
      const e = easeInOut(p);
      rig.rotation.y = THREE.MathUtils.lerp(startRot.y, 0, Math.min(1, e * 1.6));
      rig.rotation.x = THREE.MathUtils.lerp(startRot.x, 0, Math.min(1, e * 1.6));
      rig.rotation.z = THREE.MathUtils.lerp(startRot.z, 0, Math.min(1, e * 1.6));
      rig.position.y = THREE.MathUtils.lerp(startPosY, 0.02, e);
      const sp = model.userData.shutter; sp.position.y = 0.51 - (p > 0.08 && p < 0.22 ? 0.018 : 0);
      model.userData.focus.rotation.z += 0.08;
      const lensZ = 0.78; // frente da lente no espaço do modelo
      camera.position.set(THREE.MathUtils.lerp(camHome.x, -0.08, e), THREE.MathUtils.lerp(camHome.y, 0.0, e), THREE.MathUtils.lerp(camHome.z, lensZ + 0.12, Math.pow(e, 1.6)));
      camera.lookAt(-0.08 * e, 0, 0);
      if (p >= 1 && !opened) { opened = true; onOpen(); }
    }
    dust.rotation.y = t * 0.02;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  }
  let playStart = 0; const startRot = { x: 0, y: 0, z: 0 }; let startPosY = 0;
  loop();

  return {
    play() {
      if (playT >= 0) return;
      if (reduce) { opened = true; onOpen(); return; }
      playT = 0; playStart = performance.now();
      startRot.x = rig.rotation.x; startRot.y = rig.rotation.y; startRot.z = rig.rotation.z; startPosY = rig.position.y;
    },
    stop() { running = false; cancelAnimationFrame(raf); io.disconnect(); },
  };
}
