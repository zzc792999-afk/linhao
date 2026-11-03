'use strict';
const $ = s => document.querySelector(s);
const preview=document.body.dataset.mode==='preview';
const storage = {get(key,fallback){try{return JSON.parse(localStorage.getItem('class2501-'+key))??fallback}catch{return fallback}},set(key,value){try{localStorage.setItem('class2501-'+key,JSON.stringify(value));return true}catch{return false}}};
let toastTimer;
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3000)}
if(storage.get('dark',false))document.body.classList.add('dark');
$('#theme').addEventListener('click',()=>{document.body.classList.toggle('dark');storage.set('dark',document.body.classList.contains('dark'))});
async function api(path, options={}){
  const response=await fetch('/api'+path,{credentials:'same-origin',...options,headers:{'Content-Type':'application/json',...options.headers},signal:AbortSignal.timeout(20000)});
  const data=await response.json();if(!response.ok)throw new Error(data.error||'请求失败，请稍后重试');return data;
}
function errorMessage(error){return error.name==='TimeoutError'?'连接超时，请稍后重试':error instanceof TypeError?'连接失败，请检查网络后重试':error.message}
let likes=preview?storage.get('preview-likes',{}):{};
function renderLikes(){document.querySelectorAll('.like').forEach(button=>{const state=likes[button.dataset.person]||{count:0,liked:false};button.classList.toggle('active',state.liked);button.setAttribute('aria-pressed',String(state.liked));button.textContent=(state.liked?'♥ ':'♡ ')+state.count})}
function renderPeople(list){
  if(!Array.isArray(list)||!list.length)return;
  for(const p of list){
    const card=document.querySelector(`.person:has([data-person="${p.id}"])`)||document.querySelector(`.person [data-person="${p.id}"]`)?.closest('.person');
    if(!card)continue;
    const photoBtn=card.querySelector('.photo.open-photo');
    const img=card.querySelector('.photo img');
    const tag=card.querySelector('.person-meta .tag');
    const h3=card.querySelector('.person-meta h3');
    const desc=card.querySelector('.person-meta p');
    if(photoBtn){
      photoBtn.dataset.src=p.imageUrl||'assets/'+p.id+'.jpg';
      photoBtn.dataset.title=p.title||'';
      photoBtn.setAttribute('aria-label','查看'+(p.title||'同学')+'的照片');
    }
    if(img){
      img.src=p.imageUrl||'assets/'+p.id+'.jpg';
      img.alt=(p.title||'')+'的肖像';
    }
    if(tag)tag.textContent=p.tag||'CLASS SPOTLIGHT';
    if(h3)h3.textContent=p.title||'';
    if(desc)desc.textContent=p.description||'';
    let badgeSpan=card.querySelector('.photo-badge');
    if(p.badge&&p.badge.trim()){
      if(!badgeSpan){
        badgeSpan=document.createElement('span');
        photoBtn?.append(badgeSpan);
      }
      badgeSpan.className='photo-badge'+(p.badgeClass?' '+p.badgeClass:'');
      badgeSpan.textContent=p.badge.trim();
    }else if(badgeSpan){
      badgeSpan.remove();
    }
  }
  renderLikes();
}
document.querySelectorAll('.like').forEach(button=>{button.disabled=!preview;button.addEventListener('click',async()=>{if(preview){const person=button.dataset.person;const liked=!likes[person]?.liked;likes[person]={liked,count:liked?1:0};storage.set('preview-likes',likes);renderLikes();toast('点赞已记在这台设备上');return}button.disabled=true;try{const data=await api('/likes/'+button.dataset.person,{method:'PUT',body:JSON.stringify({liked:!likes[button.dataset.person]?.liked})});likes=data.likes;renderLikes()}catch(error){toast(errorMessage(error))}finally{button.disabled=false}})});
document.addEventListener('click',event=>{const button=event.target.closest('.open-photo');if(!button)return;$('#modal-img').src=button.dataset.src;$('#modal-img').alt=button.dataset.title;$('#modal-title').textContent=button.dataset.title;$('#lightbox').showModal()});
$('#close-modal').addEventListener('click',()=>$('#lightbox').close());
$('#lightbox').addEventListener('click',event=>{if(event.target===$('#lightbox'))$('#lightbox').close()});
let photos=[];
let photoSignature='';
const albumStatus=document.createElement('p');albumStatus.className='small-note';albumStatus.setAttribute('role','status');$('#album-grid').before(albumStatus);
function renderPhotos(){
  $('#album-count').textContent='青春相册 · '+(photos.length+3)+' 张照片';
  const signature=JSON.stringify(photos);if(signature===photoSignature)return;photoSignature=signature;
  document.querySelectorAll('.shared-photo').forEach(item=>item.remove());
  for(const photo of photos){
    const item=document.createElement('article');item.className='shared-photo';
    const button=document.createElement('button');button.className='album-tile open-photo';button.dataset.src='/api/photos/'+photo.id;button.dataset.title=photo.name;
    const img=document.createElement('img');img.src=button.dataset.src;img.alt=photo.name;img.loading='lazy';
    const caption=document.createElement('span');caption.textContent=photo.name+' ↗';button.append(img,caption);item.append(button);
    if(photo.mine){const remove=document.createElement('button');remove.className='delete-note';remove.textContent='删除我的照片';remove.addEventListener('click',async()=>{if(!confirm('确定删除这张照片？删除后所有人都将看不到。'))return;remove.disabled=true;try{const data=await api('/photos/'+photo.id,{method:'DELETE'});photos=data.photos;renderPhotos();toast('照片已删除')}catch(error){toast(errorMessage(error));remove.disabled=false}});item.append(remove)}
    $('#album-grid').append(item);
  }
}
async function preparePhoto(file){
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('请选择 JPG、PNG 或 WebP 照片');
  if(file.size>15*1024*1024)throw new Error('请选择小于 15MB 的图片');
  const url=URL.createObjectURL(file),img=new Image();
  try{img.src=url;await img.decode();const scale=Math.min(1,1600/img.naturalWidth,1600/img.naturalHeight);const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);return await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('图片处理失败')),'image/jpeg',0.82))}finally{URL.revokeObjectURL(url)}
}
$('#upload').addEventListener('change',async event=>{
  const input=event.target,files=Array.from(input.files);input.disabled=true;let count=0;
  try{for(let i=0;i<files.length;i++){
    albumStatus.textContent=`正在上传 ${i+1} / ${files.length}…`;
    try{const blob=await preparePhoto(files[i]);const data=await api('/photos?name='+encodeURIComponent(files[i].name),{method:'POST',headers:{'Content-Type':'image/jpeg'},body:blob});photos=data.photos;renderPhotos();count++}
    catch(error){albumStatus.textContent=errorMessage(error);toast(errorMessage(error));return}
  }if(count){albumStatus.textContent=`已上传 ${count} 张照片，所有人都能看到。`;toast(albumStatus.textContent)}}finally{input.disabled=false;input.value=''}
});

