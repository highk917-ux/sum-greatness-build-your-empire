import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const MODEL_PATH='assets/models/sum-greatness-founder.glb';
const CLIP_MATCHERS={
 idle:[/idle/i,/breath/i,/stand/i],
 walk:[/walk/i],
 run:[/run/i,/jog/i,/sprint/i],
 stop:[/stop/i,/brake/i],
 turnLeft:[/turn.*left/i,/left.*turn/i],
 turnRight:[/turn.*right/i,/right.*turn/i],
 pickup:[/pick.?up/i,/lift/i,/grab/i],
 carry:[/carry/i,/hold/i],
 place:[/place/i,/put.?down/i,/drop/i],
 openDoor:[/open.*door/i,/door.*open/i],
 closeDoor:[/close.*door/i,/door.*close/i],
 enter:[/enter/i,/walk.*in/i],
 exit:[/exit/i,/walk.*out/i],
 wave:[/wave/i,/greet/i],
 talk:[/talk/i,/speak/i,/conversation/i],
 point:[/point/i,/gesture/i]
};
const LOOPING=new Set(['idle','walk','run','carry','talk']);

function resolveModelUrl(){
 // document.baseURI works in Vite preview and in Capacitor's packaged WebView.
 // Avoid a root-only path so Android can resolve the bundled asset even when
 // the app is served from a non-root base URL.
 return new URL(MODEL_PATH,document.baseURI).href;
}

function findClip(animations,matchers=[]){
 return animations.find(clip=>matchers.some(rx=>rx.test(clip.name)));
}

function inspectRig(model){
 let skinnedMeshes=0,bones=0,meshes=0,vertices=0;
 model.traverse(object=>{
  if(object.isMesh){
   meshes++;
   vertices+=object.geometry?.attributes?.position?.count||0;
  }
  if(object.isSkinnedMesh)skinnedMeshes++;
  if(object.isBone)bones++;
 });
 return {meshes,skinnedMeshes,bones,vertices,isRigged:skinnedMeshes>0&&bones>0};
}

function animationReport(animations,clips){
 return {
  clipCount:animations.length,
  names:animations.map(clip=>clip.name),
  mapped:Object.fromEntries(Object.entries(clips).map(([name,clip])=>[name,clip?.name||null])),
  missing:Object.keys(clips).filter(name=>!clips[name])
 };
}

