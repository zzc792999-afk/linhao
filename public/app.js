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
function renderNotes(){$('#message-count').textContent=notes.length?'最新 '+notes.length+' 条留言':'还没有留言，来留下第一句话';const target=$('#notes');target.replaceChildren();if(!notes.length){const empty=document.createElement('p');empty.className='empty';empty.textContent='还没有留言。来贴上第一张青春便签吧。';target.append(empty);return}notes.forEach(note=>{const item=document.createElement('article');item.className='note';const head=document.createElement('div');head.className='note-header';const name=document.createElement('strong');name.textContent=note.name;const time=document.createElement('small');time.textContent=new Date(note.date).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});const text=document.createElement('p');text.textContent=note.text;head.append(name,time);item.append(head,text);if(note.mine){const remove=document.createElement('button');remove.className='delete-note';remove.textContent='删除我的留言';remove.addEventListener('click',async()=>{remove.disabled=true;try{const data=await api('/notes/'+note.id,{method:'DELETE'});notes=data.notes;renderNotes();toast('留言已删除')}catch(error){toast(errorMessage(error));remove.disabled=false}});item.append(remove)}target.append(item)})}
$('#message').addEventListener('input',()=>$('#char-count').textContent=$('#message').value.length+' / 200');
$('#message-form').addEventListener('submit',async event=>{event.preventDefault();const name=$('#nickname').value.trim(),text=$('#message').value.trim();if(!name||!text){toast('请填写昵称和留言内容');return}const button=event.submitter;button.disabled=true;button.textContent='正在发布…';try{const data=await api('/notes',{method:'POST',body:JSON.stringify({name,text})});notes=data.notes;renderNotes();$('#message').value='';$('#char-count').textContent='0 / 200';storage.set('nickname',name);toast('留言已发布，其他设备也能看到。')}catch(error){toast(errorMessage(error))}finally{button.disabled=false;button.textContent='贴上留言 ↗'}});
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
function openPublicSection(hash){const id={'#album':'album-fold','#messages':'messages-fold'}[hash];if(id)document.getElementById(id).open=true}
openPublicSection(location.hash);
window.addEventListener('hashchange',()=>openPublicSection(location.hash));
document.addEventListener('click',event=>{const link=event.target.closest('a[href="#album"],a[href="#messages"]');if(link)openPublicSection(link.getAttribute('href'))});
