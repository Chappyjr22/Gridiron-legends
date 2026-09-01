# Gridiron Legends Player Model Production Spec v1

Status: Approved direction for first real 3D player asset pipeline

## 1. Goal

Replace the procedural Three.js player rigs with authored low-poly GLB football characters that match the established Gridiron Legends visual direction.

The target is a chunky late-1990s arcade football look with readable silhouettes, oversized equipment, bold uniforms, and simple pixel-friendly textures. The models should feel closer to classic 3D console football and arcade sports games than to realistic modern simulation art.

Core rule: the characters must still read clearly at the current behind-the-offense mobile camera distance.

## 2. Target visual identity

The player art should communicate:

- Chunky low-poly football proportions
- Large helmets and shoulder pads
- Thick forearms, thighs, and lower legs
- Strong position-specific silhouettes
- Slightly exaggerated body proportions
- Shorter visual leg length than realistic NFL proportions
- Broad upper bodies
- Clear uniform color blocking
- Bold jersey numbers
- Simplified but recognizable facemasks
- Low-detail materials with strong contrast
- Retro console shading rather than smooth modern realism

Avoid:

- Thin realistic human proportions
- Blocky Minecraft-like anatomy
- Toy-like chibi proportions
- High-poly realistic skin and cloth simulation
- Tiny pads or helmets
- Photorealistic materials
- Excessive accessories or geometry that disappear at gameplay distance

## 3. Delivery format

Primary runtime format: GLB / glTF 2.0

Each production model should:

- Be exported as a single GLB when practical
- Use one shared skeleton layout across all four archetypes
- Use named animation clips
- Use normalized scale and orientation
- Face +Z in bind pose unless the implementation layer documents another convention
- Use Y-up coordinates
- Place the root at ground level between the feet
- Avoid unapplied transforms
- Avoid hidden geometry
- Avoid non-manifold geometry where practical

## 4. Runtime performance targets

The game is browser-first and mobile-first.

Recommended first-pass budgets per character:

- Skill player: 2,500 to 4,500 triangles
- QB: 3,000 to 5,000 triangles
- Hybrid: 3,000 to 5,000 triangles
- Lineman: 3,500 to 5,500 triangles

Preferred texture budget:

- One 512x512 texture atlas per body/uniform material set
- 1024x1024 acceptable if the visual gain is obvious and mobile performance remains strong
- Nearest or intentionally low-resolution filtering should be tested in-game

Target on-field population is 22 active players plus the football and stadium environment, so character assets must remain lightweight.

## 5. Shared skeleton

All archetypes should use the same core bone names and hierarchy so animation reuse is possible.

Minimum skeleton:

- root
- pelvis
- spine_01
- spine_02
- chest
- neck
- head
- clavicle_l
- upperarm_l
- forearm_l
- hand_l
- clavicle_r
- upperarm_r
- forearm_r
- hand_r
- thigh_l
- calf_l
- foot_l
- toe_l
- thigh_r
- calf_r
- foot_r
- toe_r

Optional helper bones:

- helmet
- football_socket_r
- football_socket_l
- towel
- shoulder_pad_l
- shoulder_pad_r

The football hand sockets are strongly recommended for passing, carrying, catching, handoffs, and stiff-arm animation alignment.

## 6. Archetypes

### Quarterback

Visual target:

- Balanced athletic build
- Moderate shoulder-pad width
- Slightly taller stance than other positions
- Helmet slightly oversized
- Clean throwing-arm silhouette
- Hands large enough to read around the football

Relative proportions:

- Shoulder width: 1.20x skill player
- Torso thickness: 1.10x skill player
- Leg thickness: 1.05x skill player
- Helmet scale: 1.12x realistic proportion

Primary animation needs:

- pre_snap_idle
- receive_snap
- dropback_3
- pocket_idle
- pocket_shuffle_left
- pocket_shuffle_right
- throw_short
- throw_medium
- throw_deep
- tuck_ball
- scramble_run
- slide
- sack_hit

### Skill Player

Used for WR, RB, CB, S.

Visual target:

- Leanest body type in the game
- Still visibly padded and muscular
- Strong thighs and calves
- Slight forward athletic stance
- Fast readable run silhouette

Relative proportions:

- Base reference archetype
- Helmet still exaggerated compared with realistic anatomy
- Pads narrower than QB and hybrid

