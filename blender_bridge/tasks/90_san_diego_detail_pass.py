"""SUM GREATNESS San Diego environment detail pass.

Adds visible second-pass city detail while preserving all user character assets.
Idempotent: only objects with SG_DETAIL_ prefix are rebuilt.
"""
import bpy
import math

scene=bpy.context.scene
root=bpy.data.collections.get('SUM_GREATNESS_PRODUCTION')
if root is None:
    root=bpy.data.collections.new('SUM_GREATNESS_PRODUCTION')
    scene.collection.children.link(root)

def child(name):
    col=bpy.data.collections.get(name)
    if col is None:
        col=bpy.data.collections.new(name)
    if col.name not in {c.name for c in root.children}:
        root.children.link(col)
    return col

roads=child('SG_ROADS_FREEWAYS')
sidewalks=child('SG_SIDEWALKS_ALLEYS')
water=child('SG_WATER_OCEAN_BAY')
landmarks=child('SG_LANDMARKS')
lighting=child('SG_LIGHTING_DAY_NIGHT')

for obj in list(bpy.data.objects):
    if obj.name.startswith('SG_DETAIL_'):
        bpy.data.objects.remove(obj, do_unlink=True)

def mat(name, rgba, metallic=0.0, roughness=0.6):
    m=bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.diffuse_color=rgba
    m.metallic=metallic
    m.roughness=roughness
    return m

asphalt=mat('SG_DETAIL_MAT_ASPHALT',(0.025,0.028,0.032,1),0,0.85)
white=mat('SG_DETAIL_MAT_WHITE',(0.92,0.92,0.88,1),0,0.5)
yellow=mat('SG_DETAIL_MAT_YELLOW',(0.95,0.63,0.08,1),0,0.55)
concrete=mat('SG_DETAIL_MAT_CONCRETE',(0.38,0.39,0.40,1),0,0.9)
sand=mat('SG_DETAIL_MAT_SAND',(0.70,0.58,0.38,1),0,0.95)
palm=mat('SG_DETAIL_MAT_PALM',(0.08,0.26,0.08,1),0,0.85)
trunk=mat('SG_DETAIL_MAT_TRUNK',(0.27,0.15,0.07,1),0,0.9)
metal=mat('SG_DETAIL_MAT_METAL',(0.10,0.11,0.12,1),0.65,0.3)

# Helpers

def cube(name, loc, scale, material, collection):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    o=bpy.context.object
    o.name=name
    o.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if material: o.data.materials.append(material)
    for c in list(o.users_collection): c.objects.unlink(o)
    collection.objects.link(o)
    return o

def cyl(name, loc, radius, depth, material, collection):
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=radius, depth=depth, location=loc)
    o=bpy.context.object
    o.name=name
    if material: o.data.materials.append(material)
    for c in list(o.users_collection): c.objects.unlink(o)
    collection.objects.link(o)
    return o

# Downtown street grid and lane markings.
for idx,x in enumerate(range(-260,301,80)):
    cube(f'SG_DETAIL_DT_NS_ROAD_{idx}',(x,40,0.15),(16,320,0.15),asphalt,roads)
    cube(f'SG_DETAIL_DT_NS_CENTER_{idx}',(x,40,0.34),(0.45,320,0.04),yellow,roads)
for idx,y in enumerate(range(-240,321,80)):
    cube(f'SG_DETAIL_DT_EW_ROAD_{idx}',(20,y,0.16),(320,16,0.15),asphalt,roads)
    cube(f'SG_DETAIL_DT_EW_CENTER_{idx}',(20,y,0.35),(320,0.45,0.04),yellow,roads)

# Crosswalk bars at selected central intersections.
for ix,x in enumerate((-80,0,80,160)):
    for iy,y in enumerate((-80,0,80,160)):
        for b in range(5):
            cube(f'SG_DETAIL_CROSSWALK_{ix}_{iy}_{b}',(x-7+b*3.5,y-18,0.37),(1.1,5.5,0.035),white,roads)

# Sidewalk ribbons around the downtown core.
for x in (-285,325):
    cube(f'SG_DETAIL_SIDEWALK_X_{x}',(x,40,0.25),(8,330,0.25),concrete,sidewalks)
for y in (-275,355):
    cube(f'SG_DETAIL_SIDEWALK_Y_{y}',(20,y,0.25),(330,8,0.25),concrete,sidewalks)

# Beach strip along the Pacific proxy edge.
cube('SG_DETAIL_COAST_BEACH',(-850,650,-0.3),(80,1850,1.2),sand,water)

# Palm clusters along coast and downtown approaches.
palm_points=[(-760,200),(-760,420),(-760,650),(-760,880),(-760,1120),(-420,180),(-300,90),(-180,40),(300,340),(260,500)]
for i,(x,y) in enumerate(palm_points):
    cyl(f'SG_DETAIL_PALM_TRUNK_{i}',(x,y,7.5),1.3,15,trunk,landmarks)
    for j,a in enumerate((0,math.pi/2,math.pi,3*math.pi/2)):
        leaf=cube(f'SG_DETAIL_PALM_LEAF_{i}_{j}',(x+math.cos(a)*4.2,y+math.sin(a)*4.2,15.4),(4.8,0.75,0.28),palm,landmarks)
        leaf.rotation_euler[2]=a

# Streetlights around downtown perimeter.
light_points=[]
for x in range(-240,281,80):
    light_points.append((x,-255)); light_points.append((x,335))
for y in range(-200,281,80):
    light_points.append((-265,y)); light_points.append((305,y))
for i,(x,y) in enumerate(light_points):
    pole=cyl(f'SG_DETAIL_STREETLIGHT_POLE_{i}',(x,y,6),0.45,12,metal,lighting)
    bpy.ops.object.light_add(type='POINT',location=(x,y,12.5))
    l=bpy.context.object
    l.name=f'SG_DETAIL_STREETLIGHT_{i}'
    l.data.energy=250
    l.data.color=(1.0,0.72,0.42)
    l.data.shadow_soft_size=2.5
    for c in list(l.users_collection): c.objects.unlink(l)
    lighting.objects.link(l)

# Low-detail freeway barriers for visual scale.
barrier_specs=[('I5_W',(-210,500,1.3),(3,720,1.3)),('I5_E',(-165,500,1.3),(3,720,1.3)),('I8_N',(360,770,1.3),(700,3,1.3)),('I8_S',(360,735,1.3),(700,3,1.3))]
for label,loc,scale in barrier_specs:
    o=cube('SG_DETAIL_BARRIER_'+label,loc,scale,concrete,roads)
    o['sg_collision_target']='road_barrier'

scene['sg_world_detail_status']='second_pass_generated'
scene['sg_world_detail_note']='Added downtown grid, lane markings, crosswalks, sidewalks, beach strip, palms, streetlights and freeway barriers. Final reference-matched architecture remains later art pass.'
print('[SUM GREATNESS] San Diego environment detail pass complete.')
