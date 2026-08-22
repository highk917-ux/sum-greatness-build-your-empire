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
    bpy.ops.export_scene.gltf(
        filepath=str(path),
        export_format='GLB',
        use_selection=True,
        export_animations=True,
    )

# Character preview: Human.rig plus all existing SUM_ meshes/accessories.
hero = bpy.data.objects.get('Human.rig') or bpy.data.objects.get('Human') or bpy.data.objects.get('human.rig')
character_objects = []
if hero is not None:
    character_objects.append(hero)
character_objects.extend(obj for obj in bpy.data.objects if obj.name.startswith('SUM_'))
# Include direct children of selected character assets (e.g. meshes parented to rig/accessories).
expanded = list(character_objects)
for obj in list(character_objects):
    expanded.extend(list(obj.children_recursive))
character_objects = list(dict.fromkeys(expanded))

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
    export_selected(founder_path)
    founder_status = 'exported'

# World preview: generated world/detail geometry and lighting only; no duplicate hero.
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
    export_selected(world_path)
    world_status = 'exported'

clear_selection()
if hero is not None:
    try:
        hero.select_set(True)
        bpy.context.view_layer.objects.active = hero
    except Exception:
        pass

manifest = {
    'generated_utc': datetime.now(timezone.utc).isoformat(),
    'preview_only': True,
    'hero_likeness_status': 'reference-guided final likeness still pending',
    'founder_status': founder_status,
    'founder_glb': str(founder_path),
    'founder_object_count': len(character_objects),
    'world_status': world_status,
    'world_glb': str(world_path),
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
print(f'[SUM GREATNESS] Phone preview exports: founder={founder_status}, world={world_status}')
print(f'[SUM GREATNESS] Preview export folder: {export_root}')
