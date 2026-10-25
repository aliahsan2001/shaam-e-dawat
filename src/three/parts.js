/* Building blocks for the venue scenes: a pleated ivory shamiana with crystal chandeliers, warm
   uplights on the walls and marigold strands at the entrance; fairy lights; dressed round tables
   with floor-length cloths, gold chairs, chargers and floral centrepieces (instanced, so a thousand
   guests stay smooth); copper degs with steam; a floral stage. All procedural, no models, and no
   real-time shadows: fold shading is baked into vertex colours and tables sit on soft blob shadows. */

import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

const IVORY = '#f3ead9', GOLD = '#c4a467', EMERALD = '#123d33';
export const FLOWERS = ['#fcf8f0', '#f8dcd6', '#ee9fa8', '#c8304e', '#f4a43a', '#f7cf62', '#fcf8f0'];

// small deterministic noise so every mount dresses the hall the same way
const hash = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
function rng(seed = 1) { return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646; }

/* ---------- materials ---------- */
const lambert = (color, o = {}) => new THREE.MeshLambertMaterial({ color, ...o });
const goldMat = (o = {}) => new THREE.MeshPhongMaterial({ color: GOLD, specular: '#6a5228', shininess: 46, ...o });

/* ---------- textures ---------- */
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}

export const glowTex = () => canvasTex(128, 128, (g) => {
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,244,214,1)'); grd.addColorStop(0.16, 'rgba(255,214,150,.75)'); grd.addColorStop(0.45, 'rgba(255,180,100,.14)'); grd.addColorStop(1, 'rgba(255,170,80,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
});
const blobTex = () => canvasTex(128, 128, (g) => {
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(0,0,0,.5)'); grd.addColorStop(0.42, 'rgba(0,0,0,.34)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
});

// qanat panel: ivory cloth with soft pleat shading, a champagne arch and an emerald border
export const qanatTex = (repeat = [6, 1]) => canvasTex(256, 256, (g, w, h) => {
  const grd = g.createLinearGradient(0, 0, w, 0);
  for (let i = 0; i <= 8; i++) grd.addColorStop(i / 8, i % 2 ? '#ece0c9' : '#f8f1e3');
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(196,164,103,.9)'; g.lineWidth = 4;
  g.beginPath(); g.moveTo(44, h - 34); g.lineTo(44, 112); g.quadraticCurveTo(44, 52, 128, 36); g.quadraticCurveTo(212, 52, 212, 112); g.lineTo(212, h - 34); g.stroke();
  g.fillStyle = '#1b4a40'; g.fillRect(0, h - 24, w, 24); g.fillRect(0, 0, w, 10);
  g.fillStyle = GOLD; g.fillRect(0, h - 28, w, 3); g.fillRect(0, 12, w, 2);
}, repeat);

// emerald carpet with a little pile and a faint gold lattice
export const carpetTex = (repeat = [4, 4]) => canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = EMERALD; g.fillRect(0, 0, w, h);
  const r = rng(3);
  for (let i = 0; i < 900; i++) { g.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.09)'; g.fillRect(r() * w, r() * h, 1.5, 1.5); }
  g.strokeStyle = 'rgba(196,164,103,.22)'; g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(w / 2, 6); g.lineTo(w - 6, h / 2); g.lineTo(w / 2, h - 6); g.lineTo(6, h / 2); g.closePath(); g.stroke();
  g.fillStyle = 'rgba(196,164,103,.28)'; g.beginPath(); g.arc(w / 2, h / 2, 4, 0, Math.PI * 2); g.fill();
}, repeat);

const valanceTex = (repeat) => canvasTex(256, 64, (g, w, h) => {
  const grd = g.createLinearGradient(0, 0, 0, h);
  grd.addColorStop(0, '#dcc48e'); grd.addColorStop(1, '#a8874c');
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
  g.fillStyle = '#f6efe2'; g.fillRect(0, 9, w, 3); g.fillRect(0, h - 15, w, 2);
  g.fillStyle = '#1b4a40';
  for (let x = 10; x < w; x += 24) { g.beginPath(); g.moveTo(x, h / 2 - 5); g.lineTo(x + 5, h / 2 + 2); g.lineTo(x, h / 2 + 9); g.lineTo(x - 5, h / 2 + 2); g.fill(); }
}, repeat);

// the aisle runner: ivory, gold-edged, scattered with rose and marigold petals
const aisleTex = (repeat) => canvasTex(128, 256, (g, w, h) => {
  g.fillStyle = '#f2e8d6'; g.fillRect(0, 0, w, h);
  g.fillStyle = GOLD; g.fillRect(0, 0, 7, h); g.fillRect(w - 7, 0, 7, h);
  g.fillStyle = '#1b4a40'; g.fillRect(9, 0, 2, h); g.fillRect(w - 11, 0, 2, h);
  const r = rng(11);
  for (let i = 0; i < 46; i++) {
    g.fillStyle = ['#c4566a', '#e8a24a', '#e7b3a8', '#f0c86a'][i % 4];
    g.save(); g.translate(16 + r() * (w - 32), r() * h); g.rotate(r() * 6); g.beginPath(); g.ellipse(0, 0, 4, 2.4, 0, 0, Math.PI * 2); g.fill(); g.restore();
  }
}, repeat);

