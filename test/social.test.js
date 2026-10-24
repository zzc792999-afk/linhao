import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {PGlite} from '@electric-sql/pglite';
import {sqliteStore,postgresStore} from '../database.js';
import {hashPassword} from '../admin.js';
import {createApp} from '../server.js';
for(const backend of ['sqlite','postgres'])test(backend+': shared challenge, server-locked capsules, drawings and admin achievements',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'class-social-')),engine=backend==='postgres'?new PGlite():null;
 const query=async(sql,args)=>{const r=await engine.query(sql,args);return {...r,rowCount:r.affectedRows}};
 const pool={query,connect:async()=>({query,release(){}}),end:async()=>{}};
 const old=process.env.ADMIN_PASSWORD_HASH;process.env.ADMIN_PASSWORD_HASH=await hashPassword('social-admin-password');let server;
 try{
  const store=engine?await postgresStore(pool):sqliteStore(dir);server=await createApp(dir,store);await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
  function browser(){const jar=new Map();return async(route,method='GET',body)=>{const r=await fetch(base+'/api'+route,{method,headers:{Cookie:[...jar].map(([k,v])=>k+'='+v).join('; '),'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});for(const c of r.headers.getSetCookie()){const pair=c.split(';')[0],i=pair.indexOf('=');jar.set(pair.slice(0,i),pair.slice(i+1))}return {status:r.status,data:await r.json()}}}
  const a=browser(),b=browser(),admin=browser();await a('/extended');await b('/extended');await admin('/admin/login','POST',{password:'social-admin-password'});
  assert.equal((await a('/challenge','PUT',{name:'甲',answers:[0]})).status,400);
  await a('/challenge','PUT',{name:'甲',answers:[0,0,0,0,0]});await b('/challenge','PUT',{name:'乙',answers:[1,1,1,1,1]});
  let state=(await a('/extended')).data;assert.equal(state.challenge.participants,2);assert.equal(state.challenge.myScore,100);assert.deepEqual(state.challenge.counts[0],[1,1,0,0]);
  await a('/challenge','PUT',{name:'甲改名',answers:[1,1,1,1,1]});state=(await b('/extended')).data;assert.equal(state.challenge.participants,2);assert.deepEqual(state.challenge.counts[0],[0,2,0,0]);
  assert.equal((await a('/capsules','POST',{name:'甲',title:'时间无效',content:'secret',unlockAt:new Date().toISOString()})).status,400);
  const future=new Date(Date.now()+86400000).toISOString(),secret='绝不能提前泄露的内容<future-secret>';
  let r=await a('/capsules','POST',{name:'甲',title:'未来的我们',content:secret,unlockAt:future});assert.equal(r.status,201);const capsule=r.data.capsules[0];assert.equal(capsule.content,null);assert.equal(capsule.locked,true);assert.equal(capsule.mine,true);assert.equal(JSON.stringify(r.data).includes(secret),false);
  for(const get of [await a('/extended?now=2999-01-01&includeSealedContent=true'),await b('/extended')])assert.equal(JSON.stringify(get.data).includes(secret),false);
  const adminCapsule=(await admin('/admin/dashboard')).data.extended.capsules.find(c=>c.id===capsule.id);assert.equal(adminCapsule.content,secret);assert.equal(adminCapsule.locked,true);assert.equal((await b('/admin/dashboard')).status,401);assert.equal((await a('/extended')).data.capsules[0].content,null);
  assert.equal((await b('/capsules/'+capsule.id,'DELETE')).status,403);
  const opened=await store.extended('someone',new Date(Date.now()+2*86400000).toISOString());assert.equal(opened.capsules[0].content,secret);assert.equal(opened.capsules[0].locked,false);
  const strokes=[{color:'#234b3a',width:7,points:[[0.1,0.2],[0.7,0.8]]}];
  assert.equal((await a('/drawings','POST',{name:'甲',title:'无效',strokes:[{...strokes[0],points:[[100,2]]}]})).status,400);
  r=await a('/drawings','POST',{name:'甲',title:'共享作品',strokes});assert.equal(r.status,201);const drawing=r.data.drawings[0];assert.equal(r.data.drawings[0].strokes,undefined);assert.deepEqual((await b('/drawings/'+drawing.id)).data.strokes,strokes);assert.equal((await b('/drawings/'+drawing.id,'DELETE')).status,403);
  for(const type of ['capsules','drawings','challenges','achievements'])assert.equal((await b('/admin/'+type+'/'+drawing.id,'DELETE')).status,401);
  assert.equal((await b('/admin/achievements','POST',{})).status,401);
  assert.equal((await admin('/admin/achievements','POST',{title:'无效',description:'x',icon:'🏆',eventDay:'2026-02-30'})).status,400);
  r=await admin('/admin/achievements','POST',{title:'我们的第一次',description:'一起完成了挑战',icon:'🏆',eventDay:'2026-10-24'});assert.equal(r.status,201);const achievement=r.data.id;assert.equal((await a('/extended')).data.achievements[0].id,achievement);
  // Reinitializing schema preserves shared records and locked content.
  if(engine)await postgresStore(pool);assert.equal((await b('/extended')).data.drawings[0].id,drawing.id);assert.equal((await b('/extended')).data.capsules[0].content,null);
  await admin('/admin/drawings/'+drawing.id,'DELETE');assert.equal((await b('/drawings/'+drawing.id)).status,404);
  await a('/capsules/'+capsule.id,'DELETE');assert.equal((await b('/extended')).data.capsules.length,0);await admin('/admin/achievements/'+achievement,'DELETE');assert.equal((await a('/extended')).data.achievements.length,0);
  const challenge=(await admin('/admin/dashboard')).data.challengeEntries[0].id;await admin('/admin/challenges/'+challenge,'DELETE');assert.equal((await a('/extended')).data.challenge.participants,1);
 }finally{if(old===undefined)delete process.env.ADMIN_PASSWORD_HASH;else process.env.ADMIN_PASSWORD_HASH=old;if(server?.listening)await new Promise(r=>{server.close(r);server.closeAllConnections()});await engine?.close();await rm(dir,{recursive:true,force:true})}
});
