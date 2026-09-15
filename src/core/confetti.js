import { prefersReducedMotion } from './dom.js';

const DEFAULT = ['🎉', '⭐', '🌟', '🎈', '✨'];

/** Purely decorative, so it is skipped entirely under reduced-motion. */
export function confetti(emoji = DEFAULT, count = 22) {
  if (prefersReducedMotion()) return;
  const layer = document.createElement('div');
  layer.className = 'confetti-layer';
  layer.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < count; i++) {
    const bit = document.createElement('div');
    bit.className = 'confetti';
    bit.textContent = emoji[i % emoji.length];
    bit.style.left = Math.random() * 100 + 'vw';
    bit.style.animationDuration = 1.8 + Math.random() * 1.6 + 's';
    bit.style.animationDelay = Math.random() * 0.4 + 's';
    layer.append(bit);
  }
  document.body.append(layer);
  setTimeout(() => layer.remove(), 4200);
}
