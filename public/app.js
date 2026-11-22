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
function updateMagazineFeed(){
  const previewText = document.getElementById('mag-preview-text');
  if (previewText && notes && notes.length > 0) {
    const latest = notes[notes.length - 1];
    previewText.textContent = (latest.name ? latest.name + '：' : '') + latest.text;
  }
}
function renderNotes(){updateMagazineFeed();$('#message-count').textContent=notes.length?'最新 '+notes.length+' 条留言':'还没有留言，来留下第一句话';const target=$('#notes');target.replaceChildren();if(!notes.length){const empty=document.createElement('p');empty.className='empty';empty.textContent='还没有留言。来贴上第一张青春便签吧。';target.append(empty);return}notes.forEach(note=>{const item=document.createElement('article');item.className='note';const head=document.createElement('div');head.className='note-header';const name=document.createElement('strong');name.textContent=note.name;const time=document.createElement('small');time.textContent=new Date(note.date).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});const text=document.createElement('p');text.textContent=note.text;if(/mj/i.test(note.text)){const mjPill=document.createElement('button');mjPill.type='button';mjPill.className='mj-note-pill';mjPill.textContent='🕷️ MJ';mjPill.title='点击召唤蜘蛛侠比心！';mjPill.addEventListener('click',e=>{e.stopPropagation();triggerSpiderMJ('来自同窗留言的 MJ 比心 🕷️')});text.append(mjPill)}head.append(name,time);item.append(head,text);if(note.mine){const remove=document.createElement('button');remove.className='delete-note';remove.textContent='删除我的留言';remove.addEventListener('click',async()=>{remove.disabled=true;try{const data=await api('/notes/'+note.id,{method:'DELETE'});notes=data.notes;renderNotes();toast('留言已删除')}catch(error){toast(errorMessage(error));remove.disabled=false}});item.append(remove)}target.append(item)})}
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
const quietScroll = matchMedia('(prefers-reduced-motion: reduce)');
let isNavigating = false;
let navTimer;
function openPublicSection(hash) {
  let id;
  try { id = decodeURIComponent(hash.slice(1)); } catch { return null; }
  const target = document.getElementById(id);
  if (!target) return null;
  const folds = {'album':'album-fold','messages':'messages-fold'};
  const inner = document.getElementById(folds[id] || '');
  if (inner) inner.open = true;
  for (let node = target; node; node = node.parentElement) {
    if (node instanceof HTMLDetailsElement) node.open = true;
  }
  return target;
}
function navigateToHash(href, options = {}) {
  const target = openPublicSection(href);
  if (!target) return false;
  if (options.write !== false && location.hash !== href) history.pushState(null,'',href);
  isNavigating = true;
  clearTimeout(navTimer);
  navTimer = setTimeout(() => { isNavigating = false; }, 600);
  window.updateActiveNav?.(target.id);
  requestAnimationFrame(() => {
    if (options.focus) {
      const focusTarget = target.querySelector(':scope > summary') || target;
      if (!focusTarget.matches('summary,[tabindex]')) focusTarget.tabIndex = -1;
      focusTarget.focus({preventScroll:true});
    }
    const navHeight = document.getElementById('sticky-category-bar')?.offsetHeight || 56;
    const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 9;
    window.scrollTo({top:Math.max(0,top),behavior:options.instant || quietScroll.matches ? 'instant' : 'smooth'});
  });
  return true;
}
function followNavigation() {
  if (location.hash) navigateToHash(location.hash,{write:false,instant:true});
  else window.updateActiveNav?.('home');
}
for (const event of ['hashchange','popstate']) window.addEventListener(event,followNavigation);
for (const event of ['touchstart','wheel']) window.addEventListener(event,() => {isNavigating=false},{passive:true});
document.addEventListener('click',event => {
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest('a[href^="#"]');
  if (link && navigateToHash(link.getAttribute('href'),{focus:event.detail===0})) event.preventDefault();
});

const backToTopBtn = document.getElementById('back-to-top-btn');
if (backToTopBtn) {
  window.addEventListener('scroll',()=>{
    backToTopBtn.classList.toggle('visible',window.scrollY > 250);
  },{passive:true});
  backToTopBtn.addEventListener('click',()=>navigateToHash('#home'));
}

