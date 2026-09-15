import { getLang } from './i18n.js';

/**
 * Text-to-speech for "read this to me". Optional by design: the games stay
 * fully playable on a browser without speechSynthesis.
 */
export const canSpeak = () => typeof speechSynthesis !== 'undefined';

/** Voice lists load asynchronously in Chrome; warm them up early. */
export function warmUpVoices() {
  if (!canSpeak()) return;
  speechSynthesis.getVoices();
  speechSynthesis.addEventListener?.('voiceschanged', () => speechSynthesis.getVoices(), { once: true });
}

export function say(text) {
  if (!canSpeak() || !text) return false;
  const clean = String(text).replace(/\|/g, '');
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(clean);
  const lang = getLang();
  u.lang = lang === 'pl' ? 'pl-PL' : 'en-US';
  u.rate = 0.82;
  u.pitch = 1.05;
  const voice = speechSynthesis.getVoices().find(v => v.lang && v.lang.startsWith(lang));
  if (voice) u.voice = voice;
  speechSynthesis.speak(u);
  return true;
}
