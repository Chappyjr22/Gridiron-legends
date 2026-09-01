# Gridiron Legends 3D Player Lab Implementation Plan

Status: Active experiment. Keep isolated from gameplay until the exit gate is met.

This plan builds on `docs/player-model-production-spec-v1.md`. The objective is to prove one reusable 3D football-player pipeline before replacing any current gameplay visuals.

## Guiding rules

- Do not modify the live gameplay character pipeline until the Player Lab is approved.
- Use one shared humanoid skeleton wherever possible.
- Prefer reusable animation clips over hand-authored per-player animation.
- Keep gameplay movement code-driven. Locomotion animations should generally be in-place.
- Treat the first lab character as a rig/animation baseline, not final art.
- Record source and license information for every external asset.
- Target a stylized late-1990s/early-2000s arcade-football look, not realism.

## Free asset baseline

### Character and generic locomotion

Primary baseline: Quaternius Universal Base Characters + Universal Animation Library.

- Universal Base Characters: CC0, humanoid rig, approximately 13k triangles, glTF/FBX.
- Universal Animation Library: CC0, 120+ animations, including 8-direction locomotion, jog and sprint.
- Initial browser lab uses audited/optimized GLB mirrors of those CC0 assets from the public `Seyamalam/blood-league-kickoff` repository so the prototype can load immediately without checking binary assets into this repository.
- Before production, vendor the official Quaternius Standard downloads into `public/assets/vendor/quaternius/` and preserve the license files locally.

### Football-specific motion

Planned source: Carnegie Mellon Motion Capture Database football throw/catch captures. Commercial use in a product is allowed under CMU's published database terms, but the raw motion data must not be resold as an animation pack.

Secondary sources for missing actions:

- Rokoko free walk/run and sports motion packs.
- Mixamo for generic reactions, falls and transitional clips.
- Rokoko Create free tier for experimental text/video-to-motion if a football-specific action cannot be sourced cleanly.

### Equipment

Initial Player Lab milestone does not depend on final football equipment. The first objective is rig and locomotion quality. After that, evaluate the free CC0 BlendSwap American Football Helmet and uniform assets, or build a very small modular equipment shell around the approved humanoid rig.

## Phase 1: Rig and locomotion baseline

Deliver `/player-lab.html` with:

- one rigged 3D humanoid
- orbit camera
- football-scale field reference
- animation mixer
- automatic discovery of animation clips
- buttons for Idle, Jog, Sprint, Left and Right locomotion where matching clips exist
- crossfades between clips
- animation-speed control
- skeleton debug toggle
- football prop attached to the right-hand bone when the bone can be resolved
- model/rig/clip diagnostics visible in the UI

Exit gate:

- Character loads reliably in the deployed browser build.
- Idle, jog and sprint play without skinning or skeleton corruption.
- Crossfades are clean enough to justify continuing.
- Character proportions are at least a usable starting point.

## Phase 2: Football silhouette

Once Phase 1 passes:

- add helmet
- add shoulder-pad silhouette
- add simplified jersey/pants materials
- tune proportions toward the existing player model production spec
- add Las Vegas and Denver palette buttons
- test dynamic jersey number approach

Exit gate:

- At gameplay-camera distance, the model immediately reads as an American football player.
- Team color swaps do not require duplicate meshes.

## Phase 3: Quarterback motion set

Integrate and retarget:

- pre-snap/pocket idle
- 3-step dropback
- pocket shuffle left/right
- throw windup/release/follow-through
- tuck/scramble
- slide

Start with sourced mocap. Only hand-edit small cleanup issues if necessary.

Exit gate:

- Dropback and throw read as actual quarterback motions.
- Football hand attachment remains believable through the throw.
- No hand-inside-torso or detached-limb problems.

## Phase 4: Gameplay-facing locomotion system

Build the reusable visual controller:

- velocity-driven idle/jog/sprint state
- directional turning
- animation crossfade policy
- upper/lower-body state separation only if required
- animation time scaling against actual movement speed
- non-root-motion gameplay locomotion

Test with keyboard and controller-like inputs in the lab before game integration.

## Phase 5: Archetypes and uniforms

Create only after QB approval:

- QB
- skill player
- hybrid TE/LB
- lineman

All should share the same core skeleton if practical.

Build semantic team material slots:

- helmet primary/stripe
- facemask
- jersey primary/secondary/trim
- pants primary/stripe
- socks
- shoes
- gloves
- skin

## Phase 6: 22-player performance test

Spawn 22 animated instances and measure:

- frame time
- draw calls
- triangle count
- texture memory
- animation mixer overhead
- shadow cost

Add LOD or shared-material optimizations only if profiling shows they are needed.

## Phase 7: Integration gate

Only replace the game character pipeline if all of these are true:

1. The lab player looks clearly better than the procedural 3D prototype.
2. Run, dropback and throw animations are visually acceptable.
3. One rig can support the required football actions.
4. Uniform color swapping works.
5. The 22-player test is within the browser/mobile performance budget.
6. No art workflow requires the user to manually model, rig or animate characters.

If any of these fail, stop in the lab and change the asset/animation pipeline before touching gameplay.
