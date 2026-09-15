import { test, expect } from '@playwright/test';
import { progress, answerCorrectly, skipReplayAndWait, setLang } from './helpers.js';

/* Each test here pins one defect found in the pre-refactor single-file version.
   They are written to fail against that behaviour, not just to pass against
   this one. */

test.describe('regressions', () => {
  test('leaving and re-entering a tab does not reroll the question', async ({ page }) => {
    // Was: a correct answer scheduled the next question 2.2 s out with a bare
    // setTimeout that nothing cancelled. Switching tabs generated a new
    // question immediately, then the orphan fired and changed it again — the
    // problem moved under a child who was still counting.
    await page.goto('/math.html');
    await answerCorrectly(page, '#secMul');
    await page.locator('[data-tab="add"]').click();
    await page.locator('[data-tab="mul"]').click();

    const question = await page.locator('#secMul [data-eq]').innerText();
    await page.waitForTimeout(3500); // longer than the old 2200 ms timer
    expect(await page.locator('#secMul [data-eq]').innerText()).toBe(question);
  });

  test('the count-along replay can be skipped', async ({ page }) => {
    // Was: 3.4 s from a correct tap to the next question, with no way past it.
    await page.goto('/math.html');
    const started = Date.now();
    await answerCorrectly(page, '#secMul');
    await skipReplayAndWait(page, '#secMul');
    expect(Date.now() - started).toBeLessThan(2500);
  });

  test('the maths game honours the language chosen on the menu', async ({ page }) => {
    // Was: the menu and the reading game shared `lang`; the maths game was
    // hardcoded Polish, so switching to EN and tapping Maths landed you in
    // Polish.
    await setLang(page, 'en');
    await page.goto('/math.html');
    await expect(page.locator('[data-title]')).toHaveText('Fun Maths');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('#secMul [data-hint]')).toContainText('altogether');
    await expect(page.locator('[data-tab="add"]')).toContainText('Adding');
  });

  test('the language switch reaches every maths string, then switches back', async ({ page }) => {
    await page.goto('/math.html');
    await page.locator('[data-lang]').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await page.locator('[data-tab="grid"]').click();
    await expect(page.locator('#secGrid [data-hint]')).toContainText(/area|row/i);
    await page.locator('[data-lang]').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'pl');
    await expect(page.locator('#secGrid [data-hint]')).toContainText(/Policz|rząd|rzędy/);
  });

  test('language choice persists across pages', async ({ page }) => {
    await page.goto('/index.html');
    await page.locator('[data-lang]').click();
    await expect(page.locator('[data-title]')).toContainText('Fun Games');
    await page.locator('.game.math').click();
    await expect(page.locator('[data-title]')).toHaveText('Fun Maths');
    await page.locator('[data-home]').click();
    await expect(page.locator('[data-title]')).toContainText('Fun Games');
  });

  test('self-graded reading cannot mint badges', async ({ page }) => {
    // Was: "✅ Umiem!" awarded a star with no verification — 5 taps, 5 stars,
    // so the 100-star crown was ~100 taps away and meant nothing.
    await page.goto('/reading.html');
    await page.locator('[data-tab="cards"]').click();
    for (let i = 0; i < 5; i++) {
      await page.locator('[data-card-good]').click();
      await page.waitForTimeout(1200);
    }
    const saved = await progress(page);
    expect(saved.practice.reading).toBe(5);
    expect(saved.stars.reading).toBe(0);
    expect(saved.badges).toEqual([]);
    await expect(page.locator('#starN')).toHaveText('0');
    await expect(page.locator('#practiceN')).toHaveText('5');
  });

  test('the menu star count is current after the browser back button', async ({ page }) => {
    // Was: index.html rendered once at script end, so a bfcache restore showed
    // whatever the count was when the page froze.
    await page.goto('/index.html');
    await expect(page.locator('#starN')).toHaveText('0');
    await page.goto('/math.html');
    await answerCorrectly(page, '#secMul');
    await skipReplayAndWait(page, '#secMul');
    await page.goBack();
    await expect(page.locator('#starN')).toHaveText('1');
  });

  test('badge unlocks are announced in the game, not only on the menu', async ({ page }) => {
    // Was: the store returned `newBadges` and nothing read it.
    await page.goto('/math.html');
    await answerCorrectly(page, '#secMul');
    await expect(page.locator('.toast')).toContainText(/Pierwsza gwiazdka|First star/, { timeout: 8000 });
  });

  test('the grid is keyboard operable', async ({ page }) => {
    // Was: 100 `<div>`s with click handlers — zero focusable, invisible to
    // screen readers.
    await page.goto('/math.html');
    await page.locator('[data-tab="grid"]').click();
    await page.locator('#secGrid [data-modeswitch="explore"]').click();

    const first = page.locator('.cell').first();
    await first.focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('.cell:focus')).toHaveAttribute('aria-label', /2.*2/);
    await page.keyboard.press('Enter');
    await expect(page.locator('#secGrid [data-eq]')).toContainText('2');
  });

  test('the grid does not invite taps it ignores during a quiz', async ({ page }) => {
    // Was: cells kept cursor:pointer and hover guides in quiz mode, but the
    // click handler returned early — tapping did nothing, silently.
    await page.goto('/math.html');
    await page.locator('[data-tab="grid"]').click();
    await expect(page.locator('.cell').first()).toBeDisabled();
  });

  test('both games offer the same number of answers', async ({ page }) => {
    await page.goto('/math.html');
    await expect(page.locator('#secMul [data-ans] button')).toHaveCount(4);
    await page.goto('/reading.html');
    await page.locator('[data-tab="words"]').click();
    await expect(page.locator('[data-word-options] .opt')).toHaveCount(4);
  });

  test('the story end screen reports the story, not a lifetime total', async ({ page }) => {
    // Was: end(stars) passed the cumulative total — "you have 47 ⭐" said
    // nothing about the story just finished.
    await page.addInitScript(() =>
      localStorage.setItem(
        'eduGames.v2',
        JSON.stringify({ v: 2, stars: { math: 40, reading: 7 }, settings: {} })
      )
    );
    await page.goto('/reading.html');
    for (const group of ['h', 'f', 'p', 't']) {
      await page.locator(`[data-chips="${group}"] .chip`).first().click();
    }
    await page.locator('[data-go]').click();
    for (let i = 0; i < 40 && !(await page.locator('[data-page="quiz"]').isVisible()); i++) {
      await page.locator('[data-next]').click();
    }
    for (let i = 0; i < 4; i++) {
      const options = page.locator('[data-options] .opt');
      for (let k = 0; k < (await options.count()); k++) {
        await options.nth(k).click();
        if (/Brawo|Great/.test(await page.locator('[data-feedback]').innerText())) break;
      }
      await page.waitForTimeout(1200);
    }
    await expect(page.locator('[data-end-text]')).toContainText('4');
    await expect(page.locator('[data-end-text]')).not.toContainText('11');
  });

  test('progress survives a reload and a second tab does not clobber it', async ({ page, context }) => {
    await page.goto('/math.html');
    await answerCorrectly(page, '#secMul');
    await skipReplayAndWait(page, '#secMul');

    const other = await context.newPage();
    await other.goto('/index.html');
    await expect(other.locator('#starN')).toHaveText('1');

    await answerCorrectly(page, '#secMul');
    await skipReplayAndWait(page, '#secMul');
    await expect(other.locator('#starN')).toHaveText('2'); // storage event, not last-writer-wins
  });
});
