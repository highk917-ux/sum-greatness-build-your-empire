const DEFAULT_GESTURES=['idle','wave','talk','point'];

export function createNpcGestureController({controller=null,onGesture=()=>{}}={}){
 let current='idle';
 let lockedUntil=0;

 function canPlay(){return performance.now()>=lockedUntil}

 function durationFor(name,fallback){
  const seconds=controller?.getAnimationDuration?.(name);
  return Number.isFinite(seconds)&&seconds>0?Math.round(seconds*1000):fallback;
 }

 function play(name,{duration,loop=false,force=false}={}){
  if(!DEFAULT_GESTURES.includes(name)||(!force&&!canPlay()))return false;
  const fallback=name==='talk'?1600:name==='wave'?1100:name==='point'?1000:500;
  const resolvedDuration=duration??durationFor(name,fallback);
  const played=controller?.playGesture?.(name,{loop})??false;
  if(!played){onGesture({name,played:false,reason:'clip-unavailable'});return false}
  current=name;
  lockedUntil=loop?Infinity:performance.now()+Math.max(0,resolvedDuration);
  onGesture({name,played:true,duration:resolvedDuration,loop});
  return true;
 }

 return {
  get current(){return current},
  get busy(){return !canPlay()},
  setController(next){controller=next},
  hasGesture(name){return DEFAULT_GESTURES.includes(name)&&Boolean(controller?.hasAnimation?.(name))},
  wave(options){return play('wave',options)},
  talk(options){return play('talk',{loop:true,...options})},
  point(options){return play('point',options)},
  idle(){
   current='idle';
   lockedUntil=0;
   const played=controller?.playGesture?.('idle',{loop:true})??false;
   onGesture({name:'idle',played});
   return played;
  },
  endConversation(){
   current='idle';
   lockedUntil=0;
   const played=controller?.playGesture?.('idle',{loop:true})??false;
   onGesture({name:'idle',played});
   return played;
  },
  cancel(){
   current='idle';
   lockedUntil=0;
   return true;
  }
 };
}
