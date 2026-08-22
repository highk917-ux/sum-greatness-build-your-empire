# Founder Character Morning Test

Use this checklist after pulling `automation/character-interactions` onto the Windows development computer.

## 1. Confirm the branch and working tree

```powershell
git switch automation/character-interactions
git pull origin automation/character-interactions
git status --short
```

`git status --short` should be blank before running the export/build steps.

## 2. Run the Blender founder export

Open Blender, go to **Scripting**, open `blender_bridge/run_latest.py`, and click **Run Script**.

Expected result: the current Blender automation pipeline completes without deleting or replacing approved character geometry and exports the preview files outside the Git checkout to:

```text
%USERPROFILE%\OneDrive\Documents\SUM_GREATNESS_exports\phone_preview
```

Required source file:

```text
sum-greatness-founder.glb
```

Also open `phone_preview_manifest.json` in that same folder and confirm:

- `founder_status` is `exported`
- `founder_glb_bytes` is greater than 1024
- `hero_bone_count` is greater than 0 for a rigged founder
- `skinned_mesh_count` is greater than 0 for skeletal deformation
- `animation_action_count` and `animation_action_names` contain the clips expected from Blender

If the founder file is missing/empty or the manifest reports no rig/skinned mesh, stop the Android test and inspect the Blender System Console/output first.

## 3. Prepare the Android phone preview

From the repository root run:

```powershell
powershell -ExecutionPolicy Bypass -File .\blender_bridge\automation\prepare_phone_preview.ps1
```

This script copies the generated founder GLB into `public/assets/models`, runs the Vite production build, syncs Capacitor Android assets, and verifies the founder file byte-for-byte with SHA-256 at all three stages.

Expected success messages:

1. `Public founder GLB verified`
2. `Vite dist founder GLB verified`
3. `Android packaged founder GLB verified`
4. `PHONE PREVIEW BUILD PREP COMPLETE`

A missing or changed hash means the packaging stage that reported the mismatch is the blocker.

## 4. Character load test

Launch the installed Android build and verify:

1. The realistic founder model appears instead of the fallback procedural/block character.
2. The character is grounded correctly and not floating or buried below the street.
3. The model is facing the expected forward direction.
4. There are no WebView/console errors reporting `Founder GLB unavailable`.
5. The console reports founder geometry counts and the mapped/missing animation clip list.
6. The successful status reports which model URL loaded. The loader now tries both Capacitor-friendly relative and origin-root asset URLs before accepting the fallback.

## 5. Skeletal movement test

Test in this order:

1. Idle for 5 seconds.
2. Walk forward and backward.
3. Hold Run while moving.
4. Stop after walking and after running.
5. Turn left and right while standing still.

The controller maps named clips for idle, walk, run, stop, turn-left, and turn-right. It also infers standing-turn intent directly from player yaw changes, so turn clips can work even before the main movement loop explicitly passes a turn value. Missing clips should fall back safely for locomotion and should be clearly reported in diagnostics.

## 6. Interaction foundation test

The branch includes `src/world/interactionDirector.js`, which connects the reusable interactable registry to the interaction state controller, door controllers, building portals, and NPC gesture controllers without hard-coding those systems into player movement.

After real interaction targets are registered in the world, test in this order:

1. Walk toward a pickup target and confirm it becomes the nearest focused interactable.
2. Trigger pickup and verify `pickup -> carry` with the target attached by its callback.
3. Trigger place and verify `carry -> place -> idle` with the target detached at the requested position.
4. Repeat pickup and use drop instead of place.
5. Trigger cancel/reset during a pending interaction and verify no stale callback fires afterward.
6. Approach a door, trigger open, and verify the reusable door controller rotates it open.
7. Trigger the same door again and verify it closes.
8. Confirm a building portal refuses entry while its door is closed.
9. Open the door, enter, then exit, and verify the player moves to the configured portal positions.
10. Walk away from an interactable and verify focus clears instead of leaving a stale prompt/target.

The interaction state now reports whether the requested real animation clip actually played through `lastAnimationPlayed`, which helps separate a logic success from a missing Blender animation clip.

## 7. NPC gesture test

Register an NPC with its gesture controller, then test:

1. wave
2. talk
3. point
4. return to idle

Missing gesture clips should report unavailable instead of pretending they played. The interaction director can route the NPC interaction to the NPC's configured default gesture without adding NPC-specific logic to the player controller.

## 8. Regression checks

Before moving on to storyline/gameplay work, confirm all of these still work together:

- founder GLB remains visible while walking and running
- fallback block character does not become visible after an interaction
- character movement resumes after pickup/place/door animations finish
- held objects do not remain parented after place/drop
- door state and visual rotation stay in sync
- entering/exiting does not leave the player in an interaction-busy state
- no repeated interaction fires while an earlier interaction timer is active
- no new Android/WebView errors appear during five minutes of movement and interactions

## Current hard blocker

GitHub-side code can prepare and harden the loading/interaction systems, but it cannot run the local Blender export or install/run the Android build on the physical phone. The decisive morning test is therefore the local export of `sum-greatness-founder.glb`, followed by verified Android packaging and the phone run.

Do not wire storyline progression into the live game loop until the founder GLB, locomotion, pickup/place, door, portal, and NPC gesture regression checks above pass on the phone. The next gameplay/story layer should remain isolated until that foundation is confirmed stable.