Primary animation needs:

- pre_snap_wr
- pre_snap_rb
- route_run
- route_cut_left
- route_cut_right
- catch_chest
- catch_reach_left
- catch_reach_right
- catch_high
- ball_run
- juke_left
- juke_right
- stiff_arm_left
- stiff_arm_right
- tackle_hit
- fall_forward

### Lineman

Used for OL and DL with material and stance differences.

Visual target:

- Very broad shoulder pads
- Thick torso and hips
- Heavy thighs
- Lower center of gravity
- Shorter visual neck
- Large helmet and facemask
- Immediate visual distinction from skill players

Relative proportions:

- Shoulder width: 1.35x skill player
- Torso thickness: 1.30x skill player
- Arm thickness: 1.25x skill player
- Thigh thickness: 1.30x skill player
- Slightly reduced visible leg length

Primary animation needs:

- ol_three_point_stance
- ol_two_point_stance
- pass_set
- pass_block_engage
- pass_block_left
- pass_block_right
- block_recover
- dl_three_point_stance
- pass_rush_start
- pass_rush_engage
- shed_left
- shed_right
- sack

### Hybrid

Used for TE and LB.

Visual target:

- Between skill and lineman builds
- Thick chest and arms
- Athletic lower body
- Wide but not oversized pads

Relative proportions:

- Shoulder width: 1.18x skill player
- Torso thickness: 1.18x skill player
- Arm thickness: 1.15x skill player

Primary animation needs:

- pre_snap_te
- linebacker_ready
- route_run
- catch
- block_engage
- pursuit_run
- tackle
- hit_react

## 7. Helmet design

The helmet is one of the most important shapes because it remains readable from the gameplay camera.

Requirements:

- Oversized shell
- Slightly widened side profile
- Strong brow shape
- Simple rear taper
- Clear center stripe support
- Large ear-hole detail only if it remains readable
- Thick simplified facemask bars

Facemasks should use a small set of interchangeable variants:

1. QB / skill open cage
2. RB / LB medium cage
3. Lineman heavy cage

Do not use thin realistic facemask geometry that disappears at distance.

## 8. Shoulder pads and jersey silhouette

The shoulder silhouette should be broader than the underlying torso.

Pads should:

- Extend clearly past the upper arms
- Create a strong horizontal shelf
- Use exaggerated cap volume
- Remain visible under dark uniforms

Jerseys should have a slightly tapered waist and should not look like square boxes.

## 9. Uniform system

The model should support team-driven color swaps.

Required semantic material regions:

- helmet_primary
- helmet_stripe
- facemask
- jersey_primary
- jersey_secondary
- jersey_trim
- pants_primary
- pants_stripe
- socks
- shoes
- gloves
- skin

The runtime should be able to assign these colors from team data instead of needing a separate mesh export for every team.

## 10. Current prototype team palettes

### Las Vegas Outlaws

- Primary: Black
- Secondary: Rust
- Light neutral: Ivory
- Metal neutral: Dark steel

Suggested starting values:

- Black: #151515
- Rust: #A53D22
- Ivory: #E9DEC6
- Dark Steel: #272C30

Home concept:

- Black helmet
- Rust helmet stripe
- Black jersey
- Ivory numbers with rust outline
- Ivory pants
- Black socks
- Black cleats

### Denver Mountaineers

- Primary: Deep green
- Secondary: Gold
- Light neutral: Cream

Suggested starting values:

- Deep Green: #1F503B
- Gold: #D3A73A
- Cream: #E7DFC9

Home concept:

- Cream helmet
- Gold helmet stripe
- Deep green jersey
- Cream numbers with gold outline
- Cream pants
- Deep green socks
- Dark cleats

## 11. Jersey numbers

Numbers must be readable from the current gameplay camera.

Requirements:

- Large front and back numbers
- Bold condensed block font
- Strong outline
- High contrast against jersey
- No thin strokes
- No overly detailed athletic font treatment

The first production version can use dynamically generated runtime number textures if necessary.

Recommended areas:

- Large back number
- Medium front number
- Optional small shoulder numbers later

## 12. Texture and shading style

Target style:

- Hand-painted low-poly sports look
- Strong color blocks
- Mild baked shading or AO
- Limited highlights
- Minimal fabric noise
- No realistic roughness complexity required

