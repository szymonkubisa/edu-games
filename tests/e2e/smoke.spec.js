import { test, expect } from '@playwright/test';
import { progress, answerCorrectly, skipReplayAndWait, readWholeStory } from './helpers.js';

test.describe('menu', () => {
  test('lists both games and all five badges', async ({ page }) => {
    await page.goto('/index.html');
    await expect(page.locator('.game')).toHaveCount(2);
    await expect(page.locator('.badge')).toHaveCount(5);
    await expect(page.locator('#starN')).toHaveText('0');
  });

  test('reset asks first and then clears progress', async ({ page }) => {
    await page.goto('/matematyka-na-wesolo.html');
    await answerCorrectly(page, '#secMul');
    await skipReplayAndWait(page, '#secMul');

    await page.goto('/index.html');
    await expect(page.locator('#starN')).toHaveText('1');

    await page.getByRole('button', { name: /Wyzeruj|Reset/ }).click();
    await expect(page.locator('dialog[open]')).toBeVisible();
    await page.getByRole('button', { name: /Anuluj|Cancel/ }).click();
    await expect(page.locator('#starN')).toHaveText('1'); // cancel keeps progress

    await page.getByRole('button', { name: /Wyzeruj|Reset/ }).click();
    await page.getByRole('button', { name: /Tak, wyzeruj|Yes, reset/ }).click();
    await expect(page.locator('#starN')).toHaveText('0');
  });
});

test.describe('maths', () => {
  test('a correct answer awards a star that survives navigation', async ({ page }) => {
    await page.goto('/matematyka-na-wesolo.html');
    await answerCorrectly(page, '#secMul');
    await skipReplayAndWait(page, '#secMul');
    expect((await progress(page)).stars.math).toBe(1);

    await page.goto('/index.html');
    await expect(page.locator('#starN')).toHaveText('1');
    await expect(page.locator('[data-math-stars]')).toHaveText('1 ⭐');
  });

  test('a wrong answer costs nothing and lets the child retry', async ({ page }) => {
    await page.goto('/matematyka-na-wesolo.html');
    const a = Number(await page.locator('#secMul [data-val="a"]').innerText());
    const b = Number(await page.locator('#secMul [data-val="b"]').innerText());
    const wrong = page.locator('#secMul [data-ans] button', { hasNotText: new RegExp(`^${a * b}$`) }).first();
    await wrong.click();
    await expect(page.locator('#secMul [data-hint]')).toContainText(/Prawie|Almost/);
    const saved = await progress(page);
    expect(saved.stars.math).toBe(0);
    // the miss is remembered, so the sampler can bring this fact back sooner
    expect(saved.facts[`mul:${a}x${b}`]).toEqual({ seen: 1, wrong: 1 });
    await expect(page.locator('#secMul [data-ans] button')).toHaveCount(4);
  });

  test('every operation offers four answers and one is right', async ({ page }) => {
    await page.goto('/matematyka-na-wesolo.html');
    for (const [tab, section] of [['add', '#secAdd'], ['sub', '#secSub'], ['mul', '#secMul']]) {
      await page.locator(`[data-tab="${tab}"]`).click();
      await expect(page.locator(`${section} [data-ans] button`)).toHaveCount(4);
      await answerCorrectly(page, section);
      await expect(page.locator(`${section} [data-hint]`)).toContainText(/gwiazdk|star/i, { timeout: 8000 });
    }
  });

  test('the round fills up and ends with a celebration', async ({ page }) => {
    await page.goto('/matematyka-na-wesolo.html');
    await expect(page.locator('.dot')).toHaveCount(10);
    for (let i = 0; i < 10; i++) {
      await answerCorrectly(page, '#secMul');
      await skipReplayAndWait(page, '#secMul');
      if (i < 9) await expect(page.locator('.dot.done')).toHaveCount(i + 1);
    }
    await expect(page.locator('[data-rounddone]')).toBeVisible();
    await page.locator('[data-rounddone-again]').click();
    await expect(page.locator('#secMul')).toBeVisible();
  });

  test('explore mode lets the child drive the numbers', async ({ page }) => {
    await page.goto('/matematyka-na-wesolo.html');
    await page.locator('#secMul [data-modeswitch="explore"]').click();
    const before = Number(await page.locator('#secMul [data-val="a"]').innerText());
    await page.locator('#secMul [data-step="a"][data-d="1"]').click();
    await expect(page.locator('#secMul [data-val="a"]')).toHaveText(String(before + 1));
    await expect(page.locator('#secMul [data-ans] button')).toHaveCount(0);
  });

  test('the steppers are inert during a quiz', async ({ page }) => {
    await page.goto('/matematyka-na-wesolo.html');
    await expect(page.locator('#secMul [data-step="a"][data-d="1"]')).toBeDisabled();
  });

  test('the area grid asks for the product and accepts it', async ({ page }) => {
    await page.goto('/matematyka-na-wesolo.html');
    await page.locator('[data-tab="grid"]').click();
    await expect(page.locator('.cell')).toHaveCount(100);
    const eq = await page.locator('#secGrid [data-eq]').innerText();
    const [a, b] = eq.match(/\d+/g).map(Number);
    await page.locator('#secGrid [data-ans] button', { hasText: new RegExp(`^${a * b}$`) }).first().click();
    await page.locator('#secGrid [data-grid]').click();
    await expect(page.locator('#secGrid [data-hint]')).toContainText(/gwiazdk|star/i, { timeout: 8000 });
  });
});

