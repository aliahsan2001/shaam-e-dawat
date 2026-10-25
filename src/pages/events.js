/* Events: drag sideways across one wide venue (a wedding stage, a corporate dinner and a birthday
   setup, each with its own lighting), then the details of each, with real photographs. */

import { VENUES, img } from '../data.js';
import { esc, idle } from '../core/ui.js';
import { LITE } from '../core/env.js';

export async function mount(root) {
  const cleanups = [];
  const q = (s) => root.querySelector(s);

  q('[data-ev-list]').innerHTML = VENUES.map((v, i) => `
    <article class="ev-item" id="${v.id}" data-reveal>
      <figure class="hover-img"><img src="${img(v.photo, 1280)}" alt="" loading="lazy" onload="this.classList.add('is-loaded')"></figure>
      <div>
        <p class="eyebrow">0${i + 1}</p>
        <h2 class="display">${esc(v.name)}</h2>
        <p class="lead">${esc(v.line)}</p>
        <dl><div><dt>Guests</dt><dd>${esc(v.guests)}</dd></div><div><dt>Menus we suggest</dt><dd>${esc(v.tiers)}</dd></div></dl>
        <a class="btn btn-gold" href="/quote?event=${v.id === 'birthday' ? 'private' : v.id}"><span>Price this evening</span></a>
      </div>
    </article>`).join('');

  const now = q('[data-ev-now]'), dots = q('[data-ev-dots]');
  dots.innerHTML = VENUES.map((v, i) => `<button type="button" class="ev-dot" data-go="${i}" aria-pressed="${i === 0}">${esc(v.name.replace('The ', ''))}</button>`).join('');
  const show = (i) => {
    const v = VENUES[i];
    now.innerHTML = `<p class="label">Setup 0${i + 1} of 03</p><h2 class="display">${esc(v.name)}</h2><p>${esc(v.line)}</p><dl><div><dt>Guests</dt><dd>${esc(v.guests)}</dd></div><div><dt>Menus</dt><dd>${esc(v.tiers)}</dd></div></dl>`;
    dots.querySelectorAll('[data-go]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.go) === i)));
  };
  show(0);

  let wide = null;
  dots.addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (b) { wide ? wide.go(Number(b.dataset.go)) : show(Number(b.dataset.go)); } });
  if (!LITE) {
    idle().then(async () => {
      if (!root.isConnected) return;
      try {
        const { mountWide } = await import('../three/wide.js');
        if (!root.isConnected) return;
        wide = mountWide(q('[data-wide]'), { small: innerWidth < 760, onChange: show });
        cleanups.push(() => wide.dispose());
        const pre = VENUES.findIndex((v) => `#${v.id}` === location.hash);
        if (pre > 0) wide.go(pre);
      } catch (err) {
        console.warn('Venue unavailable', err);
        q('[data-wide-stage]').hidden = true;
      }
    });
  } else q('[data-wide-stage]').hidden = true;

  return () => cleanups.forEach((fn) => fn());
}
