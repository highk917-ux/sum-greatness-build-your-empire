"""SUM GREATNESS gameplay interaction/spawn infrastructure.

Non-destructive to hero/character assets. Creates only SG_GEN_GAME_* empty marker
objects and custom properties that the mobile game can later consume for
vehicles, NPCs, missions, enterable buildings, homes, businesses and fast travel.
"""
import bpy

scene = bpy.context.scene
root = bpy.data.collections.get('SUM_GREATNESS_PRODUCTION')
if root is None:
    root = bpy.data.collections.new('SUM_GREATNESS_PRODUCTION')
    scene.collection.children.link(root)

def child(name):
    col = bpy.data.collections.get(name)
    if col is None:
        col = bpy.data.collections.new(name)
    if col.name not in {c.name for c in root.children}:
        root.children.link(col)
    return col

gameplay = child('SG_GAMEPLAY_MARKERS')
missions = child('SG_MISSION_POINTS')
vehicles = child('SG_VEHICLE_SPAWNS')
npcs = child('SG_NPC_SPAWNS')
interiors = child('SG_INTERIOR_PORTALS')
properties = child('SG_PROPERTY_POINTS')

# Rebuild only generated gameplay markers.
for obj in list(bpy.data.objects):
    if obj.name.startswith('SG_GEN_GAME_'):
        bpy.data.objects.remove(obj, do_unlink=True)

def marker(name, loc, collection, display='PLAIN_AXES', size=4.0, **props):
    obj = bpy.data.objects.new(name, None)
    obj.empty_display_type = display
    obj.empty_display_size = size
    obj.location = loc
    collection.objects.link(obj)
    for key, value in props.items():
        obj[key] = value
    return obj

# District centers aligned to the current procedural San Diego layout.
districts = {
    'Downtown': (0, 0, 3),
    'Gaslamp': (120, 90, 3),
    'Little_Italy': (-180, 170, 3),
    'Balboa_Park': (260, 260, 3),
    'Mission_Valley': (180, 760, 3),
    'Mission_Bay': (-520, 900, 3),
    'La_Jolla': (-700, 1500, 3),
    'Chula_Vista': (300, -900, 3),
    'El_Cajon': (1350, 180, 3),
}

# NPC/business/mission anchors. These are game-system markers, not final art.
mission_templates = [
    ('Business_Mentor', 'business_planning'),
    ('Banker', 'business_finance'),
    ('Marketing_Advisor', 'marketing_branding'),
    ('Real_Estate_Agent', 'property_expansion'),
    ('Supplier', 'inventory_operations'),
]

for d_idx, (district, loc) in enumerate(districts.items()):
    x, y, z = loc
    marker(
        f'SG_GEN_GAME_FASTTRAVEL_{district}', (x, y, z), gameplay,
        display='CIRCLE', size=7,
        sg_marker_type='fast_travel', sg_district=district,
    )
    marker(
        f'SG_GEN_GAME_VEHICLE_{district}', (x + 32, y - 26, z), vehicles,
        display='ARROWS', size=5,
        sg_marker_type='vehicle_spawn', sg_district=district,
        sg_vehicle_class='starter_or_owned_vehicle', sg_driveable=True,
    )
    role, lesson = mission_templates[d_idx % len(mission_templates)]
    marker(
        f'SG_GEN_GAME_NPC_{district}_{role}', (x - 24, y + 28, z), npcs,
        display='SPHERE', size=4,
        sg_marker_type='npc_spawn', sg_district=district,
        sg_npc_role=role, sg_mission_category=lesson,
    )
    marker(
        f'SG_GEN_GAME_MISSION_{district}', (x + 8, y + 12, z), missions,
        display='CUBE', size=4,
        sg_marker_type='mission_start', sg_district=district,
        sg_mission_sequence=d_idx + 1, sg_nonviolent=True,
    )

# Home/property progression anchors.
property_specs = [
    ('Starter_Apartment', (35, -40, 3), 1),
    ('Midtown_Condo', (145, 120, 3), 2),
    ('Coastal_Home', (-650, 1450, 3), 3),
    ('Luxury_Estate', (1320, 260, 3), 4),
]
for label, loc, tier in property_specs:
    marker(
        f'SG_GEN_GAME_PROPERTY_{label}', loc, properties,
        display='CUBE', size=6,
        sg_marker_type='property_purchase', sg_property_tier=tier,
        sg_property_name=label, sg_upgradeable=True,
    )

# Attach portal markers to generated buildings flagged for the enterable-building pipeline.
portal_count = 0
for building in [o for o in bpy.data.objects if o.name.startswith('SG_GEN_BLD_') and o.get('sg_enterable_pipeline')]:
    loc = building.location.copy()
    # Place a deterministic proxy portal near the building's local south side.
    y_offset = max(3.0, building.dimensions.y * 0.5 + 1.5)
    portal_loc = (loc.x, loc.y - y_offset, 2.0)
    p = marker(
        f'SG_GEN_GAME_PORTAL_{portal_count:03d}', portal_loc, interiors,
        display='CUBE', size=3,
        sg_marker_type='interior_portal', sg_target_building=building.name,
        sg_interior_status='shell_required', sg_enterable=True,
    )
    building['sg_portal_marker'] = p.name
    portal_count += 1

scene['sg_gameplay_marker_status'] = 'generated'
scene['sg_gameplay_district_count'] = len(districts)
scene['sg_gameplay_portal_count'] = portal_count
scene['sg_gameplay_system_note'] = 'Spawn/mission/property/portal markers generated for mobile integration; final NPC/vehicle/interior art remains later production work.'
scene['sg_mission_goal'] = '75+ entrepreneurship missions and assignments across San Diego districts'
print(f'[SUM GREATNESS] Gameplay infrastructure generated: districts={len(districts)}, portals={portal_count}.')
