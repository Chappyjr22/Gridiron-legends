# Gameplay comparison, September 11

Reviewed the supplied clips using five-second overview frames and half-second sequences around throws and catches. Times below are approximate video timestamps. This is a visual comparison, not access to Retro Bowl's internal rules.

## Evidence and changes

- **Our clip 01-48-50, approximately 0–10 seconds:** pass plays are selected but the first two outcomes are runs for zero yards. The recording cannot prove the player's intent. Source inspection confirms that pressing near the RB committed to a handoff immediately, before distinguishing a tap from a drag. On pass plays, a closer RB press now waits for a tap release; moving eight screen pixels becomes a pass gesture. Designed runs still snap on press. Cancellation and pause suppress pending taps.
- **Our clip, approximately 18–27 seconds:** one short completion is followed by two out-of-reach passes. The previous aiming highlight checked a receiver's present location, even though the receiver would keep moving during flight. The new guide projects route movement using the same release delay and flight duration as the throw. A small marker shows projected position, with a line from the receiver. Mint means within the projected catch radius, gold means within adjustment reach, and faint white means outside it. These indicate reachability, not guaranteed catches against coverage. Target assignment uses the same forecast. The ball still lands where aimed, with existing accuracy error; catches and defenders retain their existing rules.
- **Retro Bowl clip 01-47-15, approximately 15–19 seconds:** the catch and yardage feedback remain on the field. Our clip, approximately 20–21 and 38–40 seconds, replaces the scene with a large result panel. Routine play results now use a compact bottom strip with Continue; major events retain full panels. Progression remains explicit, so it cannot silently skip a fourth-down decision or advance a saved career.
- **Source-confirmed route issue:** the old route step could overshoot a waypoint and spend subsequent frames approaching it again. Movement now consumes its distance budget across route corners without exceeding it. Prediction reads the same route movement and does not mutate live players.

## Preserved and deferred

Physical tackle contact, difficulty-based windups, jukes, playbook, catch probabilities, scores, clock rules, sprites and save formats remain intact. The reference offers more usable field space; changing the field camera or zoom needs a separate pass because it affects control mapping and downfield visibility. The supplied footage does not justify making every defender slower or every near pass a catch.

## Verification

Added regression checks for tap-versus-drag, cancellation, pause, route corner distance, non-mutating projections, and compact-versus-major results. Browser scenarios exercise mouse and real touch events on landscape viewports, capture the aiming guide and result strip, and verify the Continue transition.
