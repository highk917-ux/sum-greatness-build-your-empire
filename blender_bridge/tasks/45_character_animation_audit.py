"""Audit hero animation readiness without altering approved character geometry."""
import bpy

scene=bpy.context.scene
hero=bpy.data.objects.get('Human.rig') or bpy.data.objects.get('Human') or bpy.data.objects.get('human.rig')
targets={
    'idle':('idle','breath','stand'),
    'walk':('walk',),
    'run':('run','jog','sprint'),
    'stop':('stop','brake'),
    'turn_left':('turn left','turn_left','left turn'),
    'turn_right':('turn right','turn_right','right turn'),
    'pickup':('pickup','pick up','lift','grab'),
    'carry':('carry','hold'),
    'place':('place','put down','put_down','drop'),
    'open_door':('open door','open_door','door open'),
    'close_door':('close door','close_door','door close'),
    'enter':('enter','walk in','walk_in'),
    'exit':('exit','walk out','walk_out'),
}
actions=list(bpy.data.actions)
found={}
for key,aliases in targets.items():
    found[key]=next((action.name for action in actions if any(alias in action.name.lower() for alias in aliases)),None)

missing=[key for key,value in found.items() if not value]
if hero:
    hero['sg_animation_targets']=','.join(targets.keys())
    hero['sg_animation_ready_count']=sum(bool(value) for value in found.values())
    hero['sg_animation_required_count']=len(targets)
    hero['sg_animation_missing']=','.join(missing)
    hero['sg_preserve']=True

scene['sg_animation_audit']=';'.join(f"{key}:{value or 'MISSING'}" for key,value in found.items())
scene['sg_animation_ready_count']=sum(bool(value) for value in found.values())
scene['sg_animation_required_count']=len(targets)
scene['sg_animation_missing']=','.join(missing)
scene['sg_animation_status']='ready' if not missing and hero else ('missing_hero' if not hero else 'needs_clips')
scene['sg_animation_next']='author/retarget missing rigged clips; preserve approved Human.rig and SUM_ assets'
print('[SUM GREATNESS] Animation audit:',dict(found))
print('[SUM GREATNESS] Missing animation clips:',missing)
if not hero:
    print('[SUM GREATNESS] WARNING: approved Human.rig/Human hero object was not found; no likeness changes were made.')
