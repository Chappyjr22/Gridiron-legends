# Mobile gameplay overhaul

Review branch: `feature/gameplay-overhaul`. Main has not been changed.

## Player-facing changes

- Slingshot reach now scales a comfortable pull to roughly 25–44 yards according to arm strength. The preview and release share the same mapping. Backward intent still starts a scramble.
- An explicit receiver tap stays a pass, including an RB screen behind the quarterback. An RB without a route keeps the handoff/pitch shortcut.
- Aiming retains the existing route forecast and receiver adjustment. Precise open catches remain dependable; contested catches retain their separate drop, breakup, and interception outcomes.
- Missed passes and deflections leave a rotating, bouncing football that loses energy on the turf. Mid-flight deflections wait for ground contact before the incomplete result. The next play resets the ball.
- Steering can begin during flight and carry through the catch. Diagonal input no longer adds a speed bonus, and manual steering takes priority over run-lane assistance.
- Swipe forward to dive, or use the move button. A quarterback slides instead. This ends the run and protects against a contact fumble; repeated taps cannot extend it. Short landscape uses one row of 44-pixel controls.
- Blocking lasts long enough to read but no longer grants a lineman a 20-second win. Defense mixes man and bounded zone assignments; difficulty adjusts reactions, pursuit, blitzing and tackle timing while preserving player ratings.
- Failed tackle-break attempts can cause a low-probability fumble. The ball is visible, nearby players pursue it, and a recovery resolves possession once. FUM and LOST appear with rushing stats. Existing saves default missing counters to zero.
- Field goals have power and aim taps, a scoring window based on distance and kicker rating, visible flight, and camera tracking. Extra points remain automatic.
- Routine result strips advance after a brief pause. Fourth downs, quarter breaks and major results remain explicit. Opponent drives have a skippable yardage presentation.
- Touchdowns and gains of 20+ yards offer a skippable replay of recorded frames. Playback does not re-run physics, scoring or random outcomes. It retains the last 12 seconds and uses the original team palettes.

## Verification and observations

- Production build, 40 gameplay checks and 11 overhaul checks pass locally. The earlier career/college/depth, save, data, audio, cloud and uniform suites also passed.
- The first CI run passed 60 of 62 browser checks. Its two failures expected four rushing rows before FUM and LOST were added. Those expectations now include the two counters. Additional browser checks cover replay/skip, touch kicking and short-landscape running controls. Final CI status is on PR #28.
- Manual review on the deployed branch exercised practice passing and handoffs, quick-play setup, a Boston–Cincinnati game through the first half, catch-and-run, diving, replay, quarter progression, a fourth-down kick and the subsequent opponent possession.
- Observed results included a 61-yard catch-and-run ended with a dive, two one-yard completions and two negative-yardage inside runs. A 45-rep deterministic harness probe across Easy/Medium/Hard confirmed that the same immediate receiver tap is not universally a touchdown. This is a small balance sample, not proof of season-long balance.

## Deliberate limits

- Fumbles currently occur on contact away from the goal lines. Recoveries end the play, with no return and no forward advancement from the loose ball. This avoids introducing partial end-zone recovery rules.
- Deflections become dead incompletions on turf contact; there is no airborne tip-drill recatch system yet.
- Opponent possessions remain statistical simulations presented over time, not full defensive snaps. Their clock and score update from the authoritative outcome.
- Replays are sampled at 20 fps and bounded to 12 seconds. They are not saved with career checkpoints.
- Kicking reuses the existing field and player art; it does not yet have bespoke holder/kicker animation or interactive PATs.
- Browser automation and desktop-pointer playtesting cannot establish the final thumb feel on an actual iPhone. Short-landscape checks cover geometry; device testing is still valuable for gesture sensitivity, timing and long-session balance.
