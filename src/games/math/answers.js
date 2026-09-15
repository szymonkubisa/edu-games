import { shuffle } from '../../core/dom.js';

export const ANSWER_COUNT = 4;

/**
 * Multiple-choice options for a numeric answer.
 *
 * Near misses make the child count rather than eliminate by magnitude, so the
 * distractors sit close to the answer. Negative values are never offered —
 * these children have not met them.
 *
 * @param {number} correct
 * @param {{count?:number, offsets?:number[], shuffleFn?:(a:any[])=>any[]}} [opts]
 * @returns {number[]}
 */
export function answerOptions(correct, { count = ANSWER_COUNT, offsets, shuffleFn = shuffle } = {}) {
  const options = new Set([correct]);
  // Closest offsets first, shuffled only within each band: an answer of 10 must
  // not end up against 0 and 20, which a child can dismiss without counting.
  const pool =
    offsets ??
    [shuffleFn([1, -1, 2, -2]), shuffleFn([3, -3, 4, -4]), shuffleFn([5, -5, 6, -6])].flat();
  for (const delta of pool) {
    if (options.size >= count) break;
    const value = correct + delta;
    if (value >= 0) options.add(value);
  }
  // Only reachable for answers so small that the offsets above collide.
  for (let v = 0; options.size < count; v++) options.add(v);
  return shuffleFn([...options]);
}
