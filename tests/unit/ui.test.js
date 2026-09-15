import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTabs } from '../../src/ui/tabs.js';
import { createRound } from '../../src/ui/round.js';
import { el, shuffle } from '../../src/core/dom.js';

describe('tabs', () => {
  let list;
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="tabs">
        <button data-tab="a" data-panel="pa">A</button>
        <button data-tab="b" data-panel="pb">B</button>
        <button data-tab="c" data-panel="pc">C</button>
      </div>
      <div id="pa"></div><div id="pb"></div><div id="pc"></div>`;
    list = document.getElementById('tabs');
  });

  it('applies the ARIA tablist roles the plain buttons never had', () => {
    createTabs(list);
    expect(list.getAttribute('role')).toBe('tablist');
    expect([...list.children].every(b => b.getAttribute('role') === 'tab')).toBe(true);
    expect(document.getElementById('pa').getAttribute('role')).toBe('tabpanel');
  });

  it('marks exactly one tab selected and shows only its panel', () => {
    const tabs = createTabs(list);
    tabs.select('b');
    expect(list.querySelectorAll('[aria-selected="true"]')).toHaveLength(1);
    expect(document.getElementById('pb').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('pa').classList.contains('hidden')).toBe(true);
  });

  it('keeps a roving tabindex so the row is one tab stop', () => {
    const tabs = createTabs(list);
    tabs.select('b');
    expect([...list.children].map(b => b.tabIndex)).toEqual([-1, 0, -1]);
  });

  it('moves with the arrow keys and wraps', () => {
    const tabs = createTabs(list);
    tabs.select('a');
    list.children[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(tabs.current).toBe('b');
    list.children[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(tabs.current).toBe('a');
    list.children[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(tabs.current).toBe('c');
  });

  it('jumps to the ends with Home and End', () => {
    const tabs = createTabs(list);
    tabs.select('b');
    list.children[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(tabs.current).toBe('c');
    list.children[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    expect(tabs.current).toBe('a');
  });

  it('reports the change once, and not at all when silent', () => {
    const onChange = vi.fn();
    const tabs = createTabs(list, { onChange });
    tabs.select('b');
    expect(onChange).toHaveBeenCalledWith('b');
    onChange.mockClear();
    tabs.select('c', { silent: true });
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('round', () => {
  let host;
  beforeEach(() => {
    document.body.innerHTML = '<div id="round"></div>';
    host = document.getElementById('round');
  });

  it('draws one dot per question', () => {
    createRound(host, { length: 10 });
    expect(host.querySelectorAll('.dot')).toHaveLength(10);
  });

  it('fills a dot per correct answer', () => {
    const round = createRound(host, { length: 5 });
    round.hit();
    round.hit();
    expect(host.querySelectorAll('.dot.done')).toHaveLength(2);
  });

  it('completes and resets at the end of the round', () => {
    const onComplete = vi.fn();
    const round = createRound(host, { length: 3, onComplete });
    expect(round.hit().completed).toBe(false);
    expect(round.hit().completed).toBe(false);
    expect(round.hit().completed).toBe(true);
    expect(onComplete).toHaveBeenCalledWith({ length: 3, streak: 3, best: 3 });
    expect(host.querySelectorAll('.dot.done')).toHaveLength(0);
  });

  it('breaks the streak on a miss but keeps the progress', () => {
    const round = createRound(host, { length: 10 });
    round.hit();
    round.hit();
    round.miss();
    expect(round.progress.streak).toBe(0);
    expect(round.progress.done).toBe(2);
  });

  it('remembers the best streak of the round', () => {
    const onComplete = vi.fn();
    const round = createRound(host, { length: 4, onComplete });
    round.hit();
    round.hit();
    round.hit();
    round.miss();
    round.hit();
    expect(onComplete).toHaveBeenCalledWith({ length: 4, streak: 1, best: 3 });
  });

  it('labels progress for screen readers', () => {
    const round = createRound(host, { length: 10, label: (d, t) => `Question ${d} of ${t}` });
    round.hit();
    expect(host.querySelector('.dots').getAttribute('aria-label')).toBe('Question 1 of 10');
  });
});

describe('el', () => {
  it('splits a tag.class spec', () => {
    const node = el('button.opt.big', { type: 'button' }, 'hi');
    expect(node.tagName).toBe('BUTTON');
    expect(node.className).toBe('opt big');
    expect(node.textContent).toBe('hi');
  });

  it('sets data and aria attributes rather than properties', () => {
    const node = el('div', { 'aria-label': 'x', 'data-tab': 'y' });
    expect(node.getAttribute('aria-label')).toBe('x');
    expect(node.dataset.tab).toBe('y');
  });

  it('skips null and false props', () => {
    const node = el('div', { 'aria-hidden': false, title: null });
    expect(node.hasAttribute('aria-hidden')).toBe(false);
    expect(node.hasAttribute('title')).toBe(false);
  });
});

describe('shuffle', () => {
  it('keeps every element', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    expect([...shuffle([...items])].sort((a, b) => a - b)).toEqual(items);
  });

  it('reaches every position over many runs', () => {
    const positions = new Set();
    for (let i = 0; i < 500; i++) positions.add(shuffle([0, 1, 2, 3]).indexOf(0));
    expect(positions).toEqual(new Set([0, 1, 2, 3]));
  });
});
