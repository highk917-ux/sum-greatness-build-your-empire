function distanceSquared(a,b){
 const dx=(a?.x||0)-(b?.x||0),dy=(a?.y||0)-(b?.y||0),dz=(a?.z||0)-(b?.z||0);
 return dx*dx+dy*dy+dz*dz;
}

export function createInteractableRegistry(){
 const entries=new Map();

 function register(object,{id,type='generic',radius=3,enabled=true,data={}}={}){
  if(!object)throw new Error('Interactable object is required');
  const key=id||object.uuid||`interactable-${entries.size+1}`;
  const entry={id:key,object,type,radius:Math.max(.1,radius),enabled:Boolean(enabled),data:{...data}};
  entries.set(key,entry);
  object.userData={...object.userData,interactableId:key,interactableType:type};
  return entry;
 }

 function unregister(target){
  const key=typeof target==='string'?target:target?.userData?.interactableId||target?.uuid;
  if(!key)return false;
  return entries.delete(key);
 }

 function setEnabled(target,enabled=true){
  const key=typeof target==='string'?target:target?.userData?.interactableId||target?.uuid;
  const entry=entries.get(key);
  if(!entry)return false;
  entry.enabled=Boolean(enabled);
  return true;
 }

 function nearest(position,{types=null,maxDistance=Infinity,predicate=null}={}){
  const allowed=types?new Set(Array.isArray(types)?types:[types]):null;
  let best=null,bestDistanceSquared=maxDistance*maxDistance;
  for(const entry of entries.values()){
   if(!entry.enabled||!entry.object?.position)continue;
   if(allowed&&!allowed.has(entry.type))continue;
   if(predicate&&!predicate(entry))continue;
   const d2=distanceSquared(position,entry.object.position);
   const allowedDistance=Math.min(maxDistance,entry.radius);
   if(d2<=allowedDistance*allowedDistance&&d2<bestDistanceSquared){
    best=entry;
    bestDistanceSquared=d2;
   }
  }
  return best?{...best,distance:Math.sqrt(bestDistanceSquared)}:null;
 }

 function byId(id){return entries.get(id)||null}
 function all(type=null){return [...entries.values()].filter(entry=>!type||entry.type===type)}
 function clear(){entries.clear()}

 return {register,unregister,setEnabled,nearest,byId,all,clear,get size(){return entries.size}};
}
