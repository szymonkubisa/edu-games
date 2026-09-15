import { describe, it, expect } from 'vitest';
import PL from '../../src/content/pl/reading.js';
import EN from '../../src/content/en/reading.js';
import {
  storiesFor, pickStory, buildQuestions, plotQuestion, optionsFromList, makeFunSentence, OPTION_COUNT
} from '../../src/games/reading/story.js';
import { plain } from '../../src/games/reading/text.js';

const PACKS = { pl: PL, en: EN };

/** Every hero x friend x place x thing the child can choose: 5^4 = 625 casts. */
function* everyCast(content) {
  for (const h of content.HEROES)
    for (const f of content.FRIENDS)
      for (const p of content.PLACES)
        for (const t of content.THINGS) yield { h, f, p, t };
}

describe.each(Object.entries(PACKS))('%s content pack', (lang, content) => {
  it('offers five of each choice', () => {
    for (const list of [content.HEROES, content.FRIENDS, content.PLACES, content.THINGS]) {
      expect(list.length).toBeGreaterThanOrEqual(4); // enough for one answer + 3 distractors
    }
  });

  it('gives every word an emoji and a spelling', () => {
    for (const word of content.WORDS) {
      expect(word.em).toBeTruthy();
      expect(plain(word.w).length).toBeGreaterThan(0);
    }
  });

  it('has no duplicate words, so a round always has real distractors', () => {
    const spellings = content.WORDS.map(w => plain(w.w));
    expect(new Set(spellings).size).toBe(spellings.length);
  });
});

/**
 * The exhaustive pass: 625 casts x 4 stories x ~14 sentences, twice over.
 * This is the shape of bug the project has actually shipped before — a missing
 * space between generated words (commit 94a8b95).
 */
describe.each(Object.entries(PACKS))('%s stories, every cast', (lang, content) => {
  const casts = [...everyCast(content)];

  it('covers all 625 combinations', () => {
    expect(casts).toHaveLength(625);
  });

  it('never leaks undefined, null or NaN into a sentence', () => {
    for (const cast of casts) {
      for (const story of storiesFor(content, cast)) {
        for (const sentence of story.s) {
          expect(sentence, JSON.stringify(cast)).not.toMatch(/undefined|null|NaN/);
        }
      }
    }
  });

  it('produces well-formed sentences: non-empty, spaced, single-spaced, terminated', () => {
    for (const cast of casts) {
      for (const story of storiesFor(content, cast)) {
        for (const raw of story.s) {
          const text = plain(raw);
          const where = `${lang} ${JSON.stringify(cast)}: ${text}`;
          expect(text.trim().length, where).toBeGreaterThan(0);
          expect(text, where).not.toMatch(/ {2}/); // no double space
          expect(text, where).not.toMatch(/^\s|\s$/); // no stray edges
          // every sentence ends on punctuation or an emoji, never mid-word
          expect(text, where).toMatch(/[.!?"'„”…)\]]|\p{Extended_Pictographic}\s*$/u);
        }
      }
    }
  });

  it('never runs two words together where a variant was substituted', () => {
    for (const cast of casts) {
      for (const story of storiesFor(content, cast)) {
        for (const raw of story.s) {
          // a lowercase letter immediately followed by an uppercase one mid-word
          // is the signature of a missing space around an interpolation
          expect(plain(raw), lang).not.toMatch(/\p{Ll}\p{Lu}/u);
        }
      }
    }
  });

  it('gives every story a comprehension question with exactly one right answer', () => {
    for (const cast of casts.slice(0, 40)) {
      for (const story of storiesFor(content, cast)) {
        const q = plotQuestion(content, story);
        expect(plain(q.txt).length).toBeGreaterThan(0);
        expect(q.opts).toHaveLength(OPTION_COUNT);
        expect(q.opts.filter(o => o.ok)).toHaveLength(1);
        expect(new Set(q.opts.map(o => plain(o.lbl))).size).toBe(OPTION_COUNT);
      }
    }
  });

  it('every story is long enough to be worth reading', () => {
    for (const cast of casts.slice(0, 40)) {
      for (const story of storiesFor(content, cast)) {
        expect(story.s.length).toBeGreaterThanOrEqual(8);
      }
    }
  });
});

describe('quiz assembly', () => {
  const cast = { h: PL.HEROES[0], f: PL.FRIENDS[1], p: PL.PLACES[2], t: PL.THINGS[3] };

  it('asks four questions: who, where, what, and what happened', () => {
    const story = storiesFor(PL, cast)[0];
    const questions = buildQuestions(PL, cast, story);
    expect(questions).toHaveLength(4);
  });

  it('marks the child’s own choice as the right answer', () => {
    const story = storiesFor(PL, cast)[0];
    const [hero, place, thing] = buildQuestions(PL, cast, story);
    expect(hero.opts.find(o => o.ok).lbl).toBe(cast.h.nom);
    expect(place.opts.find(o => o.ok).lbl).toBe(cast.p.nom);
    expect(thing.opts.find(o => o.ok).lbl).toBe(cast.t.nom);
  });

  it('offers four distinct options per question, every time', () => {
    const story = storiesFor(PL, cast)[0];
    for (let run = 0; run < 100; run++) {
      for (const question of buildQuestions(PL, cast, story)) {
        expect(question.opts).toHaveLength(OPTION_COUNT);
        expect(new Set(question.opts.map(o => o.lbl)).size).toBe(OPTION_COUNT);
        expect(question.opts.filter(o => o.ok)).toHaveLength(1);
      }
    }
  });

  it('does not mutate the authored option list while shuffling', () => {
    const story = storiesFor(PL, cast).find(s => s.q.opts);
    const before = story.q.opts.map(o => o.lbl);
    for (let i = 0; i < 20; i++) plotQuestion(PL, story);
    expect(story.q.opts.map(o => o.lbl)).toEqual(before);
  });
});

describe('optionsFromList', () => {
  it('always includes the answer exactly once', () => {
    for (let run = 0; run < 200; run++) {
      const opts = optionsFromList(PL.HEROES, PL.HEROES[2], x => x.nom);
      expect(opts.filter(o => o.ok)).toHaveLength(1);
      expect(opts.find(o => o.ok).lbl).toBe(PL.HEROES[2].nom);
    }
  });
});

describe('pickStory', () => {
  const cast = { h: PL.HEROES[0], f: PL.FRIENDS[0], p: PL.PLACES[0], t: PL.THINGS[0] };

  it('returns one of the available stories', () => {
    const all = storiesFor(PL, cast);
    for (let i = 0; i < 50; i++) expect(all).toContainEqual(pickStory(PL, cast));
  });

  it('can reach every story', () => {
    const all = storiesFor(PL, cast);
    const seen = new Set();
    for (let i = 0; i < 400; i++) seen.add(pickStory(PL, cast).q.txt);
    expect(seen.size).toBe(all.length);
  });
});

describe.each(Object.entries(PACKS))('%s funny sentences', (lang, content) => {
  it('never repeats the previous sentence', () => {
    let previous = null;
    for (let i = 0; i < 500; i++) {
      const sentence = makeFunSentence(content, previous);
      expect(sentence).not.toBe(previous);
      previous = sentence;
    }
  });

  it('always reads as subject + verb + place, properly spaced', () => {
    for (let i = 0; i < 300; i++) {
      const text = plain(makeFunSentence(content, null));
      expect(text).toMatch(/!$/);
      expect(text).not.toMatch(/ {2}/);
      expect(text.split(' ').length).toBeGreaterThanOrEqual(3);
    }
  });
});
