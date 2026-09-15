import { describe, it, expect } from 'vitest';
import { candidatesFor, chooseFact, weightFor, factId } from '../../src/games/math/facts.js';
import { answerOptions } from '../../src/games/math/answers.js';

describe('candidatesFor', () => {
  it('produces the full rectangle of operand pairs', () => {
    expect(candidatesFor({ aMin: 2, aMax: 3, bMin: 1, bMax: 2 })).toEqual([
      [2, 1], [2, 2], [3, 1], [3, 2]
    ]);
  });

  it('honours a filter — subtraction never goes below zero', () => {
    const pairs = candidatesFor({ aMin: 3, aMax: 6, bMin: 1, bMax: 5, filter: (a, b) => b < a });
    expect(pairs.every(([a, b]) => a - b > 0)).toBe(true);
  });
});

describe('weightFor', () => {
  it('ranks an unseen fact above a known one', () => {
    expect(weightFor({ seen: 0, wrong: 0 })).toBeGreaterThan(weightFor({ seen: 6, wrong: 0 }));
  });

  it('ranks a shaky fact above a solid one', () => {
    expect(weightFor({ seen: 4, wrong: 3 })).toBeGreaterThan(weightFor({ seen: 4, wrong: 0 }));
  });

  it('never drops a mastered fact to zero, so review still happens', () => {
    expect(weightFor({ seen: 999, wrong: 0 })).toBeGreaterThan(0);
  });
});

describe('chooseFact', () => {
  const stats = new Map();
  const statsFor = (a, b) => stats.get(factId('mul', a, b)) ?? { seen: 0, wrong: 0 };

  it('returns a pair from the candidate list', () => {
    const candidates = candidatesFor({ aMin: 2, aMax: 5, bMin: 2, bMax: 5 });
    for (let i = 0; i < 200; i++) {
      const pair = chooseFact(candidates, statsFor);
      expect(candidates).toContainEqual(pair);
    }
  });

  it('never repeats the question just asked', () => {
    const candidates = candidatesFor({ aMin: 2, aMax: 3, bMin: 2, bMax: 3 });
    for (let i = 0; i < 200; i++) {
      expect(chooseFact(candidates, statsFor, { exclude: [2, 2] })).not.toEqual([2, 2]);
    }
  });

  it('still answers when the excluded pair is the only candidate', () => {
    expect(chooseFact([[3, 3]], statsFor, { exclude: [3, 3] })).toEqual([3, 3]);
  });

  it('favours the fact the child keeps getting wrong', () => {
    stats.clear();
    stats.set(factId('mul', 3, 4), { seen: 10, wrong: 9 });
    for (const [a, b] of candidatesFor({ aMin: 2, aMax: 5, bMin: 2, bMax: 5 })) {
      if (!(a === 3 && b === 4)) stats.set(factId('mul', a, b), { seen: 8, wrong: 0 });
    }
    const candidates = candidatesFor({ aMin: 2, aMax: 5, bMin: 2, bMax: 5 });
    let hits = 0;
    for (let i = 0; i < 2000; i++) {
      const [a, b] = chooseFact(candidates, statsFor);
      if (a === 3 && b === 4) hits++;
    }
    expect(hits / 2000).toBeGreaterThan(1 / candidates.length); // beats uniform
  });

  it('is deterministic given a fixed random source', () => {
    const candidates = candidatesFor({ aMin: 1, aMax: 3, bMin: 1, bMax: 3 });
    expect(chooseFact(candidates, statsFor, { random: () => 0 })).toEqual(candidates[0]);
    expect(chooseFact(candidates, statsFor, { random: () => 0.999999 })).toEqual(candidates.at(-1));
  });

  it('throws rather than returning undefined on an empty list', () => {
    expect(() => chooseFact([], statsFor)).toThrow();
  });
});

describe('answerOptions', () => {
  it('always offers four distinct options including the answer', () => {
    for (let correct = 0; correct <= 100; correct++) {
      const options = answerOptions(correct);
      expect(options).toHaveLength(4);
      expect(new Set(options).size).toBe(4);
      expect(options).toContain(correct);
    }
  });

  it('never offers a negative number', () => {
    for (let correct = 0; correct <= 20; correct++) {
      for (let run = 0; run < 50; run++) {
        expect(answerOptions(correct).every(v => v >= 0)).toBe(true);
      }
    }
  });

  it('keeps distractors close enough to require counting', () => {
    for (let correct = 6; correct <= 100; correct++) {
      for (const value of answerOptions(correct)) {
        expect(Math.abs(value - correct)).toBeLessThanOrEqual(6);
      }
    }
  });

  it('prefers the nearest offsets, so 10 is never shown against 0 and 20', () => {
    for (let run = 0; run < 300; run++) {
      const spread = answerOptions(10).map(v => Math.abs(v - 10));
      expect(Math.max(...spread)).toBeLessThanOrEqual(4);
    }
  });

  it('copes with an answer of zero, which subtraction can reach', () => {
    const options = answerOptions(0);
    expect(options).toContain(0);
    expect(options.every(v => v >= 0)).toBe(true);
  });
});
