const INTERACTION_STATES=new Set([
 'idle','approach','pickup','carry','place','openDoor','closeDoor','enter','exit'
]);

export function createInteractionState({playerController=null,onStateChange=()=>{}}={}){
 let state='idle';
 let heldObject=null;
 let activeTarget=null;
 let busyUntil=0;

 function emit(next,detail={}){
  state=next;
  onStateChange({state,heldObject,activeTarget,...detail});
 }

 function canStart(){return performance.now()>=busyUntil}

 function lockFor(ms){busyUntil=performance.now()+Math.max(0,ms||0)}

 function play(name,options={}){
  const played=playerController?.playInteraction?.(name,options)??false;
  return played;
 }

 function start(name,{target=null,duration=650,animation=name,animationOptions={}}={}){
  if(!INTERACTION_STATES.has(name)||!canStart())return false;
  activeTarget=target;
  emit(name,{target});
  play(animation,animationOptions);
  lockFor(duration);
  return true;
 }

 return {
  get state(){return state},
  get heldObject(){return heldObject},
  get activeTarget(){return activeTarget},
  get busy(){return !canStart()},
  setPlayerController(controller){playerController=controller},
  reset(){
   heldObject=null;
   activeTarget=null;
   busyUntil=0;
   playerController?.setCarry?.(false);
   emit('idle');
  },
  pickup(target,{duration=700}={}){
   if(!target||heldObject||!start('pickup',{target,duration}))return false;
   setTimeout(()=>{
    heldObject=target;
    playerController?.setCarry?.(true);
    emit('carry',{target});
   },Math.max(0,duration-80));
   return true;
  },
  place({position=null,duration=650}={}){
   if(!heldObject||!start('place',{target:heldObject,duration}))return false;
   const object=heldObject;
   setTimeout(()=>{
    if(position&&object?.position?.copy)object.position.copy(position);
    heldObject=null;
    activeTarget=null;
    playerController?.setCarry?.(false);
    emit('idle',{placed:object});
   },Math.max(0,duration-80));
   return true;
  },
  drop(position){return this.place({position,duration:350})},
  openDoor(door,{duration=650}={}){
   if(!door||!start('openDoor',{target:door,duration}))return false;
   setTimeout(()=>{door.userData={...door.userData,isOpen:true};emit('idle',{door})},Math.max(0,duration-60));
   return true;
  },
  closeDoor(door,{duration=650}={}){
   if(!door||!start('closeDoor',{target:door,duration}))return false;
   setTimeout(()=>{door.userData={...door.userData,isOpen:false};emit('idle',{door})},Math.max(0,duration-60));
   return true;
  },
  enter(door,{duration=900,onComplete}={}){
   if(!door||!start('enter',{target:door,duration}))return false;
   setTimeout(()=>{onComplete?.(door);activeTarget=null;emit('idle',{door})},Math.max(0,duration-60));
   return true;
  },
  exit(door,{duration=900,onComplete}={}){
   if(!door||!start('exit',{target:door,duration}))return false;
   setTimeout(()=>{onComplete?.(door);activeTarget=null;emit('idle',{door})},Math.max(0,duration-60));
   return true;
  }
 };
}
