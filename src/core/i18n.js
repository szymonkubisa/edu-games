import store from './store.js';

export const LANGS = ['pl', 'en'];

let current = LANGS.includes(store.get('lang', 'pl')) ? store.get('lang', 'pl') : 'pl';
const listeners = new Set();

export const getLang = () => current;

export function setLang(lang) {
  if (!LANGS.includes(lang) || lang === current) return current;
  current = lang;
  store.set('lang', lang);
  syncDocumentLang();
  for (const fn of listeners) fn(current);
  return current;
}

export const toggleLang = () => setLang(current === 'pl' ? 'en' : 'pl');

export function onLangChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function syncDocumentLang() {
  if (typeof document !== 'undefined') document.documentElement.lang = current;
}

/** Label for the button that switches away from the current language. */
export const otherLangLabel = () => (current === 'pl' ? 'EN' : 'PL');

/**
 * Dictionary lookup bound to the live language.
 * Values may be strings or functions; functions are called with `t`'s extra args.
 */
export function createI18n(dicts) {
  const t = (key, ...args) => {
    const table = dicts[current] || dicts.pl;
    const value = key in table ? table[key] : (dicts.pl && dicts.pl[key]);
    if (value == null) return key; // surfaces the missing key instead of "undefined"
    return typeof value === 'function' ? value(...args) : value;
  };
  t.lang = () => current;
  t.dict = () => dicts[current] || dicts.pl;
  return t;
}

/**
 * Polish has three plural forms. 1 -> one; 2-4 -> few; everything else -> many,
 * with the 12-14 exception (dwanaście koszyków, not koszyki).
 * @param {number} n
 * @param {[string,string,string]} forms [one, few, many]
 */
export function plural(n, forms) {
  if (current !== 'pl') return n === 1 ? forms[0] : forms[1];
  const abs = Math.abs(n);
  if (abs === 1) return forms[0];
  const last = abs % 10;
  const lastTwo = abs % 100;
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return forms[1];
  return forms[2];
}

/** Pure variant for tests and for formatting in a language other than the active one. */
export function pluralIn(lang, n, forms) {
  if (lang !== 'pl') return n === 1 ? forms[0] : forms[1];
  const abs = Math.abs(n);
  if (abs === 1) return forms[0];
  const last = abs % 10;
  const lastTwo = abs % 100;
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return forms[1];
  return forms[2];
}

syncDocumentLang();
