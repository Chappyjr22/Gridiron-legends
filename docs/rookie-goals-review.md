# Rookie goals and midseason review

Player → Career story contains an expandable Rookie season panel. It tracks the draft report's original win, completion-rate and interception-rate targets. Careers started directly in the pros use seven wins, 60% completions and at most 3% interceptions, with 100 attempts required for both passing targets.

Only completed games from the first pro regular season count. Passing percentages remain provisional until season end. Playoffs, college stats and later pro seasons do not inflate rookie progress.

After regular-season game nine, a coach review records the first nine games, strengths and second-half priorities. It does not grant XP or change coach confidence. The snapshot remains fixed while live goals update. The rookie record survives season rollover.

Existing first-year saves derive progress and the game-nine review from their recorded games when loaded. Older careers already beyond their rookie year without a stored record do not receive invented rookie results.

Validation: `npm run test:career` includes rookie regression checks. `tests/e2e/rookie-goals.spec.mjs` checks touch interaction, fixed back navigation, overflow and reload persistence at 844×304, 667×375 and 844×390.

The named rookie preview uses the existing isolated preview account service. Production accounts and saves remain separate.