/* ---------- geometry helpers ---------- */
// a non-indexed copy with a colour attribute; shade(x, y, z) darkens folds and creases
function tint(geo, color, shade) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  const p = g.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color(color);
  for (let i = 0; i < p.count; i++) {
    const s = shade ? shade(p.getX(i), p.getY(i), p.getZ(i)) : 1;
    col[i * 3] = c.r * s; col[i * 3 + 1] = c.g * s; col[i * 3 + 2] = c.b * s;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

// a hanging length of pleated cloth, len wide and h tall, folds baked into its vertex colours
export function drapeGeo(len, h, perM = 2.2, depth = 0.07, segY = 1) {
  const n = Math.max(1, Math.round(len * perM));
  const g = new THREE.PlaneGeometry(len, h, n * 6, segY);
  const p = g.attributes.position, col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const f = Math.sin((p.getX(i) / len + 0.5) * n * Math.PI * 2);
    p.setZ(i, f * depth);
    const ao = 0.74 + 0.26 * (0.5 + 0.5 * f);
    col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = ao;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

// a ball of roses, carnations and greenery: soft clusters of bloom colour over a bumpy dome
const BLOOM_W = [0.3, 0.22, 0.14, 0.12, 0.08, 0.06, 0.08];
export function flowerBall(r, y = 0, palette = FLOWERS, detail = 3) {
  const src = new THREE.IcosahedronGeometry(r, detail);
  src.deleteAttribute('normal'); src.deleteAttribute('uv');
  const g = mergeVertices(src);
  const p = g.attributes.position, n = p.count, col = new Float32Array(n * 3), c = new THREE.Color(), leaf = new THREE.Color('#3d6a48');
  const weights = palette.length === BLOOM_W.length ? BLOOM_W : palette.map(() => 1 / palette.length);
  const pick = (h) => { let a = 0; for (let i = 0; i < weights.length; i++) { a += weights[i]; if (h < a) return palette[i]; } return palette[0]; };
  for (let i = 0; i < n; i++) {
    const x = p.getX(i) / r, yy = p.getY(i) / r, z = p.getZ(i) / r, l = Math.hypot(x, yy, z) || 1;
    // each bloom is a little dome, so the surface reads as packed flower heads
    const cell = 5.5, bx = Math.sin(x * cell * 3.1 + 1.7) * Math.sin(yy * cell * 2.9 + 0.3) * Math.sin(z * cell * 3.3 + 2.1);
    const bump = 1 + 0.08 * Math.abs(bx) + 0.03 * Math.sin(x * 23 + z * 19);
    p.setXYZ(i, (x / l) * r * bump, (yy / l) * r * bump * (yy < 0 ? 0.7 : 0.92) + y, (z / l) * r * bump);
    const h = hash(Math.round(x * 3.2), Math.round(yy * 3.2), Math.round(z * 3.2));
    if (h < 0.04 + (yy < -0.3 ? 0.4 : 0)) c.copy(leaf); else c.set(pick(hash(Math.round(x * 3.2) + 7, Math.round(yy * 3.2), Math.round(z * 3.2) - 3)));
    const s = 0.86 + 0.14 * Math.abs(bx);
    col.set([c.r * s, c.g * s, c.b * s], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
  g.computeVertexNormals();
  return g.toNonIndexed();
}

/* ---------- additive glow sprites (candles, chandeliers, uplights) ---------- */
function glowPoints(n, map, lit, { pixel = 1, color = [1, 0.92, 0.8], twinkle = 0.1 } = {}) {
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 3), size = new Float32Array(n), on = new Float32Array(n).fill(1), seed = new Float32Array(n);
  const r = rng(n + 5);
  for (let i = 0; i < n; i++) seed[i] = r();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  g.setAttribute('aOn', new THREE.BufferAttribute(on, 1));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const uniforms = { uMap: { value: map }, uLit: lit, uTime: { value: 0 }, uPixel: { value: pixel }, uColor: { value: new THREE.Vector3(...color) }, uTw: { value: twinkle } };
  const pts = new THREE.Points(g, new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute float aSize, aOn, aSeed; uniform float uTime, uPixel, uLit, uTw; varying float vA;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
        float tw = 1.0 - uTw + uTw * sin(uTime * (2.0 + aSeed * 3.0) + aSeed * 40.0);
        vA = aOn * uLit * tw;
        gl_PointSize = aSize * uPixel * 600.0 / -mv.z * (0.6 + 0.4 * aOn); }`,
    fragmentShader: 'uniform sampler2D uMap; uniform vec3 uColor; varying float vA; void main(){ vec4 c = texture2D(uMap, gl_PointCoord); gl_FragColor = vec4(uColor * c.rgb, c.a * vA); }',
  }));
  pts.frustumCulled = false;
  const set = (i, x, y, z, s, o = 1) => { pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; size[i] = s; on[i] = o; };
  const flush = () => { g.attributes.position.needsUpdate = g.attributes.aSize.needsUpdate = g.attributes.aOn.needsUpdate = true; };
  return { pts, uniforms, set, flush, on };
}

// soft volumes of light: cones under the chandeliers, scallops of uplight on the walls
const coneShader = (lit, color, alpha) => new THREE.ShaderMaterial({
  uniforms: { uLit: lit, uColor: { value: new THREE.Vector3(...color) }, uAlpha: { value: alpha } },
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  vertexShader: /* glsl */ `varying vec2 vUv; varying float vF;
    void main(){ vUv = uv; vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
      vec3 n = normalize(normalMatrix * mat3(instanceMatrix) * normal);
      vF = abs(dot(n, normalize(-mv.xyz))); gl_Position = projectionMatrix * mv; }`,
  fragmentShader: 'uniform float uLit, uAlpha; uniform vec3 uColor; varying vec2 vUv; varying float vF; void main(){ gl_FragColor = vec4(uColor, uLit * uAlpha * pow(vUv.y, 1.5) * vF * vF); }',
});
const washShader = (lit, color, alpha) => new THREE.ShaderMaterial({
  uniforms: { uLit: lit, uColor: { value: new THREE.Vector3(...color) }, uAlpha: { value: alpha } },
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }',
  fragmentShader: /* glsl */ `uniform float uLit, uAlpha; uniform vec3 uColor; varying vec2 vUv;
    void main(){ float x = (vUv.x * 2.0 - 1.0) / (0.22 + 0.78 * vUv.y);
      float a = max(0.0, 1.0 - x * x) * pow(1.0 - vUv.y * 0.92, 1.6) * smoothstep(0.0, 0.06, vUv.y);
      gl_FragColor = vec4(uColor, uLit * uAlpha * a); }`,
});

/* ---------- sky: dusk to night ---------- */
export function makeSky() {
  const uniforms = { uNight: { value: 0 } };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(120, 32, 16), new THREE.ShaderMaterial({
    uniforms, side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: /* glsl */ `
      uniform float uNight; varying vec3 vP;
      float hash(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453); }
      void main(){
        float h = clamp(vP.y, -0.2, 1.0);
        vec3 duskTop = vec3(0.14, 0.2, 0.32), duskMid = vec3(0.72, 0.5, 0.44), duskLow = vec3(0.98, 0.7, 0.46);
        vec3 dusk = mix(duskLow, duskMid, smoothstep(0.0, 0.16, h)); dusk = mix(dusk, duskTop, smoothstep(0.14, 0.7, h));
        vec3 night = mix(vec3(0.05, 0.09, 0.09), vec3(0.012, 0.03, 0.035), smoothstep(0.0, 0.6, h));
        vec3 col = mix(dusk, night, uNight);
        float st = step(0.9975, hash(floor(vP * 260.0))) * smoothstep(0.1, 0.5, h) * smoothstep(0.4, 1.0, uNight);
        gl_FragColor = vec4(col + st * 0.7, 1.0);
      }`,
  }));
  return { sky, uniforms };
}

/* ---------- crystal chandeliers ---------- */
function makeChandeliers(spots, glow, lit, pixel) {
  const group = new THREE.Group();
  const ring = (r, y) => { const t = new THREE.TorusGeometry(r, 0.018, 6, 40); t.rotateX(Math.PI / 2); t.translate(0, y, 0); return tint(t, GOLD); };
  const stem = new THREE.CylinderGeometry(0.014, 0.014, 1.4, 6); stem.translate(0, 0.95, 0);
  const fin = new THREE.SphereGeometry(0.05, 10, 8); fin.translate(0, -0.42, 0);
  const frameGeo = mergeGeometries([ring(0.58, 0), ring(0.38, 0.3), ring(0.18, 0.55), tint(stem, GOLD), tint(fin, GOLD)]);
  const frames = new THREE.InstancedMesh(frameGeo, goldMat({ vertexColors: true, color: '#ffffff', emissive: '#4a3410', emissiveIntensity: 0 }), spots.length);
  // crystal drops: rings of them, and a cascade down the middle
  const drops = [];
  [[0.58, -0.1, 30], [0.38, 0.2, 20], [0.18, 0.46, 12]].forEach(([r, y, n]) => { for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2; drops.push([Math.cos(a) * r, y, Math.sin(a) * r]); } });
  for (let k = 0; k < 14; k++) { const a = k * 2.4; drops.push([Math.cos(a) * 0.08, 0.45 - k * 0.06, Math.sin(a) * 0.08]); }
  const crystalGeo = new THREE.OctahedronGeometry(0.03); crystalGeo.scale(1, 2.4, 1);
  const crystalMat = new THREE.MeshBasicMaterial({ color: '#8d877c' });
  const crystals = new THREE.InstancedMesh(crystalGeo, crystalMat, spots.length * drops.length);
  const glints = glowPoints(spots.length * (1 + Math.ceil(drops.length / 4)), glow, lit, { pixel, twinkle: 0.45, color: [1, 0.95, 0.86] });
  const big = glowPoints(spots.length, glow, lit, { pixel, twinkle: 0.03, color: [1, 0.86, 0.64] });
  const coneH = spots[0][1];
  const coneGeo = new THREE.CylinderGeometry(0.35, 3.4, coneH, 28, 1, true); coneGeo.translate(0, -coneH / 2, 0);
  const cones = new THREE.InstancedMesh(coneGeo, coneShader(lit, [1, 0.8, 0.55], 0.075), spots.length);
  const m = new THREE.Matrix4();
  let gi = 0;
  spots.forEach(([x, y, z], i) => {
    m.makeScale(1.25, 1.25, 1.25).setPosition(x, y, z); frames.setMatrixAt(i, m);
    m.makeTranslation(x, y - 0.35, z); cones.setMatrixAt(i, m);
    big.set(i, x, y + 0.15, z, 3.4);
    drops.forEach(([dx, dy, dz], k) => {
      m.makeTranslation(x + dx * 1.25, y + dy * 1.25, z + dz * 1.25); crystals.setMatrixAt(i * drops.length + k, m);
      if (k % 4 === 0) glints.set(gi++, x + dx * 1.25, y + dy * 1.25, z + dz * 1.25, 0.16);
    });
    glints.set(gi++, x, y - 0.5, z, 0.5);
  });
  glints.flush(); big.flush();
  group.add(frames, crystals, cones, big.pts, glints.pts);
  const off = new THREE.Color('#8d877c'), onC = new THREE.Color('#fff4de');
  return {
    group, uniforms: [glints.uniforms, big.uniforms],
    setLit(v) { crystalMat.color.copy(off).lerp(onC, v); frames.material.emissiveIntensity = v * 0.8; },
  };
}

/* ---------- the shamiana: pleated canopy, valance, draped walls, carpet, chandeliers ---------- */
export function makeMarquee(W, D, H = 4.2, { glow, pixel = 1 } = {}) {
  const group = new THREE.Group();
  const lit = { value: 0 };
  const uniforms = [];
  const ridgeAt = (x) => 1.6 * (1 - Math.pow(Math.abs(x) / (W / 2), 1.3));

  // canopy: a ridge down the middle, sagging between bays, ruched into soft folds
  const segZ = Math.min(320, Math.round(D * 6));
  const geo = new THREE.PlaneGeometry(W, D, 40, segZ);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, col = new Float32Array(pos.count * 3);
  const bay = D / Math.max(2, Math.round(D / 4.5));
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), edge = 1 - Math.abs(x) / (W / 2);
    const sag = 0.18 * Math.sin(Math.PI * (((z + D / 2) % bay) / bay)) * edge;
    const f = 0.5 + 0.5 * Math.cos((z / 0.85) * Math.PI * 2);
    pos.setY(i, H + ridgeAt(x) - sag - 0.09 * f * (0.4 + 0.6 * edge));
    const ao = 0.72 + 0.28 * (1 - f);
    col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = ao;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const roofMat = lambert('#f6eee0', { vertexColors: true, side: THREE.DoubleSide, emissive: new THREE.Color('#ffb066'), emissiveIntensity: 0 });
  const roof = new THREE.Mesh(geo, roofMat);
  roof.name = 'roof';
  group.add(roof);

  // valance: a scalloped gold skirt round the canopy
  const valMat = lambert('#ffffff', { map: valanceTex([Math.round(W / 1.6), 1]), side: THREE.DoubleSide, emissive: new THREE.Color('#ff9a50'), emissiveIntensity: 0 });
  const mkVal = (len) => {
    const g = new THREE.PlaneGeometry(len, 0.55, Math.round(len * 6), 1);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) if (p.getY(i) < 0) p.setY(i, -0.27 - 0.14 * Math.abs(Math.sin(p.getX(i) * 2.4)));
    return g;
  };
  [[0, D / 2, 0, W], [0, -D / 2, Math.PI, W], [W / 2, 0, Math.PI / 2, D], [-W / 2, 0, -Math.PI / 2, D]].forEach(([x, z, ry, len]) => {
    const v = new THREE.Mesh(mkVal(len), valMat);
    v.position.set(x, H - 0.22, z); v.rotation.y = ry; v.name = 'valance';
    group.add(v);
  });

  // draped ivory walls on the back and sides; the front is open, its curtains tied back
  const wallMat = lambert(IVORY, { vertexColors: true, side: THREE.DoubleSide, emissive: new THREE.Color('#ffa85a'), emissiveIntensity: 0 });
  const back = new THREE.Mesh(drapeGeo(W, H, 2.2, 0.07), wallMat); back.position.set(0, H / 2, -D / 2); group.add(back);
  const sideGeo = drapeGeo(D, H, 2.2, 0.07);
  [-1, 1].forEach((s) => { const w = new THREE.Mesh(sideGeo, wallMat); w.position.set(s * W / 2, H / 2, 0); w.rotation.y = s * Math.PI / 2; group.add(w); });
  const tieGeo = drapeGeo(2.4, H, 3, 0.09, 16);
  const tp = tieGeo.attributes.position;
  for (let i = 0; i < tp.count; i++) {
    const x = tp.getX(i), y = tp.getY(i) + H / 2;
    const pinch = 0.64 * Math.exp(-Math.pow((y - 1.25) / 0.9, 2)) + 0.25 * smooth(1.2, 0, y);
    tp.setX(i, -1.2 + (x + 1.2) * (1 - pinch));
  }
  tieGeo.computeVertexNormals();
  [-1, 1].forEach((s) => {
    const c = new THREE.Mesh(tieGeo, wallMat);
    c.position.set(s * (W / 2 - 1.2), H / 2, D / 2 - 0.05); c.scale.x = -s;
    const tie = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 6, 16), goldMat());
    tie.position.set(s * (W / 2 - 0.62), 1.25, D / 2); tie.scale.set(1, 1.6, 1);
    group.add(c, tie);
  });
  // gold-banded poles at the entrance
  const poleGeo = mergeGeometries([tint(new THREE.CylinderGeometry(0.08, 0.09, H, 12).translate(0, H / 2, 0), IVORY), ...[0.15, H * 0.5, H - 0.1].map((y) => tint(new THREE.CylinderGeometry(0.1, 0.1, 0.1, 12).translate(0, y, 0), GOLD))]);
  [-1, 1].forEach((s) => { const p = new THREE.Mesh(poleGeo, goldMat({ vertexColors: true, color: '#ffffff' })); p.position.set(s * (W / 2 - 0.05), 0, D / 2 + 0.05); group.add(p); });

  // marigold strands hung from the front valance, longer toward the sides so the middle stays open
  const strands = [];
  for (let x = -W / 2 + 0.3; x <= W / 2 - 0.3; x += 0.34) {
    const len = 0.35 + 1.7 * smooth(2.6, W / 2, Math.abs(x));
    for (let y = 0; y < len; y += 0.07) strands.push([x, H - 0.48 - y, D / 2 + 0.03]);
  }
  const marigold = new THREE.InstancedMesh(flowerBall(0.045, 0, ['#f28c1c', '#f7a823', '#e8731a'], 1), lambert('#ffffff', { vertexColors: true, emissive: '#7a3a00', emissiveIntensity: 0.15 }), strands.length);
  const mm = new THREE.Matrix4(), r = rng(9);
  strands.forEach(([x, y, z], i) => { mm.makeRotationY(r() * 6).setPosition(x, y, z); marigold.setMatrixAt(i, mm); });
  marigold.name = 'valance';
  group.add(marigold);

  // emerald carpet, and an ivory aisle from the entrance to the stage
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(W, D), lambert('#ffffff', { map: carpetTex([W / 2, D / 2]) }));
  carpet.rotation.x = -Math.PI / 2; carpet.position.y = 0.01;
  const aLen = D - 3.6 + 9;
  const aisle = new THREE.Mesh(new THREE.PlaneGeometry(2.2, aLen), lambert('#ffffff', { map: aisleTex([1, aLen / 2.6]) }));
  aisle.rotation.x = -Math.PI / 2; aisle.position.set(0, 0.014, D / 2 + 9 - aLen / 2);
  group.add(carpet, aisle);

  // chandeliers down the ridge, each throwing a soft cone of light
  const nCh = Math.max(2, Math.min(6, Math.round(D / 7.5)));
  const spots = Array.from({ length: nCh }, (_, i) => [0, H + 0.5, -D / 2 + 5.5 + (i / (nCh - 1)) * (D - 10)]);
  const ch = makeChandeliers(spots, glow, lit, pixel);
  ch.group.name = 'roof';
  ch.group.children.forEach((o) => (o.name = 'roof'));
  group.add(ch.group);
  uniforms.push(...ch.uniforms);

  // warm uplights washing the walls in scallops
  const washes = [];
  for (let z = -D / 2 + 3.2; z < D / 2 - 1; z += 3.4) { washes.push([-W / 2 + 0.14, z, Math.PI / 2]); washes.push([W / 2 - 0.14, z, -Math.PI / 2]); }
  [-7.4, -5.2, 5.2, 7.4].forEach((x) => Math.abs(x) < W / 2 - 0.8 && washes.push([x, -D / 2 + 0.14, 0]));
  const washGeo = new THREE.PlaneGeometry(2.2, H * 0.98); washGeo.translate(0, H * 0.49, 0);
  const wash = new THREE.InstancedMesh(washGeo, washShader(lit, [1, 0.62, 0.3], 0.34), washes.length);
  const fixtures = glowPoints(washes.length, glow, lit, { pixel, twinkle: 0, color: [1, 0.75, 0.45] });
  washes.forEach(([x, z, ry], i) => {
    mm.makeRotationY(ry).setPosition(x, 0, z); wash.setMatrixAt(i, mm);
    fixtures.set(i, x + Math.sin(ry) * 0.12, 0.12, z + Math.cos(ry) * 0.12, 0.45);
  });
  fixtures.flush();
  group.add(wash, fixtures.pts);
  uniforms.push(fixtures.uniforms);

  return {
    group, roofMat, valMat, H, uniforms,
    roofY: (x) => H + ridgeAt(x),
    // 0 at dusk (lights off) to 1 when the hall is fully lit
    setLit(v) {
      lit.value = v;
      roofMat.emissiveIntensity = 0.05 + v * 0.18;
      valMat.emissiveIntensity = v * 0.16;
      wallMat.emissiveIntensity = v * 0.08;
      marigold.material.emissiveIntensity = 0.15 + v * 0.45;
      ch.setLit(v);
    },
  };
}

/* ---------- fairy lights: strings of bulbs that switch on string by string ---------- */
export function makeStrings(strings, glow) {
  // strings: [{ a: Vector3, b: Vector3, sag }]
  const per = 26;
  const N = strings.length * per;
  const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffffff' }), N);
  const pts = new Float32Array(N * 3), on = new Float32Array(N), seed = new Float32Array(N);
  const m = new THREE.Matrix4(), v = new THREE.Vector3(), offC = new THREE.Color('#3a2e22');
  const wires = [];
  const r = rng(21);
  strings.forEach((s, si) => {
    const line = [];
    for (let k = 0; k < per; k++) {
      const t = k / (per - 1);
      v.lerpVectors(s.a, s.b, t);
      v.y -= s.sag * 4 * t * (1 - t);
      line.push(v.clone());
      const i = si * per + k;
      m.makeTranslation(v.x, v.y, v.z);
      bulbs.setMatrixAt(i, m);
      bulbs.setColorAt(i, offC);
      pts.set([v.x, v.y, v.z], i * 3);
      seed[i] = r();
    }
    wires.push(new THREE.CatmullRomCurve3(line).getPoints(per * 2));
  });
  const wireGeo = new THREE.BufferGeometry().setFromPoints(wires.flatMap((w) => w.flatMap((p, k) => (k ? [w[k - 1], p] : []))));
  const wire = new THREE.LineSegments(wireGeo, new THREE.LineBasicMaterial({ color: '#2a2418', transparent: true, opacity: 0.5 }));
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pts, 3));
  g.setAttribute('aOn', new THREE.BufferAttribute(on, 1));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const uniforms = { uMap: { value: glow }, uTime: { value: 0 }, uPixel: { value: 1 } };
  const halos = new THREE.Points(g, new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute float aOn; attribute float aSeed; uniform float uTime, uPixel; varying float vA;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
        float tw = 0.86 + 0.14 * sin(uTime * (1.5 + aSeed * 2.0) + aSeed * 40.0);
        vA = aOn * tw; gl_PointSize = 30.0 * uPixel * (6.0 / -mv.z) * (0.6 + 0.4 * aOn); }`,
    fragmentShader: 'uniform sampler2D uMap; varying float vA; void main(){ vec4 c = texture2D(uMap, gl_PointCoord); gl_FragColor = vec4(c.rgb, c.a * vA); }',
  }));
  halos.frustumCulled = false;
  const group = new THREE.Group();
  group.add(wire, bulbs, halos);
  const onC = new THREE.Color('#ffe2a8'), tmp = new THREE.Color();
  const levels = new Float32Array(strings.length).fill(-1);
  return {
    group, uniforms, count: strings.length,
    // level per string, 0..1; only strings whose level changed are rewritten
    set(list) {
      let dirty = false;
      list.forEach((lv, si) => {
        if (Math.abs(levels[si] - lv) < 0.002) return;
        levels[si] = lv; dirty = true;
        tmp.copy(offC).lerp(onC, lv);
        for (let k = 0; k < per; k++) { const i = si * per + k; on[i] = lv; bulbs.setColorAt(i, tmp); }
      });
      if (!dirty) return;
      g.attributes.aOn.needsUpdate = true;
      bulbs.instanceColor.needsUpdate = true;
    },
  };
}

