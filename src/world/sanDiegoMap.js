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
const FREEWAYS=[
 {width:24,points:[[-85,1120],[-70,650],[-60,250],[-65,-80],[-115,-410],[-175,-760],[-160,-1160],[-120,-1620]]},
 {width:22,points:[[270,1100],[255,720],[245,350],[250,0],[255,-420],[230,-820],[190,-1320]]},
 {width:24,points:[[-470,-500],[-220,-495],[40,-485],[340,-470],[650,-455],[980,-430]]},
 {width:19,points:[[35,-60],[65,-190],[80,-330],[65,-470]]},
 {width:20,points:[[-55,145],[180,135],[430,120],[690,100],[940,80]]},
 {width:21,points:[[480,980],[465,620],[470,260],[485,-120],[470,-520],[430,-920]]}
];
function roadSegment(scene,material,a,b,width,y=.04){const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,length),material);mesh.rotation.x=-Math.PI/2;mesh.rotation.z=-Math.atan2(dz,dx)+Math.PI/2;mesh.position.set((a[0]+b[0])/2,y,(a[1]+b[1])/2);scene.add(mesh)}
function seeded(seed){let value=seed>>>0;return()=>{value=(value*1664525+1013904223)>>>0;return value/4294967296}}
export function buildSanDiegoMap(scene,{mobileDevice=false}={}){
 const colliders=[],rng=seeded(917),landMat=new THREE.MeshStandardMaterial({color:0x52694a,roughness:1}),waterMat=new THREE.MeshStandardMaterial({color:0x17658b,roughness:.38}),roadMat=new THREE.MeshStandardMaterial({color:0x282b30,roughness:.9}),freewayMat=new THREE.MeshStandardMaterial({color:0x343940,roughness:.82}),lineMat=new THREE.MeshBasicMaterial({color:0xd5a840});
 const land=new THREE.Mesh(new THREE.PlaneGeometry(1800,3200),landMat);land.rotation.x=-Math.PI/2;land.position.set(250,0,-150);scene.add(land);
 const ocean=new THREE.Mesh(new THREE.PlaneGeometry(900,3400),waterMat);ocean.rotation.x=-Math.PI/2;ocean.position.set(-980,-.02,-150);scene.add(ocean);
 const bay=new THREE.Mesh(new THREE.PlaneGeometry(285,690),waterMat);bay.rotation.x=-Math.PI/2;bay.position.set(-300,.02,120);scene.add(bay);
 const coronado=new THREE.Mesh(new THREE.PlaneGeometry(125,610),landMat);coronado.rotation.x=-Math.PI/2;coronado.position.set(-390,.035,250);scene.add(coronado);
 for(const freeway of FREEWAYS)for(let i=1;i<freeway.points.length;i++){const a=freeway.points[i-1],b=freeway.points[i];roadSegment(scene,freewayMat,a,b,freeway.width);roadSegment(scene,lineMat,a,b,.7,.055)}
 roadSegment(scene,roadMat,[-390,120],[-65,145],12,.065);
 const surfaceRoads=[[[-430,-260],[930,-110]],[[-300,-650],[600,-650]],[[-300,-1070],[300,-1070]],[[-150,790],[500,790]],[[-120,0],[340,0]],[[0,-190],[0,320]],[[190,430],[190,980]]];for(const [a,b] of surfaceRoads)roadSegment(scene,roadMat,a,b,10,.06);
 const colors=[0x65584a,0x344c5e,0x705348,0x505b63,0x8a806c],materials=colors.map(color=>new THREE.MeshStandardMaterial({color,roughness:.74})),unitBox=new THREE.BoxGeometry(1,1,1);
 for(const district of SAN_DIEGO_DISTRICTS){const count=mobileDevice?Math.max(5,Math.round(district.density*.48)):district.density;for(let i=0;i<count;i++){const angle=rng()*Math.PI*2,distance=35+rng()*(district.radius-45),x=district.x+Math.cos(angle)*distance,z=district.z+Math.sin(angle)*distance;if(FREEWAYS.some(f=>f.points.some(p=>Math.hypot(x-p[0],z-p[1])<28)))continue;const width=10+rng()*15,depth=10+rng()*15,height=district.height[0]+rng()*(district.height[1]-district.height[0]),building=new THREE.Mesh(unitBox,materials[Math.floor(rng()*materials.length)]);building.scale.set(width,height,depth);building.position.set(x,height/2,z);building.castShadow=!mobileDevice;scene.add(building);colliders.push({minX:x-width/2,maxX:x+width/2,minZ:z-depth/2,maxZ:z+depth/2})}}
 return {colliders};
}
export function districtAt(x,z,current='Downtown San Diego'){let nearest=null,best=Infinity;for(const district of SAN_DIEGO_DISTRICTS){const distance=Math.hypot(x-district.x,z-district.z);if(distance<district.radius&&distance<best){nearest=district;best=distance}}return nearest?.name||current}
