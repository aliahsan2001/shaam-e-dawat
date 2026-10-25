/* Shared reading effects: headings that rise line by line, and text that sharpens from a blur
   as it scrolls into view. Both fall back to plain text if frames stall or motion is reduced. */

import SplitType from 'split-type';
import { gsap, ScrollTrigger } from './motion.js';
import { REDUCED } from './env.js';

export function riseHeadings(root) {
  if (REDUCED) return;
  root.querySelectorAll('[data-rise]').forEach((el) => {
    const split = new SplitType(el, { types: 'lines,words' });
    split.lines?.forEach((l) => l.classList.add('rise-line'));
    const tw = gsap.from(split.words, {
      yPercent: 110, duration: 1.2, stagger: 0.04, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
    setTimeout(() => { if (tw.progress() === 0 && el.getBoundingClientRect().top < innerHeight) tw.progress(1); }, 2500);
  });
}

export function sharpen(root) {
  root.querySelectorAll('[data-sharpen]').forEach((el) => {
    if (REDUCED) return;
    gsap.fromTo(el, { filter: 'blur(10px)', opacity: 0.25 }, {
      filter: 'blur(0px)', opacity: 1, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 92%', end: 'top 55%', scrub: 0.6 },
    });
  });
  ScrollTrigger.refresh();
}
