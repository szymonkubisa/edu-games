import '../ui/math.css';

import store from '../core/store.js';
import { createI18n, getLang, toggleLang, plural, otherLangLabel } from '../core/i18n.js';
import { $, el, clear } from '../core/dom.js';
import { isSoundOn, toggleSound, fanfare } from '../core/audio.js';
import { confetti } from '../core/confetti.js';
import { createTabs } from '../ui/tabs.js';
import { createStarCounter } from '../ui/stars.js';
import { createRound } from '../ui/round.js';
import { createCountingMode } from '../games/math/countingMode.js';
import { createGridMode } from '../games/math/grid.js';
import { THEMES, DEFAULT_THEME, BASKET_FORMS, ROW_FORMS, mathDict } from '../content/math.js';
import { registerServiceWorker } from '../core/pwa.js';

const t = createI18n(mathDict);
const q = sel => document.querySelector(sel);

/* ---------- theme (the countable thing) ---------- */

let themeKey = store.get('mathTheme', DEFAULT_THEME);
if (!THEMES[themeKey]) themeKey = DEFAULT_THEME;

const theme = () => THEMES[themeKey];
const themeForms = () => theme()[getLang()] || theme().pl;

/** Grammar helpers handed to the copy so hints read naturally in both languages. */
const copyCtx = () => ({
  emoji: theme().em,
  thing: n => plural(n, themeForms()),
  basket: n => plural(n, BASKET_FORMS[getLang()] || BASKET_FORMS.pl),
  row: n => plural(n, ROW_FORMS[getLang()] || ROW_FORMS.pl)
});

/* ---------- session round ---------- */

const roundDone = q('[data-rounddone]');
const sections = [...document.querySelectorAll('[data-section]')];

const round = createRound(q('[data-round]'), {
  length: 10,
  label: (done, total) => t('roundLabel', done, total),
  onComplete: ({ best }) => {
    fanfare();
    confetti(['🏅', '🎉', '⭐', '🌟', theme().em]);
    q('[data-rounddone-msg]').textContent = t('roundDone', best);
    q('[data-rounddone-again]').textContent = t('roundAgain');
    sections.forEach(s => s.classList.add('hidden'));
    roundDone.classList.remove('hidden');
    q('[data-rounddone-again]').focus();
  }
});

q('[data-rounddone-again]').addEventListener('click', () => {
  roundDone.classList.add('hidden');
  showActiveSection();
  modes[current]?.refresh();
});

function showActiveSection() {
  sections.forEach(s => s.classList.toggle('hidden', s.dataset.section !== current));
}

/* ---------- modes ---------- */

const starCounter = createStarCounter('math', { celebrate: ['🎉', '⭐', '🌟', '🎈', '✨'] });

const shared = { t, emoji: () => theme().em, starCounter, round };

const timing = {
  reveal: { budget: 2400, min: 28, max: 120 },
  remove: { budget: 2000, min: 200, max: 550, lead: 400 }
};

const modes = {
  add: createCountingMode({
    ...shared,
    root: q('[data-section="add"]'),
    kind: 'add',
    op: '+',
    range: { aMin: 1, aMax: 6, bMin: 1, bMax: 6 },
    answer: (a, b) => a + b,
    board: (a, b) => ({ groups: [a, b], separator: '+', animation: 'reveal' }),
    timing,
    hints: {
      explore: (a, b) => t('addExplore', a, b, copyCtx()),
      quiz: (a, b) => t('addQuiz', a, b, copyCtx()),
      wrong: (a, b) => t('addWrong', a, b, copyCtx())
    },
    stepperLabels: () => ({ a: t('addLabelA'), b: t('addLabelB') })
  }),

  sub: createCountingMode({
    ...shared,
    root: q('[data-section="sub"]'),
    kind: 'sub',
    op: '−',
    range: { aMin: 3, aMax: 10, bMin: 1, bMax: 9, filter: (a, b) => b < a },
    answer: (a, b) => a - b,
    board: (a, b) => ({ groups: [a], animation: 'remove', removeCount: b, rampOffset: 2 }),
    timing,
    replayOnCorrect: false,
    hints: {
      explore: (a, b) => t('subExplore', a, b, copyCtx()),
      quiz: (a, b) => t('subQuiz', a, b, copyCtx()),
      wrong: (a, b) => t('subWrong', a, b, copyCtx())
    },
    stepperLabels: () => ({ a: t('subLabelA'), b: t('subLabelB') })
  }),

  mul: createCountingMode({
    ...shared,
    root: q('[data-section="mul"]'),
    kind: 'mul',
    op: '×',
    range: { aMin: 2, aMax: 5, bMin: 2, bMax: 5 },
    answer: (a, b) => a * b,
    board: (a, b) => ({ groups: Array(a).fill(b), animation: 'reveal' }),
    timing,
    hints: {
      explore: (a, b) => t('mulExplore', a, b, copyCtx()),
      quiz: (a, b) => t('mulQuiz', a, b, copyCtx()),
      wrong: (a, b) => t('mulWrong', a, b, copyCtx())
    },
    stepperLabels: () => ({ a: t('mulLabelA'), b: t('mulLabelB') })
  }),

  grid: createGridMode({
    root: q('[data-section="grid"]'),
    t: (key, ...args) => t(key, ...args, copyCtx()),
    starCounter,
    round
  })
};

