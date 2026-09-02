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

The current prototype is the gameplay foundation for Gridiron Legends. Planned systems include teams, conferences, divisions, compact star-player rosters, coaching staffs, franchise mode, and career mode.

The abandoned 3D prototype is preserved on the `legacy-3d` branch.
