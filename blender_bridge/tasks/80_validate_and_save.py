"""SUM GREATNESS unattended validation and save."""
import bpy
from datetime import datetime, timezone

scene=bpy.context.scene
errors=[]
hero=bpy.data.objects.get('Human.rig') or bpy.data.objects.get('Human') or bpy.data.objects.get('human.rig')
if hero is None: errors.append('hero rig not found')
world_count=sum(1 for o in bpy.data.objects if o.name.startswith('SG_GEN_'))
if world_count < 20: errors.append(f'generated world object count unexpectedly low: {world_count}')
if bpy.data.collections.get('SUM_GREATNESS_PRODUCTION') is None: errors.append('production collection missing')

scene['sg_unattended_validation_utc']=datetime.now(timezone.utc).isoformat()
scene['sg_unattended_generated_object_count']=world_count
scene['sg_unattended_validation_errors']='; '.join(errors)
scene['sg_unattended_validation_status']='passed' if not errors else 'warning'
scene['sg_development_status']='world proxy + lighting + gameplay prep generated; reference likeness and final art remain'

if not bpy.data.filepath:
    raise RuntimeError('No .blend filepath open; refusing unattended save.')
bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
print(f'[SUM GREATNESS] Validation status={scene["sg_unattended_validation_status"]}; generated={world_count}; errors={errors}')
print('[SUM GREATNESS] Production blend saved.')
