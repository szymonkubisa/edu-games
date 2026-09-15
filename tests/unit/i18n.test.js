import { describe, it, expect } from 'vitest';
import { pluralIn } from '../../src/core/i18n.js';

const BASKET = ['koszyk', 'koszyki', 'koszyków'];
const ROW = ['rząd', 'rzędy', 'rzędów'];

describe('Polish pluralisation', () => {
  it('uses the singular for one', () => {
    expect(pluralIn('pl', 1, BASKET)).toBe('koszyk');
  });

  it('uses the "few" form for 2-4', () => {
    for (const n of [2, 3, 4]) expect(pluralIn('pl', n, BASKET)).toBe('koszyki');
  });

  it('uses the "many" form for 5-21', () => {
    for (const n of [5, 6, 9, 10, 11, 21]) expect(pluralIn('pl', n, BASKET)).toBe('koszyków');
  });

  // The rule everyone gets wrong: 12-14 look like 2-4 but take the many form.
  it('uses the "many" form for the teens, not the "few" form', () => {
    for (const n of [12, 13, 14]) expect(pluralIn('pl', n, BASKET)).toBe('koszyków');
  });

  it('uses the "few" form again for 22-24 and 32-34', () => {
    for (const n of [22, 23, 24, 32, 33, 34, 102, 103]) {
      expect(pluralIn('pl', n, BASKET)).toBe('koszyki');
    }
  });

  it('uses the "many" form for 112-114', () => {
    for (const n of [112, 113, 114]) expect(pluralIn('pl', n, BASKET)).toBe('koszyków');
  });

  it('uses the "many" form for zero', () => {
    expect(pluralIn('pl', 0, ROW)).toBe('rzędów');
  });

  it('never returns undefined for anything the games can produce', () => {
    for (let n = 0; n <= 120; n++) {
      expect(typeof pluralIn('pl', n, BASKET)).toBe('string');
      expect(BASKET).toContain(pluralIn('pl', n, BASKET));
    }
  });
});

describe('English pluralisation', () => {
  it('is singular for one and plural otherwise', () => {
    expect(pluralIn('en', 1, ['basket', 'baskets'])).toBe('basket');
    for (const n of [0, 2, 5, 12, 22]) {
      expect(pluralIn('en', n, ['basket', 'baskets'])).toBe('baskets');
    }
  });
});
