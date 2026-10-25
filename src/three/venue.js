/* The marquee. On Home, setProgress(p) runs the evening: an empty shamiana at dusk, its tables
   already clothed; fairy lights switch on string by string, the chandeliers and uplights warm up,
   the tables are dressed from the stage outward and the degs begin to steam, until it is a full
   celebration at night. On Get a Quote, setGuests(n) grows the hall and fills it with that many
   tables and chairs, and setTier() changes the dishes on the tables.
   Kept light for smooth scrolling: no real-time shadows, Lambert/Phong materials, three lights. */

import * as THREE from 'three';
import { makeSky, makeMarquee, makeStrings, makeTables, tableGrid, makeDegs, makeStage, warmLights, glowTex, smooth } from './parts.js';

const W = 18, MAXD = 50;
const C = {
  hemiDusk: new THREE.Color('#ffd9b8'), hemiNight: new THREE.Color('#ffc89a'),
  groundDusk: new THREE.Color('#6a5a48'), groundNight: new THREE.Color('#4a3624'),
  fogDusk: new THREE.Color('#b88a72'), fogNight: new THREE.Color('#06100e'),
};

export function mountVenue(canvas, { mode = 'home', small = false, guests = 300, dish } = {}) {
  const wrap = canvas.parentElement;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !small, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const px = renderer.getPixelRatio();
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 300);
  const glow = glowTex();

  const { sky, uniforms: skyU } = makeSky();
  scene.add(sky);
  scene.fog = new THREE.Fog('#b88a72', 30, 110);
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshLambertMaterial({ color: '#5d6e45' }));
  lawn.rotation.x = -Math.PI / 2;
  scene.add(lawn);

  // the light of the evening: sky fill and a low dusk sun (no shadows), then the hall's own lamps
  const hemi = new THREE.HemisphereLight('#ffd9b8', '#1f2a22', 1.2);
  const sun = new THREE.DirectionalLight('#ffa66a', 1.8);
  sun.position.set(-30, 10, 26);
  scene.add(hemi, sun);

  /* ---------- the hall, sized to the guests ---------- */
  let D = 0, hall = null, strings = null, lamps = [], slots = [];
  const stage = makeStage(7.5);
  const degs = makeDegs(5, glow);
  degs.steamU.uPixel.value = px;
  scene.add(stage.group, degs.group);
  // a buffet counter for the degs, along the back wall beside the stage
  const counter = new THREE.Mesh(new THREE.BoxGeometry(5, 0.8, 1.0), new THREE.MeshLambertMaterial({ color: '#efe5d2' }));
  const counterTop = new THREE.Mesh(new THREE.BoxGeometry(5.04, 0.04, 1.04), new THREE.MeshPhongMaterial({ color: '#c4a467', specular: '#6a5228', shininess: 40 }));
  scene.add(counter, counterTop);

  const tables = makeTables(110, { dish, glow, always: mode === 'home', pixel: px });
  scene.add(tables.group);

  function buildHall(depth) {
    if (Math.abs(depth - D) < 0.01) return;
    D = depth;
    if (hall) { scene.remove(hall.group); hall.group.traverse((o) => { o.geometry?.dispose(); [].concat(o.material || []).forEach((mm) => { mm.map?.dispose(); mm.dispose?.(); }); }); }
    if (strings) { scene.remove(strings.group); strings.group.traverse((o) => { o.geometry?.dispose(); o.material?.dispose?.(); }); }
    lamps.forEach((l) => scene.remove(l));
    hall = makeMarquee(W, D, 4.2, { glow, pixel: px });
    // the quote view looks down into the hall, so the canopy comes off (a cutaway)
    if (mode === 'quote') hall.group.children.filter((o) => o.name === 'roof' || o.name === 'valance').forEach((o) => (o.visible = false));
    scene.add(hall.group);
    stage.group.position.set(0, 0, -D / 2 + 2);
    counter.position.set(6.4, 0.4, -D / 2 + 1.3);
    counterTop.position.set(6.4, 0.82, -D / 2 + 1.3);
    degs.degs.forEach((d, i) => { d.g.position.set(4.6 + i * 0.9, 0.84, -D / 2 + 1.3); d.g.scale.setScalar(0.85); degs.steamU.uOrigin.value[i].copy(d.g.position); });
    // fairy-light strings: across the hall under the canopy, from the stage to the entrance
    const rows = Math.max(6, Math.round(D / 2.8));
    const list = [];
    for (let r = 0; r < rows; r++) {
      const z = -D / 2 + 1 + (r / (rows - 1)) * (D - 2);
      list.push({ a: new THREE.Vector3(-W / 2 + 0.1, hall.H - 0.1, z), b: new THREE.Vector3(0, hall.H + 1.3, z), sag: 0.4 });
      list.push({ a: new THREE.Vector3(0, hall.H + 1.3, z + 0.4), b: new THREE.Vector3(W / 2 - 0.1, hall.H - 0.1, z + 0.4), sag: 0.4 });
    }
    strings = makeStrings(list, glow);
    strings.uniforms.uPixel.value = px;
    scene.add(strings.group);
    // three lamps: over the stage, mid-hall, and near the entrance
    lamps = warmLights([[0, 4.4, -D / 2 + 3.5], [0, 4.8, -D / 2 + D * 0.45], [0, 4.8, D / 2 - 4]]);
    lamps.forEach((l) => scene.add(l));
    slots = tableGrid(W, D / 2 - 1.4, -D / 2 + 5.4);
    tables.setSlots(slots);
    applyState(true);
  }

  /* ---------- state ---------- */
  let progress = mode === 'home' ? 0 : 1, want = guests, levels = [], first = true;
  const camGoal = { pos: new THREE.Vector3(), look: new THREE.Vector3() };
  const cam = { pos: new THREE.Vector3(), look: new THREE.Vector3() };
  function applyState(snap = false) {
    const p = progress;
    const night = mode === 'home' ? smooth(0.05, 0.85, p) : 1;
    skyU.uNight.value = night;
    hemi.intensity = 1.2 - night * 0.6;
    hemi.color.copy(C.hemiDusk).lerp(C.hemiNight, night);
    hemi.groundColor.copy(C.groundDusk).lerp(C.groundNight, night);
    sun.intensity = 1.8 * (1 - smooth(0.1, 0.7, p));
    scene.fog.color.copy(C.fogDusk).lerp(C.fogNight, night);
    renderer.toneMappingExposure = 1.05 + night * 0.2;
    // strings on one by one
    const n = strings.count;
    levels.length = n;
    for (let i = 0; i < n; i++) levels[i] = mode === 'home' ? smooth(0.12 + (i / n) * 0.34, 0.16 + (i / n) * 0.34, p) : 1;
    strings.set(levels);
    const lit = mode === 'home' ? smooth(0.14, 0.5, p) : 1;
    lamps.forEach((l, i) => (l.intensity = lit * (i === 0 ? 26 : 18)));
    hall.setLit(lit);
    tables.setLit(lit);
    // tables are dressed from the stage outward
    const count = mode === 'home' ? slots.length : Math.min(slots.length, Math.ceil(want / 10));
    tables.setAll((i) => (mode === 'home' ? smooth(0.34 + (i / slots.length) * 0.32, 0.4 + (i / slots.length) * 0.32, p) : i < count ? 1 : 0));
    degs.steamU.uOn.value.forEach((_, i) => (degs.steamU.uOn.value[i] = mode === 'home' ? smooth(0.62 + i * 0.04, 0.72 + i * 0.04, p) : 1));
    if (mode === 'home') {
      // from outside the entrance at dusk, down the aisle, stopping well inside to face the stage
      const e = smooth(0, 1, p);
      camGoal.pos.set(-2.6 + 2.6 * e, 2.4 + 0.5 * e - 0.35 * Math.sin(Math.PI * e), D / 2 + 12 - 18 * e);
      camGoal.look.set(0.2 * e, 2.0 - 0.3 * e, -D / 2 + 2);
    } else {
      // fit the whole hall in the frame: a three-quarter view from above the entrance
      const vf = THREE.MathUtils.degToRad(camera.fov) / 2;
      const need = Math.max(D * 0.62, (W * 0.7) / Math.max(0.5, camera.aspect));
      const dist = need / Math.tan(vf) * 0.95;
      camGoal.pos.set(-W * 0.28, dist * 0.68, D * 0.18 + dist * 0.62);
      camGoal.look.set(0, 0, -D * 0.06);
    }
    if (snap) { cam.pos.copy(camGoal.pos); cam.look.copy(camGoal.look); tables.step(0, true); }
    kick();
  }
  const depthFor = (g) => Math.max(14, Math.min(MAXD, 7.2 + Math.ceil(Math.ceil(g / 10) / 6) * 2.55));

  /* ---------- size ---------- */
  function layout() {
    const w = wrap.clientWidth, h = wrap.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 1 ? 60 : 44;
    camera.updateProjectionMatrix();
    if (mode !== 'home') applyState();
    kick();
  }

  const mouse = new THREE.Vector2(), sm = new THREE.Vector2();
  const onMove = (e) => mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  addEventListener('pointermove', onMove, { passive: true });

  let raf = 0, last = performance.now(), visible = true, dead = false, t = 0;
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) kick(); });
  io.observe(wrap);
  const twinkles = () => [strings.uniforms, degs.steamU, tables.haloU, ...hall.uniforms];
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); // rAF time can predate last
    last = now; t += dt;
    twinkles().forEach((u) => u && (u.uTime.value = t));
    tables.step(dt);
    // a soft, slightly lagging glide so scroll steps never show as jumps
    const k = 1 - Math.pow(0.08, dt);
    cam.pos.lerp(camGoal.pos, k); cam.look.lerp(camGoal.look, k);
    sm.lerp(mouse, 1 - Math.pow(0.08, dt));
    camera.position.set(cam.pos.x + sm.x * 0.5, cam.pos.y + sm.y * 0.25, cam.pos.z);
    camera.lookAt(cam.look);
    if (dead || renderer.getContext().isContextLost()) { raf = 0; return; } // context gone after a page change
    renderer.render(scene, camera);
    if (visible && !document.hidden && !dead) raf = requestAnimationFrame(frame);
    else raf = 0;
  }
  function kick() { if (!raf && !dead) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  const onVis = () => !document.hidden && kick();
  document.addEventListener('visibilitychange', onVis);

  buildHall(mode === 'home' ? 30 : depthFor(guests));
  const ro = new ResizeObserver(layout);
  ro.observe(wrap);
  layout();
  frame(performance.now());
  canvas.classList.add('is-ready');

  return {
    // the first call snaps (a reload mid-page starts in place); later ones glide
    setProgress(p, snap = false) { progress = p; applyState(first || snap); first = false; },
    setGuests(n) { want = n; buildHall(depthFor(n)); applyState(); },
    setTier(d) { tables.setDish(d); kick(); },
    dispose() {
      dead = true;
      cancelAnimationFrame(raf);
      io.disconnect(); ro.disconnect();
      removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', onVis);
      scene.traverse((o) => { o.geometry?.dispose(); [].concat(o.material || []).forEach((mm) => { mm.map?.dispose(); mm.dispose?.(); }); });
      glow.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
