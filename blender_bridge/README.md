# SUM GREATNESS Blender GitHub Bridge

This folder is the handoff between GitHub and Blender.

## Files
- `run_latest.py` — runner opened/executed in Blender.
- `tasks/current_task.py` — current Blender automation task.

## One-time local setup
1. Pull the `blender-github-bridge` branch to the computer that runs Blender.
2. In Blender, open the Scripting workspace.
3. Open `blender_bridge/run_latest.py` in the Text Editor.
4. Click **Run Script**.

For later updates, pull the newest GitHub changes and run `run_latest.py` again.

## Safety
Blender executes these scripts locally with your user permissions. Review changes before running them, especially scripts that delete objects/files or export/overwrite assets.
