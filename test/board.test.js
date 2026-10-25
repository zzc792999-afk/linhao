import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {sqliteStore,postgresStore} from '../database.js';
import {createApp} from '../server.js';
import {hashPassword} from '../admin.js';

for(const backend of ['sqlite','postgres'])test(backend+': class desk preserves history, validates publication and keeps personal completion separate',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'class-board-')),engine=backend==='postgres'?new PGlite():null;
 const query=async(sql,args)=>{const result=await engine.query(sql,args);return {...result,rowCount:result.affectedRows}};
 const pool={query,connect:async()=>({query,release(){}}),end:async()=>{}};
 const old=process.env.ADMIN_PASSWORD_HASH;process.env.ADMIN_PASSWORD_HASH=await hashPassword('class-board-test-password');let server;
 try{
  const store=engine?await postgresStore(pool):sqliteStore(dir);await store.add({id:'a'.repeat(32),owner:'legacy',name:'旧同学',text:'旧留言保持',date:new Date().toISOString()});await store.saveSetting('announcement','保留原公告');
  server=await createApp(dir,store);await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
  const client=()=>{const cookies=new Map();return async(route,method='GET',body,headers={})=>{const r=await fetch(base+'/api'+route,{method,headers:{'Content-Type':'application/json',Cookie:[...cookies].map(([k,v])=>k+'='+v).join('; '),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});for(const raw of r.headers.getSetCookie()){const c=raw.split(';')[0],i=c.indexOf('=');cookies.set(c.slice(0,i),c.slice(i+1))}return {status:r.status,data:await r.json()}}};
  const admin=client(),first=client(),second=client();const create=(kind,overrides={})=>({id:randomBytes(16).toString('hex'),kind,title:'验证班务 '+kind,detail:'完整说明 <script>test</script>',subject:'程序设计',location:'',url:'',startAt:'',dueAt:'',pinned:false,...overrides});
  assert.equal((await first('/board')).status,200);assert.deepEqual((await first('/board')).data.items,[]);assert.equal((await first('/admin/board')).status,401);assert.equal((await first('/admin/board','POST',create('notice'))).status,401);
  assert.equal((await admin('/admin/login','POST',{password:'class-board-test-password'})).status,200);
  const task=create('task',{dueAt:'2026-11-15T18:00:00+08:00',pinned:true});assert.equal((await admin('/admin/board','POST',task)).status,201);assert.equal((await admin('/admin/board','POST',task)).status,200);assert.equal((await admin('/admin/board','POST',{...task,title:'不同内容'})).status,409);
  let board=(await second('/board')).data.items;assert.equal(board.length,1);assert.equal(board[0].due_at,'2026-11-15T10:00:00.000Z');assert.equal(board[0].detail,task.detail);assert.equal(board[0].done,false);assert.equal(JSON.stringify(board).includes('legacy'),false);assert.equal(board[0].pinned,true);
  assert.equal((await first('/board/'+task.id+'/check','PUT',{done:true})).status,200);assert.equal((await first('/board/'+task.id+'/check','PUT',{done:true})).status,200);assert.equal((await first('/board')).data.items[0].done,true);assert.equal((await second('/board')).data.items[0].done,false);assert.equal((await first('/board/'+task.id+'/check','PUT',{done:'yes'})).status,400);
  assert.equal((await second('/admin/board/'+task.id,'DELETE')).status,401);assert.equal((await second('/admin/board/'+task.id,'PATCH',{archived:true,version:board[0].updated_at})).status,401);
  assert.equal((await admin('/admin/board/'+task.id,'PUT',{...task,title:'修改后的作业',version:board[0].updated_at})).status,200);assert.equal((await admin('/admin/board/'+task.id,'PUT',{...task,version:board[0].updated_at})).status,409);board=(await admin('/admin/board')).data.items;assert.equal(board[0].title,'修改后的作业');
  assert.equal((await admin('/admin/board/'+task.id,'PATCH',{archived:true,version:board[0].updated_at})).status,200);assert.equal((await first('/board')).data.items.length,0);assert.equal((await first('/board/'+task.id+'/check','PUT',{done:false})).status,409);board=(await admin('/admin/board')).data.items;assert.equal(board[0].archived,true);
  await admin('/admin/board/'+task.id,'PATCH',{archived:false,version:board[0].updated_at});assert.equal((await first('/board')).data.items[0].done,true);
  const event=create('event',{startAt:'2026-11-16T14:00:00+08:00',dueAt:'2026-11-16T15:00:00+08:00',location:'机房 101'});assert.equal((await admin('/admin/board','POST',event)).status,201);assert.equal((await first('/board/'+event.id+'/check','PUT',{done:true})).status,409);
  const resource=create('resource',{url:'https://docs.python.org/zh-cn/3/tutorial/'});assert.equal((await admin('/admin/board','POST',resource)).status,201);
  const concurrent=create('notice');const retries=await Promise.all([admin('/admin/board','POST',concurrent),admin('/admin/board','POST',concurrent)]);assert.ok(retries.every(r=>[200,201].includes(r.status)));assert.equal((await first('/board')).data.items.filter(i=>i.id===concurrent.id).length,1);
  for(const bad of [create('task'),create('event',{startAt:'2026-11-16T14:00:00Z',dueAt:'2026-11-16T13:00:00Z'}),create('task',{dueAt:'2026-02-31T00:00:00Z'}),create('resource'),create('resource',{url:'javascript:alert(1)'}),create('resource',{url:'https://name:secret@example.com/file'}),create('notice',{title:''})])assert.equal((await admin('/admin/board','POST',bad)).status,400);
  assert.equal((await admin('/admin/board','POST',create('notice'),{Origin:'https://evil.example'})).status,403);
  const before=(await first('/board')).data.items.length;assert.equal((await admin('/admin/board/'+event.id,'DELETE')).status,200);assert.equal((await first('/board')).data.items.length,before-1);assert.equal((await admin('/admin/board/'+event.id,'PUT',{...event,version:'old'})).status,404);
  if(engine)await postgresStore(pool);assert.equal((await first('/board')).data.items.some(i=>i.id===event.id),false);assert.equal((await store.notes('someone'))[0].text,'旧留言保持');assert.equal(await store.setting('announcement'),'保留原公告');
  for(const route of ['/board.js','/board-database.js','/.env'])assert.equal((await fetch(base+route)).status,404);for(const route of ['/board.css','/board-client.js','/board-admin.js'])assert.equal((await fetch(base+route)).status,200);
  await admin('/admin/logout','POST');assert.equal((await admin('/admin/board')).status,401);assert.equal((await second('/board')).status,200);
 }finally{if(old===undefined)delete process.env.ADMIN_PASSWORD_HASH;else process.env.ADMIN_PASSWORD_HASH=old;if(server?.listening)await new Promise(r=>{server.close(r);server.closeAllConnections()});await engine?.close();await rm(dir,{recursive:true,force:true})}
});
