import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {PGlite} from '@electric-sql/pglite';
import {sqliteStore,postgresStore} from '../database.js';
import {hashPassword,classDay} from '../admin.js';
import {createApp} from '../server.js';
for(const backend of ['sqlite','postgres'])test(backend+': admin authorization, moderation, polls, daily checkins and password rotation',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'class-admin-')),engine=backend==='postgres'?new PGlite():null;
 const query=async(sql,args)=>{const r=await engine.query(sql,args);return {...r,rowCount:r.affectedRows}};
 const pool={query,connect:async()=>({query,release(){}}),end:async()=>{}};
 const old=process.env.ADMIN_PASSWORD_HASH;process.env.ADMIN_PASSWORD_HASH=await hashPassword('test-admin-password-123');let server;
 try{
  const store=engine?await postgresStore(pool):sqliteStore(dir);server=await createApp(dir,store);await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
  function client(){const cookies=new Map();return async(route,method='GET',body,headers={})=>{const r=await fetch(base+'/api'+route,{method,headers:{Cookie:[...cookies].map(([k,v])=>k+'='+v).join('; '),'Content-Type':'application/json',...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});for(const line of r.headers.getSetCookie()){const pair=line.split(';')[0],i=pair.indexOf('=');cookies.set(pair.slice(0,i),pair.slice(i+1))}return {status:r.status,data:await r.json()}}}
  const admin=client(),second=client(),visitor=client(),other=client();
  assert.equal((await visitor('/admin/session')).data.authenticated,false);
  for(const [url,method,body] of [['/admin/dashboard','GET'],['/admin/settings','PUT',{announcement:'hacked',roster:''}],['/admin/polls','POST',{title:'x',options:['a','b']}],['/admin/notes/'+'a'.repeat(32),'DELETE'],['/admin/photos/'+'a'.repeat(32),'DELETE'],['/admin/password','PUT',{password:'password-password'}]])assert.equal((await visitor(url,method,body)).status,401);
  assert.equal((await admin('/admin/login','POST',{password:'wrong'})).status,401);
  assert.equal((await admin('/admin/login','POST',{password:'test-admin-password-123'},{Origin:'https://evil.example'})).status,403);
  assert.equal((await admin('/admin/login','POST',{password:'test-admin-password-123'})).status,200);
  assert.equal((await second('/admin/login','POST',{password:'test-admin-password-123'})).status,200);
  assert.equal((await admin('/admin/settings','PUT',{announcement:'班级公告 <script>test</script>',roster:'小明\n小红\n小明'})).status,200);
  let fun=(await visitor('/fun')).data;assert.equal(fun.announcement,'班级公告 <script>test</script>');assert.deepEqual(fun.roster,['小明','小红']);assert.equal(fun.day,classDay());
  await visitor('/checkin','PUT',{name:'测试同学',mood:'元气满满'});await visitor('/checkin','PUT',{name:'测试同学',mood:'专心写码'});
  fun=(await other('/fun')).data;assert.equal(fun.checkins.length,1);assert.equal(fun.checkins[0].mood,'专心写码');assert.equal(fun.checkins[0].mine,false);assert.equal((await visitor('/checkin','PUT',{name:'x',mood:'invalid'})).status,400);
  const poll=(await admin('/admin/polls','POST',{title:'测试投票',options:['甲','乙']})).data.id;assert.ok(poll);
  await visitor('/polls/'+poll+'/vote','PUT',{choice:0});await visitor('/polls/'+poll+'/vote','PUT',{choice:1});await other('/polls/'+poll+'/vote','PUT',{choice:0});
  fun=(await visitor('/fun')).data;assert.deepEqual(fun.polls.find(p=>p.id===poll).counts,[1,1]);assert.equal(fun.polls.find(p=>p.id===poll).choice,1);
  assert.equal((await visitor('/polls/'+poll+'/vote','PUT',{choice:9})).status,400);await admin('/admin/polls/'+poll,'PUT',{open:false});assert.equal((await visitor('/polls/'+poll+'/vote','PUT',{choice:0})).status,409);
  const note=(await visitor('/notes','POST',{name:'同学',text:'管理员可以管理此留言'})).data.notes[0];await store.addPhoto({id:'a'.repeat(32),owner:'different',name:'test',date:new Date().toISOString(),data:Buffer.from('test')});
  assert.equal((await visitor('/notes/'+note.id,'DELETE')).status,200); // create another foreign-owned row directly for moderation
  await store.add({id:'b'.repeat(32),owner:'different',name:'同学',text:'moderation',date:new Date().toISOString()});
  assert.equal((await admin('/admin/notes/'+'b'.repeat(32),'DELETE')).status,200);assert.equal((await admin('/admin/photos/'+'a'.repeat(32),'DELETE')).status,200);
  const dash=(await admin('/admin/dashboard')).data;assert.equal(dash.stats.photos,0);assert.equal(dash.stats.notes,0);assert.ok(dash.audit.length>=3);assert.equal(JSON.stringify(dash).includes('admin_password_hash'),false);
  await admin('/admin/polls/'+poll,'DELETE');if(engine)await postgresStore(pool);assert.equal((await visitor('/fun')).data.polls.some(p=>p.id===poll),false);
  assert.equal((await admin('/admin/password','PUT',{currentPassword:'wrong',password:'new-password-1234'})).status,403);
  assert.equal((await admin('/admin/password','PUT',{currentPassword:'test-admin-password-123',password:'new-password-1234'})).status,200);
  assert.equal((await second('/admin/dashboard')).status,401);assert.equal((await admin('/admin/dashboard')).status,401);
  assert.equal((await admin('/admin/login','POST',{password:'test-admin-password-123'})).status,401);assert.equal((await admin('/admin/login','POST',{password:'new-password-1234'})).status,200);
  await admin('/admin/logout','POST');assert.equal((await admin('/admin/dashboard')).status,401);
  for(const route of ['/admin.js','/activity-database.js','/.env'])assert.equal((await fetch(base+route)).status,404);
  for(const route of ['/admin','/admin/','/admin-client.js','/fun.js'])assert.equal((await fetch(base+route)).status,200);
 }finally{if(old===undefined)delete process.env.ADMIN_PASSWORD_HASH;else process.env.ADMIN_PASSWORD_HASH=old;if(server?.listening)await new Promise(r=>{server.close(r);server.closeAllConnections()});await engine?.close();await rm(dir,{recursive:true,force:true})}
});
