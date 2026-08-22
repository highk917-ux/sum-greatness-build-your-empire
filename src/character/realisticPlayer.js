import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const MODEL_URL='/assets/models/sum-greatness-founder.glb';
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
 exit:[/exit/i,/walk.*out/i]
};
const LOOPING=new Set(['idle','walk','run','carry']);

function findClip(animations,matchers=[]){
 return animations.find(clip=>matchers.some(rx=>rx.test(clip.name)));
}

export async function attachRealisticPlayer(player,{mobileDevice=false}={}){
 try{
  // Load the packaged GLB directly. A HEAD preflight can fail inside Android
  // WebView/Capacitor even when the same local asset is available to GET.
  const gltf=await new GLTFLoader().loadAsync(MODEL_URL);
  const model=gltf.scene;
  const animations=gltf.animations||[];
  const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3());
  if(size.y>0)model.scale.setScalar(3.35/size.y);
  const grounded=new THREE.Box3().setFromObject(model);model.position.y-=grounded.min.y;
  model.rotation.y=Math.PI;
  model.traverse(object=>{if(object.isMesh){object.castShadow=!mobileDevice;object.receiveShadow=true;object.frustumCulled=true}});

  const fallbackChildren=[...player.children];
  fallbackChildren.forEach(child=>child.visible=false);
  player.add(model);

  const mixer=animations.length?new THREE.AnimationMixer(model):null;
  const clips=Object.fromEntries(Object.entries(CLIP_MATCHERS).map(([name,matchers])=>[name,findClip(animations,matchers)]));
  let currentAction=null,currentMotion='',lockedUntil=0,wasMoving=false,wasRunning=false;

  function playState(name,{force=false,fade=.16,loop=LOOPING.has(name),clamp=true,allowFallback=true}={}){
   if(!mixer)return false;
   const now=performance.now();
   if(!force&&now<lockedUntil)return false;
   const clip=clips[name]||(allowFallback?(clips.idle||animations[0]):null);
   if(!clip)return false;
   if(currentMotion===name&&currentAction?.isRunning())return true;

   const next=mixer.clipAction(clip);
   next.reset();
   next.enabled=true;
   next.setEffectiveTimeScale(1);
   next.setEffectiveWeight(1);
   next.setLoop(loop?THREE.LoopRepeat:THREE.LoopOnce,loop?Infinity:1);
   next.clampWhenFinished=!loop&&clamp;
   next.fadeIn(fade).play();
   currentAction?.fadeOut(fade);
   currentAction=next;
   currentMotion=name;
   if(!loop)lockedUntil=now+Math.max(120,clip.duration*1000-80);
   return true;
  }

  function playInteraction(name,options={}){
   // Interaction clips must be real named clips. Do not silently substitute idle,
   // because that would make an unavailable pickup/door animation look successful.
   return playState(name,{force:true,loop:false,fade:.12,allowFallback:false,...options});
  }

  playState('idle',{force:true});
  const availableAnimations=Object.fromEntries(Object.entries(clips).map(([name,clip])=>[name,clip?.name||null]));
  console.info('[SUM GREATNESS] Skeletal animation clips:',availableAnimations);

  return {
   model,
   availableAnimations,
   hasAnimation:name=>Boolean(clips[name]),
   get currentMotion(){return currentMotion},
   playInteraction,
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
    wasRunning=running;
   }
  };
 }catch(error){
  // Keep the existing approved fallback character visible until a valid rigged GLB
  // is exported into public/assets/models/sum-greatness-founder.glb.
  console.info('Realistic player model will activate after the Blender GLB is added.',error);
  return null;
 }
}
