# Progressive passing aim

Drag passing previously measured from the QB rather than the initial touch and mapped horizontal pull directly to maximum range. A touch away from the QB could start with substantial power, and short passes had little adjustment space.

Aim now anchors at the initial touch. Holding still stays neutral even if the QB or camera moves. Both the preview and release use that anchor, including the minimum travel check and backward scramble gesture. The pull indicator begins at the anchor.

A continuous power curve (normalized horizontal travel to the power 1.65) reserves more travel for short and intermediate throws. Full range still requires 140 internal canvas pixels, with the existing arm-strength and bullet limits. At arm 68, straight pulls of 30, 70, and 140 pixels yield approximately 2, 8, and 26 air yards. Pulling back toward the anchor lowers power immediately. Direct and tap passing retain their existing targeting.

Validation: regression checks cover neutral off-center touches, stationary fingers during QB/camera movement, monotonic distance, maximum range, preview/release agreement, and backward scrambling. Browser coverage exercises the gesture at two short landscape sizes and captures the short-pass preview. Existing gameplay and career checks also run in CI.
