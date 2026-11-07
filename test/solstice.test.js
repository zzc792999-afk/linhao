import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createApp} from '../server.js';
import {isSolsticeExpired} from '../solstice.js';

test('solstice: winter solstice exclusive page, votes, wishes, and expiration/deletion mechanics', async () => {
  process.env.SKIP_SOLSTICE_UNLINK = '1';
  const directory = await mkdtemp(path.join(tmpdir(), 'class2501-solstice-'));
  let server;
  let base;

  const start = async (envExpire) => {
    if (envExpire) process.env.SOLSTICE_EXPIRE_AT = String(envExpire);
    else delete process.env.SOLSTICE_EXPIRE_AT;

    server = await createApp(directory);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    base = 'http://127.0.0.1:' + server.address().port;
  };

  const stop = () => new Promise((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
    server.closeAllConnections();
  });

  function browser() {
    let cookie = '';
    return async (route, method = 'GET', body, extra = {}) => {
      const response = await fetch(base + route, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(cookie ? {Cookie: cookie} : {}),
          ...extra
        },
        ...(body === undefined ? {} : {body: JSON.stringify(body)})
      });
      if (response.headers.get('set-cookie')) {
        cookie = response.headers.get('set-cookie').split(';')[0];
      }
      const isJson = (response.headers.get('content-type') || '').includes('application/json');
      return {
        status: response.status,
        headers: response.headers,
        data: isJson ? await response.json() : await response.text()
      };
    };
  }

  try {
    // 1. 测试在今晚（未过期）时页面的可用性与核心互动
    await start(Date.now() + 1000000); // 模拟未来才到期
    const client = browser();

    // 页面静态资源
    const page = await client('/dongzhi');
    assert.equal(page.status, 200);
    assert.match(page.data, /冬至专属夜话/);

    const css = await client('/dongzhi.css');
    assert.equal(css.status, 200);

    const js = await client('/dongzhi.js');
    assert.equal(js.status, 200);

    // 获取冬至初始状态
    const stateRes = await client('/api/solstice/state');
    assert.equal(stateRes.status, 200);
    assert.equal(stateRes.data.active, true);
    assert.ok(stateRes.data.votes.dumpling > 0);
    assert.ok(stateRes.data.votes.tangyuan > 0);
    assert.ok(stateRes.data.wishes.length > 0);

    // 饺子派 vs 汤圆派 投票
    const voteRes = await client('/api/solstice/vote', 'POST', { choice: 'dumpling' });
    assert.equal(voteRes.status, 200);
    assert.equal(voteRes.data.votes.myVote, 'dumpling');

    // 许愿墙添加祝福
    const wishRes = await client('/api/solstice/wish', 'POST', {
      name: '小明同学',
      text: '祝25计算机1班全体冬至快乐，代码零Bug！'
    });
    assert.equal(wishRes.status, 201);
    assert.equal(wishRes.data.wishes[0].name, '小明同学');
    assert.equal(wishRes.data.wishes[0].text, '祝25计算机1班全体冬至快乐，代码零Bug！');

    // 给愿望暖一暖（点赞）
    const wishId = wishRes.data.wishes[0].id;
    const likeRes = await client('/api/solstice/wish/like', 'POST', { id: wishId });
    assert.equal(likeRes.status, 200);
    const updatedWish = likeRes.data.wishes.find(w => w.id === wishId);
    assert.equal(updatedWish.liked, false); // 之前创建默认点赞，再次点击取消

    await stop();

    // 2. 测试在今晚过后（已过期，模拟时间越过 24:00）的自动下线与自毁拦截
    await start(Date.now() - 10000); // 模拟已过今晚
    const clientExpired = browser();

    const expiredState = await clientExpired('/api/solstice/state');
    assert.equal(expiredState.status, 410);
    assert.equal(expiredState.data.expired, true);

    const expiredPage = await clientExpired('/dongzhi');
    assert.equal(expiredPage.status, 404);

    await stop();
  } finally {
    delete process.env.SOLSTICE_EXPIRE_AT;
    if (server?.listening) await stop();
    await rm(directory, {recursive: true, force: true});
  }
});
