import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { animationCatalogReport,buildAnimationCatalog,LOOPING_ANIMATION_STATES } from './animationCatalog.js';

const MODEL_PATH='assets/models/sum-greatness-founder.glb';

function resolveModelUrls(explicitUrl){
 const candidates=explicitUrl?[explicitUrl]:[
  new URL(MODEL_PATH,document.baseURI).href,
  new URL(`/${MODEL_PATH}`,window.location.origin).href
 ];
 return [...new Set(candidates)];
}

async function loadFounderModel(urls){
 const loader=new GLTFLoader();
 let lastError=null;
 for(const url of urls){
  try{return {gltf:await loader.loadAsync(url),modelUrl:url}}
  catch(error){lastError=error;console.warn('[SUM GREATNESS] Founder GLB load attempt failed',{url,error})}
 }
 throw lastError||new Error('Founder GLB could not be loaded');
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

function normalizeAngle(angle){
 return Math.atan2(Math.sin(angle),Math.cos(angle));
}

function emitStatus(detail){
 window.dispatchEvent(new CustomEvent('sum-greatness:founder-status',{detail}));
}

export async function attachRealisticPlayer(player,{mobileDevice=false,modelUrl}={}){
 const fallbackChildren=[...player.children];
 const modelUrls=resolveModelUrls(modelUrl);
 try{
  const loaded=await loadFounderModel(modelUrls);
  const {gltf}=loaded;
  const resolvedModelUrl=loaded.modelUrl;
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

  fallbackChildren.forEach(child=>child.visible=false);
  player.add(model);

  const mixer=animations.length?new THREE.AnimationMixer(model):null;
  const clips=buildAnimationCatalog(animations);
  const report=animationCatalogReport(animations,clips);
  let currentAction=null,currentMotion='',lockedUntil=0,wasMoving=false,previousYaw=player.rotation.y;

  function playState(name,{force=false,fade=.16,loop=LOOPING_ANIMATION_STATES.has(name),clamp=true,allowFallback=true,timeScale=1}={}){
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
   return playState(name,{force:true,loop:false,fade:.12,allowFallback:false,...options});
  }

  playState('idle',{force:true});
  const status={loaded:true,modelUrl:resolvedModelUrl,rig,animations:report};
  console.info('[SUM GREATNESS] Founder GLB loaded',status);
  emitStatus(status);
  if(!rig.isRigged)console.warn('[SUM GREATNESS] Founder GLB is visible but not skinned/rigged; skeletal movement clips cannot deform it.',rig);
  if(report.missing.length)console.info('[SUM GREATNESS] Founder animation clips still needed',report.missing);

  return {
   model,
   modelUrl:resolvedModelUrl,
   attemptedModelUrls:modelUrls,
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
   update(delta,{moving=false,running=false,turn=null}={}){
    const now=performance.now();
    const yaw=player.rotation.y;
    const inferredTurn=delta>0?normalizeAngle(yaw-previousYaw)/delta:0;
    previousYaw=yaw;
    const turnIntent=Number.isFinite(turn)?turn:THREE.MathUtils.clamp(inferredTurn/2.2,-1,1);
    if(now>=lockedUntil){
     const turning=!moving&&Math.abs(turnIntent)>.35;
     const justStopped=!moving&&wasMoving;
     if(justStopped&&clips.stop)playState('stop',{loop:false,allowFallback:false});
     else if(turning){
      const turnState=turnIntent<0?'turnLeft':'turnRight';
      if(clips[turnState])playState(turnState,{loop:false,allowFallback:false});
      else playState('idle');
     }else playState(running?'run':moving?'walk':'idle');
    }
    mixer?.update(delta);
    wasMoving=moving;
   },
   dispose(){
    mixer?.stopAllAction();
    mixer?.uncacheRoot(model);
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
  fallbackChildren.forEach(child=>child.visible=true);
  const status={loaded:false,attemptedModelUrls:modelUrls,error:String(error?.message||error)};
  console.warn('[SUM GREATNESS] Founder GLB unavailable; fallback remains active.',status);
  emitStatus(status);
  return null;
 }
}
