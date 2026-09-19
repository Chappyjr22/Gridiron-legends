# QB range and scramble follow-up

User feedback: a 68-overall QB still throws too far; scrambling usually loses yards or barely reaches the line. Overall and arm remain separate attributes.

Passing now uses 14 + 36 * ((arm - 40) / 59)^1.5 air yards, clamped to arm 40–99. Approximate lob limits: arm 60 = 21, 68 = 26, 75 = 30, 90 = 42, 99 = 50. Bullets retain the 82% range factor. Preview, all control modes and post-scatter release share the same cap.

Scramble corrections:
- Tucking no longer forces all defensive linemen into released state. Existing pass-block timers expire normally.
- Coverage continues briefly while the QB is behind the line. Run recognition takes 700ms plus the existing difficulty reaction delay; crossing the line ends that delay immediately. Free defenders within 40 field pixels and blitzers can react earlier. Released rushers continue pursuing throughout.
- No speed boost or invulnerability was added. Nearby blockers and the QB's speed attribute still matter. Avoid duplicate coverage/blitz movement for defenders already pursuing the scramble.

Validation: 20 overhaul checks, including all passing-mode caps, preservation/expiration of blocks, speed-based scramble gains, and line-crossing recognition. Existing 40 gameplay checks and career/save checks retained. A 12-scenario Medium probe varied tuck timing (0/600/1200ms), QB speed (55/80), and straight/angled steering. Angled escape gains were roughly 1–5 yards after the correction; late straight-ahead scrambles could still lose yardage. This small sample is directional evidence, not a guarantee of gains or complete balance coverage.
