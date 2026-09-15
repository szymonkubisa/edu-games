import { el, clear } from '../core/dom.js';

/**
 * A session arc. The maths game used to be an endless stream with no finish
 * line; children need one. Ten questions fill ten dots, then a celebration.
 */
export function createRound(container, { length = 10, onComplete, label } = {}) {
  let done = 0;
  let streak = 0;
  let best = 0;

  const dots = el('div.dots', { role: 'img' });
  const streakEl = el('span.streak');
  container.replaceChildren(dots, streakEl);

  function paint() {
    clear(dots);
    for (let i = 0; i < length; i++) dots.append(el('span.dot' + (i < done ? '.done' : '')));
    dots.setAttribute('aria-label', label ? label(done, length) : `${done}/${length}`);
    streakEl.textContent = streak >= 2 ? `🔥 ${streak}` : '';
    streakEl.classList.toggle('hot', streak >= 3);
  }

  paint();

  return {
    get progress() {
      return { done, length, streak, best };
    },
    hit() {
      done++;
      streak++;
      best = Math.max(best, streak);
      paint();
      if (done >= length) {
        const summary = { length, streak, best };
        done = 0;
        streak = 0;
        paint();
        onComplete?.(summary);
        return { completed: true, ...summary };
      }
      return { completed: false, streak };
    },
    miss() {
      streak = 0;
      paint();
    },
    reset() {
      done = 0;
      streak = 0;
      paint();
    },
    setLabel(fn) {
      label = fn;
      paint();
    }
  };
}
