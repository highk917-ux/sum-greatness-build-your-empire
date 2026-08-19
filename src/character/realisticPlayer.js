import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const MODEL_URL='/assets/models/sum-greatness-founder.glb';

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
  const clips={idle:gltf.animations.find(clip=>/idle/i.test(clip.name)),walk:gltf.animations.find(clip=>/walk/i.test(clip.name)),run:gltf.animations.find(clip=>/run|jog/i.test(clip.name))};
  let currentAction=null,currentMotion='';
  function setMotion(motion){if(!mixer||currentMotion===motion)return;currentMotion=motion;const clip=clips[motion]||clips.idle||gltf.animations[0],next=clip?mixer.clipAction(clip):null;if(next!==currentAction){next?.reset().fadeIn(.18).play();currentAction?.fadeOut(.18);currentAction=next}}
  setMotion('idle');
  return {model,update(delta,{moving=false,running=false}={}){setMotion(running?'run':moving?'walk':'idle');mixer?.update(delta)}};
 }catch(error){console.info('Realistic player model will activate after the Blender GLB is added.',error);return null}
}
