import { describe, it, expect } from 'vitest';
import { plain, cap, renderText, syllableCount } from '../../src/games/reading/text.js';

describe('plain', () => {
  it('strips syllable markers', () => {
    expect(plain('ko|ro|na')).toBe('korona');
  });
  it('leaves unmarked text alone', () => {
    expect(plain('kot')).toBe('kot');
  });
  it('survives null', () => {
    expect(plain(null)).toBe('');
  });
});

describe('cap', () => {
  it('capitalises the first letter only', () => {
    expect(cap('pola')).toBe('Pola');
  });
  it('handles Polish diacritics', () => {
    expect(cap('ża|ba')).toBe('Ża|ba');
  });
  it('survives an empty string', () => {
    expect(cap('')).toBe('');
  });
});

describe('renderText', () => {
  it('drops markers when syllable mode is off', () => {
    expect(renderText('ko|ro|na', false)).toBe('<span class="w">korona</span>');
  });

  it('alternates syllable colours when on', () => {
    expect(renderText('ko|ro|na', true)).toBe(
      '<span class="w"><span class="syl0">ko</span><span class="syl1">ro</span><span class="syl0">na</span></span>'
    );
  });

  // Regression: a sentence rendered without the separating spaces (commit 94a8b95).
  it('keeps the spaces between words', () => {
    const out = renderText('Zie|lo|ny smok tań|czy', false);
    expect(out.split('</span>').length - 1).toBe(3);
    expect(out).toContain('</span> <span');
    expect(out.replace(/<[^>]+>/g, '')).toBe('Zielony smok tańczy');
  });

  it('preserves word order and spacing in syllable mode too', () => {
    expect(renderText('gru|by kot', true).replace(/<[^>]+>/g, '')).toBe('gruby kot');
  });

  it('escapes markup rather than injecting it', () => {
    expect(renderText('<img src=x onerror=1>', false)).not.toContain('<img');
  });
});

describe('syllableCount', () => {
  it('counts marked syllables', () => {
    expect(syllableCount('ko|ro|na')).toBe(3);
    expect(syllableCount('kot')).toBe(1);
  });
});
