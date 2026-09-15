export const STORAGE_KEY = 'eduGames.v2';

export const progress = page => page.evaluate(k => JSON.parse(localStorage.getItem(k) || 'null'), STORAGE_KEY);

export const setLang = (page, lang) =>
  page.addInitScript(
    ([key, value]) => localStorage.setItem(key, JSON.stringify({ v: 2, settings: { lang: value } })),
    [STORAGE_KEY, lang]
  );

/** Reads the visible operands and taps the right answer for the active section. */
export async function answerCorrectly(page, section) {
  // The next question arrives on a timer after a star, so wait for its options.
  await page.locator(`${section} [data-ans] button`).nth(3).waitFor({ state: 'visible' });
  const a = Number(await page.locator(`${section} [data-val="a"]`).innerText());
  const b = Number(await page.locator(`${section} [data-val="b"]`).innerText());
  const op = await page.locator(`${section} [data-eq]`).innerText();
  const correct = op.includes('×') ? a * b : op.includes('−') ? a - b : a + b;
  await page.locator(`${section} [data-ans] button`, { hasText: new RegExp(`^${correct}$`) }).first().click();
  return correct;
}

/** Skips the count-along replay and waits for the star to land. */
export async function skipReplayAndWait(page, section) {
  const before = (await progress(page))?.stars?.math ?? 0;
  await page.locator(`${section} [data-board], ${section} [data-grid]`).first().click();
  await page.waitForFunction(
    ([key, was]) => (JSON.parse(localStorage.getItem(key) || '{}')?.stars?.math ?? 0) > was,
    [STORAGE_KEY, before],
    { timeout: 8000 }
  );
}

export async function readWholeStory(page) {
  for (let i = 0; i < 40; i++) {
    if (await page.locator('[data-page="quiz"]').isVisible()) return true;
    await page.locator('[data-next]').click();
  }
  return false;
}
