# Pixel Witness: experimental color-qualified editor source

This is experimental source, not a general-availability release or event submission. The frozen runtime intentionally retains its candidate “Private preview” labels; source publication is not a claim of production readiness. The live Pages demo remains the prior baseline unless separately delivered. This source adds an explicit **572-program color language** beside the unchanged **176-program original language**. Choose “Color preview: erase coral singletons” in the workbench to remove coral one-pixel debris while preserving teal/gold singletons and larger coral shapes. Both source modules and the self-contained `standalone.html` run the actual editor.

## Run and verify

Use Node.js 22.22.2+ (supported versions in package.json) and jsdom 30.1.1. `npm test` runs the complete portable suite; `npm run build` regenerates the standalone editor and original-language walkthrough. `node test_color_editor.mjs` runs new source/bundle color integration checks. `sha256sum -c SHA256SUMS` verifies distributed bytes before testing. Generated artifacts must exist and match deterministic regeneration. A missing artifact fails verification.

No new package was installed for author checks: an existing jsdom 30.1.1 installation was reused. A clean dependency install has not been claimed. The package lock remains the pinned baseline dependency contract. Serve this directory with any local static HTTP server to use `index.html`, or serve `standalone.html` alone. No runtime network service, account, API key, or remote inference is required. Bounded native acceptance and independent review are summarized in `EVIDENCE-RECEIPT.md`. Those observations do not establish full platform or accessibility acceptance. For a developer checkout, the declared clean-install workflow is `npm ci --ignore-scripts` followed by `npm test`; a clean network install has not been performed here.

## Languages and compatibility

- Original tasks and original blank sessions use `component-edit-v1`, 176 programs. `core.mjs`, `fixtures.mjs`, `session.mjs`, benchmark/protocol/metrics and the original walkthrough remain unchanged in semantics and data.
- Color tasks use `color-intersections-v1`, 572 programs: the original 176 plus 396 color intersections. The active language and count stay visible after restore.
- Legacy v1/v2 evidence restores as original 176. Color evidence uses schema `pixel-witness-evidence`, version 3 and the exact color grammar. Review shows the language/count before replacing examples and any pending drafts. No session is silently migrated or expanded. Cancel preserves drafts. Saved rule IDs and outputs are never trusted: predictions are recomputed in the saved grammar.
- Color recipes use schema `pixel-witness-recipe`, version 2, exact grammar and a canonical program ID; unknown fields, unsupported versions/grammars and the offline experiment envelope are rejected. The legacy core recipe API remains unchanged; editor code never routes color recipes through it.
- A restored session is shown as the relevant custom task. To reset it to blank, select another task first, then the blank task; switching to the already selected task is a no-op.

## Exact semantics and limits

Components are same-color four-neighbor regions. A color qualifier intersects the selector on the original grid. **Largest/smallest is ranked among ALL components, ties included, then filtered by color. It is not largest/smallest within that color.** Actions retain original atomic movement/collision, boundary and noncascading outline semantics. Descriptions expose the qualification and global size ranking.

Agreement is conditional on the intended operation being inside the selected finite language. Unsupported intentions can still agree wrongly. The extension expresses coral-singleton removal and interior-teal removal, but not arbitrary multi-step edits, object recognition, size-exactly-two edits or color swapping. A unique surviving program is not certainty. More programs may require more questions.

## Evidence, separated by scope

`metrics.json`, `protocol.json`, `METHODS.md`, `walkthrough.html`, `walkthrough-data.json` and `walkthrough-sprites.svg` describe **only the original 176 grammar**. They are not 572-program validation. `test_color_editor.mjs` is integrated source/bundle regression evidence, not a productivity or real-world accuracy study. Historical `review_*` scripts are retained regression probes, with two bundling adapters updated by the author; they are not a new independent review endorsement.

The separate offline synthetic color experiment found 768 targeted new cases correct, and 175 wrong agreements across four deliberately unsupported intentions. These are not artist tasks, real-world accuracy, or productivity measurements. The summarized independent integration review ran 28,385 newly authored assertions and all 30 aggregate gates. Its additional probes are not distributed in this source payload; `npm test` runs the included reproducible aggregate, not those 28,385 additional assertions. See `EVIDENCE-RECEIPT.md` for scope and limitations.

## Provenance and boundaries

All 42 copied baseline files were verified by Git blob SHA-1 against a fresh GitHub connector tree listing at public commit `5f2a5f555b0a35485e27e5bf3a98f01b79b6878d` before copying. `BASELINE-BLOBS.json` records these canonical identities. The color engine's selector/interpreter/inference/query code comes from the reviewed private experiment; recipe envelopes and human descriptions were adapted for editor integration. `RUNTIME-SHA256SUMS` identifies the frozen runtime sent for separate native acceptance.

This source delivery does not update Pages, the separate draft PR, event materials, prior archives, demonstrations or submissions. No open-source license is granted. Dependency licenses remain with their respective authors.

## Historical public documentation: November 7 keyboard correction

The following is the preserved documentation of the earlier public revision. Its “this correction,” unchanged-file statements, acceptance and non-rerun claims refer only to that historical revision, not the color extension above.

### Historical Pixel Witness overview

Teach an edit. Catch the guess.

