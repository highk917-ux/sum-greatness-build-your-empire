import bpy

scene=bpy.context.scene
hero=bpy.data.objects.get('Human.rig')
if hero:
    hero['sg_role']='hero_founder_character'
    hero['sg_preserve']=True
    hero['sg_target']='approved photo concept / realistic 3D'
    hero['sg_hair']='low clean cut'
    hero['sg_animation_targets']='idle,walk,run,drive'

# Tag existing SUM GREATNESS meshes without moving or renaming them.
for obj in bpy.data.objects:
    if obj.type=='MESH' and obj.name.startswith('SUM_'):
        obj['sg_asset']='character_accessory_or_clothing'
        obj['sg_preserve']=True

scene['sg_character_status']='prepared_non_destructive'
scene['sg_character_next']='face/body fidelity, haircut, outfit, jewelry, branding, animation validation'
print('[SUM GREATNESS] Character preparation complete; existing geometry preserved')