/* ---------- dressed round tables (instanced) ---------- */
// a floor-length cloth, gathered into soft folds as it falls
function clothGeo() {
  const prof = [[0.94, 0.01], [0.9, 0.24], [0.87, 0.48], [0.85, 0.68], [0.835, 0.735], [0.815, 0.765], [0.78, 0.775], [0, 0.775]].map(([x, y]) => new THREE.Vector2(x, y));
  const g = new THREE.LatheGeometry(prof, 56);
  const p = g.attributes.position, col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const drop = smooth(0.74, 0.05, y), f = Math.sin(Math.atan2(x, z) * 18), k = 1 + 0.04 * drop * f;
    p.setXYZ(i, x * k, y, z * k);
    const ao = 1 - 0.18 * drop * (0.5 - 0.5 * f) - 0.08 * drop;
    col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = ao;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}
// a gold Chiavari chair with an ivory cushion, facing +z
function chairGeo() {
  const parts = [];
  const box = (w, h, d, x, y, z, c = '#c9a961') => parts.push(tint(new THREE.BoxGeometry(w, h, d).translate(x, y, z), c));
  const rod = (r, h, x, y, z) => parts.push(tint(new THREE.CylinderGeometry(r, r, h, 5).translate(x, y, z), '#c9a961'));
  box(0.4, 0.06, 0.4, 0, 0.48, 0.01, '#f1e7d4');
  box(0.42, 0.03, 0.42, 0, 0.44, 0);
  [-0.185, 0.185].forEach((x) => rod(0.014, 0.44, x, 0.22, 0.185));
  [-0.185, 0.185].forEach((x) => rod(0.014, 0.96, x, 0.48, -0.185));
  [0.66, 0.8, 0.94].forEach((y) => box(0.38, 0.025, 0.025, 0, y, -0.19));
  [-0.09, 0, 0.09].forEach((x) => rod(0.009, 0.28, x, 0.8, -0.19));
  box(0.38, 0.015, 0.015, 0, 0.14, 0.185); box(0.015, 0.015, 0.38, -0.185, 0.14, 0); box(0.015, 0.015, 0.38, 0.185, 0.14, 0);
  return mergeGeometries(parts);
}
// gold charger, white plate and a folded emerald napkin
function settingGeo() {
  return mergeGeometries([
    tint(new THREE.CylinderGeometry(0.165, 0.165, 0.008, 20).translate(0, 0.004, 0), GOLD),
    tint(new THREE.CylinderGeometry(0.12, 0.112, 0.012, 20).translate(0, 0.014, 0), '#fbf8f1'),
    tint(new THREE.BoxGeometry(0.07, 0.022, 0.13).translate(0, 0.031, 0), '#1b4a40'),
  ]);
}
// a tall gold stand with a ball of flowers on top
function centreGeo() {
  return mergeGeometries([
    tint(new THREE.CylinderGeometry(0.09, 0.12, 0.03, 16).translate(0, 0.015, 0), GOLD),
    tint(new THREE.CylinderGeometry(0.014, 0.022, 0.5, 6).translate(0, 0.27, 0), GOLD),
    tint(new THREE.CylinderGeometry(0.11, 0.03, 0.08, 14).translate(0, 0.55, 0), GOLD),
    flowerBall(0.2, 0.66),
  ]);
}

