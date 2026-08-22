"""SUM GREATNESS visible San Diego-inspired world geometry.

Idempotent and non-destructive to user character assets. Rebuilds only objects
with the SG_GEN_ prefix inside production collections.
"""
import bpy
import math
import random
from mathutils import Vector

scene = bpy.context.scene
random.seed(917)

root = bpy.data.collections.get('SUM_GREATNESS_PRODUCTION')
if root is None:
    root = bpy.data.collections.new('SUM_GREATNESS_PRODUCTION')
    scene.collection.children.link(root)

def child(name):
    col = bpy.data.collections.get(name)
    if col is None:
        col = bpy.data.collections.new(name)
    if col.name not in {c.name for c in root.children}:
        root.children.link(col)
    return col

city = child('SG_CITY_SAN_DIEGO')
roads = child('SG_ROADS_FREEWAYS')
sidewalks = child('SG_SIDEWALKS_ALLEYS')
water = child('SG_WATER_OCEAN_BAY')
landmarks = child('SG_LANDMARKS')

# Remove only previously generated proxy geometry.
for obj in list(bpy.data.objects):
    if obj.name.startswith('SG_GEN_'):
        bpy.data.objects.remove(obj, do_unlink=True)

def mat(name, rgba, metallic=0.0, roughness=0.6):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.diffuse_color = rgba
    m.metallic = metallic
    m.roughness = roughness
    return m

road_mat = mat('SG_MAT_ASPHALT', (0.035,0.04,0.045,1), 0.0, 0.8)
sidewalk_mat = mat('SG_MAT_CONCRETE', (0.32,0.34,0.35,1), 0.0, 0.9)
water_mat = mat('SG_MAT_WATER', (0.025,0.18,0.32,0.72), 0.15, 0.2)
building_mats = [
    mat('SG_MAT_BUILDING_DARK', (0.08,0.09,0.11,1), 0.15, 0.45),
    mat('SG_MAT_BUILDING_GLASS', (0.09,0.18,0.25,1), 0.35, 0.18),
    mat('SG_MAT_BUILDING_WARM', (0.26,0.20,0.15,1), 0.05, 0.6),
]
landmark_mat = mat('SG_MAT_LANDMARK', (0.42,0.32,0.12,1), 0.45, 0.3)

def cube(name, loc, scale, material, collection):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if material: o.data.materials.append(material)
    # Move from active collection to target collection.
    for c in list(o.users_collection): c.objects.unlink(o)
    collection.objects.link(o)
    return o

def road_curve(name, points, width, material):
    curve = bpy.data.curves.new(name + '_CURVE', 'CURVE')
    curve.dimensions = '3D'
    curve.bevel_depth = width/2
    curve.bevel_resolution = 1
    spline = curve.splines.new('POLY')
    spline.points.add(len(points)-1)
    for p, co in zip(spline.points, points):
        p.co = (co[0], co[1], co[2], 1)
    obj = bpy.data.objects.new(name, curve)
    roads.objects.link(obj)
    curve.materials.append(material)
    obj['sg_drive_surface'] = True
    obj['sg_collision_target'] = 'road'
    return obj

# World coordinates are deliberately large enough to feel city-scale in Blender.
districts = {
    'Downtown': (0, 0),
    'Gaslamp': (120, 90),
    'Little_Italy': (-180, 170),
    'Balboa_Park': (260, 260),
    'Mission_Valley': (180, 760),
    'Mission_Bay': (-520, 900),
    'La_Jolla': (-700, 1500),
    'Chula_Vista': (300, -900),
    'El_Cajon': (1350, 180),
}

# Roads/freeways connecting broad districts.
routes = [
    ('I5', [(-760,1700,0),( -420,1050,0),(-180,400,0),(0,0,0),(220,-950,0)], 28),
    ('I805', [(260,1250,0),(320,650,0),(360,100,0),(420,-900,0)], 24),
    ('I8', [(-600,760,0),(0,760,0),(700,520,0),(1400,180,0)], 24),
    ('I15', [(420,-850,0),(430,0,0),(520,760,0),(700,1450,0)], 24),
    ('SR163', [(70,80,0),(160,300,0),(190,720,0)], 18),
    ('SR94', [(-20,-140,0),(520,-120,0),(1100,20,0)], 18),
    ('Harbor_Drive', [(-420,380,0),(-220,100,0),(-60,-260,0)], 15),
    ('El_Cajon_Blvd', [(0,260,0),(520,260,0),(1350,180,0)], 14),
]
for label, pts, width in routes:
    road_curve('SG_GEN_ROUTE_'+label, pts, width, road_mat)

# Sidewalk/ground pads and building clusters by district.
for dname, (cx, cy) in districts.items():
    pad = cube('SG_GEN_PAD_'+dname, (cx,cy,-1.5), (170,150,1.5), sidewalk_mat, sidewalks)
    pad['sg_district'] = dname
    count = 12 if dname in {'Downtown','Gaslamp'} else 7
    for i in range(count):
        angle = (i/max(1,count))*math.tau
        radius = 55 + (i%4)*28
        x = cx + math.cos(angle)*radius + random.uniform(-18,18)
        y = cy + math.sin(angle)*radius + random.uniform(-18,18)
        sx = random.uniform(9,20)
        sy = random.uniform(9,22)
        h = random.uniform(18,65)
        if dname == 'Downtown': h *= 2.0
        elif dname == 'Gaslamp': h *= 0.8
        o = cube(f'SG_GEN_BLD_{dname}_{i:02d}', (x,y,h/2), (sx,sy,h/2), random.choice(building_mats), city)
        o['sg_district'] = dname
        o['sg_enterable_pipeline'] = (i % 5 == 0)
        o['sg_collision_target'] = 'building'

# Water bodies: broad visible proxies, placed west/south of the city.
ocean = cube('SG_GEN_PACIFIC_OCEAN', (-1550,600,-5), (720,2200,4), water_mat, water)
bay = cube('SG_GEN_SAN_DIEGO_BAY', (-480,-380,-3), (260,620,2.5), water_mat, water)
mission_bay = cube('SG_GEN_MISSION_BAY', (-620,900,-3), (250,260,2.5), water_mat, water)
for o,label in [(ocean,'Pacific Ocean'),(bay,'San Diego Bay'),(mission_bay,'Mission Bay')]:
    o['sg_water'] = label
    o['sg_no_drive'] = True

# Stylized landmark massing — not claiming exact architecture; later pass replaces with reference-matched models.
landmark_specs = [
    ('Downtown_Tower',(20,20,145),(24,24,145)),
    ('Convention_Center',(-160,-110,28),(85,35,28)),
    ('Balboa_Landmark',(260,260,38),(28,28,38)),
    ('Coronado_Bridge_Anchor',(-260,-520,18),(120,12,8)),
]
for label,loc,scale in landmark_specs:
    o=cube('SG_GEN_LANDMARK_'+label,loc,scale,landmark_mat,landmarks)
    o['sg_reference_replacement_required']=True

scene['sg_world_geometry_status']='visible_proxies_generated'
scene['sg_generated_world_note']='City-scale procedural proxy geometry; reference-matched landmarks/coastline remain later art pass.'
print('[SUM GREATNESS] Visible San Diego-inspired world proxy geometry generated.')
