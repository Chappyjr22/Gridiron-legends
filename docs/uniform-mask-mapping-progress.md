# Uniform mask mapping progress

## Status

This work is intentionally isolated on `feat/pants-palette` in draft PR #25. Do not merge yet.

The original heuristic geometry for Helmet / Jersey / Pants / Stripe was not accurate enough across gameplay poses. We confirmed that exact per-pixel masks work correctly, so the current plan is to manually map the source sprite frames and later bake those reviewed masks into the game.

## Exact Pixel Mapper

Launch path:

`Team Editor -> Pose QA -> Open Pixel Mask Dev Editor`

The mapper is a full-screen pixel annotation workspace with:

- Gameplay, Presnap Offense and Presnap Defense sprite sheets
- Frame-by-frame navigation
- 4x to 24x zoom plus Fit
- Pan mode
- Optional pixel grid
- Optional Auto Guess overlay
- Helmet / Jersey / Pants / Stripe tools
- Erase to Auto
- 1px / 3px / 5px brushes
- Undo / Redo
- Pixel coordinate and source RGB readout
- Small live recolor preview
- JSON export / copy / import
- Local persistence on the current device

Important: manual labels can target any non-transparent source pixel. They are not limited to the original blue uniform palette. Manual labels override the automatic recolor heuristics.

## Confirmed architecture

Gameplay frame `0,0` was manually mapped and tested in Team Editor with intentionally different colors for helmet, jersey, pants and stripe. The channels separated correctly. This confirmed that the exact-mask approach works and that the remaining work is primarily mask annotation rather than recolor-pipeline redesign.

## Color ramp

The recolor ramp was changed from:

`[0.38, 0.62, 0.90, 1.20]`

to:

`[0.40, 0.68, 1.00, 1.22]`

This means the selected Team Editor color is now the actual main/base sprite shade, with darker shadow tones and a lighter highlight around it.

Ramp commit: `1c8fb1650c033b8cca1943958fd9f06f5a028a52`

## Mapping progress

The latest authoritative export currently contains these reviewed Gameplay frames:

- `0,0`
- `0,1`
- `0,2`
- `0,3`

The newest full JSON export shared in chat supersedes earlier exports. Frame `0,0` was refined again in the latest export, so always use the newest full JSON rather than an older per-frame copy.

These reviewed masks have not yet been permanently baked into source code. During mapping, local JSON overrides remain the working source of truth.

## Resume workflow on PC

Because mask edits are stored in browser local storage, the iPhone mappings will not automatically appear on a different PC/browser.

To resume on PC:

1. Open the `feat/pants-palette` build / draft PR version of the game.
2. Open Team Editor.
3. Open Pose QA -> Exact Pixel Mapper.
4. Open the Mask JSON area.
5. Copy the newest full JSON export from the chat session and paste it into the mapper.
6. Use Import JSON.
7. Verify Gameplay frames `0,0` through `0,3` show the existing labels.
8. Continue with Gameplay frame `0,4` and onward.
9. Periodically export the full JSON and send the entire updated object back in chat.

## Recommended batching

Do not bake every frame into code one at a time while annotation is actively in progress. Continue mapping a logical block, ideally the rest of Gameplay row `0`, then bake that reviewed batch into the experimental branch together.

The newest full JSON export should always be treated as authoritative because it can contain corrections to already-mapped frames.

## Final intended architecture

Once enough frames are reviewed:

1. Convert reviewed JSON masks into permanent exact mask data in the repo.
2. Exact reviewed masks take priority for mapped frames.
3. Heuristics remain only as fallback for frames not yet reviewed.
4. Finish Gameplay masks first, then Presnap Offense and Presnap Defense.
5. Visually QA all major animation states with intentionally different uniform colors.
6. Remove or disable the temporary Pixel Mapper before merging to `main`.
7. Only merge draft PR #25 after visual review confirms clean channel separation across gameplay and presnap sprites.

## Current safety state

- `main` remains unchanged by the mask experiment.
- Draft PR #25 remains unmerged.
- Source PNG assets remain untouched.
- The Pixel Mapper is temporary development tooling and should not ship in the final merged version.
