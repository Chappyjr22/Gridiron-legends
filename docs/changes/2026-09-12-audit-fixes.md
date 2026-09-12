# Post-audit fixes and improvements

Implemented on `fix/audit-gameplay-career-polish`, for review against main. Original findings: `docs/audit/2026-09-12/README.md`.

## Confirmed defects addressed

| Finding | Change | Regression evidence |
|---|---|---|
| A01: stalled-frame divergence | Physics catches up in at most 16 ms steps, drawing once. Interruptions longer than a second exclude excess time from all simulation clocks. First loop initialization synchronizes the frame clock. | Same seeded pass under normal frames and a one-second stall matches movement, clock and flight state; long interruptions remain bounded. |
| A02: malformed checkpoints | Validate checkpoint game fields, settings, player identities, stats, play log and resume-specific fields. | Empty checkpoint, invalid time/team/identity and incomplete turnover data rejected. |
| A03: cancelled queued tap | Pending throw belongs to its initiating pointer. Cancelled gestures discard it; completed taps survive ordinary capture loss. | Both cancellation and completed-tap cases exercised. |
| A04: resized pending target | Transform pending field targets with the field anchor during resizing. | The queued world destination remains unchanged after 400 px expansion. |
| A05: controls revert on resume | Device-local pass mode, throw type and route visibility are saved immediately and override old checkpoint preferences. Career difficulty stays separate. | Restoring a stale checkpoint retains Direct/Bullet/routes-off. Browser checks cover persistence and selected semantics. |
| A06: impossible QB totals | Every simulated interception occupies an incomplete attempt and a target. | 1,000 deterministic seeds enforce CMP + INT <= ATT and target/attempt consistency. |
| A07: missing utility receiver | A roster view includes the supporting WR3 with the existing `team-generic-15` identity. Teammate cards, game logs, recaps and league rows use it. | Historical production appears under the same ID. |
| A08: duplicate jerseys | Allocate generic numbers against the full roster without changing identities. | Both active lineups have unique numbers. |

## Improvements included

- Skill blockers reach defenders and make contact before slowing them. Delayed routes chip until their assigned release time; designated blockers can escort after a catch. Existing line protection remains the foundation. This is an arcade blocking model, not a full collision/holding simulation.
- Play-action calls have a brief RB fake and a gold fake marker in the play diagram. An immediate throw cancels the fake, preserving responsiveness.
- The field scales up to fit a desktop viewport, capped at 2×; short landscape still expands downfield space and preserves pointer mapping.
- Pause and career resume explain the pre-snap checkpoint. Full mid-play restoration and deterministic anti-retry enforcement are not included.
- Simulated opponent drives generate player production tied to their drive gains and scoring outcomes, without consuming gameplay randomness. Existing untracked history is not invented retroactively.
- Quiet synthesized snap/catch/tackle/whistle/juke feedback and a brief crowd reaction, with independent effects/crowd sliders and a persistent master mute. Audio starts only after a user gesture; absent/blocked audio does not stop gameplay.
- Unreadable careers are quarantined with their original data. Healthy slots remain playable. Recovery can create a separate career without its damaged unfinished game. Recovery and export are reachable from the career gateway.
- Full saved-data archives can be restored as separate careers in one storage write. Existing careers and unreadable originals are retained.
- Optional guided passing and juking practice, control/lead-ring explanations, keyboard jukes and pause, selected/pressed semantics, visible focus outlines and overlay focus containment.

## Verification and review boundaries

Local data, legacy save, gameplay, career/college lifecycle and production build checks pass. Three new browser scenarios cover desktop guided practice, short-landscape controls/focus/persistence, and damaged-slot recovery. The existing suite also covers real touch events, second-finger jukes, contacts, college/draft, career reloads and several landscape sizes.

Manual Cloud Chrome preview checks exercised title/settings, the guide, an actual slingshot throw, handoffs and a dedicated juke. The guide recognized the successful cut. Browser testing caught and corrected two dialog mounting problems before review: the practice guide accidentally nested in SVG definitions and recovery nested under a hidden career screen.

This is not certification on a physical iPhone/Safari, an audio listening assessment on the user's device, or a screen-reader audit. Blocking balance and the audio mix should get a hands-on play session before production merge. Replay remains a future feature.
