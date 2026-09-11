# Contact, pursuit and receiving revision

Based on the supplied 49-second recording: distant tackles early in the clip,
uneven pursuit after catches, and unexplained incompletions.

## Changes

- Ordinary tackle contact is 18 field pixels instead of approximately 70.
  Defender ratings change success, not reach. Lunges start within 44 pixels,
  travel physically for up to 180 ms, commit to a direction, and check swept
  contact. A missed lunge uses the existing recovery animation and downtime.
- After a catch, linemen leave their old approach/engagement state. Every
  defensive player can pursue, including the three formerly decorative players
  on running plays. Pursuers lead by at most 0.3 seconds and share one movement
  update. Reaction delays are 0.22 / 0.16 / 0.10 seconds for easy/medium/hard.
- Nearby receivers and offensive linemen seek distinct threats ahead of the
  runner. Contact slows a defender briefly (180–550 ms), with a cooldown to
  prevent permanent holds. There is no remote blocking effect.
- Catch tolerance uses a 30-pixel baseline with modest rating/difficulty scaling.
  Precisely placed open passes are certain catches. Stretch catches and pressure
  can produce drops, breakups or interceptions; outcome probabilities are
  mutually exclusive. All nearby available defenders count, not just assignments.
- QB error is smaller and distance-scaled. An intended receiver can adjust at
  normal route speed during the final 450 ms of a reachable pass. No teleporting.
  The targeting highlight uses the same catch-tolerance function as resolution.
- Incomplete-pass messages distinguish out-of-reach throws, drops and breakups.
  Existing catch sprites provide separate drop and deflection poses.
- In-bounds completed-play runoff is eight seconds instead of eighteen.
  Incompletions and sideline exits retain stopped-clock behavior. Tackle
  presentation time no longer consumes game-clock time.

## Verification

The engine regression suite checks distant non-contact, diving and evasion,
swept contact, pursuit activation, brief blocking, clock runoff, dependable open
catches, unassigned defenders, downed defenders, and bounded receiver adjustment.
It also exercises all 18 plays on all four difficulties. Data, saves, career
lifecycle and production build checks are unchanged and pass locally.

The browser suite retains native mouse/touch throw and run tests. A new recorded
landscape fixture checks that a tackle begins only at contact. This fixture is
state-controlled evidence, not a manual full-game playthrough.

Balance remains a playtesting consideration: more dependable catches and shorter
runoff can raise offensive production, while physical dives and earlier pursuit
change yards after catch. No save migration, control remapping, formations or
route-data changes are included.
