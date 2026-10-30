import {randomBytes,createHash,scrypt as rawScrypt,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import {boardInput} from './board.js';
import {arcadeAdminRoutes} from './arcade.js';
import {campusAdminRoutes} from './campus.js';

const scrypt=promisify(rawScrypt);
const hash=s=>createHash('sha256').update(s).digest('hex');
export async function hashPassword(password){const salt=randomBytes(16).toString('hex');return salt+':'+Buffer.from(await scrypt(password,salt,64)).toString('hex')}
async function verify(password,encoded){
 if(typeof password!=='string'||password.length>128||!/^\w{32}:[a-f0-9]{128}$/.test(encoded||''))return false;
 const [salt,value]=encoded.split(':');const actual=await scrypt(password,salt,64);return timingSafeEqual(actual,Buffer.from(value,'hex'));
}
export const classDay=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());

export function adminRoutes(db,readJson){
 const arcadeAdmin=arcadeAdminRoutes(db);
 const campusAdmin=campusAdminRoutes(db,readJson);
 const attempts=new Map();let globalAttempts={start:Date.now(),count:0};
 const cookie=(res,value,maxAge)=>res.appendHeader('Set-Cookie',`class_admin=${value}; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${process.env.NODE_ENV==='production'?'; Secure':''}`);

 return async(req,res,url,owner,send)=>{
  if(!url.pathname.startsWith('/api/admin/'))return false;
  const current=await db.setting('admin_password_hash',process.env.ADMIN_PASSWORD_HASH||'');
  const token=/(?:^|;\s*)class_admin=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie||'')?.[1];
  const authenticated=!!(current&&token&&await db.session(hash(token),hash(current),Date.now()));
  if(url.pathname==='/api/admin/session'&&req.method==='GET'){send(200,{authenticated,configured:!!current});return true}
  if(url.pathname==='/api/admin/login'&&req.method==='POST'){
   if(!current){send(503,{error:'管理员密码尚未配置'});return true}
   const now=Date.now();if(now-globalAttempts.start>900000)globalAttempts={start:now,count:0};
   for(const [key,value] of attempts)if(now-value.start>900000)attempts.delete(key);
   const entry=attempts.get(owner)||{start:now,count:0};attempts.set(owner,entry);
   if(entry.count>=8||globalAttempts.count>=40){send(429,{error:'登录尝试过多，请 15 分钟后再试'});return true}
   entry.count++;globalAttempts.count++;
   const body=await readJson(req);
   if(!await verify(body.password,current)){send(401,{error:'管理员密码错误'});return true}
   const session=randomBytes(32).toString('hex');await db.newSession(hash(session),hash(current),now+8*3600000);cookie(res,session,8*3600);attempts.delete(owner);
   await db.audit(randomBytes(16).toString('hex'),'管理员登录','',new Date().toISOString());send(200,{ok:true});return true;
  }
  if(!authenticated){send(401,{error:'请先登录管理员后台'});return true}
  if(await arcadeAdmin(req,res,url,owner,send))return true;
  if(await campusAdmin(req,res,url,owner,send))return true;
  const audit=async(action,target='')=>db.audit(randomBytes(16).toString('hex'),action,target,new Date().toISOString());
  if(url.pathname==='/api/admin/board'&&req.method==='GET'){send(200,{items:await db.board(owner,true)});return true}
  const boardTarget=/^\/api\/admin\/board\/([a-f0-9]{32})$/.exec(url.pathname);
  if(url.pathname==='/api/admin/board'&&req.method==='POST'){
   const body=await readJson(req),input=boardInput(body);if(typeof body.id!=='string'||! /^[a-f0-9]{32}$/.test(body.id)){send(400,{error:'发布编号无效，请刷新后台'});return true}
   const existing=await db.boardItem(body.id);if(existing){const same=Object.entries(input).every(([key,value])=>key==='pinned'?!!existing[key]===value:existing[key]===value);send(same?200:409,same?{ok:true,id:body.id}:{error:'这份内容已经发布，请刷新后编辑'});return true}
   if(!await db.createBoard({...input,id:body.id,updated_at:new Date().toISOString()})){const saved=await db.boardItem(body.id);if(saved&&Object.entries(input).every(([key,value])=>key==='pinned'?!!saved[key]===value:saved[key]===value)){send(200,{ok:true,id:body.id});return true}send(409,{error:'发布编号已使用或班务已达 300 条，请刷新列表后重试'});return true}
   await audit('发布班级事务',body.id);send(201,{ok:true,id:body.id});return true;
  }
  if(boardTarget&&['PUT','PATCH'].includes(req.method)){
   const body=await readJson(req),existing=await db.boardItem(boardTarget[1]);if(!existing){send(404,{error:'班务不存在'});return true}if(typeof body.version!=='string'||body.version!==existing.updated_at){send(409,{error:'内容已被更新，请先刷新列表，再重新编辑'});return true}
   const now=new Date(Math.max(Date.now(),Date.parse(existing.updated_at)+1)).toISOString();let updated;
   if(req.method==='PUT')updated=await db.updateBoard({...boardInput(body),id:existing.id,updated_at:now},body.version);
   else{if(typeof body.archived!=='boolean'){send(400,{error:'归档状态无效'});return true}updated=await db.archiveBoard(existing.id,body.archived,body.version,now)}
   if(!updated){send(409,{error:'内容刚被其他管理员更新，请刷新后再操作'});return true}await audit(req.method==='PUT'?'编辑班级事务':body.archived?'归档班级事务':'恢复班级事务',existing.id);send(200,{ok:true});return true;
  }
  if(boardTarget&&req.method==='DELETE'){await db.deleteBoard(boardTarget[1]);await audit('删除班级事务',boardTarget[1]);send(200,{ok:true});return true}
  if(url.pathname==='/api/admin/logout'&&req.method==='POST'){await db.deleteSession(hash(token));cookie(res,'',0);send(200,{ok:true});return true}
  if(url.pathname==='/api/admin/password'&&req.method==='PUT'){
   const body=await readJson(req);
   if(!await verify(body.currentPassword,current)){send(403,{error:'原密码错误'});return true}
   if(typeof body.password!=='string'||body.password.length<12||body.password.length>128){send(400,{error:'新密码需要 12–128 个字符'});return true}
   await db.saveSetting('admin_password_hash',await hashPassword(body.password));cookie(res,'',0);await audit('修改管理员密码');send(200,{ok:true});return true;
  }
  if(url.pathname==='/api/admin/dashboard'&&req.method==='GET'){
   const page=Math.min(100000,Math.max(0,Number.parseInt(url.searchParams.get('page')||'0',10)||0));
   const [dash, fun, ext, chEntries, marquee, teachers, reviews, targets] = await Promise.all([
     db.dashboard(page),
     db.fun(owner,classDay()),
     db.extended(owner,new Date().toISOString(),true),
     db.challengeEntries(),
     db.marqueeMessages(),
     db.teachers(),
     db.adminAllTeacherReviews(),
     db.targets('')
   ]);
   send(200,{...dash,fun,extended:ext,challengeEntries:chEntries,campus:{marquee,teachers,reviews,targets}});
   return true;
  }
  if(url.pathname==='/api/admin/settings'&&req.method==='PUT'){
   const body=await readJson(req);
   if(typeof body.announcement!=='string'||body.announcement.length>500||typeof body.roster!=='string'||body.roster.length>1500){send(400,{error:'公告限 500 字，名单限 1500 字'});return true}
   const names=body.roster.split(/\r?\n/).map(n=>n.trim()).filter(Boolean);
   if(names.length>100||names.some(n=>n.length>20)){send(400,{error:'名单最多 100 人，每个名字限 20 字'});return true}
   await db.saveSetting('announcement',body.announcement.trim());await db.saveSetting('roster',[...new Set(names)].join('\n'));await audit('更新公告与点名名单');send(200,{ok:true});return true;
  }
  if(url.pathname==='/api/admin/polls'&&req.method==='POST'){
   const body=await readJson(req);
   if(typeof body.title!=='string'||!body.title.trim()||body.title.length>80||!Array.isArray(body.options)||body.options.length<2||body.options.length>6||body.options.some(o=>typeof o!=='string'||!o.trim()||o.length>30)||new Set(body.options.map(o=>o.trim())).size!==body.options.length){send(400,{error:'题目限 1–80 字，需要 2–6 个不重复的选项，每项限 30 字'});return true}
   if(await db.pollCount()>=20){send(409,{error:'最多保留 20 个投票，请先删除旧投票'});return true}
   const id=randomBytes(16).toString('hex');await db.createPoll({id,title:body.title.trim(),options:body.options.map(o=>o.trim()),date:new Date().toISOString()});await audit('创建投票',id);send(201,{ok:true,id});return true;
  }
  if(url.pathname==='/api/admin/achievements'&&req.method==='POST'){
   const b=await readJson(req);
   if(typeof b.title!=='string'||!b.title.trim()||b.title.length>60||typeof b.description!=='string'||b.description.length>500||!['🏆','🎓','✨','🤝','💻','🎉'].includes(b.icon)||typeof b.eventDay!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(b.eventDay)||!Number.isFinite(Date.parse(b.eventDay))||new Date(b.eventDay).toISOString().slice(0,10)!==b.eventDay){send(400,{error:'请填写有效的成就标题、日期、图标和说明（说明限 500 字）'});return true}
   const id=randomBytes(16).toString('hex');
   if(!await db.addAchievement({id,title:b.title.trim(),description:b.description.trim(),icon:b.icon,eventDay:b.eventDay,date:new Date().toISOString()})){send(409,{error:'成就墙最多 100 项，请先整理旧记录'});return true}
   await audit('发布班级成就',id);send(201,{ok:true,id});return true;
  }
  const socialRemoval=/^\/api\/admin\/(capsules|drawings|challenges|achievements)\/([a-f0-9]{32})$/.exec(url.pathname);
  if(socialRemoval&&req.method==='DELETE'){
   await db.removeSocial(socialRemoval[1],socialRemoval[2]);await audit('管理删除'+{capsules:'时光胶囊',drawings:'涂鸦作品',challenges:'挑战记录',achievements:'班级成就'}[socialRemoval[1]],socialRemoval[2]);send(200,{ok:true});return true;
  }
  const target=/^\/api\/admin\/(notes|photos|polls)\/([a-z0-9-]{1,64})$/.exec(url.pathname);
  if(target&&req.method==='DELETE'){
   const [,type,id]=target;
   if(type==='notes')await db.adminDeleteNote(id);if(type==='photos')await db.adminDeletePhoto(id);if(type==='polls')await db.deletePoll(id);
   await audit('删除'+{notes:'留言',photos:'照片',polls:'投票'}[type],id);send(200,{ok:true});return true;
  }
  if(target?.[1]==='polls'&&req.method==='PUT'){
   const body=await readJson(req);if(typeof body.open!=='boolean'){send(400,{error:'投票状态无效'});return true}
   await db.setPoll(target[2],body.open);await audit(body.open?'开放投票':'结束投票',target[2]);send(200,{ok:true});return true;
  }
  send(404,{error:'管理接口不存在'});return true;
 };
}
