const STATE_ALIASES={
 idle:['idle','breath','breathing','stand','standing'],
 walk:['walk','walking'],
 run:['run','running','jog','jogging','sprint','sprinting'],
 stop:['stop','stopping','brake','braking'],
 turnLeft:['turn left','left turn','turnleft'],
 turnRight:['turn right','right turn','turnright'],
 pickup:['pick up','pickup','lift','grab'],
 carry:['carry','carrying','hold','holding'],
 place:['place','put down','putdown','drop'],
 openDoor:['open door','door open','opendoor'],
 closeDoor:['close door','door close','closedoor'],
 enter:['enter','walk in','walkin'],
 exit:['exit','walk out','walkout'],
 wave:['wave','waving','greet','greeting'],
 talk:['talk','talking','speak','speaking','conversation'],
 point:['point','pointing','gesture']
};

export const LOOPING_ANIMATION_STATES=new Set(['idle','walk','run','carry','talk']);

export function normalizeClipName(name=''){
 return String(name)
  .replace(/[_\-.|:]+/g,' ')
  .replace(/([a-z])([A-Z])/g,'$1 $2')
  .replace(/\s+/g,' ')
  .trim()
  .toLowerCase();
}

function scoreAlias(normalized,alias){
 if(normalized===alias)return 100;
 if(normalized.endsWith(` ${alias}`)||normalized.startsWith(`${alias} `))return 80;
 if(normalized.includes(` ${alias} `))return 70;
 if(normalized.includes(alias))return 40;
 return 0;
}

export function findBestClip(animations=[],state){
 const aliases=STATE_ALIASES[state]||[];
 let best=null;
 let bestScore=0;
 for(const clip of animations){
  const normalized=normalizeClipName(clip?.name);
  for(const alias of aliases){
   const score=scoreAlias(normalized,alias);
   if(score>bestScore){best=clip;bestScore=score}
  }
 }
 return best;
}

export function buildAnimationCatalog(animations=[]){
 return Object.fromEntries(Object.keys(STATE_ALIASES).map(state=>[state,findBestClip(animations,state)]));
}

export function animationCatalogReport(animations=[],catalog=buildAnimationCatalog(animations)){
 return {
  clipCount:animations.length,
  names:animations.map(clip=>clip?.name||''),
  mapped:Object.fromEntries(Object.entries(catalog).map(([state,clip])=>[state,clip?.name||null])),
  missing:Object.keys(catalog).filter(state=>!catalog[state])
 };
}
