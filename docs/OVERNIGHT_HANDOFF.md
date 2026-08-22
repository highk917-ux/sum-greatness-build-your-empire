# SUM GREATNESS morning validation handoff

Use this order so each failure points to one layer instead of mixing Blender, packaging, and Android problems.

## 1. Pull the development branch

From the repository folder in PowerShell:

```powershell
git fetch origin
git checkout automation/character-interactions
git pull origin automation/character-interactions
```

If Git reports `.git/FETCH_HEAD` permission denied, fully close GitHub Desktop first and retry.

## 2. Run the Blender bridge

Open the project in Blender, switch to **Scripting**, and run:

```python
exec(open(r"C:\Users\highk\OneDrive\Documents\GitHub\sum-greatness-build-your-empire\blender_bridge\run_latest.py").read())
```

The batch must finish without a Python traceback.

Then open:

`C:\Users\highk\OneDrive\Documents\SUM_GREATNESS_exports\phone_preview\phone_preview_manifest.json`

Before moving on, verify:

- `founder_status` is `exported`.
- `founder_glb_bytes` is greater than 0.
- `hero_bone_count` is greater than 0.
- `skinned_mesh_count` is greater than 0.
- `founder_rig_ready` is `true`.
- `pose_action_count` is greater than 0 for skeletal animation.
- `animation_audit_status` shows the current clip-readiness state.
- `animation_missing` lists any clips that still need to be authored/retargeted.
- `founder_animation_ready` becomes `true` only when the full required animation set is present.

Do not change the approved founder face/body geometry to make an animation warning disappear. Missing animation clips are a rig/animation task, not a likeness task.

## 3. Prepare the Android phone preview

From the repository PowerShell window:

```powershell
powershell -ExecutionPolicy Bypass -File .\blender_bridge\automation\prepare_phone_preview.ps1
```

Do not continue until the script confirms the founder GLB at every packaging layer and the automated tests/build complete. The source, Vite `dist`, and Android asset copies should have matching SHA-256 hashes.

## 4. Launch Android Studio

Open the Android project from this same repository copy, not an older `C:\Projects\...` clone.

Run the app on the phone in landscape.

## 5. Test in this exact order

1. Founder GLB appears instead of the block/fallback character.
2. Character remains grounded and approximately the expected height.
3. Idle animation plays without snapping.
4. Walk animation blends in while moving.
5. Run animation blends in while holding Run.
6. Stop returns cleanly to idle.
7. Standing left/right turns use their turn clips when available.
8. Pickup transitions to carry.
9. Carry keeps the object attached.
10. Place/drop returns the object to the world and returns the player to idle.
11. Doors open and close once per interaction.
12. Building enter/exit only works through an open portal.
13. NPC wave/talk/point gestures play when matching clips exist.
14. Profile shows the selected avatar/style/outfit and does not invent a face/body likeness.

## 6. What to report if something fails

Capture only the first failure in the sequence and include:

- the phone screenshot,
- the Android Studio error/log line if one appears,
- the relevant `phone_preview_manifest.json` values,
- and whether the failure happened before or after `prepare_phone_preview.ps1` completed.

That gives a clean single-problem starting point for the next fix.
