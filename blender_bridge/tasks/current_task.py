"""SUM GREATNESS Blender production scaffold.

Non-destructive setup for the approved realistic character + San Diego scene.
This task intentionally does NOT replace the existing character mesh or clothing
with generic stand-ins. It prepares the production collections, tags the hero
rig, and stores the approved world layout targets for later detailed modeling.
"""
import bpy
from mathutils import Vector

print("[SUM GREATNESS] Preparing production scene scaffold...")
scene = bpy.context.scene
scene["sum_greatness_github_bridge"] = "connected"
scene["sg_project"] = "SUM GREATNESS: Build Your Empire"
scene["sg_visual_target"] = "realistic-photo-concept"
scene["sg_character_rule"] = "preserve approved face, low clean haircut, clothing, jewelry and branding; no generic replacement"
scene["sg_world_rule"] = "San Diego County inspired open world with realistic roads, freeways, sidewalks, alleys, ocean, bay, landmarks and enterable-building pipeline"
scene["sg_export_model"] = "public/assets/models/sum-greatness-founder.glb"

# Production collection hierarchy. Existing user objects are not deleted or moved.
root = bpy.data.collections.get("SUM_GREATNESS_PRODUCTION")
if root is None:
    root = bpy.data.collections.new("SUM_GREATNESS_PRODUCTION")
    scene.collection.children.link(root)

collection_names = [
    "SG_CHARACTER_REFERENCE",
    "SG_CHARACTER_FINAL",
    "SG_CITY_SAN_DIEGO",
    "SG_ROADS_FREEWAYS",
    "SG_SIDEWALKS_ALLEYS",
    "SG_WATER_OCEAN_BAY",
    "SG_LANDMARKS",
    "SG_BUILDING_INTERIORS",
    "SG_VEHICLES",
    "SG_NPCS",
    "SG_LIGHTING_DAY_NIGHT",
    "SG_GAME_EXPORT",
]
for name in collection_names:
    col = bpy.data.collections.get(name)
    if col is None:
        col = bpy.data.collections.new(name)
    if col.name not in {c.name for c in root.children}:
        # Avoid linking a collection twice when this task is re-run.
        already_parented = any(col.name in {c.name for c in parent.children} for parent in bpy.data.collections)
        if not already_parented:
            root.children.link(col)

# Locate the character currently being developed and tag it without modifying it.
hero_candidates = [
    bpy.data.objects.get("Human.rig"),
    bpy.data.objects.get("Human"),
    bpy.data.objects.get("human.rig"),
]
hero = next((obj for obj in hero_candidates if obj is not None), None)
if hero:
    hero["sg_role"] = "hero_founder_character"
    hero["sg_do_not_replace_with_placeholder"] = True
    hero["sg_target_style"] = "approved photo concept / realistic 3D"
    hero["sg_hair_target"] = "low clean cut"
    print(f"[SUM GREATNESS] Tagged existing hero object: {hero.name}")
else:
    print("[SUM GREATNESS] Hero rig not found by expected name; existing scene remains untouched.")

# Geographic production anchors matching the current game-world layout.
districts = {
    "Downtown San Diego": (0, 0),
    "Gaslamp Quarter": (75, 60),
    "Little Italy": (-80, -135),
    "Balboa Park": (140, -165),
    "North Park": (225, -285),
    "San Diego International Airport": (-240, -245),
    "Point Loma": (-455, -255),
    "Old Town": (-95, -410),
    "Mission Valley": (170, -520),
    "Mission Bay": (-285, -650),
    "La Jolla": (-310, -1070),
    "University City": (-75, -1235),
    "Del Mar": (-160, -1540),
    "National City": (120, 430),
    "Chula Vista": (190, 790),
    "Otay Mesa": (330, 1220),
    "La Mesa": (590, -10),
    "El Cajon": (900, -120),
}
city_col = bpy.data.collections.get("SG_CITY_SAN_DIEGO")
for district, (x, z) in districts.items():
    name = "SG_ANCHOR_" + district.upper().replace(" ", "_")
    obj = bpy.data.objects.get(name)
    if obj is None:
        obj = bpy.data.objects.new(name, None)
        city_col.objects.link(obj)
    obj.empty_display_type = 'CIRCLE'
    obj.empty_display_size = 12.0
    obj.location = Vector((x, -z, 0.0))
    obj["sg_district"] = district
    obj["sg_anchor_only"] = True

# Open-world scale and transport targets used by later Blender generation tasks.
scene["sg_world_bounds"] = "X -620..1120 / Z -1720..1420"
scene["sg_freeways"] = "I-5, I-805, I-8, SR-163, SR-94, I-15"
scene["sg_surface_roads"] = "Harbor Drive, El Cajon Boulevard, Friars Road, La Jolla Village Drive, H Street, Broadway, 5th Avenue, Highland Avenue, University Avenue, Mission Boulevard, Garnet Avenue"
scene["sg_required_water"] = "Pacific Ocean, San Diego Bay, Mission Bay, beaches, marina"
scene["sg_character_animation_targets"] = "idle, walk, run, drive"

print("[SUM GREATNESS] Production scaffold complete.")
print("[SUM GREATNESS] Existing character geometry/clothing was preserved.")
print("[SUM GREATNESS] Next detailed tasks: character fidelity, road/freeway geometry, coastline/water, landmarks, interiors, vehicles and NPCs.")
