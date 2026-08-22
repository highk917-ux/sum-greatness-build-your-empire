"""Audit hero animation readiness without altering approved character geometry."""
import re
import bpy

scene=bpy.context.scene
hero=bpy.data.objects.get('Human.rig') or bpy.data.objects.get('Human') or bpy.data.objects.get('human.rig')
targets={
    'idle':('idle','breath','breathing','stand','standing'),
    'walk':('walk','walking'),
    'run':('run','running','jog','jogging','sprint','sprinting'),
    'stop':('stop','stopping','brake','braking'),
    'turn_left':('turn left','left turn','turnleft'),
    'turn_right':('turn right','right turn','turnright'),
    'pickup':('pickup','pick up','lift','grab'),
    'carry':('carry','carrying','hold','holding'),
    'place':('place','put down','putdown','drop'),
    'open_door':('open door','door open','opendoor'),
    'close_door':('close door','door close','closedoor'),
    'enter':('enter','walk in','walkin'),
    'exit':('exit','walk out','walkout'),
    'wave':('wave','waving','greet','greeting'),
    'talk':('talk','talking','speak','speaking','conversation'),
    'point':('point','pointing','gesture'),
}


def normalize(name):
    name=re.sub(r'[_\-.|:]+',' ',str(name or ''))
    name=re.sub(r'([a-z])([A-Z])',r'\1 \2',name)
    return re.sub(r'\s+',' ',name).strip().lower()


def is_pose_action(action):
    """True when an action contains at least one armature pose-bone channel."""
    for curve in getattr(action,'fcurves',()):
        if str(getattr(curve,'data_path','')).startswith('pose.bones['):
            return True
    return False


def find_action(aliases,actions):
    best=None
    best_score=0
    for action in actions:
        normalized=normalize(action.name)
        for alias in aliases:
            if normalized==alias:
                score=100
            elif normalized.endswith(f' {alias}') or normalized.startswith(f'{alias} '):
                score=80
            elif f' {alias} ' in f' {normalized} ':
                score=70
            elif alias in normalized:
                score=40
            else:
                score=0
            if score>best_score:
                best=action
                best_score=score
    return best


actions=list(bpy.data.actions)
pose_actions=[action for action in actions if is_pose_action(action)]
found={}
for key,aliases in targets.items():
    action=find_action(aliases,pose_actions)
    found[key]=action.name if action else None

missing=[key for key,value in found.items() if not value]
non_pose=[action.name for action in actions if action not in pose_actions]
if hero:
    hero['sg_animation_targets']=','.join(targets.keys())
    hero['sg_animation_ready_count']=sum(bool(value) for value in found.values())
    hero['sg_animation_required_count']=len(targets)
    hero['sg_animation_missing']=','.join(missing)
    hero['sg_animation_pose_action_count']=len(pose_actions)
    hero['sg_preserve']=True

scene['sg_animation_audit']=';'.join(f"{key}:{value or 'MISSING'}" for key,value in found.items())
scene['sg_animation_ready_count']=sum(bool(value) for value in found.values())
scene['sg_animation_required_count']=len(targets)
scene['sg_animation_missing']=','.join(missing)
scene['sg_animation_pose_action_count']=len(pose_actions)
scene['sg_animation_non_pose_actions']=','.join(non_pose)
scene['sg_animation_status']='ready' if not missing and hero else ('missing_hero' if not hero else 'needs_clips')
scene['sg_animation_next']='author/retarget missing rigged clips; preserve approved Human.rig and SUM_ assets'
print('[SUM GREATNESS] Rig-bound animation audit:',dict(found))
print('[SUM GREATNESS] Pose actions:',[action.name for action in pose_actions])
print('[SUM GREATNESS] Missing animation clips:',missing)
if non_pose:
    print('[SUM GREATNESS] Ignored non-pose actions:',non_pose)
if not hero:
    print('[SUM GREATNESS] WARNING: approved Human.rig/Human hero object was not found; no likeness changes were made.')
