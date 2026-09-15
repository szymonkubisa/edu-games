# Contributing

Thanks for looking. This is a small project with a specific audience: children roughly
aged 5–8, reading in Polish or English, often on a tablet with no connection.

## Getting set up

```bash
npm install
npm run dev
```

Before opening a pull request:

```bash
npm run test:all   # unit tests, a build, then the browser + accessibility suite
```

## The constraints that matter

- **No runtime dependencies.** Vite is a build tool; nothing ships to the browser but our
  own code. A new dependency needs a reason that survives "could we write the 40 lines?".
- **No network after load.** No analytics, no fonts from a CDN, no third-party anything.
- **Accessible or it doesn't merge.** The axe suite runs on every page and every mode and
  must stay at zero violations. Interactive things are `<button>`s. Results go through a
  live region. Motion respects `prefers-reduced-motion`.
- **Both languages, always.** Every string lives in `src/content/`. A feature that only
  works in Polish is half a feature.
- **Nothing below 44px** that a child has to hit, and nothing scrolls sideways at 360px.

## Adding content

Stories, words and silly sentences are data, in `src/content/pl/reading.js` and
`src/content/en/reading.js`. `|` marks a syllable boundary (`ko|ro|na`).

The story generator is exercised against all 625 hero × friend × place × thing combinations
in both languages, checking for `undefined` leaks, missing or doubled spaces and run-together
words. If you add a hero or a place, run `npm test` — Polish gendered verb forms are exactly
the kind of thing that reads fine for four casts and breaks on the fifth.

## Adding a maths operation

`src/games/math/countingMode.js` is a factory. An operation is a config object: operator
symbol, operand ranges, an `answer(a, b)`, a board plan (which groups of items, revealed or
greyed out) and its hint copy. See how `add`, `sub` and `mul` are wired in
`src/entries/math.js`.

## Style

Match the surrounding code. Comments explain *why*, not *what* — several in this codebase
record a bug that the shape of the code now prevents; please keep that habit.

## Deployment

Every push to `main` is deployed by the repository's Vercel integration; pull requests get a
preview URL automatically. There is no deploy workflow in `.github/workflows/` — the build is
plain static files in `dist/`, so any static host works.

To publish on GitHub Pages instead, add a workflow that runs `npm ci && npm run build` and
feeds `dist/` to `actions/upload-pages-artifact` + `actions/deploy-pages`, and first set
**Settings → Pages → Source: GitHub Actions**. Without that setting the deploy step fails with
`Get Pages site failed`, which is why the workflow that used to live here was removed.
