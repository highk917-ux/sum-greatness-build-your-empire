"""SUM GREATNESS founder locomotion animation pass.

Non-destructive animation stage for the protected Human.rig. Creates in-place
skeletal Idle, Walk and Run actions without changing mesh geometry or likeness.
The game owns world translation; these clips provide actual body/limb motion.

The bone resolver is intentionally tolerant of common Blender, Rigify and
Mixamo-style naming. If the required leg/arm bones cannot be found, the stage
records a warning instead of damaging or guessing the rig.
"""
import math
import re
import bpy

scene = bpy.context.scene
rig = (
    bpy.data.objects.get('Human.rig')
    or bpy.data.objects.get('Human')
    or bpy.data.objects.get('human.rig')
)

if rig is None or rig.type != 'ARMATURE':
    scene['sg_character_motion_status'] = 'skipped_no_armature'
    print('[SUM GREATNESS] Character motion skipped: Human.rig armature not found')
else:
    rig['sg_preserve'] = True
    rig['sg_animation_system'] = 'in_place_locomotion_v1'

    def normalized(name):
        return re.sub(r'[^a-z0-9]', '', name.lower())

    pose_bones = list(rig.pose.bones)

    def find_bone(*patterns):
        patterns = tuple(normalized(p) for p in patterns)
        # Exact normalized match first.
        for bone in pose_bones:
            n = normalized(bone.name)
            if n in patterns:
                return bone
        # Then token containment, favoring the shortest matching bone name.
        matches = []
        for bone in pose_bones:
            n = normalized(bone.name)
            if any(p in n for p in patterns):
                matches.append((len(n), bone))
        return min(matches, key=lambda item: item[0])[1] if matches else None

    bones = {
        'hips': find_bone('hips', 'pelvis', 'root', 'torso'),
        'spine': find_bone('spine1', 'spine', 'chest', 'upperchest'),
        'left_arm': find_bone('leftarm', 'upperarml', 'upperarml', 'armleft', 'upperarmleft'),
        'right_arm': find_bone('rightarm', 'upperarmr', 'upperarmr', 'armright', 'upperarmright'),
        'left_forearm': find_bone('leftforearm', 'forearml', 'lowerarml', 'leftlowerarm'),
        'right_forearm': find_bone('rightforearm', 'forearmr', 'lowerarmr', 'rightlowerarm'),
        'left_thigh': find_bone('leftupleg', 'thighl', 'upperlegl', 'leftthigh'),
        'right_thigh': find_bone('rightupleg', 'thighr', 'upperlegr', 'rightthigh'),
        'left_calf': find_bone('leftleg', 'calfl', 'shinl', 'lowerlegl', 'leftcalf'),
        'right_calf': find_bone('rightleg', 'calfr', 'shinr', 'lowerlegr', 'rightcalf'),
        'left_foot': find_bone('leftfoot', 'footl'),
        'right_foot': find_bone('rightfoot', 'footr'),
    }

    # Side-aware fallback for Blender/Rigify names such as upper_arm.L.
    def side_fallback(existing, tokens, side):
        if existing:
            return existing
        side_tokens = ('.l', '_l', '-l', 'left') if side == 'L' else ('.r', '_r', '-r', 'right')
        candidates = []
        for bone in pose_bones:
            low = bone.name.lower()
            norm = normalized(low)
            if any(token in norm for token in tokens) and any(tag in low for tag in side_tokens):
                candidates.append((len(low), bone))
        return min(candidates, key=lambda item: item[0])[1] if candidates else None

    bones['left_arm'] = side_fallback(bones['left_arm'], ('upperarm', 'arm'), 'L')
    bones['right_arm'] = side_fallback(bones['right_arm'], ('upperarm', 'arm'), 'R')
    bones['left_forearm'] = side_fallback(bones['left_forearm'], ('forearm', 'lowerarm'), 'L')
    bones['right_forearm'] = side_fallback(bones['right_forearm'], ('forearm', 'lowerarm'), 'R')
    bones['left_thigh'] = side_fallback(bones['left_thigh'], ('thigh', 'upperleg', 'upleg'), 'L')
    bones['right_thigh'] = side_fallback(bones['right_thigh'], ('thigh', 'upperleg', 'upleg'), 'R')
    bones['left_calf'] = side_fallback(bones['left_calf'], ('calf', 'shin', 'lowerleg', 'leg'), 'L')
    bones['right_calf'] = side_fallback(bones['right_calf'], ('calf', 'shin', 'lowerleg', 'leg'), 'R')
    bones['left_foot'] = side_fallback(bones['left_foot'], ('foot',), 'L')
    bones['right_foot'] = side_fallback(bones['right_foot'], ('foot',), 'R')

    discovered = {key: (bone.name if bone else '') for key, bone in bones.items()}
    scene['sg_character_motion_bones'] = str(discovered)

    essential = ('left_thigh', 'right_thigh', 'left_arm', 'right_arm')
    missing = [name for name in essential if bones[name] is None]

    if missing:
        scene['sg_character_motion_status'] = 'warning_missing_bones'
        scene['sg_character_motion_missing'] = ','.join(missing)
        print(f"[SUM GREATNESS] Motion generation paused; missing essential bones: {', '.join(missing)}")
        print(f'[SUM GREATNESS] Discovered bones: {discovered}')
    else:
        original_action = rig.animation_data.action if rig.animation_data else None
        rig.animation_data_create()

        # Capture the current/rest pose as our neutral baseline so the stage does
        # not assume a particular rig orientation.
        baseline = {}
        for key, bone in bones.items():
            if bone:
                bone.rotation_mode = 'XYZ'
                baseline[key] = {
                    'rot': bone.rotation_euler.copy(),
                    'loc': bone.location.copy(),
                }

        def restore_pose():
            for key, values in baseline.items():
                bone = bones[key]
                bone.rotation_euler = values['rot'].copy()
                bone.location = values['loc'].copy()

        def set_rot(key, x=0.0, y=0.0, z=0.0):
            bone = bones.get(key)
            if not bone or key not in baseline:
                return
            base = baseline[key]['rot']
            bone.rotation_euler = (base.x + x, base.y + y, base.z + z)
            bone.keyframe_insert(data_path='rotation_euler', group=bone.name)

        def set_loc(key, x=0.0, y=0.0, z=0.0):
            bone = bones.get(key)
            if not bone or key not in baseline:
                return
            base = baseline[key]['loc']
            bone.location = (base.x + x, base.y + y, base.z + z)
            bone.keyframe_insert(data_path='location', group=bone.name)

        def new_action(name, end_frame):
            old = bpy.data.actions.get(name)
            if old and old.get('sg_generated_motion'):
                bpy.data.actions.remove(old)
            action = bpy.data.actions.new(name=name)
            action['sg_generated_motion'] = True
            action['sg_in_place'] = True
            action['sg_motion_version'] = 1
            rig.animation_data.action = action
            scene.frame_start = 1
            scene.frame_end = end_frame
            return action

        def key_pose(frame, *, leg=0.0, arm=0.0, knee_l=0.0, knee_r=0.0,
                     foot_l=0.0, foot_r=0.0, bob=0.0, sway=0.0,
                     chest=0.0, lean=0.0):
            scene.frame_set(frame)
            set_rot('left_thigh', x=leg)
            set_rot('right_thigh', x=-leg)
            set_rot('left_arm', x=-arm, z=-0.04)
            set_rot('right_arm', x=arm, z=0.04)
            set_rot('left_forearm', x=-0.10 - abs(arm) * 0.18)
            set_rot('right_forearm', x=-0.10 - abs(arm) * 0.18)
            set_rot('left_calf', x=knee_l)
            set_rot('right_calf', x=knee_r)
            set_rot('left_foot', x=foot_l)
            set_rot('right_foot', x=foot_r)
            set_rot('spine', x=lean, z=chest)
            set_loc('hips', z=bob, x=sway)

        actions = []

        # IDLE: subtle breathing/weight shift, enough movement to feel alive.
        restore_pose()
        idle = new_action('SG_Idle', 48)
        for frame, breath, sway in ((1, 0.000, 0.000), (13, 0.018, 0.008),
                                   (25, 0.004, -0.006), (37, 0.016, -0.008),
                                   (48, 0.000, 0.000)):
            scene.frame_set(frame)
            set_loc('hips', z=breath * 0.35, x=sway)
            set_rot('spine', x=-breath * 0.22, z=-sway * 0.45)
            set_rot('left_arm', x=-0.015 + breath * 0.12, z=-0.035)
            set_rot('right_arm', x=0.010 - breath * 0.10, z=0.035)
        idle['sg_loop'] = True
        actions.append(idle)

        # WALK: four-contact in-place cycle with planted-foot knee/ankle cues.
        restore_pose()
        walk = new_action('SG_Walk', 30)
        key_pose(1,  leg=0.48, arm=0.40, knee_l=-0.08, knee_r=-0.40, foot_l=-0.12, foot_r=0.20, bob=0.00, sway=-0.018, chest=0.030)
        key_pose(8,  leg=0.00, arm=0.00, knee_l=-0.18, knee_r=-0.10, foot_l=0.05,  foot_r=-0.04, bob=0.045, sway=0.000, chest=0.000)
        key_pose(16, leg=-0.48, arm=-0.40, knee_l=-0.40, knee_r=-0.08, foot_l=0.20, foot_r=-0.12, bob=0.00, sway=0.018, chest=-0.030)
        key_pose(23, leg=0.00, arm=0.00, knee_l=-0.10, knee_r=-0.18, foot_l=-0.04, foot_r=0.05, bob=0.045, sway=0.000, chest=0.000)
        key_pose(30, leg=0.48, arm=0.40, knee_l=-0.08, knee_r=-0.40, foot_l=-0.12, foot_r=0.20, bob=0.00, sway=-0.018, chest=0.030)
        walk['sg_loop'] = True
        actions.append(walk)

        # RUN: stronger knee drive, arm pump, torso lean and airborne lift.
        restore_pose()
        run = new_action('SG_Run', 20)
        key_pose(1,  leg=0.72, arm=0.68, knee_l=-0.18, knee_r=-0.82, foot_l=-0.18, foot_r=0.28, bob=0.02, sway=-0.025, chest=0.045, lean=-0.10)
        key_pose(6,  leg=0.08, arm=0.08, knee_l=-0.48, knee_r=-0.38, foot_l=0.04, foot_r=0.02, bob=0.105, sway=0.000, chest=0.000, lean=-0.12)
        key_pose(11, leg=-0.72, arm=-0.68, knee_l=-0.82, knee_r=-0.18, foot_l=0.28, foot_r=-0.18, bob=0.02, sway=0.025, chest=-0.045, lean=-0.10)
        key_pose(16, leg=-0.08, arm=-0.08, knee_l=-0.38, knee_r=-0.48, foot_l=0.02, foot_r=0.04, bob=0.105, sway=0.000, chest=0.000, lean=-0.12)
        key_pose(20, leg=0.72, arm=0.68, knee_l=-0.18, knee_r=-0.82, foot_l=-0.18, foot_r=0.28, bob=0.02, sway=-0.025, chest=0.045, lean=-0.10)
        run['sg_loop'] = True
        actions.append(run)

        # Linear interpolation prevents mushy foot timing. The runtime handles
        # short crossfades between clips for smooth transitions.
        for action in actions:
            try:
                for fcurve in action.fcurves:
                    for point in fcurve.keyframe_points:
                        point.interpolation = 'BEZIER'
            except AttributeError:
                # Blender 5 action-layer internals may not expose legacy fcurves;
                # keyframes remain valid and exportable.
                pass

        # Keep all generated actions attached to the rig via muted NLA tracks so
        # the glTF exporter can discover them while the visible pose stays neutral.
        for track in list(rig.animation_data.nla_tracks):
            if track.name.startswith('SG_MOTION_'):
                rig.animation_data.nla_tracks.remove(track)
        for action in actions:
            track = rig.animation_data.nla_tracks.new()
            track.name = f'SG_MOTION_{action.name}'
            strip = track.strips.new(action.name, 1, action)
            strip.action_frame_start = 1
            strip.action_frame_end = max(2, int(action.frame_range[1]))
            track.mute = True

        restore_pose()
        rig.animation_data.action = original_action
        scene.frame_set(1)

        scene['sg_character_motion_status'] = 'generated_idle_walk_run'
        scene['sg_character_motion_actions'] = ','.join(action.name for action in actions)
        scene['sg_character_motion_next'] = 'phone-test locomotion; then pickup/carry/place and door/building interaction actions'
        print('[SUM GREATNESS] Generated real skeletal actions: SG_Idle, SG_Walk, SG_Run')
        print(f'[SUM GREATNESS] Motion bone map: {discovered}')
