import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {PGlite} from '@electric-sql/pglite';
import {createApp} from '../server.js';
import {sqliteStore,postgresStore} from '../database.js';
import {hashPassword} from '../admin.js';
import {weeklyClock} from '../weekly.js';

test('handbook opens a new week at midnight Monday in Beijing', () => {
  assert.equal(weeklyClock(Date.parse('2026-11-22T15:59:59Z')).week,'2026-11-16');
  assert.equal(weeklyClock(Date.parse('2026-11-22T16:00:00Z')).week,'2026-11-23');
});

for (const backend of ['SQLite','PostgreSQL']) {
  test(backend + ': handbook moderation, withdrawal, archive and admin search', async () => {
    const directory = await mkdtemp(path.join(tmpdir(),'class-handbook-'));
    const engine = backend === 'PostgreSQL' ? new PGlite() : null;
    const run = async (sql,args) => {
      const res = await engine.query(sql,args);
      return {rows:res.rows,rowCount:res.affectedRows ?? res.rows.length};
    };
    const pool = {query:run,connect:async()=>({query:run,release(){}}),end:async()=>{}};
    const store = engine ? await postgresStore(pool) : sqliteStore(directory);
    let server, base;
    const client = () => {
      const cookies = new Map();
      return async (uri,method='GET',data) => {
        const result = await fetch(base + '/api' + uri,{
          method,headers:{'Content-Type':'application/json',Cookie:[...cookies].map(pair=>pair.join('=')).join('; ')},
          ...(data===undefined?{}:{body:JSON.stringify(data)})
        });
        for (const header of result.headers.getSetCookie()) {
          const [name,value] = header.split(';',1)[0].split('=');
          cookies.set(name,value);
        }
        return {status:result.status,data:await result.json()};
      };
    };
    try {
      await store.saveSetting('admin_password_hash',await hashPassword('handbook-test-password'));
      server = await createApp(directory,store);
      await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
      base = 'http://127.0.0.1:' + server.address().port;
      const writer=client(), reader=client(), admin=client();
      const route='/weekly';
      const open = await writer(route);
      assert.equal(open.status,200);
      const week=open.data.topic.week;
      assert.equal(open.data.total,0);
      assert.equal(open.data.pulse.suggestions,undefined);
      assert.equal((await reader('/admin/weekly')).status,401);
      assert.equal((await admin('/admin/login','POST',{password:'handbook-test-password'})).status,200);
      const payload={week,nickname:'测试同学',body:'今天看到了彩虹。'};
      assert.equal((await writer(route,'PUT',payload)).data.mine.status,'pending');
      assert.equal((await reader(route)).data.entries.length,0);
      const {entries:[pending]}=(await admin('/admin/weekly')).data;
      assert.equal(pending.body,payload.body);
      await writer(route,'PUT',{...payload,body:'彩虹从操场上方出现。'});
      const review='/admin/weekly/entry/'+pending.id;
      assert.equal((await admin(review,'PUT',{status:'published',version:pending.version})).status,409);
      const {entries:[edited],totals} = (await admin('/admin/weekly')).data;
      assert.equal(totals.pending,1);
      assert.equal((await admin(review,'PUT',{status:'published',version:edited.version})).status,200);
      assert.equal((await writer(route,'PUT',{...payload,body:edited.body})).data.mine.status,'published');
      const shared=(await reader(route)).data;
      assert.equal(shared.entries[0].body,edited.body);
      assert.equal(shared.entries[0].owner,undefined);
      assert.equal(shared.mine,null);
      assert.equal((await reader(route,'DELETE',{week})).data.total,1);

      const settings='/admin/weekly/topic';
      const settingsBody={week,version:'',question:'给这周的一句话',goal:5,closed:true};
      assert.equal((await admin(settings,'PUT',settingsBody)).status,200);
      assert.equal((await admin(settings,'PUT',settingsBody)).status,409);
      assert.equal((await reader(route,'PUT',payload)).status,409);
      assert.equal((await writer(route,'DELETE',{week})).data.total,0);

      await store.writeWeeklyEntry({id:'b'.repeat(32),week:'2025-05-05',owner:'historic',nickname:'过往同学',
        body:'旧手账',date:'2025-05-05T02:00:00Z',version:'old-entry'});
      await store.weeklyReview('b'.repeat(32),'published','old-entry','old-live','2025-05-05T02:00:01Z');
      assert.equal((await reader('/weekly/archive')).data.weeks[0].week,'2025-05-05');
      assert.equal((await reader('/weekly/archive?week=2025-05-05')).data.entries[0].body,'旧手账');
      assert.equal((await reader('/weekly/archive?week=2025-05-06')).status,400);
      await store.add({id:'a'.repeat(32),owner:'old',name:'程序设计作业',text:'需要完成 100% 的代码',date:new Date().toISOString()});
      assert.equal((await admin('/admin/dashboard?q='+encodeURIComponent('100%'))).data.matchedNotes,1);
      assert.equal((await admin('/admin/dashboard?q='+encodeURIComponent('_'))).data.matchedNotes,0);
    } finally {
      server?.closeAllConnections();
      if (server) await new Promise(resolve=>server.close(resolve));
      if (engine) await engine.close();
      await rm(directory,{recursive:true,force:true});
    }
  });
}
