import { el, clear } from '../../core/dom.js';
import { createScheduler } from '../../core/schedule.js';
import { badSound, popSound } from '../../core/audio.js';
import { buildBoard, revealItems, removeItems, equation } from './board.js';
import { candidatesFor, chooseFact, factId } from './facts.js';
import { answerOptions } from './answers.js';
import store from '../../core/store.js';

/**
 * One factory for addition, subtraction and multiplication.
 *
 * These were three near-identical 25-line functions that differed only in the
 * operator, the operand ranges, the hint wording and whether items appear or
 * grey out. Collapsing them removed the copy-paste and means a new operation
 * is a config object rather than a fourth copy.
 */
export function createCountingMode(spec) {
  const {
    root, kind, op, t, emoji, starCounter, round,
    range, answer, board: boardSpec, timing,
    replayOnCorrect = true, hints, stepperLabels, exploreLimit = 10
  } = spec;

  const q = sel => root.querySelector(sel);
  const eqEl = q('[data-eq]');
  const hintEl = q('[data-hint]');
  const boardEl = q('[data-board]');
  const ansEl = q('[data-ans]');
  const ctlEl = q('[data-ctl]');
  const statusEl = q('[data-status]');

  const scheduler = createScheduler();
  const candidates = candidatesFor(range);
  const statsFor = (a, b) => store.factStats(factId(kind, a, b));

  let a = range.aMin + 1;
  let b = range.bMin + 1;
  let mode = 'quiz';
  let locked = false;
  let lastFact = null;
  let skip = null; // set while a skippable animation is running

  /* ---------- rendering ---------- */

  const announce = text => {
    if (statusEl) statusEl.textContent = text;
  };

  function setEquation(value, bravo) {
    clear(eqEl).append(equation(a, op, b, value, { bravo, bravoText: t('bravo') }));
  }

  function paintSteppers() {
    const av = q('[data-val="a"]');
    const bv = q('[data-val="b"]');
    if (av) av.textContent = a;
    if (bv) bv.textContent = b;
  }

  /** Draw the items and return an animation handle. */
  function drawBoard({ animate, onStep, onDone }) {
    const token = scheduler.generation;
    const plan = boardSpec(a, b);
    const { items } = buildBoard(boardEl, {
      groups: plan.groups,
      separator: plan.separator,
      hidden: animate && plan.animation === 'reveal',
      emoji: emoji(),
      rampOffset: plan.rampOffset || 0
    });

    if (!animate) {
      if (plan.animation === 'remove') {
        for (let i = 0; i < plan.removeCount; i++) items[items.length - 1 - i].classList.add('gone');
      }
      onDone?.();
      return null;
    }

    return plan.animation === 'remove'
      ? removeItems(items, plan.removeCount, { scheduler, token, timing: timing.remove, onStep, onDone })
      : revealItems(items, { scheduler, token, timing: timing.reveal, onStep, onDone });
  }

  /* ---------- explore ---------- */

  function explore() {
    scheduler.cancel();
    locked = false;
    skip = null;
    clear(ansEl);
    setEquation(null);
    hintEl.textContent = '';
    const handle = drawBoard({
      animate: true,
      onStep: n => setEquation(hintsStepValue(n)),
      onDone: () => {
        setEquation(answer(a, b));
        hintEl.textContent = hints.explore(a, b);
        announce(hints.explore(a, b));
        skip = null;
      }
    });
    skip = handle;
  }

  /** During the count-along, the equation shows the running total. */
  const hintsStepValue = n => (boardSpec(a, b).animation === 'remove' ? a - n : n);

  /* ---------- quiz ---------- */

  function nextQuestion() {
    scheduler.cancel();
    locked = false;
    skip = null;
    [a, b] = chooseFact(candidates, statsFor, { exclude: lastFact });
    lastFact = [a, b];
    paintSteppers();
    setEquation(null);
    hintEl.textContent = hints.quiz(a, b);
    drawBoard({ animate: false });
    buildAnswers();
    announce(`${a} ${op} ${b}. ${hints.quiz(a, b)}`);
  }

  function buildAnswers() {
    const correct = answer(a, b);
    clear(ansEl);
    for (const value of answerOptions(correct)) {
      ansEl.append(
        el('button', {
          type: 'button',
          text: value,
          'aria-label': t('answerLabel', value),
          onclick: () => onAnswer(value, correct)
        })
      );
    }
  }

  function onAnswer(value, correct) {
    if (locked) return;
    if (value !== correct) {
      store.recordFact(factId(kind, a, b), false);
      round.miss();
      badSound();
      const btn = [...ansEl.children].find(c => Number(c.textContent) === value);
      btn?.classList.add('shk', 'bad');
      scheduler.after(900, () => btn?.classList.remove('shk', 'bad'));
      hintEl.textContent = hints.wrong(a, b);
      announce(t('tryAgain'));
      return;
    }

    locked = true;
    store.recordFact(factId(kind, a, b), true);
    clear(ansEl);

    const award = () => {
      setEquation(correct, true);
      hintEl.textContent = t('starEarned');
      announce(t('correctAnnounce', a, op, b, correct));
      starCounter.add();
      const result = round.hit();
      skip = null;
      if (!result.completed) scheduler.after(1200, nextQuestion);
    };

    if (!replayOnCorrect) {
      award();
      return;
    }

    hintEl.textContent = t('countTogether');
    boardEl.classList.add('skippable');
    const handle = drawBoard({
      animate: true,
      onStep: n => setEquation(hintsStepValue(n)),
      onDone: () => {
        boardEl.classList.remove('skippable');
        award();
      }
    });
    skip = handle;
  }

  /* ---------- skipping the replay ---------- */

  function skipAnimation() {
    if (!skip) return false;
    const handle = skip;
    skip = null;
    scheduler.cancel();
    boardEl.classList.remove('skippable');
    handle.finish();
    return true;
  }

  boardEl.addEventListener('click', skipAnimation);

  /* ---------- wiring ---------- */

  root.querySelectorAll('[data-modeswitch]').forEach(btn => {
    btn.addEventListener('click', () => setMode(btn.dataset.modeswitch));
  });

  root.querySelectorAll('[data-step]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (mode !== 'explore') return;
      const which = btn.dataset.step;
      const delta = Number(btn.dataset.d);
      if (which === 'a') a = clamp(a + delta, range.aMin, exploreLimit);
      else b = clamp(b + delta, range.bMin, exploreLimit);
      if (range.filter && !range.filter(a, b)) b = clamp(b, range.bMin, a);
      popSound();
      paintSteppers();
      explore();
    });
  });

  function setMode(next) {
    mode = next;
    scheduler.cancel();
    root.querySelectorAll('[data-modeswitch]').forEach(btn => {
      const on = btn.dataset.modeswitch === next;
      btn.classList.toggle('on', on);
      btn.setAttribute('aria-pressed', String(on));
    });
    // The steppers only mean anything in explore mode. They used to sit there
    // at 40% opacity during a quiz — unusable, and below AA contrast.
    if (ctlEl) {
      ctlEl.classList.toggle('hidden', next !== 'explore');
      ctlEl.querySelectorAll('button').forEach(btn => (btn.disabled = next !== 'explore'));
    }
    if (next === 'explore') explore();
    else nextQuestion();
  }

  function applyLabels() {
    const la = q('[data-lbl="a"]');
    const lb = q('[data-lbl="b"]');
    if (la) la.textContent = stepperLabels().a;
    if (lb) lb.textContent = stepperLabels().b;
    root.querySelectorAll('[data-step]').forEach(btn => {
      const which = btn.dataset.step === 'a' ? stepperLabels().a : stepperLabels().b;
      const dir = Number(btn.dataset.d) > 0 ? t('more') : t('fewer');
      btn.setAttribute('aria-label', `${dir}: ${which}`);
    });
    q('[data-modeswitch="explore"]').textContent = t('tabExplore');
    q('[data-modeswitch="quiz"]').textContent = t('tabQuiz');
    if (ansEl) ansEl.setAttribute('aria-label', t('answersLabel'));
  }

  return {
    get mode() {
      return mode;
    },
    applyLabels,
    /** Called when the tab becomes visible, the theme changes or the language changes. */
    refresh() {
      applyLabels();
      mode === 'explore' ? explore() : nextQuestion();
    },
    /** Called when the tab is left: kills every pending timer for this mode. */
    suspend() {
      scheduler.cancel();
      skip = null;
      locked = false;
    },
    setMode,
    get scheduler() {
      return scheduler;
    }
  };
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
