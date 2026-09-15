/**
 * Adaptive fact selection.
 *
 * The original picked operands uniformly at random forever, so a child who had
 * mastered ×2 kept being asked ×2. Here every fact carries a `{seen, wrong}`
 * history and the sampler biases towards facts that are new or shaky.
 *
 * Pure on purpose: `statsFor` and `random` are injected so this is testable
 * without a DOM or a store.
 */

export const factId = (kind, a, b) => `${kind}:${a}x${b}`;

/** Every (a, b) pair a mode may ask about. */
export function candidatesFor({ aMin, aMax, bMin, bMax, filter }) {
  const out = [];
  for (let a = aMin; a <= aMax; a++) {
    for (let b = bMin; b <= bMax; b++) {
      if (!filter || filter(a, b)) out.push([a, b]);
    }
  }
  return out;
}

/**
 * Higher weight = more likely to be asked.
 *   never seen      -> a strong boost, so new ground gets covered
 *   often wrong     -> boosted in proportion to the error rate
 *   reliably right  -> decays, but never to zero (spaced repetition, not exile)
 */
export function weightFor({ seen = 0, wrong = 0 } = {}) {
  if (seen === 0) return 3.5;
  const wrongRate = Math.min(wrong / seen, 1);
  const mastery = Math.min(seen, 6) * 0.14;
  return Math.max(0.25, 1 + 3 * wrongRate - mastery);
}

/**
 * @param {Array<[number,number]>} candidates
 * @param {(a:number,b:number)=>{seen:number,wrong:number}} statsFor
 * @param {{exclude?:[number,number]|null, random?:()=>number}} [opts]
 * @returns {[number,number]}
 */
export function chooseFact(candidates, statsFor, { exclude = null, random = Math.random } = {}) {
  if (!candidates.length) throw new Error('chooseFact: no candidates');

  // Don't hand back the question just answered — unless it is the only one.
  let pool = candidates;
  if (exclude) {
    const filtered = candidates.filter(([a, b]) => !(a === exclude[0] && b === exclude[1]));
    if (filtered.length) pool = filtered;
  }

  const weights = pool.map(([a, b]) => weightFor(statsFor(a, b)));
  const total = weights.reduce((x, y) => x + y, 0);
  let roll = random() * total;
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return pool[i];
  }
  return pool[pool.length - 1]; // float drift guard
}
