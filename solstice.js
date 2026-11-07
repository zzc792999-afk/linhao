import fs from 'node:fs';
import path from 'node:path';

// 冬至过期时间：以 Asia/Shanghai 时区今晚过后 (2026-11-08T00:00:00+08:00) 为准
export const DEFAULT_SOLSTICE_EXPIRE = new Date('2026-11-08T00:00:00+08:00').getTime();

export function getExpireAt() {
  return process.env.SOLSTICE_EXPIRE_AT ? Number(process.env.SOLSTICE_EXPIRE_AT) : DEFAULT_SOLSTICE_EXPIRE;
}

export function isSolsticeExpired(now = Date.now()) {
  return now >= getExpireAt();
}

const SOLSTICE_FILES = ['dongzhi.html', 'dongzhi.css', 'dongzhi.js'];

export function cleanupSolsticeFiles(publicDir) {
  if (process.env.NODE_ENV === 'test' || process.env.SKIP_SOLSTICE_UNLINK === '1') {
    return;
  }
  for (const f of SOLSTICE_FILES) {
    try {
      const p = path.join(publicDir, f);
      if (fs.existsSync(p)) {
        fs.unlinkSync(p);
      }
    } catch {
      // 忽略已删除或权限错误
    }
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function solsticeRoutes(db, readJson, publicDir) {
  // 内存状态（冬至今晚限定，今晚过后随自毁彻底清除）
  let votes = { dumpling: 28, tangyuan: 25 };
  const userVotes = new Map(); // owner -> 'dumpling' | 'tangyuan'

  let nextWishId = 6;
  const wishes = [
    {
      id: 'w1',
      name: '班长',
      text: '冬至大如年，人间小团圆！愿25计1每一位同学期末代码零Bug，高数稳过，天天开心！',
      time: '17:20',
      likes: 26,
      likedOwners: new Set()
    },
    {
      id: 'w2',
      name: '红鼻同学',
      text: '今天冬至我戴上了暖耳罩，给全班端上一大碗热气腾腾的饺子！大家千万别冻着！',
      time: '17:35',
      likes: 21,
      likedOwners: new Set()
    },
    {
      id: 'w3',
      name: '吉祥物鞋子',
      text: '今晚不打架，本鞋给全班换上了加厚毛线保暖冬袜，今夜双脚暖呼呼！',
      time: '17:42',
      likes: 24,
      likedOwners: new Set()
    },
    {
      id: 'w4',
      name: '龙鱼大仙',
      text: '冬至锦鲤吐泡泡~ 祝全班同学期末免挂，抽卡必出金，早八都有座！',
      time: '17:50',
      likes: 19,
      likedOwners: new Set()
    },
    {
      id: 'w5',
      name: '杰尼龟',
      text: '杰尼杰尼！（红围巾已经戴好啦，吃完饺子/汤圆早点钻被窝~）',
      time: '18:02',
      likes: 17,
      likedOwners: new Set()
    }
  ];

  function getState(owner) {
    return {
      active: !isSolsticeExpired(),
      expireAt: getExpireAt(),
      now: Date.now(),
      votes: {
        dumpling: votes.dumpling,
        tangyuan: votes.tangyuan,
        myVote: userVotes.get(owner) || null
      },
      wishes: wishes.map(w => ({
        id: w.id,
        name: w.name,
        text: w.text,
        time: w.time,
        likes: w.likes,
        liked: w.likedOwners.has(owner)
      }))
    };
  }

  // 启动时或定时检查是否已到自毁时间
  if (isSolsticeExpired()) {
    cleanupSolsticeFiles(publicDir);
  }

  return async function handleSolstice(req, res, url, owner, send) {
    if (!url.pathname.startsWith('/api/solstice')) return false;

    // 检查自毁时间
    if (isSolsticeExpired()) {
      cleanupSolsticeFiles(publicDir);
      send(410, {
        expired: true,
        error: '冬至活动已随今晚结束，专属网页已按约定自动自毁删除。'
      });
      return true;
    }

    if (req.method === 'GET' && url.pathname === '/api/solstice/state') {
      send(200, getState(owner));
      return true;
    }

    if (req.method === 'POST' && url.pathname === '/api/solstice/vote') {
      const body = await readJson(req);
      const choice = body?.choice;
      if (!['dumpling', 'tangyuan'].includes(choice)) {
        send(400, { error: '请选择饺子派或汤圆派' });
        return true;
      }
      const prev = userVotes.get(owner);
      if (prev !== choice) {
        if (prev) votes[prev] = Math.max(0, votes[prev] - 1);
        votes[choice]++;
        userVotes.set(owner, choice);
      }
      send(200, getState(owner));
      return true;
    }

    if (req.method === 'POST' && url.pathname === '/api/solstice/wish') {
      const body = await readJson(req);
      const rawName = typeof body?.name === 'string' ? body.name.trim() : '';
      const rawText = typeof body?.text === 'string' ? body.text.trim() : '';
      const name = rawName ? rawName.slice(0, 16) : '热心同学';
      if (!rawText || rawText.length > 100) {
        send(400, { error: '愿望内容不能为空且不能超过100字' });
        return true;
      }

      const now = new Date();
      const timeStr = new Intl.DateTimeFormat('zh-CN', {
        timeZone: 'Asia/Shanghai',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(now);

      const newWish = {
        id: 'w' + (nextWishId++),
        name: escapeHtml(name),
        text: escapeHtml(rawText),
        time: timeStr,
        likes: 1,
        likedOwners: new Set([owner])
      };
      wishes.unshift(newWish);
      if (wishes.length > 150) wishes.pop();

      send(201, getState(owner));
      return true;
    }

    if (req.method === 'POST' && url.pathname === '/api/solstice/wish/like') {
      const body = await readJson(req);
      const id = String(body?.id || '');
      const target = wishes.find(w => w.id === id);
      if (!target) {
        send(404, { error: '愿望不存在' });
        return true;
      }
      if (target.likedOwners.has(owner)) {
        target.likedOwners.delete(owner);
        target.likes = Math.max(0, target.likes - 1);
      } else {
        target.likedOwners.add(owner);
        target.likes++;
      }
      send(200, getState(owner));
      return true;
    }

    return false;
  };
}
