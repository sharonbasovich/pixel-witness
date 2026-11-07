# Pixel Witness

Teach an edit. Catch the guess.

Pixel Witness is a local, bounded rule-inference prototype for original synthetic 8×8 pixel examples. Teach an edit, inspect remaining explanations, answer an informative question, and export batch results only when all surviving rules agree. Agreement is conditional on correct examples and intended behavior being in the 176-program language. One remaining program does not guarantee true intent.

## Run

The app has no external runtime dependencies or network calls. From this directory, run `python3 -m http.server 8000 --bind 127.0.0.1` and open `http://127.0.0.1:8000/index.html`. Open `/walkthrough.html` for the five-step synthetic walkthrough; `/standalone.html` is the bundled workbench. Use an ordinary supported HTTP browser workflow. No accounts, remote service, API key, build or dependency install is required to serve these assets.

## Verify and regenerate

Requires Node `^22.22.2 || ^24.15.0 || >=26.0.0` and JSDOM exactly `30.1.1` for DOM tests. Tested here with Node 24.22.1 and npm 11.9.0. `package-lock.json` contains only the existing JSDOM dependency closure, derived without network access or installing packages from the locally available lock. Optional canvas is not required for these tests.

For a normal developer checkout, the declared workflow is `npm ci --ignore-scripts` followed by `npm test`. A clean network install was NOT performed in this packaging run. Instead, an isolated extraction was tested with `node_modules` symlinked to the already installed local dependency tree. See PROVENANCE.md for package provenance and limitations. Standard Node package resolution is used; tests contain no workspace-specific imports or automatic sibling search.

- `npm test`: aggregate author and independent checks, deterministic benchmark gates, and exact artifact regeneration parity. Writes `VALIDATION.json` and named test receipts.
- `npm run build`: regenerate standalone and walkthrough assets from included sources.
- `npm run benchmark`: recompute `metrics.json` using frozen `protocol.json` and original synthetic fixtures.
- `sha256sum -c SHA256SUMS`: verify packaged file bytes before running checks (receipts generated afterward are not package members).

The aggregate compares generated assets to the originals before reporting success. A failed parity check may leave regenerated files in place; retain a clean extraction to inspect a failure. The independent checks are portable adaptations of previously separate reviews, not a newly commissioned external certification. Historical sibling-candidate comparisons and negative controls are not silently counted as current release checks.

## Included material

`core.mjs` defines the language and inference; `fixtures.mjs` contains original examples and seeded grids; `session.mjs` serializes and validates sessions; `app.mjs`, `index.html`, and `style.css` implement the workbench. `build.mjs` makes the standalone bundle. `build_walkthrough.mjs` makes the five-step walkthrough, its data and SVG. Benchmark source, frozen protocol, metrics, sample JSON exports, author tests, literal hand-authored semantic fixtures in `test_semantics.mjs`, independent tests and the aggregate verifier are included. Runtime, generated visual assets, engine, serializer and exports are unchanged from the accepted reflow candidate.

## Acceptance and limits as of November 7, 2026

Prior acceptance of this exact runtime established native desktop interactions, saved synthetic JSON and SVG exports, five-step walkthrough navigation/disclosures, and browser 400% high-zoom reflow for the tested flows. At 400%, the accepted reflow workbench had viewport innerWidth 295, document clientWidth and scrollWidth 291. Those are historical native observations, not results of this package's JSDOM run, not a mobile-device test and not broad accessibility certification.

True mobile/touch devices, real screen-reader announcements, forced colors/reduced-motion rendering, actual browser leave/lifecycle dialogs, intended-recipient hosted access and production served bytes remain unverified. The recorded source commit is `58f88d1c09c8ddb1698daec36a090a44360e5cb5`. This source preview does not establish a hosted demo, entry readiness, contest submission, real-world accuracy or measured productivity.

The benchmark is synthetic correctness and finite-pool query efficiency. Its target is guaranteed to be in the grammar for retention/heldout cases. Solving the 32-grid witness pool is not global equivalence. Query counts are capped at six, with unsolved cases reported separately. No claim of statistical superiority or algorithmic novelty is made.

The source is published for inspection and reproducibility. No open-source license is granted, and it is not presented as licensed open-source software. Package dependency licenses remain with their respective authors.
