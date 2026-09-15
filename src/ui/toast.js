import { el } from '../core/dom.js';

let layer = null;

function ensureLayer() {
  if (layer && layer.isConnected) return layer;
  layer = el('div.toast-layer', { 'aria-live': 'polite', 'aria-atomic': 'false' });
  document.body.append(layer);
  return layer;
}

/** Transient announcement. Lives in an aria-live region, so it is also spoken. */
export function toast(emoji, text, ms = 3200) {
  const node = el('div.toast', {}, el('span.em', { text: emoji, 'aria-hidden': 'true' }), el('span', { text }));
  ensureLayer().append(node);
  setTimeout(() => node.remove(), ms);
  return node;
}
