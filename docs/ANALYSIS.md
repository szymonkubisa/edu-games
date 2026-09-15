# edu-games — technical analysis & roadmap to public release

> **Status: acted on.** This is the audit the rewrite came from, kept as the record of
> what was wrong and why the current architecture looks the way it does. Every finding
> in §8 has been addressed — see the table at the end of this file for where each one
> landed. The "today" described in §1 is the pre-rewrite single-file version, which you
> can still read at tag `v0-single-file` or in the history before the refactor commit.

Scope: architecture, correctness, UX/UI, accessibility, test strategy, publishing readiness.
Everything marked **[verified]** was reproduced in a headless Chromium run against the current
`main`, not inferred from reading the source.

---

## 1. What the project is today

| File | Lines | CSS | JS | Notes |
|---|---:|---:|---:|---|
| `index.html` | 161 | 68 | 47 | menu, stars, badges, PL/EN toggle |
| `matematyka-na-wesolo.html` | 698 | 90 | 484 | 4 game modes (+ − × area-grid) |
| `czytanie-na-wesolo.html` | 912 | 124 | 682 | 4 modes + full PL/EN content corpus |
| `store.js` | 86 | — | 86 | the only shared module |

Three self-contained HTML documents, one shared global (`window.EduStore`), no build, no
dependencies, no tests, no CI. Deployable by copying files to any static host — that is a real
asset and worth preserving.

**Duplication**: 24 CSS declarations are byte-identical across the two game files; the design
tokens (`:root`), button system, `pop`/`wob`/`shk`/`fall` keyframes and confetti are copy-pasted
three times. Two *different* audio engines exist for the same job — math uses
`tone(freq, vol, dur)` (fires immediately), reading uses `tone(f, t, d, type, g)` (scheduled with
an offset). `shuffle`, `$`, star-bump and confetti are each written twice.

---

## 2. Correctness

### 2.1 Stale `setTimeout` reroll the question under the child **[verified]** — High

Every math mode ends a correct answer with `setTimeout(kQuizNext, 2200)`. Nothing cancels it.
Switching tabs calls `refresh()`, which generates a *new* question immediately — then the orphaned
timer fires and generates *another* one.

Reproduced: answer correctly on ✖️, switch to ➕ and back to ✖️, sit still.
`kQuizNext` ran **twice**; the displayed question changed `5×2 → 3×4` with no input.
For a 6-year-old mid-count, the problem silently changing is the worst possible failure.

Same pattern in `aQuizNext`, `sQuizNext`, `gQuizNext`. The animation loops are already guarded by
the `kAnim`/`aAnim`/`sAnim`/`gAnim` generation counters — the timers simply were not given the
same treatment. Fix: one `schedule()` helper per mode that stores and clears its handle, or route
every deferred action through an `AbortController` tied to the generation counter.

### 2.2 Answer latency is 3.4 s **[verified]** — Medium

Correct tap → next question measured at **3417 ms** (777 ms to the star, then a hard-coded 2200 ms,
plus the replay animation, which for 5×5 alone is 25 × 96 ms ≈ 2.4 s — worst case ≈ 4.6 s).

The "let's count it together" replay is pedagogically right, so do not delete it. But there is no
way to skip it: no tap-to-continue, no "Next" button. Make the whole board tappable during the
replay to jump straight to the next question, and drop the fixed delay to ~1200 ms.

### 2.3 Dead code — Low

`buildQuestions()` (`czytanie-na-wesolo.html`) ends with `const pq = story ? story.q : null;` —
assigned, never read. `PAGES`/`SIDE`/`storyPage` navigation is correct but undocumented and easy
to break.

### 2.4 Cross-tab / back-navigation state — Low, but cheap insurance

`EduStore` reads `localStorage` once at load and holds `data` in memory; `save()` writes the whole
blob. Two open tabs will clobber each other's stars (last writer wins). `index.html` renders once
at script end, so a bfcache restore (iOS Safari back button is the common case) shows a stale star
count. Both are fixed by a `storage` event listener plus re-rendering on `pageshow`/
`visibilitychange`.

---

## 3. UX / UI

### 3.1 The language toggle does not reach the maths game — High

`index.html` and `czytanie-na-wesolo.html` share `EduStore.get('lang')` and switch fully.
`matematyka-na-wesolo.html` has **no** toggle, `<html lang="pl">` hardcoded, 31 Polish string
literals in its JS plus every label in its markup. Switch to EN on the menu, tap Maths, land in
Polish. For a public bilingual app this is the most visible single defect.

Fix shape: lift the reading game's `PL`/`EN` dictionary pattern into a shared `i18n.js`, move the
maths copy into it, and render labels through it. This also unblocks a third language later.

