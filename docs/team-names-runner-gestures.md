# Team names and runner gestures

Team Editor → Team name & branding edits the city/school, team name, and 2–4 character scoreboard abbreviation. Save team persists these alongside uniforms. Career changes belong to that career; the main-menu editor changes the exhibition franchise. Team IDs, rosters, schedules, and results remain intact. Cancel discards unsaved changes.

Runner controls no longer place a button strip over the field:

- Hold and drag to steer.
- Quick swipe up or down to juke.
- Quick swipe left, toward the opponent's end zone, to dive. A quarterback slides instead.
- A second finger can swipe while the steering finger remains held.

Gestures use screen pixels instead of canvas pixels and must finish within 280 ms. Slow drags, taps, and diagonal swipes do not trigger a move. Existing juke distance, cooldown, dive/slide mechanics, and passing controls are unchanged. Cancelled touches do not trigger moves.

Automated coverage checks gestures, second-finger steering, cancellation, sidelines, short landscape layout, name validation, cancel, save/reload, and career scoreboard identity. Actual phone gameplay remains for user playtesting.
