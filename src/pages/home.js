/* Home: the evening of the feast. A 3D marquee at dusk; as you scroll the fairy lights come on,
   tables fill and degs begin to steam, until it's a full celebration at night. Lighter devices
   get the same evening as a series of stills that change as you scroll. */

import { TIERS, VENUES, img, rs } from '../data.js';
import { esc, idle } from '../core/ui.js';
import { LITE, REDUCED } from '../core/env.js';
import { ScrollTrigger } from '../core/motion.js';

const FRAMES = 8;

export async function mount(root, ctx) {
  const cleanups = [];
  const q = (s) => root.querySelector(s);

  /* ---------- below the evening ---------- */
  q('[data-tiers]').innerHTML = TIERS.map((t) => `
    <a class="tier-card${t.popular ? ' is-popular' : ''}" href="/menus#${t.id}" data-reveal>
      <figure class="hover-img"><img src="${img(t.photo, 640)}" alt="" loading="lazy" onload="this.classList.add('is-loaded')"></figure>
      <div class="tier-body">
        <p class="label">${esc(t.label)}${t.popular ? ' · most booked' : ''}</p>
        <h3 class="display">${esc(t.name)}</h3>
        <p>${esc(t.line)}</p>
        <p class="tier-price"><b>${rs(t.price)}</b> per head</p>
      </div>
    </a>`).join('');
  q('[data-events]').innerHTML = VENUES.map((v, i) => `
    <a class="ev-card" href="/events#${v.id}" data-reveal>
      <figure class="hover-img"><img src="${img(v.photo, 1280)}" alt="" loading="lazy" onload="this.classList.add('is-loaded')"></figure>
      <span class="ev-num">0${i + 1}</span>
      <h3 class="display">${esc(v.name)}</h3>
      <p>${esc(v.line)}</p>
      <p class="label">${esc(v.guests)} guests</p>
    </a>`).join('');

  /* ---------- the evening ---------- */
  const sec = q('[data-evening]');
  const chapters = [...root.querySelectorAll('[data-ch]')];
  const clock = q('[data-clock]'), bar = q('[data-clock-bar]');
  let scene = null, ch = -1;
  function apply(p) {
    scene?.setProgress(p);
    const c = p < 0.12 ? 0 : p < 0.36 ? 1 : p < 0.62 ? 2 : 3;
    if (c !== ch) { ch = c; chapters.forEach((el, i) => el.classList.toggle('is-on', i === c)); }
    const mins = 18 * 60 + 40 + Math.round(p * 170); // 6:40 pm to 9:30 pm
    const h = Math.floor(mins / 60), m = mins % 60;
    clock.textContent = `${h > 12 ? h - 12 : h}:${String(m).padStart(2, '0')} pm`;
    bar.style.transform = `scaleX(${p.toFixed(3)})`;
  }

  if (!LITE) {
    idle().then(async () => {
      if (!root.isConnected) return;
      try {
        const { mountVenue } = await import('../three/venue.js');
        if (!root.isConnected) return;
        scene = mountVenue(q('[data-venue]'), { mode: 'home', small: innerWidth < 760, dish: TIERS[1].dish });
        cleanups.push(() => scene.dispose());
        apply(ScrollTrigger.getById?.('evening')?.progress || 0);
      } catch (err) {
        console.warn('Venue 3D unavailable, using stills', err);
        document.documentElement.classList.add('lite');
        stills();
      }
    });
  } else stills();

  // lighter devices: illustrated stills of the same evening, crossfaded as you scroll
  function stills() {
    const set = innerWidth / innerHeight < 1 ? 'p' : 'l';
    const box = q('[data-stills]');
    box.innerHTML = Array.from({ length: FRAMES }, (_, i) => `<img src="/img/evening/${set}${i}.webp" alt="" ${i > 1 ? 'loading="lazy"' : ''} decoding="async">`).join('');
    const imgs = [...box.children];
    scene = { setProgress: (p) => { const f = p * (FRAMES - 1), a = Math.floor(f), t = f - a; imgs.forEach((im, i) => (im.style.opacity = i === a ? 1 : i === a + 1 ? t : 0)); } };
  }

  const devP = import.meta.env.DEV && new URLSearchParams(location.search).get('eveP');
  if (devP) { const p = Number(devP); const t = setInterval(() => { if (scene) { apply(p); scene.setProgress(p, true); } }, 300); cleanups.push(() => clearInterval(t)); }
  else if (REDUCED) apply(1);
  else ctx.add(() => ScrollTrigger.create({ id: 'evening', trigger: sec, start: 'top top', end: 'bottom bottom', scrub: 0.8, onUpdate: (s) => apply(s.progress) }));
  apply(0);

  return () => cleanups.forEach((fn) => fn());
}
