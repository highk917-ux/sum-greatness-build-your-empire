# SUM GREATNESS character model

Export the approved Blender character here as `sum-greatness-founder.glb`.

The game intentionally keeps its existing fallback character visible when this file is missing or invalid. Do not replace the final face/body likeness with a guessed model. Preserve the approved `Human.rig` and `SUM_` character assets until approved visual references are available for any likeness changes.

## Required skeletal animation foundation

Export named clips/actions for:

- `Idle`
- `Walk`
- `Run`
- `Stop`
- `Turn Left`
- `Turn Right`
- `Pickup`
- `Carry`
- `Place` or `Put Down`
- `Open Door`
- `Close Door`
- `Enter`
- `Exit`

The runtime also recognizes common variants such as `Jog`, `Sprint`, `Grab`, `Lift`, `Hold`, `Drop`, `Walk In`, and `Walk Out`. Interaction actions must be real clips; the game will not pretend an interaction succeeded by substituting the idle animation.

## Recommended Blender/glTF export settings

- Include the armature, skinned mesh, approved materials, textures, and all required actions.
- Export animations with `export_animations=True`.
- Keep one consistent armature and bind pose across every clip.
- Apply object transforms before export while preserving the rig and skin weights.
- Use meters and keep the feet at ground level.
- Avoid unnecessary subdivision and compress textures for Android performance.
- Test idle → walk → run → stop and turn transitions before adding heavier scene detail.

`blender_bridge/tasks/45_character_animation_audit.py` checks the current Blender file for the required action names without changing approved character geometry.
