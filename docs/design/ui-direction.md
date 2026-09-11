# Gridiron Legends UI review and proposed direction

Reviewed September 11, 2026. Proposal, not an implemented redesign.

## Evidence and limits

Inspected the current title, setup, kickoff/HUD, pause, playbook and league screens in the Cloud browser at the public Workers URL. That URL still served the pre-career build. Reviewed the published audit-branch HTML and UI modules for career creation/hub, results, fourth downs, settings and Formation Lab. Prior baseline gameplay screenshots provide additional result/transition evidence. The career screens and mobile layouts of the new build still need a live preview review; do not call this a complete device validation.

## Diagnosis

- Nearly every container has another dark container inside it, with multiple outlines and shadows. These compete with the content.
- Gold means a primary action, an active setting, a heading, a label, a team rating and decorative trim. This weakens its ability to direct attention.
- Body text is mostly Courier New, with numerous 7–10px labels. Uppercase and letter spacing make long instructions harder to scan. Impact is a platform-dependent title fallback rather than a deliberate pixel identity.
- The main menu places tools, settings and game modes in the same stack. On the career branch, Career Mode and New Game both receive primary styling.
- The career hub is a long collection of text panels. The created player has no visual presence; selecting a skin tone gives no preview.
- Pause opens a full settings form. Resume comes after all of it, and the exit destination is not career-aware.
- Large desktop viewports spread the score HUD to the edges while the field remains centered and relatively small. Portrait CSS hides both team names and the down/distance situation. Critical game information should remain visible.
- The playbook keeps three columns even on narrow screens, has 7px concept labels and relatively small diagrams. The formation-first interaction is sound, but the presentation needs room.
- Routine gains, touchdowns, opponent drives and halftime share the same message-card structure. There is little difference in excitement or information hierarchy.
- League tables squeeze multiple competitions into tiny rows. Selection, schedule context and the user's team should be easier to find.
- The main menu exposes Formation Lab and its raw JSON workflow at the same level as playing football.
- Layout is tied to fixed full-screen containers and several nested scroll areas. Safe-area padding, landscape phone height, focus, text scaling and touch targets need deliberate treatment.

## Direction: Saturday Night Legends

A bright 16-bit sports cartridge identity with a clear broadcast scoreboard, collectible player cards and an inviting stadium atmosphere. Keep the existing pixel players, field, camera and controls. The proposed direction takes the quick readability and player attachment the user likes in Retro Bowl as goals; it does not copy its screens or branding.