test.describe('reading', () => {
  test('a chosen cast produces a readable story and a four-question quiz', async ({ page }) => {
    await page.goto('/czytanie-na-wesolo.html');
    await expect(page.locator('[data-go]')).toBeDisabled();
    for (const group of ['h', 'f', 'p', 't']) {
      await page.locator(`[data-chips="${group}"] .chip`).first().click();
    }
    await expect(page.locator('[data-go]')).toBeEnabled();
    await page.locator('[data-go]').click();

    await expect(page.locator('[data-now]')).not.toBeEmpty();
    await expect(page.locator('[data-progress]')).toContainText(/1/);
    expect(await readWholeStory(page)).toBe(true);
    await expect(page.locator('[data-options] .opt')).toHaveCount(4);
  });

  test('answering all four questions earns four stars and reports the story total', async ({ page }) => {
    await page.goto('/czytanie-na-wesolo.html');
    for (const group of ['h', 'f', 'p', 't']) {
      await page.locator(`[data-chips="${group}"] .chip`).first().click();
    }
    await page.locator('[data-go]').click();
    await readWholeStory(page);

    for (let i = 0; i < 4; i++) {
      await page.locator('[data-options] .opt').first().waitFor();
      const options = page.locator('[data-options] .opt');
      for (let k = 0; k < (await options.count()); k++) {
        await options.nth(k).click();
        if (await page.locator('[data-feedback]').innerText().then(t => /Brawo|Great/.test(t))) break;
      }
      await page.waitForTimeout(1200);
    }
    await expect(page.locator('[data-page="end"]')).toBeVisible();
    await expect(page.locator('[data-end-text]')).toContainText('4');
    expect((await progress(page)).stars.reading).toBe(4);
  });

  test('syllable mode splits words and survives a reload', async ({ page }) => {
    await page.goto('/czytanie-na-wesolo.html');
    await page.locator('[data-tab="words"]').click();
    await expect(page.locator('.syl0')).toHaveCount(0);
    await page.locator('[data-syllables]').click();
    await expect(page.locator('[data-syllables]')).toHaveAttribute('aria-pressed', 'true');
    await page.reload();
    await expect(page.locator('[data-syllables]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('word matching awards a verified star', async ({ page }) => {
    await page.goto('/czytanie-na-wesolo.html');
    await page.locator('[data-tab="words"]').click();
    const options = page.locator('[data-word-options] .opt');
    await expect(options).toHaveCount(4);
    for (let i = 0; i < (await options.count()); i++) {
      await options.nth(i).click();
      if (/Brawo|Great/.test(await page.locator('[data-word-feedback]').innerText())) break;
    }
    await expect(page.locator('#starN')).not.toHaveText('0');
  });
});
