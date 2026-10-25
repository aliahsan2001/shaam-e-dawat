/* Photos lean gently toward the cursor as it moves over them: a slow, GPU-only transform, never a
   filter, so images stay sharp. */

import { FINE, REDUCED } from './env.js';

export function initHover() {
  if (!FINE || REDUCED) return;
  let current = null;
  addEventListener('pointermove', (e) => {
    const el = e.target.closest?.('.hover-img');
    if (el !== current) { current?.style.removeProperty('--mx'); current?.style.removeProperty('--my'); current = el; }
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', (((e.clientX - r.left) / r.width) - 0.5).toFixed(3));
    el.style.setProperty('--my', (((e.clientY - r.top) / r.height) - 0.5).toFixed(3));
  }, { passive: true });
}