(function initNavScrollSpy(){
  const sections = ['home','weekly','arcade','messages','album','club-extra','club-collection',
    'club-studio','club-memory','club-archive','suggestions','class-tools'].map(id=>document.getElementById(id)).filter(Boolean);
  const links = [...document.querySelectorAll('[data-nav-target],[data-bottom-target]')];
  const alias = {'mobile-portals':'home','club-main':'home','banter':'arcade','reaction-pad':'arcade','guess-wall':'arcade',
    'club-collection':'club-extra','people':'club-extra','mascots':'club-extra','class-film':'club-extra',
    'club-studio':'club-extra','playground':'club-extra','club-memory':'club-extra','social-area':'club-extra',
    'club-archive':'club-extra','teachers':'club-extra','targets':'club-extra','suggestions':'club-extra',
    'class-tools':'club-extra','class-hub':'club-extra','class-board':'club-extra'};
  window.updateActiveNav = id => {
    const key = alias[id] || id;
    for (const link of links) {
      const active = (link.dataset.navTarget || link.dataset.bottomTarget) === key;
      link.classList.toggle('active',active);
      if (active) link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    }
  };
  if (!('IntersectionObserver' in window)) return;
  const visible = new Set();
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) visible.add(entry.target);
      else visible.delete(entry.target);
    }
    if (isNavigating || !visible.size) return;
    const nearest = [...visible].sort((a,b)=>Math.abs(a.getBoundingClientRect().top)-Math.abs(b.getBoundingClientRect().top))[0];
    window.updateActiveNav(nearest.id);
  },{rootMargin:'-15% 0px -63% 0px',threshold:0});
  sections.forEach(section=>observer.observe(section));
})();
followNavigation();


// The MJ easter egg uses the short audio excerpt from the reference recording.
let isSpiderMJRunning = false;
const spiderPhrases = [
  'MJ · 倒挂比心',
  '25计1 · 来一颗爱心',
  '蜘蛛侠 · 路过教室'
];

