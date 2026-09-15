import store from './store.js';

/**
 * One Web Audio engine for both games (there used to be two, with different
 * signatures, doing the same job).
 */
let ctx = null;
let enabled = store.get('sound', true);

function context() {
  if (!ctx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  // iOS starts every context suspended until a gesture resumes it.
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function isSoundOn() {
  return enabled;
}

export function setSoundOn(on) {
  enabled = on;
  store.set('sound', on);
  if (on) context();
  return enabled;
}

export function toggleSound() {
  return setSoundOn(!enabled);
}

/** @param {number} freq Hz. `delay` is seconds from now. */
export function tone(freq, { delay = 0, dur = 0.2, type = 'sine', gain = 0.16 } = {}) {
  if (!enabled) return;
  const a = context();
  if (!a) return;
  try {
    const osc = a.createOscillator();
    const amp = a.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(gain, a.currentTime + delay);
    amp.gain.exponentialRampToValueAtTime(0.001, a.currentTime + delay + dur);
    osc.connect(amp);
    amp.connect(a.destination);
    osc.start(a.currentTime + delay);
    osc.stop(a.currentTime + delay + dur + 0.01);
  } catch {
    /* audio is decoration; never let it break a game */
  }
}

const seq = (notes, step, opts) =>
  notes.forEach((f, i) => tone(f, { delay: i * step, dur: step * 2, ...opts }));

/** Rising blip while counting up — pitch tracks the running total. */
export const blipUp = i => tone(Math.min(320 + i * 26, 1300), { dur: 0.13, gain: 0.09 });
/** Falling blip while taking items away. */
export const blipDown = i => tone(Math.max(180, 640 - i * 55), { dur: 0.15, gain: 0.09 });

export const popSound = () => tone(660, { dur: 0.12 });
export const pageSound = () => {
  tone(440, { dur: 0.09 });
  tone(660, { delay: 0.08, dur: 0.12 });
};
export const goodSound = () => seq([523, 659, 784, 1047], 0.09, { dur: 0.22 });
export const badSound = () => tone(220, { dur: 0.25, type: 'square', gain: 0.08 });
export const fanfare = () => seq([523, 659, 784, 1047, 784, 1047, 1319], 0.11, { dur: 0.24 });