let notes=[];
function renderNotes(){$('#message-count').textContent=notes.length?'最新 '+notes.length+' 条留言':'还没有留言，来留下第一句话';const target=$('#notes');target.replaceChildren();if(!notes.length){const empty=document.createElement('p');empty.className='empty';empty.textContent='还没有留言。来贴上第一张青春便签吧。';target.append(empty);return}notes.forEach(note=>{const item=document.createElement('article');item.className='note';const head=document.createElement('div');head.className='note-header';const name=document.createElement('strong');name.textContent=note.name;const time=document.createElement('small');time.textContent=new Date(note.date).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});const text=document.createElement('p');text.textContent=note.text;if(/mj/i.test(note.text)){const mjPill=document.createElement('button');mjPill.type='button';mjPill.className='mj-note-pill';mjPill.textContent='🕷️ MJ';mjPill.title='点击召唤蜘蛛侠比心！';mjPill.addEventListener('click',e=>{e.stopPropagation();triggerSpiderMJ('来自同窗留言的 MJ 比心 🕷️')});text.append(mjPill)}head.append(name,time);item.append(head,text);if(note.mine){const remove=document.createElement('button');remove.className='delete-note';remove.textContent='删除我的留言';remove.addEventListener('click',async()=>{remove.disabled=true;try{const data=await api('/notes/'+note.id,{method:'DELETE'});notes=data.notes;renderNotes();toast('留言已删除')}catch(error){toast(errorMessage(error));remove.disabled=false}});item.append(remove)}target.append(item)})}
$('#message').addEventListener('input',()=>$('#char-count').textContent=$('#message').value.length+' / 200');
$('#message-form').addEventListener('submit',async event=>{event.preventDefault();const name=$('#nickname').value.trim(),text=$('#message').value.trim();if(!name||!text){toast('请填写昵称和留言内容');return}const button=event.submitter;button.disabled=true;button.textContent='正在发布…';try{const data=await api('/notes',{method:'POST',body:JSON.stringify({name,text})});notes=data.notes;renderNotes();$('#message').value='';$('#char-count').textContent='0 / 200';storage.set('nickname',name);toast('留言已发布，其他设备也能看到。');if(/mj/i.test(text)){setTimeout(()=>triggerSpiderMJ('留言暗号 · MJ 比心 🕷️'),300)}}catch(error){toast(errorMessage(error))}finally{button.disabled=false;button.textContent='贴上留言 ↗'}});
$('#nickname').value=storage.get('nickname','');
const status=document.createElement('div');status.className='sync-status';status.setAttribute('role','status');$('#notes').before(status);
let refreshing=false;
let classReady=false;
let lastActivity=Date.now();
async function refresh(){if(refreshing||document.hidden)return;refreshing=true;status.textContent='正在同步班级留言…';try{const data=await api('/state');notes=data.notes;likes=data.likes;photos=data.photos||[];renderNotes();renderLikes();renderPhotos();if(data.people)renderPeople(data.people);albumStatus.textContent=`共享相册 · 已上传 ${photos.length} 张 · 每 30 秒同步`;document.querySelectorAll('.like').forEach(button=>button.disabled=false);status.textContent='● 已连接 · 每 30 秒同步 · 展示最新 200 条留言';status.classList.remove('offline');classReady=true;window.dispatchEvent(new Event('class-synced'))}catch(error){status.replaceChildren(document.createTextNode('连接失败，留言暂未同步。'));status.classList.add('offline');const retry=document.createElement('button');retry.textContent='重新连接';retry.addEventListener('click',refresh);status.append(retry)}finally{refreshing=false}}
if(preview){
  $('#upload').disabled=true;albumStatus.textContent='当前为静态展示版，请打开班级网站正式网址上传共享照片。';
  renderLikes();
  status.textContent='留言区暂未开放 · 当前点赞仅保存在本设备';
  for(const input of $('#message-form').querySelectorAll('input,textarea,button'))input.disabled=true;
  $('#message-form').querySelector('button').textContent='留言区即将开放';
  $('#message').placeholder='先逛逛我们的班级，留言区稍后和大家见面。';
}else if(location.protocol==='file:'){
  status.textContent='共享留言需要服务器，请先打开网站展示版。';$('#upload').disabled=true;
  $('#message-form').querySelector('button').disabled=true;
}else{
  refresh();
  setInterval(()=>{if(Date.now()-lastActivity<120000)refresh();else if(!document.hidden)status.textContent='● 已连接 · 暂停空闲同步，操作页面后恢复'},30000);
  for(const event of ['pointerdown','keydown','scroll'])window.addEventListener(event,()=>{const paused=Date.now()-lastActivity>=120000;lastActivity=Date.now();if(paused)refresh()},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){lastActivity=Date.now();refresh()}});
}
function openPublicSection(hash){
  if(!hash)return;
  const rawId=hash.replace(/^#/,'');
  const foldMap={'album':'album-fold','messages':'messages-fold','class-tools':'class-tools','class-hub':'class-tools','class-board':'class-tools'};
  const targetFoldId=foldMap[rawId];
  if(targetFoldId){
    const f=document.getElementById(targetFoldId);
    if(f)f.open=true;
  }
  const el=document.getElementById(rawId);
  if(el){
    const d=el.closest('details');
    if(d)d.open=true;
  }
}
openPublicSection(location.hash);
window.addEventListener('hashchange',()=>openPublicSection(location.hash));

let isNavigating = false;
let navTimer = null;

function navigateToHash(href) {
  if (!href || href === '#' || href === '#0') return;
  const targetId = href.replace(/^#/, '');
  openPublicSection(href);

  const target = document.getElementById(targetId) || document.querySelector(href);
  if (!target) return;

  isNavigating = true;
  clearTimeout(navTimer);
  navTimer = setTimeout(() => { isNavigating = false; }, 900);

  if (window.updateActiveNav) {
    window.updateActiveNav(targetId);
  }

  const doScroll = () => {
    const navBar = document.getElementById('sticky-category-bar');
    const offset = navBar ? (navBar.offsetHeight + 10) : 55;
    const targetTop = target.getBoundingClientRect().top + window.scrollY - offset;

    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior: 'smooth'
    });

    if (history.replaceState) {
      history.replaceState(null, '', href);
    }
  };

  requestAnimationFrame(() => {
    setTimeout(doScroll, 20);
  });
}

