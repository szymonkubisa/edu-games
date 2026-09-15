import store, { BADGES } from '../core/store.js';
import { $, replay } from '../core/dom.js';
import { fanfare } from '../core/audio.js';
import { confetti } from '../core/confetti.js';
import { toast } from './toast.js';
import { getLang } from '../core/i18n.js';

/**
 * Star counter for one game, wired to the store.
 *
 * `addStar` also surfaces badge unlocks where they happen. The store has always
 * returned `newBadges`; until now nothing read it, so a child crossed 10 stars
 * mid-game and found out only by navigating back to the menu.
 */
export function createStarCounter(game, { countId = 'starN', boxId = 'starBox', celebrate } = {}) {
  const countEl = $(countId);
  const boxEl = $(boxId) || countEl?.parentElement;

  function paint() {
    if (countEl) countEl.textContent = store.stars(game);
  }

  paint();
  store.subscribe(paint);

  return {
    get value() {
      return store.stars(game);
    },
    paint,
    /** @returns {{count:number,total:number,newBadges:Array}} */
    add({ silent = false } = {}) {
      const result = store.addStar(game);
      paint();
      if (boxEl) replay(boxEl, 'wob');
      if (!silent) {
        fanfare();
        confetti(celebrate);
      }
      for (const badge of result.newBadges) {
        toast(badge.em, badgeLabel(badge));
      }
      return result;
    }
  };
}

/** Self-graded practice counter — deliberately does not feed badges. */
export function createPracticeCounter(game, { countId = 'practiceN' } = {}) {
  const countEl = $(countId);
  const paint = () => {
    if (countEl) countEl.textContent = store.practice(game);
  };
  paint();
  store.subscribe(paint);
  return {
    paint,
    add() {
      const r = store.addPractice(game);
      paint();
      if (countEl?.parentElement) replay(countEl.parentElement, 'wob');
      return r;
    }
  };
}

export const badgeLabel = badge => (getLang() === 'pl' ? badge.pl : badge.en);
export { BADGES };
