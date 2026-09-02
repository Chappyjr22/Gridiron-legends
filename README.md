# Gridiron Legends

A browser-first, pixel-art American football game focused on fast arcade gameplay, readable football strategy, and future franchise and career modes.

## Current playable build

- Four-quarter game loop with adjustable 2 to 5 minute quarters
- Passing and running plays
- Desktop and mobile pointer controls
- Simulated opponent possessions, punts, extra points, and field goals
- Four-down logic, scoring, turnovers, and field position
- Multiple difficulty levels
- Pixel-art players, animation states, field, stadium, end zones, and goal posts
- Multiple player skin tones
- Practice mode and formation lab

## League foundation

The in-progress league system includes:

- 32 original franchises based in real football cities
- Legacy and Frontier conferences
- North, South, East, and West divisions
- 12 star-player roster slots per team
- Generated names, ages, ratings, development traits, contracts, and jersey numbers
- Offensive and defensive coordinator ratings
- Coordinator-scaled generic offense and defense ratings
- Persistent local franchise data and team selection

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

Vite outputs the deployable site to `dist/`.

## Project direction

The current prototype is the gameplay foundation for Gridiron Legends. Planned systems include schedules, standings, roster management, player progression, franchise mode, and career mode.

The abandoned 3D prototype is preserved on the `legacy-3d` branch.
