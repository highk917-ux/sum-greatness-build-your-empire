const SAVE_KEY='sum-greatness-save-v1';
const panel=document.querySelector('#panel');

function readAvatar(){
 try{
  const saved=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}');
  return {
   playerName:saved.playerName||'Founder',
   style:saved.avatar?.style||'Executive',
   outfit:saved.avatar?.outfit||'Midnight Gold',
   skin:saved.avatar?.skin||'#7b4b34'
  };
 }catch{
  return {playerName:'Founder',style:'Executive',outfit:'Midnight Gold',skin:'#7b4b34'};
 }
}

function avatarIcon(style){
 if(style==='Street Founder')return '🧢';
 if(style==='Boss')return '👩🏾‍💼';
 return '🕴🏾';
}

function enhanceProfile(){
 if(!panel?.classList.contains('open'))return;
 if(!panel.querySelector('[data-avatar]'))return;
 const avatar=readAvatar();
 let preview=panel.querySelector('[data-profile-avatar-preview]');
 if(!preview){
  preview=document.createElement('section');
  preview.dataset.profileAvatarPreview='true';
  preview.className='sg-profile-preview';
  const characterStudio=[...panel.querySelectorAll('h3')].find(h=>h.textContent?.trim()==='Character Studio');
  panel.insertBefore(preview,characterStudio||panel.firstChild?.nextSibling||null);
 }
 preview.innerHTML=`
  <div class="sg-profile-avatar" style="--avatar-skin:${avatar.skin}" aria-label="Current selected avatar ${avatar.style}">
   <span>${avatarIcon(avatar.style)}</span>
  </div>
  <div class="sg-profile-avatar-copy">
   <small>CURRENT AVATAR</small>
   <strong>${avatar.playerName} · ${avatar.style}</strong>
   <span>${avatar.outfit}</span>
   <p>Selected game avatar preview. Final face and body likeness stays tied to approved reference assets.</p>
  </div>`;
 panel.querySelectorAll('[data-avatar]').forEach(button=>{
  button.classList.toggle('selected-avatar',button.dataset.avatar===avatar.style);
 });
}

const style=document.createElement('style');
style.textContent=`
.sg-profile-preview{display:flex;align-items:center;gap:16px;margin:12px 0 18px;padding:14px;background:linear-gradient(135deg,#15120d,#090a0c);border:1px solid rgba(231,184,79,.55);border-left:4px solid var(--gold);min-height:116px}
.sg-profile-avatar{width:92px;height:92px;flex:0 0 92px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 50% 30%,var(--avatar-skin) 0 28%,#17191c 29% 68%,#050607 69%);border:3px solid var(--gold);box-shadow:0 0 0 3px #000,0 6px 18px #0009}
.sg-profile-avatar span{font-size:48px;filter:drop-shadow(0 2px 3px #000)}
.sg-profile-avatar-copy{min-width:0}.sg-profile-avatar-copy small{display:block;color:var(--gold);font-weight:900;letter-spacing:1.4px}.sg-profile-avatar-copy strong{display:block;margin:4px 0;font-size:18px}.sg-profile-avatar-copy span{display:block;color:#ddd;font-size:12px}.sg-profile-avatar-copy p{margin:7px 0 0;color:#aaa;font-size:10px;line-height:1.4}
.panel button.selected-avatar{border-color:var(--gold);box-shadow:0 0 0 2px rgba(231,184,79,.35) inset;color:var(--gold)}
@media(orientation:landscape) and (max-height:600px){.sg-profile-preview{min-height:82px;padding:8px;gap:10px}.sg-profile-avatar{width:66px;height:66px;flex-basis:66px}.sg-profile-avatar span{font-size:34px}.sg-profile-avatar-copy strong{font-size:13px}.sg-profile-avatar-copy p{font-size:8px;margin-top:4px}}
`;
document.head.appendChild(style);

if(panel){
 const observer=new MutationObserver(()=>queueMicrotask(enhanceProfile));
 observer.observe(panel,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
 document.addEventListener('click',event=>{
  if(event.target.closest('[data-avatar],[data-skin],[data-outfit],[data-panel="profile"]'))setTimeout(enhanceProfile,0);
 });
}
