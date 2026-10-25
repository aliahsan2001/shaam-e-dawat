/* Get a quote: move the guest slider and the 3D hall grows and fills with tables and chairs, from
   an intimate 50 to a 1,000-guest wedding. Switching the menu tier changes the dishes on the
   tables, and the estimate counts up live. The enquiry arrives with everything we need. */

import { TIERS, EVENTS, ADDONS, CONFIG, estimate, rs, lakh } from '../data.js';
import { esc, idle, waLink } from '../core/ui.js';
import { LITE, REDUCED } from '../core/env.js';
import { gsap } from '../core/motion.js';

export async function mount(root) {
  const cleanups = [];
  const q = (s) => root.querySelector(s);
  const form = q('[data-quote]');
  const params = new URLSearchParams(location.search);
  const state = {
    guests: 300,
    tier: TIERS.some((t) => t.id === params.get('tier')) ? params.get('tier') : 'royal',
    event: EVENTS.some((e) => e.id === params.get('event')) ? params.get('event') : 'wedding',
    addons: [],
  };

  q('[data-tiers]').innerHTML = TIERS.map((t) => `<label class="tier-opt"><input type="radio" name="tier" value="${t.id}" ${t.id === state.tier ? 'checked' : ''}><b>${esc(t.name)}</b><span>${rs(t.price)} per head</span></label>`).join('');
  q('[data-events]').innerHTML = EVENTS.map((e) => `<button type="button" class="chip" data-ev="${e.id}" aria-pressed="${e.id === state.event}">${esc(e.name)}</button>`).join('');
  q('[data-addons]').innerHTML = ADDONS.map((a) => `<label class="addon"><span><input type="checkbox" name="addon" value="${a.id}">${esc(a.name)}</span><small>${a.perHead ? `+${rs(a.perHead)} per head` : `+${lakh(a.flat)}`}</small></label>`).join('');

  /* ---------- the hall ---------- */
  let hall = null;
  const dots = q('[data-dots]');
  dots.innerHTML = Array.from({ length: 100 }, () => '<i></i>').join('');
  if (!LITE) {
    idle().then(async () => {
      if (!root.isConnected) return;
      try {
        const { mountVenue } = await import('../three/venue.js');
        if (!root.isConnected) return;
        hall = mountVenue(q('[data-hall]'), { mode: 'quote', guests: state.guests, small: innerWidth < 760, dish: TIERS.find((t) => t.id === state.tier).dish });
        cleanups.push(() => hall.dispose());
      } catch (err) {
        console.warn('Hall unavailable, drawing tables flat', err);
        document.documentElement.classList.add('lite');
      }
    });
  }

  /* ---------- the estimate ---------- */
  const shown = { low: 0, high: 0 };
  const rangeEl = q('[data-range]');
  const write = (lo, hi) => (rangeEl.innerHTML = `${lakh(lo)} <span>to</span> ${lakh(hi)}`);
  let guestTimer;
  function update(what) {
    const e = estimate(state);
    const tables = Math.ceil(state.guests / 10);
    q('[data-guests-out]').textContent = state.guests.toLocaleString('en-PK');
    q('[data-hall-guests]').textContent = state.guests.toLocaleString('en-PK');
    q('[data-hall-tables]').textContent = `${tables} tables of ten`;
    q('[data-guests]').style.setProperty('--fill', `${((state.guests - CONFIG.minGuests) / (CONFIG.maxGuests - CONFIG.minGuests)) * 100}%`);
    q('[data-per]').textContent = `About ${rs(e.perHead)} per head for ${state.guests.toLocaleString('en-PK')} guests${state.guests >= 500 ? ', with 5% off for a large event' : ''}. Includes staff, crockery and buffet setup.`;
    dots.querySelectorAll('i').forEach((d, i) => d.classList.toggle('on', i < Math.round(tables / 1)));
    if (what === 'guests') { clearTimeout(guestTimer); guestTimer = setTimeout(() => hall?.setGuests(state.guests), 60); }
    if (what === 'tier') hall?.setTier(TIERS.find((t) => t.id === state.tier).dish);
    if (REDUCED) write(e.low, e.high);
    else gsap.to(shown, { low: e.low, high: e.high, duration: 0.8, ease: 'expo.out', overwrite: true, onUpdate: () => write(Math.round(shown.low / 1000) * 1000, Math.round(shown.high / 1000) * 1000), onComplete: () => write(e.low, e.high) });
    clearTimeout(update.t); update.t = setTimeout(() => write(e.low, e.high), 1000); // land even if frames stall
  }
  q('[data-guests]').addEventListener('input', (e) => { state.guests = Number(e.target.value); update('guests'); });
  form.addEventListener('change', (e) => {
    if (e.target.name === 'tier') { state.tier = e.target.value; update('tier'); }
    if (e.target.name === 'addon') { state.addons = [...form.querySelectorAll('[name=addon]:checked')].map((x) => x.value); update(); }
  });
  q('[data-events]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-ev]');
    if (!b) return;
    state.event = b.dataset.ev;
    q('[data-events]').querySelectorAll('[data-ev]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    update();
  });

  /* ---------- send ---------- */
  const min = new Date(); min.setDate(min.getDate() + 3);
  form.elements.date.min = min.toISOString().slice(0, 10);
  const RULES = {
    name: (v) => (v.trim().length < 2 ? 'Please add your name.' : ''),
    phone: (v) => (/^(\+?92|0)3\d{2}[\s-]?\d{7}$/.test(v.trim()) ? '' : 'Try a mobile like 03xx xxxxxxx.'),
    date: (v) => (!v ? 'Which day is the event?' : v < form.elements.date.min ? 'We need at least three days to plan.' : ''),
  };
  const check = (n) => {
    const el = form.elements[n], msg = RULES[n](el.value);
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (msg) el.setAttribute('aria-describedby', `e-${n}`); else el.removeAttribute('aria-describedby');
    q(`#e-${n}`).textContent = msg;
    return msg;
  };
  form.addEventListener('input', (e) => { if (e.target.getAttribute('aria-invalid') === 'true') check(e.target.name); });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const bad = Object.keys(RULES).filter((n) => check(n));
    if (bad.length) { form.elements[bad[0]].focus(); return; }
    const d = Object.fromEntries(new FormData(form));
    const t = TIERS.find((x) => x.id === state.tier), ev = EVENTS.find((x) => x.id === state.event), est = estimate(state);
    const ref = 'SD-' + Math.random().toString(36).slice(2, 7).toUpperCase();
    const extras = ADDONS.filter((a) => state.addons.includes(a.id)).map((a) => a.name);
    const when = new Date(d.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const msg = [`Catering enquiry ${ref}`, `${ev.name}, ${when}`, `${state.guests} guests · ${t.name} menu`, extras.length && `Extras: ${extras.join(', ')}`, `Estimate shown: ${lakh(est.low)} – ${lakh(est.high)}`, d.venue && `Venue: ${d.venue}`, `Name: ${d.name}`, `Mobile: ${d.phone}`].filter(Boolean).join('\n');
    const done = q('[data-done]');
    done.innerHTML = `
      <p class="label">Enquiry received · <span class="ref">${ref}</span></p>
      <h2 class="display">Shukriya, <em>${esc(d.name.trim().split(' ')[0])}.</em></h2>
      <p>${state.guests} guests for a ${esc(ev.name.toLowerCase())} on ${esc(when)}, with the ${esc(t.name)} menu. Our events team will call ${esc(d.phone)} within the day with a firm price and a tasting date.</p>
      <a class="btn btn-gold" href="${waLink(msg)}" target="_blank" rel="noopener"><span>Send it on WhatsApp</span></a>
      <p class="label">A concept site: nothing was sent.</p>`;
    form.hidden = true;
    done.hidden = false;
    done.focus();
    if (!REDUCED) gsap.from(done.children, { y: 16, opacity: 0, duration: 0.8, stagger: 0.07, clearProps: 'all' });
  });

  update();
  return () => { clearTimeout(guestTimer); cleanups.forEach((fn) => fn()); };
}
