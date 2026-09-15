import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createScheduler } from '../../src/core/schedule.js';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('scheduler', () => {
  it('runs deferred work at the right time', () => {
    const s = createScheduler();
    const fn = vi.fn();
    s.after(1000, fn);
    vi.advanceTimersByTime(999);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  /* The bug this exists for: a correct answer scheduled the next question
     2.2 s out; switching tabs generated a new question immediately, then the
     orphaned timer generated another one and the problem changed under a child
     who was still counting. */
  it('cancel() drops pending work so a left tab cannot reroll the question', () => {
    const s = createScheduler();
    const nextQuestion = vi.fn();
    s.after(2200, nextQuestion);
    s.cancel();
    vi.advanceTimersByTime(10_000);
    expect(nextQuestion).not.toHaveBeenCalled();
  });

  it('cancel() drops every pending timer, not just the last', () => {
    const s = createScheduler();
    const calls = [];
    for (let i = 0; i < 25; i++) s.after(i * 100, () => calls.push(i));
    s.cancel();
    vi.advanceTimersByTime(10_000);
    expect(calls).toEqual([]);
    expect(s.pending).toBe(0);
  });

  it('invalidates generation tokens taken before the cancel', () => {
    const s = createScheduler();
    const token = s.generation;
    expect(s.isCurrent(token)).toBe(true);
    s.cancel();
    expect(s.isCurrent(token)).toBe(false);
  });

  it('lets an animation guard itself mid-flight', () => {
    const s = createScheduler();
    const painted = [];
    const token = s.generation;
    for (let i = 0; i < 10; i++) {
      s.after(i * 100, () => {
        if (!s.isCurrent(token)) return;
        painted.push(i);
      });
    }
    vi.advanceTimersByTime(250); // 0, 1, 2 land
    s.cancel();
    vi.advanceTimersByTime(10_000);
    expect(painted).toEqual([0, 1, 2]);
  });

  it('keeps working after a cancel', () => {
    const s = createScheduler();
    s.cancel();
    const fn = vi.fn();
    s.after(10, fn);
    vi.advanceTimersByTime(10);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('forgets a timer once it has fired', () => {
    const s = createScheduler();
    s.after(10, () => {});
    expect(s.pending).toBe(1);
    vi.advanceTimersByTime(10);
    expect(s.pending).toBe(0);
  });
});
