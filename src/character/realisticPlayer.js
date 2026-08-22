import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const MODEL_URL='/assets/models/sum-greatness-founder.glb';
const CLIP_MATCHERS={
 idle:[/idle/i,/breath/i,/stand/i],walk:[/walk/i],run:[/run/i,/jog/i],stop:[/stop/i,/brake/i],turnLeft:[/turn.*left/i,/left.*turn/i],turnRight:[/turn.*right/i,/right.*turn/i],pickup:[/pick.?up/i,/lift/i,/grab/i],carry:[/carry/i,/hold/i],place:[/place/i,/put.?down/i,/drop/i],openDoor:[/open.*door/i,/door.*open/i],enter:[/enter/i,/walk.*in/i],exit:[/exit/i,/walk.*out/i]
};
const LOOPING=new Set(['idle','walk','run','carry']);

function findClip(animations,matchers=[]){return animations.find(clip=>matchers.some(rx=>rx.test(clip.name)))}

export async function attachRealisticPlayer(player,{mobileDevice=false}={}){
 try{
  const response=await fetch(MODEL_URL,{method:'HEAD'});
  if(!response.ok)return null;
  const gltf=await new GLTFLoader().loadAsync(MODEL_URL),model=gltf.scene;
  const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3());
  if(size.y>0)model.scale.setScalar(3.35/size.y);
  const grounded=new THREE.Box3().setFromObject(model);model.position.y-=grounded.min.y;
  model.rotation.y=Math.PI;
  model.traverse(object=>{if(object.isMesh){object.castShadow=!mobileDevice;object.receiveShadow=true;object.frustumCulled=true}});
  const fallbackChildren=[...player.children];fallbackChildren.forEach(child=>child.visible=false);
  player.add(model);

  const mixer=gltf.animations.length?new THREE.AnimationMixer(model):null;
  const clips=Object.fromEntries(Object.entries(CLIP_MATCHERS).map(([name,matchers])=>[name,findClip(gltf.animations,matchers)]));
  let currentAction=null,currentMotion='',lockedUntil=0;

  function playState(name,{force=false,fade=.16,loop=LOOPING.has(name),clamp=true}={}){
   if(!mixer)return false;
   const now=performance.now();
   if(!force&&now<lockedUntil)return false;
   const clip=clips[name]||clips.idle||gltf.animations[0];
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
   return playState(name,{force:true,loop:false,fade:.12,...options});
  }

  playState('idle',{force:true});
  return {
   model,
   availableAnimations:Object.fromEntries(Object.entries(clips).map(([name,clip])=>[name,clip?.name||null])),
   get currentMotion(){return currentMotion},
   playInteraction,
   setCarry(active=true){return playState(active?'carry':'idle',{force:true,loop:true})},
   update(delta,{moving=false,running=false,turn=0}={}){
    if(performance.now()>=lockedUntil){
     const next=running?'run':moving?'walk':Math.abs(turn)>.35?(turn<0?'turnLeft':'turnRight'):'idle';
     playState(next);
    }
    mixer?.update(delta);
   }
  };
 }catch(error){console.info('Realistic player model will activate after the Blender GLB is added.',error);return null}
}
