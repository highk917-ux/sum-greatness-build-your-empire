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
export const SAN_DIEGO_SURFACE_ROADS=[
 {name:'Harbor Drive',width:12,points:[[-390,120],[-65,145],[85,170]]},
 {name:'El Cajon Boulevard',width:12,points:[[-430,-260],[120,-220],[560,-165],[930,-110]]},
 {name:'Friars Road',width:12,points:[[-300,-650],[80,-630],[600,-650]]},
 {name:'La Jolla Village Drive',width:12,points:[[-300,-1070],[30,-1080],[300,-1070]]},
 {name:'H Street',width:12,points:[[-150,790],[190,790],[500,790]]},
 {name:'Broadway',width:12,points:[[-120,0],[110,0],[340,0]]},
 {name:'5th Avenue',width:12,points:[[0,-190],[0,80],[0,320]]},
 {name:'Highland Avenue',width:12,points:[[190,430],[190,700],[190,980]]},
 {name:'University Avenue',width:11,points:[[70,-315],[250,-300],[620,-265]]},
 {name:'Mission Boulevard',width:10,points:[[-360,-505],[-355,-720],[-330,-960],[-305,-1160]]},
 {name:'Garnet Avenue',width:10,points:[[-350,-790],[-160,-790],[35,-780]]},
];
const DOWNTOWN_STREETS=[
 ...[-105,-70,-35,35,70,105].map(x=>({width:8,points:[[x,-155],[x,230]]})),
 ...[-120,-80,-40,40,80,120,160,200].map(z=>({width:8,points:[[-145,z],[165,z]]})),
];
const NEIGHBORHOOD_STREETS=[
 ...[-365,-325,-285].map(x=>({width:7,points:[[x,-1210],[x,-620]]})),
 ...[-1120,-1010,-900,-690].map(z=>({width:7,points:[[-430,z],[30,z]]})),
 ...[130,250,370].map(x=>({width:7,points:[[x,610],[x,970]]})),
 ...[675,875].map(z=>({width:7,points:[[70,z],[490,z]]})),
 ...[790,875,960].map(x=>({width:7,points:[[x,-310],[x,80]]})),
];
function roadSegment(scene,material,a,b,width,y=.04){const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,length),material);mesh.rotation.x=-Math.PI/2;mesh.rotation.z=-Math.atan2(dz,dx)+Math.PI/2;mesh.position.set((a[0]+b[0])/2,y,(a[1]+b[1])/2);scene.add(mesh)}
function distanceToSegment(x,z,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],lengthSq=dx*dx+dz*dz,t=lengthSq?Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/lengthSq)):0;return Math.hypot(x-(a[0]+t*dx),z-(a[1]+t*dz))}
function roadClearance(x,z,radius,roads){return roads.every(road=>{for(let i=1;i<road.points.length;i++)if(distanceToSegment(x,z,road.points[i-1],road.points[i])<road.width/2+radius)return false;return true})}
function parallelSegment(a,b,offset){const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz)||1,nx=-dz/length,nz=dx/length;return [[a[0]+nx*offset,a[1]+nz*offset],[b[0]+nx*offset,b[1]+nz*offset]]}
function seeded(seed){let value=seed>>>0;return()=>{value=(value*1664525+1013904223)>>>0;return value/4294967296}}
function labelSprite(text,color='#e7b84f',scale=22){const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');canvas.width=512;canvas.height=96;ctx.fillStyle='rgba(7,9,12,.82)';ctx.roundRect(4,4,504,88,18);ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=5;ctx.stroke();ctx.fillStyle='#fff';ctx.font='bold 36px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,49);const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(canvas),depthTest:false}));sprite.scale.set(scale*4,scale*.75,1);return sprite}
function nearestClearLandmarkPosition(x,z,w,d,roads){
 const clearance=Math.hypot(w,d)/2+4;
 if(roadClearance(x,z,clearance,roads))return {x,z};
 // Preserve the landmark's general geographic location while guaranteeing that
 // its complete footprint (plus a pedestrian buffer) stays outside roadways.
 for(let radius=18;radius<=120;radius+=12)for(let step=0;step<16;step++){
  const angle=step/16*Math.PI*2,candidateX=x+Math.cos(angle)*radius,candidateZ=z+Math.sin(angle)*radius;
  if(roadClearance(candidateX,candidateZ,clearance,roads))return {x:candidateX,z:candidateZ};
 }
 return {x,z};
}
function addLandmark(scene,colliders,roads,{name,x,z,w,d,h,color=0x9a895f,labelHeight=h+12}){const position=nearestClearLandmarkPosition(x,z,w,d,roads),material=new THREE.MeshStandardMaterial({color,roughness:.65}),building=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);building.position.set(position.x,h/2,position.z);scene.add(building);colliders.push({minX:position.x-w/2,maxX:position.x+w/2,minZ:position.z-d/2,maxZ:position.z+d/2});const label=labelSprite(name);label.position.set(position.x,labelHeight,position.z);scene.add(label)}
function addPalm(scene,x,z,scale=1){const trunkMat=new THREE.MeshStandardMaterial({color:0x7b5735,roughness:1}),leafMat=new THREE.MeshStandardMaterial({color:0x245a35,roughness:.9}),group=new THREE.Group(),trunk=new THREE.Mesh(new THREE.CylinderGeometry(.22,.34,5.8,7),trunkMat);trunk.position.y=2.9;group.add(trunk);for(let i=0;i<7;i++){const leaf=new THREE.Mesh(new THREE.ConeGeometry(.28,3.8,5),leafMat);leaf.position.y=5.9;leaf.rotation.z=Math.PI/2.35;leaf.rotation.y=i/7*Math.PI*2;leaf.translateY(1.2);group.add(leaf)}group.position.set(x,0,z);group.scale.setScalar(scale);scene.add(group)}
function addStreetLight(scene,x,z,rotation=0){const poleMat=new THREE.MeshStandardMaterial({color:0x25282a,metalness:.72,roughness:.38}),lampMat=new THREE.MeshBasicMaterial({color:0xffd37a}),group=new THREE.Group(),pole=new THREE.Mesh(new THREE.CylinderGeometry(.1,.14,6.4,7),poleMat),arm=new THREE.Mesh(new THREE.BoxGeometry(1.5,.12,.12),poleMat),lamp=new THREE.Mesh(new THREE.BoxGeometry(.52,.18,.3),lampMat);pole.position.y=3.2;arm.position.set(.62,6.25,0);lamp.position.set(1.26,6.12,0);group.add(pole,arm,lamp);group.position.set(x,0,z);group.rotation.y=rotation;scene.add(group)}
function addCrosswalk(scene,x,z,rotation=0){const stripeMat=new THREE.MeshBasicMaterial({color:0xe9e7df}),group=new THREE.Group();for(let i=-3;i<=3;i++){const stripe=new THREE.Mesh(new THREE.PlaneGeometry(.65,5.5),stripeMat);stripe.rotation.x=-Math.PI/2;stripe.position.set(i*1.05,.095,0);group.add(stripe)}group.position.set(x,0,z);group.rotation.y=rotation;scene.add(group)}
function addCoronadoBridge(scene){const deckMat=new THREE.MeshStandardMaterial({color:0x555c63,roughness:.72}),supportMat=new THREE.MeshStandardMaterial({color:0xb7b4aa,roughness:.9});for(let i=0;i<11;i++){const t=i/10,x=-300+t*390,z=270-Math.sin(t*Math.PI)*34,y=10+Math.sin(t*Math.PI)*25,deck=new THREE.Mesh(new THREE.BoxGeometry(42,1.3,13),deckMat);deck.position.set(x,y,z);deck.rotation.z=(.5-t)*.13;scene.add(deck);if(i%2===0){const support=new THREE.Mesh(new THREE.BoxGeometry(2.8,y,4),supportMat);support.position.set(x,y/2,z);scene.add(support)}}}
function addBeach(scene,x,z,w,d){const sand=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshStandardMaterial({color:0xcdbb86,roughness:1}));sand.rotation.x=-Math.PI/2;sand.position.set(x,.025,z);scene.add(sand)}
function addMarina(scene,x,z,rows=4){const dockMat=new THREE.MeshStandardMaterial({color:0x8a765a,roughness:.85}),hullMat=new THREE.MeshStandardMaterial({color:0xe8e7df,roughness:.5});for(let row=0;row<rows;row++){const dock=new THREE.Mesh(new THREE.BoxGeometry(5,.18,72),dockMat);dock.position.set(x+row*15,.13,z);scene.add(dock);for(let boat=0;boat<6;boat++){const hull=new THREE.Mesh(new THREE.ConeGeometry(1.6,6,4),hullMat);hull.rotation.x=Math.PI/2;hull.position.set(x+row*15+4.5,.55,z-27+boat*11);scene.add(hull)}}}
export function buildSanDiegoMap(scene,{mobileDevice=false}={}){
 const colliders=[],rng=seeded(917),landMat=new THREE.MeshStandardMaterial({color:0x52694a,roughness:1}),waterMat=new THREE.MeshStandardMaterial({color:0x17658b,roughness:.38}),roadMat=new THREE.MeshStandardMaterial({color:0x282b30,roughness:.9}),freewayMat=new THREE.MeshStandardMaterial({color:0x343940,roughness:.82}),lineMat=new THREE.MeshBasicMaterial({color:0xd5a840}),laneMat=new THREE.MeshBasicMaterial({color:0xe8e5d8}),sidewalkMat=new THREE.MeshStandardMaterial({color:0xa8a49a,roughness:1});
 const land=new THREE.Mesh(new THREE.PlaneGeometry(1800,3200),landMat);land.rotation.x=-Math.PI/2;land.position.set(250,0,-150);scene.add(land);
 const ocean=new THREE.Mesh(new THREE.PlaneGeometry(900,3400),waterMat);ocean.rotation.x=-Math.PI/2;ocean.position.set(-980,-.02,-150);scene.add(ocean);
 const bay=new THREE.Mesh(new THREE.PlaneGeometry(285,690),waterMat);bay.rotation.x=-Math.PI/2;bay.position.set(-300,.02,120);scene.add(bay);
 const coronado=new THREE.Mesh(new THREE.PlaneGeometry(125,610),landMat);coronado.rotation.x=-Math.PI/2;coronado.position.set(-390,.035,250);scene.add(coronado);
 addBeach(scene,-502,-820,52,1320);addBeach(scene,-443,350,22,390);
 addMarina(scene,-345,95,mobileDevice?2:4);
 for(const freeway of SAN_DIEGO_FREEWAYS){for(let i=1;i<freeway.points.length;i++){const a=freeway.points[i-1],b=freeway.points[i];roadSegment(scene,freewayMat,a,b,freeway.width);roadSegment(scene,lineMat,a,b,.7,.055)}const middle=freeway.points[Math.floor(freeway.points.length/2)],sign=labelSprite(freeway.name,'#62a5ff',11);sign.position.set(middle[0],13,middle[1]);scene.add(sign)}
 const surfaceRoads=[...SAN_DIEGO_SURFACE_ROADS,...DOWNTOWN_STREETS,...NEIGHBORHOOD_STREETS];
 // Surface streets get sidewalks, curbs and a center stripe so each corridor reads as a usable city street.
 for(const road of surfaceRoads)for(let i=1;i<road.points.length;i++){const a=road.points[i-1],b=road.points[i];for(const side of [-1,1]){const [sa,sb]=parallelSegment(a,b,side*(road.width/2+2.4));roadSegment(scene,sidewalkMat,sa,sb,3.8,.045)}roadSegment(scene,roadMat,a,b,road.width,.07);roadSegment(scene,laneMat,a,b,.24,.081)}
 // Downtown intersections receive readable pedestrian crossings and lighting.
 for(const x of [-105,-35,35,105])for(const z of [-120,-40,40,120,200]){addCrosswalk(scene,x,z-6,0);addCrosswalk(scene,x-6,z,Math.PI/2)}
 const lightSpacing=mobileDevice?70:42;for(let z=-150;z<=220;z+=lightSpacing){addStreetLight(scene,-151,z,0);addStreetLight(scene,171,z,Math.PI)}
 const protectedRoads=[...SAN_DIEGO_FREEWAYS,...surfaceRoads];
 const colors=[0x65584a,0x344c5e,0x705348,0x505b63,0x8a806c],materials=colors.map(color=>new THREE.MeshStandardMaterial({color,roughness:.74})),unitBox=new THREE.BoxGeometry(1,1,1);
 for(const district of SAN_DIEGO_DISTRICTS){const target=mobileDevice?Math.max(5,Math.round(district.density*.48)):district.density;let placed=0;for(let attempt=0;attempt<target*8&&placed<target;attempt++){const angle=rng()*Math.PI*2,distance=35+rng()*(district.radius-45),x=district.x+Math.cos(angle)*distance,z=district.z+Math.sin(angle)*distance,width=10+rng()*15,depth=10+rng()*15;if(!roadClearance(x,z,Math.max(width,depth)/2+5,protectedRoads))continue;const height=district.height[0]+rng()*(district.height[1]-district.height[0]),building=new THREE.Mesh(unitBox,materials[Math.floor(rng()*materials.length)]);building.scale.set(width,height,depth);building.position.set(x,height/2,z);building.castShadow=!mobileDevice;scene.add(building);if(height>18){const roof=new THREE.Mesh(new THREE.BoxGeometry(width*.34,1.2,depth*.32),new THREE.MeshStandardMaterial({color:0x34383b,roughness:.8}));roof.position.set(x,height+.6,z);scene.add(roof)}colliders.push({minX:x-width/2,maxX:x+width/2,minZ:z-depth/2,maxZ:z+depth/2});placed++}}
 // Recognizable destination silhouettes placed in their real general parts of the region.
 addLandmark(scene,colliders,protectedRoads,{name:'PETCO PARK',x:105,z:155,w:72,d:58,h:18,color:0x607949});
 addLandmark(scene,colliders,protectedRoads,{name:'CONVENTION CENTER',x:-20,z:115,w:95,d:22,h:16,color:0xaeb4b8});
 addLandmark(scene,colliders,protectedRoads,{name:'BALBOA PARK',x:135,z:-175,w:22,d:22,h:48,color:0xc6a469});
 addLandmark(scene,colliders,protectedRoads,{name:'SNAPDRAGON STADIUM',x:235,z:-545,w:92,d:72,h:15,color:0x847d72});
 addLandmark(scene,colliders,protectedRoads,{name:'HOTEL DEL CORONADO',x:-390,z:430,w:58,d:42,h:24,color:0xefe3cf});
 addLandmark(scene,colliders,protectedRoads,{name:'UC SAN DIEGO',x:-70,z:-1250,w:62,d:48,h:30,color:0x7891a5});
 addLandmark(scene,colliders,protectedRoads,{name:'USS MIDWAY',x:-205,z:80,w:25,d:105,h:12,color:0x727b7d});
 addLandmark(scene,colliders,protectedRoads,{name:'SCRIPPS PIER',x:-462,z:-1210,w:10,d:95,h:3,color:0x9b8060});
 addLandmark(scene,colliders,protectedRoads,{name:'CABRILLO MONUMENT',x:-500,z:-390,w:12,d:12,h:24,color:0xd8d0bd});
 addCoronadoBridge(scene);
 const palms=mobileDevice?18:42;for(let i=0;i<palms;i++){const coastZ=-1500+(i%21)*140,coastX=-475+(i%3)*10;addPalm(scene,coastX,coastZ,.8+(i%4)*.08)}
 const runway=new THREE.Mesh(new THREE.PlaneGeometry(42,360),freewayMat);runway.rotation.x=-Math.PI/2;runway.rotation.z=-1.33;runway.position.set(-245,.07,-250);scene.add(runway);const airportLabel=labelSprite('SAN DIEGO INTERNATIONAL AIRPORT','#62a5ff',17);airportLabel.position.set(-245,22,-250);scene.add(airportLabel);
 for(const district of SAN_DIEGO_DISTRICTS){const label=labelSprite(district.name,'#e7b84f',district.name.length>20?14:17);label.position.set(district.x,34,district.z);scene.add(label)}
 return {colliders};
}
export function districtAt(x,z,current='Downtown San Diego'){let nearest=null,best=Infinity;for(const district of SAN_DIEGO_DISTRICTS){const distance=Math.hypot(x-district.x,z-district.z);if(distance<district.radius&&distance<best){nearest=district;best=distance}}return nearest?.name||current}
