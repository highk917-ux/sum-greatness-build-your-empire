const INTERACTION_STATES=new Set([
 'idle','approach','pickup','carry','place','openDoor','closeDoor','enter','exit'
]);

export function createInteractionState({playerController=null,onStateChange=()=>{}}={}){
 let state='idle';
 let heldObject=null;
 let activeTarget=null;
 let busyUntil=0;
 let transitionToken=0;
 let pendingTimer=null;
 let lastAnimationPlayed=false;

 function emit(next,detail={}){
  state=next;
  onStateChange({state,heldObject,activeTarget,lastAnimationPlayed,...detail});
 }

 function clearPending(){
  if(pendingTimer){clearTimeout(pendingTimer);pendingTimer=null}
  transitionToken++;
 }

 function schedule(callback,delay){
  const token=transitionToken;
  pendingTimer=setTimeout(()=>{
   pendingTimer=null;
   if(token!==transitionToken)return;
   callback();
  },Math.max(0,delay));
 }

 function canStart(){return performance.now()>=busyUntil&&!pendingTimer}

 function lockFor(ms){busyUntil=performance.now()+Math.max(0,ms||0)}

 function play(name,options={}){
  lastAnimationPlayed=playerController?.playInteraction?.(name,options)??false;
  return lastAnimationPlayed;
 }

 function resolveDuration(animation,fallback){
  const clipDuration=playerController?.getAnimationDuration?.(animation);
  if(Number.isFinite(clipDuration)&&clipDuration>0)return Math.round(clipDuration*1000);
  return fallback;
 }

 function start(name,{target=null,duration,animation=name,animationOptions={}}={}){
  if(!INTERACTION_STATES.has(name)||!canStart())return false;
  const resolvedDuration=resolveDuration(animation,duration??650);
  activeTarget=target;
  const animationPlayed=play(animation,animationOptions);
  emit(name,{target,duration:resolvedDuration,animation,animationPlayed});
  lockFor(resolvedDuration);
  return resolvedDuration;
 }

 function finishIdle(detail={}){
  activeTarget=null;
  busyUntil=0;
  emit(heldObject?'carry':'idle',detail);
 }

 function placeHeld({position=null,duration,onDetach}={}){
  if(!heldObject)return false;
  const object=heldObject;
  const resolved=start('place',{target:object,duration:duration??650});
  if(!resolved)return false;
  schedule(()=>{
   onDetach?.(object,position);
   if(position&&object?.position?.copy)object.position.copy(position);
   heldObject=null;
   playerController?.setCarry?.(false);
   finishIdle({placed:object});
  },Math.max(0,resolved-80));
  return true;
 }

 return {
  get state(){return state},
  get heldObject(){return heldObject},
  get activeTarget(){return activeTarget},
  get busy(){return !canStart()},
  get lastAnimationPlayed(){return lastAnimationPlayed},
  setPlayerController(controller){playerController=controller},
  cancel(reason='cancelled'){
   clearPending();
   busyUntil=0;
   activeTarget=null;
   playerController?.setCarry?.(Boolean(heldObject));
   emit(heldObject?'carry':'idle',{reason});
  },
  reset(){
   clearPending();
   heldObject=null;
   activeTarget=null;
   busyUntil=0;
   lastAnimationPlayed=false;
   playerController?.setCarry?.(false);
   emit('idle');
  },
  pickup(target,{duration,onAttach}={}){
   if(!target||heldObject)return false;
   const resolved=start('pickup',{target,duration:duration??700});
   if(!resolved)return false;
   schedule(()=>{
    heldObject=target;
    onAttach?.(target);
    playerController?.setCarry?.(true);
    activeTarget=target;
    busyUntil=0;
    emit('carry',{target});
   },Math.max(0,resolved-80));
   return true;
  },
  place:placeHeld,
  drop(position,options={}){return placeHeld({position,duration:350,...options})},
  openDoor(door,{duration,onOpen}={}){
   if(!door)return false;
   const resolved=start('openDoor',{target:door,duration:duration??650});
   if(!resolved)return false;
   schedule(()=>{
    door.userData={...door.userData,isOpen:true};
    onOpen?.(door);
    finishIdle({door});
   },Math.max(0,resolved-60));
   return true;
  },
  closeDoor(door,{duration,onClose}={}){
   if(!door)return false;
   const resolved=start('closeDoor',{target:door,duration:duration??650});
   if(!resolved)return false;
   schedule(()=>{
    door.userData={...door.userData,isOpen:false};
    onClose?.(door);
    finishIdle({door});
   },Math.max(0,resolved-60));
   return true;
  },
  enter(door,{duration,onComplete}={}){
   if(!door)return false;
   const resolved=start('enter',{target:door,duration:duration??900});
   if(!resolved)return false;
   schedule(()=>{onComplete?.(door);finishIdle({door})},Math.max(0,resolved-60));
   return true;
  },
  exit(door,{duration,onComplete}={}){
   if(!door)return false;
   const resolved=start('exit',{target:door,duration:duration??900});
   if(!resolved)return false;
   schedule(()=>{onComplete?.(door);finishIdle({door})},Math.max(0,resolved-60));
   return true;
  }
 };
}
