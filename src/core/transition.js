/* Page transition: gold-embroidered curtains draw closed, then part to reveal the next page.
   CSS does the motion; timers resolve the promises, so a stalled frame never hangs navigation. */

import { REDUCED } from './env.js';

let el;
function build() {
  el = document.createElement('div');
  el.className = 'curtains';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<span class="curtain-panel curtain-l"></span><span class="curtain-panel curtain-r"></span>';
  document.body.appendChild(el);
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const T = () => (REDUCED ? 260 : 780);

export async function cover() {
  if (!el) build();
  el.classList.add('is-active');
  void el.offsetWidth;
  el.classList.add('is-shut');
  await wait(T());
}

export async function reveal() {
  if (!el) return;
  await wait(REDUCED ? 0 : 120); // a beat with the curtains closed
  el.classList.remove('is-shut');
  await wait(T());
  el.classList.remove('is-active');
}
