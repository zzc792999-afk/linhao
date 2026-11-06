'use strict';
(()=>{
 const $=s=>document.querySelector(s);if(!$('#arcade-admin')&&!$('#mascot-passwords-admin-fold'))return;
 let ready=false,loading=null;const notice=text=>$('#arcade-admin-status')?$('#arcade-admin-status').textContent=text:null;
 const mascotNotice=text=>$('#mascot-admin-status')?$('#mascot-admin-status').textContent=text:null;
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(cls)n.className=cls;return n};

 const MASCOTS = [
  { id: 'pig', name: '飞天小猪', icon: '🐷', skill: '【小猪突击】扣除目标 20 点体力' },
  { id: 'turtle', name: '稳赢神龟', icon: '🐢', skill: '【玄武重壳】扣除目标 18 点体力' },
  { id: 'chicken', name: '战斗小鸡', icon: '🐔', skill: '【尖嘴啄击】扣除目标 22 点体力' },
  { id: 'cat', name: '摸鱼猫猫', icon: '🐱', skill: '【猫猫乱抓】扣除目标 20 点体力' },
  { id: 'owl', name: '熬夜猫头鹰', icon: '🦉', skill: '【夜视死光】扣除目标 24 点体力' },
  { id: 'dog', name: '忠诚汪汪', icon: '🐶', skill: '【汪汪飞扑】扣除目标 20 点体力' },
  { id: 'panda', name: '功夫熊猫', icon: '🐼', skill: '【竹林气功】扣除目标 25 点体力' },
  { id: 'rednose', name: '小丑红鼻子', icon: '🤡', skill: '【戏谑魔术】扣除目标 20 点体力' },
  { id: 'hippo', name: '呆萌河马', icon: '🦛', skill: '【水花重压】扣除目标 26 点体力' },
  { id: 'horse', name: '狂奔小马', icon: '🐴', skill: '【旋风铁蹄】扣除目标 22 点体力' },
  { id: 'donkeycat', name: '驴头猫', icon: '🐱🐴', skill: '【双重合鸣】扣除目标 24 点体力' },
  { id: 'wuba', name: '糊涂乌霸', icon: '🐢💨', skill: '【糊涂风暴】扣除目标 20 点体力' },
  { id: 'triangle', name: '三角兽', icon: '📐', skill: '【几何切割】扣除目标 25 点体力' },
  { id: 'beetle', name: '铁甲甲虫', icon: '🪲', skill: '【角撞碎石】扣除目标 23 点体力' },
  { id: 'shoe', name: '踏风战鞋', icon: '👟', skill: '【踏碎凌霄】扣除目标 25 点体力' },
  { id: 'oil', name: '能量机油', icon: '🛢️', skill: '【涡轮喷射】扣除目标 28 点体力' },
  { id: 'liubang', name: '汉高祖刘邦', icon: '👑', skill: '【大风起兮】扣除目标 30 点体力' }
 ];

 async function api(path='',method='GET',body){
  const r=await fetch('/api/admin'+path,{
   method,credentials:'same-origin',
   headers:body?{'Content-Type':'application/json'}:{},
   ...(body?{body:JSON.stringify(body)}:{}),
   signal:AbortSignal.timeout(25000)
  });
  const data=await r.json();
  if(r.status===401){$('#admin-panel').hidden=true;$('#admin-login').hidden=false}
  if(!r.ok)throw Error(data.error||'操作失败');
  return data;
 }

 function remove(label,path,loadFn){
  const b=el('button',label,'button secondary');b.type='button';
  b.addEventListener('click',async()=>{
   if(!confirm('确定'+label+'？这项内容会从同学端移除。'))return;
   b.disabled=true;
   try{
    await api('/arcade'+path,'DELETE');
    try{await loadFn();notice('已移除指定内容')}catch{notice('已移除，列表暂未同步，请刷新，无需重复删除。')}
   }catch(e){notice(e.message)}finally{b.disabled=false}
  });
  return b;
 }

 function load(){
  if(loading)return loading;
  loading=(async()=>{
   const data=await api('/arcade');
   $('#arcade-admin-drawings').replaceChildren(...data.drawings.map(d=>{
    const card=el('article',undefined,'manage-row'),body=el('div');
    body.append(el('strong',d.name+' · '+d.hint),el('p','谜底：'+d.answer),el('small',d.createdAt?new Date(d.createdAt).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'}):''));
    card.append(body,remove('删除猜画','/drawings/'+d.id,load));
    return card;
   }));
   $('#arcade-admin-scores').replaceChildren(...data.scores.map(s=>{
    const card=el('article',undefined,'manage-row');
    card.append(el('p',s.name+' · '+s.score+' ms'),remove('移除榜单成绩','/scores/'+s.id,load));
    return card;
   }));
   if(!data.drawings.length)$('#arcade-admin-drawings').append(el('p','暂无猜画作品','small-note'));
   if(!data.scores.length)$('#arcade-admin-scores').append(el('p','暂无反应挑战成绩','small-note'));
   notice('已同步 '+data.drawings.length+' 幅猜画和 '+data.scores.length+' 份上榜成绩。谜底仅在管理员后台显示。');
  })().finally(()=>loading=null);
  return loading;
 }

 let currentPasswords={};
 async function loadMascotPasswords(){
  const container=$('#manage-mascot-passwords');
  if(!container)return;
  mascotNotice('正在加载吉祥物密码…');
  try{
   const data=await api('/mascot-passwords');
   currentPasswords=data.passwords||{};
   container.replaceChildren(...MASCOTS.map(m=>{
    const card=el('div',undefined,'mascot-admin-card');
    const head=el('div',undefined,'mascot-admin-card-head');
    head.append(el('span',`${m.icon} ${m.name}`),el('span',m.id,'small-note'));
    const skill=el('div',m.skill,'mascot-admin-card-skill');
    const action=el('div',undefined,'mascot-admin-card-action');
    const input=el('input');
    input.type='text';
    input.maxLength=32;
    input.dataset.mascotId=m.id;
    input.value=currentPasswords[m.id]||'2501';
    input.placeholder='设置密码（默认 2501）';
    const saveOneBtn=el('button','保存','button secondary');
    saveOneBtn.type='button';
    saveOneBtn.addEventListener('click',async()=>{
     saveOneBtn.disabled=true;
     try{
      const val=input.value.trim()||'2501';
      currentPasswords[m.id]=val;
      await api('/mascot-passwords','PUT',{passwords:currentPasswords});
      mascotNotice(`已成功保存【${m.name}】的攻击密码为：${val}`);
     }catch(e){mascotNotice(e.message)}
     finally{saveOneBtn.disabled=false}
    });
    action.append(input,saveOneBtn);
    card.append(head,skill,action);
    return card;
   }));
   mascotNotice('已同步 17 位吉祥物攻击授权密码。修改后点击保存即可生效。');
  }catch(e){
   mascotNotice(e.message);
  }
 }

 async function saveAllPasswords(){
  const btn=$('#save-all-mascot-passwords');
  if(btn)btn.disabled=true;
  try{
   const inputs=document.querySelectorAll('#manage-mascot-passwords input[data-mascot-id]');
   inputs.forEach(inp=>{
    const id=inp.dataset.mascotId;
    currentPasswords[id]=inp.value.trim()||'2501';
   });
   await api('/mascot-passwords','PUT',{passwords:currentPasswords});
   mascotNotice('已成功保存所有 17 位吉祥物的攻击授权密码！');
  }catch(e){
   mascotNotice(e.message);
  }finally{
   if(btn)btn.disabled=false;
  }
 }

 const pwFold=$('#mascot-passwords-admin-fold');
 if(pwFold){
  pwFold.addEventListener('toggle',()=>{if(ready&&pwFold.open)loadMascotPasswords()});
 }
 const saveAllBtn=$('#save-all-mascot-passwords');
 if(saveAllBtn){
  saveAllBtn.addEventListener('click',saveAllPasswords);
 }

 if($('#arcade-admin')){
  $('#arcade-admin').addEventListener('toggle',()=>{if(ready&&$('#arcade-admin').open)load().catch(e=>notice(e.message))});
  $('#arcade-admin-refresh').addEventListener('click',()=>load().catch(e=>notice(e.message)));
 }
 window.addEventListener('class-admin-ready',()=>{
  ready=true;
  if($('#arcade-admin')?.open)load().catch(e=>notice(e.message));
  if(pwFold?.open)loadMascotPasswords();
 });
 window.addEventListener('class-admin-logout',()=>{
  ready=false;
  if($('#arcade-admin'))$('#arcade-admin').open=false;
  if(pwFold)pwFold.open=false;
  $('#arcade-admin-drawings')?.replaceChildren();
  $('#arcade-admin-scores')?.replaceChildren();
  $('#manage-mascot-passwords')?.replaceChildren();
 });
})();
