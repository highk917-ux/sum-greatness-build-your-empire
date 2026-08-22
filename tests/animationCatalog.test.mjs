import test from 'node:test';
import assert from 'node:assert/strict';
import {animationCatalogReport,buildAnimationCatalog,findBestClip,normalizeClipName} from '../src/character/animationCatalog.js';

const clip=name=>({name,duration:1});

test('normalizes Blender and Mixamo-style clip names',()=>{
 assert.equal(normalizeClipName('Armature|Idle_Breathing'),'armature idle breathing');
 assert.equal(normalizeClipName('mixamo.com|Walking-Forward'),'mixamo com walking forward');
 assert.equal(normalizeClipName('TurnLeft'),'turn left');
});

test('maps common exported animation names to gameplay states',()=>{
 const animations=[
  clip('Armature|Idle_Breathing'),
  clip('mixamo.com|Walking'),
  clip('Founder_Run'),
  clip('TurnLeft'),
  clip('TurnRight'),
  clip('Pickup_Object'),
  clip('Carry_Loop'),
  clip('Door_Open'),
  clip('Door_Close'),
  clip('Wave_Greeting')
 ];
 const catalog=buildAnimationCatalog(animations);
 assert.equal(catalog.idle.name,'Armature|Idle_Breathing');
 assert.equal(catalog.walk.name,'mixamo.com|Walking');
 assert.equal(catalog.run.name,'Founder_Run');
 assert.equal(catalog.turnLeft.name,'TurnLeft');
 assert.equal(catalog.turnRight.name,'TurnRight');
 assert.equal(catalog.pickup.name,'Pickup_Object');
 assert.equal(catalog.carry.name,'Carry_Loop');
 assert.equal(catalog.openDoor.name,'Door_Open');
 assert.equal(catalog.closeDoor.name,'Door_Close');
 assert.equal(catalog.wave.name,'Wave_Greeting');
});

test('prefers an exact semantic state over a weaker substring match',()=>{
 const animations=[clip('Founder_Idle_To_Walk'),clip('Walking')];
 assert.equal(findBestClip(animations,'walk').name,'Walking');
});

test('report identifies missing required states without throwing',()=>{
 const report=animationCatalogReport([clip('Idle'),clip('Walk')]);
 assert.equal(report.clipCount,2);
 assert.equal(report.mapped.idle,'Idle');
 assert.equal(report.mapped.walk,'Walk');
 assert.ok(report.missing.includes('run'));
 assert.ok(report.missing.includes('pickup'));
});
