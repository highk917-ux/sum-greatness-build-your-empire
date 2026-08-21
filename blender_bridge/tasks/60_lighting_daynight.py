"""SUM GREATNESS day/night lighting preparation."""
import bpy
import math

scene=bpy.context.scene
root=bpy.data.collections.get('SUM_GREATNESS_PRODUCTION')
if root is None:
    root=bpy.data.collections.new('SUM_GREATNESS_PRODUCTION'); scene.collection.children.link(root)
lighting=bpy.data.collections.get('SG_LIGHTING_DAY_NIGHT')
if lighting is None:
    lighting=bpy.data.collections.new('SG_LIGHTING_DAY_NIGHT'); root.children.link(lighting)

for obj in list(bpy.data.objects):
    if obj.name.startswith('SG_GEN_LIGHT_'):
        bpy.data.objects.remove(obj, do_unlink=True)

world=scene.world or bpy.data.worlds.new('SUM_GREATNESS_WORLD')
scene.world=world
# Blender 5.x deprecates World.use_nodes. Accessing node_tree initializes/uses
# the world shader graph without touching the deprecated property.
node_tree=world.node_tree
bg=node_tree.nodes.get('Background') if node_tree else None
if bg:
    bg.inputs['Color'].default_value=(0.035,0.055,0.095,1)
    bg.inputs['Strength'].default_value=0.35
else:
    world.color=(0.035,0.055,0.095)

# Main sun
ldata=bpy.data.lights.new('SG_GEN_LIGHT_SUN_DATA','SUN')
ldata.energy=3.0
ldata.angle=math.radians(4.0)
sun=bpy.data.objects.new('SG_GEN_LIGHT_SUN',ldata)
lighting.objects.link(sun)
sun.rotation_euler=(math.radians(32),math.radians(-18),math.radians(-28))
sun['sg_day_night_driver']='sun_angle'

# Soft city fill lights
for idx,(loc,energy,size) in enumerate([
    ((0,0,420),1400,350),
    ((300,-300,260),850,220),
    ((-400,650,260),850,250),
]):
    ld=bpy.data.lights.new(f'SG_GEN_LIGHT_AREA_{idx}_DATA','AREA')
    ld.energy=energy; ld.shape='DISK'; ld.size=size
    o=bpy.data.objects.new(f'SG_GEN_LIGHT_AREA_{idx}',ld)
    lighting.objects.link(o); o.location=loc; o.rotation_euler=(0,0,0)

scene['sg_day_night_status']='prepared'
scene['sg_day_night_targets']='sunrise, day, sunset, night; emissive city windows later'
scene['sg_mobile_lighting_rule']='prefer baked/probe-friendly lighting; limit real-time shadow casters for Android'
print('[SUM GREATNESS] Day/night lighting preparation complete.')
