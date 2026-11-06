import { randomBytes } from 'node:crypto';
import sharp from 'sharp';

export function memeRoutes(db, readJson) {
  return async (req, res, url, owner, send) => {
    // 1. 获取梗图列表与榜单
    if (url.pathname === '/api/memes' && req.method === 'GET') {
      const [memes, topMemes] = await Promise.all([
        db.memes(owner),
        db.topMemes(6)
      ]);
      send(200, { memes, topMemes });
      return true;
    }

    // 2. 获取梗图图片原图
    const memeImageRoute = /^\/api\/memes\/([a-f0-9]{32})\/image$/.exec(url.pathname);
    if (memeImageRoute && ['GET', 'HEAD'].includes(req.method)) {
      const memeId = memeImageRoute[1];
      const data = await db.memeImage(memeId);
      if (!data) {
        send(404, { error: '梗图不存在或已被删除' });
        return true;
      }
      res.writeHead(200, {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=3600',
        'Content-Length': data.length
      });
      res.end(req.method === 'HEAD' ? undefined : Buffer.from(data));
      return true;
    }

    // 3. 发布新梗图 (支持 JSON base64 与二进制图片两种上传方式)
    if (url.pathname === '/api/memes' && req.method === 'POST') {
      const contentType = req.headers['content-type'] || '';
      let title = '无题热梗';
      let nickname = '匿名同学';
      let rawBuffer = null;

      if (contentType.startsWith('application/json')) {
        const body = await readJson(req, 4 * 1024 * 1024); // 4MB limit for base64 payload
        title = (typeof body.title === 'string' && body.title.trim()) ? body.title.trim().slice(0, 60) : '无题热梗';
        nickname = (typeof body.nickname === 'string' && body.nickname.trim()) ? body.nickname.trim().slice(0, 16) : '匿名同学';

        if (typeof body.image !== 'string' || !body.image.includes('base64,')) {
          send(400, { error: '请提供有效的图片数据' });
          return true;
        }

        const base64Data = body.image.split('base64,')[1];
        try {
          rawBuffer = Buffer.from(base64Data, 'base64');
        } catch {
          send(400, { error: '图片格式解码失败' });
          return true;
        }
      } else if (/^image\/(jpeg|png|webp)$/i.test(contentType)) {
        title = (url.searchParams.get('title') || '无题热梗').trim().slice(0, 60) || '无题热梗';
        nickname = (url.searchParams.get('nickname') || '匿名同学').trim().slice(0, 16) || '匿名同学';

        const chunks = [];
        let size = 0;
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 6 * 1024 * 1024) {
            send(413, { error: '图片过大，请上传小于 6MB 的图片' });
            return true;
          }
          chunks.push(chunk);
        }
        rawBuffer = Buffer.concat(chunks);
      } else {
        send(415, { error: '请上传有效的图片格式（PNG/JPEG/WebP）或 JSON 数据' });
        return true;
      }

      // 使用 sharp 优化并转为紧凑且高保真的 JPEG
      let compressedData;
      try {
        const image = sharp(rawBuffer, { limitInputPixels: 40000000, animated: false });
        const meta = await image.metadata();
        if (!['jpeg', 'png', 'webp'].includes(meta.format)) {
          throw new Error('Unsupported format');
        }
        compressedData = await image
          .rotate()
          .resize({ width: 1000, height: 1000, fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 82 })
          .toBuffer();
      } catch {
        send(400, { error: '无法解析图片，请检查图片内容是否有效' });
        return true;
      }

      if (compressedData.length > 1024 * 1024) {
        send(413, { error: '优化后图片仍超过 1MB，请调整画布尺寸' });
        return true;
      }

      const id = randomBytes(16).toString('hex');
      const now = new Date().toISOString();

      await db.addMeme({
        id,
        owner,
        nickname,
        title,
        date: now,
        data: compressedData
      });

      send(201, {
        ok: true,
        id,
        memes: await db.memes(owner)
      });
      return true;
    }

    // 4. 点赞/取消点赞梗图
    const memeLikeRoute = /^\/api\/memes\/([a-f0-9]{32})\/like$/.exec(url.pathname);
    if (memeLikeRoute && req.method === 'PUT') {
      const memeId = memeLikeRoute[1];
      const body = await readJson(req, 1024);
      const liked = Boolean(body.liked);
      const result = await db.likeMeme(memeId, owner, liked);
      if (!result) {
        send(404, { error: '梗图不存在或已被删除' });
        return true;
      }
      send(200, {
        ok: true,
        likes: result.likes,
        liked: result.liked
      });
      return true;
    }

    // 5. 删除当前设备发布的梗图
    const memeDeleteRoute = /^\/api\/memes\/([a-f0-9]{32})$/.exec(url.pathname);
    if (memeDeleteRoute && req.method === 'DELETE') {
      const memeId = memeDeleteRoute[1];
      const removed = await db.deleteMeme(memeId, owner);
      if (!removed) {
        send(403, { error: '只能删除当前浏览器发布的梗图' });
        return true;
      }
      send(200, {
        ok: true,
        memes: await db.memes(owner)
      });
      return true;
    }

    return false;
  };
}
