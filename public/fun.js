'use strict';
(()=>{
 const $=s=>document.querySelector(s);let fun,loading=false,active=Date.now();
 function text(tag,value,cls){const el=document.createElement(tag);el.textContent=value;if(cls)el.className=cls;return el}
 const message=value=>$('#fun-status').textContent=value;
 async function call(route,method='GET',body){const r=await fetch('/api'+route,{method,credentials:'same-origin',headers:{'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(25000)});const data=await r.json();if(!r.ok)throw Error(data.error||'暂时无法连接');return data}
 function render(data){fun=data;$('#class-announcement').hidden=!data.announcement;$('#announcement-text').textContent=data.announcement;$('#checkin-count').textContent=data.checkins.length;$('#checkin-date').textContent=data.day;
  const me=data.checkins.find(c=>c.mine);$('#checkin-submit').textContent=me?'更新今日心情 ↗':'记录今日心情 ↗';if(me&&!$('#checkin-name').value)$('#checkin-name').value=me.name;
  $('#checkin-cloud').replaceChildren(...data.checkins.slice(0,40).map(c=>text('span',c.name+' · '+c.mood,'mood-chip')));
  $('#poll-list').replaceChildren(...data.polls.map(p=>{const item=document.createElement('article');item.className='poll-card';item.append(text('span',p.is_open?'正在投票 · 每个浏览器一票，可改选':'投票已结束','tag'),text('h3',p.title));const total=p.counts.reduce((a,b)=>a+b,0);
   p.options.forEach((option,i)=>{const button=document.createElement('button');button.className='poll-option'+(p.choice===i?' chosen':'');button.disabled=!p.is_open;button.setAttribute('aria-pressed',String(p.choice===i));const line=document.createElement('span');line.append(text('span',(p.choice===i?'✓ ':'')+option),text('small',p.counts[i]+' 票'));const meter=document.createElement('progress');meter.max=Math.max(1,total);meter.value=p.counts[i];button.append(line,meter);button.addEventListener('click',async()=>{button.disabled=true;try{render(await call('/polls/'+p.id+'/vote','PUT',{choice:i}));message('投票已记录，全班都能看到结果。')}catch(e){message(e.message);button.disabled=false}});item.append(button)});item.append(text('p','已有 '+total+' 票','small-note'));return item}));
  if(!data.polls.length)$('#poll-list').append(text('p','新投票正在酝酿中，等管理员发起吧。','small-note'));
  $('#picker-hint').textContent=data.roster.length?'已载入班级名单 · '+data.roster.length+' 人，也可自行输入临时名单':'先在下方输入名字，或请管理员设置班级名单';
 }
 async function refresh(){if(loading||document.hidden)return;loading=true;try{render(await call('/fun'));message('● 班级活动已同步')}catch(e){message(e.message)}finally{loading=false}}
 $('#checkin-form').addEventListener('submit',async event=>{event.preventDefault();const button=event.submitter;button.disabled=true;try{render(await call('/checkin','PUT',{name:$('#checkin-name').value.trim(),mood:$('#checkin-mood').value}));message('今天也和全班一起充电成功！')}catch(e){message(e.message)}finally{button.disabled=false}});
 const fortunes=['今天适合解决一个困扰很久的小 bug。','写完这一行，记得抬头看看窗外。','你的下一次灵感，可能就藏在一次聊天里。','今天的幸运任务：夸一位同学。','先保存，再大胆尝试。','给未来的自己，留一句温柔的注释。','遇到不会的题，找同学一起拆解吧。'];let picking=false;
 $('#draw-fortune').addEventListener('click',()=>{$('#fortune-text').textContent=fortunes[crypto.getRandomValues(new Uint32Array(1))[0]%fortunes.length]});
 $('#pick-name').addEventListener('click',async()=>{if(picking)return;const custom=$('#picker-names').value.split(/[\n,，、]/).map(s=>s.trim()).filter(Boolean);const names=custom.length?custom:(fun?.roster||[]);if(!names.length){message('先输入至少一个名字再抽签吧。');return}if(names.length>100||names.some(n=>n.length>20)){message('最多 100 个名字，每个名字不超过 20 字。');return}picking=true;$('#pick-name').disabled=true;for(let i=0;i<12;i++){const index=crypto.getRandomValues(new Uint32Array(1))[0]%names.length;$('#picked-name').textContent=names[index];await new Promise(r=>setTimeout(r,65+i*7))}picking=false;$('#pick-name').disabled=false;message('抽签完成！结果仅供班级互动娱乐。')});
 if(document.body.dataset.mode==='preview'){message('共享活动请在正式网站中使用。');for(const el of $('#checkin-form').elements)el.disabled=true;return}
 window.addEventListener('class-synced',refresh);if(typeof classReady!=='undefined'&&classReady)refresh();
})();
