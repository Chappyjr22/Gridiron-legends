# Sprite part mapping audit

The existing raster art is flattened RGBA, not layered art. Runtime uniform recoloring in `src/rendering/spriteSheets.js` classifies blue pixels using RGB ratios. It does not distinguish helmet from jersey or blue pants trim. Skin has exact source-color matching plus a broader rule on generated pre-snap sheets. Sideline recoloring uses approximate vertical cutoffs after downsampling. None of those rules is a reliable anatomical mask.

## Inventory inspected

| Source | Dimensions | Grid | Distinct visible RGB colors |
| --- | --- | --- | --- |
| sprites.png | 384×320 | 6×5 cells, 64×64; some cells unused | 448 |
| presnap-offense.png | 256×64 | 4 poses, 64×64 | 1,992 |
| presnap-defense.png | 192×64 | 3 poses, 64×64 | 1,533 |
| stadium/sideline-standing-v1.webp | 2172×724 | 4 generated standing cells | 43,750 |

The pre-snap and sideline sources have many near-duplicate shades. Selecting one blue/white swatch will miss pixels; using broad tolerance can include another body part. White is shared by pants, helmet stripes, facemasks, socks and highlights. Dark outlines touch multiple materials. Diving, falling, crouching and throwing change boundaries, so one horizontal cutoff cannot work for all poses. Horizontal mirroring can reuse a validated source mask, but other frames require separate review.

## What is feasible

Explicit per-pixel semantic masks can identify helmet shell, helmet stripe, jersey, pants, skin, facemask, gloves, cleats/socks, football, and preserved outlines. Keep mask data separate from immutable originals. Recolor only approved labels, retain alpha and outline pixels, preserve shading separately, and fall back to original art for missing masks.

The Formation Lab edits formation positions, not sprite pixels. A separate development inspector is available at `/tools/sprite-mask-editor.html`. It provides frame selection, zoom, original/overlay/labels views, pixel brush, connected exact-RGBA fill, undo, and mask JSON export/import. Exports include dimensions, part schema, source SHA-256, and `reviewed:false`. Imports reject mismatched source files, invalid ranges, transparent pixels and overlapping runs. No automatic anatomical claims are made. No masks are connected to gameplay in this change.

## Honest readiness assessment

Yes, the small gameplay frames can be mapped carefully with this tool. No, all pixels of all poses have not been identified or validated yet. Automatic segmentation is not safe enough to ship. The tool is a preparation and inspection aid, not completed uniform customization. The large sideline image needs a decision on canonical source resolution before mask authoring, because the renderer currently trims and rescales it.

Recommended next implementation: manually label one standing pose, one throwing pose, and one dive. Review high-contrast helmet/jersey/pants colors at native game size and enlarged size. Verify all unlabeled regions explicitly. Only then extend to all used frames, save immutable masks with source hashes, add a shading-preserving renderer, and integrate pants controls/save defaults. Existing runtime art stays untouched until that validation is complete.

## Three-pose pilot

`/tools/uniform-pilot.html` now loads explicit masks from `public/assets/masks/uniform-pilot.json` for standing/aiming (row 0, col 2), throw follow-through (row 3, col 2), and diving (row 4, col 5), using zero-based coordinates. Four independently colored materials are available. Stripe color also controls the existing pants trim.

Authoring used individually inspected anatomical regions and exact stripe spans, with color selectors as an offline aid. The final JSON records explicit pixel labels. The renderer never guesses a material from color or height. The source hash prevents using this mask with a different sheet. `scripts/build-uniform-pilot.py` records the authoring selections and generates a diagnostic comparison; its regions must not be generalized to other poses.

Contrast review caught and corrected two standing helmet highlights being treated as stripe paint, one facemask pixel being treated as jersey, and isolated blue hand-edge pixels in the diving pose. Non-uniform pixels are labeled preserve (10), not falsely claimed as separately identified skin/facemask/etc. The pilot intentionally retains original dark outlines and gray edge highlights. Shading is an initial source-brightness approximation and can clip on very bright selected colors.

This is a reviewable three-pose proof of concept, not a complete uniform renderer. `reviewed:false` remains deliberate: there is no animation-sequence review or full frame coverage yet. Other gameplay frames, pre-snap sheets and sideline sources are untouched. No masks are wired into gameplay and no save fields are changed. Node checks and browser pixel comparisons verify source identity, frame boundaries, immutable source data, alpha and preserved regions.
