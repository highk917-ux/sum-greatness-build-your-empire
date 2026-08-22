"""SUM GREATNESS character fidelity preparation.

Non-destructive: preserves Human.rig and all existing SUM_ character assets.
Creates a clear character-fidelity checklist and tags likely character meshes
for the later photo-reference art pass.
"""
import bpy

scene = bpy.context.scene
scene['sg_character_fidelity_status'] = 'prepared'
scene['sg_character_visual_target'] = 'approved photo concept / realistic 3D'
scene['sg_character_hair_target'] = 'low clean cut'
scene['sg_character_outfit_target'] = 'approved SUM GREATNESS outfit, dress shoes, jewelry and accessories'
scene['sg_character_face_rule'] = 'do not reshape face without approved reference comparison'
scene['sg_character_preserve_rule'] = 'preserve Human.rig and all existing SUM_ meshes unless explicitly replaced after backup'

hero = bpy.data.objects.get('Human.rig') or bpy.data.objects.get('Human') or bpy.data.objects.get('human.rig')
if hero:
    hero['sg_role'] = 'hero_founder_character'
    hero['sg_fidelity_pass'] = 'reference_required_before_face_edits'
    hero['sg_hair_target'] = 'low clean cut'
    hero['sg_preserve'] = True

sum_assets = [obj for obj in bpy.data.objects if obj.name.startswith('SUM_')]
for obj in sum_assets:
    obj['sg_preserve'] = True
    obj['sg_character_asset'] = True

# Organize discovered assets into audit lists without moving or duplicating them.
scene['sg_sum_asset_count'] = len(sum_assets)
scene['sg_sum_asset_names'] = ', '.join(obj.name for obj in sum_assets[:80])

# The exact likeness pass needs the approved reference images visible/available.
scene['sg_character_next_required'] = 'reference-image comparison for face/body/hair; then fit clothing/accessories; then rig/animation validation; then GLB export'

print(f'[SUM GREATNESS] Character fidelity preparation complete. Preserved {len(sum_assets)} SUM_ assets.')
print('[SUM GREATNESS] No face/body geometry was changed without reference comparison.')
