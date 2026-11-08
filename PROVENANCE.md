# Package provenance

## Read-only diagnostics candidate — November 8, 2026 (UTC)

This candidate starts from public source commit `5f2a5f555b0a35485e27e5bf3a98f01b79b6878d` at https://github.com/sharonbasovich/pixel-witness. All 42 baseline files matched their Git blob hashes before editing. The new diagnostic module, interface and tests were AI-assisted during the active AI OpenBuild build window. The original synthetic example pair in `sample-conflict-session.json` demonstrates incompatible intended outputs without private data.

The diagnostic shrink algorithm identifies one inclusion-minimal incompatible example group, not a globally smallest group, all groups, or the user's true intent. It distinguishes individually unsupported examples and does not edit saved evidence. Core inference, fixtures, session serialization, frozen benchmark protocol, metrics, previous sample exports and walkthrough assets are unchanged. The application, HTML, CSS, standalone builder, bundle and verification tools change together. Two portable review scripts include the new diagnostic module when independently reconstructing the expected bundle; their exact-equality checks are retained.

The full local aggregate passed all 28 gates on Node 24.22.1 with existing JSDOM 30.1.1. The new diagnostic test has 1,740 assertions over 180 deterministic synthetic sessions; source/bundle diagnostic DOM tests have 64 assertions. All five generated artifacts have exact regeneration parity. These are source/DOM/synthetic checks, not user, device or accessibility certification. Native/rendered acceptance of this addition remains unverified because the supported HTTP preview returned connection refused. Public Pages, downloadable releases and the event draft are not changed by this source candidate.

## Dependencies and reproducibility

No new third-party assets, dependencies, license grants, training data or external runtime calls were added. The package contains no installed dependencies. `package-lock.json` retains the existing JSDOM 30.1.1 dependency subtree with integrity and registry metadata. Verification uses standard package resolution into an explicitly provided existing local dependency tree. A clean network installation was not performed; the declared `npm ci --ignore-scripts` workflow remains unverified here.

`SHA256SUMS` inventories every packaged file except itself. The `npm test` workflow regenerates and compares `standalone.html`, `walkthrough.html`, `walkthrough-data.json`, `walkthrough-sprites.svg` and `metrics.json` byte-for-byte, then runs the included author, independent and semantic suites. Generated validation receipts are not distributed as stale evidence. Portable independent scripts originated in earlier reviews; their inclusion is not a fresh external certification. Hand-authored semantic fixtures remain bounded synthetic examples, not a real-world benchmark.

## Historical keyboard correction — November 7, 2026

The baseline keyboard correction at `5f2a5f55` was based on `101d28e482ba8c18bd48f65df6607738398d7f0e`. It maintained one tab entry per focused editable canvas and recovered focus after Discard and final Undo. Focused local checks, independent review and bounded native Chromium source/bundle acceptance passed for that earlier change. Its delivery did not include a new aggregate run; the diagnostics aggregate reported above is a separate new execution.

Earlier native desktop/high-zoom observations and remaining mobile, screen-reader and lifecycle limits are recorded in README.md. They must not be treated as native acceptance of the new diagnostic panel. The historical private runtime commit was `58f88d1c09c8ddb1698daec36a090a44360e5cb5`; this source candidate does not change that deployment or grant a software license.
