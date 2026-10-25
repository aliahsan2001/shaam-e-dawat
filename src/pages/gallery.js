/* Gallery: past events orbit a lit centrepiece (ring or spiral). The full album sits below, with
   filters and a lightbox; phones and lighter devices get the album only. */

import { GALLERY, img } from '../data.js';
import { esc, idle } from '../core/ui.js';
import { LITE } from '../core/env.js';

const ITEMS = GALLERY.map(([id, cat, title]) => ({ id, cat, title, src: img(id, 640), big: img(id, 1280) }));

export async function mount(root) {
  const cleanups = [];
  const q = (s) => root.querySelector(s);
  const N = ITEMS.length;
  q('[data-n]').textContent = N;
  const show = (i) => { q('[data-i]').textContent = i + 1; q('[data-now]').innerHTML = `<p class="label">${esc(ITEMS[i].cat)}</p><p class="display">${esc(ITEMS[i].title)}</p>`; };
  show(0);

  /* ---------- lightbox ---------- */
  const lb = q('[data-lightbox]');
  const open = (i) => {
    q('[data-lb-img]').src = ITEMS[i].big;
    q('[data-lb-img]').alt = ITEMS[i].title;
    q('[data-lb-cap]').textContent = ITEMS[i].title;
    lb.hidden = false;
    requestAnimationFrame(() => lb.classList.add('is-open'));
    lb.querySelector('[data-lb-close]').focus();
  };
  const close = () => { lb.classList.remove('is-open'); setTimeout(() => (lb.hidden = true), 400); };
  lb.addEventListener('click', (e) => { if (e.target === lb || e.target.closest('[data-lb-close]')) close(); });
  const onKey = (e) => { if (e.key === 'Escape' && !lb.hidden) close(); };
  addEventListener('keydown', onKey);
  cleanups.push(() => removeEventListener('keydown', onKey));

  /* ---------- the orbit ---------- */
  let ring = null, idx = 0;
  q('[data-prev]').addEventListener('click', () => (ring ? ring.prev() : (idx = (idx - 1 + N) % N, show(idx))));
  q('[data-next]').addEventListener('click', () => (ring ? ring.next() : (idx = (idx + 1) % N, show(idx))));
  root.querySelectorAll('[data-layout]').forEach((b) => b.addEventListener('click', () => {
    root.querySelectorAll('[data-layout]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    ring?.setLayout(b.dataset.layout);
  }));
  if (!LITE && innerWidth >= 760) {
    idle().then(async () => {
      if (!root.isConnected) return;
      try {
        const { mountGallery } = await import('../three/gallery.js');
        if (!root.isConnected) return;
        ring = mountGallery(q('[data-orbit]'), { items: ITEMS, small: innerWidth < 1000, onChange: (i) => { idx = i; show(i); }, onOpen: open });
        cleanups.push(() => ring.dispose());
      } catch (err) {
        console.warn('Orbit unavailable', err);
        root.classList.add('no-orbit');
      }
    });
  } else root.classList.add('no-orbit');

  /* ---------- album ---------- */
  const cats = ['All', ...new Set(ITEMS.map((x) => x.cat))];
  const filters = q('[data-filters]');
  filters.innerHTML = cats.map((c, i) => `<button type="button" class="chip" data-f="${esc(c)}" aria-pressed="${i === 0}">${esc(c)}</button>`).join('');
  const album = q('[data-album]');
  const draw = (f) => {
    album.innerHTML = ITEMS.map((x, i) => (f === 'All' || x.cat === f ? `<button type="button" class="hover-img" data-open="${i}"><img src="${x.src}" alt="${esc(x.title)}" loading="lazy" onload="this.classList.add('is-loaded')"><span class="label">${esc(x.cat)}</span></button>` : '')).join('');
  };
  filters.addEventListener('click', (e) => { const b = e.target.closest('[data-f]'); if (!b) return; filters.querySelectorAll('[data-f]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); draw(b.dataset.f); });
  album.addEventListener('click', (e) => { const b = e.target.closest('[data-open]'); if (b) open(Number(b.dataset.open)); });
  draw('All');

  return () => cleanups.forEach((fn) => fn());
}
