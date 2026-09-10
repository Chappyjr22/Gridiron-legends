# Rookie QB career implementation

Work remains on `qa/astra-gameplay-audit`. No production deployment or merge is authorized by this implementation.

## Delivered in this branch

- Audited timing, goal-line rounding, catch boundaries, cancellation, repeated kicks, HUD/copy, uniform contrast, standings and schedule highlight fixes, with engine regression tests.
- One local QB career: name, number, skin tone, team, three throwing archetypes, difficulty and quarter length.
- Existing offense controls remain the gameplay model. There is no position-locked QB or scramble mechanic in this version.
- Scheduled games, per-player passing/receiving/rushing/sack statistics and once-only result recording.
- Career and season QB totals, capped game XP, upgrade points, separate accuracy/arm/release effects.
- Device-local save separate from `gridironLegendsFranchiseV1`, backup export/restore, and recovery checkpoints at play/result boundaries. Leaving during a live snap returns to the last saved boundary rather than resuming halfway through that snap.
- Seventeen-week season; top four teams per conference enter an eight-team, three-round playoff. Playoff results do not inflate regular-season standings. Simulated playoff ties are resolved with a three-point home-team overtime winner; richer overtime simulation remains later work.
- Championship record and next season preserve the created player, teammates, IDs and upgrades. Contracts, retirement, recruiting and roster turnover are not yet simulated.
- CI now includes gameplay/career tests and the browser suite, with screenshots uploaded for review.

## Validation and release status

Data, save compatibility, gameplay regression, career lifecycle tests and Vite production build pass locally. The deterministic tests include winning and losing seasons, three-week reload, duplicate-result prevention, upgrades and engine checkpoint restoration.

Local Playwright reaches the test runner but cannot launch Chromium because its binary is missing. The Cloud browser refuses the internal preview (`ERR_BLOCKED_BY_CLIENT`). Consequently, new UI visuals, actual mobile touch/scrolling and on-field feel after these changes are not yet verified. Existing screenshots in `docs/audit/live-evidence/` show the **baseline**, not this build.

GitHub Actions passed all checks on application commit `a640fc19117c944c42c4677e1e3b3e4273799dcf`, including all 14 Chromium browser tests. The suite covers existing controls, mobile touch tapping, career creation, progression, upgrades and checkpoint resume. [Passing run](https://github.com/Chappyjr22/Gridiron-legends/actions/runs/34464986507) and [three career screenshots](https://github.com/Chappyjr22/Gridiron-legends/actions/runs/34464986507/artifacts/10147140868) are available for review; artifacts expire after 14 days. The screenshots have not been visually inspected in this session because artifact download failed.

Browser tests include explicitly labeled deterministic engine fixtures; those are integration tests and must not be reported as manual gameplay. Keep [PR #8](https://github.com/Chappyjr22/Gridiron-legends/pull/8) a draft until visual review and manual gameplay verification of the changed build are complete. Production remains unchanged.

Publication note: source and tests were published through GitHub's contents API because terminal Git authentication was unavailable. Local grouped commits and remote per-file commits have different histories. Do not force-push the local history. Baseline live-audit screenshots and the expanded ledger remain in the local audit checkout and were not included in the remote PR; they are not evidence of this changed build.

## Next gameplay work, in order

1. Validate this build on a browser-accessible branch preview, including mobile input, scoring boundaries, halftime/overtime, resume and uniform contrast. Review the career screens on portrait and landscape devices.
2. Tune any demonstrated regressions before extending mechanics. The fixed 18-second runoff and overall balance remain unchanged pending measured play counts and gameplay feedback.
3. Implement actual TE/H-back engagements, screen escorts and a run fake. Avoid changing all 18 concepts at once; begin with one clear blocking/run/pass-action comparison.
4. Separate defensive calls from offensive route assignments. Add readable man/zone/pressure alternatives and nearby-defender catch contests, with controlled matchup tests.
5. Add actual QB mobility before offering a dual-threat archetype. Keep precision, power and quick-release upgrades meaningful and visible.
6. Add sound, crowd reactions, accurate play feedback, repeat-last-play convenience and career-player identification. Preserve existing pixel assets and animations.
7. Add meaningful career milestones, awards, rivalries and light coach objectives. Additional career positions and franchise management follow a validated QB career loop.

## Replay: saved for later

Replay is a requested future feature, not implemented in this build. A play-result ledger is now available for stats and future metadata, but it is **not sufficient to reconstruct a replay**.

A later implementation should capture a bounded sequence of player/ball transforms, facing and animation states on the simulation clock, plus camera position and discrete events. Playback must use a separate read-only scene: no simulation reruns, XP, score changes or save mutations. Start with “Watch last play” from the result screen, then consider highlights. Cap memory and verify mobile performance before retaining whole games. Keep replay controls outside live pointer gestures.
