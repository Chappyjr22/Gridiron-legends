# Gridiron Legends Player Sprite Production Spec v1

## Goal

Use true 2D pixel players inside the existing 3D football world. The field, ball physics, camera, routes, collisions, and gameplay remain 3D. Player art is billboarded pixel animation.

The high-detail turnaround art is the visual reference. Gameplay sprites simplify that art only where needed for readability and animation.

## Native gameplay resolution

- Base frame: **96 x 128 pixels**
- Upscaling: **nearest-neighbor only**
- No texture smoothing
- No mipmaps on player sprites
- Keep the foot anchor fixed at bottom-center of every frame

64 x 80 was too small for the desired helmet, facemask, pad, uniform, and body detail. 96 x 128 is the current production target.

## Simplification rules

1. **Silhouette first.** Helmet, pad width, torso mass, thighs, and stance must read before small details.
2. **Do not simplify the football identity.** Keep the oversized helmet, visible facemask, broad shoulder pads, jersey number, football pants, socks, and cleats.
3. **No critical feature thinner than 2 native pixels.** Thin details disappear on a phone.
4. **Use grouped shading, not noise.** Highlights and shadows should be deliberate pixel clusters. Avoid texture-like speckling.
5. **Limit each material to a small value ramp.** Roughly 3 to 4 values for black fabric, ivory pants, skin, metal, and team trim.
6. **Numbers must remain readable.** Jersey numbers are more important than tiny logos or cloth folds.
7. **Helmet/facemask readability beats realism.** The facemask can be slightly oversized so it survives gameplay scale.
8. **Preserve the turnaround proportions.** Do not return to narrow stick-like bodies or square placeholder mannequins.
9. **Menu/reference art may be more detailed.** Gameplay art can drop micro-details that are invisible in motion, while keeping the same silhouette and uniform design.

## Direction set

Every production player archetype supports 8 direction buckets:

- N: upfield, back view from the offensive camera
- NE: upfield/right, 3/4 back
- E: right side
- SE: downfield/right, 3/4 front
- S: downfield, front
- SW: downfield/left, 3/4 front
- W: left side
- NW: upfield/left, 3/4 back

Direction changes snap to the nearest authored angle. We do not smoothly rotate pixel characters between angles.

For quarterbacks in the pocket, backward movement does **not** make the QB visually turn toward his own end zone. Pocket shuffle/dropback frames keep the torso reading upfield using N / NE / NW views.

## QB animation set v1

### Idle / pre-snap
- 2 frames
- Subtle breathing/bob only
- Upfield-facing back view by default

### Pocket shuffle / dropback
- 4 frames
- Ball secured near chest
- Small foot shuffle and weight transfer
- N / NE / NW angles prioritized

### Scramble / run
- 6 frames
- Stronger stride and body bob
- Ball tucked
- Uses full 8-direction set

### Throw
- 6 frames
- Right-handed sequence:
  1. set
  2. windup
  3. arm cock
  4. stride / acceleration
  5. release
  6. follow-through
- Throw animation is non-looping
- Ball-in-hand pixel disappears at release because the real game ball takes over

### Juke left / right
- 4 frames each
- Torso remains primarily upfield
- Fast lateral lean / plant / recover
- Triggered by the existing quick-swipe juke movement

### Slide
- 4 frames
- Lower body extends and torso leans back
- Non-looping

### Power move
- 3 frames reserved for scramble/contact work
- Shoulder lowers and silhouette widens

## Future shared states

The same sprite system should later support:

- catch high / catch low
- contested catch
- stiff arm
- broken tackle stumble
- tackle / hit reaction
- downed player
- handoff
- pass block
- run block
- shed block
- defensive backpedal

## Archetypes

We will not make every player from scratch. Create reusable sprite body families:

1. QB
2. Skill: WR / RB / CB / S
3. Hybrid: TE / LB
4. Line: OL / DL

All archetypes share the same angle and animation conventions so gameplay code can use one sprite-state API.

## Team customization

Team variants should preserve the same sprite geometry while changing palette slots:

- helmet shell
- helmet stripe / mark
- jersey primary
- jersey trim
- number fill / outline
- pants
- pants stripe
- socks
- optional accessories

Skin-tone palettes and accessory variants are separate from team palette swaps.

## Runtime rendering rules

- Use `THREE.Sprite` billboard players inside the 3D scene.
- `NearestFilter` for min/mag filtering.
- `generateMipmaps = false`.
- Transparent alpha-cutout sprite material.
- Foot anchor remains fixed to the 3D player position.
- Gameplay/collision position comes from the existing 3D player group, never from sprite pixels.

## Acceptance test

At normal iPhone gameplay zoom, the QB should immediately read as the same character family as the approved turnaround art. The player must remain readable while moving without relying on zoomed-in inspection.