### 3.2 Stars are farmable, so badges mean nothing **[verified]** — High (design)

"🗣️ Czytam" and "😄 Śmieszne" are self-graded: the child taps *"✅ Umiem!"* and gets a star with no
verification. Measured: **5 taps = 5 stars in ~6 s**. Story quiz pays 4 stars per story; word
matching pays 1 per round; maths pays 1 per solved problem.

Four different economies feeding one counter, one of which is a tap-farm. The 👑 100-star badge is
therefore ~100 taps away and carries no signal. Options, in order of preference:

1. Split the currency: self-graded modes award a separate "practice" counter (e.g. 📚 pages read),
   badges key off verified stars only.
2. Keep one counter but rate-limit self-graded stars (one per distinct word per session).
3. Make the card mode verifiable with the Web Speech **recognition** API where available — it is
   the natural fit for a "read this out loud" exercise and is a genuinely differentiating feature.

### 3.3 Badge unlocks are invisible where they happen — Medium

`EduStore.addStar()` already returns `{ count, newBadges }`. Neither game reads `newBadges`.
A child crosses 10 stars mid-game and nothing happens; the badge is only discoverable by going
back to the menu. This is free dopamine being thrown away — a toast + the existing fanfare is ~15
lines.

### 3.4 Smaller UX items

- **Answer count is inconsistent**: maths offers 4 options, the reading quiz offers 3. Pick one.
- **Grid affordance lies in quiz mode**: cells keep `cursor:pointer` and hover guide-lines, but
  `gPick()` returns early — clicking does nothing, silently.
- **No progress or session framing anywhere in maths.** The reading game shows "Zdanie 3 z 14";
  maths is an infinite stream with no arc, no "5 in a row!", no end. Children need a finish line.
- **No difficulty adaptation.** `kg`/`kk` are `2 + rand*4` forever. A child who has mastered ×2
  still gets ×2. Track per-fact accuracy in `EduStore` and weight the sampler — a small change
  with a large pedagogical payoff, and the single strongest argument for the app existing.
- **"Wyzeruj postępy" uses `confirm()`** — native dialog, unstyled, trivially dismissed by a child
  tapping through. Use an in-page confirm.
- **End screen reports lifetime stars, not session stars**: `end(stars)` passes the cumulative
  total, so "Great reading! You have 47 ⭐" says nothing about the story just finished.

---

## 4. Accessibility **[verified]**

Measured on the maths page:

| Check | Result |
|---|---|
| Focusable grid cells | **0 of 100** — `<div>` + click handler, no `tabindex`, no `role` |
| `aria-live` regions | **0** — hints and feedback are silent to screen readers |
| Tabs with `role="tab"` / `aria-selected` | **none** — styled `<button>`s only |
| `<main>` / `<nav>` landmarks | **0 / 0** |
| `<meta name="description">` | absent on all three pages |

What is already good: `prefers-reduced-motion` is honoured in both games' CSS (and the maths JS
checks `REDUCED` before animating and before confetti), `:focus-visible` outlines are defined,
`aria-label` is present on icon buttons and `aria-pressed` on the syllables toggle. The foundations
are there; the gaps are mechanical.

Highest value fixes, in order: make the grid cells real `<button>`s (keyboard + screen reader in
one change), add `aria-live="polite"` to `.hint` and `.fb`, add `role="tablist"`/`role="tab"`/
`aria-selected` to both tab strips, wrap content in `<main>`.

