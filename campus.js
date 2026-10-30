import { randomBytes } from 'node:crypto';
import sharp from 'sharp';

const allowedItems = ['egg', 'slipper', 'tomato', 'veggie', 'brick', 'flower'];

export function campusRoutes(db, readJson) {
  return async (req, res, url, owner, send) => {
    // 1. 网站滚动墙 (Marquee)
    if (url.pathname === '/api/marquee' && req.method === 'GET') {
      send(200, { messages: await db.marqueeMessages() });
      return true;
    }

    // 2. 老师匿名评价基地 (Teachers)
    if (url.pathname === '/api/teachers' && req.method === 'GET') {
      send(200, { teachers: await db.teachers() });
      return true;
    }

    const teacherReviewsRoute = /^\/api\/teachers\/([a-z0-9-]{1,64})\/reviews$/.exec(url.pathname);
    if (teacherReviewsRoute && req.method === 'GET') {
      const teacherId = teacherReviewsRoute[1];
      const teacher = await db.teacher(teacherId);
      if (!teacher) {
        send(404, { error: '老师不存在或已被删除' });
        return true;
      }
      send(200, {
        teacher,
        reviews: await db.teacherReviews(teacherId, owner)
      });
      return true;
    }

    if (teacherReviewsRoute && req.method === 'POST') {
      const teacherId = teacherReviewsRoute[1];
      const teacher = await db.teacher(teacherId);
      if (!teacher) {
        send(404, { error: '老师不存在或已被删除' });
        return true;
      }
      const b = await readJson(req);
      const nickname = (typeof b.nickname === 'string' && b.nickname.trim()) ? b.nickname.trim().slice(0, 16) : '匿名同学';
      const rating = Number.isInteger(b.rating) && b.rating >= 1 && b.rating <= 5 ? b.rating : 5;
      const tag = typeof b.tag === 'string' ? b.tag.trim().slice(0, 20) : '';
      const content = typeof b.content === 'string' ? b.content.trim() : '';

      if (!content || content.length > 500) {
        send(400, { error: '请填写评价内容（1–500 字）' });
        return true;
      }

      const id = randomBytes(16).toString('hex');
      const added = await db.addTeacherReview({
        id,
        teacherId,
        owner,
        nickname,
        rating,
        tag,
        content,
        date: new Date().toISOString()
      });

      if (!added) {
        send(409, { error: '该老师评价已达上限，或当前浏览器评价次数过多（最多5次）' });
        return true;
      }

      send(201, {
        ok: true,
        id,
        reviews: await db.teacherReviews(teacherId, owner),
        teachers: await db.teachers()
      });
      return true;
    }

    const deleteReviewRoute = /^\/api\/teachers\/(?:[a-z0-9-]{1,64}\/)?reviews\/([a-f0-9]{32})$/.exec(url.pathname);
    if (deleteReviewRoute && req.method === 'DELETE') {
      const removed = await db.deleteTeacherReview(deleteReviewRoute[1], owner);
      if (!removed) {
        send(403, { error: '只能删除自己发布的评价' });
        return true;
      }
      send(200, { ok: true });
      return true;
    }

    // 3. 趣味扔物靶场 (Targets Arena)
    if (url.pathname === '/api/targets' && req.method === 'GET') {
      send(200, { targets: await db.targets(owner) });
      return true;
    }

    const targetImageRoute = /^\/api\/targets\/([a-f0-9]{32})\/image$/.exec(url.pathname);
    if (targetImageRoute && ['GET', 'HEAD'].includes(req.method)) {
      const data = await db.targetImage(targetImageRoute[1]);
      if (!data) {
        send(404, { error: '靶子图片不存在或已删除' });
        return true;
      }
      res.writeHead(200, {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=3600',
        'Content-Length': data.length
      });
      return res.end(req.method === 'HEAD' ? undefined : data);
    }

    const targetSplatsRoute = /^\/api\/targets\/([a-f0-9]{32})\/splats$/.exec(url.pathname);
    if (targetSplatsRoute && req.method === 'GET') {
      const targetId = targetSplatsRoute[1];
      send(200, {
        splats: await db.targetSplats(targetId),
        itemCounts: await db.targetItemCounts(targetId)
      });
      return true;
    }

    const targetThrowRoute = /^\/api\/targets\/([a-f0-9]{32})\/throw$/.exec(url.pathname);
    if (targetThrowRoute && req.method === 'POST') {
      const targetId = targetThrowRoute[1];
      const b = await readJson(req);
      if (!allowedItems.includes(b.item)) {
        send(400, { error: '请选择有效的投掷道具（鸡蛋/拖鞋/番茄/蔬菜/板砖/鲜花）' });
        return true;
      }
      const x = Number(b.x), y = Number(b.y);
      if (!Number.isFinite(x) || x < 0 || x > 1 || !Number.isFinite(y) || y < 0 || y > 1) {
        send(400, { error: '投掷落点坐标无效' });
        return true;
      }
      const id = randomBytes(16).toString('hex');
      const thrown = await db.throwAtTarget({
        id,
        targetId,
        item: b.item,
        x: Math.round(x * 10000) / 10000,
        y: Math.round(y * 10000) / 10000,
        date: new Date().toISOString()
      });
      if (!thrown) {
        send(404, { error: '靶子不存在或已被移除' });
        return true;
      }
      send(200, {
        ok: true,
        splats: await db.targetSplats(targetId),
        itemCounts: await db.targetItemCounts(targetId)
      });
      return true;
    }

    const deleteTargetRoute = /^\/api\/targets\/([a-f0-9]{32})$/.exec(url.pathname);
    if (deleteTargetRoute && req.method === 'DELETE') {
      const removed = await db.deleteTarget(deleteTargetRoute[1], owner);
      if (!removed) {
        send(403, { error: '只能删除当前浏览器上传的靶子图片' });
        return true;
      }
      send(200, { targets: await db.targets(owner) });
      return true;
    }

    if (url.pathname === '/api/targets' && req.method === 'POST') {
      if (!/^image\/(jpeg|png|webp)$/i.test(req.headers['content-type'] || '')) {
        send(415, { error: '请上传 JPG、PNG 或 WebP 格式图片' });
        return true;
      }
      const chunks = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 8 * 1024 * 1024) {
          send(413, { error: '图片过大，请上传小于 8MB 的图片' });
          return true;
        }
        chunks.push(chunk);
      }
      let processed;
      try {
        const img = sharp(Buffer.concat(chunks), { limitInputPixels: 40000000, animated: false });
        processed = await img.rotate().resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 75 }).toBuffer();
      } catch {
        send(400, { error: '图片解析失败，请选择有效的 JPG、PNG 或 WebP 格式图片' });
        return true;
      }
      const title = (url.searchParams.get('title') || '班级靶子').trim().slice(0, 50) || '班级靶子';
      const id = randomBytes(16).toString('hex');
      const added = await db.addTarget({
        id,
        owner,
        title,
        date: new Date().toISOString(),
        data: processed
      });
      if (!added) {
        send(409, { error: '靶场已满（最多 40 张，每人最多 5 张），请先整理旧图片' });
        return true;
      }
      send(201, { id, targets: await db.targets(owner) });
      return true;
    }

    return false;
  };
}

