function copyVector(target,value){
 if(!target||!value)return;
 if(typeof target.copy==='function')target.copy(value);
 else if(typeof target.set==='function')target.set(value.x||0,value.y||0,value.z||0);
}

export function createCarryAttachment({anchor,worldParent=null,defaultOffset=null,defaultRotation=null,onChange=()=>{}}={}){
 if(!anchor?.add)throw new Error('Carry attachment requires a THREE.Object3D-compatible anchor');
 const originalParents=new WeakMap();
 let held=null;

 function attach(object,{offset=defaultOffset,rotation=defaultRotation,scale=null}={}){
  if(!object||held||object===anchor)return false;
  originalParents.set(object,object.parent||worldParent||null);
  anchor.add(object);
  if(offset)copyVector(object.position,offset);
  if(rotation)copyVector(object.rotation,rotation);
  if(scale)copyVector(object.scale,scale);
  held=object;
  object.userData={...object.userData,isCarried:true};
  onChange({held,action:'attach',anchor});
  return true;
 }

 function detach(object=held,{parent=null,position=null,rotation=null,preserveWorld=true}={}){
  if(!object||object!==held)return false;
  const targetParent=parent||originalParents.get(object)||worldParent||null;
  if(targetParent){
   if(preserveWorld&&typeof targetParent.attach==='function')targetParent.attach(object);
   else targetParent.add?.(object);
  }else{
   object.removeFromParent?.();
  }
  if(position)copyVector(object.position,position);
  if(rotation)copyVector(object.rotation,rotation);
  object.userData={...object.userData,isCarried:false};
  originalParents.delete(object);
  held=null;
  onChange({held:null,action:'detach',object,parent:targetParent});
  return true;
 }

 function reset({preserveWorld=true}={}){
  if(!held)return false;
  return detach(held,{preserveWorld});
 }

 return {
  get held(){return held;},
  get occupied(){return Boolean(held);},
  attach,
  detach,
  reset
 };
}
