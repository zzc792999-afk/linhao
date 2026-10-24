import {randomBytes,createHash,scrypt as rawScrypt,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
const scrypt=promisify(rawScrypt);
const hash=s=>createHash('sha256').update(s).digest('hex');
export async function hashPassword(password){const salt=randomBytes(16).toString('hex');return salt+':'+Buffer.from(await scrypt(password,salt,64)).toString('hex')}
async function verify(password,encoded){
 if(typeof password!=='string'||password.length>128||!/^\w{32}:[a-f0-9]{128}$/.test(encoded||''))return false;
 const [salt,value]=encoded.split(':');const actual=await scrypt(password,salt,64);return timingSafeEqual(actual,Buffer.from(value,'hex'));
}
export const classDay=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export function adminRoutes(db,readJson){
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
  const audit=async(action,target='')=>db.audit(randomBytes(16).toString('hex'),action,target,new Date().toISOString());
  if(url.pathname==='/api/admin/logout'&&req.method==='POST'){await db.deleteSession(hash(token));cookie(res,'',0);send(200,{ok:true});return true}
  if(url.pathname==='/api/admin/password'&&req.method==='PUT'){
   const body=await readJson(req);
   if(!await verify(body.currentPassword,current)){send(403,{error:'原密码错误'});return true}
   if(typeof body.password!=='string'||body.password.length<12||body.password.length>128){send(400,{error:'新密码需要 12–128 个字符'});return true}
   await db.saveSetting('admin_password_hash',await hashPassword(body.password));cookie(res,'',0);await audit('修改管理员密码');send(200,{ok:true});return true;
  }
  if(url.pathname==='/api/admin/dashboard'&&req.method==='GET'){
   const page=Math.min(100000,Math.max(0,Number.parseInt(url.searchParams.get('page')||'0',10)||0));
   send(200,{...await db.dashboard(page),fun:await db.fun(owner,classDay())});return true;
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
