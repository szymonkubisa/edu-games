/**
 * Cancellable deferred work.
 *
 * Every game mode used to end a correct answer with a bare
 * `setTimeout(next, 2200)`. Switching tabs generated a fresh question
 * immediately, then the orphaned timer generated another one — the problem
 * changed under a child who was still counting. A scheduler makes "everything
 * this mode has pending" a single thing you can cancel.
 */
export function createScheduler() {
  let timers = new Set();
  let generation = 0;

  return {
    /** Generation token; compare with `isCurrent` inside long animations. */
    get generation() {
      return generation;
    },
    after(ms, fn) {
      const id = setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
      return id;
    },
    isCurrent(token) {
      return token === generation;
    },
    /** Drops every pending timer and invalidates outstanding generation tokens. */
    cancel() {
      for (const id of timers) clearTimeout(id);
      timers.clear();
      generation++;
      return generation;
    },
    get pending() {
      return timers.size;
    }
  };
}
