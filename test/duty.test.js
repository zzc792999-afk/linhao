import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {PGlite} from '@electric-sql/pglite';
import {createApp} from '../server.js';
import {sqliteStore,postgresStore} from '../database.js';
import {hashPassword} from '../admin.js';

for(const backend of ['SQLite','PostgreSQL']){
  test(backend+' duty swaps publish only after admin approval',async()=>{
    const directory=await mkdtemp(path.join(tmpdir(),'duty-test-'));
    const engine=backend==='PostgreSQL'?new PGlite():null;
    const query=async(sql,args)=>{
      const result=await engine.query(sql,args);
      return {rows:result.rows,rowCount:result.affectedRows ?? result.rows.length};
    };
    const db=engine?await postgresStore({query,end:async()=>{}}):sqliteStore(directory);
    let server;
    try{
      await db.saveSetting('admin_password_hash',await hashPassword('duty-test-password-123'));
      server=await createApp(directory,db);
      await new Promise(resolve=>server.listen(0,'127.0.0.1', resolve));
      const base='http://127.0.0.1:'+server.address().port;
      function browser(){
        const cookies=new Map();
        return async(url,method='GET',body)=>{
          const res=await fetch(base+'/api'+url,{
            method,headers:{Cookie:[...cookies].map(([name,value])=>name+'='+value).join('; '),'Content-Type':'application/json'},
            ...(body===undefined?{}:{body:JSON.stringify(body)})
          });
          for(const cookie of res.headers.getSetCookie()){
            const [name,value]=cookie.split(';',1)[0].split('=');
            cookies.set(name,value);
          }
          return {status:res.status,data:await res.json()};
        };
      }
      const applicant=browser(), other=browser(), admin=browser();
      const {groups}= (await applicant('/duty')).data;
      assert.equal(groups.filter(group=>group.length===1).length,8);
      assert.equal(groups.filter(group=>group.length===2).length,17);
      assert.equal(new Set(groups.flat()).size,42);
      const payload=(from,to)=>({from:{position:from,name:groups[from[0]][from[1]]},
        to:{position:to,name:groups[to[0]][to[1]]},reason:'已经和对方商量好了'});
      const route='/duty/requests';
      const [first,second]=await Promise.all([
        applicant(route,'POST',payload([0,0],[8,0])),
        other(route,'POST',payload([8,1],[1,0]))
      ]);
      assert.equal(first.status,201);
      assert.equal(second.status,201);
      assert.equal((await other('/duty')).data.requests.some(item=>item.id===first.data.id),false);
      assert.deepEqual((await other('/duty')).data.groups,groups);
      const review='/admin/duty/'+first.data.id;
      const approval={status:'approved',note:'已确认'};
      assert.equal((await applicant(review,'PUT',approval)).status,401);
      assert.equal((await admin('/admin/login','POST',{password:'duty-test-password-123'})).status,200);
      assert.equal((await admin('/admin/duty')).data.requests.length,2);
      const outcomes=await Promise.all([admin(review,'PUT',approval),admin(review,'PUT',approval)]);
      assert.deepEqual(outcomes.map(result=>result.status).sort(),[200,409]);
      const updated=(await applicant('/duty')).data;
      assert.equal(updated.requests[0].status,'approved');
      assert.equal(updated.requests[0].note,'已确认');
      assert.deepEqual(updated.groups[0],[groups[8][0]]);
      assert.deepEqual(updated.groups[8],[groups[0][0],groups[8][1]]);
      assert.equal((await admin('/admin/duty/'+second.data.id,'PUT',approval)).status,409);
      assert.equal((await admin('/admin/duty/'+second.data.id,'PUT',{status:'rejected',note:'已变化'})).status,200);
      const state=(await other('/duty')).data;
      assert.deepEqual(state.groups,updated.groups);
      assert.equal(state.requests[0].status,'rejected');
      assert.equal('owner' in state.requests[0],false);
    }finally{
      server?.closeAllConnections();
      if(server)await new Promise(resolve=>server.close(resolve));
      await engine?.close();
      await rm(directory,{recursive:true,force:true});
    }
  });
}
