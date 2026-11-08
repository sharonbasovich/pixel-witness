# Pixel Witness

Teach an edit. Catch the guess.

Pixel Witness is a local, bounded rule-inference prototype for original synthetic 8×8 pixel examples. Teach an edit, inspect remaining explanations, answer an informative question, and export batch results only when all surviving rules agree. Agreement is conditional on correct examples and intended behavior being in the 176-program language. One remaining program does not guarantee true intent.

## Run

The app has no external runtime dependencies or network calls. From this directory, run `python3 -m http.server 8000 --bind 127.0.0.1` and open `http://127.0.0.1:8000/index.html`. Open `/walkthrough.html` for the five-step synthetic walkthrough; `/standalone.html` is the bundled workbench. Use an ordinary supported HTTP browser workflow. No accounts, remote service, API key, build or dependency install is required to serve these assets.

## Verify and regenerate

Requires Node `^22.22.2 || ^24.15.0 || >=26.0.0` and JSDOM exactly `30.1.1` for DOM tests. Tested here with Node 24.22.1 and npm 11.9.0. `package-lock.json` contains only the existing JSDOM dependency closure, derived without network access or installing packages from the locally available lock. Optional canvas is not required for these tests.

For a normal developer checkout, the declared workflow is `npm ci --ignore-scripts` followed by `npm test`. A clean network install was NOT performed. Earlier portable-package validation tested an isolated extraction with `node_modules` symlinked to an already installed local dependency tree; the historical keyboard checks and this candidate’s diagnostics checks are described separately below. See PROVENANCE.md for package provenance and limitations. Standard Node package resolution is used; tests contain no workspace-specific imports or automatic sibling search.

- `npm test`: aggregate author and independent checks, deterministic benchmark gates, and exact artifact regeneration parity. Writes `VALIDATION.json` and named test receipts.
- `npm run build`: regenerate standalone and walkthrough assets from included sources.
- `npm run benchmark`: recompute `metrics.json` using frozen `protocol.json` and original synthetic fixtures.
- `sha256sum -c SHA256SUMS`: verify packaged file bytes before running checks (receipts generated afterward are not package members).

The aggregate compares generated assets to the originals before reporting success. A failed parity check may leave regenerated files in place; retain a clean extraction to inspect a failure. The independent checks are portable adaptations of previously separate reviews, not a newly commissioned external certification. Historical sibling-candidate comparisons and negative controls are not silently counted as current release checks.

## Included material

`core.mjs` defines the language and inference; `fixtures.mjs` contains original examples and seeded grids; `session.mjs` serializes and validates sessions. The new `diagnose.mjs` explains why saved examples leave no supported rule. `app.mjs`, `index.html`, and `style.css` implement the workbench. `build.mjs` makes the standalone bundle; `build_walkthrough.mjs` makes the five-step walkthrough, its data and SVG. Benchmark source, frozen protocol, metrics, sample JSON exports, author and independent tests, and the aggregate verifier are included. Core inference semantics, fixtures, serializer, protocol, metrics, sample exports and walkthrough assets are unchanged by the diagnostics addition.

## Read-only evidence diagnostics

When no rule fits, **Why no rule fits** distinguishes two cases:

- An example is unsupported even on its own. All individually unsupported saved examples are listed.
- Each example can be expressed alone, but some cannot share one rule. The panel identifies one inclusion-minimal conflicting group: removing any one member lets that group fit a rule. It is not necessarily the smallest or only conflicting group, and other saved evidence may still conflict.

Open a saved example to inspect its Before/After grids and every pixel coordinate. The review uses saved evidence, never pending canvas edits, and does not change a session or guess a result. It does not decide which example is wrong. If all examples reflect the intended edit, the language may simply be too limited.

To try the failure case, copy `sample-conflict-session.json` into **Restore a saved session** and review it. The original synthetic pair asks the same coral pixel to become teal in one saved example and gold in the other. Both edits fit supported rules alone; they cannot both be true for the same input under one deterministic rule. Restoring replaces your current session only after confirmation, so export any work you want to keep first.

For the latest example, Undo and repaint to teach a correction. For earlier evidence, export JSON and edit a copy, then use the existing review-before-restore flow. No automatic deletion or rewriting is introduced.

## Diagnostics candidate verification — November 8, 2026

This candidate starts from exact public main `5f2a5f555b0a35485e27e5bf3a98f01b79b6878d`; all 42 baseline files matched Git blob hashes before modification. New checks cover unsupported examples, redundant evidence, frozen inputs, the 64-example boundary, and 180 deterministic synthetic sessions. Source/bundle DOM tests cover read-only inspection, lazy coordinate tables, draft separation, Undo recovery and replacement cancellation. The full local aggregate passed all 28 gates on Node 24.22.1 with existing JSDOM 30.1.1, including exact regeneration parity for all five generated artifacts. The diagnostic test has 1,740 assertions over 180 synthetic sessions; the source/bundle diagnostic UI test has 64 assertions. A clean dependency installation was not run.

The actual HTTP browser preview was unavailable (connection refused), so this diagnostics UI has **not** passed native interaction, rendered/reflow, or assistive-technology acceptance. Local DOM tests are not a substitute. This is a source review candidate only; it does not update public Pages, downloadable releases, or the existing event draft. No new external service, dependency, network request, license grant, autosave, or successful-download claim is introduced.

## Acceptance and limits as of November 7, 2026

This bounded keyboard correction starts from public source commit `101d28e482ba8c18bd48f65df6607738398d7f0e`. Focused source/bundle JSDOM checks passed for canvas reentry, one roving tab stop, Discard/final Undo focus recovery, populated/empty restore and batch cancel. Existing accessibility, loss-protection, restore, batch/session and UI checks also passed against the correction. Independent review and native Chromium source/bundle acceptance passed for the keyboard correction. These checks do not establish broad accessibility or screen-reader support.

The final package was checked with the explicit keyboard-flow test, syntax checks, exact standalone regeneration parity, unchanged-file comparison and checksum verification. No new full aggregate run, benchmark run or clean dependency installation was performed for this correction. Prior core, benchmark and high-zoom acceptance below remains historical; unchanged bytes are not new execution evidence.

Historical acceptance of the preceding baseline runtime established native desktop interactions, saved synthetic JSON and SVG exports, five-step walkthrough navigation/disclosures, and browser 400% high-zoom reflow for the tested flows. At 400%, the accepted reflow workbench had viewport innerWidth 295, document clientWidth and scrollWidth 291. Those are historical native observations, not results of this package's JSDOM run, not a mobile-device test and not broad accessibility certification.

True mobile/touch devices, real screen-reader announcements, forced colors/reduced-motion rendering, actual browser leave/lifecycle dialogs, intended-recipient hosted access and production served bytes remain unverified. The historical private runtime source commit was `58f88d1c09c8ddb1698daec36a090a44360e5cb5`; this public correction does not modify that private deployment. This source preview does not establish a hosted demo, entry readiness, contest submission, real-world accuracy or measured productivity.

The benchmark is synthetic correctness and finite-pool query efficiency. Its target is guaranteed to be in the grammar for retention/heldout cases. Solving the 32-grid witness pool is not global equivalence. Query counts are capped at six, with unsolved cases reported separately. No claim of statistical superiority or algorithmic novelty is made.

The source is published for inspection and reproducibility. No open-source license is granted, and it is not presented as licensed open-source software. Package dependency licenses remain with their respective authors.
