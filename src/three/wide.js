/* Events: one wide venue you drag across sideways. Three setups stand side by side, each with its
   own lighting: a wedding stage under fairy lights, a corporate dinner at long candlelit tables,
   and a birthday with a balloon arch and a cake table. go(i) glides to one. */

import * as THREE from 'three';
import { makeStrings, makeTables, makeStage, glowTex, qanatTex, carpetTex } from './parts.js';

const SPAN = 22;

function balloonArch(colors) {
  const g = new THREE.Group();
  const geo = new THREE.SphereGeometry(0.24, 16, 12);
  const mats = colors.map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.35, metalness: 0.1 }));
  for (let i = 0; i < 90; i++) {
    const t = i / 89, a = Math.PI * t, r = 2.6 + (Math.random() - 0.5) * 0.25;
    const b = new THREE.Mesh(geo, mats[i % mats.length]);
    b.position.set(Math.cos(a) * r, 0.4 + Math.sin(a) * 3.2 + (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.4);
    b.scale.setScalar(0.8 + Math.random() * 0.5);
    g.add(b);
  }
  return g;
}

export function mountWide(canvas, { small = false, onChange } = {}) {
  const wrap = canvas.parentElement;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#06120f');
  scene.fog = new THREE.Fog('#06120f', 14, 34);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  const glow = glowTex();
  scene.add(new THREE.HemisphereLight('#ffd6b0', '#10302a', 0.35));

  // one long hall: carpet and a printed back wall
  const W = SPAN * 3 + 8;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, 16), new THREE.MeshStandardMaterial({ map: carpetTex([W / 2, 8]), roughness: 1 }));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(W, 7), new THREE.MeshStandardMaterial({ map: qanatTex([W / 2.4, 1]), roughness: 0.95 }));
  back.position.set(0, 3.5, -6);
  scene.add(back);

  const zones = [];
  /* 1 · wedding: floral stage, round tables, fairy lights, warm amber */
  {
    const x = -SPAN;
    const stage = makeStage(7.5);
    stage.group.position.set(x, 0, -4.4);
    scene.add(stage.group);
    const t = makeTables(12, { dish: ['#d08a2e', '#6a2c18', '#e9d9a8'], glow, pixel: renderer.getPixelRatio() });
    t.setSlots([[-4, 0.5], [0, 0.5], [4, 0.5], [-6, 3.4], [-2, 3.4], [2, 3.4], [6, 3.4]].map(([a, b]) => [x + a, b]));
    t.setAll(1); t.step(0, true);
    scene.add(t.group);
    const list = [];
    for (let r = 0; r < 6; r++) list.push({ a: new THREE.Vector3(x - 9, 5.4, -5 + r * 1.8), b: new THREE.Vector3(x + 9, 5.4, -5 + r * 1.8), sag: 0.7 });
    const s = makeStrings(list, glow); s.set(list.map(() => 1)); s.uniforms.uPixel.value = renderer.getPixelRatio();
    scene.add(s.group);
    const l1 = new THREE.PointLight('#ffb46a', 40, 18, 1.2); l1.position.set(x, 5, 1);
    const l2 = new THREE.SpotLight('#ffe2b0', 120, 16, 0.5, 0.7, 1.2); l2.position.set(x, 8, 4); l2.target.position.set(x, 1, -4);
    scene.add(l1, l2, l2.target);
    zones.push({ x, strings: s, halos: t.haloU });
  }
  /* 2 · corporate: long tables, candles, cool white with gold accents, a podium */
  {
    const x = 0;
    const cloth = new THREE.MeshStandardMaterial({ color: '#f2efe8', roughness: 0.85 });
    const chairMat = new THREE.MeshStandardMaterial({ color: '#d9c7a0', roughness: 0.6 });
    const seatGeo = new THREE.BoxGeometry(0.44, 0.06, 0.44), backGeo = new THREE.BoxGeometry(0.44, 0.5, 0.05);
    const candleMat = new THREE.MeshBasicMaterial({ color: '#ffd9a0' });
    const halos = [];
    [-2.4, 1.2].forEach((z) => {
      const top = new THREE.Mesh(new THREE.BoxGeometry(11, 0.06, 1.3), cloth); top.position.set(x, 0.76, z); scene.add(top);
      const skirt = new THREE.Mesh(new THREE.BoxGeometry(11, 0.72, 1.25), cloth); skirt.position.set(x, 0.38, z); scene.add(skirt);
      for (let k = 0; k < 10; k++) {
        const cx = x - 4.9 + k * 1.09;
        [-1, 1].forEach((side) => { const seat = new THREE.Mesh(seatGeo, chairMat); seat.position.set(cx, 0.46, z + side * 0.95); const bk = new THREE.Mesh(backGeo, chairMat); bk.position.set(cx, 0.74, z + side * 1.15); scene.add(seat, bk); });
        if (k % 2 === 0) { const cd = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 8), candleMat); cd.position.set(cx + 0.5, 0.9, z); scene.add(cd); halos.push([cx + 0.5, 1.02, z]); }
      }
    });
    const hg = new THREE.BufferGeometry(); hg.setAttribute('position', new THREE.Float32BufferAttribute(halos.flat(), 3));
    const hm = new THREE.Points(hg, new THREE.PointsMaterial({ map: glow, size: 0.9, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: '#ffc880' }));
    scene.add(hm);
    const podium = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 0.6), new THREE.MeshStandardMaterial({ color: '#2a1a12', roughness: 0.4 }));
    podium.position.set(x + 4.6, 0.6, -4.6); scene.add(podium);
    const sc = document.createElement('canvas'); sc.width = 840; sc.height = 480;
    const sg = sc.getContext('2d'); sg.fillStyle = '#0c1f1c'; sg.fillRect(0, 0, 840, 480); sg.strokeStyle = '#c4a467'; sg.lineWidth = 4; sg.strokeRect(24, 24, 792, 432);
    sg.fillStyle = '#e0c890'; sg.font = '64px Georgia, serif'; sg.textAlign = 'center'; sg.fillText('Annual Dinner 2026', 420, 230); sg.font = '28px Georgia, serif'; sg.fillStyle = '#c4a467'; sg.fillText('with thanks to our teams', 420, 290);
    const stex = new THREE.CanvasTexture(sc); stex.colorSpace = THREE.SRGBColorSpace;
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.4), new THREE.MeshBasicMaterial({ map: stex }));
    screen.position.set(x - 1, 3.4, -5.9); scene.add(screen);
    const l = new THREE.SpotLight('#fff4e6', 90, 18, 0.7, 0.8, 1.2); l.position.set(x, 9, 3); l.target.position.set(x, 0, -1);
    const lc = new THREE.PointLight('#ffb070', 14, 10); lc.position.set(x, 2, 0);
    scene.add(l, l.target, lc);
    zones.push({ x });
  }
  /* 3 · birthday: balloon arch, cake table, playful pink and gold */
  {
    const x = SPAN;
    const arch = balloonArch(['#f2a7b5', '#ffffff', '#e0c890', '#f6d3da']);
    arch.position.set(x, 0, -4.6); scene.add(arch);
    const cakeT = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.9, 32), new THREE.MeshStandardMaterial({ color: '#f6eee6', roughness: 0.7 }));
    cakeT.position.set(x, 0.45, -3.6); scene.add(cakeT);
    [0.5, 0.38, 0.26].forEach((r, k) => { const tier = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.3, 32), new THREE.MeshStandardMaterial({ color: k % 2 ? '#f2a7b5' : '#ffffff', roughness: 0.5 })); tier.position.set(x, 1.05 + k * 0.3, -3.6); scene.add(tier); });
    const t = makeTables(6, { chairsPer: 6, dish: ['#f2c14a', '#c94a2a', '#f6eee6'], glow, pixel: renderer.getPixelRatio() });
    t.setSlots([[-3.6, 0.8], [0, 1.6], [3.6, 0.8], [-1.8, 4], [1.8, 4]].map(([a, b]) => [x + a, b]));
    t.setAll(1); t.step(0, true);
    scene.add(t.group);
    const l = new THREE.PointLight('#ffc0d0', 50, 16, 1.2); l.position.set(x, 5, 1);
    const l2 = new THREE.SpotLight('#fff0f4', 80, 14, 0.6, 0.8, 1.2); l2.position.set(x, 8, 3); l2.target.position.set(x, 1, -4);
    scene.add(l, l2, l2.target);
    zones.push({ x, halos: t.haloU });
  }

  /* ---------- the drag ---------- */
  let camX = zones[0].x, goalX = zones[0].x, index = 0, drag = null;
  const minX = zones[0].x - 3, maxX = zones[2].x + 3;
  const nearest = (x) => zones.reduce((b, z, i) => (Math.abs(z.x - x) < Math.abs(zones[b].x - x) ? i : b), 0);
  function go(i) { index = i; goalX = zones[i].x; onChange?.(i); kick(); }
  const onDown = (e) => { drag = { x: e.clientX, g: goalX }; canvas.setPointerCapture?.(e.pointerId); wrap.classList.add('is-dragged'); };
  const onMove = (e) => {
    if (!drag) return;
    goalX = Math.max(minX, Math.min(maxX, drag.g - (e.clientX - drag.x) * (SPAN / Math.max(400, wrap.clientWidth)) * 1.6));
    const n = nearest(goalX);
    if (n !== index) { index = n; onChange?.(n); }
    kick();
  };
  const onUp = () => { if (!drag) return; drag = null; go(nearest(goalX)); };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);

  function layout() {
    const w = wrap.clientWidth, h = wrap.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 1 ? 62 : 42;
    camera.updateProjectionMatrix();
    kick();
  }

  let raf = 0, last = performance.now(), visible = true, dead = false, t = 0;
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) kick(); });
  io.observe(wrap);
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); // rAF time can predate last
    last = now; t += dt;
    zones[0].strings.uniforms.uTime.value = t;
    zones.forEach((z) => z.halos && (z.halos.uTime.value = t));
    camX += (goalX - camX) * (1 - Math.pow(0.003, dt));
    const far = camera.aspect < 1 ? 17 : 13;
    camera.position.set(camX, 3.6, far);
    camera.lookAt(camX, 1.6, -2);
    if (dead || renderer.getContext().isContextLost()) { raf = 0; return; } // context gone after a page change
    renderer.render(scene, camera);
    if (visible && !document.hidden && !dead) raf = requestAnimationFrame(frame);
    else raf = 0;
  }
  function kick() { if (!raf && !dead) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  const onVis = () => !document.hidden && kick();
  document.addEventListener('visibilitychange', onVis);
  const ro = new ResizeObserver(layout);
  ro.observe(wrap);
  layout();
  frame(performance.now());
  canvas.classList.add('is-ready');

  return {
    go,
    dispose() {
      dead = true;
      cancelAnimationFrame(raf);
      io.disconnect(); ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      scene.traverse((o) => { o.geometry?.dispose(); [].concat(o.material || []).forEach((m) => { m.map?.dispose(); m.dispose?.(); }); });
      glow.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