export function makeTables(max, { chairsPer = 8, dish = ['#c7782a', '#8a4a1e', '#e9d9a8'], glow = null, always = false, pixel = 1 } = {}) {
  const cloths = new THREE.InstancedMesh(clothGeo(), lambert('#f7f0e3', { vertexColors: true }), max);
  const blob = blobTex();
  const blobGeo = new THREE.PlaneGeometry(3, 3); blobGeo.rotateX(-Math.PI / 2);
  const blobs = new THREE.InstancedMesh(blobGeo, new THREE.MeshBasicMaterial({ map: blob, transparent: true, depthWrite: false }), max);
  const shiny = (o) => new THREE.MeshPhongMaterial({ color: '#ffffff', vertexColors: true, specular: '#5a4524', shininess: 38, ...o });
  const chairs = new THREE.InstancedMesh(chairGeo(), shiny(), max * chairsPer);
  const settings = new THREE.InstancedMesh(settingGeo(), shiny(), max * chairsPer);
  const centres = new THREE.InstancedMesh(centreGeo(), shiny({ shininess: 20, specular: '#2a2218', emissive: '#3a2418', emissiveIntensity: 0.6 }), max);
  const bowlGeo = new THREE.SphereGeometry(0.1, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  const fillGeo = new THREE.CircleGeometry(0.095, 16); fillGeo.rotateX(-Math.PI / 2);
  const bowls = new THREE.InstancedMesh(bowlGeo, goldMat({ side: THREE.DoubleSide }), max * 3);
  const food = new THREE.InstancedMesh(fillGeo, lambert('#ffffff'), max * 3);
  const candles = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.03, 0.03, 0.07, 8), new THREE.MeshBasicMaterial({ color: '#ffdca6' }), max * 3);
  const all = [blobs, cloths, chairs, settings, centres, bowls, food, candles];
  all.forEach((mm) => { mm.count = 0; mm.frustumCulled = false; });
  blobs.renderOrder = -1;
  const group = new THREE.Group();
  group.add(...all);
  const lit = { value: 1 };
  const halos = glow ? glowPoints(max * 3, glow, lit, { pixel, twinkle: 0.18, color: [1, 0.85, 0.62] }) : null;
  if (halos) group.add(halos.pts);

  let slots = [], shown = new Float32Array(max), target = new Float32Array(max);
  let colours = dish.map((c) => new THREE.Color(c));
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  function write() {
    const n = slots.length;
    blobs.count = cloths.count = centres.count = n;
    chairs.count = settings.count = n * chairsPer;
    bowls.count = food.count = candles.count = n * 3;
    if (halos) halos.pts.geometry.setDrawRange(0, n * 3);
    for (let i = 0; i < n; i++) {
      const [x, z] = slots[i], k = shown[i];
      const e = k < 0.001 ? 0 : 1 - Math.pow(1 - k, 3);
      const te = always ? 1 : e;
      q.identity();
      m4.compose(p.set(x, 0, z), q, s.setScalar(te)); cloths.setMatrixAt(i, m4);
      m4.compose(p.set(x, 0.018, z), q, s.setScalar(te)); blobs.setMatrixAt(i, m4);
      const fe = clamp01(e * 1.6 - 0.55);
      q.setFromAxisAngle(Y, i * 1.7);
      m4.compose(p.set(x, 0.775, z), q, s.setScalar(fe)); centres.setMatrixAt(i, m4);
      for (let c = 0; c < chairsPer; c++) {
        const a = (c / chairsPer) * Math.PI * 2 + 0.2;
        const ce = clamp01(e * 1.3 - (c / chairsPer) * 0.3);
        q.setFromAxisAngle(Y, Math.atan2(-Math.cos(a), -Math.sin(a)));
        const d = 1.04 + (1 - ce) * 0.5;
        m4.compose(p.set(x + Math.cos(a) * d, 0, z + Math.sin(a) * d), q, s.setScalar(ce)); chairs.setMatrixAt(i * chairsPer + c, m4);
        const se = clamp01(ce * 1.4 - 0.3);
        m4.compose(p.set(x + Math.cos(a) * 0.6, 0.775, z + Math.sin(a) * 0.6), q, s.setScalar(se)); settings.setMatrixAt(i * chairsPer + c, m4);
      }
      q.identity();
      const de = clamp01(e * 1.5 - 0.5);
      for (let d = 0; d < 3; d++) {
        const a = (d / 3) * Math.PI * 2 + 0.5;
        m4.compose(p.set(x + Math.cos(a) * 0.34, 0.775 + 0.1 * de, z + Math.sin(a) * 0.34), q, s.setScalar(de)); bowls.setMatrixAt(i * 3 + d, m4);
        p.y += 0.004; m4.compose(p, q, s.setScalar(de)); food.setMatrixAt(i * 3 + d, m4);
        food.setColorAt(i * 3 + d, colours[d]);
        const b = a + Math.PI / 3, cx = x + Math.cos(b) * 0.3, cz = z + Math.sin(b) * 0.3;
        m4.compose(p.set(cx, 0.81, cz), q, s.setScalar(de)); candles.setMatrixAt(i * 3 + d, m4);
        halos?.set(i * 3 + d, cx, 0.86, cz, 0.22, de);
      }
    }
    all.forEach((mm) => { mm.instanceMatrix.needsUpdate = true; });
    if (food.instanceColor) food.instanceColor.needsUpdate = true;
    halos?.flush();
  }
  return {
    group, candles,
    haloU: halos ? halos.uniforms : null,
    setLit(v) { lit.value = 0.55 + 0.45 * v; },
    setSlots(list) { slots = list.slice(0, max); write(); },
    setTarget(i, v) { target[i] = v; },
    setAll(v) { for (let i = 0; i < slots.length; i++) target[i] = typeof v === 'function' ? v(i) : v; },
    setDish(list) { colours = list.map((c) => new THREE.Color(c)); write(); },
    // ease every table toward its target; returns true while anything is still moving
    step(dt, instant = false) {
      let moving = false;
      const k = instant ? 1 : 1 - Math.pow(0.02, dt);
      for (let i = 0; i < slots.length; i++) {
        const d = target[i] - shown[i];
        if (Math.abs(d) > 0.002) { shown[i] += d * k; moving = true; } else shown[i] = target[i];
      }
      if (moving || instant) write();
      return moving;
    },
  };
}

