"""Current SUM GREATNESS Blender automation task."""
import bpy

print("[SUM GREATNESS] GitHub -> Blender connection script is running.")

# Store a visible marker inside the .blend file so we can verify execution.
bpy.context.scene["sum_greatness_github_bridge"] = "connected"

print("[SUM GREATNESS] Scene marker set: sum_greatness_github_bridge=connected")
