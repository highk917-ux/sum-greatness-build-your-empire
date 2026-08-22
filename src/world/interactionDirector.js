const DEFAULT_TYPES=['pickup','door','portal','npc'];

function asArray(value){return value==null?null:(Array.isArray(value)?value:[value]);}

export function createInteractionDirector({
 player,
 registry,
 interactionState,
 getDropPosition=()=>player?.position?.clone?.()||player?.position||null,
 onFocusChange=()=>{},
 onAction=()=>{}
}={}){
 if(!player)throw new Error('Interaction director requires a player object');
 if(!registry?.nearest)throw new Error('Interaction director requires an interactable registry');
 if(!interactionState)throw new Error('Interaction director requires an interaction state controller');

 let focused=null;
 let enabled=true;

 function setFocus(next){
  const nextId=next?.id||null;
  const currentId=focused?.id||null;
  if(nextId===currentId){focused=next;return false;}
  const previous=focused;
  focused=next;
  onFocusChange({focused,previous});
  return true;
 }

 function updateFocus({types=DEFAULT_TYPES,maxDistance=3.5,predicate=null}={}){
  if(!enabled||interactionState.busy){setFocus(null);return null;}
  const next=registry.nearest(player.position,{types:asArray(types),maxDistance,predicate});
  setFocus(next);
  return focused;
 }

 function runPickup(entry,options={}){
  const target=entry?.object;
  if(!target)return false;
  return interactionState.pickup(target,{
   ...options,
   onAttach:object=>{
    entry.data?.onAttach?.(object,player);
    options.onAttach?.(object,player);
   }
  });
 }

 function runDoor(entry,options={}){
  const door=entry?.object;
  const controller=entry?.data?.doorController;
  if(!door)return false;
  if(door.userData?.isOpen){
   return interactionState.closeDoor(door,{
    ...options,
    onClose:target=>{
     controller?.close?.();
     entry.data?.onClose?.(target);
     options.onClose?.(target);
    }
   });
  }
  return interactionState.openDoor(door,{
   ...options,
   onOpen:target=>{
    controller?.open?.();
    entry.data?.onOpen?.(target);
    options.onOpen?.(target);
   }
  });
 }

 function runPortal(entry,options={}){
  const portal=entry?.data?.portal;
  const door=portal?.door||entry?.object;
  if(!portal||!door||!door.userData?.isOpen)return false;
  const inside=Boolean(entry.data?.inside);
  const action=inside?'exit':'enter';
  return interactionState[action](door,{
   ...options,
   onComplete:target=>{
    const moved=inside?portal.exit(player):portal.enter(player);
    if(moved)entry.data.inside=!inside;
    entry.data?.onPortal?.({action,moved,portal,player,target});
    options.onComplete?.({action,moved,portal,player,target});
   }
  });
 }

 function runNpc(entry,options={}){
  const controller=entry?.data?.gestureController;
  const gesture=options.gesture||entry?.data?.defaultGesture||'wave';
  if(!controller)return false;
  const played=controller.play?.(gesture)??controller[gesture]?.();
  entry.data?.onInteract?.({gesture,played,entry,player});
  return Boolean(played);
 }

 function interact(options={}){
  if(!enabled||interactionState.busy)return false;
  const entry=options.entry||focused||updateFocus(options.focus||{});
  if(!entry)return false;

  let result=false;
  if(entry.type==='pickup')result=runPickup(entry,options);
  else if(entry.type==='door')result=runDoor(entry,options);
  else if(entry.type==='portal')result=runPortal(entry,options);
  else if(entry.type==='npc')result=runNpc(entry,options);
  else result=entry.data?.interact?.({entry,player,interactionState,options})??false;

  onAction({entry,type:entry.type,result:Boolean(result)});
  if(result)setFocus(null);
  return Boolean(result);
 }

 function placeHeld(options={}){
  if(!interactionState.heldObject||interactionState.busy)return false;
  const position=options.position||getDropPosition(interactionState.heldObject);
  return interactionState.place({
   ...options,
   position,
   onDetach:(object,targetPosition)=>{
    options.onDetach?.(object,targetPosition);
    object?.userData?.onDetach?.(object,targetPosition,player);
   }
  });
 }

 function dropHeld(options={}){
  if(!interactionState.heldObject||interactionState.busy)return false;
  const position=options.position||getDropPosition(interactionState.heldObject);
  return interactionState.drop(position,options);
 }

 function update(delta,focusOptions={}){
  for(const entry of registry.all?.('door')||[]){entry.data?.doorController?.update?.(delta);}
  return updateFocus(focusOptions);
 }

 return {
  get focused(){return focused;},
  get enabled(){return enabled;},
  setEnabled(value){enabled=Boolean(value);if(!enabled)setFocus(null);},
  updateFocus,
  update,
  interact,
  placeHeld,
  dropHeld,
  clearFocus(){setFocus(null);}
 };
}