let current = 'mul';

/* ---------- tabs ----------
   Leaving a tab now suspends that mode, which cancels every timer it has
   pending. Previously an orphaned `setTimeout` from the tab you just left
   fired into the tab you just opened and rerolled the question. */

const tabs = createTabs(q('[data-tabs]'), {
  onChange: id => {
    if (id === current) return;
    modes[current]?.suspend();
    current = id;
    roundDone.classList.add('hidden');
    modes[id].refresh();
  }
});

/* ---------- theme picker ---------- */

function buildThemes() {
  const box = q('[data-themes]');
  clear(box);
  box.setAttribute('aria-label', t('themesLabel'));
  for (const [key, value] of Object.entries(THEMES)) {
    const forms = value[getLang()] || value.pl;
    box.append(
      el('button.icon-btn', {
        type: 'button',
        text: value.em,
        'aria-label': forms[0],
        'aria-pressed': String(key === themeKey),
        onclick: () => {
          themeKey = key;
          store.set('mathTheme', key);
          buildThemes();
          modes[current].refresh();
        }
      })
    );
  }
}

/* ---------- header ---------- */

const soundBtn = q('[data-sound]');
function paintSound() {
  soundBtn.textContent = isSoundOn() ? '🔊' : '🔇';
  soundBtn.setAttribute('aria-label', isSoundOn() ? t('soundOn') : t('soundOff'));
  soundBtn.setAttribute('aria-pressed', String(isSoundOn()));
}
soundBtn.addEventListener('click', () => {
  toggleSound();
  paintSound();
});

q('[data-lang]').addEventListener('click', () => {
  toggleLang();
  applyLanguage();
  modes[current].refresh();
});

function applyLanguage() {
  document.title = t('title');
  q('[data-title]').textContent = t('title');
  q('[data-description]').setAttribute('content', t('pageDescription'));
  q('[data-home]').setAttribute('aria-label', t('home'));
  q('[data-lang]').textContent = otherLangLabel();
  q('[data-lang]').setAttribute('aria-label', t('langSwitch'));
  q('[data-stars-label]').textContent = t('starsLabel');
  $('starBox').setAttribute('aria-label', t('starsLabel'));
  q('[data-tabs]').setAttribute('aria-label', t('operationsLabel'));
  q('[data-round]').setAttribute('aria-label', t('progressLabel'));
  tabs.tabs.forEach(tab => {
    tab.textContent = t(
      { add: 'tabAdd', sub: 'tabSub', mul: 'tabMul', grid: 'tabGrid' }[tab.dataset.tab]
    );
  });
  for (const mode of Object.values(modes)) mode.applyLabels();
  buildThemes();
  paintSound();
  round.setLabel((done, total) => t('roundLabel', done, total));
}

/* ---------- start ---------- */

applyLanguage();
tabs.select(current, { silent: true });
modes[current].setMode('quiz');

// A bfcache restore (the iOS back button) does not re-run this script, so the
// star count would otherwise be whatever it was when the page was frozen.
window.addEventListener('pageshow', e => {
  if (e.persisted) store.refresh();
});

registerServiceWorker();
