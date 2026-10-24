'use strict';
(()=>{
 const $=s=>document.querySelector(s);let wired=false;
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n};
 window.renderSocialAdmin=(data,request,load,notice)=>{
  function remove(type,id){const b=el('button','删除','button secondary');b.addEventListener('click',async()=>{if(!confirm('确认删除这项内容？'))return;b.disabled=true;try{await request('/'+type+'/'+id,'DELETE');await load()}catch(e){notice(e.message);b.disabled=false}});return b}
  const x=data.extended;
  $('#manage-capsules').replaceChildren(...x.capsules.map(c=>{const row=el('article',undefined,'manage-row'),info=document.createElement('div');info.append(el('strong',c.title),el('p',c.name+' · '+new Date(c.unlock_at).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'})+'（北京）','small-note'),el('p',c.locked?'封存中 · 管理员可预览正文':'已到期 · 正文已向全班开放','small-note'),el('p',c.content,'capsule-letter'));row.append(info,remove('capsules',c.id));return row}));
  $('#manage-drawings').replaceChildren(...x.drawings.map(d=>{const card=el('article',undefined,'drawing-card'),canvas=document.createElement('canvas');canvas.width=800;canvas.height=500;canvas.dataset.drawing=d.id;canvas.setAttribute('aria-label',d.title);card.append(canvas,el('h4',d.title),el('p',d.name,'small-note'),remove('drawings',d.id));return card}));window.ClassArt.observe($('#manage-drawings'));
  $('#manage-challenges').replaceChildren(...data.challengeEntries.map(c=>{const row=el('article',undefined,'manage-row');row.append(el('strong',c.name),remove('challenges',c.id));return row}));
  $('#manage-achievements').replaceChildren(...x.achievements.map(a=>{const row=el('article',undefined,'manage-row'),body=document.createElement('div');body.append(el('strong',a.icon+' '+a.title),el('p',a.event_day+' · '+a.description));row.append(body,remove('achievements',a.id));return row}));
  for(const id of ['#manage-capsules','#manage-drawings','#manage-challenges','#manage-achievements'])if(!$(id).children.length)$(id).append(el('p','暂无记录','small-note'));
  if(!wired){wired=true;$('#achievement-form').addEventListener('submit',async e=>{e.preventDefault();const b=e.submitter;b.disabled=true;try{await request('/achievements','POST',{title:$('#achievement-title').value.trim(),description:$('#achievement-description').value.trim(),icon:$('#achievement-icon').value,eventDay:$('#achievement-date').value});$('#achievement-form').reset();await load();notice('班级成就已发布')}catch(err){notice(err.message)}finally{b.disabled=false}})}
 };
})();
