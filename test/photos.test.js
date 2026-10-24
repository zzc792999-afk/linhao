import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import {PGlite} from '@electric-sql/pglite';
import {sqliteStore,postgresStore} from '../database.js';
import {createApp} from '../server.js';

for(const backend of ['sqlite','postgres'])test(backend+': image sharing, real decoding, ownership, restart and quota',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'class-photos-'));
  const engine=backend==='postgres'?new PGlite():null;
  const query=async(sql,args)=>{const result=await engine.query(sql,args);return {...result,rowCount:result.affectedRows}};
  const pool={query,connect:async()=>({query,release(){}}),end:async()=>{}};
  let server,store,base;
  const start=async()=>{store=engine?await postgresStore(pool):sqliteStore(dir);server=await createApp(dir,store);await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port};
  const stop=()=>new Promise(r=>{server.close(r);server.closeAllConnections()});
  function browser(){let cookie='';return async(route,method='GET',body,headers={})=>{const r=await fetch(base+route,{method,headers:{Cookie:cookie,...headers},...(body===undefined?{}:{body})});cookie=r.headers.get('set-cookie')?.split(';')[0]||cookie;return r}};
  try{
    await start();const a=browser(),b=browser();await a('/api/state');await b('/api/state');
    const source=await sharp({create:{width:2200,height:30,channels:3,background:'#ddccaa'}}).png().toBuffer();
    let r=await a('/api/photos?name='+encodeURIComponent('我们的合照🌻.png'),'POST',source,{'Content-Type':'image/png'});assert.equal(r.status,201);const uploaded=await r.json();const id=uploaded.id;assert.equal(uploaded.photos[0].mine,true);assert.equal(uploaded.photos[0].name,'我们的合照🌻.png');
    const state=await (await b('/api/state')).json();assert.equal(state.photos[0].id,id);assert.equal(state.photos[0].mine,false);
    r=await b('/api/photos/'+id);assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'image/jpeg');const bytes=Buffer.from(await r.arrayBuffer());const meta=await sharp(bytes).metadata();assert.equal(meta.format,'jpeg');assert.equal(meta.width,1600);assert.equal(meta.exif,undefined);
    assert.equal((await b('/api/photos/'+id,'DELETE')).status,403);
    assert.equal((await a('/api/photos','POST',Buffer.from('<svg></svg>'),{'Content-Type':'image/svg+xml'})).status,415);
    assert.equal((await a('/api/photos','POST',Buffer.from('not a photo'),{'Content-Type':'image/png'})).status,400);
    assert.equal((await a('/api/photos','POST',source,{'Content-Type':'image/png',Origin:'https://other.example'})).status,403);
    await stop();await start();assert.deepEqual(Buffer.from(await (await b('/api/photos/'+id)).arrayBuffer()),bytes);assert.equal((await (await a('/api/state')).json()).photos[0].mine,true);
    // Check the hard count limit inside the storage transaction, without HTTP rate limits.
    for(let i=0;i<199;i++)assert.equal(await store.addPhoto({id:'test-'+i,owner:'quota',name:'quota',date:new Date().toISOString(),data:bytes}),true);
    assert.equal(await store.addPhoto({id:'overflow',owner:'quota',name:'quota',date:new Date().toISOString(),data:bytes}),false);
    assert.equal((await store.photos('quota')).length,200);
    assert.equal((await a('/api/photos/'+id,'DELETE')).status,200);
    assert.equal((await b('/api/photos/'+id)).status,404);
  }finally{if(server?.listening)await stop();await engine?.close();await rm(dir,{recursive:true,force:true})}
});
