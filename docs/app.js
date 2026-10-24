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
document.querySelectorAll('.like').forEach(button=>{button.disabled=!preview;button.addEventListener('click',async()=>{if(preview){const person=button.dataset.person;const liked=!likes[person]?.liked;likes[person]={liked,count:liked?1:0};storage.set('preview-likes',likes);renderLikes();toast('点赞已记在这台设备上');return}button.disabled=true;try{const data=await api('/likes/'+button.dataset.person,{method:'PUT',body:JSON.stringify({liked:!likes[button.dataset.person]?.liked})});likes=data.likes;renderLikes()}catch(error){toast(errorMessage(error))}finally{button.disabled=false}})});
document.addEventListener('click',event=>{const button=event.target.closest('.open-photo');if(!button)return;$('#modal-img').src=button.dataset.src;$('#modal-img').alt=button.dataset.title;$('#modal-title').textContent=button.dataset.title;$('#lightbox').showModal()});
$('#close-modal').addEventListener('click',()=>$('#lightbox').close());
$('#lightbox').addEventListener('click',event=>{if(event.target===$('#lightbox'))$('#lightbox').close()});
$('#upload').addEventListener('change',event=>{let count=0;for(const file of event.target.files){if(!file.type.startsWith('image/'))continue;if(file.size>15*1024*1024){toast('请选择小于 15MB 的图片');continue}const url=URL.createObjectURL(file);const button=document.createElement('button');button.className='album-tile open-photo';button.dataset.src=url;button.dataset.title=file.name;const img=document.createElement('img');img.src=url;img.alt=file.name;const caption=document.createElement('span');caption.textContent=file.name+' ↗';button.append(img,caption);$('#album-grid').append(button);count++}if(count)toast('已添加 '+count+' 张照片，本次打开期间可查看');event.target.value=''});

let notes=[];
function renderNotes(){const target=$('#notes');target.replaceChildren();if(!notes.length){const empty=document.createElement('p');empty.className='empty';empty.textContent='还没有留言。来贴上第一张青春便签吧。';target.append(empty);return}notes.forEach(note=>{const item=document.createElement('article');item.className='note';const head=document.createElement('div');head.className='note-header';const name=document.createElement('strong');name.textContent=note.name;const time=document.createElement('small');time.textContent=new Date(note.date).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});const text=document.createElement('p');text.textContent=note.text;head.append(name,time);item.append(head,text);if(note.mine){const remove=document.createElement('button');remove.className='delete-note';remove.textContent='删除我的留言';remove.addEventListener('click',async()=>{remove.disabled=true;try{const data=await api('/notes/'+note.id,{method:'DELETE'});notes=data.notes;renderNotes();toast('留言已删除')}catch(error){toast(errorMessage(error));remove.disabled=false}});item.append(remove)}target.append(item)})}
$('#message').addEventListener('input',()=>$('#char-count').textContent=$('#message').value.length+' / 200');
$('#message-form').addEventListener('submit',async event=>{event.preventDefault();const name=$('#nickname').value.trim(),text=$('#message').value.trim();if(!name||!text){toast('请填写昵称和留言内容');return}const button=event.submitter;button.disabled=true;button.textContent='正在发布…';try{const data=await api('/notes',{method:'POST',body:JSON.stringify({name,text})});notes=data.notes;renderNotes();$('#message').value='';$('#char-count').textContent='0 / 200';storage.set('nickname',name);toast('留言已发布，其他设备也能看到。')}catch(error){toast(errorMessage(error))}finally{button.disabled=false;button.textContent='贴上留言 ↗'}});
$('#nickname').value=storage.get('nickname','');
const status=document.createElement('div');status.className='sync-status';status.setAttribute('role','status');$('#notes').before(status);
let refreshing=false;
let lastActivity=Date.now();
async function refresh(){if(refreshing||document.hidden)return;refreshing=true;status.textContent='正在同步班级留言…';try{const data=await api('/state');notes=data.notes;likes=data.likes;renderNotes();renderLikes();document.querySelectorAll('.like').forEach(button=>button.disabled=false);status.textContent='● 已连接 · 每 30 秒同步 · 展示最新 200 条留言';status.classList.remove('offline')}catch(error){status.replaceChildren(document.createTextNode('连接失败，留言暂未同步。'));status.classList.add('offline');const retry=document.createElement('button');retry.textContent='重新连接';retry.addEventListener('click',refresh);status.append(retry)}finally{refreshing=false}}
if(preview){
  renderLikes();
  status.textContent='留言区暂未开放 · 当前点赞仅保存在本设备';
  for(const input of $('#message-form').querySelectorAll('input,textarea,button'))input.disabled=true;
  $('#message-form').querySelector('button').textContent='留言区即将开放';
  $('#message').placeholder='先逛逛我们的班级，留言区稍后和大家见面。';
}else if(location.protocol==='file:'){
  status.textContent='共享留言需要服务器，请先打开网站展示版。';
  $('#message-form').querySelector('button').disabled=true;
}else{
  refresh();
  setInterval(()=>{if(Date.now()-lastActivity<120000)refresh();else if(!document.hidden)status.textContent='● 已连接 · 暂停空闲同步，操作页面后恢复'},30000);
  for(const event of ['pointerdown','keydown','scroll'])window.addEventListener(event,()=>{const paused=Date.now()-lastActivity>=120000;lastActivity=Date.now();if(paused)refresh()},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){lastActivity=Date.now();refresh()}});
}