export function campusAdminRoutes(db, readJson) {
  return async (req, res, url, owner, send) => {
    if (!url.pathname.startsWith('/api/admin/campus')) return false;

    // GET dashboard info
    if (url.pathname === '/api/admin/campus' && req.method === 'GET') {
      send(200, {
        marquee: await db.marqueeMessages(),
        teachers: await db.teachers(),
        reviews: await db.adminAllTeacherReviews(),
        targets: await db.targets('')
      });
      return true;
    }

    // POST marquee message
    if (url.pathname === '/api/admin/campus/marquee' && req.method === 'POST') {
      const b = await readJson(req);
      const text = typeof b.text === 'string' ? b.text.trim() : '';
      const author = typeof b.author === 'string' && b.author.trim() ? b.author.trim().slice(0, 16) : '班级管理员';
      if (!text || text.length > 100) {
        send(400, { error: '滚动墙消息需要 1–100 字' });
        return true;
      }
      const id = randomBytes(16).toString('hex');
      await db.addMarquee({ id, text, author, date: new Date().toISOString() });
      await db.audit(randomBytes(16).toString('hex'), '发布滚动墙消息', text.slice(0, 20), new Date().toISOString());
      send(201, { ok: true, id, marquee: await db.marqueeMessages() });
      return true;
    }

    // DELETE marquee message
    const deleteMarqueeRoute = /^\/api\/admin\/campus\/marquee\/([a-z0-9-]{1,64})$/.exec(url.pathname);
    if (deleteMarqueeRoute && req.method === 'DELETE') {
      await db.deleteMarquee(deleteMarqueeRoute[1]);
      await db.audit(randomBytes(16).toString('hex'), '删除滚动墙消息', deleteMarqueeRoute[1], new Date().toISOString());
      send(200, { ok: true, marquee: await db.marqueeMessages() });
      return true;
    }

    // POST teacher
    if (url.pathname === '/api/admin/campus/teachers' && req.method === 'POST') {
      const b = await readJson(req);
      const name = typeof b.name === 'string' ? b.name.trim() : '';
      const subject = typeof b.subject === 'string' ? b.subject.trim() : '';
      if (!name || name.length > 20) {
        send(400, { error: '老师姓名需要 1–20 字' });
        return true;
      }
      const id = randomBytes(16).toString('hex');
      await db.addTeacher({ id, name, subject: subject.slice(0, 30), date: new Date().toISOString() });
      await db.audit(randomBytes(16).toString('hex'), '添加评教老师', name, new Date().toISOString());
      send(201, { ok: true, id, teachers: await db.teachers() });
      return true;
    }

    // DELETE teacher
    const deleteTeacherRoute = /^\/api\/admin\/campus\/teachers\/([a-z0-9-]{1,64})$/.exec(url.pathname);
    if (deleteTeacherRoute && req.method === 'DELETE') {
      await db.deleteTeacher(deleteTeacherRoute[1]);
      await db.audit(randomBytes(16).toString('hex'), '删除评教老师', deleteTeacherRoute[1], new Date().toISOString());
      send(200, { ok: true, teachers: await db.teachers() });
      return true;
    }

    // DELETE teacher review (admin moderation)
    const deleteReviewAdminRoute = /^\/api\/admin\/campus\/reviews\/([a-f0-9]{32})$/.exec(url.pathname);
    if (deleteReviewAdminRoute && req.method === 'DELETE') {
      await db.deleteTeacherReview(deleteReviewAdminRoute[1]);
      await db.audit(randomBytes(16).toString('hex'), '管理删除老师评价', deleteReviewAdminRoute[1], new Date().toISOString());
      send(200, { ok: true });
      return true;
    }

    // DELETE target image (admin moderation)
    const deleteTargetAdminRoute = /^\/api\/admin\/campus\/targets\/([a-f0-9]{32})$/.exec(url.pathname);
    if (deleteTargetAdminRoute && req.method === 'DELETE') {
      await db.deleteTarget(deleteTargetAdminRoute[1]);
      await db.audit(randomBytes(16).toString('hex'), '管理删除靶子图片', deleteTargetAdminRoute[1], new Date().toISOString());
      send(200, { ok: true, targets: await db.targets('') });
      return true;
    }

    return false;
  };
}
