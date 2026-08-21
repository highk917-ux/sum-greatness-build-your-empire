"""SUM GREATNESS unattended automation verification.

Safe end-to-end test for GitHub -> Windows runner -> Blender.
It does not delete, move, reshape, or replace any character/game assets.
It writes verification markers to the scene and saves the current .blend file.
"""
import bpy
from datetime import datetime, timezone

scene = bpy.context.scene
stamp = datetime.now(timezone.utc).isoformat()

scene["sum_greatness_github_bridge"] = "connected"
scene["sg_unattended_test"] = "passed"
scene["sg_unattended_test_utc"] = stamp
scene["sg_unattended_test_note"] = "GitHub -> Windows runner -> Blender background execution verified"

print(f"[SUM GREATNESS] Unattended verification marker written at {stamp}")
print(f"[SUM GREATNESS] Blend file: {bpy.data.filepath}")

if not bpy.data.filepath:
    raise RuntimeError("No .blend filepath is open; refusing to save unattended test.")

bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
print("[SUM GREATNESS] Unattended verification PASSED and .blend saved.")
