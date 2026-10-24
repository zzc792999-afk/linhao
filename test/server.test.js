import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createApp} from '../server.js';

test('cross-device sharing, ownership, validation, static isolation and restart persistence',async()=>{
  const directory=await mkdtemp(path.join(tmpdir(),'class2501-'));
  let server;let base;
  const start=async()=>{server=createApp(directory);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base='http://127.0.0.1:'+server.address().port};
  const stop=()=>new Promise((resolve,reject)=>{server.close(error=>error?reject(error):resolve());server.closeAllConnections()});
  function browser(){let cookie='';return async(route,method='GET',body,extra={})=>{const response=await fetch(base+route,{method,headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{}),...extra},...(body===undefined?{}:{body:JSON.stringify(body)})});if(response.headers.get('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];return {status:response.status,data:await response.json()}}}
  try{
    await start();const a=browser(),b=browser();
    assert.equal((await a('/healthz')).status,200);
    assert.deepEqual((await a('/api/state')).data.notes,[]);
    await b('/api/state');
    const posted=await a('/api/notes','POST',{name:'同学A',text:'<script>alert(1)</script> 跨设备测试'});
    assert.equal(posted.status,201);assert.equal(posted.data.notes[0].mine,true);
    const id=posted.data.notes[0].id;
    const other=await b('/api/state');assert.equal(other.data.notes[0].text,'<script>alert(1)</script> 跨设备测试');assert.equal(other.data.notes[0].mine,false);
    assert.equal((await b('/api/notes/'+id,'DELETE')).status,403);
    assert.equal((await a('/api/notes','POST',{name:'A',text:'频繁提交'})).status,429);
    assert.equal((await b('/api/notes','POST',{name:'A',text:'x'.repeat(201)})).status,400);
    assert.equal((await b('/api/notes','POST',{name:'A',text:' ' })).status,400);
    assert.equal((await b('/api/notes','POST',{name:'A',text:'CSRF'},{Origin:'https://other.example'})).status,403);
    assert.equal((await b('/api/notes','POST',{name:'A',text:'x'.repeat(5000)})).status,413);
    await a('/api/likes/p2','PUT',{liked:true});await a('/api/likes/p2','PUT',{liked:true});
    assert.equal((await b('/api/state')).data.likes.p2.count,1);
    await b('/api/likes/p2','PUT',{liked:true});assert.equal((await a('/api/state')).data.likes.p2.count,2);
    for(const route of ['/server.js','/data/class.db','/package.json','/.git/config','/%2e%2e/server.js'])assert.equal((await fetch(base+route)).status,404);
    for(const route of ['/','/style.css','/app.js','/assets/p1.jpg','/assets/p2.jpg','/assets/p3.jpg'])assert.equal((await fetch(base+route)).status,200);
    await stop();await start();
    const persisted=await a('/api/state');assert.equal(persisted.data.notes[0].id,id);assert.equal(persisted.data.notes[0].mine,true);assert.equal(persisted.data.likes.p2.count,2);
    await a('/api/likes/p2','PUT',{liked:false});assert.equal((await b('/api/state')).data.likes.p2.count,1);
    assert.equal((await a('/api/notes/'+id,'DELETE')).status,200);assert.equal((await b('/api/state')).data.notes.length,0);
  }finally{if(server?.listening)await stop();await rm(directory,{recursive:true,force:true})}
});