// User manual touch/wheel immediately unlocks navigation lock
window.addEventListener('touchstart', () => { isNavigating = false; }, { passive: true });
window.addEventListener('wheel', () => { isNavigating = false; }, { passive: true });

document.addEventListener('click', event => {
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;
  const href = link.getAttribute('href');
  if (!href || href === '#' || href === '#0') return;
  event.preventDefault();
  navigateToHash(href);
});

const backToTopBtn = document.getElementById('back-to-top-btn');
if (backToTopBtn) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 250) backToTopBtn.classList.add('visible');
    else backToTopBtn.classList.remove('visible');
  }, { passive: true });
  backToTopBtn.addEventListener('click', () => {
    isNavigating = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => { isNavigating = false; }, 600);
  });
}

(function initNavScrollSpy() {
  const sectionIds = [
    'home', 'mobile-portals', 'arcade', 'people', 'mascots',
    'album', 'messages', 'class-film', 'playground',
    'social-area', 'teachers', 'targets', 'class-tools'
  ];
  const sections = sectionIds.map(id => document.getElementById(id)).filter(Boolean);
  if (!sections.length || !('IntersectionObserver' in window)) return;

  const categoryPills = document.querySelectorAll('.category-pill[data-nav-target]');
  const bottomNavItems = document.querySelectorAll('.bottom-nav-item[data-bottom-target]');
  const track = document.getElementById('category-scroll-track');

  window.updateActiveNav = function(activeId) {
    if (!activeId) return;
    const targetKey = activeId === 'mobile-portals' ? 'home' : activeId;

    categoryPills.forEach(pill => {
      const match = pill.dataset.navTarget === targetKey;
      pill.classList.toggle('active', match);
      if (match && track) {
        // ONLY scroll track horizontally if pill is outside the visible track!
        // NEVER call pill.scrollIntoView() which scrolls the whole window!
        const pillLeft = pill.offsetLeft;
        const pillRight = pillLeft + pill.offsetWidth;
        const sLeft = track.scrollLeft;
        const cWidth = track.clientWidth;
        if (pillLeft < sLeft + 15 || pillRight > sLeft + cWidth - 15) {
          track.scrollTo({
            left: Math.max(0, pillLeft - (cWidth / 2) + (pill.offsetWidth / 2)),
            behavior: 'smooth'
          });
        }
      }
    });

    const bottomMap = {
      'home': 'home',
      'mobile-portals': 'home',
      'arcade': 'arcade',
      'targets': 'targets',
      'teachers': 'teachers',
      'messages': 'messages',
      'album': 'messages'
    };
    const bottomKey = bottomMap[activeId] || '';
    if (bottomKey) {
      bottomNavItems.forEach(item => {
        item.classList.toggle('active', item.dataset.bottomTarget === bottomKey);
      });
    }
  };

  const observer = new IntersectionObserver((entries) => {
    if (isNavigating) return;
    const visible = entries.filter(e => e.isIntersecting);
    if (!visible.length) return;
    // Pick the entry closest to top of viewport
    visible.sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top));
    window.updateActiveNav(visible[0].target.id);
  }, { rootMargin: '-10% 0px -65% 0px', threshold: 0 });

  sections.forEach(sec => observer.observe(sec));
})();


