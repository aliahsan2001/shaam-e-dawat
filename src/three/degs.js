/* Menus: three covered copper degs on a long table. open(i) lifts that deg's lid with a puff of
   steam; the others settle back. Hover a deg to make it glow. */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { glowTex } from './parts.js';

export function mountDegs(canvas, { count = 3, small = false, onPick } = {}) {
  const wrap = canvas.parentElement;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = !small;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.35;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  const glow = glowTex();

  scene.add(new THREE.HemisphereLight('#ffe2c0', '#10302a', 0.6));
  const key = new THREE.SpotLight('#ffcf9a', 60, 20, 0.6, 0.6, 1.4);
  key.position.set(0, 6, 3);
  key.castShadow = !small;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key, key.target);
  const rim = new THREE.PointLight('#ff9a50', 8, 8);
  rim.position.set(-3, 1.5, -2);
  scene.add(rim);

  // the long table, dressed in ivory with an emerald runner
  const table = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.12, 2), new THREE.MeshStandardMaterial({ color: '#f2e6d0', roughness: 0.85 }));
  table.position.y = -0.06;
  table.receiveShadow = true;
  const runner = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.125, 0.7), new THREE.MeshStandardMaterial({ color: '#1b4a40', roughness: 0.7 }));
  runner.position.y = -0.055;
  runner.receiveShadow = true;
  const drop = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 1.6), new THREE.MeshStandardMaterial({ color: '#e9dcc2', roughness: 0.9 }));
  drop.position.set(0, -0.9, 1);
  scene.add(table, runner, drop);

  const copper = new THREE.MeshStandardMaterial({ color: '#b5653a', metalness: 0.9, roughness: 0.28 });
  const brass = new THREE.MeshStandardMaterial({ color: '#c4a467', metalness: 0.9, roughness: 0.3 });
  const prof = [[0, 0], [0.42, 0], [0.56, 0.08], [0.62, 0.3], [0.6, 0.52], [0.5, 0.66], [0.53, 0.7], [0.53, 0.74], [0, 0.74]].map(([x, y]) => new THREE.Vector2(x, y));
  const potGeo = new THREE.LatheGeometry(prof, 48);
  const lidGeo = new THREE.SphereGeometry(0.54, 40, 12, 0, Math.PI * 2, 0, Math.PI / 2.4);
  const foodMat = [new THREE.MeshStandardMaterial({ color: '#d99a3a', roughness: 0.7 }), new THREE.MeshStandardMaterial({ color: '#c9702a', roughness: 0.7 }), new THREE.MeshStandardMaterial({ color: '#e0a03a', roughness: 0.7 })];
  const degs = [];
  for (let i = 0; i < count; i++) {
    const g = new THREE.Group();
    g.position.set((i - (count - 1) / 2) * 2.3, 0, 0);
    const pot = new THREE.Mesh(potGeo, copper);
    pot.castShadow = true;
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.61, 0.025, 8, 48), brass);
    band.rotation.x = Math.PI / 2; band.position.y = 0.32;
    // a mound of rice, with a little texture so it reads as grains under the light
    const foodGeo = new THREE.SphereGeometry(0.5, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const fp = foodGeo.attributes.position;
    for (let v = 0; v < fp.count; v++) { const n = Math.sin(fp.getX(v) * 40) * Math.cos(fp.getZ(v) * 37) * 0.012; fp.setY(v, fp.getY(v) * 0.32 + n); }
    foodGeo.computeVertexNormals();
    const food = new THREE.Mesh(foodGeo, foodMat[i % 3]);
    food.position.y = 0.6;
    const lidG = new THREE.Group();
    lidG.position.y = 0.72;
    const lid = new THREE.Mesh(lidGeo, copper); lid.scale.y = 0.55; lid.castShadow = true;
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), brass); knob.position.y = 0.3;
    lidG.add(lid, knob);
    g.add(pot, band, food, lidG);
    scene.add(g);
    // a seal of dough round the rim, the way dum is cooked
    const seal = new THREE.Mesh(new THREE.TorusGeometry(0.53, 0.035, 8, 48), new THREE.MeshStandardMaterial({ color: '#e8d2a0', roughness: 0.9 }));
    seal.rotation.x = Math.PI / 2; seal.position.y = 0.74;
    g.add(seal);
    degs.push({ g, lidG, seal, lift: 0, liftGoal: 0, hover: 0, hoverGoal: 0, puff: 0, pot });
  }

  // steam puffs
  const P = count * 40, pos = new Float32Array(P * 3), seed = new Float32Array(P), owner = new Float32Array(P);
  for (let i = 0; i < P; i++) { seed[i] = Math.random(); owner[i] = Math.floor(i / 40); }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  sg.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  sg.setAttribute('aOwner', new THREE.BufferAttribute(owner, 1));
  const U = { uTime: { value: 0 }, uPuff: { value: new Array(count).fill(0) }, uIdle: { value: new Array(count).fill(0) }, uX: { value: degs.map((d) => d.g.position.x) }, uMap: { value: glow }, uPixel: { value: renderer.getPixelRatio() } };
  const steam = new THREE.Points(sg, new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false,
    vertexShader: /* glsl */ `
      uniform float uTime, uPixel; uniform float uPuff[${count}]; uniform float uIdle[${count}]; uniform float uX[${count}];
      attribute float aSeed, aOwner; varying float vA;
      void main(){
        int o = int(aOwner + 0.5);
        float t = fract(uTime * 0.3 + aSeed);
        float burst = uPuff[o];
        vec3 p = vec3(uX[o] + sin(t * 7.0 + aSeed * 20.0) * (0.1 + 0.35 * t), 0.8 + t * (1.4 + burst), cos(t * 5.0 + aSeed * 13.0) * 0.2 * t);
        vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv;
        vA = (uIdle[o] * 0.28 + burst * 0.6) * sin(3.14159 * t);
        gl_PointSize = (60.0 + 200.0 * t) * uPixel * (5.0 / -mv.z);
      }`,
    fragmentShader: 'uniform sampler2D uMap; varying float vA; void main(){ vec4 c = texture2D(uMap, gl_PointCoord); gl_FragColor = vec4(vec3(1.0, 0.97, 0.92), c.a * vA); }',
  }));
  steam.frustumCulled = false;
  scene.add(steam);

  function layout() {
    const w = wrap.clientWidth, h = wrap.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const fitW = (count * 2.3 + 0.6) / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) / camera.aspect;
    // phones: frame tighter, the degs stay big and the table edges crop off
    const d = camera.aspect < 1 ? Math.max(fitW * 0.62, 6.5) : Math.max(fitW * 1.25, 8);
    camera.position.set(0, d * 0.4, d);
    camera.lookAt(0, 0.2, 0);
    camera.updateProjectionMatrix();
    kick();
  }

  /* ---------- picking ---------- */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const pick = (e) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(degs.map((d) => d.g), true)[0];
    return hit ? degs.findIndex((d) => d.g === hit.object.parent || d.g === hit.object.parent?.parent) : -1;
  };
  const onMove = (e) => { const i = pick(e); degs.forEach((d, k) => (d.hoverGoal = k === i ? 1 : 0)); canvas.style.cursor = i >= 0 ? 'pointer' : ''; kick(); };
  const onClick = (e) => { const i = pick(e); if (i >= 0) onPick?.(i); };
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('click', onClick);
  canvas.addEventListener('pointerleave', () => { degs.forEach((d) => (d.hoverGoal = 0)); kick(); });

  let raf = 0, last = performance.now(), visible = true, dead = false, t = 0;
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) kick(); });
  io.observe(wrap);
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); // rAF time can predate last
    last = now; t += dt;
    U.uTime.value = t;
    const k = 1 - Math.pow(0.004, dt);
    degs.forEach((d, i) => {
      d.lift += (d.liftGoal - d.lift) * k;
      d.hover += (d.hoverGoal - d.hover) * (1 - Math.pow(0.01, dt));
      d.puff = Math.max(0, d.puff - dt * 0.55);
      // the lid rises, tilts back and swings aside a little
      d.lidG.position.set(-d.lift * 0.35, 0.72 + d.lift * 0.9, -d.lift * 0.2);
      d.lidG.rotation.z = d.lift * 0.6;
      d.seal.scale.setScalar(1 - d.lift);
      d.seal.visible = d.lift < 0.98;
      d.g.position.y = d.hover * 0.04 + Math.sin(t * 2 + i) * 0.003;
      U.uPuff.value[i] = d.puff;
      U.uIdle.value[i] = d.lift;
    });
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
    open(i) { degs.forEach((d, k) => { const was = d.liftGoal; d.liftGoal = k === i ? 1 : 0; if (k === i && was < 1) d.puff = 1; }); kick(); },
    dispose() {
      dead = true;
      cancelAnimationFrame(raf);
      io.disconnect(); ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      scene.traverse((o) => { o.geometry?.dispose(); [].concat(o.material || []).forEach((m) => m.dispose?.()); });
      glow.dispose(); scene.environment?.dispose(); pmrem.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
