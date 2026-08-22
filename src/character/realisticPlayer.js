import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const MODEL_URL='/assets/models/sum-greatness-founder.glb';
const FADE_TIME=.18;

function normalizeClipName(name=''){
 return name.toLowerCase().replace(/[^a-z0-9]+/g,'');
}

function findClip(animations,...patterns){
 return animations.find(clip=>{
  const name=normalizeClipName(clip.name);
  return patterns.some(pattern=>pattern.test(name));
 });
}

export async function attachRealisticPlayer(player,{mobileDevice=false}={}){
 try{
  // Load the GLB directly. Android/Capacitor can reject or mishandle HEAD
  // requests against packaged local assets even when a normal GET succeeds.
  const gltf=await new GLTFLoader().loadAsync(MODEL_URL);
  const model=gltf.scene;
  const animations=gltf.animations||[];

  const bounds=new THREE.Box3().setFromObject(model);
  const size=bounds.getSize(new THREE.Vector3());
  if(size.y>0)model.scale.setScalar(3.35/size.y);
  const grounded=new THREE.Box3().setFromObject(model);
  model.position.y-=grounded.min.y;
  model.rotation.y=Math.PI;

  let renderableMeshCount=0;
  model.traverse(object=>{
   if(object.isMesh){
    renderableMeshCount++;
    object.visible=true;
    object.castShadow=!mobileDevice;
    object.receiveShadow=true;
    object.frustumCulled=true;
   }
  });

  if(!renderableMeshCount){
   throw new Error('Founder GLB loaded but contained no renderable meshes.');
  }

  const fallbackChildren=[...player.children];
  player.add(model);
  fallbackChildren.forEach(child=>child.visible=false);

  console.info(`[SUM GREATNESS] Founder GLB loaded (${renderableMeshCount} meshes, ${animations.length} animation clips).`);

  if(!animations.length){
   console.info('[SUM GREATNESS] Founder GLB loaded without animation clips.');
   return {
    model,
    availableAnimations:[],
    hasAnimation:()=>false,
    playInteraction:()=>false,
    setCarrying:()=>{},
    update:()=>{},
   };
  }

  const mixer=new THREE.AnimationMixer(model);
  const clips={
   idle:findClip(animations,/^idle$/, /idle/, /breath/, /stand/),
   walk:findClip(animations,/^walk$/, /walk/, /walking/),
   run:findClip(animations,/^run$/, /run/, /jog/, /sprint/),
   turnLeft:findClip(animations,/turnleft/, /leftturn/),
   turnRight:findClip(animations,/turnright/, /rightturn/),
   pickup:findClip(animations,/pickup/, /pickobject/, /lift/),
   carry:findClip(animations,/carry/, /holding/, /holdobject/),
   place:findClip(animations,/place/, /putdown/, /dropobject/),
   openDoor:findClip(animations,/opendoor/, /dooropen/),
   closeDoor:findClip(animations,/closedoor/, /doorclose/),
   enter:findClip(animations,/enterbuilding/, /walkinside/, /enter/),
   exit:findClip(animations,/exitbuilding/, /walkoutside/, /exit/),
  };

  // If Blender exported only one locomotion action, keep the model alive rather
  // than failing. The proper named clips will automatically take over later.
  clips.idle ||= animations[0];

  const actions={};
  for(const [name,clip] of Object.entries(clips)){
   if(!clip)continue;
   const action=mixer.clipAction(clip);
   actions[name]=action;
   if(['pickup','place','openDoor','closeDoor','enter','exit'].includes(name)){
    action.setLoop(THREE.LoopOnce,1);
    action.clampWhenFinished=true;
   }else{
    action.setLoop(THREE.LoopRepeat,Infinity);
   }
  }

  let currentAction=null;
  let currentMotion='';
  let interactionLocked=false;
  let carrying=false;

  function fadeTo(name,fade=FADE_TIME){
   const next=actions[name]||actions.idle;
   if(!next||next===currentAction)return false;
   next.enabled=true;
   next.reset();
   next.setEffectiveWeight(1);
   next.setEffectiveTimeScale(1);
   next.fadeIn(fade).play();
   currentAction?.fadeOut(fade);
   currentAction=next;
   currentMotion=name;
   return true;
  }

  function locomotionName({moving=false,running=false}={}){
   if(carrying&&actions.carry)return 'carry';
   if(running&&actions.run)return 'run';
   if(moving&&actions.walk)return 'walk';
   return 'idle';
  }

  function setLocomotion(state){
   if(interactionLocked)return;
   const next=locomotionName(state);
   if(next!==currentMotion)fadeTo(next);
  }

  function playInteraction(name,{returnTo='idle'}={}){
   const action=actions[name];
   if(!action)return false;

   interactionLocked=true;
   currentAction?.fadeOut(.1);
   action.reset().setEffectiveWeight(1).setEffectiveTimeScale(1).fadeIn(.1).play();
   currentAction=action;
   currentMotion=name;

   const onFinished=event=>{
    if(event.action!==action)return;
    mixer.removeEventListener('finished',onFinished);
    interactionLocked=false;
    const destination=carrying&&actions.carry?'carry':returnTo;
    fadeTo(actions[destination]?destination:'idle',.14);
   };
   mixer.addEventListener('finished',onFinished);
   return true;
  }

  function setCarrying(value){
   carrying=Boolean(value);
   if(!interactionLocked)fadeTo(carrying&&actions.carry?'carry':'idle');
  }

  fadeTo('idle',0);

  const availableAnimations=Object.entries(clips)
   .filter(([,clip])=>Boolean(clip))
   .map(([name,clip])=>({name,source:clip.name}));
  console.info('[SUM GREATNESS] Character animations ready:',availableAnimations);

  return {
   model,
   availableAnimations,
   hasAnimation:name=>Boolean(actions[name]),
   playInteraction,
   setCarrying,
   update(delta,{moving=false,running=false}={}){
    setLocomotion({moving,running});
    mixer.update(delta);
   },
  };
 }catch(error){
  console.error('[SUM GREATNESS] Founder GLB failed to load; using fallback character.',error);
  return null;
 }
}
