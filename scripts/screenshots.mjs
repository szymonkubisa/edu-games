/**
 * Regenerates the README screenshots from the built app.
 *   npm run build && npm run shots
 * Starts its own preview server unless SHOT_BASE points at a running one.
 * Progress is seeded so the shots show a used app rather than an empty one.
 */
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const BASE = process.env.SHOT_BASE || 'http://127.0.0.1:4599';
const OUT = 'docs/screenshots';
const DESKTOP = { width: 900, height: 760 };
const PHONE = { width: 390, height: 780 };

const SEED = {
  v: 2,
  settings: { mathTheme: 'unicorn', syllables: false },
  stars: { math: 18, reading: 9 },
  practice: { math: 0, reading: 14 },
  badges: ['seed', 'ten'],
  facts: {}
};

/** Boots `npm run preview` and waits for it to answer, unless one is already up. */
async function startServer() {
  if (process.env.SHOT_BASE) return null;
  if (await reachable()) return null;
  const child = spawn('npm', ['run', 'preview'], { stdio: ['ignore', 'pipe', 'pipe'] });
  const since = Date.now();
  while (Date.now() - since < 30_000) {
    if (child.exitCode != null) throw new Error('preview server exited before it was ready');
    if (await reachable()) return child;
    await new Promise(r => setTimeout(r, 250));
  }
  child.kill();
  throw new Error(`preview server never answered on ${BASE}`);
}

async function reachable() {
  try {
    const res = await fetch(`${BASE}/index.html`, { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}

await mkdir(OUT, { recursive: true });

const server = await startServer();
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || undefined });

/** Clicks a stepper until it reads `target`, so shots are reproducible. */
async function setStepper(page, section, which, target) {
  for (let i = 0; i < 12; i++) {
    const value = Number(await page.locator(`${section} [data-val="${which}"]`).innerText());
    if (value === target) return;
    await page.locator(`${section} [data-step="${which}"][data-d="${value < target ? 1 : -1}"]`).click();
    await page.waitForTimeout(120);
  }
}

async function shot(name, { url, viewport = DESKTOP, lang = 'en', prepare, full = false }) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 2 });
  await context.addInitScript(
    seed => localStorage.setItem('eduGames.v2', JSON.stringify(seed)),
    { ...SEED, settings: { ...SEED.settings, lang } }
  );
  const page = await context.newPage();
  await page.goto(BASE + url);
  await page.waitForTimeout(400);
  if (prepare) await prepare(page);
  // Let pop-in animations finish so nothing is caught half-faded.
  await page
    .waitForFunction(() => document.getAnimations().every(a => a.playState !== 'running'), null, { timeout: 4000 })
    .catch(() => {});
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
  await context.close();
  console.log(`${OUT}/${name}.png`);
}

await shot('menu', { url: '/index.html' });

await shot('math-multiplication', {
  url: '/math.html',
  async prepare(page) {
    await page.locator('#secMul [data-modeswitch="explore"]').click();
    await setStepper(page, '#secMul', 'a', 3);
    await setStepper(page, '#secMul', 'b', 4);
    await page.waitForTimeout(2800);
  }
});

await shot('math-grid', {
  url: '/math.html',
  viewport: { width: 900, height: 1180 },
  async prepare(page) {
    await page.locator('[data-tab="grid"]').click();
    await page.locator('#secGrid [data-modeswitch="explore"]').click();
    await page.locator('.cell[data-r="6"][data-c="7"]').click();
    await page.waitForTimeout(2800);
  }
});

await shot('math-pl', {
  url: '/math.html',
  lang: 'pl',
  async prepare(page) {
    await page.locator('[data-tab="add"]').click();
    await page.waitForTimeout(300);
  }
});

await shot('reading-pick', { url: '/reading.html' });

await shot('reading-story', {
  url: '/reading.html',
  lang: 'pl',
  async prepare(page) {
    for (const group of ['h', 'f', 'p', 't']) {
      await page.locator(`[data-chips="${group}"] .chip`).nth(1).click();
    }
    await page.locator('[data-syllables]').click();
    await page.locator('[data-go]').click();
    for (let i = 0; i < 4; i++) await page.locator('[data-next]').click();
    await page.waitForTimeout(300);
  }
});

await shot('reading-words', {
  url: '/reading.html',
  async prepare(page) {
    await page.locator('[data-tab="words"]').click();
    await page.waitForTimeout(300);
  }
});

await shot('phone-math', {
  url: '/math.html',
  viewport: PHONE,
  async prepare(page) {
    await page.waitForTimeout(300);
  }
});

await shot('phone-reading', {
  url: '/reading.html',
  viewport: PHONE,
  async prepare(page) {
    await page.locator('[data-tab="fun"]').click();
    await page.waitForTimeout(400);
  }
});

await browser.close();
server?.kill();