export async function attachRealisticPlayer(player,{mobileDevice=false,modelUrl=resolveModelUrl()}={}){
 const fallbackChildren=[...player.children];
 try{
  // Load the packaged GLB directly. A HEAD preflight can fail inside Android
  // WebView/Capacitor even when the same local asset is available to GET.
  const gltf=await new GLTFLoader().loadAsync(modelUrl);
  const model=gltf.scene;
  const animations=gltf.animations||[];
  if(!model)throw new Error('Founder GLB did not contain a scene');
  const rig=inspectRig(model);
  if(rig.meshes===0||rig.vertices===0)throw new Error('Founder GLB contains no renderable geometry');

  const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3());
  if(!Number.isFinite(size.y)||size.y<=0)throw new Error('Founder GLB has invalid bounds');
  model.scale.setScalar(3.35/size.y);
  const grounded=new THREE.Box3().setFromObject(model);model.position.y-=grounded.min.y;
  model.rotation.y=Math.PI;
  model.traverse(object=>{if(object.isMesh){object.castShadow=!mobileDevice;object.receiveShadow=true;object.frustumCulled=true}});

  // Hide the fallback only after the real GLB has fully loaded and passed sanity checks.
  fallbackChildren.forEach(child=>child.visible=false);
  player.add(model);

  const mixer=animations.length?new THREE.AnimationMixer(model):null;
  const clips=Object.fromEntries(Object.entries(CLIP_MATCHERS).map(([name,matchers])=>[name,findClip(animations,matchers)]));
  const report=animationReport(animations,clips);
  let currentAction=null,currentMotion='',lockedUntil=0,wasMoving=false;

  function playState(name,{force=false,fade=.16,loop=LOOPING.has(name),clamp=true,allowFallback=true,timeScale=1}={}){
   if(!mixer)return false;
   const now=performance.now();
   if(!force&&now<lockedUntil)return false;
   const clip=clips[name]||(allowFallback?(clips.idle||animations[0]):null);
   if(!clip)return false;
   if(currentMotion===name&&currentAction?.isRunning())return true;

   const next=mixer.clipAction(clip);
   next.reset();
   next.enabled=true;
   next.setEffectiveTimeScale(timeScale);
   next.setEffectiveWeight(1);
   next.setLoop(loop?THREE.LoopRepeat:THREE.LoopOnce,loop?Infinity:1);
   next.clampWhenFinished=!loop&&clamp;
   next.fadeIn(fade).play();
   if(currentAction&&currentAction!==next)currentAction.fadeOut(fade);
   currentAction=next;
   currentMotion=name;
   if(!loop)lockedUntil=now+Math.max(120,(clip.duration/Math.max(.01,timeScale))*1000-80);
   return true;
  }

  function playInteraction(name,options={}){
   // Interaction clips must be real named clips. Do not silently substitute idle,
   // because that would make an unavailable pickup/door animation look successful.
   return playState(name,{force:true,loop:false,fade:.12,allowFallback:false,...options});
  }

  playState('idle',{force:true});
  console.info('[SUM GREATNESS] Founder GLB loaded',{modelUrl,rig,animations:report});
  if(!rig.isRigged)console.warn('[SUM GREATNESS] Founder GLB is visible but not skinned/rigged; skeletal movement clips cannot deform it.',rig);
  if(report.missing.length)console.info('[SUM GREATNESS] Founder animation clips still needed',report.missing);

  return {
   model,
   modelUrl,
   rig,
   animationReport:report,
   availableAnimations:report.mapped,
   hasAnimation:name=>Boolean(clips[name]),
   getAnimationDuration(name){return clips[name]?.duration||0},
   get currentMotion(){return currentMotion},
   playInteraction,
   playGesture(name,options={}){
    if(!['wave','talk','point'].includes(name))return false;
    return playState(name,{force:true,allowFallback:false,...options});
   },
   setCarry(active=true){
    if(active&&!clips.carry)return false;
    return playState(active?'carry':'idle',{force:true,loop:true,allowFallback:!active});
   },
   update(delta,{moving=false,running=false,turn=0}={}){
    const now=performance.now();
    if(now>=lockedUntil){
     const turning=!moving&&Math.abs(turn)>.35;
     const justStopped=!moving&&wasMoving;
     if(justStopped&&clips.stop)playState('stop',{loop:false,allowFallback:false});
     else if(turning){
      const turnState=turn<0?'turnLeft':'turnRight';
      if(clips[turnState])playState(turnState,{loop:false,allowFallback:false});
      else playState('idle');
     }else playState(running?'run':moving?'walk':'idle');
    }
    mixer?.update(delta);
    wasMoving=moving;
   },
   dispose(){
    mixer?.stopAllAction();
    player.remove(model);
    model.traverse(object=>{
     if(object.geometry?.dispose)object.geometry.dispose();
     const materials=Array.isArray(object.material)?object.material:[object.material];
     materials.filter(Boolean).forEach(material=>material.dispose?.());
    });
    fallbackChildren.forEach(child=>child.visible=true);
   }
  };
 }catch(error){
  // Keep the existing approved fallback character visible until a valid rigged GLB
  // is exported into public/assets/models/sum-greatness-founder.glb.
  fallbackChildren.forEach(child=>child.visible=true);
  console.warn('[SUM GREATNESS] Founder GLB unavailable; fallback remains active.',{modelUrl,error});
  return null;
 }
}
