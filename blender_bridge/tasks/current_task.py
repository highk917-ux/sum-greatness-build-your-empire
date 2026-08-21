"""SUM GREATNESS overnight preparation batch.

Runs only non-destructive preparation stages. Existing character geometry,
clothing, shoes, accessories and rig are preserved.
"""
from pathlib import Path
import runpy
import bpy

BASE=Path(__file__).resolve().parent
STAGES=[
    '00_backup_and_audit.py',
    '10_character_prepare.py',
    '20_san_diego_layout.py',
    '30_export_readiness.py',
]

scene=bpy.context.scene
scene['sum_greatness_github_bridge']='connected'
scene['sg_visual_target']='approved photo concept / realistic 3D'
scene['sg_character_rule']='preserve Human.rig and SUM_ assets; low clean haircut; approved outfit, jewelry and branding'
scene['sg_world_rule']='San Diego County inspired open world: roads, freeways, sidewalks, alleys, ocean, bay, landmarks and interiors'

print('[SUM GREATNESS] Starting overnight preparation batch')
for stage in STAGES:
    path=BASE/stage
    print(f'[SUM GREATNESS] Running {stage}')
    runpy.run_path(str(path),run_name='__main__')

scene['sg_batch_status']='complete'
scene['sg_batch_next']='character fidelity art pass, detailed roads/coastline, landmarks, animation and GLB export'
print('[SUM GREATNESS] Overnight preparation batch complete')