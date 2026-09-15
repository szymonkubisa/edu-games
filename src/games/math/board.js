import { el, clear, prefersReducedMotion } from '../../core/dom.js';
import { blipUp, blipDown } from '../../core/audio.js';

/** Row colours, cycled so each basket/row is visually distinct. */
export const RAMPS = [
  { l: 'var(--teal-l)', m: 'var(--teal)' },
  { l: 'var(--coral-l)', m: 'var(--coral)' },
  { l: 'var(--violet-l)', m: 'var(--violet)' },
  { l: 'var(--sun-l)', m: 'var(--sun)' },
  { l: 'var(--pink-l)', m: 'var(--pink)' }
];

/**
 * Draws groups of countable items.
 * @param {HTMLElement} container
 * @param {{groups:number[], separator?:string, hidden?:boolean, emoji:string, rampOffset?:number}} spec
 * @returns {{items:HTMLElement[], groups:HTMLElement[][]}}
 */
export function buildBoard(container, { groups, separator, hidden = false, emoji, rampOffset = 0 }) {
  clear(container);
  const items = [];
  const perGroup = [];

  groups.forEach((count, g) => {
    if (g > 0 && separator) {
      container.append(el('div.opSign', { text: separator, 'aria-hidden': 'true' }));
    }
    const ramp = RAMPS[(g + rampOffset) % RAMPS.length];
    const basket = el('div.basket');
    basket.style.background = ramp.l;
    basket.style.borderColor = ramp.m;
    const grid = el('div.items');
    grid.style.gridTemplateColumns = `repeat(${Math.min(Math.max(count, 1), 5)}, 38px)`;
    basket.append(grid);
    container.append(basket);

    const mine = [];
    for (let i = 0; i < count; i++) {
      const item = el('div.item', { text: emoji, 'aria-hidden': 'true' });
      if (!hidden) item.classList.add('shown');
      grid.append(item);
      items.push(item);
      mine.push(item);
    }
    perGroup.push(mine);
  });

  return { items, groups: perGroup };
}

const stepDelay = (total, { budget, min, max }) =>
  Math.min(max, Math.max(min, budget / Math.max(total, 1)));

/**
 * Reveals items one at a time so the child can count along.
 * Returns `finish()`, which jumps straight to the end state — that is how the
 * replay becomes skippable instead of a mandatory 2.4 s wait.
 */
export function revealItems(items, { scheduler, token, timing, onStep, onDone, sound = true }) {
  const showAll = () => items.forEach(i => i.classList.add('shown'));

  if (prefersReducedMotion()) {
    showAll();
    onStep?.(items.length);
    onDone?.();
    return { finish() {} };
  }

  const delay = stepDelay(items.length, timing);
  items.forEach((item, i) => {
    scheduler.after(i * delay, () => {
      if (!scheduler.isCurrent(token)) return;
      item.classList.add('shown', 'pop');
      if (sound) blipUp(i + 1);
      onStep?.(i + 1);
      if (i === items.length - 1) onDone?.();
    });
  });

  return {
    finish() {
      showAll();
      onStep?.(items.length);
      onDone?.();
    }
  };
}

/** Greys out the last `count` items one at a time — subtraction's "taking away". */
export function removeItems(items, count, { scheduler, token, timing, onStep, onDone, sound = true }) {
  const total = items.length;
  const removeAll = () => {
    for (let i = 0; i < count; i++) items[total - 1 - i].classList.add('gone');
  };

  if (prefersReducedMotion() || count === 0) {
    removeAll();
    onStep?.(count);
    onDone?.();
    return { finish() {} };
  }

  const delay = stepDelay(count, timing);
  for (let i = 1; i <= count; i++) {
    scheduler.after(timing.lead + i * delay, () => {
      if (!scheduler.isCurrent(token)) return;
      items[total - i].classList.add('gone');
      if (sound) blipDown(i);
      onStep?.(i);
      if (i === count) onDone?.();
    });
  }

  return {
    finish() {
      removeAll();
      onStep?.(count);
      onDone?.();
    }
  };
}

/** `3 × 4 = ?` with each part coloured, as a DOM fragment. */
export function equation(a, op, b, value, { bravo, bravoText } = {}) {
  const frag = document.createDocumentFragment();
  frag.append(
    el('span.a', { text: a }),
    ` ${op} `,
    el('span.b', { text: b }),
    ' = ',
    el('span.c', { text: value == null ? '?' : value })
  );
  if (bravo) frag.append(' ', el('span.ok', { text: bravoText }));
  return frag;
}
