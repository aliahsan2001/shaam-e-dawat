/* Menus: three covered degs on a long table. Choose one and its lid lifts with a puff of steam to
   reveal the menu. Tabs below the degs do the same, for keyboards and phones. */

import { TIERS, img, rs } from '../data.js';
import { esc, idle } from '../core/ui.js';
import { LITE, REDUCED } from '../core/env.js';
import { gsap } from '../core/motion.js';

export async function mount(root) {
  const cleanups = [];
  const q = (s) => root.querySelector(s);
  const pre = TIERS.findIndex((t) => `#${t.id}` === location.hash);
  let active = -1, degs = null;

  q('[data-tabs]').innerHTML = TIERS.map((t, i) => `
    <button type="button" class="deg-tab" role="tab" id="tab-${t.id}" aria-selected="false" aria-controls="menu-panel" data-tab="${i}">
      <span class="label">${esc(t.label)}</span><b class="display">${esc(t.name)}</b><span>${rs(t.price)} per head</span>
    </button>`).join('');

  function show(i) {
    if (i === active) return;
    active = i;
    degs?.open(i);
    const t = TIERS[i];
    root.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(Number(b.dataset.tab) === i)));
    const box = q('[data-menu]');
    box.innerHTML = `
      <div class="menu-grid" id="menu-panel" role="tabpanel" aria-labelledby="tab-${t.id}">
        <div class="menu-side">
          <figure class="hover-img"><img src="${img(t.photo, 1280)}" alt="" onload="this.classList.add('is-loaded')"></figure>
          <p class="label">${esc(t.label)}${t.popular ? ' · most booked' : ''}</p>
          <h2 class="display">${esc(t.name)}</h2>
          <p class="lead">${esc(t.line)}</p>
          <p class="menu-price"><b>${rs(t.price)}</b> per head</p>
          <a class="btn btn-gold" href="/quote?tier=${t.id}"><span>Price ${esc(t.name)} for my event</span></a>
        </div>
        <div class="courses">${t.courses.map(([c, dishes]) => `
          <div class="course"><h3 class="label">${esc(c)}</h3><ul>${dishes.map((d) => `<li>${esc(d)}</li>`).join('')}</ul></div>`).join('')}
          <div class="mehndi-rule" aria-hidden="true"></div>
          <p class="note">Every menu includes plates, cutlery, glassware, buffet décor, serving staff and cleanup. Ask us to swap any dish.</p>
        </div>
      </div>`;
    if (!REDUCED) gsap.from(box.querySelectorAll('.course, .menu-side > *'), { y: 16, opacity: 0, duration: 0.8, stagger: 0.04, ease: 'expo.out', clearProps: 'all' });
    history.replaceState(history.state, '', `/menus#${t.id}`);
  }
  q('[data-tabs]').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) show(Number(b.dataset.tab)); });

  const stage = q('[data-degs-stage]');
  if (!LITE) {
    idle().then(async () => {
      if (!root.isConnected) return;
      try {
        const { mountDegs } = await import('../three/degs.js');
        if (!root.isConnected) return;
        degs = mountDegs(q('[data-degs]'), { count: TIERS.length, small: innerWidth < 760, onPick: show });
        cleanups.push(() => degs.dispose());
        if (active >= 0) { const a = active; active = -1; setTimeout(() => show(a), 400); }
      } catch (err) {
        console.warn('Degs unavailable', err);
        stage.hidden = true;
      }
    });
  } else stage.hidden = true;

  /* ---------- compare table ---------- */
  const rows = TIERS[0].courses.map(([c]) => c);
  q('[data-cmp]').insertAdjacentHTML('beforeend', `
    <thead><tr><th scope="col"><span class="sr-only">Course</span></th>${TIERS.map((t) => `<th scope="col"><span class="display">${esc(t.name)}</span><small>${rs(t.price)} per head</small></th>`).join('')}</tr></thead>
    <tbody>${rows.map((c, r) => `<tr><th scope="row">${esc(c)}</th>${TIERS.map((t) => `<td>${t.courses[r][1].map(esc).join('<br>')}</td>`).join('')}</tr>`).join('')}</tbody>`);

  show(pre >= 0 ? pre : 1);
  return () => cleanups.forEach((fn) => fn());
}