// table centres on both sides of a centre aisle, row by row from the stage toward the entrance
export function tableGrid(W, zEnd, zStart, { spacing = 2.55, aisle = 2.2 } = {}) {
  const xs = [];
  for (let x = aisle / 2 + 1.2; x <= W / 2 - 1.5 + 1e-6; x += spacing) xs.push(x);
  const cols = [...xs.map((x) => -x).reverse(), ...xs];
  const out = [];
  for (let z = zStart; z <= zEnd + 1e-6; z += spacing) cols.forEach((x) => out.push([x, z]));
  return out;
}

/* ---------- copper degs with lids and steam ---------- */
export function makeDegs(n, glow) {
  const copper = new THREE.MeshPhongMaterial({ color: '#b5653a', specular: '#ffcf9a', shininess: 60 });
  const brass = goldMat();
  const prof = [[0, 0], [0.32, 0], [0.42, 0.06], [0.46, 0.22], [0.44, 0.38], [0.36, 0.48], [0.38, 0.5], [0, 0.5]].map(([x, y]) => new THREE.Vector2(x, y));
  const potGeo = new THREE.LatheGeometry(prof, 32);
  const lidGeo = new THREE.SphereGeometry(0.38, 24, 8, 0, Math.PI * 2, 0, Math.PI / 2.6);
  const group = new THREE.Group();
  const degs = [];
  for (let i = 0; i < n; i++) {
    const g = new THREE.Group();
    const pot = new THREE.Mesh(potGeo, copper);
    const lid = new THREE.Mesh(lidGeo, copper); lid.position.y = 0.36; lid.scale.y = 0.6;
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), brass); knob.position.y = 0.6;
    g.add(pot, lid, knob);
    group.add(g);
    degs.push({ g, lid, knob });
  }
  // steam: soft sprites rising and fading above each deg
  const P = n * 22, pos = new Float32Array(P * 3), seed = new Float32Array(P), owner = new Float32Array(P);
  const r = rng(31);
  for (let i = 0; i < P; i++) { seed[i] = r(); owner[i] = Math.floor(i / 22); }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  sg.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  sg.setAttribute('aOwner', new THREE.BufferAttribute(owner, 1));
  const steamU = { uTime: { value: 0 }, uOn: { value: new Array(n).fill(0) }, uOrigin: { value: new Array(n).fill(0).map(() => new THREE.Vector3()) }, uMap: { value: glow }, uPixel: { value: 1 } };
  const steam = new THREE.Points(sg, new THREE.ShaderMaterial({
    uniforms: steamU, transparent: true, depthWrite: false,
    vertexShader: /* glsl */ `
      uniform float uTime, uPixel; uniform float uOn[${n}]; uniform vec3 uOrigin[${n}];
      attribute float aSeed, aOwner; varying float vA;
      void main(){
        int o = int(aOwner + 0.5);
        float t = fract(uTime * 0.22 + aSeed);
        vec3 p = uOrigin[o] + vec3(sin(t * 6.0 + aSeed * 20.0) * 0.12 * t, 0.55 + t * 1.5, cos(t * 5.0 + aSeed * 13.0) * 0.1 * t);
        vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv;
        vA = uOn[o] * sin(3.14159 * t) * 0.32;
        gl_PointSize = (40.0 + 120.0 * t) * uPixel * (4.0 / -mv.z);
      }`,
    fragmentShader: 'uniform sampler2D uMap; varying float vA; void main(){ vec4 c = texture2D(uMap, gl_PointCoord); gl_FragColor = vec4(vec3(0.95), c.a * vA); }',
  }));
  steam.frustumCulled = false;
  group.add(steam);
  return { group, degs, steamU };
}