Also worth a check before launch: `--sun` (#F0A11F) and the `#8A7FB0` / `#6B5E8E` muted greys
against `--bg` are borderline for WCAG AA at the sizes used. Run an automated pass (§6).

---

## 5. Publishing readiness

- `.DS_Store` is committed. `.gitignore` does not exist.
- `README.md` is one line (`# edu-games`). No screenshots, no "what is this", no run instructions,
  no content/curriculum note for parents, no contribution guide.
- **No `LICENSE`.** Without one, "public" means legally unusable by anyone else.
- No favicon, no `theme-color`, no Open Graph tags, no `manifest.json` — shared links render bare
  and the app cannot be added to a tablet home screen. This app is a textbook PWA case: kids' app,
  tablet, offline car journeys. A service worker over 4 static files is ~30 lines.
- Google Fonts is a hard external dependency (`Baloo 2`). In this sandbox the request failed and
  the app silently fell back to Comic Sans — acceptable, but self-hosting one woff2 removes a
  third-party request (relevant for a children's app and GDPR posture) and makes it work offline.
- `.claude/launch.json` hardcodes `/opt/homebrew/bin/python3` — macOS-only, breaks for any
  contributor on Linux/Windows.
- No CI. Nothing stops a broken commit from reaching the published site.

---

## 6. Test strategy

There is no test harness at all, and the code as written is hard to test: every function is a
closure inside an inline `<script>`, reachable only through the DOM. The architecture change in §7
is what makes testing cheap — do them together.

**Layer 1 — unit (Vitest), fast, most of the value.** Extractable pure logic:
`EduStore` (star accounting, badge thresholds, reset semantics, corrupt-JSON recovery,
quota-exceeded write), `pl()` Polish pluralisation (1/2-4/5+ and the 12-14 exception — currently
untested and easy to get wrong), `render()` syllable splitting, `shuffle` distribution,
`makeAnswers` distractor generation (never negative, always contains the answer, always 4 distinct
— worth a property test), and the story generator: for all 5×5×5×5 = 625 hero/friend/place/thing
combinations × 4 stories, assert no `undefined` leaks into the text and every gendered verb form
resolves. That last one is 2 500 assertions from ~10 lines and would have caught the missing-spaces
bug fixed in `94a8b95`.

**Layer 2 — component/DOM (Vitest + jsdom).** Each game mode rendered in isolation: correct answer
awards exactly one star; wrong answer awards none and does not lock; mode switch cancels pending
timers (the §2.1 regression test); syllable toggle re-renders the visible page only.

**Layer 3 — E2E (Playwright), few but real.** Menu → maths → answer → star persists → back to menu
shows the new total. Story: pick 4 chips → read to the end → 4 quiz questions → end screen.
Language switch survives navigation (the §3.1 regression test). Plus two cheap automated gates:
`@axe-core/playwright` on all three pages, and a 360 px-wide screenshot check for horizontal
overflow — I verified there is currently none at 360 px, including the 10×10 grid, so that is a
baseline worth locking in.

**CI**: GitHub Actions on push/PR — lint, unit, E2E, axe. Deploy to GitHub Pages on green `main`.

---

## 7. Target architecture

### Recommendation

**Vite + vanilla ES modules + Vitest + Playwright.** Not Vue.

Reasoning: the app is ~1 200 lines of genuinely imperative work — timed reveal animations, Web
Audio scheduling, grid painting. A component framework does not simplify that; it wraps it. Vite
alone buys ES modules, a dev server, and a static build that keeps the current "upload four files
anywhere" deployment property. Zero runtime dependencies stays true.

The honest counter-argument: if the plan is many more games and outside contributors, Vue 3 + Vite
collapses the four near-identical maths modes into one component with props, and you already think
in that idiom. The module boundaries below are deliberately framework-agnostic — they map 1:1 onto
components if you take that route, so this is not a decision you have to make now.

### Proposed layout

```
src/
  core/
    store.js          EduStore + storage events + schema migration
    audio.js          ONE tone engine (merge the two) + blips/fanfare
    confetti.js       shared, reduced-motion aware
    dom.js            $, el(), shuffle, animation-generation helper
    schedule.js       cancellable setTimeout tied to a generation counter  ← fixes §2.1
    i18n.js           t(key), lang switching, <html lang> sync             ← fixes §3.1
  ui/
    theme.css         :root tokens, button system, keyframes  ← kills the 3× duplication
    tabs.js           accessible tablist (role/aria-selected/arrow keys)
    stars.js          counter + bump + badge-unlock toast     ← fixes §3.3
  games/
    math/
      countingMode.js factory: {op, render, hint, range} → one mode
      grid.js         the 10×10 area model
      index.js
    reading/
      story.js        generator (pure — directly unit-testable)
      words.js  cards.js  fun.js
  content/
    pl/  en/          data split out of the code: heroes, places, words, stories, math copy
tests/
  unit/  dom/  e2e/
```

The single biggest code win is `countingMode.js`. `kQuizNext`, `aQuizNext` and `sQuizNext` are the
same 25-line function three times over, differing only in the operator, the operand ranges, the
hint string and whether items appear or grey out. Collapsing them removes roughly 150 lines and
makes "add division" a config object rather than a fourth copy.

Second biggest: moving `PL`/`EN` out of `czytanie-na-wesolo.html` into `content/`. Right now 315 of
that file's 912 lines are data. Once it is JSON-ish and separate, a non-programmer can add stories,
and the story generator becomes a pure function you can property-test across all 625 combinations.

### Migration order (each step ships independently, nothing big-bang)

1. `.gitignore`, remove `.DS_Store`, `LICENSE`, real `README`. **Do this first — it is what
   "public" actually requires.**
2. Extract `theme.css` and `core/` from the three files. No behaviour change. Add Vite.
3. Vitest + the `EduStore` / `pl()` / story-generator unit tests. CI green.
4. Fix §2.1 (`schedule.js`) and §3.1 (i18n for maths) — now with regression tests behind them.
5. Accessibility pass (§4) + axe in CI.
6. `countingMode.js` refactor; content split to `content/`.
7. Playwright E2E, GitHub Pages deploy on green.
8. UX layer: badge toasts, session arcs, skippable replay, adaptive difficulty (§3.4).
9. PWA: manifest, service worker, self-hosted font.

Steps 1–3 are roughly a weekend and get the repo to "safe to show people". 4–7 are the ones that
make it maintainable by someone other than you. 8 is the one that makes it *good*.

---

## 8. Ranked summary

| # | Finding | Severity | Effort |
|---|---|---|---|
| 1 | No `LICENSE` — blocks public release outright | High | trivial |
| 2 | Stale timers reroll the question mid-count (§2.1) | High | S |
| 3 | Maths game ignores the language setting (§3.1) | High | M |
| 4 | Self-graded stars are farmable; badges carry no signal (§3.2) | High | M |
| 5 | Grid is keyboard-inaccessible, no live regions (§4) | High | S |
| 6 | No tests, no CI (§6) | High | M–L |
| 7 | 3.4 s unskippable delay after every correct answer (§2.2) | Medium | S |
| 8 | Badge unlocks invisible in-game (§3.3) | Medium | S |
| 9 | Triplicated CSS/audio/helpers (§1) | Medium | M |
| 10 | No favicon/OG/manifest/offline (§5) | Medium | S |
| 11 | No difficulty adaptation (§3.4) | Medium | M |
| 12 | `.DS_Store` committed, one-line README (§5) | Low | trivial |
| 13 | macOS-only `.claude/launch.json` (§5) | Low | trivial |
| 14 | Dead code, 3-vs-4 answer inconsistency (§2.3, §3.4) | Low | trivial |

---

## 9. Outcome

Every item above was implemented. Where the finding was verified by a reproduction, the
fix is now pinned by a regression test that fails against the old behaviour.

| # | Finding | Where it landed | Pinned by |
|---|---|---|---|
| 1 | No `LICENSE` | `LICENSE` (MIT) | — |
| 2 | Stale timers reroll the question | `src/core/schedule.js`; every mode owns a scheduler and `suspend()`s on tab change | `schedule.test.js`, `regressions.spec.js` |
| 3 | Maths ignores the language setting | `src/content/math.js`, `src/core/i18n.js` | `regressions.spec.js` ×3 |
| 4 | Farmable stars | separate `practice` currency in the store; badges key off stars only | `store.test.js`, `regressions.spec.js` |
| 5 | Grid inaccessible, no live regions | `role="grid"` of `<button>`s with roving tabindex + arrow keys; `role="status"` regions | `a11y.spec.js` (axe, 0 violations), `regressions.spec.js` |
| 6 | No tests, no CI | 109 unit + 78 E2E; `.github/workflows/ci.yml` | — |
| 7 | 3.4 s unskippable delay | tap the board to skip the replay; follow-on delay cut to 1200 ms | `regressions.spec.js` (asserts < 2.5 s) |
| 8 | Badge unlocks invisible in-game | `src/ui/toast.js` + `createStarCounter` reads `newBadges` | `regressions.spec.js` |
| 9 | Triplicated CSS/audio/helpers | `src/ui/theme.css`, `src/core/audio.js`, `src/core/dom.js`; `countingMode.js` collapses three modes into one | `ui.test.js` |
| 10 | No favicon/OG/manifest/offline | `public/icons/`, `public/manifest.webmanifest`, `public/sw.js` | — |
| 11 | No difficulty adaptation | `src/games/math/facts.js`, per-fact `{seen, wrong}` in the store | `facts.test.js` |
| 12 | `.DS_Store`, one-line README | `.gitignore`, full `README.md` with screenshots | — |
| 13 | macOS-only launch config | `.claude/launch.json` now runs `npm` | — |
| 14 | Dead code, 3-vs-4 answers | removed; reading quiz now offers 4 options like maths | `regressions.spec.js` |

Two things found during the rewrite, not in the original audit:

- **Distractor spread.** `answerOptions` drew offsets from a flat `±1…±10` pool, so an
  answer of 10 could appear against 0 and 20 — dismissible without counting. Offsets are
  now banded nearest-first (`facts.test.js`).
- **Steppers at 40% opacity.** The explore controls were dimmed rather than hidden during
  a quiz, which failed AA contrast at 1.83:1. They are hidden now — an unusable control is
  noise, not information.
