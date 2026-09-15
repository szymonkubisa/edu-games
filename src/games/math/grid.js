import { el, clear, prefersReducedMotion } from '../../core/dom.js';
import { createScheduler } from '../../core/schedule.js';
import { blipUp, badSound } from '../../core/audio.js';
import { RAMPS, equation } from './board.js';
import { candidatesFor, chooseFact, factId } from './facts.js';
import { answerOptions } from './answers.js';
import store from '../../core/store.js';

const SIZE = 10;

/**
 * The area model: a × b as a coloured rectangle on a 10×10 grid.
 *
 * Cells are real `<button>`s inside a `role="grid"` with a roving tabindex, so
 * the whole board is reachable by keyboard and announced by screen readers.
 * They were `<div>`s with click handlers — invisible to both.
 */
export function createGridMode({ root, t, starCounter, round }) {
  const q = sel => root.querySelector(sel);
  const gridEl = q('[data-grid]');
  const eqEl = q('[data-eq]');
  const hintEl = q('[data-hint]');
  const ansEl = q('[data-ans]');
  const statusEl = q('[data-status]');

  const scheduler = createScheduler();
  const cells = []; // cells[r][c], 1-indexed via offset
  const rowHeads = [];
  const colHeads = [];

  let mode = 'quiz';
  let maxFactor = 5;
  let numbering = 'count'; // 'count' = 1..n running total, 'product' = r × c
  let locked = false;
  let target = null;
  let lastShown = null;
  let lastFact = null;
  let focus = { r: 1, c: 1 };

  const statsFor = (a, b) => store.factStats(factId('grid', a, b));
  const candidates = () => candidatesFor({ aMin: 1, aMax: maxFactor, bMin: 1, bMax: maxFactor });

  /* ---------- build ---------- */

  function build() {
    clear(gridEl);
    gridEl.style.gridTemplateColumns = `repeat(${SIZE + 1}, 1fr)`;
    gridEl.setAttribute('role', 'grid');
    gridEl.setAttribute('aria-label', t('gridLabel', SIZE, SIZE));

    // role=grid needs real rows. The row wrappers are display:contents, so the
    // single CSS grid on the container still lays every cell out.
    const headerRow = el('div.row', { role: 'row' });
    headerRow.append(el('div.hd', { role: 'presentation' }));
    for (let c = 1; c <= SIZE; c++) {
      const h = el('div.hd', { text: c, role: 'columnheader' });
      colHeads[c] = h;
      headerRow.append(h);
    }
    gridEl.append(headerRow);

    for (let r = 1; r <= SIZE; r++) {
      const row = el('div.row', { role: 'row' });
      const h = el('div.hd', { text: r, role: 'rowheader' });
      rowHeads[r] = h;
      row.append(h);
      cells[r] = [];
      for (let c = 1; c <= SIZE; c++) {
        const cell = el('button.cell', {
          type: 'button',
          role: 'gridcell',
          tabIndex: r === 1 && c === 1 ? 0 : -1,
          'aria-label': t('cellLabel', r, c)
        });
        cell.dataset.r = r;
        cell.dataset.c = c;
        cell.addEventListener('click', () => pick(r, c));
        cell.addEventListener('mouseenter', () => guide(r, c));
        cell.addEventListener('focus', () => {
          focus = { r, c };
          rove();
          guide(r, c);
        });
        cell.addEventListener('keydown', onCellKey);
        cells[r][c] = cell;
        row.append(cell);
      }
      gridEl.append(row);
    }

    gridEl.addEventListener('mouseleave', clearGuides);
  }

  function onCellKey(e) {
    const delta = {
      ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1]
    }[e.key];
    if (!delta && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    let { r, c } = focus;
    if (e.key === 'Home') [r, c] = [1, 1];
    else if (e.key === 'End') [r, c] = [SIZE, SIZE];
    else {
      r = Math.min(SIZE, Math.max(1, r + delta[0]));
      c = Math.min(SIZE, Math.max(1, c + delta[1]));
    }
    focus = { r, c };
    cells[r][c].focus();
  }

  function rove() {
    eachCell((cell, r, c) => {
      cell.tabIndex = r === focus.r && c === focus.c ? 0 : -1;
    });
  }

  const eachCell = fn => {
    for (let r = 1; r <= SIZE; r++) for (let c = 1; c <= SIZE; c++) fn(cells[r][c], r, c);
  };

  /* ---------- painting ---------- */

  function clearCells() {
    eachCell(cell => {
      cell.style.background = '';
      cell.style.color = '';
      cell.textContent = '';
      cell.classList.remove('pop', 'last');
    });
    lastShown = null;
  }

  function clearGuides() {
    for (const h of [...rowHeads, ...colHeads]) h?.classList.remove('mark-row', 'mark-col');
    eachCell(cell => cell.classList.remove('guide-row', 'guide-col', 'cursor'));
  }

  function guide(r, c) {
    clearGuides();
    rowHeads[r]?.classList.add('mark-row');
    colHeads[c]?.classList.add('mark-col');
    eachCell((cell, cr, cc) => {
      if (cr === r && cc === c) cell.classList.add('cursor');
      else if (cr === r && cc <= c) cell.classList.add('guide-row');
      else if (cc === c && cr <= r) cell.classList.add('guide-col');
    });
  }

  /** Fills the a×b block, counting cell by cell so the child can follow. */
  function countArea(rows, cols, onDone) {
    const token = scheduler.generation;
    clearCells();
    lastShown = [rows, cols];
    const list = [];
    eachCell((cell, r, c) => {
      if (r <= rows && c <= cols) list.push([cell, r, c]);
    });
    const total = rows * cols;

    const paint = ([cell, r, c], i) => {
      const ramp = RAMPS[(r - 1) % RAMPS.length];
      cell.style.background = ramp.l;
      cell.textContent = numbering === 'count' ? (r - 1) * cols + c : r * c;
      if (c === cols) {
        cell.style.background = ramp.m;
        cell.classList.add('last');
      }
      if (numbering === 'count') setEquation(rows, cols, (r - 1) * cols + c);
    };

    if (prefersReducedMotion()) {
      list.forEach(paint);
      setEquation(rows, cols, total);
      onDone?.();
      return { finish() {} };
    }

    const delay = Math.min(85, Math.max(22, 2200 / total));
    list.forEach((entry, i) => {
      scheduler.after(i * delay, () => {
        if (!scheduler.isCurrent(token)) return;
        paint(entry, i);
        cells[entry[1]][entry[2]].classList.add('pop');
        blipUp(i + 1);
        if (i === total - 1) {
          setEquation(rows, cols, total);
          onDone?.();
        }
      });
    });

    return {
      finish() {
        list.forEach(paint);
        setEquation(rows, cols, total);
        onDone?.();
      }
    };
  }

  /** Solid block, no numbers — the puzzle to be counted. */
  function paintRect(rows, cols) {
    clearCells();
    eachCell((cell, r, c) => {
      if (r <= rows && c <= cols) cell.style.background = RAMPS[(r - 1) % RAMPS.length].m;
    });
  }

  function setEquation(a, b, value, bravo) {
    clear(eqEl).append(equation(a, '×', b, value, { bravo, bravoText: t('bravo') }));
  }

  const announce = text => {
    if (statusEl) statusEl.textContent = text;
  };

  /* ---------- explore ---------- */

  let skip = null;

  function pick(r, c) {
    if (mode !== 'explore' || locked) return;
    scheduler.cancel();
    setEquation(r, c, null);
    hintEl.textContent = t(numbering === 'count' ? 'gridHintCount' : 'gridHintProduct', r, c);
    skip = countArea(r, c, () => {
      skip = null;
      announce(t('correctAnnounce', r, '×', c, r * c));
    });
  }

  function exploreReset() {
    scheduler.cancel();
    clearCells();
    clearGuides();
    clear(ansEl);
    eqEl.textContent = t('gridPrompt');
    hintEl.textContent = '';
    setCellsInteractive(true);
  }

  function setCellsInteractive(on) {
    eachCell(cell => {
      cell.disabled = !on;
      cell.classList.toggle('inert', !on);
    });
  }

  /* ---------- quiz ---------- */

  function nextQuestion() {
    scheduler.cancel();
    locked = false;
    skip = null;
    setCellsInteractive(false);
    const [a, b] = chooseFact(candidates(), statsFor, { exclude: lastFact });
    lastFact = [a, b];
    target = [a, b];
    paintRect(a, b);
    setEquation(a, b, null);
    hintEl.textContent = t('gridQuiz', a, b);
    buildAnswers(a * b);
    announce(`${a} × ${b}. ${t('gridQuiz', a, b)}`);
  }

  function buildAnswers(correct) {
    clear(ansEl);
    ansEl.setAttribute('aria-label', t('answersLabel'));
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
    const [a, b] = target;
    if (value !== correct) {
      store.recordFact(factId('grid', a, b), false);
      round.miss();
      badSound();
      const btn = [...ansEl.children].find(c => Number(c.textContent) === value);
      btn?.classList.add('shk', 'bad');
      scheduler.after(900, () => btn?.classList.remove('shk', 'bad'));
      hintEl.textContent = t('gridWrong', a, b);
      announce(t('tryAgain'));
      return;
    }
    locked = true;
    store.recordFact(factId('grid', a, b), true);
    clear(ansEl);
    hintEl.textContent = t('countTogether');
    gridEl.classList.add('skippable');
    skip = countArea(a, b, () => {
      gridEl.classList.remove('skippable');
      setEquation(a, b, correct, true);
      hintEl.textContent = t('starEarned');
      announce(t('correctAnnounce', a, '×', b, correct));
      starCounter.add();
      skip = null;
      const result = round.hit();
      if (!result.completed) scheduler.after(1200, nextQuestion);
    });
  }

  gridEl.addEventListener('click', e => {
    if (!skip) return;
    if (e.target.closest('.cell') && mode === 'explore' && !locked) return; // a real pick
    const handle = skip;
    skip = null;
    scheduler.cancel();
    gridEl.classList.remove('skippable');
    handle.finish();
  });

  /* ---------- wiring ---------- */

  root.querySelectorAll('[data-modeswitch]').forEach(btn => {
    btn.addEventListener('click', () => setMode(btn.dataset.modeswitch));
  });

  q('[data-gridmax]')?.addEventListener('click', () => {
    maxFactor = maxFactor === 5 ? 10 : 5;
    applyLabels();
    if (mode === 'quiz') nextQuestion();
  });

  q('[data-gridnum]')?.addEventListener('click', () => {
    numbering = numbering === 'count' ? 'product' : 'count';
    applyLabels();
    if (lastShown && mode === 'explore') {
      const [r, c] = lastShown;
      pick(r, c);
    }
  });

  function setMode(next) {
    mode = next;
    scheduler.cancel();
    skip = null;
    root.querySelectorAll('[data-modeswitch]').forEach(btn => {
      const on = btn.dataset.modeswitch === next;
      btn.classList.toggle('on', on);
      btn.setAttribute('aria-pressed', String(on));
    });
    next === 'explore' ? exploreReset() : nextQuestion();
  }

  function applyLabels() {
    q('[data-modeswitch="explore"]').textContent = t('tabExplore');
    q('[data-modeswitch="quiz"]').textContent = t('tabQuiz');
    const max = q('[data-gridmax]');
    if (max) max.textContent = t('gridMax', maxFactor);
    const num = q('[data-gridnum]');
    if (num) num.textContent = t(numbering === 'count' ? 'gridNumCount' : 'gridNumProduct');
    gridEl.setAttribute('aria-label', t('gridLabel', SIZE, SIZE));
    eachCell((cell, r, c) => cell.setAttribute('aria-label', t('cellLabel', r, c)));
  }

  build();

  return {
    get mode() {
      return mode;
    },
    applyLabels,
    refresh() {
      applyLabels();
      mode === 'explore' ? exploreReset() : nextQuestion();
    },
    suspend() {
      scheduler.cancel();
      skip = null;
      locked = false;
    },
    setMode
  };
}