/* ---------- the stage: a flower wall round an arch, pleated drapes, a sofa for the couple ---------- */
export function makeStage(width = 7.5, { flowers = FLOWERS, seat = '#1b4a40' } = {}) {
  const group = new THREE.Group();
  const gold = goldMat();
  const r = rng(17);
  // the platform: pleated ivory skirt, emerald top, gold trim and a step
  const deck = new THREE.Mesh(new THREE.BoxGeometry(width, 0.5, 3.2), lambert('#e9dfcb'));
  deck.position.y = 0.25;
  const skirt = new THREE.Mesh(drapeGeo(width, 0.5, 5, 0.025), lambert(IVORY, { vertexColors: true }));
  skirt.position.set(0, 0.25, 1.62);
  const top = new THREE.Mesh(new THREE.PlaneGeometry(width - 0.06, 3.16), lambert('#164238'));
  top.rotation.x = -Math.PI / 2; top.position.y = 0.502;
  const trim = new THREE.Mesh(new THREE.BoxGeometry(width + 0.04, 0.05, 0.06), gold); trim.position.set(0, 0.5, 1.64);
  const step = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.25, 0.5), lambert('#164238')); step.position.set(0, 0.125, 1.9);
  group.add(deck, skirt, top, trim, step);
  // the backdrop: pleated ivory behind, framed by drapes swept to each side
  const back = new THREE.Mesh(drapeGeo(width + 0.6, 4.2, 3, 0.05), lambert('#f6efe2', { vertexColors: true, emissive: '#5a3a1a', emissiveIntensity: 0.25 }));
  back.position.set(0, 0.5 + 2.1, -1.55);
  const swag = drapeGeo(1.3, 4.4, 3.4, 0.08, 12);
  const sp = swag.attributes.position;
  for (let i = 0; i < sp.count; i++) { const y = sp.getY(i) + 2.2; sp.setX(i, -0.65 + (sp.getX(i) + 0.65) * (1 - 0.45 * Math.exp(-Math.pow((y - 1.4) / 1.1, 2)))); }
  swag.computeVertexNormals();
  [-1, 1].forEach((s) => { const d = new THREE.Mesh(swag, lambert('#efe4cf', { vertexColors: true, side: THREE.DoubleSide })); d.position.set(s * (width / 2 - 0.35), 0.5 + 2.2, -1.3); d.scale.x = -s; group.add(d); });
  group.add(back);
  // the flower wall: columns rising into an arch, and low clusters at its feet
  const R = Math.min(2.3, width * 0.3), cy = 2.5, spots = [];
  for (let i = 0; i < 640; i++) {
    const t = r(), j = (r() - 0.5) * 0.55;
    if (t < 0.5) { const s = t < 0.25 ? -1 : 1; spots.push([s * (R + j), 0.55 + r() * (cy - 0.55), -1.2 + (r() - 0.5) * 0.3]); }
    else { const a = Math.PI * ((t - 0.5) / 0.5); spots.push([Math.cos(a) * (R + j), cy + Math.sin(a) * (R + j), -1.2 + (r() - 0.5) * 0.3]); }
  }
  for (let i = 0; i < 90; i++) { const s = i % 2 ? -1 : 1; spots.push([s * (width / 2 - 0.4 - r() * 1.2), 0.6 + r() * 0.45, 1.0 + r() * 0.5]); }
  const bloom = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.12, 1), lambert('#ffffff'), spots.length);
  const leafM = new THREE.InstancedMesh(new THREE.SphereGeometry(0.1, 6, 4).scale(1.6, 0.35, 0.8), lambert('#3d6a48'), 200);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color(), sc = new THREE.Vector3(), v = new THREE.Vector3();
  spots.forEach(([x, y, z], i) => {
    q.setFromEuler(e.set(r() * 6, r() * 6, r() * 6)); sc.set(1, 0.75, 1).multiplyScalar(0.75 + r() * 0.7);
    bloom.setMatrixAt(i, m.compose(v.set(x, y, z), q, sc));
    bloom.setColorAt(i, c.set(flowers[Math.floor(r() * flowers.length)]));
  });
  for (let i = 0; i < 200; i++) {
    const [x, y, z] = spots[Math.floor(r() * spots.length)];
    q.setFromEuler(e.set(r() * 6, r() * 6, r() * 6)); sc.setScalar(0.8 + r() * 0.6);
    leafM.setMatrixAt(i, m.compose(v.set(x + (r() - 0.5) * 0.2, y + (r() - 0.5) * 0.2, z - 0.06), q, sc));
  }
  group.add(bloom, leafM);
  // the maharaja sofa: an arched gold back over emerald velvet
  const shape = new THREE.Shape();
  shape.moveTo(-1.25, 0); shape.lineTo(1.25, 0); shape.lineTo(1.25, 0.75); shape.quadraticCurveTo(1.0, 1.05, 0.5, 1.1); shape.quadraticCurveTo(0.2, 1.12, 0, 1.4); shape.quadraticCurveTo(-0.2, 1.12, -0.5, 1.1); shape.quadraticCurveTo(-1.0, 1.05, -1.25, 0.75); shape.lineTo(-1.25, 0);
  const sofaBack = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2, curveSegments: 16 }), gold);
  sofaBack.position.set(0, 0.78, -0.98);
  const velvet = lambert(seat);
  const cushion = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.3, 0.8), velvet); cushion.position.set(0, 0.85, -0.5);
  const backC = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.6, 0.16), velvet); backC.position.set(0, 1.2, -0.84);
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.22, 0.86), gold); base.position.set(0, 0.61, -0.52);
  group.add(sofaBack, cushion, backC, base);
  [-1, 1].forEach((s) => { const arm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.42, 0.8), gold); arm.position.set(s * 1.2, 0.93, -0.5); group.add(arm); });
  // gold urns of flowers at the front corners
  const urnGeo = new THREE.LatheGeometry([[0, 0], [0.16, 0], [0.12, 0.08], [0.1, 0.3], [0.22, 0.55], [0.26, 0.7], [0.2, 0.78], [0, 0.78]].map(([x, y]) => new THREE.Vector2(x, y)), 24);
  const urnFl = flowerBall(0.34, 1.0);
  [-1, 1].forEach((s) => {
    const urn = new THREE.Mesh(urnGeo, gold); urn.position.set(s * (width / 2 - 0.45), 0.5, 1.15);
    const fl = new THREE.Mesh(urnFl, lambert('#ffffff', { vertexColors: true })); fl.position.copy(urn.position);
    group.add(urn, fl);
  });
  return { group };
}

/* lights helper: warm point lights spread under the roof */
export function warmLights(points, color = '#ffb46a') {
  return points.map(([x, y, z]) => { const l = new THREE.PointLight(color, 0, 24, 1.1); l.position.set(x, y, z); return l; });
}
