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

Expected result: the current Blender automation pipeline completes without deleting or replacing approved character geometry and exports the founder GLB into the repository's public model path.

Required file:

```text
public/assets/models/sum-greatness-founder.glb
```

If the file is missing, stop the Android test and inspect the Blender System Console/output first.

## 3. Prepare the Android phone preview

From the repository root, run the existing phone-preview preparation script used by this project. Confirm that its GLB verification passes for the public, Vite build, and Android packaged copies before opening Android Studio.

The same founder GLB must survive all three packaging stages. A missing or changed hash means the packaging stage that reported the mismatch is the blocker.

## 4. Character load test

Launch the installed Android build and verify:

1. The realistic founder model appears instead of the fallback procedural/block character.
2. The character is grounded correctly and not floating or buried below the street.
3. The model is facing the expected forward direction.
4. There are no WebView/console errors reporting `Founder GLB unavailable`.
5. The console reports founder geometry counts and the mapped/missing animation clip list.

## 5. Skeletal movement test

Test in this order:

1. Idle for 5 seconds.
2. Walk forward and backward.
3. Hold Run while moving.
4. Stop after walking and after running.
5. Turn left and right while standing still.

The controller now maps named clips for idle, walk, run, stop, turn-left, and turn-right. Missing clips should fall back safely for locomotion and should be clearly reported in diagnostics.

## 6. Interaction foundation test

After real interaction targets are connected in the world, test:

- pickup -> carry -> place
- pickup -> carry -> drop
- cancel/reset during a pending interaction
- open door -> door rotates open
- close door -> door rotates closed
- enter only when the door is open
- exit only when the door is open

The interaction state controller now cancels stale timers, derives timing from real animation clips when available, and exposes attach/detach/open/close callbacks so world objects can be connected without rewriting the state machine.

## 7. NPC gesture test

When an NPC has a compatible animation controller, test wave, talk, point, and return-to-idle. Missing gesture clips should report unavailable instead of pretending they played.

## Current hard blocker

GitHub code can prepare and validate the loading/interaction systems, but it cannot create or run the local Blender export or install/run the Android build on the physical phone. The decisive morning test is therefore the local export of `sum-greatness-founder.glb`, followed by the Android packaging and phone run.
