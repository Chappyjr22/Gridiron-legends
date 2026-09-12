# Gridiron Legends gameplay audit: preliminary ledger

Status: **incomplete, browser access blocked**. No gameplay fixes are approved by this report.

- Audit date: 2026-09-07.
- Branch: `qa/astra-gameplay-audit`.
- Starting main: `db4bbf79bf11b161283a50b660cac73f025f6110` (merged ES-module refactor, PR #7).
- Application code, assets, formations, routes, tuning, league data, save keys, and dependencies are unchanged.
- Career Mode was not started. No debug interface or scenario loader has been added.
- No PR has been opened, because the requested live audit and fixes are not complete. Do not merge this checkpoint.

## Method and limits

The branch was created in an isolated Git worktree after fetching `origin/main`. The existing data tests, save tests, and production build were executed against the untouched code.

The supported agent preview started successfully, but the cloud browser rejected opening it with `ERR_BLOCKED_BY_CLIENT`, followed by an explicit browser URL security-policy rejection. No game page, gameplay screenshot, or live interaction could be obtained. No alternate browser-control route was used to circumvent that rejection.

The repository's existing Playwright command was attempted independently. Its default Vite startup first failed on `uv_interface_addresses`. Starting Vite with a loopback binding in the same command allowed the runner to reach the 12 tests. All 12 then failed before page creation because the Playwright Chromium headless shell was absent. The normal browser installation download timed out; it was stopped. These are environment failures, not 12 game bugs.

Useful work continued through read-only source review and isolated Node execution of the original modules. The source probes use stub DOM elements and rendering, a controlled clock and RNG, and in-memory storage. They do not launch a browser, render pixels, emulate a complete browser event system, or touch production saves. They establish logic evidence only. Every finding still requires browser verification before a gameplay fix batch is considered complete.

## Verification baseline

| Gate | Result | Evidence |
|---|---|---|
| Data tests | PASS, 6 checks | 3 formations, 7 line players each, 6 plays each, 18 total, valid route references, run paths |
| Save compatibility | PASS, 4 checks | Existing repository tests for v1/v2 saves and malformed input |
| Vite production build | PASS | 26 modules; all four external PNG assets included in `dist/assets` |
| Existing Playwright suite | BLOCKED, 0 tests reached application behavior | 12 browser-launch failures; Chromium executable missing |
| Live browser play-through | BLOCKED | Explicit cloud browser URL policy rejection |
| Source evidence probes | PASS as baseline observations | See `baseline-evidence.json`; these assertions reproduce defects, not corrected behavior |

The current save round-trip test checks selected team and team count, not a deep comparison of the full save. Its idempotence test compares aliases of the same mutated object. Passing these tests is useful but is not complete save-compatibility assurance.

## Severity and evidence labels

- **P0:** cannot start/complete ordinary gameplay, widespread crash or save destruction. None established in this limited pass.
- **P1:** scoring, field-boundary or timing error that materially changes a play.
- **P2:** functional control/editor problem.
- **P3:** misleading text or minor UI failure.
- **Logic-confirmed:** reproduced by running the original source in Node with explicit fixture state. Not browser-confirmed.
- **Candidate:** code behavior observed, but ordinary UI reachability or intended rules still needs investigation.

## Ledger

### AUD-001: Pausing does not freeze play deadlines

**P1 | Controls / gameplay timing | Logic-confirmed, open**

Reproduction in the source fixture:

1. Start Practice, choose `trips_verticals`, snap, and release a throw at canvas target `{x:120,y:39}` with RNG fixed to `0.99`.
2. Advance one 16 ms frame. The ball has `startTime=1091` and `duration=838.0662247922971` ms, and is in flight.
3. Set the normal pause state and advance the wall clock by 10,000 ms. The ball remains in flight while paused.
4. Clear pause and advance one 16 ms frame.
5. The pass resolves immediately as incomplete. Nearly its entire flight elapsed during pause.

Expected: remaining flight and other play deadlines resume from their pre-pause values. Actual: the clock display freezes, but absolute timestamps keep aging.

Code: `src/simulation/engine.js` (`tick`, flight, exchange and engagement deadlines), `src/ui/menus.js` (pause/resume), and animation timestamps in `src/rendering/players.js`.

Browser follow-up: pause a lob in flight for 5 seconds, resume, and compare the first resumed frame with an uninterrupted control. Repeat during a handoff, a tackle, a broken tackle and a delayed release. Also inspect aim release while paused. Avoid changing animation assets or durations; any fix should address the time source or timestamp accounting.

### AUD-002: A tackle short of the goal line can award a touchdown

**P1 | Rules / scoring | Logic-confirmed, open**

1. Start a regulation player drive at `los=93`, select `trips_inside`.
2. Fixture a live RB carry at `yfield=99.6*28`, lateral position `190`, with a pursuing corner at the same point and RNG `0.99` to prevent a break.
3. Run the first simulation frame, producing a tackle at exactly yard `99.6`.
4. Advance the tackle result delay by 801 ms.
5. The offense receives 6 points and the message says `TOUCHDOWN!`, although the tackle spot is below `100`.

Cause: `resolveTackle` rounds the gain to 7, then `endPlay` derives scoring from `93+7`. The raw ball-carrier position is discarded. `resolveOutOfBounds` uses the same rounded-gain path.

Expected: determine whether the goal line was reached from the actual spot, then format the gain. Preserve existing display precision unless necessary.

Browser follow-up: reproduce tackles and sideline exits from 99.5 through 99.99; compare with 100.0 and beyond. Check the corresponding own-goal-line/safety boundary as well.

### AUD-003: A catch beyond the back of the end zone scores

**P1 | Rules / catch boundaries | Logic-confirmed, open**

1. Start a regulation drive at `los=90`, choose `trips_verticals`, snap.
2. Fixture WR1 at lateral position `39`, downfield yard `111`.
3. Set an arriving pass to that same point (`toY=111*28`), duration 100 ms with an already elapsed start, and RNG `0.99`.
4. Advance one frame.
5. The receiver at yard `111` catches the pass and the offense receives 6 points.

The renderer defines the far end zone as yards `100..110`; the receiver is beyond it. `resolveCatchAtTarget` checks receiver proximity and contest probabilities without checking the end-line boundary before assigning possession.

Expected: an out-of-field reception does not become a touchdown. Browser follow-up must include catches just inside/outside both end lines, including near the corners, and ensure tolerance does not turn an out-of-bounds ball into a valid completion.

### AUD-004: An already out-of-bounds receiver can complete a pass

**P1 | Rules / sidelines | Logic-confirmed, open**

1. Start a regulation drive at `los=20`, choose `trips_verticals`, snap.
2. Fixture WR1 at lateral position `354`, yard `25`, and an arriving ball targeting that point. Use RNG `0.99`.
3. Advance one frame.
4. The game reports `Catch for 5 yards, out of bounds.` and moves the line of scrimmage to `25`.

The same engine defines the positive sideline carrier limit as `355-12+4=347`. The receiver is already outside that limit when possession is awarded. Boundary handling runs only after catch resolution and records a completed gain.

Expected: validate reception bounds before awarding possession. Browser follow-up must establish the intended sprite/feet boundary at both sidelines and then verify a valid catch followed by an out-of-bounds step still counts. Do not adjust formations or sprite anchors to hide a rules error.

### AUD-005: Formation Lab keeps dragging after pointer cancellation

**P2 | Controls / Formation Lab | Logic-confirmed, open**

1. Initialize the default formation in editor mode.
2. Send the existing field handler `pointerdown` at native canvas `{x:615,y:191}` with `pointerId=1` to select the QB.
3. Send `pointercancel`.
4. Send a later unpressed `pointermove` at `{x:650,y:150}`.
5. `editState.dragEntity` is still selected; the QB lateral position changes from `191` to `150` after cancellation.

Cause: the cancellation handler clears gameplay aiming/steering but not `editState.dragEntity`. The edit-mode move handler does not require an active captured pointer.

Expected: cancellation ends the drag. Browser follow-up: cancellation, capture loss, orientation changes, and an unrelated second touch; verify export coordinates stop changing until a new press.

### AUD-006: League Hub never highlights the selected team's matchup

**P3 | UI / menus | Logic-confirmed, open**

1. Use the default selected team (`bos`).
2. Call the unchanged `renderLeagueSchedule` through League Hub.
3. The generated schedule contains BOS but zero `user-game` rows.

Cause: the `games.map(game => ...)` parameter shadows the imported global `game`. It compares against the schedule record's absent `userTeamId`, rather than the selected team ID.

Expected: exactly one selected-team matchup is highlighted per current schedule week. Browser follow-up: open League Hub, switch weeks, select another team and reopen. This needs no league-data change.

### AUD-007: Presnap hint instructs dragging when Tap passing is selected

**P3 | UI / controls | Logic-confirmed, open**

1. Select Tap passing in Settings.
2. Enter Practice, choose Shotgun Ace, then Stick.
3. `game.passMode` is `tap`, but the presnap hint says `Drag from QB to pass`.

Cause: `choosePlay` varies the hint only for run versus pass, not the current passing mode. Browser follow-up: verify Slingshot, Direct and Tap wording, including changing the mode from the pause menu during presnap. Do not alter any input gesture.

### AUD-008: Special-teams handlers accept repeat activation outside a decision

**Candidate, proposed P2 | Controls / rules | UI reachability unconfirmed**

1. Fixture a regulation fourth down at own 30 with 180 seconds remaining.
2. Call the unchanged `attemptFieldGoal` once: clock becomes 175, phase becomes `result`.
3. Call it again: clock becomes 170 and a new result is generated.

The handler has no phase/paused guard. However, the first result hides the decision UI. This source probe does **not** prove that an ordinary double tap or keyboard action can invoke it twice. Reproduce a real queued double activation before classifying or fixing this as a gameplay bug. Inspect punt and Continue for the same class of issue without adding speculative rewrites.

## Coverage register

All entries below remain **pending live browser verification**. Source execution does not establish desktop/mobile feel, visuals, touch delivery, physical hitboxes, or performance.

| Requested area | Source/baseline evidence so far | Remaining live work |
|---|---|---|
| Desktop controls | All pointer handlers reviewed; timing issue and hint issue reproduced | Slingshot/Direct/Tap, drag thresholds, aiming, steering, pause, capture loss |
| Mobile controls | Existing touch smoke test identified, but it cannot launch | Actual touch tap/drag, multi-touch, portrait/landscape, scrolling and cancellation |
| All formations and plays | 6 data checks; 72 original-source play executions across all 18 calls and 4 difficulties reached result with finite positions | Inspect every alignment and diagram; play each concept and compare real route/run movement |
| Passing / catching | Fixed-input pass paths resolve; boundary defects reproduced | Short/medium/deep lob and bullet throws, leading receivers, contested catches, interceptions |
| Running / exchanges | All designed handoffs/pitches executed through original engine | Every play's RB option, delay, lane assistance and manual steering |
| Pursuit / tackling | Plays resolve; deterministic missed-tackle action, 280 ms slowdown, 0.45 s cooldown, 2150 ms recovery deadline observed | Visual contact, all defenders, recovery movement, repeated breaks, performance |
| Sidelines / end zones | AUD-002 through AUD-004 | Both sidelines and end lines, goal-line corners, valid catch then exit, safety |
| Scoring / downs / punts / field goals | Fourth-down decision, missed field-goal callback, punt and CPU result callbacks exercised | All outcomes and possession spots, PATs, clock runoff, fourth-and-goal, duplicate activation |
| Quarter transitions / halftime | Q1 break and halftime receiver callback exercised | Expiring live plays, both kickoff recipients, possession retention across Q1/Q3, final regulation scoring |
| Overtime | Tied regulation enters OT; tied first possession round advances to round 2 | Each scoring outcome and end-game resolution; repeated tied rounds |
| Difficulty | Easy, Medium, Hard and Gridiron complete 18 source calls each | Actual pursuit/break feel, momentum and setting synchronization |
| Opponents / menus | Selection/menu source reviewed; League Hub shadowing reproduced | Every selection path, random/self-exclusion, returning and restarting |
| Saves | Existing 4 tests pass; storage in probes is disposable | Full legacy/current data comparison, reload behavior, unavailable storage, no debug writes |
| Formation Lab | Cancel defect reproduced; boundary-clamp logic reviewed | All 3 formations, drag limits, copy/export, switching and exit/reentry |
| Sprites / animations / performance | Assets included in production output; no edits | Actual pixel rendering, presnap-to-live poses, animation timing, viewport layout and frame behavior |

The source call sweep includes:

- Trips: Quick Slants, Mesh Crossers, Four Verticals, Bubble Screen, Inside Zone, RB Draw.
- Ace: Stick, Levels, Flood, PA Deep Cross, Power, Outside Zone.
- Pistol: Smash, TE Seam, RB Screen, PA Post, Counter, Strong Toss.

## Reproduce the source evidence

From this branch's repository root:

```bash
node --experimental-vm-modules docs/audit/baseline-source-probes.mjs
```

For machine-readable evidence:

```bash
node --experimental-vm-modules docs/audit/baseline-source-probes.mjs --json
```

`baseline-evidence.json` records the observed untouched-baseline outputs. The helper is intentionally outside `src` and the automated test directories. It asserts the **current defective behavior** to preserve evidence, not the desired fixed behavior; retire or convert each relevant probe when real regression tests are introduced. It is not imported by the app and is not part of the Vite production bundle.

## Required continuation

1. Resume the unchanged build in an environment that permits the live preview and has the matching Playwright Chromium installed. Do not bypass the present browser security policy.
2. Complete the live coverage register and capture exact browser reproduction steps. Reclassify candidates based on actual evidence.
3. Then add the requested read-only `window.__GRIDIRON_LEGENDS__` snapshots. Keep any mutation/scenario setup in an explicitly test-only, isolated context; do not expose a mutation method on the read-only interface or write production saves.
4. Fix confirmed issues in small commits with intended-behavior regression tests. Preserve the current sprites, animations, controls, tuning, formations, routes and league data except for a targeted verified defect.
5. Run the data tests, save tests, production build and full Playwright suite after every fix batch. Include deeper save comparisons and normal-versus-test isolation coverage.
6. Open the review PR only when the audit and fixes are complete. Do not merge into main.
