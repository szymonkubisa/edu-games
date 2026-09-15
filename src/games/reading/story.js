import { shuffle } from '../../core/dom.js';

/**
 * Story assembly and comprehension questions.
 *
 * Pure: takes the content pack and the child's four choices, returns plain
 * data. That makes it exhaustively testable — every hero × friend × place ×
 * thing combination, in both languages, without a browser.
 */

export const OPTION_COUNT = 4;

/** All stories available for a given cast. */
export const storiesFor = (content, sel) => content.stories(sel.h, sel.f, sel.p, sel.t);

export function pickStory(content, sel, random = Math.random) {
  const all = storiesFor(content, sel);
  return all[Math.floor(random() * all.length)];
}

/** `ok` plus (OPTION_COUNT - 1) distractors drawn from the same list. */
export function optionsFromList(list, ok, label) {
  const others = shuffle(list.filter(x => x !== ok)).slice(0, OPTION_COUNT - 1);
  return shuffle([ok, ...others]).map(x => ({ em: x.em, lbl: label(x), ok: x === ok }));
}

/**
 * Four questions: who, where, what — recall of the choices the child made —
 * then one question about what actually happened in the story.
 */
export function buildQuestions(content, sel, story) {
  const ui = content.ui;
  const recall = [
    { txt: ui.qHero, opts: optionsFromList(content.HEROES, sel.h, x => x.nom) },
    { txt: ui.qPlace, opts: optionsFromList(content.PLACES, sel.p, x => x.nom) },
    { txt: ui.qThing, opts: optionsFromList(content.THINGS, sel.t, x => x.nom) }
  ];
  return [...recall, plotQuestion(content, story)];
}

export function plotQuestion(content, story) {
  const q = story.q;
  if (q.list === 'F') {
    return { txt: q.txt, opts: optionsFromList(content.FRIENDS, q.ok, x => x.nom) };
  }
  return { txt: q.txt, opts: shuffle(q.opts.map(o => ({ ...o, ok: !!o.ok }))) };
}

/** Random funny sentence, never the same one twice in a row. */
export function makeFunSentence(content, previous, random = Math.random) {
  const pick = list => list[Math.floor(random() * list.length)];
  const { subj, verb, tail } = content.FUN;
  for (let attempt = 0; attempt < 20; attempt++) {
    const sentence = `${pick(subj)} ${pick(verb)} ${pick(tail)}!`;
    if (sentence !== previous) return sentence;
  }
  return `${pick(subj)} ${pick(verb)} ${pick(tail)}!`;
}
