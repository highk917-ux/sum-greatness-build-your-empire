"""SUM GREATNESS Blender bridge.

Run this file from Blender's Scripting workspace after pulling the repo.
It executes blender_bridge/tasks/current_task.py so GitHub can be the
handoff point between ChatGPT-authored Blender scripts and Blender.
"""
from pathlib import Path
import runpy

BRIDGE_DIR = Path(__file__).resolve().parent
TASK = BRIDGE_DIR / "tasks" / "current_task.py"

if not TASK.exists():
    raise FileNotFoundError(f"No Blender task found: {TASK}")

print(f"[SUM GREATNESS] Running Blender task: {TASK}")
runpy.run_path(str(TASK), run_name="__main__")
print("[SUM GREATNESS] Blender task complete.")
