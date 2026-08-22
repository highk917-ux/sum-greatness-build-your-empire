import * as THREE from 'three';

export function createDoorInteraction({door,pivot=door,openAngle=Math.PI*.52,speed=6,onStateChange=()=>{}}={}){
 if(!door||!pivot)throw new Error('Door and pivot are required');
 const closedRotation=pivot.rotation.y;
 const openRotation=closedRotation+openAngle;
 let targetRotation=door.userData?.isOpen?openRotation:closedRotation;
 let moving=false;

 function emit(){onStateChange({door,isOpen:Boolean(door.userData?.isOpen),moving})}

 function setOpen(open,{instant=false}={}){
  door.userData={...door.userData,isOpen:Boolean(open)};
  targetRotation=open?openRotation:closedRotation;
  moving=!instant;
  if(instant){pivot.rotation.y=targetRotation;moving=false}
  emit();
  return true;
 }

 function toggle(options){return setOpen(!door.userData?.isOpen,options)}

 function update(delta){
  if(!moving)return false;
  const before=pivot.rotation.y;
  pivot.rotation.y=THREE.MathUtils.damp(before,targetRotation,speed,Math.min(delta,.05));
  if(Math.abs(pivot.rotation.y-targetRotation)<.002){
   pivot.rotation.y=targetRotation;
   moving=false;
   emit();
  }
  return moving;
 }

 return {
  door,
  pivot,
  get isOpen(){return Boolean(door.userData?.isOpen)},
  get moving(){return moving},
  open(options){return setOpen(true,options)},
  close(options){return setOpen(false,options)},
  toggle,
  update,
  setOpen
 };
}

export function createBuildingPortal({id,door,insidePosition,outsidePosition,insideFacing=null,outsideFacing=null}={}){
 if(!door)throw new Error('Portal door is required');
 const copyPosition=value=>value?.clone?.()||new THREE.Vector3(value?.x||0,value?.y||0,value?.z||0);
 return {
  id:id||door.uuid,
  door,
  insidePosition:copyPosition(insidePosition),
  outsidePosition:copyPosition(outsidePosition),
  insideFacing,
  outsideFacing,
  enter(player){
   if(!player||!door.userData?.isOpen)return false;
   player.position.copy(this.insidePosition);
   if(Number.isFinite(insideFacing))player.rotation.y=insideFacing;
   return true;
  },
  exit(player){
   if(!player||!door.userData?.isOpen)return false;
   player.position.copy(this.outsidePosition);
   if(Number.isFinite(outsideFacing))player.rotation.y=outsideFacing;
   return true;
  }
 };
}
