import {randomBytes,randomInt,createHash} from 'node:crypto';
import {validateStrokes} from './social.js';
import {mascots} from './arcade-database.js';
const words=[['熊猫','动物'],['猫头鹰','动物'],['长颈鹿','动物'],['小白兔','动物'],['企鹅','动物'],['海豚','动物'],['蝴蝶','动物'],['蜗牛','动物'],['章鱼','动物'],['螃蟹','动物'],['刺猬','动物'],['河马','动物'],['西瓜','食物'],['草莓','食物'],['冰淇淋','食物'],['棒棒糖','食物'],['汉堡','食物'],['饺子','食物'],['香蕉','食物'],['菠萝','食物'],['披萨','食物'],['雨伞','物品'],['自行车','物品'],['眼镜','物品'],['书包','物品'],['键盘','物品'],['鼠标','物品'],['篮球','物品'],['吉他','物品'],['闹钟','物品'],['火箭','物品'],['风筝','物品'],['彩虹','自然'],['太阳','自然'],['月亮','自然'],['雪人','自然'],['向日葵','自然'],['仙人掌','自然'],['火山','自然'],['瀑布','自然']];
const idOk=s=>typeof s==='string'&&/^[a-f0-9]{32}$/.test(s);
const mascotOk=s=>mascots.some(m=>m.id===s);
const normalize=s=>s.normalize('NFKC').replace(/\s+/gu,'').toLocaleLowerCase();
const dayAt=time=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(time));
const digest=s=>createHash('sha256').update(s).digest('hex');
export function arcadeRoutes(db,readJson,{now=()=>Date.now()}={}){return async(req,res,url,owner,send)=>{
 const route=url.pathname;if(!route.startsWith('/api/arcade'))return false;
 const timestamp=now(),day=dayAt(timestamp),date=new Date(timestamp).toISOString();
 const state=()=>db.arcadeState(owner,day);
 if(route==='/api/arcade'&&req.method==='GET'){send(200,await state());return true}
 if(route==='/api/arcade/profile'&&req.method==='PUT'){
  const b=await readJson(req);if(typeof b.name!=='string'||!b.name.trim()||b.name.length>16||!mascotOk(b.mascot)){send(400,{error:'昵称需要 1–16 字，并选择一位吉祥物'});return true}
  await db.arcadeSaveProfile(owner,b.name.trim(),b.mascot);send(200,await state());return true;
 }
 if(route==='/api/arcade/feed'&&req.method==='PUT'){
  const b=await readJson(req);if(!mascotOk(b.mascot)){send(400,{error:'这位吉祥物还没有加入班级'});return true}
  await db.arcadeFeed(day,owner,b.mascot);send(200,await state());return true;
 }
 if(route==='/api/arcade/intimacy'&&req.method==='POST'){
  const b=await readJson(req);
  const code=typeof b.code==='string'?b.code.trim().toLowerCase():'';
  if(code!=='xyg'){send(403,{error:'密码不对哦~'});return true}
  const current=await db.setting('panda_cat_intimate').catch(()=>'0');
  const next=b.toggle?(current==='1'?'0':'1'):'1';
  await db.saveSetting('panda_cat_intimate',next);
  send(200,{ok:true,intimate:next==='1',state:await state()});return true;
 }
 if(route==='/api/arcade/reaction'&&req.method==='POST'){
  const b=await readJson(req);if(!idOk(b.attemptId)||!Array.isArray(b.rounds)||b.rounds.length!==3||b.rounds.some(n=>!Number.isInteger(n)||n<50||n>2000)){send(400,{error:'请完成三轮反应挑战，每轮有效成绩为 50–2000 毫秒'});return true}
  await db.arcadeCleanup(dayAt(timestamp-7*86400000),timestamp);
  const score=[...b.rounds].sort((a,b)=>a-b)[1],result=await db.arcadeReaction({id:b.attemptId,owner,rounds:b.rounds,score,scoreId:randomBytes(16).toString('hex'),day,date});
  if(result!=='ok'){send(result==='limit'?429:409,{error:result==='limit'?'今天已记录 30 次挑战，休息一下明天再来吧':result==='revoked'?'这次成绩已移出趣味榜，请重新玩一局':'这次挑战编号已使用，请重新开始一局'});return true}
  send(200,await state());return true;
 }
 if(route==='/api/arcade/words'&&req.method==='POST'){
  await readJson(req);await db.arcadeCleanup(dayAt(timestamp-7*86400000),timestamp);
  const shuffled=[...words];for(let i=shuffled.length-1;i>0;i--){const j=randomInt(i+1);[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]]}const choices=shuffled.slice(0,3).map(([word,hint])=>({id:randomBytes(8).toString('hex'),word,hint}));await db.arcadeSaveTicket(owner,randomBytes(16).toString('hex'),choices,timestamp+30*60000);const ticket=await db.arcadeTicket(owner);
  send(200,{ticket:ticket.ticket,words:JSON.parse(ticket.choices),expiresAt:new Date(Number(ticket.expires_at)).toISOString()});return true;
 }
 if(route==='/api/arcade/drawings'&&req.method==='POST'){
  const b=await readJson(req);if(!idOk(b.id)||!idOk(b.ticket)||typeof b.wordId!=='string'||! /^[a-f0-9]{16}$/.test(b.wordId)||!validateStrokes(b.strokes)){send(400,{error:'请先领取题目并完成画作（最多 150 笔、6000 个点）'});return true}
  const fingerprint=digest(JSON.stringify({ticket:b.ticket,wordId:b.wordId,strokes:b.strokes})),existing=await db.arcadeRawDrawing(b.id);
  if(existing){if(existing.owner!==owner||existing.fingerprint!==fingerprint){send(409,{error:'这幅画的发布编号已使用，请重新发布'});return true}send(existing.deleted?410:200,existing.deleted?{error:'这幅画已被删除，不会重复发布'}:{id:existing.id});return true}
  const ticket=await db.arcadeTicket(owner,b.ticket),choice=ticket&&JSON.parse(ticket.choices).find(w=>w.id===b.wordId);
  if(!choice||Number(ticket.expires_at)<=timestamp){send(409,{error:'题目已过期，请重新领取题目后发布'});return true}
  const profile=await db.arcadeProfile(owner),added=await db.arcadeCreateDrawing({id:b.id,owner,name:profile.name,answer:choice.word,hint:choice.hint,strokes:b.strokes,fingerprint,date});
  if(!added){const saved=await db.arcadeRawDrawing(b.id);if(saved&&saved.owner===owner&&saved.fingerprint===fingerprint&&!saved.deleted){send(200,{id:saved.id});return true}send(409,{error:'你画我猜最多保留 100 幅画，每个浏览器最多 5 幅，请先整理旧画作'});return true}
  send(201,{id:b.id});return true;
 }
 const drawing=/^\/api\/arcade\/drawings\/([a-f0-9]{32})$/.exec(route);
 if(drawing&&req.method==='GET'){const item=await db.arcadeDrawing(drawing[1],owner);send(item?200:404,item||{error:'画作已被删除'});return true}
 if(drawing&&req.method==='DELETE'){const removed=await db.arcadeDeleteDrawing(drawing[1],owner);send(removed?200:403,removed?{ok:true}:{error:'只能删除当前浏览器发布的画作'});return true}
 const guess=/^\/api\/arcade\/drawings\/([a-f0-9]{32})\/guess$/.exec(route);
 if(guess&&req.method==='POST'){
  const b=await readJson(req);if(typeof b.answer!=='string'||!b.answer.trim()||b.answer.length>30){send(400,{error:'答案需要 1–30 字'});return true}
  const item=await db.arcadeRawDrawing(guess[1]);if(!item||item.deleted){send(404,{error:'画作已被删除'});return true}if(item.owner===owner){send(409,{error:'这是你出的题，留给其他同学来猜吧'});return true}
  const response=async progress=>({correct:!!progress?.solved,answer:progress?.solved?item.answer:null,remaining:Math.max(0,20-Number(progress?.misses||0)),solvedCount:await db.arcadeSolvedCount(item.id)});
  let progress=await db.arcadeGuessState(item.id,owner);if(progress?.solved){send(200,await response(progress));return true}
  if(Number(progress?.misses)>=20){send(429,{error:'这幅画的 20 次猜测已用完，换一幅挑战吧'});return true}
  const correct=normalize(b.answer)===normalize(item.answer),accepted=await db.arcadeRecordGuess(item.id,owner,correct,timestamp);progress=await db.arcadeGuessState(item.id,owner);
  if(!accepted&&!progress?.solved){const current=await db.arcadeRawDrawing(item.id);send(current?.deleted?404:429,{error:current?.deleted?'画作已被删除':'猜得太快了，请等一秒再试'});return true}
  send(200,await response(progress));return true;
 }
 return false;
}}
// Only call this handler from inside the existing authenticated adminRoutes gate.
export function arcadeAdminRoutes(db){return async(req,res,url,owner,send)=>{
 if(url.pathname==='/api/admin/arcade'&&req.method==='GET'){send(200,await db.arcadeAdmin());return true}
 const target=/^\/api\/admin\/arcade\/(drawings|scores)\/([a-f0-9]{32})$/.exec(url.pathname);
 if(target&&req.method==='DELETE'){if(target[1]==='drawings')await db.arcadeDeleteDrawing(target[2]);else await db.arcadeDeleteScore(target[2]);send(200,{ok:true});return true}return false;
}}
