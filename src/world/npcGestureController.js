const DEFAULT_GESTURES=['idle','wave','talk','point'];

export function createNpcGestureController({controller=null,onGesture=()=>{}}={}){
 let current='idle';
 let lockedUntil=0;

 function canPlay(){return performance.now()>=lockedUntil}

 function play(name,{duration=1200,loop=false}={}){
  if(!DEFAULT_GESTURES.includes(name)||!canPlay())return false;
  const played=controller?.playGesture?.(name,{loop})??false;
  current=name;
  lockedUntil=performance.now()+Math.max(0,duration);
  onGesture({name,played});
  return played;
 }

 return {
  get current(){return current},
  get busy(){return !canPlay()},
  setController(next){controller=next},
  wave(options){return play('wave',{duration:1100,...options})},
  talk(options){return play('talk',{duration:1600,loop:true,...options})},
  point(options){return play('point',{duration:1000,...options})},
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
   controller?.playGesture?.('idle',{loop:true});
   onGesture({name:'idle',played:true});
  }
 };
}
