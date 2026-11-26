import {mascots} from './arcade-database.js';

const dayMs=86400000;
const cast=['penguin','rednose',...mascots.map(m=>m.id).filter(id=>!['penguin','rednose'].includes(id))];
const cases=[
 ['鸡窝门口的湿脚印','👣','去时两排脚印，回来怎么有三排？','把地垫翻过来，小鸡正穿着两只印章学走路。','沾水的小印章'],
 ['半夜响起的下课铃','🛎️','机房早锁了，窝里却响了三遍下课铃。','掀开草垫，原来小鸡把闹钟设成了下课铃，还按了两次稍后提醒。','掉漆的铃铛'],
 ['失踪的最后一粒玉米','🌽','粮仓门从里面锁着，盘子却空了。','抬头一看，玉米被小鸡串在门帘上，开一次门就掉一粒。','一截玉米绳'],
 ['值班本上多出的签名','✏️','值班本末尾有个湿漉漉的「到」，今晚谁来了？','推开窗，晾衣绳上的值日袖章正随风给本子盖章。','反印的袖章']
];
const special={panda:'用竹竿轻轻挑起草垫，碰见一个正要溜走的小脑袋。',owl:'蹲在梁上闭上一只眼，等到灯灭，终于看清了影子。',dog:'贴地闻过三圈，停在一块有新鲜爪印的砖前。',turtle:'缩进壳里假装石头，等到草垫自己动了一下。',penguin:'趴下来沿着地面滑了一圈，刹车时刚好停在线索旁边。',rednose:'关掉手电，把红鼻子贴近窗玻璃，从倒影里看见了动静。',chicken:'假装提前打鸣，躲在草垫里的小家伙跟着应了一声。'};
const iso=n=>new Date(n).toISOString().slice(0,10);
export function patrolClock(now){
 const local=now+8*3600000, hour=new Date(local).getUTCHours();
 const index=Math.floor((local-6*3600000)/dayMs);
 return {index,day:iso(index*dayMs),previous:iso((index-1)*dayMs),open:hour>=18||hour<6};
}
function episode(index){
 const start=((index-20783)*3%cast.length+cast.length)%cast.length;
 return {story:cases[index%cases.length],ids:[0,1,2].map(i=>cast[(start+i)%cast.length])};
}
function detective(id){return mascots.find(m=>m.id===id)}
function verdict(index,rows){
 if(!rows.length)return null;
 const {story,ids}=episode(index);
 const counts=new Map(rows.map(r=>[r.mascot,r]));
 const winner=ids.reduce((a,b)=>Number(counts.get(b)?.votes||0)>Number(counts.get(a)?.votes||0)?b:a);
 const m=detective(winner),report=counts.get(winner);
 const evidence=['一张拓印','一幅现场速写','一份爪印比对记录'][ids.indexOf(winner)];
 const clue=story[4]+'的'+evidence;
 const action=special[winner]||['提着灯绕到鸡窝背面，发现门缝里有东西在晃。','屏住呼吸躲到门后，等到了第二声响。','翻开值夜本，把刚才的动静和昨天的记录对上了。'][ids.indexOf(winner)];
 const skill=Number(report.level)>=7?'使出「'+m.attackSkill.name+'」，把藏在暗处的痕迹照了个清楚。':'';
 return {title:story[0],id:winner,name:m.baseName,clue,votes:Number(report.votes),panels:[
  ['鸡窝门口',story[1],story[2]],['出发调查','🔦',m.baseName+action],['真相大白','🐤',skill+story[3]],['值夜本','📓','证物「'+clue+'」交给下一班。小鸡在签名旁边画了一只歪歪扭扭的爪子。']
 ]};
}
export async function nightPatrol(db,owner,now,body){
 const clock=patrolClock(now),{ids,story}=episode(clock.index);
 if(body!==undefined){
  if(!clock.open||body?.day!==clock.day)return [409,{error:'这一轮尚未开放或已经收队，请刷新。'}];
  if(!ids.includes(body?.mascot))return [400,{error:'请选择本轮候选队员。'}];
  const state=await db.arcadeState(owner,clock.day);
  const level=state.pets.find(p=>p.id===body.mascot).level;
  await db.patrolVote(clock.day,owner,body.mascot,level);
 }
 const [rows,prior]=await Promise.all([db.patrolTotals(clock.day,owner),db.patrolTotals(clock.previous,owner)]);
 const previous=verdict(clock.index-1,prior);
 return [200,{day:clock.day,open:clock.open,title:story[0],intro:story[2],icon:story[1],previous,
  lead:previous?'上一班留下的「'+previous.clue+'」派上了用场：'+['把它放在窗沿当记号，正好看出谁动过窗。','轻轻碰了一下它，窝里立刻有人应声。','用它抵住门缝，粮仓里漏出一线光。','拿它压住值班本，那一页终于没被风吹走。'][clock.index%4]:'',
  candidates:ids.map(id=>{const row=rows.find(r=>r.mascot===id);return {id,name:detective(id).baseName,votes:Number(row?.votes||0),mine:Number(row?.mine||0)>0}})
 }];
}
