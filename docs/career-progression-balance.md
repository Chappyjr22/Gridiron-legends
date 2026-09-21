# Career progression balance, version 2

New careers choose their school and development separately. The recommended school combinations are Powerhouse + Steady, Competitive + Standard, and Cupcake + Fast. Pro quick start recommends Standard. Gameplay difficulty remains independent.

- School attribute offsets: 0 / -8 / -16. Precision starts at 73 / 65 / 57 OVR; other archetypes retain their strengths.
- Development multiplies each XP reward, including objectives: Steady 0.75×, Standard 1×, Fast 2×. The selection stays with the player in the pros.
- College levels cost 100 XP and award three points. College upgrades grant up to two attribute points and cost 1 below 80, 2 below 90, and 3 thereafter. The ceiling is 99.
- Pro levels award one point; the XP requirement starts at 100 and increases every five pro levels to 200. Existing specialty-based upgrade costs continue, with a 99 ceiling for new careers.
- Conversion applies to real attributes, not just the rating label. Attributes through 50 are unchanged; 50–90 follow 15 + 0.7 × attribute; 90–99 interpolate from 78 to 85. Round each ability, then calculate overall from the four QB abilities. Mixed builds can differ by one point from a simple overall-only conversion.
- A fully maxed college QB becomes an 85 OVR rookie. Unspent college points convert at 3:1, with remainder converted to XP. Players can spend carried points after conversion, so their first-game OVR may exceed their draft-day OVR. Development level and partial XP carry forward, but college levels do not inflate the pro XP threshold.
- College final OVR, attributes, development setting, statistics, history and awards are archived. Draft pick remains based on scouting performance, independently of OVR.
- Saves without progressionVersion 2 preserve their original XP, upgrade ceiling and draft attribute carryover. Loading does not alter earned attributes, points or XP.

## Repeatable balance scenarios

Run `node scripts/career-balance.mjs`. These are deterministic reward/economy simulations, not predictions of human play. They use a precision QB on one representative school per tier, medium difficulty, scripted weak/average/exceptional stats, and spend points on the lowest affordable ability after each game. Average seasons win two of every three games; exceptional seasons win all games and objectives. Postseason qualification affects the number of games. Fast development is intentionally an easier path and is not normalized against Steady.

| School | Development | Performance | Start | Games | XP | Final college | Projected pro |
|---|---|---|---:|---:|---:|---:|---:|
| powerhouse | steady | weak | 73 | 12 | 516 | 80 | 71 |
| powerhouse | steady | average | 73 | 12 | 996 | 83 | 73 |
| powerhouse | steady | exceptional | 73 | 15 | 1710 | 89 | 78 |
| powerhouse | standard | weak | 73 | 12 | 684 | 81 | 72 |
| powerhouse | standard | average | 73 | 12 | 1316 | 86 | 75 |
| powerhouse | standard | exceptional | 73 | 15 | 2265 | 92 | 80 |
| powerhouse | fast | weak | 73 | 12 | 1368 | 86 | 75 |
| powerhouse | fast | average | 73 | 12 | 2632 | 94 | 81 |
| powerhouse | fast | exceptional | 73 | 15 | 4530 | 99 | 85 |
| competitive | steady | weak | 65 | 12 | 516 | 72 | 66 |
| competitive | steady | average | 65 | 12 | 996 | 78 | 70 |
| competitive | steady | exceptional | 65 | 15 | 1710 | 85 | 75 |
| competitive | standard | weak | 65 | 12 | 684 | 74 | 67 |
| competitive | standard | average | 65 | 12 | 1316 | 82 | 72 |
| competitive | standard | exceptional | 65 | 15 | 2265 | 89 | 77 |
| competitive | fast | weak | 65 | 12 | 1368 | 82 | 72 |
| competitive | fast | average | 65 | 12 | 2632 | 91 | 79 |
| competitive | fast | exceptional | 65 | 15 | 4530 | 99 | 85 |
| rebuilding | steady | weak | 57 | 12 | 516 | 64 | 60 |
| rebuilding | steady | average | 57 | 12 | 996 | 70 | 64 |
| rebuilding | steady | exceptional | 57 | 15 | 1710 | 81 | 72 |
| rebuilding | standard | weak | 57 | 12 | 684 | 66 | 61 |
| rebuilding | standard | average | 57 | 12 | 1316 | 76 | 68 |
| rebuilding | standard | exceptional | 57 | 15 | 2265 | 85 | 75 |
| rebuilding | fast | weak | 57 | 12 | 1368 | 76 | 68 |
| rebuilding | fast | average | 57 | 12 | 2632 | 88 | 77 |
| rebuilding | fast | exceptional | 57 | 15 | 4530 | 98 | 84 |

Tests also cover three exceptional pro trajectories through year three, legacy-save preservation, exact 99-to-85 attribute conversion, reloads, reward banking, duplicate draft calls and the mobile setup/draft flows. Human playtesting is still needed to judge how the lower starting attributes feel and how often players complete the objectives.