Preferred visual treatment:

- Flat or lightly toon-influenced lighting
- Vertex color variation acceptable
- Low-resolution texture details
- Slight intentional pixelation when viewed through the final render pipeline

The model should still look good if the game is rendered at a lower internal resolution and upscaled with nearest-neighbor filtering.

## 13. Skin and faces

Faces are not a gameplay priority at this camera distance.

Requirements:

- Simple low-poly face planes or minimal facial geometry
- Strong helmet shadow around the face
- Skin tone material variations supported later
- No detailed eyes, teeth, hair cards, or facial hair required for v1

Career Mode customization can add head and skin variation later.

## 14. Stance targets

The bind pose should not be the visible pre-snap pose.

Gameplay stances should sell football immediately.

OL / DL:

- Low hips
- Bent knees
- Forward torso angle
- Hands near ground or chest depending on stance

WR:

- Slight crouch
- One foot staggered
- Hands relaxed near torso

QB:

- Shotgun-ready stance for prototype
- Hands at chest height
- Slight knee bend

LB / DB:

- Athletic crouch
- Weight forward
- Hands active

## 15. Initial animation priority

Priority A, required before replacing all procedural characters:

1. idle_ready
2. run
3. qb_dropback
4. qb_throw
5. catch
6. juke_left
7. juke_right
8. qb_slide
9. pass_block
10. pass_rush
11. tackle
12. hit_react

Priority B:

- stiff_arm
- broken_tackle
- contested_catch
- interception
- sack
- touchdown_celebration
- incomplete_reaction
- first_down_celebration

Priority C:

- handoff
- spin_move
- hurdle
- dive
- kneel
- spike
- victory poses

## 16. Animation rules

Animations should be short, readable, and arcade-forward.

Guidelines:

- Exaggerate anticipation and follow-through slightly
- Keep footwork readable at low resolution
- Avoid subtle realistic motion that disappears from the camera
- Favor strong silhouettes at key poses
- Keep run cycles energetic and compact
- QB throw should have a clear arm-cock and release frame
- Tackles should communicate contact immediately
- Jukes should contain a sharp plant and lateral burst

Root motion should generally be disabled for gameplay locomotion. Character movement should continue to be controlled by game code, with animation matching the current velocity and state.

## 17. Three.js integration plan

The current procedural player creation function will eventually be replaced by a model factory.

Proposed architecture:

```text
PlayerModelFactory
  load archetype GLBs once
  clone skinned mesh per player
  assign team materials
  assign number texture
  register AnimationMixer
  expose animation state methods
```

Per-player runtime data should include:

- archetype
- position role
- team id
- jersey number
- current animation
- animation mixer
- football hand socket references
- helmet/facemask variant

The gameplay simulation should remain independent of visual model animation wherever possible.

## 18. Asset folder target

```text
public/
  assets/
    models/
      players/
        qb.glb
        skill.glb
        lineman.glb
        hybrid.glb
    textures/
      players/
      teams/
    reference/
```

Later we may consolidate the models if one shared mesh and morphable body system proves more efficient.

## 19. Acceptance criteria for first production player

The first authored QB model is approved when all of the following are true:

- It clearly looks like an American football player at gameplay distance
- Helmet and pads dominate the silhouette appropriately
- It looks substantially closer to the approved concept art than the procedural prototype
- The model remains readable on an iPhone in landscape
- The model supports the shared skeleton
- The model can play at least idle, run, dropback, and throw clips
- LV and Denver color sets can be applied without re-exporting the geometry
- Jersey number remains readable from behind the offense
- Performance remains smooth with 22 test instances on a modern phone

## 20. First production milestone

Do not build all four archetypes simultaneously.

Milestone 1 is one fully working QB GLB with:

- Final target proportions
- Shared skeleton
- LV materials
- Denver material compatibility
- Number support
- idle_ready
- qb_dropback
- qb_throw
- run
- qb_slide

Once the QB is live in the browser prototype and visually approved, the same rig conventions will be used for skill, lineman, and hybrid players.

## 21. Guiding principle

At gameplay distance, silhouette matters more than detail.

If a detail cannot be read on the phone during a play, it should not consume meaningful geometry or texture budget.

The target is not realism. The target is a memorable Gridiron Legends football character that looks like it belongs in a lost late-1990s arcade football game.