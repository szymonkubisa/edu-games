/**
 * Syllable-marked text. Content stores words as `ko|ro|na`; the bar is a
 * syllable boundary that is stripped unless the child has syllable mode on.
 */

export const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** Drop syllable markers — the plain reading form. */
export const plain = t => String(t ?? '').replace(/\|/g, '');

const escapeHTML = s =>
  String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/**
 * @param {string} text word(s) with optional `|` markers
 * @param {boolean} syllables highlight alternating syllables
 * @returns {string} HTML; input is escaped, so untrusted content is safe
 */
export function renderText(text, syllables) {
  return plainWords(text)
    .map(word => {
      if (!syllables) return `<span class="w">${escapeHTML(plain(word))}</span>`;
      const parts = word.split('|').filter(Boolean);
      const inner = parts
        .map((p, i) => `<span class="syl${i % 2}">${escapeHTML(p)}</span>`)
        .join('');
      return `<span class="w">${inner}</span>`;
    })
    .join(' ');
}

const plainWords = text => String(text ?? '').split(' ');

/** Syllable count for a marked word — used by tests and future difficulty tuning. */
export const syllableCount = word => String(word ?? '').split('|').filter(Boolean).length;