// ========================================================
// MJ Spider-Man Easter Egg (抖音同款倒挂比心特效)
// ========================================================
let isSpiderMJRunning = false;
const spiderPhrases = [
  '25计1 · MJ 比心 💕',
  '代码无 BUG · 青春不设限 ✨',
  '蜘蛛侠专属守护 · 快乐加倍 🕷️',
  '期末全过 · 顶峰相见 🎓',
  '心之所向 · 一起发光 🌟'
];

function playSpiderThwip() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') ctx.resume();

    // 1. Thwip sound (white noise + filter)
    const dur = 0.12;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.04));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(3000, ctx.currentTime + 0.1);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();

    // 2. Chime sound after spider hangs down (0.6s)
    setTimeout(() => {
      try {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
        oscGain.gain.setValueAtTime(0.2, ctx.currentTime);
        oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(oscGain);
        oscGain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } catch (_) {}
    }, 600);
  } catch (_) {}
}

function triggerSpiderMJ(customText) {
  if (isSpiderMJRunning) return;
  isSpiderMJRunning = true;

  playSpiderThwip();

  const phrase = customText || spiderPhrases[Math.floor(Math.random() * spiderPhrases.length)];

  const overlay = document.createElement('div');
  overlay.className = 'spider-mj-overlay';
  overlay.id = 'spider-mj-overlay';

  const rig = document.createElement('div');
  rig.className = 'spider-mj-rig';
  rig.title = '点击蜘蛛侠，多爆几颗爱心！';

  rig.innerHTML = `
    <svg class="spider-mj-svg" viewBox="0 0 200 320" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="倒挂比心蜘蛛侠">
      <line x1="100" y1="0" x2="100" y2="120" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" opacity="0.9" />
      <line x1="100" y1="0" x2="100" y2="120" stroke="#cbd5e1" stroke-width="5" stroke-linecap="round" opacity="0.3" />

      <path d="M100 110 C80 90 60 115 72 140 C80 156 90 170 96 185" stroke="#1e40af" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M100 110 C120 90 140 115 128 140 C120 156 110 170 104 185" stroke="#1e40af" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M100 108 C86 98 76 112 73 125" stroke="#e11d48" stroke-width="14" stroke-linecap="round" />
      <path d="M100 108 C114 98 124 112 127 125" stroke="#e11d48" stroke-width="14" stroke-linecap="round" />

      <path d="M88 180 C82 195 82 210 85 224 C90 232 110 232 115 224 C118 210 118 195 112 180 Z" fill="#e11d48" stroke="#be123c" stroke-width="1.5" />
      <path d="M86 185 C83 198 83 212 85 224 C89 224 93 218 93 205 C93 192 90 185 86 185 Z" fill="#1e40af" />
      <path d="M114 185 C117 198 117 212 115 224 C111 224 107 218 107 205 C107 192 110 185 114 185 Z" fill="#1e40af" />
      <line x1="100" y1="180" x2="100" y2="228" stroke="#881337" stroke-width="1.2" opacity="0.65" />
      <path d="M88 198 Q100 190 112 198" stroke="#881337" stroke-width="1.2" fill="none" opacity="0.65" />
      <path d="M89 212 Q100 204 111 212" stroke="#881337" stroke-width="1.2" fill="none" opacity="0.65" />
      <ellipse cx="100" cy="202" rx="2.5" ry="3.5" fill="#0f172a" />
      <path d="M98 200 Q94 195 91 199 M102 200 Q106 195 109 199 M98 204 Q93 208 90 205 M102 204 Q107 208 110 205" stroke="#0f172a" stroke-width="1" fill="none" />

      <path d="M85 228 C76 242 78 266 92 276 C97 280 103 280 108 276 C122 266 124 242 115 228 C108 220 92 220 85 228 Z" fill="#e11d48" stroke="#be123c" stroke-width="1.5" />
      <line x1="100" y1="222" x2="100" y2="279" stroke="#881337" stroke-width="1.2" opacity="0.65" />
      <path d="M86 238 Q100 246 114 238" stroke="#881337" stroke-width="1.2" fill="none" opacity="0.65" />
      <path d="M85 256 Q100 266 115 256" stroke="#881337" stroke-width="1.2" fill="none" opacity="0.65" />

      <path d="M87 242 Q96 247 98 259 Q89 256 85 249 Z" fill="#ffffff" stroke="#0f172a" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M113 242 Q104 247 102 259 Q111 256 115 249 Z" fill="#ffffff" stroke="#0f172a" stroke-width="2.5" stroke-linejoin="round" />

      <path d="M85 222 C70 230 68 250 82 264 C88 268 95 264 98 258" stroke="#e11d48" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      <path d="M115 222 C130 230 132 250 118 264 C112 268 105 264 102 258" stroke="#e11d48" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none" />

      <g class="spider-heart">
        <path d="M100 272 C100 272 68 248 68 228 C68 214 80 204 92 214 C97 218 100 223 100 223 C100 223 103 218 108 214 C120 204 132 214 132 228 C132 248 100 272 100 272 Z" fill="url(#spiderHeartGrad)" filter="url(#spiderHeartGlow)" />
        <path d="M76 226 C76 218 82 213 88 217" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.75" fill="none" />
      </g>

      <defs>
        <linearGradient id="spiderHeartGrad" x1="68" y1="208" x2="132" y2="272" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ff3366" />
          <stop offset="100%" stop-color="#c2002f" />
        </linearGradient>
        <filter id="spiderHeartGlow" x="50" y="190" width="100" height="100" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="6" flood-color="#ff1744" flood-opacity="0.8" />
        </filter>
      </defs>
    </svg>
    <div class="spider-mj-badge">
      <span>🕷️</span>
      <span>${phrase}</span>
    </div>
  `;

  // Click interaction on spider
  const emojis = ['💖', '💕', '✨', '🕷️', '❤️', '🌟'];
  rig.addEventListener('click', (e) => {
    e.stopPropagation();
    for (let i = 0; i < 8; i++) {
      const p = document.createElement('div');
      p.className = 'spider-heart-particle';
      p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      const angle = (Math.PI * 2 / 8) * i + (Math.random() * 0.4 - 0.2);
      const dist = 55 + Math.random() * 65;
      p.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
      p.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
      p.style.left = '90px';
      p.style.top = '240px';
      rig.appendChild(p);
      setTimeout(() => p.remove(), 1100);
    }
  });

  overlay.appendChild(rig);
  document.body.appendChild(overlay);

  // Auto clean-up after 3.8s
  setTimeout(() => {
    overlay.remove();
    isSpiderMJRunning = false;
  }, 3800);
}
window.triggerSpiderMJ = triggerSpiderMJ;

// Keyboard trigger (typing 'm' then 'j' on PC)
let keyBuffer = '';
let keyTimer = null;
window.addEventListener('keydown', (e) => {
  const targetTag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
  if (targetTag === 'input' || targetTag === 'textarea' || e.target.isContentEditable) return;
  if (e.key && e.key.length === 1) {
    keyBuffer += e.key.toLowerCase();
    clearTimeout(keyTimer);
    keyTimer = setTimeout(() => { keyBuffer = ''; }, 1200);
    if (keyBuffer.endsWith('mj')) {
      keyBuffer = '';
      triggerSpiderMJ('按键暗号 · 蜘蛛侠空降！🕷️');
    }
  }
});

// Double tap/click on Logo to trigger
let lastLogoTap = 0;
const logoEl = document.querySelector('header .logo');
if (logoEl) {
  logoEl.addEventListener('click', (e) => {
    const now = Date.now();
    if (now - lastLogoTap < 400) {
      e.preventDefault();
      triggerSpiderMJ('25计算机1 · 专属守护 💕');
      lastLogoTap = 0;
    } else {
      lastLogoTap = now;
    }
  });
}
