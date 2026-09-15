import '../ui/menu.css';

import store, { BADGES } from '../core/store.js';
import { createI18n, getLang, toggleLang, otherLangLabel } from '../core/i18n.js';
import { el, clear } from '../core/dom.js';
import { toast } from '../ui/toast.js';
import { menuDict } from '../content/menu.js';
import { registerServiceWorker } from '../core/pwa.js';

const t = createI18n(menuDict);
const q = sel => document.querySelector(sel);

function paintProgress() {
  const snapshot = store.snapshot();
  q('#starN').textContent = snapshot.totalStars;
  q('#practiceN').textContent = snapshot.practice.reading + snapshot.practice.math;
  q('[data-math-stars]').textContent = t('gameStars', snapshot.stars.math);
  q('[data-reading-stars]').textContent = t('gameStars', snapshot.stars.reading);
  paintBadges(store.badges());
}

function paintBadges(earned) {
  const box = q('[data-badges]');
  clear(box);
  for (const badge of BADGES) {
    const got = earned.includes(badge.id);
    const label = getLang() === 'pl' ? badge.pl : badge.en;
    box.append(
      el(
        'li.badge' + (got ? '.got' : ''),
        { 'aria-label': `${label}: ${t(got ? 'badgeEarned' : 'badgeLocked')}` },
        el('span.em', { text: badge.em, 'aria-hidden': 'true' }),
        el('span.lbl', { text: label, 'aria-hidden': 'true' })
      )
    );
  }
}

function applyLanguage() {
  document.title = t('title').replace(/^\S+\s/, '');
  q('[data-title]').textContent = t('title');
  q('[data-description]').setAttribute('content', t('pageDescription'));
  q('[data-lang]').textContent = otherLangLabel();
  q('[data-lang]').setAttribute('aria-label', t('langSwitch'));
  q('[data-math-name]').textContent = t('math');
  q('[data-math-sub]').textContent = t('mathSub');
  q('[data-reading-name]').textContent = t('reading');
  q('[data-reading-sub]').textContent = t('readingSub');
  q('[data-games]').setAttribute('aria-label', t('gamesLabel'));
  q('[data-badges-title]').textContent = t('badges');
  q('[data-stars-label]').textContent = t('starsLabel');
  q('[data-practice-label]').textContent = t('practiceLabel');
  q('#starBox').setAttribute('aria-label', t('starsLabel'));
  q('#practiceBox').setAttribute('aria-label', t('practiceLabel'));
  q('[data-about]').textContent = t('about');
  q('[data-reset]').textContent = t('reset');
  q('[data-reset-title]').textContent = t('resetConfirmTitle');
  q('[data-reset-body]').textContent = t('resetConfirmBody');
  q('[data-reset-confirm]').textContent = t('resetYes');
  q('[data-reset-cancel]').textContent = t('resetNo');
  paintProgress();
}

q('[data-lang]').addEventListener('click', () => {
  toggleLang();
  applyLanguage();
});

/* Reset used to go through `confirm()` — a native dialog a child taps straight
   through. This one is styled, focus-trapped and escapable. */
const dialog = q('[data-reset-dialog]');
q('[data-reset]').addEventListener('click', () => dialog.showModal());
q('[data-reset-cancel]').addEventListener('click', () => dialog.close());
q('[data-reset-confirm]').addEventListener('click', () => {
  store.reset();
  dialog.close();
  paintProgress();
  toast('🧹', t('resetDone'));
});

applyLanguage();
store.subscribe(paintProgress);

// A bfcache restore does not re-run this script; without this the star count
// shown after the browser back button is whatever it was when the page froze.
window.addEventListener('pageshow', e => {
  if (e.persisted) store.refresh();
});
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) store.refresh();
});

registerServiceWorker();
