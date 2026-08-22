"""SUM GREATNESS entrepreneurship mission network.

Creates 80 nonviolent mission/assignment markers distributed across the current
San Diego-inspired districts. These are gameplay data anchors for mobile-game
integration, not final NPC art or UI.
"""
import bpy
import math

scene = bpy.context.scene
root = bpy.data.collections.get('SUM_GREATNESS_PRODUCTION')
if root is None:
    root = bpy.data.collections.new('SUM_GREATNESS_PRODUCTION')
    scene.collection.children.link(root)

missions = bpy.data.collections.get('SG_MISSION_NETWORK')
if missions is None:
    missions = bpy.data.collections.new('SG_MISSION_NETWORK')
if missions.name not in {c.name for c in root.children}:
    root.children.link(missions)

for obj in list(bpy.data.objects):
    if obj.name.startswith('SG_GEN_MISSION_NODE_'):
        bpy.data.objects.remove(obj, do_unlink=True)

districts = [
    ('Downtown', (0, 0, 3)),
    ('Gaslamp', (120, 90, 3)),
    ('Little_Italy', (-180, 170, 3)),
    ('Balboa_Park', (260, 260, 3)),
    ('Mission_Valley', (180, 760, 3)),
    ('Mission_Bay', (-520, 900, 3)),
    ('La_Jolla', (-700, 1500, 3)),
    ('Chula_Vista', (300, -900, 3)),
    ('El_Cajon', (1350, 180, 3)),
]

categories = [
    ('business_setup', 'Create and organize a starter business'),
    ('budgeting', 'Build and maintain a working business budget'),
    ('credit_finance', 'Understand responsible business financing'),
    ('branding', 'Develop a recognizable business identity'),
    ('marketing', 'Plan a local marketing campaign'),
    ('sales', 'Practice customer-focused selling'),
    ('customer_service', 'Resolve a customer-service situation'),
    ('inventory', 'Manage stock and supplier needs'),
    ('operations', 'Improve daily business operations'),
    ('hiring', 'Plan staffing and team responsibilities'),
    ('real_estate', 'Evaluate a property or expansion opportunity'),
    ('networking', 'Build a useful professional connection'),
    ('pricing', 'Set sustainable pricing and margins'),
    ('digital_presence', 'Improve online presence and customer reach'),
    ('growth', 'Choose a responsible expansion strategy'),
    ('investment', 'Compare risk and return for a business investment'),
]

for idx in range(80):
    district, center = districts[idx % len(districts)]
    category, objective = categories[idx % len(categories)]
    ring = 1 + (idx // len(districts))
    angle = (idx * 0.73) % (math.tau)
    radius = 28 + ring * 11
    x = center[0] + math.cos(angle) * radius
    y = center[1] + math.sin(angle) * radius
    z = center[2]

    obj = bpy.data.objects.new(f'SG_GEN_MISSION_NODE_{idx+1:03d}', None)
    obj.empty_display_type = 'CUBE'
    obj.empty_display_size = 3.0
    obj.location = (x, y, z)
    missions.objects.link(obj)
    obj['sg_marker_type'] = 'mission_assignment'
    obj['sg_mission_id'] = idx + 1
    obj['sg_district'] = district
    obj['sg_category'] = category
    obj['sg_objective'] = objective
    obj['sg_nonviolent'] = True
    obj['sg_educational'] = True
    obj['sg_unlock_tier'] = 1 + (idx // 20)
    obj['sg_reward_cash_base'] = 250 + idx * 15
    obj['sg_reward_xp_base'] = 100 + idx * 5
    obj['sg_requires_npc_dialogue'] = True

scene['sg_mission_network_status'] = 'generated'
scene['sg_mission_network_count'] = 80
scene['sg_mission_network_rule'] = 'nonviolent entrepreneurship education mixed with open-world exploration and business progression'
scene['sg_mission_network_next'] = 'write final dialogue/objectives/rewards, connect NPCs, implement mobile runtime triggers and persistence'
print('[SUM GREATNESS] Mission network generated: 80 entrepreneurship missions/assignments.')
