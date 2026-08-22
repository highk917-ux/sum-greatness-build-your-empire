import bpy
from mathutils import Vector

scene=bpy.context.scene
root=bpy.data.collections.get('SUM_GREATNESS_PRODUCTION')
if root is None:
    root=bpy.data.collections.new('SUM_GREATNESS_PRODUCTION'); scene.collection.children.link(root)

def child(name):
    c=bpy.data.collections.get(name)
    if c is None: c=bpy.data.collections.new(name)
    if c.name not in {x.name for x in root.children}: root.children.link(c)
    return c
city=child('SG_CITY_SAN_DIEGO'); roads=child('SG_ROADS_FREEWAYS'); water=child('SG_WATER_OCEAN_BAY')

# Lightweight anchors only; detailed geometry comes later.
districts={'Downtown San Diego':(0,0),'Gaslamp Quarter':(75,60),'Little Italy':(-80,-135),'Balboa Park':(140,-165),'Mission Valley':(170,-520),'Mission Bay':(-285,-650),'La Jolla':(-310,-1070),'Chula Vista':(190,790),'El Cajon':(900,-120)}
for label,(x,z) in districts.items():
    name='SG_ANCHOR_'+label.upper().replace(' ','_')
    o=bpy.data.objects.get(name)
    if o is None: o=bpy.data.objects.new(name,None); city.objects.link(o)
    o.location=Vector((x,-z,0)); o.empty_display_type='CIRCLE'; o.empty_display_size=10; o['sg_district']=label

for label in ['I-5','I-805','I-8','I-15','SR-163','SR-94','Harbor Drive','El Cajon Boulevard','Friars Road']:
    name='SG_ROUTE_'+label.replace(' ','_').replace('-','_')
    o=bpy.data.objects.get(name)
    if o is None: o=bpy.data.objects.new(name,None); roads.objects.link(o)
    o['sg_route']=label; o['sg_proxy_only']=True

for label in ['Pacific Ocean','San Diego Bay','Mission Bay']:
    name='SG_WATER_'+label.upper().replace(' ','_')
    o=bpy.data.objects.get(name)
    if o is None: o=bpy.data.objects.new(name,None); water.objects.link(o)
    o['sg_water']=label; o['sg_proxy_only']=True

scene['sg_world_status']='layout_anchors_ready'
scene['sg_world_next']='coastline, road curves, sidewalks, alleys, freeway lanes, landmarks, interiors'
print('[SUM GREATNESS] San Diego layout anchors ready')