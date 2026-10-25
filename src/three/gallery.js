/* Gallery: photographs of past evenings orbit a lit centrepiece, a brass chandelier over a
   copper deg; setLayout('spiral') lifts the ring into a rising spiral. go(i) turns a picture to
   the front; drag spins and snaps; click opens one. */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { glowTex } from './parts.js';

export function mountGallery(canvas, { items, small = false, onChange, onOpen }) {
  const wrap = canvas.parentElement;
  const N = items.length;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.toneMapping = THREE.NeutralToneMapping;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.18;
  renderer.toneMappingExposure = 1.12;
  // the same evening-room lighting as the home stage: warm key, cool rim behind, low fill
  scene.add(new THREE.HemisphereLight('#fff1ea', '#3a1520', 0.35));
  const key = new THREE.DirectionalLight('#ffe9dc', 2.6);
  key.position.set(2.2, 4, 3);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#ffd6e2', 2.2);
  rim.position.set(-2.5, 1.8, -2.6);
  scene.add(rim);
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);

  // the centrepiece: a tiered brass chandelier with glowing candles, over a copper deg
  const glow = glowTex();
  const piece = new THREE.Group();
  const brass = new THREE.MeshStandardMaterial({ color: '#c4a467', metalness: 0.9, roughness: 0.28 });
  const copper = new THREE.MeshStandardMaterial({ color: '#b5653a', metalness: 0.9, roughness: 0.3 });
  const deg = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.42, 0], [0.56, 0.08], [0.62, 0.3], [0.6, 0.52], [0.5, 0.66], [0, 0.66]].map(([x, y]) => new THREE.Vector2(x, y)), 48), copper);
  deg.position.y = -0.9;
  piece.add(deg);
  const flames = [];
  [[0.95, 8, 0.85], [0.6, 6, 1.35], [0.3, 4, 1.8]].forEach(([r, n, y]) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.03, 10, 64), brass);
    ring.rotation.x = Math.PI / 2; ring.position.y = y;
    piece.add(ring);
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.16, 8), new THREE.MeshBasicMaterial({ color: '#fff1d6' }));
      c.position.set(Math.cos(a) * r, y + 0.1, Math.sin(a) * r);
      piece.add(c);
      flames.push(c.position.clone().setY(y + 0.24));
    }
  });
  [0, 1, 2].forEach((k) => { const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 3, 6), brass); ch.position.set(Math.cos(k * 2.09) * 0.95 * 0.5, 2.4, Math.sin(k * 2.09) * 0.95 * 0.5); ch.rotation.z = Math.cos(k * 2.09) * 0.32; ch.rotation.x = -Math.sin(k * 2.09) * 0.32; piece.add(ch); });
  const fg = new THREE.BufferGeometry().setFromPoints(flames);
  piece.add(new THREE.Points(fg, new THREE.PointsMaterial({ map: glow, size: 0.75, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: '#ffc070' })));
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: '#ff9a40', transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.scale.setScalar(5); halo.position.y = 1.2;
  piece.add(halo);
  const candleLight = new THREE.PointLight('#ffb060', 18, 10, 1.4); candleLight.position.y = 1.2;
  piece.add(candleLight);
  piece.position.y = 0.2;
  scene.add(piece);
  const rose = { group: piece, dispose() { glow.dispose(); } };

  /* ---------- the pictures ---------- */
  const loader = new THREE.TextureLoader();
  const orbit = new THREE.Group();
  scene.add(orbit);
  // rounded-top "arch" frames, like the photos elsewhere on the site
  const W = 0.95, H = 1.27;
  const shape = new THREE.Shape();
  shape.moveTo(-W / 2, -H / 2); shape.lineTo(W / 2, -H / 2); shape.lineTo(W / 2, H / 2 - W / 2);
  shape.absarc(0, H / 2 - W / 2, W / 2, 0, Math.PI, false);
  shape.lineTo(-W / 2, -H / 2);
  const geo = new THREE.ShapeGeometry(shape, 24);
  // map uvs to the 0..1 box so the photo fills the arch
  const uv = geo.attributes.uv, pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + W / 2) / W, (pos.getY(i) + H / 2) / H);
  const cards = items.map((it, k) => {
    const mat = new THREE.MeshBasicMaterial({ color: '#3a141c', transparent: true, side: THREE.DoubleSide, depthWrite: false });
    loader.load(it.src, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      // cover-fit the photo into the arch
      const a = tex.image.width / tex.image.height, frame = W / H;
      if (a > frame) { tex.repeat.set(frame / a, 1); tex.offset.set((1 - frame / a) / 2, 0); }
      else { tex.repeat.set(1, a / frame); tex.offset.set(0, (1 - a / frame) / 2); }
      mat.map = tex; mat.color.set('#ffffff'); mat.needsUpdate = true;
      kick();
    });
    const m = new THREE.Mesh(geo, mat);
    m.userData = { k, pos: new THREE.Vector3() };
    orbit.add(m);
    return m;
  });

  let layout = 'ring', index = 0, angle = 0, angleGoal = 0, lift = 0, liftGoal = 0;
  const step = (Math.PI * 2) / N;
  const R = () => (small ? 2.7 : 3.4);
  const STEP_Y = 0.32;
  function slot(k, out) {
    const a = k * step;
    const y = layout === 'ring' ? -0.05 + Math.sin(k * 1.3) * 0.1 : -1.4 + k * STEP_Y * 0.7;
    const r = layout === 'ring' ? R() : R() * 0.92;
    return out.set(Math.sin(a) * r, y, Math.cos(a) * r);
  }
  const liftFor = () => (layout === 'spiral' ? -(-1.4 + index * STEP_Y * 0.7) - 0.35 : 0);
  cards.forEach((c, k) => { slot(k, c.position); c.userData.pos.copy(c.position); });

  function go(i) {
    const target = ((i % N) + N) % N;
    let delta = target - index;
    if (layout === 'ring') { if (delta > N / 2) delta -= N; if (delta < -N / 2) delta += N; }
    index = target;
    angleGoal += delta * step;
    liftGoal = liftFor();
    onChange?.(index);
    kick();
  }
  function setLayout(l) {
    if (l === layout) return;
    layout = l;
    angle = angleGoal = index * step;
    liftGoal = liftFor();
    cards.forEach((c, k) => slot(k, c.userData.pos));
    kick();
  }

  /* ---------- drag + click ---------- */
  let drag = null;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const onDown = (e) => { drag = { x: e.clientX, a: angleGoal, moved: 0 }; canvas.setPointerCapture?.(e.pointerId); };
  const onMove = (e) => {
    if (!drag) {
      const r = canvas.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      canvas.style.cursor = ray.intersectObjects(cards)[0] ? 'pointer' : 'grab';
      return;
    }
    const dx = e.clientX - drag.x;
    drag.moved = Math.max(drag.moved, Math.abs(dx));
    angleGoal = drag.a - dx * 0.006;
    kick();
  };
  const onUp = (e) => {
    if (!drag) return;
    const wasDrag = drag.moved > 6;
    drag = null;
    if (wasDrag) {
      const k = Math.round(angleGoal / step);
      angleGoal = k * step;
      index = ((k % N) + N) % N;
      liftGoal = liftFor();
      onChange?.(index);
      kick();
      return;
    }
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(cards)[0];
    if (!hit) return;
    const k = hit.object.userData.k;
    if (k === index) onOpen?.(k); else go(k);
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', () => (drag = null));

  function resize() {
    const w = wrap.clientWidth, h = wrap.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.set(0, 2.4, w < 760 ? 11 : 9.4);
    camera.lookAt(0, 0.55, 0);
    camera.updateProjectionMatrix();
    kick();
  }

  /* ---------- loop ---------- */
  let raf = 0, last = performance.now(), visible = true, dead = false, t = 0;
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) kick(); });
  io.observe(wrap);
  const tmp = new THREE.Vector3();
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); // rAF time can predate last
    last = now; t += dt;
    const k = 1 - Math.pow(0.004, dt);
    angle += (angleGoal - angle) * k;
    lift += (liftGoal - lift) * k;
    orbit.rotation.y = -angle;
    orbit.position.y = lift;
    rose.group.rotation.y = t * 0.15;
    cards.forEach((c, i) => {
      c.position.lerp(c.userData.pos, k);
      c.rotation.y = Math.atan2(c.position.x, c.position.z);
      c.getWorldPosition(tmp);
      const front = THREE.MathUtils.clamp((tmp.z + R()) / (2 * R()), 0, 1);
      c.material.opacity = 0.25 + front * 0.75;
      const s = 0.8 + front * 0.2 + (i === index ? 0.2 : 0);
      c.scale.setScalar(c.scale.x + (s - c.scale.x) * k);
      c.renderOrder = Math.round(front * 100);
    });
    if (dead || renderer.getContext().isContextLost()) { raf = 0; return; } // context gone after a page change
    renderer.render(scene, camera);
    if (visible && !document.hidden && !dead) raf = requestAnimationFrame(frame);
    else raf = 0;
  }
  function kick() { if (!raf && !dead) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  const onVis = () => !document.hidden && kick();
  document.addEventListener('visibilitychange', onVis);

  const ro = new ResizeObserver(resize);
  ro.observe(wrap);
  resize();
  frame(performance.now());
  canvas.classList.add('is-ready');

  return {
    go, setLayout,
    next: () => go(index + 1),
    prev: () => go(index - 1),
    dispose() {
      dead = true;
      cancelAnimationFrame(raf);
      io.disconnect(); ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      cards.forEach((c) => { c.material.map?.dispose(); c.material.dispose(); });
      geo.dispose();
      rose.dispose();
      scene.environment?.dispose(); pmrem.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