Use deep navy (#102033), light stadium cream (#F6F0DB), warm gold (#FFD15C), turf green (#28764B) and a restrained mint accent (#81D8B4). Team colors identify the player's club and opponent. Gold is reserved primarily for the next action; selected settings use a checkmark and distinct outline as well as color.

Use a deliberately selected, self-hosted pixel display face for short headings after verifying its license and device rendering. Use a readable companion face for descriptions and tables, and tabular numerals for scores. Target 14–16px body text, 12px secondary text, 44–48px touch targets and 8px spacing increments. These are design targets, not measurements of a tested redesign.

Prefer one panel boundary and a small offset shadow. No stacked bevels, repeated thick cream frames, full-screen blur or constant flashing. Keep short transitions around 120–180ms, honor reduced motion, and defer sound to the separately planned audio work.

## Every screen

| Surface | Proposed treatment |
| --- | --- |
| Title/main menu | Pixel stadium and a stronger wordmark. One large Continue Career or Start Career action with player/week context. Quick Play and Practice secondary. Settings and Extras in a small utility row. |
| Quick Play setup | Two opposing team cards with uniform previews, clearly labeled ratings and a central VS. Difficulty and quarter length visible. Advanced control preferences expandable. Persistent Kick Off action. |
| Career creation | Three short steps: player identity with sprite/jersey preview; archetype cards with visible attribute differences; team and season settings. Back retains entries. Final summary explicitly shows difficulty and quarter length. |
| Career home | Player card, next opponent and one Play Game action above the fold. Three key season stats and XP. Home, Player and League navigation replaces the long accordion stack. |
| Player/upgrades | Large player sprite in team colors, jersey number and ratings. Show current value, proposed value and cost before upgrading. Clear disabled reasons during a match or without points. |
| Roster | Position groups and larger rows with names, numbers and ratings. Make generic versus star players understandable without overcrowding. |
| League/schedule | Schedule, Standings and Playoffs tabs; one conference at a time on phones. Highlight the user's club. Show next game first, current week clearly and completed scores consistently. |
| Game HUD | Compact scoreboard aligned to the field: team abbreviations/colors, score, possession, quarter/time and down/distance. Retain all essentials in portrait. Pause belongs outside passing gestures. |
| Playbook | Keep formation then play. Three formation cards, larger diagrams using the same gameplay data. Two columns on phones, three where width permits. Clear Pass/Run/Screen/Play Action labels and a small route legend. |
| Fourth down | Large down/distance header and three clear options showing the actual field-goal odds and punt estimate. Avoid displaying multiple unexplained recommended highlights. |
| Routine play result | Compact gain/result banner and a clear Next Play action. Keep the field recognizable. No automatic advancement that could consume a live gesture. |
| Scoring/turnover | Larger team-colored headline, scorer where tracked, gain and updated score. Touchdowns get a brief celebration; turnovers communicate the possession change clearly. |
| CPU drive | A compact drive recap with elapsed time, gain, outcome and the updated score. Simulated football should still be understandable. |
| Quarter/half/OT | Dedicated period header, score and next possession. Make the overtime format clear using the engine's actual rules. |
| Final/postgame | Score first, player stat line second, earned XP/points third. Return to Career for career games; exhibition offers its own menu flow. Never grant rewards from animation callbacks. |
| Pause | Small panel with Resume first, Settings second, and Return to Career or Main Menu last. State checkpoint behavior before leaving a live snap. No repeat-play/replay button until supported. |
| Settings | Consistent Controls, Game and Display groups. Render selections from actual state. Distinguish global controls from saved career difficulty and pregame-only quarter length. |
| Practice | Clear Practice badge, formation/play context and quick change/repeat controls outside the field. Keep explanation short and hide it once understood. |
| Formation Lab | Move into Extras. Bigger field workspace, compact formation picker and selected-player inspector. Hide JSON under Export; retain the existing export data and legal alignment constraints. |
| Backup/save/error states | Quiet Saved indicator in normal use. Put export/restore in career settings. Prominent actionable errors; never obscure the field unnecessarily. Recovery and replacement remain explicit. |

## Input and accessibility requirements

Use safe-area insets on phones. One predictable scrolling region per screen; no horizontal page scrolling. Keep labels associated with controls, keyboard focus visible and modal focus managed. Do not rely on color alone, tiny icons or hover. Avoid blocking browser text scaling across menus. Keep canvas touch gestures isolated from menu scrolling. Position game overlays within usable field bounds at short landscape heights.

## Difficulty defect

Career creation stores Easy and launch assigns it to game.difficulty. The pause buttons retain their initial Medium class because no settings synchronization occurs on career launch. The simulation does not reset to Medium in startNewGame. This establishes a displayed-state bug in source, rather than proof of Medium gameplay in the user's session.

There is also a persistence defect: changing difficulty in the pause menu changes game state but not career.settings. The targeted patch synchronizes displayed controls on entry/restoration/opening settings, and saves career difficulty changes into both career settings and the current checkpoint without advancing the checkpoint. A new browser regression covers Easy at first kickoff, changing to Hard, reloading/resuming and restoring independent Medium exhibition settings.

## Implementation order and acceptance

1. Fix settings synchronization independently of appearance.
2. Approve the visual direction using a small title/career/pause concept board. The board uses illustrative names/scores and placeholder identity art, not screenshots of implemented features.
3. Implement shared typography, buttons, navigation and spacing, then title and career creation/home.
4. Implement HUD, playbook, pause and game-result presentation. Validate on-field visibility and pointer/touch interactions before continuing.
5. Finish league, roster, settings and Formation Lab using the same components.
6. Review every state at 390x844 portrait, 844x390 landscape and 1366x768 desktop, plus larger text and keyboard use. Keep scoring, save compatibility, difficulty persistence and all existing play controls covered by regression tests.

Keep work on qa/astra-gameplay-audit. No main merge or production deployment is part of this proposal. Replay remains deferred and must use read-only playback when implemented.