Pixel Witness is a local, bounded rule-inference prototype for original synthetic 8×8 pixel examples. Teach an edit, inspect remaining explanations, answer an informative question, and export batch results only when all surviving rules agree. Agreement is conditional on correct examples and intended behavior being in the 176-program language. One remaining program does not guarantee true intent.

## Run

The app has no external runtime dependencies or network calls. From this directory, run `python3 -m http.server 8000 --bind 127.0.0.1` and open `http://127.0.0.1:8000/index.html`. Open `/walkthrough.html` for the five-step synthetic walkthrough; `/standalone.html` is the bundled workbench. Use an ordinary supported HTTP browser workflow. No accounts, remote service, API key, build or dependency install is required to serve these assets.

## Verify and regenerate

Requires Node `^22.22.2 || ^24.15.0 || >=26.0.0` and JSDOM exactly `30.1.1` for DOM tests. Tested here with Node 24.22.1 and npm 11.9.0. `package-lock.json` contains only the existing JSDOM dependency closure, derived without network access or installing packages from the locally available lock. Optional canvas is not required for these tests.

For a normal developer checkout, the declared workflow is `npm ci --ignore-scripts` followed by `npm test`. A clean network install was NOT performed. Earlier portable-package validation tested an isolated extraction with `node_modules` symlinked to an already installed local dependency tree; the checks for this keyboard correction are described separately below. See PROVENANCE.md for package provenance and limitations. Standard Node package resolution is used; tests contain no workspace-specific imports or automatic sibling search.

- `npm test`: aggregate author and independent checks, deterministic benchmark gates, and exact artifact regeneration parity. Writes `VALIDATION.json` and named test receipts.
- `npm run build`: regenerate standalone and walkthrough assets from included sources.
- `npm run benchmark`: recompute `metrics.json` using frozen `protocol.json` and original synthetic fixtures.
- `sha256sum -c SHA256SUMS`: verify packaged file bytes before running checks (receipts generated afterward are not package members).

The aggregate compares generated assets to the originals before reporting success. A failed parity check may leave regenerated files in place; retain a clean extraction to inspect a failure. The independent checks are portable adaptations of previously separate reviews, not a newly commissioned external certification. Historical sibling-candidate comparisons and negative controls are not silently counted as current release checks.

## Included material

`core.mjs` defines the language and inference; `fixtures.mjs` contains original examples and seeded grids; `session.mjs` serializes and validates sessions; `app.mjs`, `index.html`, and `style.css` implement the workbench. `build.mjs` makes the standalone bundle. `build_walkthrough.mjs` makes the five-step walkthrough, its data and SVG. Benchmark source, frozen protocol, metrics, sample JSON exports, author tests, literal hand-authored semantic fixtures in `test_semantics.mjs`, independent tests and the aggregate verifier are included. This revision corrects keyboard focus recovery after Discard and final Undo, and maintains one tab entry per editable canvas after pointer or programmatic focus. The standalone bundle is regenerated and the new keyboard-flow test is included in the aggregate runner. Engine, fixtures, serializer, frozen protocol, metrics, sample exports, styles and walkthrough assets are unchanged from the public baseline.

## Acceptance and limits as of November 7, 2026

This bounded keyboard correction starts from public source commit `101d28e482ba8c18bd48f65df6607738398d7f0e`. Focused source/bundle JSDOM checks passed for canvas reentry, one roving tab stop, Discard/final Undo focus recovery, populated/empty restore and batch cancel. Existing accessibility, loss-protection, restore, batch/session and UI checks also passed against the correction. Independent review and native Chromium source/bundle acceptance passed for the keyboard correction. These checks do not establish broad accessibility or screen-reader support.

The final package was checked with the explicit keyboard-flow test, syntax checks, exact standalone regeneration parity, unchanged-file comparison and checksum verification. No new full aggregate run, benchmark run or clean dependency installation was performed for this correction. Prior core, benchmark and high-zoom acceptance below remains historical; unchanged bytes are not new execution evidence.

Historical acceptance of the preceding baseline runtime established native desktop interactions, saved synthetic JSON and SVG exports, five-step walkthrough navigation/disclosures, and browser 400% high-zoom reflow for the tested flows. At 400%, the accepted reflow workbench had viewport innerWidth 295, document clientWidth and scrollWidth 291. Those are historical native observations, not results of this package's JSDOM run, not a mobile-device test and not broad accessibility certification.

True mobile/touch devices, real screen-reader announcements, forced colors/reduced-motion rendering, actual browser leave/lifecycle dialogs, intended-recipient hosted access and production served bytes remain unverified. The historical private runtime source commit was `58f88d1c09c8ddb1698daec36a090a44360e5cb5`; this public correction does not modify that private deployment. This source preview does not establish a hosted demo, entry readiness, contest submission, real-world accuracy or measured productivity.

The benchmark is synthetic correctness and finite-pool query efficiency. Its target is guaranteed to be in the grammar for retention/heldout cases. Solving the 32-grid witness pool is not global equivalence. Query counts are capped at six, with unsolved cases reported separately. No claim of statistical superiority or algorithmic novelty is made.

The source is published for inspection and reproducibility. No open-source license is granted, and it is not presented as licensed open-source software. Package dependency licenses remain with their respective authors.
