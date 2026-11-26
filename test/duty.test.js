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

      const pair=state.groups[8];
      const splitPayload={kind:'split',from:{position:[8,1],name:pair[1],members:pair},reason:'两人改为单人值日'};
      const split=await applicant(route,'POST',splitPayload);
      assert.equal(split.status,201);
      assert.equal(split.data.kind,'split');
      assert.equal(split.data.to,null);
      assert.equal((await other(route,'POST',{...splitPayload,from:{position:[8,0],name:pair[0],members:pair}})).status,409);
      assert.deepEqual((await other('/duty')).data.groups,state.groups);
      assert.equal((await admin('/admin/duty/'+split.data.id,'PUT',approval)).status,200);
      const splitGroups=(await other('/duty')).data.groups;
      assert.deepEqual(splitGroups[8],[pair[0]]);
      assert.deepEqual(splitGroups.at(-1),[pair[1]]);
      assert.equal(splitGroups.filter(group=>group.length===1).length,10);
      assert.equal(splitGroups.filter(group=>group.length===2).length,16);
      assert.deepEqual(splitGroups.flat().sort(),groups.flat().sort());

      const people='/admin/duty/people';
      assert.equal((await applicant(people,'POST',{name:'新同学一'})).status,401);
      assert.equal((await admin(people,'POST',{name:'新同学一'})).status,201);
      assert.equal((await admin(people,'POST',{name:'新同学一'})).status,409);
      const added=await admin(people,'POST',{name:'新同学二',partner:{position:[8,0],name:pair[0]}});
      assert.equal(added.status,201);
      assert.deepEqual(added.data.groups[8],[pair[0],'新同学二']);
      assert.deepEqual(added.data.groups.at(-1),['新同学一']);
      assert.equal((await admin(people,'POST',{name:'新同学三',partner:{position:[8,0],name:pair[0]}})).status,409);
      assert.deepEqual((await other('/duty')).data.groups,added.data.groups);

      const pairBeforeRemoval=added.data.groups[8];
      const pending=await applicant(route,'POST',{
        kind:'split',from:{position:[8,1],name:'新同学二',members:pairBeforeRemoval},reason:'希望改为单人值日'
      });
      assert.equal(pending.status,201);
      const removePairMember={position:[8,1],name:'新同学二',members:pairBeforeRemoval};
      assert.equal((await applicant(people,'DELETE',removePairMember)).status,401);
      assert.equal((await admin(people,'DELETE',{...removePairMember,members:['过期','新同学二']})).status,409);
      const removed=await admin(people,'DELETE',removePairMember);
      assert.deepEqual(removed,{status:200,data:{removed:'新同学二',affected:1}});
      const remaining=(await applicant('/duty')).data;
      assert.deepEqual(remaining.groups[8],[pairBeforeRemoval[0]]);
      assert.equal(remaining.groups.flat().includes('新同学二'),false);
      const returned=remaining.requests.find(item=>item.id===pending.data.id);
      assert.equal(returned.status,'rejected');
      assert.match(returned.note,/重新申请/);
      assert.equal((await admin('/admin/duty/'+pending.data.id,'PUT',approval)).status,409);

      const last=remaining.groups.length-1;
      assert.equal((await admin(people,'DELETE',{position:[last,0],name:'新同学一',members:['新同学一']})).status,200);
      const final=(await other('/duty')).data.groups;
      const solos=final.map((members,i)=>({members,position:[i,0],name:members[0]})).filter(s=>s.members.length===1);
      const [fromSolo,toSolo,third]=solos;
      const merge={kind:'merge',from:fromSolo,to:toSolo,reason:'希望搭档值日'};
      assert.equal((await applicant(route,'POST',{...merge,to:fromSolo})).status,400);
      const groupIndex=final.findIndex(g=>g.length===2);
      assert.equal((await applicant(route,'POST',{...merge,to:{position:[groupIndex,0],name:final[groupIndex][0]}})).status,409);
      const proposed=await applicant(route,'POST',merge);
      assert.equal(proposed.status,201);
      assert.equal((await other(route,'POST',{...merge,from:toSolo,to:fromSolo})).status,409);
      const conflict=await other(route,'POST',{...merge,to:third});
      assert.deepEqual((await other('/duty')).data.groups,final);
      assert.equal((await admin('/admin/duty/'+proposed.data.id,'PUT',approval)).status,200);
      const merged=(await other('/duty')).data.groups;
      assert.deepEqual(merged[fromSolo.position[0]],[fromSolo.name,toSolo.name]);
      assert.deepEqual(merged[toSolo.position[0]],[]);
      assert.deepEqual(merged.flat().sort(),final.flat().sort());
      assert.equal((await admin('/admin/duty/'+conflict.data.id,'PUT',approval)).status,409);
      assert.deepEqual(final[last],[]);
      assert.deepEqual(final[8],[pairBeforeRemoval[0]]);
    }finally{
      server?.closeAllConnections();
      if(server)await new Promise(resolve=>server.close(resolve));
      await engine?.close();
      await rm(directory,{recursive:true,force:true});
    }
  });
}
