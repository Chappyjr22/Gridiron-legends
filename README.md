# Gridiron Legends

Browser-first retro 3D American football prototype built with HTML, CSS, JavaScript, Three.js, and Vite.

## Prototype v0.1

Current playable slice includes:

- Behind-the-offense camera
- Las Vegas Outlaws vs Denver Mountaineers presentation
- Responsive retro scorebug
- QB pocket movement
- Four receiver routes with receiver badges
- Pull-back, aim, and release passing
- Visible pass arc and landing target
- Catch detection and automatic ball-carrier control
- Tuck-and-run QB scrambling
- QB slide
- Hold-to-power move state
- Basic defensive pursuit and tackling
- First downs, touchdowns, ball spot, downs, and play clock
- Desktop and touch controls

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

## Cloudflare Pages

Connect this GitHub repository to Cloudflare Pages with:

- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`

## Desktop controls

- WASD / Arrow keys: move
- Space: snap
- Drag on the field: pull back, aim, release to throw
- R: tuck and run
- Shift: QB slide

## Mobile controls

- Virtual stick: movement
- SNAP: start the play
- Drag on the field: pull back, aim, release
- TUCK & RUN: scramble
- SLIDE: QB slide
- Hold POWER: power move

The purpose of v0.1 is to tune the camera, movement, passing feel, field visibility, and mobile control layout before expanding into full football logic, Franchise Mode, and Career Mode.
