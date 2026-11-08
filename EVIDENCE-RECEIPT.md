# Bounded color-editor evidence receipt

Date: November 8, 2026. This text summarizes tests of the frozen runtime identified in `RUNTIME-SHA256SUMS`. It is not a certification, a user study, or general-availability acceptance. No screenshots, raw downloaded files or private review logs are included in this public source payload.

## Reproducible portable aggregate

`npm test` runs 23 scripts, six exact generated-artifact comparisons and the original benchmark correctness gate: 30 gates total. The staged result is `VALIDATION.json`. It includes 8,274 color integration assertions and the existing original-language regression suites. Node 24.22.1 and existing JSDOM 30.1.1 dependencies were used. No clean network installation was performed. DOM assertions are not native rendering evidence.

## Separate independent review

A separate reviewer reran all 30 aggregate gates and 28,385 newly authored assertions: 27,899 semantic, 386 session, 50 source UI and 50 standalone UI. An independently implemented oracle checked all 396 added programs on 28 boards and compared the original 176 programs against the retained engine. Global extrema, collisions, outlines, recipe/session validation, draft-safe restore cancellation, undo, batch save/cancel, zero-evidence export and legacy-language isolation were covered. A no-op negative control failed as expected. No blocking runtime defect was reported. Those additional probes are not included here, so `npm test` does not reproduce the 28,385 count.

The prior offline synthetic experiment found 768 targeted new cases correct but 175 wrong agreements across four unsupported intentions. Those deliberately unsupported cases show why agreement is conditional. They are not a real-world accuracy estimate. The unchanged `metrics.json`, `protocol.json`, `METHODS.md` and walkthrough concern original176 only, not color572.

## Bounded native Chromium observations

The modular source, served over HTTP, completed the explicit color task, truthful question, two-example/one-rule inference and three agreed batch outputs. Actual keyboard painting created a draft and disabled exports. Restore review/cancel preserved that draft; malformed JSON was rejected; explicit confirm recomputed the result. Undo/Discard, the task-switch Keep editing guard, batch Save/Cancel, zero-evidence color restore and valid legacy176 restore were exercised. Focus recovery was observed in the tested flows.

Actual desktop Chromium frames sized 390 and 320 CSS pixels had client widths 375 and 305 after scrollbars. Document scroll widths matched those client widths, and inspected visible controls did not overflow. The 390 frame completed color inference; the 320 frame showed the open batch painter. Both screenshots were inspected. These are narrow desktop frames, not physical mobile-device or touch acceptance, and not every possible state at each width.

The standalone HTTP page separately completed color inference, keyboard draft creation, v3 restore review/cancel, draft discard, explicit restore and a native JSON save. DOM evaluation timed out while the native screenshot/accessibility-tree interface remained responsive; those native observations were used. Long character-by-character JSON entry timed out partway; a fresh state check showed review had not run, and select-all/paste replaced the partial entry before review. This does not claim every modular-source flow was repeated on standalone.

Native saved JSON files were compared as raw buffers with canonical serialization:

- Standalone color: 7,826 bytes; SHA-256 `3103adf3b1ddbf0869797b91df679e00be9d242a559a7d151ae48a8d97bd058e`.
- Zero-evidence color: 2,725 bytes; SHA-256 `41fcbd0a8a685a57d2985b8936880fcb923b5435fcdde6115202267017f3c050`.
- Batch-edited color: 7,826 bytes; SHA-256 `a14eef5e690e4c0f33c9ccae8e3aaacf6ff404027b93ef139c656794a367b0ea`.

Canonical serialization parity is not an independent semantic oracle. A prior source native SVG download matched canonical output; it was not repeated in the continued pass.

## Not established

Actual file-protocol operation, physical touch, screen-reader behavior, OS reduced-motion rendering, native browser leave prompts, all lifecycle states, artist usefulness, real-world accuracy, productivity, broad accessibility and production readiness are not established. Unsupported intentions can still agree incorrectly. Experimental source retains candidate “Private preview” labels; live Pages remains the prior baseline unless separately delivered.
