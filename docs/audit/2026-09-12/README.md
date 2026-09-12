# Gridiron Legends: post-merge audit

Audited September 12, 2026. Application commit: **320045b2e96ec9b7d797598ae4e6e2a452707e05**. No application code changed during this audit.

## Release verification

The deployed page loads `/assets/index-DiGPqwhD.js`. A fresh checkout of main at the commit above builds that same asset. GitHub's main build and Cloudflare's production build report success. [Main workflow](https://github.com/Chappyjr22/Gridiron-legends/actions/runs/34670303586).

## Scope and evidence boundaries

This is a broad code, automated-regression and live-interface audit, **not an exhaustive device certification or a claim that every possible game state was manually played**.

- Live Cloud Chrome, 1363×936: main menu, settings, career gateway, new college career, school selection, college league stats/standings/schedule, opening kickoff, simulated opponent drive, slingshot and tap passing, designed run, result/pause/menu/resume, all three formation menus (18 displayed plays), Formation Lab entry/switching/exit. Created a separate career named “Audit September”; no existing career was deleted.
- Easy selected at creation was still active in the first game's pause menu. The previous difficulty-initialization bug did not reproduce.
- Fresh local run: six data checks, four legacy save checks, 31 gameplay/league checks, career and college lifecycle checks, production build. All passed.
- The existing gameplay suite exercises all 18 plays across four difficulties. Career tests cover season progression, draft/pro transition, reloads and duplicate reward protection. These use simulated fixtures, not manual football play.
- The latest merged browser suite has 30 tests. The checked main workflow passed. Those historical automated touch/landscape checks are not a fresh hands-on iPhone/Safari test in this audit.
- Seven additional independent code probes run against the unchanged application and reproduce findings below. Run `node --experimental-vm-modules docs/audit/2026-09-12/probes.mjs`. See `probe-results.txt`.
- Not newly completed manually: a whole regulation game, halftime/overtime, postseason/draft, every individual play, a sideline/end-zone catch matrix, long-session storage stress, actual iOS multitouch, accessibility with assistive technology. These remain coverage gaps rather than claimed passes.
- Browser log inspection returned extension-origin metadata errors. They were not attributed to the game.

## Confirmed defects and gaps

### A01. Frame stalls desynchronize movement, game clock and timed actions

**Priority: high. Evidence: deterministic engine probe.**

Source: `src/simulation/engine.js` tick and timed ball/exchange/dive paths; `src/state/clock.js`.

Reproduce: start a game at own 20, choose Trips Four Verticals, snap, run one normal frame, then deliver the next animation frame 1,000 ms later. The simulation timestamp advances 1,000 ms, but the game clock advances only **0.05 seconds** and the receiver moves only **4.28 field pixels**. Movement uses a capped `dt`, while flight, route delays, dive expiry and animations use the full timestamp.

Consequence: after a long frame, the ball/tackle timing can finish while players have moved only a fraction of the expected distance. This can contribute to inconsistent receiving on a stuttering device. The probe proves timing divergence, not that a particular earlier user video was caused by it.

Patch direction: use one coherent simulation time policy, either bounded fixed-step catch-up or a deliberately paused/capped simulation clock, for all game events. Compare normal frames, 100 ms frames and a one-second stall for the same seeded play.

### A02. Malformed checkpoint data passes career backup validation

**Priority: high for save recovery. Evidence: parser and consumer probe.**

Source: `src/career/career.js` parseCareer; `src/simulation/engine.js` restoreCheckpoint; `src/career/stats.js` recordPlay.

Reproduce: create a valid career, set `activeMatch` to its scheduled game, and provide `checkpoint: {game:{}, stats:{}, resume:{type:'offense'}}`. `parseCareer` accepts the JSON. The accepted stats object then makes `recordPlay` throw `Cannot read properties of undefined (reading 'some')` because `plays` is absent.

Consequence: a damaged or edited backup can be accepted and later fail in gameplay. No production save was modified to demonstrate this. There is no claim that normal play currently generates this malformed object.

Patch direction: validate the full checkpoint shape and numeric settings, roster references, stats and resume-specific fields before accepting an import. Keep a recoverable original. Add invalid-checkpoint cases to import tests.

### A03. Cancelling a tap gesture does not cancel its queued throw

**Priority: medium. Evidence: pointer-handler/engine probe.**

Source: `src/input/pointer.js` beginTapPass and cancelPointer.

Reproduce: Practice → Trips Quick Slants → Tap mode. Send pointerdown near WR1, then pointercancel before 240 ms. Advance the engine 250 ms. `entities.pendingTapThrow` remains populated after cancellation and `game.thrown` becomes true.

Patch direction: cancel the gesture-owned queued tap throw as well as aiming/steering state. Define separately whether a completed tap should survive ordinary pointer capture release. Test pointercancel before and after the tap has completed.

### A04. Resizing omits a queued tap's field target

**Priority: medium. Evidence: viewport/input probe.**

Source: `src/rendering/viewport.js` fitFieldViewport; `src/input/pointer.js` beginTapPass.

Reproduce: in Tap mode, press empty field at canvas (100,150), outside a receiver selection radius. Before the 240 ms release, resize the field to 1200×380. The anchor changes from 520 to 920, but `pendingTapThrow.target.x` remains 100. Its eventual downfield destination therefore shifts **400 field pixels, about 14.3 yards**.

This specifically affects an absolute queued target; a queued receiver-key target is resolved from the receiver later. A physical device rotation during that 240 ms window was not manually reproduced.

Patch direction: queue a world-space target or transform pending taps alongside active aiming. Test rotation/toolbar resize before release.

### A05. Recent pass-control and throw-type settings revert on career resume

**Priority: medium. Evidence: live UI reproduction and source.**

Source: `src/ui/menus.js` mode/type listeners; `src/ui/career.js` careerSettingsChanged/launch; checkpoint fields in engine.

Live reproduction:
1. Create college career “Audit September”, Bluegrass State, Easy, 2-minute quarters.
2. Enter the game and establish a checkpoint with Tap and Lob selected.
3. During the next live play, pause; select Direct drag and Bullet.
4. Main menu → Career → Continue last career → Resume game → Pause.
5. Direct drag and Bullet are no longer active. **Tap receiver and Lob are active again.** Easy remains active.

The mode/type handlers update only the live game. The difficulty handler additionally persists to the career/checkpoint. [Resumed playbook screenshot](resume-settings.jpg). The selected settings were verified separately through DOM class reads; this image is not evidence of the selected toggles.

Patch direction: persist all user control preferences immediately through one settings path; keep device preferences distinct from competitive career difficulty. Test mid-play exit and reload.

### A06. Simulated quarterbacks can complete every attempt and also throw an interception

**Priority: medium. Evidence: deterministic stat-generation probe.**

Source: `src/career/leagueStats.js` simulatedBoxScore.

Reproduce: use Boston's generated roster, drives `[0]`, seed `'8'`. The returned QB line is **1 attempt, 1 completion, 1 interception**. Interceptions are sampled independently after attempts/completions are chosen.

Patch direction: allocate interceptions among incomplete attempts or produce attempts from mutually exclusive outcomes. Enforce `completions + interceptions <= attempts` over a broad deterministic seed set.

### A07. The playable generic slot receiver is missing from career player-stat views

**Priority: medium. Evidence: engine identity and stat-view source/probe.**

Source: engine initPlay (`wr3`), `src/career/leagueStats.js` seasonPlayerRows, career roster/recap UI.

Reproduce: start Boston Trips Mesh. WR3 is player `bos-generic-15`, jersey 15. That ID does not exist in the team's roster. He can receive targets and catches, and recordPlay stores his production, but league rows and teammate cards are constructed solely from roster entries. His receiving line therefore cannot appear there. In Ace/Pistol the same entity also fills an extra TE/H-back role.

Patch direction: give every eligible on-field player a stable discoverable identity, including generics, without needing to convert every player into a star. Include those identities in teammate stats and recaps. Account for old generic IDs in existing saves.

### A08. Generic and roster players can share a jersey number

**Priority: low. Evidence: live Formation Lab JSON plus engine probe.**

Source: `src/simulation/engine.js` initPlay combines roster-derived numbers with fixed generic numbers.

Reproduce: Boston → Formation Lab → Trips. The first offensive lineman and the fourth offensive lineman both export **68**. The same initialization constructs game players. The Formation Lab export displayed these duplicate values; its screenshot could not be attached. Career creation resolves conflicts among roster players but not these fixed generic numbers.

Patch direction: allocate generic numbers against the full active lineup, keeping player identity independent of jersey number.

## Improvements, not asserted bugs

1. **Physical blocking assignments and clearer play identities.** The `blocks` list currently supplies protection timing bonuses. It is not a complete per-player block/chip-release simulation. After-catch escort candidates include route runners and offensive linemen, but exclude designated non-route skill blockers. Play-action calls have route data and delayed routes, but no explicit fake exchange in the snap path. Implement readable blocking, release and fake actions from the same data as play diagrams before adding many more nominal plays.
2. **Desktop scaling.** At 1363×936 the actual field is 800×380 inside a much larger black area. The new landscape expansion helps short screens but does not upscale the field on this taller desktop viewport. [Observed screenshot](desktop-field.jpg). Fit the usable area with a deliberate maximum readable scale and verify pointer mapping.
3. **Explain checkpoints.** The live exit/resume returned to the last pre-snap checkpoint, restoring 0:33 after a play had progressed. This is consistent with the implemented between-play checkpoint design, not unexplained data corruption. State “Resume from the start of this play” when leaving mid-play; consider an explicit quit confirmation or deterministic play restart to reduce ambiguity and retry exploits.
4. **Complete league statistical coverage.** Played opponents have no player box-score breakdown; the UI correctly discloses this. Add a consistent opponent stat allocation if league leader comparisons are to feel meaningful. Keep actual and simulated sources distinguishable without making the interface a technical report.
5. **Game feedback and audio.** No audio system was found in the current source. A controlled mix of snap, catch, tackle, whistle and crowd reactions would add feedback. Provide independent mute/volume controls and verify device audio restrictions before implementation.
6. **Save management.** Add per-slot recovery and a backup entry point reachable even when slot validation fails. Current slot loading rejects the whole list if any one career is invalid. This is code-observed recovery design, not a reproduced normal-play corruption incident.
7. **Accessibility and help.** Settings use visual active classes; add pressed/selected semantics. Explain Direct versus Slingshot, the lead-marker colors, tackle telegraphs and jukes with a brief playable practice tutorial. Test keyboard focus and modal behavior with assistive tools rather than treating DOM visibility as certification.

## Recommended work order

1. Fix A01 and A02 with focused regression tests.
2. Fix A03–A05 together as one input/settings reliability batch.
3. Fix A06–A08 as a stats/identity batch, preserving existing saves.
4. Improve physical blocking/play-action identity and checkpoint messaging.
5. Add audio/tutorial polish, then deepen career goals and long-term progression. Keep replay on the roadmap; first establish coherent simulation timing so recorded motion can be trustworthy.

No patches, deployments or merges were made by this audit. Existing passing tests are useful evidence, but the additional findings show why they cannot be treated as a full-game correctness guarantee.
