'use strict';
(()=>{
 const $=s=>document.querySelector(s);let page=0,busy=false;
 const notice=text=>$('#admin-status').textContent=text;
 async function request(route,method='GET',body){const r=await fetch('/api/admin'+route,{method,credentials:'same-origin',headers:{'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(25000)});const data=await r.json();if(r.status===401&&route!=='/login'){showLogin();throw Error('登录已过期，请重新登录')}if(!r.ok)throw Error(data.error||'操作失败');return data}
 function showLogin(){$('#admin-panel').hidden=true;$('#admin-login').hidden=false}
 function el(tag,text,cls){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node}
 function action(text,handler){const button=el('button',text,'button secondary');button.addEventListener('click',async()=>{button.disabled=true;try{await handler()}catch(e){notice(e.message)}finally{button.disabled=false}});return button}
 const date=text=>new Date(text).toLocaleString('zh-CN');
 async function load(){if(busy)return;busy=true;try{
  const data=await request('/dashboard?page='+page);$('#admin-panel').hidden=false;$('#admin-login').hidden=true;
  $('#admin-stats').replaceChildren(...Object.entries({notes:'班级留言',photos:'共享照片',likes:'收到的点赞',checkins:'累计签到'}).map(([key,label])=>{const card=el('article',undefined,'stat-card');card.append(el('strong',data.stats[key]),el('span',label));return card}));
  $('#notes-total').textContent=data.stats.notes+' 条';$('#photos-total').textContent=data.stats.photos+' 张';
  $('#announcement').value=data.fun.announcement;$('#roster').value=data.fun.roster.join('\n');
  $('#manage-polls').replaceChildren(...data.fun.polls.map(p=>{const row=el('article',undefined,'manage-row');const info=el('div');info.append(el('strong',p.title),el('p',(p.is_open?'进行中':'已结束')+' · 共 '+p.counts.reduce((a,b)=>a+b,0)+' 票','small-note'));info.append(el('p',p.options.map((o,i)=>o+' '+p.counts[i]+'票').join(' / '),'small-note'));const controls=el('div',undefined,'row-actions');controls.append(action(p.is_open?'结束投票':'重新开放',async()=>{await request('/polls/'+p.id,'PUT',{open:!p.is_open});await load()}),action('删除',async()=>{if(!confirm('确定删除这个投票？'))return;await request('/polls/'+p.id,'DELETE');await load()}));row.append(info,controls);return row}));
  $('#manage-notes').replaceChildren(...data.notes.map(n=>{const row=el('article',undefined,'manage-row');const info=el('div');info.append(el('strong',n.name),el('p',n.text),el('small',date(n.date)));row.append(info,action('删除留言',async()=>{if(!confirm('确定删除这条留言？'))return;await request('/notes/'+n.id,'DELETE');await load()}));return row}));
  $('#prev-page').disabled=page===0;$('#next-page').disabled=(page+1)*50>=data.stats.notes;$('#page-label').textContent=`第 ${page+1} 页 · 共 ${data.stats.notes} 条`;
  $('#manage-photos').replaceChildren(...data.photos.map(p=>{const item=el('article',undefined,'shared-photo');const link=el('a');link.href='/api/photos/'+p.id;link.target='_blank';link.rel='noopener';const img=el('img');img.src=link.href;img.alt=p.name;img.loading='lazy';link.append(img);item.append(link,el('p',p.name,'small-note'),action('删除照片',async()=>{if(!confirm('确定删除这张照片？'))return;await request('/photos/'+p.id,'DELETE');await load()}));return item}));
  if(data.people)renderSpotlights(data.people);
  window.renderSocialAdmin(data,request,load,notice);
  window.dispatchEvent(new Event('class-admin-ready'));
  $('#manage-audit').replaceChildren(...data.audit.map(a=>el('p',date(a.date)+' · '+a.action,'small-note')));notice('已登录 · 内容已更新');
 }finally{busy=false}}
 function renderSpotlights(people){
  const container=$('#manage-spotlights');
  if(!container)return;
  container.replaceChildren(...(people||[]).map(p=>{
   const card=el('article',undefined,'spotlight-admin-card');
   card.append(el('h3',`${p.id.toUpperCase()} · ${p.title}`));
   const thumbWrap=el('div',undefined,'spotlight-thumb-wrap');
   const img=el('img',undefined,'spotlight-thumb');
   img.src=p.imageUrl;
   img.alt=p.title;
   thumbWrap.append(img,el('span',p.hasCustomImage?'已使用自定义上传照片':'正在使用系统预设照片','small-note'));
   const form=el('form');
   const labelTag=el('label','身份标识（如 CLASS SPOTLIGHT）');
   const inputTag=el('input');inputTag.type='text';inputTag.maxLength=30;inputTag.value=p.tag||'';
   labelTag.append(inputTag);
   const labelTitle=el('label','称号 / 姓名（如 班花 · 人气担当）');
   const inputTitle=el('input');inputTitle.type='text';inputTitle.maxLength=40;inputTitle.value=p.title||'';inputTitle.required=true;
   labelTitle.append(inputTitle);
   const labelBadge=el('label','特别徽章文字（选填，如 ✿ 班花）');
   const inputBadge=el('input');inputBadge.type='text';inputBadge.maxLength=20;inputBadge.value=p.badge||'';
   labelBadge.append(inputBadge);
   const labelBadgeClass=el('label','徽章配色风格');
   const selectBadgeClass=el('select');
   const optDefault=el('option','粉紫浪漫徽章（默认 / 班花风格）');optDefault.value='';if(p.badgeClass!=='lime')optDefault.selected=true;
   const optLime=el('option','清新果绿徽章（班草风格）');optLime.value='lime';if(p.badgeClass==='lime')optLime.selected=true;
   selectBadgeClass.append(optDefault,optLime);
   labelBadgeClass.append(selectBadgeClass);
   const labelDesc=el('label','风采寄语 / 介绍（最多 200 字）');
   const textDesc=el('textarea');textDesc.rows=3;textDesc.maxLength=200;textDesc.value=p.description||'';
   labelDesc.append(textDesc);
   const labelFile=el('label','上传替换照片（JPG / PNG / WebP，自动高质量优化）');
   const inputFile=el('input');inputFile.type='file';inputFile.accept='image/jpeg,image/png,image/webp';
   labelFile.append(inputFile);
   const actions=el('div',undefined,'spotlight-card-actions');
   const saveBtn=el('button','保存修改 ↗','button');
   const resetPhotoBtn=el('button','恢复预设照片','button secondary');
   resetPhotoBtn.type='button';if(!p.hasCustomImage)resetPhotoBtn.disabled=true;
   const resetAllBtn=el('button','重置为初始设置','button secondary');
   resetAllBtn.type='button';resetAllBtn.style.color='#d9635b';
   actions.append(saveBtn,resetPhotoBtn,resetAllBtn);
   form.append(labelTag,labelTitle,labelBadge,labelBadgeClass,labelDesc,labelFile,actions);
   form.addEventListener('submit',async e=>{
    e.preventDefault();saveBtn.disabled=true;
    try{
     if(inputFile.files?.[0]){
      const file=inputFile.files[0];
      if(file.size>8*1024*1024)throw Error('上传图片过大，请在 8MB 以内');
      const photoRes=await fetch('/api/admin/people/'+p.id+'/photo',{method:'PUT',credentials:'same-origin',headers:{'Content-Type':file.type},body:file});
      const photoData=await photoRes.json().catch(()=>({}));
      if(!photoRes.ok)throw Error(photoData.error||'照片上传失败');
     }
     await request('/people/'+p.id,'PUT',{tag:inputTag.value.trim()||'CLASS SPOTLIGHT',title:inputTitle.value.trim(),badge:inputBadge.value.trim(),badgeClass:selectBadgeClass.value,description:textDesc.value.trim()});
     notice(`已保存 ${inputTitle.value.trim()} 的主页风采设置！`);await load();
    }catch(err){notice(err.message)}finally{saveBtn.disabled=false}
   });
   resetPhotoBtn.addEventListener('click',async()=>{
    if(!confirm(`确定将 ${p.title} 的照片恢复为预设照片？`))return;
    resetPhotoBtn.disabled=true;
    try{await request('/people/'+p.id,'PUT',{tag:inputTag.value.trim()||'CLASS SPOTLIGHT',title:inputTitle.value.trim(),badge:inputBadge.value.trim(),badgeClass:selectBadgeClass.value,description:textDesc.value.trim(),resetImage:true});notice(`已恢复 ${p.title} 的预设照片！`);await load()}catch(err){notice(err.message)}finally{resetPhotoBtn.disabled=false}
   });
   resetAllBtn.addEventListener('click',async()=>{
    if(!confirm(`确定将 ${p.title} 的全部设置与照片重置为系统初始预设？`))return;
    resetAllBtn.disabled=true;
    try{await request('/people/'+p.id+'/reset','POST');notice(`已将 ${p.title} 重置为系统初始预设！`);await load()}catch(err){notice(err.message)}finally{resetAllBtn.disabled=false}
   });
   card.append(thumbWrap,form);
   return card;
  }));
 }
 async function submit(event,task){event.preventDefault();const button=event.submitter;button.disabled=true;try{await task()}catch(e){notice(e.message)}finally{button.disabled=false}}
 $('#admin-login').addEventListener('submit',e=>submit(e,async()=>{await request('/login','POST',{password:$('#admin-password').value});$('#admin-password').value='';await load()}));
 $('#logout').addEventListener('click',async()=>{try{await request('/logout','POST');window.dispatchEvent(new Event('class-admin-logout'));showLogin();notice('已安全退出')}catch(e){notice(e.message)}});
 $('#settings-form').addEventListener('submit',e=>submit(e,async()=>{await request('/settings','PUT',{announcement:$('#announcement').value,roster:$('#roster').value});notice('公告与点名名单已保存')}));
 $('#poll-form').addEventListener('submit',e=>submit(e,async()=>{await request('/polls','POST',{title:$('#poll-title').value,options:$('#poll-options').value.split('\n').map(s=>s.trim()).filter(Boolean)});$('#poll-form').reset();await load()}));
 $('#password-form').addEventListener('submit',e=>submit(e,async()=>{await request('/password','PUT',{currentPassword:$('#old-password').value,password:$('#new-password').value});$('#password-form').reset();window.dispatchEvent(new Event('class-admin-logout'));showLogin();notice('密码已修改，所有旧会话已失效，请使用新密码登录')}));
 $('#refresh-admin').addEventListener('click',()=>load().catch(e=>notice(e.message)));
 $('#prev-page').addEventListener('click',()=>{page=Math.max(0,page-1);load().catch(e=>notice(e.message))});$('#next-page').addEventListener('click',()=>{page++;load().catch(e=>notice(e.message))});
 request('/session').then(s=>s.authenticated?load():(showLogin(),notice(s.configured?'请输入管理员密码':'管理密码尚未配置，请联系网站维护者'))).catch(e=>notice(e.message));
})();
