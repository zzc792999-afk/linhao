import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {PGlite} from '@electric-sql/pglite';
import {banterRoutes} from '../banter.js';
import {banterSchema,banterStore} from '../banter-database.js';

function memorySQLite() {
  const database = new DatabaseSync(':memory:');
  return {
    async query(sql, args = []) {
      const params = [];
      const portable = sql.replace(/\$(\d+)/g, (_, number) => {
        params.push(args[Number(number) - 1]);
        return '?';
      });
      const stmt = database.prepare(portable);
      if (portable.startsWith('SELECT')) return {rows:stmt.all(...params)};
      stmt.run(...params);
      return {rows:[]};
    },
    async close() { database.close(); }
  };
}

for (const backend of ['SQLite','PostgreSQL']) {
  test(backend + ': daily banter results are private before playing and shared after playing', async () => {
    const engine = backend === 'PostgreSQL' ? new PGlite() : memorySQLite();
    let clock = Date.parse('2026-11-22T15:59:59Z');
    const query = (sql, args) => engine.query(sql, args);
    const routes = banterRoutes(banterStore(query), async req => req.body, () => clock);
    const url = new URL('http://localhost/api/banter');
    const request = async (owner, method = 'GET', body) => {
      let response;
      assert.equal(await routes({method, body}, {}, url, owner,
        (status, data) => { response = {status, data}; }), true);
      return response;
    };
    const first = 'browser-one';
    const second = 'browser-two';
    try {
      for (const sql of banterSchema) await query(sql);
      const opened = await request(first);
      assert.equal(opened.status, 200);
      const {day,scene} = opened.data;
      assert.equal(day, '2026-11-22');
      assert.equal(scene.id, 'unsaved');
      assert.deepEqual([opened.data.choice, opened.data.counts, opened.data.total], [null,null,0]);
      const [optionA,optionB,optionC] = scene.choices.map(option => option.id);
      const payload = {day, scene:scene.id, choice:optionA};
      assert.equal((await request(first,'PUT',{...payload,scene:'old'})).status, 409);
      assert.equal((await request(first,'PUT',{...payload,choice:'invalid'})).status, 400);
      assert.equal((await request(first,'POST',payload)).status, 405);
      const accepted = await request(first,'PUT',payload);
      assert.equal(accepted.status, 200);
      assert.deepEqual(accepted.data.counts,{[optionA]:1,[optionB]:0,[optionC]:0});
      assert.equal(accepted.data.choice, optionA);
      assert.equal(accepted.data.total, 1);
      assert.deepEqual((await request(first,'PUT',payload)).data,accepted.data);
      assert.deepEqual((await request(first,'PUT',{...payload,choice:optionB})).data,accepted.data);
      assert.deepEqual((await request(second)).data,opened.data);

      const shared = (await request(second,'PUT',{...payload,choice:optionB})).data;
      assert.equal(shared.choice, optionB);
      assert.equal(shared.total, 2);
      assert.deepEqual(shared.counts,{[optionA]:1,[optionB]:1,[optionC]:0});
      assert.equal(shared.owner, undefined);
      assert.equal(JSON.stringify(shared).includes(first), false);
      assert.deepEqual((await request(first)).data.counts,shared.counts);

      clock += 1000;
      const tomorrow = (await request(first)).data;
      assert.deepEqual([tomorrow.day,tomorrow.choice,tomorrow.counts,tomorrow.total],['2026-11-23',null,null,0]);
      assert.notEqual(tomorrow.scene.id,scene.id);
      assert.equal((await request(first,'PUT',payload)).status,409);
      const newChoice = tomorrow.scene.choices[0].id;
      const newVote = await request(first,'PUT',{day:tomorrow.day,scene:tomorrow.scene.id,choice:newChoice});
      assert.equal(newVote.data.choice,newChoice);
      assert.equal(newVote.data.total,1);
    } finally {
      await engine.close();
    }
  });
}
