import * as THREE from 'three';

export const SAN_DIEGO_BOUNDS={minX:-620,maxX:1120,minZ:-1720,maxZ:1420};
export const SAN_DIEGO_DISTRICTS=[
 {name:'Downtown San Diego',x:0,z:0,radius:230,density:30,height:[24,72]},
 {name:'Gaslamp Quarter',x:75,z:60,radius:115,density:16,height:[18,48]},
 {name:'Little Italy',x:-80,z:-135,radius:150,density:18,height:[15,42]},
 {name:'Balboa Park',x:140,z:-165,radius:145,density:6,height:[5,13]},
 {name:'North Park',x:225,z:-285,radius:170,density:14,height:[8,24]},
 {name:'San Diego International Airport',x:-240,z:-245,radius:175,density:5,height:[4,10]},
 {name:'Point Loma',x:-455,z:-255,radius:190,density:10,height:[6,18]},
 {name:'Old Town',x:-95,z:-410,radius:165,density:10,height:[6,16]},
 {name:'Mission Valley',x:170,z:-520,radius:220,density:18,height:[8,30]},
 {name:'Mission Bay',x:-285,z:-650,radius:220,density:8,height:[6,18]},
 {name:'La Jolla',x:-310,z:-1070,radius:230,density:15,height:[8,28]},
 {name:'University City',x:-75,z:-1235,radius:210,density:18,height:[12,40]},
 {name:'Del Mar',x:-160,z:-1540,radius:190,density:10,height:[7,22]},
 {name:'National City',x:120,z:430,radius:190,density:14,height:[7,25]},
 {name:'Chula Vista',x:190,z:790,radius:250,density:20,height:[7,30]},
 {name:'Otay Mesa',x:330,z:1220,radius:230,density:14,height:[7,24]},
 {name:'La Mesa',x:590,z:-10,radius:200,density:14,height:[7,24]},
 {name:'El Cajon',x:900,z:-120,radius:245,density:20,height:[7,30]}
];
export const SAN_DIEGO_FREEWAYS=[
 {name:'I-5',width:24,points:[[-85,1120],[-70,650],[-60,250],[-65,-80],[-115,-410],[-175,-760],[-160,-1160],[-120,-1620]]},
 {name:'I-805',width:22,points:[[270,1100],[255,720],[245,350],[250,0],[255,-420],[230,-820],[190,-1320]]},
 {name:'I-8',width:24,points:[[-470,-500],[-220,-495],[40,-485],[340,-470],[650,-455],[980,-430]]},
 {name:'SR-163',width:19,points:[[35,-60],[65,-190],[80,-330],[65,-470]]},
 {name:'SR-94',width:20,points:[[-55,145],[180,135],[430,120],[690,100],[940,80]]},
 {name:'I-15',width:21,points:[[480,980],[465,620],[470,260],[485,-120],[470,-520],[430,-920]]}
];
export const SAN_DIEGO_WATER_AREAS=[
 {name:'Pacific Ocean',points:[[-650,-1720],[-175,-1720],[-165,-1540],[-235,-1320],[-310,-1080],[-300,-860],[-365,-690],[-465,-545],[-525,-310],[-505,-80],[-485,250],[-445,620],[-390,980],[-345,1420],[-650,1420]]},
 {name:'Mission Bay',points:[[-455,-820],[-350,-865],[-235,-835],[-175,-745],[-185,-590],[-255,-515],[-365,-525],[-445,-610]],bridges:[{a:[-470,-650],b:[-130,-650],width:16}]},
 {name:'San Diego Bay',points:[[-485,-210],[-355,-245],[-230,-205],[-145,-115],[-115,65],[-145,255],[-225,455],[-330,620],[-435,590],[-470,390],[-470,120]],holes:[[[-425,-70],[-335,-90],[-305,70],[-320,300],[-350,515],[-420,500],[-445,280],[-440,70]]],bridges:[{a:[-410,118],b:[-60,146],width:18}]}
];
function pointInPolygon(x,z,points){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const [xi,zi]=points[i],[xj,zj]=points[j],cross=(zi>z)!==(zj>z)&&x<(xj-xi)*(z-zi)/(zj-zi)+xi;if(cross)inside=!inside}return inside}
function waterContains(area,x,z,radius=0){const samples=radius?[[x,z],[x+radius,z],[x-radius,z],[x,z+radius],[x,z-radius]]:[[x,z]];return samples.some(([sx,sz])=>pointInPolygon(sx,sz,area.points)&&!(area.holes||[]).some(hole=>pointInPolygon(sx,sz,hole))&&!(area.bridges||[]).some(bridge=>distanceToSegment(sx,sz,bridge.a,bridge.b)<=bridge.width/2))}
function addWaterArea(scene,material,area){const shape=new THREE.Shape();area.points.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();for(const holePoints of area.holes||[]){const hole=new THREE.Path();holePoints.forEach(([x,z],i)=>i?hole.lineTo(x,-z):hole.moveTo(x,-z));hole.closePath();shape.holes.push(hole)}const mesh=new THREE.Mesh(new THREE.ShapeGeometry(shape),material);mesh.rotation.x=-Math.PI/2;mesh.position.y=.035;mesh.receiveShadow=true;scene.add(mesh)}
function roadSegment(scene,material,a,b,width,y=.04){const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,length),material);mesh.rotation.x=-Math.PI/2;mesh.rotation.z=-Math.atan2(dz,dx)+Math.PI/2;mesh.position.set((a[0]+b[0])/2,y,(a[1]+b[1])/2);scene.add(mesh)}
function seeded(seed){let value=seed>>>0;return()=>{value=(value*1664525+1013904223)>>>0;return value/4294967296}}
function distanceToSegment(x,z,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],lengthSq=dx*dx+dz*dz;if(!lengthSq)return Math.hypot(x-a[0],z-a[1]);const t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/lengthSq));return Math.hypot(x-(a[0]+t*dx),z-(a[1]+t*dz))}
function offsetSegment(a,b,offset){const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz)||1,nx=-dz/length,nz=dx/length;return [[a[0]+nx*offset,a[1]+nz*offset],[b[0]+nx*offset,b[1]+nz*offset]]}
function addStreet(scene,roadMat,sidewalkMat,a,b,width=10,{sidewalks=true}={}){roadSegment(scene,roadMat,a,b,width,.06);if(!sidewalks)return;const sidewalkWidth=3,offset=width/2+sidewalkWidth/2;for(const side of [-1,1]){const [sa,sb]=offsetSegment(a,b,offset*side);roadSegment(scene,sidewalkMat,sa,sb,sidewalkWidth,.075)}}
function clearsRoads(x,z,radius,roads,buffer=2){return roads.every(({a,b,width})=>distanceToSegment(x,z,a,b)>width/2+radius+buffer)}
function labelSprite(text,color='#e7b84f',scale=22){const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');canvas.width=512;canvas.height=96;ctx.fillStyle='rgba(7,9,12,.82)';ctx.roundRect(4,4,504,88,18);ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=5;ctx.stroke();ctx.fillStyle='#fff';ctx.font='bold 36px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,49);const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(canvas),depthTest:false}));sprite.scale.set(scale*4,scale*.75,1);return sprite}
function addLandmark(scene,colliders,{name,x,z,w,d,h,color=0x9a895f,labelHeight=h+12}){const material=new THREE.MeshStandardMaterial({color,roughness:.65}),building=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);building.position.set(x,h/2,z);scene.add(building);colliders.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2});const label=labelSprite(name);label.position.set(x,labelHeight,z);scene.add(label)}
export function buildSanDiegoMap(scene,{mobileDevice=false}={}){
 const colliders=[],rng=seeded(917),landMat=new THREE.MeshStandardMaterial({color:0x52694a,roughness:1}),waterMat=new THREE.MeshStandardMaterial({color:0x17658b,roughness:.38}),roadMat=new THREE.MeshStandardMaterial({color:0x282b30,roughness:.9}),freewayMat=new THREE.MeshStandardMaterial({color:0x343940,roughness:.82}),sidewalkMat=new THREE.MeshStandardMaterial({color:0x99978f,roughness:1}),alleyMat=new THREE.MeshStandardMaterial({color:0x3c3d3e,roughness:1}),lineMat=new THREE.MeshBasicMaterial({color:0xd5a840});
 const land=new THREE.Mesh(new THREE.PlaneGeometry(1800,3200),landMat);land.rotation.x=-Math.PI/2;land.position.set(250,0,-150);scene.add(land);
 const ocean=new THREE.Mesh(new THREE.PlaneGeometry(900,3400),waterMat);ocean.rotation.x=-Math.PI/2;ocean.position.set(-980,-.02,-150);scene.add(ocean);
 for(const area of SAN_DIEGO_WATER_AREAS){addWaterArea(scene,waterMat,area);colliders.push({type:'water',name:area.name,contains:(x,z,radius=0)=>waterContains(area,x,z,radius)})}
 const coronadoShape=new THREE.Shape();[[-425,-70],[-335,-90],[-305,70],[-320,300],[-350,515],[-420,500],[-445,280],[-440,70]].forEach(([x,z],i)=>i?coronadoShape.lineTo(x,-z):coronadoShape.moveTo(x,-z));coronadoShape.closePath();const coronado=new THREE.Mesh(new THREE.ShapeGeometry(coronadoShape),landMat);coronado.rotation.x=-Math.PI/2;coronado.position.y=.045;scene.add(coronado);
 for(const freeway of SAN_DIEGO_FREEWAYS){for(let i=1;i<freeway.points.length;i++){const a=freeway.points[i-1],b=freeway.points[i];roadSegment(scene,freewayMat,a,b,freeway.width);roadSegment(scene,lineMat,a,b,.7,.055)}const middle=freeway.points[Math.floor(freeway.points.length/2)],sign=labelSprite(freeway.name,'#62a5ff',11);sign.position.set(middle[0],13,middle[1]);scene.add(sign)}
 const roadCorridors=[];
 function registerRoad(a,b,width,material=roadMat,sidewalks=true){roadCorridors.push({a,b,width});if(sidewalks)addStreet(scene,material,sidewalkMat,a,b,width);else roadSegment(scene,material,a,b,width,.06)}
 for(const freeway of SAN_DIEGO_FREEWAYS){for(let i=1;i<freeway.points.length;i++)roadCorridors.push({a:freeway.points[i-1],b:freeway.points[i],width:freeway.width})}
 registerRoad([-390,120],[-65,145],12);
 const surfaceRoads=[[[-430,-260],[930,-110]],[[-300,-650],[600,-650]],[[-300,-1070],[300,-1070]],[[-150,790],[500,790]],[[-120,0],[340,0]],[[0,-190],[0,320]],[[190,430],[190,980]]];
 for(const [a,b] of surfaceRoads)registerRoad(a,b,12);
 // Each district receives a recognizable street grid: two main streets with sidewalks
 // plus two narrow service alleys behind the building rows.
 for(const district of SAN_DIEGO_DISTRICTS){
   const span=Math.max(80,district.radius*.72),alleyOffset=Math.max(32,district.radius*.28);
   registerRoad([district.x-span,district.z],[district.x+span,district.z],10);
   registerRoad([district.x,district.z-span],[district.x,district.z+span],10);
   registerRoad([district.x-span,district.z-alleyOffset],[district.x+span,district.z-alleyOffset],5,alleyMat,false);
   registerRoad([district.x+alleyOffset,district.z-span],[district.x+alleyOffset,district.z+span],5,alleyMat,false);
 }
 const colors=[0x65584a,0x344c5e,0x705348,0x505b63,0x8a806c],materials=colors.map(color=>new THREE.MeshStandardMaterial({color,roughness:.74})),unitBox=new THREE.BoxGeometry(1,1,1);
 for(const district of SAN_DIEGO_DISTRICTS){
   const targetCount=mobileDevice?Math.max(5,Math.round(district.density*.48)):district.density;
   let placed=0,attempts=0;
   while(placed<targetCount&&attempts<targetCount*18){
     attempts++;
     const angle=rng()*Math.PI*2,distance=35+rng()*(district.radius-45);
     const x=district.x+Math.cos(angle)*distance,z=district.z+Math.sin(angle)*distance;
     const width=10+rng()*15,depth=10+rng()*15,radius=Math.hypot(width,depth)/2;
     if(!clearsRoads(x,z,radius,roadCorridors,4))continue;
     if(colliders.some(c=>c.contains?.(x,z,radius)))continue;if(colliders.some(c=>c.minX!==undefined&&x+width/2+3>c.minX&&x-width/2-3<c.maxX&&z+depth/2+3>c.minZ&&z-depth/2-3<c.maxZ))continue;
     const height=district.height[0]+rng()*(district.height[1]-district.height[0]),building=new THREE.Mesh(unitBox,materials[Math.floor(rng()*materials.length)]);
     building.scale.set(width,height,depth);building.position.set(x,height/2,z);building.castShadow=!mobileDevice;scene.add(building);
     colliders.push({minX:x-width/2,maxX:x+width/2,minZ:z-depth/2,maxZ:z+depth/2});placed++;
   }
 }
 // Recognizable destination silhouettes placed in their real general parts of the region.
 addLandmark(scene,colliders,{name:'PETCO PARK',x:105,z:155,w:72,d:58,h:18,color:0x607949});
 addLandmark(scene,colliders,{name:'CONVENTION CENTER',x:-20,z:115,w:95,d:22,h:16,color:0xaeb4b8});
 addLandmark(scene,colliders,{name:'BALBOA PARK',x:135,z:-175,w:22,d:22,h:48,color:0xc6a469});
 addLandmark(scene,colliders,{name:'SNAPDRAGON STADIUM',x:235,z:-545,w:92,d:72,h:15,color:0x847d72});
 addLandmark(scene,colliders,{name:'HOTEL DEL CORONADO',x:-390,z:430,w:58,d:42,h:24,color:0xefe3cf});
 addLandmark(scene,colliders,{name:'UC SAN DIEGO',x:-70,z:-1250,w:62,d:48,h:30,color:0x7891a5});
 const runway=new THREE.Mesh(new THREE.PlaneGeometry(42,360),freewayMat);runway.rotation.x=-Math.PI/2;runway.rotation.z=-1.33;runway.position.set(-245,.07,-250);scene.add(runway);const airportLabel=labelSprite('SAN DIEGO INTERNATIONAL AIRPORT','#62a5ff',17);airportLabel.position.set(-245,22,-250);scene.add(airportLabel);
 for(const district of SAN_DIEGO_DISTRICTS){const label=labelSprite(district.name,'#e7b84f',district.name.length>20?14:17);label.position.set(district.x,34,district.z);scene.add(label)}
 return {colliders};
}
export function districtAt(x,z,current='Downtown San Diego'){let nearest=null,best=Infinity;for(const district of SAN_DIEGO_DISTRICTS){const distance=Math.hypot(x-district.x,z-district.z);if(distance<district.radius&&distance<best){nearest=district;best=distance}}return nearest?.name||current}