function triggerSpiderMJ(customText) {
  if (isSpiderMJRunning) return;
  isSpiderMJRunning = true;

  const phrase = customText || spiderPhrases[Math.floor(Math.random() * spiderPhrases.length)];
  const soundtrack = document.getElementById('mj-soundtrack');
  const playClip = () => {
    if (soundtrack?.paused && !soundtrack.ended) soundtrack.play().catch(() => {});
  };

  const overlay = document.createElement('div');
  overlay.className = 'spider-mj-overlay';
  overlay.id = 'spider-mj-overlay';

  const rig = document.createElement('div');
  rig.className = 'spider-mj-rig';
  const actor = document.createElement('button');
  actor.type = 'button';
  actor.className = 'spider-mj-actor';
  actor.setAttribute('aria-label', '点击倒挂蜘蛛侠放出爱心');
  actor.innerHTML = `
    <svg class="spider-mj-svg" viewBox="0 0 196 236" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <pattern id="mj-mask-web" width="10" height="9" patternUnits="userSpaceOnUse">
          <path d="M5 0v9M0 2q5 5 10 0M0 7q5 5 10 0" stroke="#842639" stroke-width=".75" opacity=".66"/>
        </pattern>
      </defs>
      <g stroke="#182638" stroke-linecap="round" stroke-linejoin="round">
        <path d="M98 0v66m0-27q-9 12 0 21 8 0 0-7-8 8 0 10" stroke="#a2afbf" stroke-width="2"/>
        <path d="m96 64-13 9m16-9 13 10" stroke="#c2cad4" stroke-width="2"/>
        <g class="spider-mj-suit">
          <!-- Bent legs and boots, anchored to the web. -->
          <path d="M94 120 70 89 79 66l13 6-5 15 24 29Z" fill="#32527f" stroke-width="3.4"/>
          <path d="M106 121 128 96 118 71l-13 4 6 20-23 20Z" fill="#273f69" stroke-width="3.4"/>
          <path d="m74 80 5-14-7-9q-2-4 2-7 7-2 15 7l5 10-5 15Z" fill="#d64854" stroke-width="3"/>
          <path d="m109 84-6-15 4-12q7-7 15-4 4 3 0 8l-4 7 5 13Z" fill="#d64854" stroke-width="3"/>
          <path d="m76 73 14 4m16-1 14-6m-47-14 7 7m39-5-6 6" stroke="#7f2a3e" stroke-width="1.4"/>
          <path d="M95 108q15-1 21 11l4 29-14 12H90l-13-12 5-29q3-9 13-11Z" fill="#d64854" stroke-width="3.4"/>
          <path d="m85 121-6 23 11 11 4-15Zm26 0 7 23-11 11-4-15Z" fill="#32527f" stroke-width="1.4"/>
          <path d="M98 121v29m-10-21q10 6 21 0m-18 10q8 4 15 0" stroke="#842639" stroke-width="1.2"/>
          <path d="M98 132v11m-2-8-6-6m6 8-7-1m7 3-6 4m10-8 6-6m-6 8 7-1m-7 3 6 4" stroke-width="1.65"/>
          <!-- Hands form a heart below the mask. -->
          <path d="M82 135q-18 4-19 24-1 19 22 37l8-8q-17-15-15-26 0-7 10-13Z" fill="#d64854" stroke-width="3.4"/>
          <path d="M114 135q18 4 20 24 2 19-22 37l-8-8q17-15 15-26-1-7-11-13Z" fill="#d64854" stroke-width="3.4"/>
          <path d="m64 158 14 2m-12 9 14-4m53-7-14 2m12 9-14-4" stroke="#842639" stroke-width="1.55"/>
          <path d="M79 162q6-14 19-14 16 0 21 14l1 19q-1 17-22 20-20-2-22-20Z" fill="#de5361" stroke-width="3.4"/>
          <path d="M79 162q6-14 19-14 16 0 21 14l1 19q-1 17-22 20-20-2-22-20Z" fill="url(#mj-mask-web)" stroke="none"/>
          <path d="M81 176q4-12 13-9l2 17q-9 0-15-8Zm34 0q-4-12-13-9l-2 17q9 0 15-8Z" fill="#fff8e9" stroke-width="2.9"/>
          <path d="m86 174 3-2m21 2-3-2" stroke="#bfccd8" stroke-width="1.8"/>
          <path d="M87 190q6-5 10 0l1 6-3 5q-8 0-11-8Zm23 0q-6-5-10 0l-1 6 3 5q8 0 11-8Z" fill="#f16d71" stroke-width="2.5"/>
        </g>
        <g class="spider-heart">
          <path d="M98 226c-5-5-16-11-16-18 0-7 10-10 16-1 6-9 16-6 16 1 0 7-11 13-16 18Z" fill="#eb5264" stroke-width="2.4"/>
          <path d="M87 209q0-4 5-4" stroke="#ffe0d7" stroke-width="1.8"/>
        </g>
        <path d="m60 201-9 3m13 6-4 7m73-16 9 3m-12 6 4 7" stroke="#e68a84" stroke-width="2.5"/>
      </g>
    </svg>`;

  const badge = document.createElement('span');
  badge.className = 'spider-mj-badge';
  badge.textContent = phrase;
  badge.setAttribute('role', 'status');

  let lastBurst = -Infinity;
  const hearts = ['♥', '♡', '✦'];
  actor.addEventListener('click', () => {
    playClip();
    const now = performance.now();
    if (now - lastBurst < 300) return;
    lastBurst = now;
    for (let i = 0; i < 7; i++) {
      const particle = document.createElement('span');
      particle.className = 'spider-heart-particle';
      particle.textContent = hearts[i % hearts.length];
      particle.setAttribute('aria-hidden', 'true');
      const angle = (Math.PI * 2 / 7) * i;
      const distance = 36 + Math.random() * 30;
      particle.style.setProperty('--dx', Math.cos(angle) * distance + 'px');
      particle.style.setProperty('--dy', Math.sin(angle) * distance + 'px');
      rig.append(particle);
      setTimeout(() => particle.remove(), 1100);
    }
  });

  rig.append(actor, badge);
  overlay.append(rig);
  document.body.append(overlay);
  playClip();

  const close = () => {
    clearTimeout(closeTimer);
    document.removeEventListener('keydown', dismiss);
    soundtrack?.pause();
    if (soundtrack) soundtrack.currentTime = 0;
    overlay.remove();
    isSpiderMJRunning = false;
  };
  const dismiss = event => {
    if (event.key === 'Escape') close();
  };
  const closeTimer = setTimeout(close, 3100);
  document.addEventListener('keydown', dismiss);
}
window.triggerSpiderMJ = triggerSpiderMJ;

// Keyboard trigger (typing 'm' then 'j' on PC)
let keyBuffer = '';
let keyTimer = null;
window.addEventListener('keydown', (e) => {
  const targetTag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
  if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || e.isComposing ||
    targetTag === 'input' || targetTag === 'textarea' || e.target.isContentEditable) return;
  if (e.key && e.key.length === 1) {
    keyBuffer += e.key.toLowerCase();
    clearTimeout(keyTimer);
    keyTimer = setTimeout(() => { keyBuffer = ''; }, 1200);
    if (keyBuffer.endsWith('mj')) {
      keyBuffer = '';
      triggerSpiderMJ('MJ · 倒挂比心');
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
