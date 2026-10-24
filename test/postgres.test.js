import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {postgresStore,openStore} from '../database.js';
import {createApp} from '../server.js';

test('Postgres engine: shared API, cooldown, ownership, idempotent likes and reconnect',async()=>{
  const engine=new PGlite();
  const query=async(sql,args)=>{const result=await engine.query(sql,args);return {...result,rowCount:result.affectedRows}};
  const pool={query,connect:async()=>({query,release(){}}),end:async()=>{}};
  let server;
  try{
    const store=await postgresStore(pool);
    server=await createApp(undefined,store);
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    const base='http://127.0.0.1:'+server.address().port;
    function browser(){let cookie='';return async(route,method='GET',body)=>{
      const res=await fetch(base+'/api'+route,{method,headers:{Cookie:cookie,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
      cookie=res.headers.get('set-cookie')?.split(';')[0]||cookie;
      return {status:res.status,data:await res.json()};
    }}
    const a=browser(),b=browser();await a('/state');await b('/state');
    const posted=await a('/notes','POST',{name:'测试同学',text:"共享留言 '); DROP TABLE notes; --"});
    assert.equal(posted.status,201);
    const note=posted.data.notes[0];assert.equal(note.mine,true);
    assert.equal((await b('/state')).data.notes[0].text,note.text);
    assert.equal((await b('/notes/'+note.id,'DELETE')).status,403);
    assert.equal((await a('/notes','POST',{name:'同学',text:'重复'})).status,429);
    await a('/likes/p1','PUT',{liked:true});await a('/likes/p1','PUT',{liked:true});
    let state=(await b('/state')).data;assert.equal(state.likes.p1.count,1);assert.equal(state.likes.p1.liked,false);
    await b('/likes/p1','PUT',{liked:true});assert.equal((await a('/state')).data.likes.p1.count,2);
    // Reinitialize schema against the same external database: existing data stays intact.
    const reconnected=await postgresStore(pool);assert.equal((await reconnected.notes('another-owner'))[0].id,note.id);
    assert.equal((await a('/notes/'+note.id,'DELETE')).status,200);
    assert.equal((await a('/notes','POST',{name:'同学',text:'删除后也不能绕过冷却'})).status,429);
    await a('/likes/p1','PUT',{liked:false});assert.equal((await b('/state')).data.likes.p1.count,1);
    assert.equal((await b('/state')).data.notes.length,0);
    assert.equal((await fetch(base+'/database.js')).status,404);
  }finally{
    if(server?.listening)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections()});
    await engine.close();
  }
});

test('Render without external DATABASE_URL refuses ephemeral storage',async()=>{
  await assert.rejects(openStore({directory:'unused',render:true}),/DATABASE_URL/);
});
