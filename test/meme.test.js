import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server.js';
import { sqliteStore, postgresStore } from '../database.js';
import { PGlite } from '@electric-sql/pglite';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Minimal 1x1 PNG image as base64 for test
const tinyPngBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

async function runMemeTests(storeFactory, label) {
  test(`${label}: meme creation, cross-device sync, liking and owner deletion`, async () => {
    let tmpDir;
    let store;
    if (label.includes('sqlite')) {
      tmpDir = mkdtempSync(path.join(os.tmpdir(), 'class25-meme-test-'));
      store = sqliteStore(tmpDir);
    } else {
      const pglite = new PGlite();
      store = await postgresStore({
        async query(sql, args = []) {
          const res = await pglite.query(sql, args);
          return { rows: res.rows, rowCount: res.affectedRows ?? res.rows.length };
        },
        async connect() {
          return {
            query: (sql, args) => this.query(sql, args),
            release() {}
          };
        },
        async end() {
          await pglite.close();
        }
      });
    }

    const app = await createApp(undefined, store);
    const server = app.listen(0);
    const port = server.address().port;
    const base = `http://127.0.0.1:${port}`;

    try {
      // 1. Initial memes list should be empty
      const res1 = await fetch(`${base}/api/memes`);
      assert.equal(res1.status, 200);
      const json1 = await res1.json();
      assert.ok(Array.isArray(json1.memes));
      assert.equal(json1.memes.length, 0);

      // 2. Post a meme from device 1
      const dev1Cookie = 'class_session=1111111111111111111111111111111111111111111111111111111111111111';
      const postRes = await fetch(`${base}/api/memes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': dev1Cookie
        },
        body: JSON.stringify({
          title: '代码敲不动了',
          nickname: '熬夜小码农',
          image: tinyPngBase64
        })
      });
      assert.equal(postRes.status, 201);
      const postData = await postRes.json();
      assert.ok(postData.id);
      assert.equal(postData.memes.length, 1);
      assert.equal(postData.memes[0].title, '代码敲不动了');
      assert.equal(postData.memes[0].mine, true);

      const memeId = postData.id;

      // 3. Fetch image binary
      const imgRes = await fetch(`${base}/api/memes/${memeId}/image`);
      assert.equal(imgRes.status, 200);
      assert.equal(imgRes.headers.get('content-type'), 'image/jpeg');
      const imgBuf = await imgRes.arrayBuffer();
      assert.ok(imgBuf.byteLength > 0);

      // 4. View from device 2 (different session)
      const dev2Cookie = 'class_session=2222222222222222222222222222222222222222222222222222222222222222';
      const resDev2 = await fetch(`${base}/api/memes`, {
        headers: { 'Cookie': dev2Cookie }
      });
      const dataDev2 = await resDev2.json();
      assert.equal(dataDev2.memes.length, 1);
      assert.equal(dataDev2.memes[0].mine, false);
      assert.equal(dataDev2.memes[0].liked, false);
      assert.equal(dataDev2.memes[0].likes, 0);

      // 5. Device 2 likes the meme
      const likeRes = await fetch(`${base}/api/memes/${memeId}/like`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': dev2Cookie
        },
        body: JSON.stringify({ liked: true })
      });
      assert.equal(likeRes.status, 200);
      const likeData = await likeRes.json();
      assert.equal(likeData.likes, 1);
      assert.equal(likeData.liked, true);

      // 6. Device 2 tries to delete Device 1's meme -> should fail with 403
      const delForbidden = await fetch(`${base}/api/memes/${memeId}`, {
        method: 'DELETE',
        headers: { 'Cookie': dev2Cookie }
      });
      assert.equal(delForbidden.status, 403);

      // 7. Device 1 deletes its own meme -> should succeed
      const delSuccess = await fetch(`${base}/api/memes/${memeId}`, {
        method: 'DELETE',
        headers: { 'Cookie': dev1Cookie }
      });
      assert.equal(delSuccess.status, 200);

      // 8. Verify list is now empty again
      const verifyRes = await fetch(`${base}/api/memes`);
      const verifyData = await verifyRes.json();
      assert.equal(verifyData.memes.length, 0);
    } finally {
      server.close();
      await store.close();
      if (tmpDir) {
        rmSync(tmpDir, { recursive: true, force: true });
      }
    }
  });
}

runMemeTests(sqliteStore, 'sqlite');
runMemeTests(postgresStore, 'postgres');
