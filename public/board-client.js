'use strict';
(()=>{
 const $=s=>document.querySelector(s);if(!$('#class-hub'))return;
 const kinds={notice:'班级通知',task:'作业待办',event:'活动日程',resource:'学习资料'};
 let items=[],kind='all',loading=null,queued=null,clockOffset=0,lastSignature='';
 const now=()=>Date.now()+clockOffset;
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(cls)n.className=cls;return n};
 const status=text=>$('#hub-status').textContent=text;
 const date=text=>new Date(text).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false});
 const safeLink=value=>{try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password?u.href:''}catch{return ''}};
 async function call(route,method='GET',body){const r=await fetch('/api'+route,{method,credentials:'same-origin',headers:{'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(25000)});const data=await r.json();if(!r.ok)throw Error(data.error||'班务暂未同步，请稍后重试');return data}
 function current(item){return item.kind==='event'?Date.parse(item.due_at)>=now():item.kind==='task'?!item.done||Date.parse(item.due_at)>=now():true}
 function render(){
  $('#hub-task-count').textContent=items.filter(i=>i.kind==='task'&&!i.done).length;
  $('#hub-event-count').textContent=items.filter(i=>i.kind==='event'&&Date.parse(i.start_at)>=now()&&Date.parse(i.start_at)<now()+7*86400000).length;
  $('#hub-resource-count').textContent=items.filter(i=>i.kind==='resource').length;
  $('#hub-tabs').querySelectorAll('button').forEach(b=>{b.classList.toggle('active',b.dataset.kind===kind);b.setAttribute('aria-pressed',String(b.dataset.kind===kind))});
  const query=$('#hub-search').value.trim().toLocaleLowerCase(),scope=$('#hub-scope').value;
  const shown=items.filter(i=>(kind==='all'||kind===i.kind)&&[i.title,i.detail,i.subject,i.location].join(' ').toLocaleLowerCase().includes(query)&&(scope==='all'||scope==='pending'?(scope==='all'||i.kind==='task'&&!i.done):scope==='week'?['task','event'].includes(i.kind)&&Date.parse(i.kind==='event'?i.start_at:i.due_at)>=now()&&Date.parse(i.kind==='event'?i.start_at:i.due_at)<now()+7*86400000:current(i)));
  const order={notice:0,task:1,event:2,resource:3};shown.sort((a,b)=>Number(b.pinned)-Number(a.pinned)||(kind==='all'?order[a.kind]-order[b.kind]:0)||(['task','event'].includes(a.kind)&&a.kind===b.kind?Date.parse(a.kind==='event'?a.start_at:a.due_at)-Date.parse(b.kind==='event'?b.start_at:b.due_at):b.created_at.localeCompare(a.created_at)));
  $('#hub-list').replaceChildren(...shown.map(item=>{
   const card=el('article',undefined,'hub-card hub-'+item.kind+(item.done?' is-done':''));card.dataset.boardId=item.id;
   const labels=el('div',undefined,'hub-labels');labels.append(el('span',kinds[item.kind],'hub-kind'));if(item.subject)labels.append(el('span',item.subject,'hub-subject'));if(item.pinned)labels.append(el('span','置顶 ↑','hub-pin'));card.append(labels,el('h3',item.title));
   if(item.detail.length>300){const details=el('details',undefined,'hub-body');details.append(el('summary','展开完整说明 ＋'),el('p',item.detail));card.append(details)}else if(item.detail)card.append(el('p',item.detail,'hub-detail'));
   const info=el('p',undefined,'hub-meta');if(item.kind==='task'){const due=Date.parse(item.due_at);info.textContent='截止 '+date(item.due_at);if(!item.done&&due<now()){info.append(el('span','已过截止时间','hub-overdue'))}else if(!item.done&&due-now()<86400000)info.append(el('span','一天内截止','hub-soon'))}
   else if(item.kind==='event')info.textContent=date(item.start_at)+' — '+date(item.due_at)+(item.location?' · '+item.location:'');else info.textContent='更新于 '+date(item.updated_at);card.append(info);
   const actions=el('div',undefined,'hub-card-actions');const href=safeLink(item.url);if(href){const a=el('a',item.kind==='resource'?'打开学习资料 ↗':'查看相关链接 ↗','hub-link');a.href=href;a.target='_blank';a.rel='noopener noreferrer';actions.append(a)}
   if(item.kind==='task'){const b=el('button',item.done?'✓ 我已完成 · 可撤销':'○ 标记我已完成','hub-check');b.type='button';b.setAttribute('aria-pressed',String(item.done));b.addEventListener('click',async()=>{b.disabled=true;try{const result=await call('/board/'+item.id+'/check','PUT',{done:!item.done});const current=items.find(i=>i.id===item.id);if(current)current.done=result.done;lastSignature='';render();status(result.done?'已记录你的完成状态。这里只做个人自查，仍需按老师要求提交作业。':'已取消完成标记。')}catch(e){status(e.message);b.disabled=false}});actions.append(b)}
   if(item.kind==='event'){const b=el('button','导出到日历 ↓','hub-quiet');b.type='button';b.addEventListener('click',()=>calendar(item));actions.append(b)}card.append(actions);return card;
  }));
  if(!shown.length){const empty=el('div',undefined,'hub-empty');empty.append(el('span','⌁'),el('h3',items.length?'没有找到匹配的事项':'重要的事，都会在这里集合。'),el('p',items.length?'换个关键词、分类或显示范围再看看。':'管理员可以在后台发布通知、作业、活动和资料。先从右侧的学习入口或专注计时开始吧。'));$('#hub-list').append(empty)}
 }
 function refresh(force=false){if(loading){if(!force)return loading;if(!queued)queued=loading.catch(()=>{}).then(()=>{queued=null;return refresh(false)});return queued}
  $('#hub-refresh').disabled=true;loading=(async()=>{try{const result=await call('/board');clockOffset=Date.parse(result.now)-Date.now();const signature=JSON.stringify(result.items)+Math.floor(now()/60000);items=result.items;if(signature!==lastSignature){render();lastSignature=signature}status('● 班级事务已同步 · '+items.length+' 条 · 活跃页面每 30 秒更新')}catch(e){status('连接暂未恢复，已有内容保留。可点「刷新」重试。');throw e}finally{$('#hub-refresh').disabled=false}})().finally(()=>loading=null);return loading;
 }
 function calendar(item){
  const esc=text=>String(text).replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
  const stamp=text=>new Date(text).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Class 25 Computer 1//Class Desk//ZH','CALSCALE:GREGORIAN','BEGIN:VEVENT','UID:'+item.id+'@class-25-computer-1','DTSTAMP:'+stamp(new Date()),'DTSTART:'+stamp(item.start_at),'DTEND:'+stamp(item.due_at),'SUMMARY:'+esc(item.title),'DESCRIPTION:'+esc(item.detail),'LOCATION:'+esc(item.location),...(safeLink(item.url)?['URL:'+esc(item.url)]:[]),'END:VEVENT','END:VCALENDAR'];
  const encoder=new TextEncoder();const folded=lines.map(line=>{let out='',part='';for(const char of line){if(encoder.encode(part+char).length>75){out+=part+'\r\n';part=' '}part+=char}return out+part}).join('\r\n')+'\r\n';
  const url=URL.createObjectURL(new Blob([folded],{type:'text/calendar;charset=utf-8'})),a=el('a');a.href=url;a.download='班级活动-'+item.id+'.ics';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('日历文件已导出，请打开文件并在你的日历应用中确认导入。');
 }
 $('#hub-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-kind]');if(!b)return;kind=b.dataset.kind;render()});
 document.querySelectorAll('[data-hub-go]').forEach(a=>a.addEventListener('click',()=>{kind=a.dataset.hubGo;$('#hub-scope').value=kind==='task'?'pending':kind==='event'?'week':'current';$('#hub-search').value='';render()}));
 let searchTimer;$('#hub-search').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(render,120)});$('#hub-scope').addEventListener('change',render);$('#hub-refresh').addEventListener('click',()=>refresh(true).catch(()=>{}));
 if(document.body.dataset.mode==='preview'){status('这是静态展示页，班级事务请在正式网站查看。');$('#hub-refresh').disabled=true;render()}else{window.addEventListener('class-synced',()=>refresh().catch(()=>{}));if(typeof classReady!=='undefined'&&classReady)refresh().catch(()=>{})}
 // Use a wall-clock deadline so background tab throttling cannot extend a timer.
 const timerKey='class2501-focus-v1';let timer={mode:'work',remaining:1500000,deadline:0},timerStorage=true;
 try{const saved=JSON.parse(localStorage.getItem(timerKey)||'null');if(saved&&['work','break'].includes(saved.mode)&&Number.isFinite(saved.remaining)&&saved.remaining>=0&&saved.remaining<=1500000&&Number.isFinite(saved.deadline)&&saved.deadline>=0&&saved.deadline<=Date.now()+1500000)timer=saved}catch{timerStorage=false}
 const saveTimer=()=>{try{localStorage.setItem(timerKey,JSON.stringify(timer))}catch{timerStorage=false;$('#focus-status').textContent='浏览器限制存储，计时仅在当前页面保留。'}};
 function tick(){let left=timer.deadline?Math.max(0,timer.deadline-Date.now()):timer.remaining;if(timer.deadline&&left===0){timer.deadline=0;timer.remaining=0;saveTimer();$('#focus-status').textContent=timer.mode==='work'?'这一段专注完成了，抬头放松一下吧。':'休息结束，准备好再开始一段专注。'}const seconds=Math.ceil(left/1000);$('#focus-clock').textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');$('#focus-start').textContent=timer.deadline?'暂停计时':left===0?'再来一段':timer.mode==='work'?'开始专注':'开始休息';for(const mode of ['work','break']){$('#focus-'+mode).classList.toggle('active',timer.mode===mode);$('#focus-'+mode).setAttribute('aria-pressed',String(timer.mode===mode))}}
 function reset(mode=timer.mode){timer={mode,remaining:mode==='work'?1500000:300000,deadline:0};saveTimer();if(timerStorage)$('#focus-status').textContent=mode==='work'?'选一件小事，现在开始。':'离开屏幕，给眼睛和大脑充个电。';tick()}
 for(const mode of ['work','break'])$('#focus-'+mode).addEventListener('click',()=>{if(timer.deadline&&mode!==timer.mode&&!confirm('切换模式会重置当前计时，要继续吗？'))return;if(mode!==timer.mode)reset(mode)});
 $('#focus-reset').addEventListener('click',()=>{if(timer.deadline&&!confirm('确定重置这段计时？'))return;reset()});$('#focus-start').addEventListener('click',()=>{if(timer.deadline){timer.remaining=Math.max(0,timer.deadline-Date.now());timer.deadline=0;$('#focus-status').textContent='已暂停，准备好后继续。'}else{if(timer.remaining<=0)timer.remaining=timer.mode==='work'?1500000:300000;timer.deadline=Date.now()+timer.remaining;$('#focus-status').textContent=timer.mode==='work'?'正在专注，慢慢完成眼前这件事。':'正在休息，放松肩膀，看看远处。'}saveTimer();tick()});
 window.addEventListener('storage',e=>{if(e.key!==timerKey)return;try{const saved=JSON.parse(e.newValue);if(saved&&['work','break'].includes(saved.mode)&&Number.isFinite(saved.remaining)&&Number.isFinite(saved.deadline)){timer=saved;tick()}}catch{}});
 if(timer.deadline)$('#focus-status').textContent='已恢复正在进行的计时。';tick();setInterval(tick,1000);document.addEventListener('visibilitychange',()=>{if(!document.hidden){tick();if(items.length)render()}});
})();
