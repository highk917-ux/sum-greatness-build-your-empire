"""SUM GREATNESS gameplay/export metadata preparation.

Tags generated geometry and character assets for downstream game integration.
No destructive mesh edits are performed.
"""
import bpy

scene=bpy.context.scene
hero=bpy.data.objects.get('Human.rig') or bpy.data.objects.get('Human') or bpy.data.objects.get('human.rig')
if hero:
    hero['sg_player_character']=True
    hero['sg_required_actions']='idle,walk,run,drive'
    hero['sg_camera_target']=True

# Tag world meshes for collision/import handling.
for obj in bpy.data.objects:
    if obj.name.startswith('SG_GEN_BLD_'):
        obj['sg_game_collision']='box_or_mesh'
        obj['sg_lod_required']=True
    elif obj.name.startswith('SG_GEN_ROUTE_'):
        obj['sg_game_collision']='drive_surface'
        obj['sg_nav_surface']=True
    elif obj.name.startswith('SG_GEN_PACIFIC') or obj.name.startswith('SG_GEN_SAN_DIEGO_BAY') or obj.name.startswith('SG_GEN_MISSION_BAY'):
        obj['sg_game_collision']='water_boundary'
    elif obj.name.startswith('SUM_'):
        obj['sg_character_asset']=True
        obj['sg_export_with_hero']=True

# Camera-follow target empty.
root=bpy.data.collections.get('SUM_GREATNESS_PRODUCTION')
char_col=bpy.data.collections.get('SG_CHARACTER_FINAL')
if root and char_col is None:
    char_col=bpy.data.collections.new('SG_CHARACTER_FINAL'); root.children.link(char_col)
target=bpy.data.objects.get('SG_GAME_CAMERA_TARGET')
if target is None and char_col:
    target=bpy.data.objects.new('SG_GAME_CAMERA_TARGET',None); char_col.objects.link(target)
if target:
    target.empty_display_type='SPHERE'; target.empty_display_size=0.3
    target['sg_role']='third_person_camera_target'
    if hero: target.parent=hero

scene['sg_gameplay_prep_status']='complete'
scene['sg_mobile_targets']='landscape fullscreen; responsive joystick; third-person camera; collision; walk/run/drive'
scene['sg_export_character_path']='public/assets/models/sum-greatness-founder.glb'
scene['sg_export_world_plan']='chunked district GLBs / mobile LODs / collision proxies'
print('[SUM GREATNESS] Gameplay and export metadata preparation complete.')
