"""SUM GREATNESS Blender bridge.

Run this file from Blender's Scripting workspace after pulling the repo.
It executes blender_bridge/tasks/current_task.py so GitHub can be the
handoff point between ChatGPT-authored Blender scripts and Blender.
"""
from pathlib import Path
import runpy

# Blender can report __file__ as if a text block lives inside the .blend file.
# Prefer the known local GitHub checkout, then fall back to nearby locations.
CANDIDATES = [
    Path.home() / "OneDrive" / "Documents" / "GitHub" / "sum-greatness-build-your-empire" / "blender_bridge",
    Path.home() / "Documents" / "GitHub" / "sum-greatness-build-your-empire" / "blender_bridge",
]

try:
    CANDIDATES.append(Path(__file__).resolve().parent)
except NameError:
    pass

BRIDGE_DIR = next((p for p in CANDIDATES if (p / "tasks" / "current_task.py").exists()), None)

if BRIDGE_DIR is None:
    searched = "\n".join(str(p) for p in CANDIDATES)
    raise FileNotFoundError(f"No Blender bridge task found. Searched:\n{searched}")

TASK = BRIDGE_DIR / "tasks" / "current_task.py"

print(f"[SUM GREATNESS] Running Blender task: {TASK}")
runpy.run_path(str(TASK), run_name="__main__")
print("[SUM GREATNESS] Blender task complete.")
