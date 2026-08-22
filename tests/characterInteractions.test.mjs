import test from 'node:test';
import assert from 'node:assert/strict';
import { createInteractionState } from '../src/character/interactionState.js';
import { createInteractableRegistry } from '../src/world/interactableRegistry.js';
import { createInteractionDirector } from '../src/world/interactionDirector.js';

const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const point=(x=0,y=0,z=0)=>({
 x,y,z,
 copy(other){this.x=other.x;this.y=other.y;this.z=other.z;return this},
 clone(){return point(this.x,this.y,this.z)}
});
const objectAt=(x=0,y=0,z=0)=>({position:point(x,y,z),userData:{}});

function fakePlayerController(){
 const calls=[];
 return {
  calls,
  playInteraction(name){calls.push(['play',name]);return true},
  getAnimationDuration(){return .02},
  setCarry(active){calls.push(['carry',Boolean(active)]);return true}
 };
}

test('registry chooses the nearest enabled interactable inside its radius',()=>{
 const registry=createInteractableRegistry();
 const near=objectAt(1,0,0),far=objectAt(2.5,0,0),disabled=objectAt(.25,0,0);
 registry.register(near,{id:'near',type:'pickup',radius:3});
 registry.register(far,{id:'far',type:'pickup',radius:3});
 registry.register(disabled,{id:'disabled',type:'pickup',radius:3,enabled:false});
 assert.equal(registry.nearest(point(),{types:'pickup',maxDistance:4})?.id,'near');
 registry.setEnabled('near',false);
 assert.equal(registry.nearest(point(),{types:'pickup',maxDistance:4})?.id,'far');
 assert.equal(registry.nearest(point(),{types:'door',maxDistance:4}),null);
});

test('pickup transitions into carry and place returns to idle',async()=>{
 const playerController=fakePlayerController();
 const states=[];
 const interaction=createInteractionState({playerController,onStateChange:event=>states.push(event.state)});
 const crate=objectAt(1,0,0);
 let attached=false,detached=false;
 assert.equal(interaction.pickup(crate,{duration:20,onAttach:()=>{attached=true}}),true);
 await sleep(30);
 assert.equal(attached,true);
 assert.equal(interaction.heldObject,crate);
 assert.equal(interaction.state,'carry');
 assert.equal(interaction.place({position:point(4,0,5),duration:20,onDetach:()=>{detached=true}}),true);
 await sleep(30);
 assert.equal(detached,true);
 assert.equal(interaction.heldObject,null);
 assert.equal(interaction.state,'idle');
 assert.deepEqual([crate.position.x,crate.position.z],[4,5]);
 assert.ok(states.includes('pickup'));
 assert.ok(states.includes('carry'));
 assert.ok(states.includes('place'));
});

test('cancel prevents a pending pickup from attaching later',async()=>{
 const interaction=createInteractionState({playerController:fakePlayerController()});
 const crate=objectAt(1,0,0);
 let attached=false;
 assert.equal(interaction.pickup(crate,{duration:80,onAttach:()=>{attached=true}}),true);
 interaction.cancel('test-cancel');
 await sleep(90);
 assert.equal(attached,false);
 assert.equal(interaction.heldObject,null);
 assert.equal(interaction.state,'idle');
});

test('door interaction opens then closes through the director',async()=>{
 const player={position:point()};
 const registry=createInteractableRegistry();
 const interaction=createInteractionState({playerController:fakePlayerController()});
 const door=objectAt(1,0,0);
 const controllerCalls=[];
 registry.register(door,{id:'front-door',type:'door',radius:3,data:{doorController:{open:()=>controllerCalls.push('open'),close:()=>controllerCalls.push('close'),update:()=>{}}}});
 const director=createInteractionDirector({player,registry,interactionState:interaction});
 assert.equal(director.updateFocus()?.id,'front-door');
 assert.equal(director.interact({duration:20}),true);
 await sleep(30);
 assert.equal(door.userData.isOpen,true);
 assert.deepEqual(controllerCalls,['open']);
 director.updateFocus();
 assert.equal(director.interact({duration:20}),true);
 await sleep(30);
 assert.equal(door.userData.isOpen,false);
 assert.deepEqual(controllerCalls,['open','close']);
});

test('portal only runs while its door is open and toggles inside state',async()=>{
 const player={position:point()};
 const registry=createInteractableRegistry();
 const interaction=createInteractionState({playerController:fakePlayerController()});
 const door=objectAt(1,0,0);
 const portal={door,enter:()=>true,exit:()=>true};
 const entry=registry.register(door,{id:'shop-portal',type:'portal',radius:3,data:{portal,inside:false}});
 const director=createInteractionDirector({player,registry,interactionState:interaction});
 director.updateFocus();
 assert.equal(director.interact({duration:20}),false);
 door.userData.isOpen=true;
 director.updateFocus();
 assert.equal(director.interact({duration:20}),true);
 await sleep(30);
 assert.equal(entry.data.inside,true);
 director.updateFocus();
 assert.equal(director.interact({duration:20}),true);
 await sleep(30);
 assert.equal(entry.data.inside,false);
});
