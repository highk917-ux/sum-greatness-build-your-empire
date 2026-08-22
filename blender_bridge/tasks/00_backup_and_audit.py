import bpy
from pathlib import Path
from datetime import datetime

scene=bpy.context.scene
scene['sg_stage_backup_audit']='ready'
hero=bpy.data.objects.get('Human.rig')
scene['sg_hero_found']=bool(hero)
scene['sg_mesh_count']=sum(1 for o in bpy.data.objects if o.type=='MESH')
scene['sg_armature_count']=sum(1 for o in bpy.data.objects if o.type=='ARMATURE')
scene['sg_accessory_count']=sum(1 for o in bpy.data.objects if o.name.startswith('SUM_'))

# Non-destructive backup when the .blend has a real filepath.
if bpy.data.filepath:
    src=Path(bpy.data.filepath)
    backup_dir=src.parent/'SUM_GREATNESS_BACKUPS'
    backup_dir.mkdir(exist_ok=True)
    stamp=datetime.now().strftime('%Y%m%d_%H%M%S')
    backup=backup_dir/f'{src.stem}_{stamp}.blend'
    bpy.ops.wm.save_as_mainfile(filepath=str(backup), copy=True)
    scene['sg_last_backup']=str(backup)

print('[SUM GREATNESS] Backup/audit complete')