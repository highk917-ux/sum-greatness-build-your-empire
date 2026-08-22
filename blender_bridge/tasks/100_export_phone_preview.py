"""SUM GREATNESS unattended phone-preview export.

Exports the current protected hero/SUM_ character assets and the generated
San Diego preview world to a folder outside the Git checkout so the unattended
runner remains able to pull future tasks. This is a PREVIEW export; the final
hero likeness remains reference-guided.
"""
import bpy
import json
from pathlib import Path
from datetime import datetime, timezone

scene = bpy.context.scene
export_root = Path.home() / 'OneDrive' / 'Documents' / 'SUM_GREATNESS_exports' / 'phone_preview'
export_root.mkdir(parents=True, exist_ok=True)

founder_path = export_root / 'sum-greatness-founder.glb'
world_path = export_root / 'sum-greatness-world-preview.glb'
manifest_path = export_root / 'phone_preview_manifest.json'


def clear_selection():
    if bpy.context.mode != 'OBJECT':
        try:
            bpy.ops.object.mode_set(mode='OBJECT')
        except Exception:
            pass
    bpy.ops.object.select_all(action='DESELECT')


def export_selected(path: Path):
    """Export selected objects while enabling all supported animation options."""
    kwargs = {
        'filepath': str(path),
        'export_format': 'GLB',
        'use_selection': True,
        'export_animations': True,
    }
    try:
        supported = set(bpy.ops.export_scene.gltf.get_rna_type().properties.keys())
    except Exception:
        supported = set()
    optional = {
        'export_nla_strips': True,
        'export_all_actions': True,
        'export_force_sampling': True,
        'export_def_bones': True,
    }
    for key, value in optional.items():
        if key in supported:
            kwargs[key] = value
    bpy.ops.export_scene.gltf(**kwargs)
    return path.exists() and path.stat().st_size > 0


hero = bpy.data.objects.get('Human.rig') or bpy.data.objects.get('Human') or bpy.data.objects.get('human.rig')
character_objects = []
if hero is not None:
    character_objects.append(hero)
character_objects.extend(obj for obj in bpy.data.objects if obj.name.startswith('SUM_'))
expanded = list(character_objects)
for obj in list(character_objects):
    expanded.extend(list(obj.children_recursive))
character_objects = list(dict.fromkeys(expanded))

all_action_names = sorted(action.name for action in bpy.data.actions)
hero_bone_count = len(hero.data.bones) if hero is not None and hero.type == 'ARMATURE' else 0
skinned_mesh_count = sum(
    1 for obj in character_objects
    if obj.type == 'MESH' and any(mod.type == 'ARMATURE' for mod in obj.modifiers)
)
pose_action_names = sorted(
    action.name for action in bpy.data.actions
    if any(str(getattr(curve, 'data_path', '')).startswith('pose.bones[') for curve in getattr(action, 'fcurves', ()))
)
animation_ready_count = int(scene.get('sg_animation_ready_count', 0))
animation_required_count = int(scene.get('sg_animation_required_count', 0))
animation_missing = [item for item in str(scene.get('sg_animation_missing', '')).split(',') if item]
animation_status = str(scene.get('sg_animation_status', 'not_audited'))

founder_status = 'skipped_no_character'
if character_objects:
    clear_selection()
    for obj in character_objects:
        try:
            obj.hide_set(False)
            obj.select_set(True)
        except Exception:
            pass
    if hero is not None:
        bpy.context.view_layer.objects.active = hero
    founder_status = 'exported' if export_selected(founder_path) else 'failed_empty_export'

world_objects = [
    obj for obj in bpy.data.objects
    if obj.name.startswith('SG_GEN_') and not obj.name.startswith('SG_GEN_GAME_')
]
world_status = 'skipped_no_world'
if world_objects:
    clear_selection()
    for obj in world_objects:
        try:
            obj.hide_set(False)
            obj.select_set(True)
        except Exception:
            pass
    bpy.context.view_layer.objects.active = world_objects[0]
    world_status = 'exported' if export_selected(world_path) else 'failed_empty_export'

clear_selection()
if hero is not None:
    try:
        hero.select_set(True)
        bpy.context.view_layer.objects.active = hero
    except Exception:
        pass

founder_size = founder_path.stat().st_size if founder_path.exists() else 0
world_size = world_path.stat().st_size if world_path.exists() else 0
founder_rig_ready = bool(hero_bone_count > 0 and skinned_mesh_count > 0)
founder_animation_ready = bool(animation_required_count > 0 and animation_ready_count == animation_required_count and pose_action_names)
manifest = {
    'generated_utc': datetime.now(timezone.utc).isoformat(),
    'preview_only': True,
    'hero_likeness_status': 'reference-guided final likeness still pending',
    'founder_status': founder_status,
    'founder_glb': str(founder_path),
    'founder_glb_bytes': founder_size,
    'founder_object_count': len(character_objects),
    'hero_object': hero.name if hero is not None else None,
    'hero_bone_count': hero_bone_count,
    'skinned_mesh_count': skinned_mesh_count,
    'founder_rig_ready': founder_rig_ready,
    'animation_action_count': len(all_action_names),
    'animation_action_names': all_action_names,
    'pose_action_count': len(pose_action_names),
    'pose_action_names': pose_action_names,
    'animation_audit_status': animation_status,
    'animation_ready_count': animation_ready_count,
    'animation_required_count': animation_required_count,
    'animation_missing': animation_missing,
    'founder_animation_ready': founder_animation_ready,
    'world_status': world_status,
    'world_glb': str(world_path),
    'world_glb_bytes': world_size,
    'world_object_count': len(world_objects),
    'next_step': 'copy preview GLBs into public/assets/models, run npm build, then npx cap sync android for phone preview',
}
manifest_path.write_text(json.dumps(manifest, indent=2), encoding='utf-8')

scene['sg_phone_preview_export_status'] = 'complete' if founder_status == 'exported' else 'warning'
scene['sg_phone_preview_export_root'] = str(export_root)
scene['sg_phone_preview_founder_glb'] = str(founder_path)
scene['sg_phone_preview_world_glb'] = str(world_path)
scene['sg_phone_preview_manifest'] = str(manifest_path)
scene['sg_phone_preview_export_utc'] = manifest['generated_utc']
scene['sg_phone_preview_founder_bytes'] = founder_size
scene['sg_phone_preview_action_count'] = len(all_action_names)
scene['sg_phone_preview_pose_action_count'] = len(pose_action_names)
scene['sg_phone_preview_founder_rig_ready'] = founder_rig_ready
scene['sg_phone_preview_founder_animation_ready'] = founder_animation_ready
print(f'[SUM GREATNESS] Phone preview exports: founder={founder_status} ({founder_size} bytes), world={world_status} ({world_size} bytes)')
print(f'[SUM GREATNESS] Founder rig: bones={hero_bone_count}, skinned_meshes={skinned_mesh_count}, rig_ready={founder_rig_ready}')
print(f'[SUM GREATNESS] Founder animations: pose_actions={len(pose_action_names)}, audit={animation_status}, ready={animation_ready_count}/{animation_required_count}')
if animation_missing:
    print(f'[SUM GREATNESS] Missing founder animation states: {animation_missing}')
print(f'[SUM GREATNESS] Preview export folder: {export_root}')
