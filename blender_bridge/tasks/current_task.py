"""SUM GREATNESS unattended production development batch.

Runs protected character preparation plus visible San Diego-inspired world,
lighting, gameplay/export preparation, detail, validation and save. Existing
Human.rig and SUM_ character assets are preserved; exact face/body likeness
remains reference-guided and is not guessed procedurally.
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
    '40_character_fidelity_prepare.py',
    '50_world_geometry.py',
    '60_lighting_daynight.py',
    '70_gameplay_export_prep.py',
    '75_interaction_spawn_infrastructure.py',
    '90_san_diego_detail_pass.py',
    '80_validate_and_save.py',
]

scene=bpy.context.scene
scene['sum_greatness_github_bridge']='connected'
scene['sg_visual_target']='approved photo concept / realistic 3D'
scene['sg_character_rule']='preserve Human.rig and SUM_ assets; low clean haircut; approved outfit, jewelry and branding; do not guess face likeness'
scene['sg_world_rule']='San Diego County inspired open world with city-scale roads/freeways, sidewalks, ocean/bay, districts, landmarks and enterable-building pipeline'
scene['sg_batch_status']='running'

print('[SUM GREATNESS] Starting unattended production batch')
for stage in STAGES:
    path=BASE/stage
    if not path.exists():
        raise FileNotFoundError(f'Missing production stage: {path}')
    print(f'[SUM GREATNESS] Running {stage}')
    runpy.run_path(str(path),run_name='__main__')

scene['sg_batch_status']='complete'
scene['sg_batch_next']='reference-matched hero likeness; final landmark/coastline art; modeled interiors; vehicle/NPC art and animation; 75+ mission content; chunked GLB export; mobile integration/testing'
print('[SUM GREATNESS] Unattended production batch complete')
