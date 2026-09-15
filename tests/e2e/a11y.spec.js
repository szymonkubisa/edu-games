import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES = [
  ['menu', '/index.html'],
  ['maths', '/matematyka-na-wesolo.html'],
  ['reading', '/czytanie-na-wesolo.html']
];

/** Colour contrast is measured off the rendered pixels, so a scan that races a
    pop-in animation reads a half-faded word. Let animations settle first. */
const settle = page =>
  page.waitForFunction(() => document.getAnimations().every(a => a.playState !== 'running'), null, {
    timeout: 5000
  });

const scan = async page => {
  await settle(page);
  return new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
};

/** Names the offending markup in the failure message, not just the rule id. */
const describeViolations = ({ violations }) =>
  violations.flatMap(v => v.nodes.map(n => `${v.id}: ${n.html.slice(0, 120)}`));

for (const [name, url] of PAGES) {
  test(`${name}: no WCAG 2.1 AA violations`, async ({ page }) => {
    await page.goto(url);
    expect(describeViolations(await scan(page))).toEqual([]);
  });

  test(`${name}: no horizontal scroll at 360px`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto(url);
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    );
    expect(overflows).toBe(false);
  });

  test(`${name}: every interactive control is reachable and labelled`, async ({ page }) => {
    await page.goto(url);
    const unlabelled = await page.evaluate(() =>
      [...document.querySelectorAll('button:not([disabled]), a[href]')]
        .filter(node => node.offsetParent !== null)
        .filter(node => !(node.textContent.trim() || node.getAttribute('aria-label')))
        .map(node => node.outerHTML.slice(0, 80))
    );
    expect(unlabelled).toEqual([]);
  });
}

test('maths: the deep tabs and the grid stay clean', async ({ page }) => {
  await page.goto('/matematyka-na-wesolo.html');
  for (const tab of ['add', 'sub', 'grid']) {
    await page.locator(`[data-tab="${tab}"]`).click();
    expect(describeViolations(await scan(page)), `tab ${tab}`).toEqual([]);
  }
});

test('reading: every mode stays clean', async ({ page }) => {
  await page.goto('/czytanie-na-wesolo.html');
  for (const tab of ['words', 'cards', 'fun']) {
    await page.locator(`[data-tab="${tab}"]`).click();
    expect(describeViolations(await scan(page)), `tab ${tab}`).toEqual([]);
  }
});

test('reading: the story pages stay clean', async ({ page }) => {
  await page.goto('/czytanie-na-wesolo.html');
  for (const group of ['h', 'f', 'p', 't']) {
    await page.locator(`[data-chips="${group}"] .chip`).first().click();
  }
  await page.locator('[data-go]').click();
  expect(describeViolations(await scan(page))).toEqual([]);
  for (let i = 0; i < 40 && !(await page.locator('[data-page="quiz"]').isVisible()); i++) {
    await page.locator('[data-next]').click();
  }
  expect(describeViolations(await scan(page))).toEqual([]);
});

test('menu: the reset dialog traps focus and closes on Escape', async ({ page }) => {
  await page.goto('/index.html');
  await page.locator('[data-reset]').click();
  await expect(page.locator('dialog[open]')).toBeVisible();
  expect(describeViolations(await scan(page))).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
});
