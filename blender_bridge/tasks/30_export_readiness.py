import bpy

scene=bpy.context.scene
hero=bpy.data.objects.get('Human.rig')
issues=[]
if hero is None: issues.append('Human.rig not found')
if not any(o.name.startswith('SUM_') for o in bpy.data.objects): issues.append('No SUM_ character assets found')

scene['sg_export_target']='public/assets/models/sum-greatness-founder.glb'
scene['sg_export_animation_targets']='idle,walk,run,drive'
scene['sg_export_ready']=len(issues)==0
scene['sg_export_issues']='; '.join(issues)
print('[SUM GREATNESS] Export readiness:', 'READY FOR NEXT ART PASS' if not issues else scene['sg_export_issues'])