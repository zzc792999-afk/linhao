import {adminRoutes,classDay} from './admin.js';
import http from 'node:http';
import sharp from 'sharp';
import { openStore } from './database.js';
import { randomBytes, createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const publicRoot = path.join(root, 'public');
const hash = value => createHash('sha256').update(value).digest('hex');
export async function createApp(dataDir = process.env.DATA_DIR || path.join(root, 'data'), injectedStore) {
  const db = injectedStore || await openStore({directory:dataDir,databaseUrl:process.env.DATABASE_URL,render:!!process.env.RENDER});
  const manage=adminRoutes(db,req=>readJson(req,8192));
  const rates = new Map();
  let processingPhotos=0;
  const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' blob:; style-src 'self'; script-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    const send = (status, body) => { res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}); res.end(JSON.stringify(body)); };
    try {
      const url = new URL(req.url, 'http://localhost');
      // Keep Render health checks from waking the free database continuously.
      if (url.pathname === '/healthz') return send(200, {ok:true});
      if (!url.pathname.startsWith('/api/')) {
        if (!['GET','HEAD'].includes(req.method)) return send(405,{error:'不支持的请求方式'});
        const pathname = decodeURIComponent(url.pathname);
        const relative = pathname === '/' ? 'index.html' : ['/admin','/admin/'].includes(pathname) ? 'admin.html' : pathname.slice(1);
        // Only serve explicit public files, never the database or server source.
        if (!['index.html','admin.html','admin-client.js','fun.js','app.js','style.css','assets/p1.jpg','assets/p2.jpg','assets/p3.jpg','assets/class-film.mp4'].includes(relative)) return send(404,{error:'页面不存在'});
        let content = readFileSync(path.join(publicRoot, relative));
        // The Node deployment enables the shared API; static hosting stays a preview.
        if(relative==='index.html')content=Buffer.from(content.toString('utf8').replace('data-mode="preview"','data-mode="live"'));
        const type = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.jpg':'image/jpeg','.mp4':'video/mp4'}[path.extname(relative)];
        if(relative==='assets/class-film.mp4'){
          const headers={'Content-Type':type,'Accept-Ranges':'bytes','Cache-Control':'public, max-age=3600'};
          if(req.headers.range){
            const range=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
            let start=0,end=content.length-1;
            if(!range||(!range[1]&&!range[2])){res.writeHead(416,{'Content-Range':`bytes */${content.length}`});return res.end()}
            if(range[1]){start=Number(range[1]);if(range[2])end=Math.min(Number(range[2]),end)}else{start=Math.max(0,content.length-Number(range[2]))}
            if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=content.length){res.writeHead(416,{'Content-Range':`bytes */${content.length}`});return res.end()}
            res.writeHead(206,{...headers,'Content-Length':end-start+1,'Content-Range':`bytes ${start}-${end}/${content.length}`});return res.end(req.method==='HEAD'?undefined:content.subarray(start,end+1));
          }
          res.writeHead(200,{...headers,'Content-Length':content.length});return res.end(req.method==='HEAD'?undefined:content);
        }
        res.writeHead(200, {'Content-Type':type,'Cache-Control':'no-cache'});
        return res.end(req.method === 'HEAD' ? undefined : content);
      }
      res.setHeader('Cache-Control','no-store');
      if (req.headers['sec-fetch-site'] === 'cross-site') return send(403,{error:'不允许跨站请求'});
      if (req.headers.origin) {
        let origin; try { origin = new URL(req.headers.origin); } catch { return send(403,{error:'来源无效'}); }
        if (origin.host !== req.headers.host) return send(403,{error:'不允许跨站请求'});
      }
      const match = /(?:^|;\s*)class_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '');
      const token = match?.[1] || randomBytes(32).toString('hex');
      const owner = hash(token);
      if (!match) res.setHeader('Set-Cookie', `class_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
      if (req.method !== 'GET') {
        const now=Date.now();
        // Render forwards client IPs; also cap all writes globally per instance.
        const key = req.socket.remoteAddress || 'unknown';
        if (rates.size > 2000) for (const [ip, item] of rates) if(now-item.start>60000) rates.delete(ip);
        let entry=rates.get(key); if(!entry || now-entry.start>60000){entry={start:now,count:0};rates.set(key,entry)}
        if(++entry.count>120) return send(429,{error:'操作太频繁，请稍后再试'});
      }
      if(await manage(req,res,url,owner,send))return;
      if(req.method==='GET'&&url.pathname==='/api/fun')return send(200,await db.fun(owner,classDay()));
      if(req.method==='PUT'&&url.pathname==='/api/checkin'){
        const body=await readJson(req);
        if(typeof body.name!=='string'||!body.name.trim()||body.name.length>16||!['元气满满','专心写码','需要充电','快乐摸鱼'].includes(body.mood))return send(400,{error:'请填写 1–16 字昵称并选择今天的心情'});
        await db.checkin(classDay(),owner,body.name.trim(),body.mood,new Date().toISOString());return send(200,await db.fun(owner,classDay()));
      }
      const voteRoute=/^\/api\/polls\/([a-z0-9-]{1,64})\/vote$/.exec(url.pathname);
      if(req.method==='PUT'&&voteRoute){
        const body=await readJson(req),poll=await db.poll(voteRoute[1]);
        if(!poll||!poll.is_open)return send(409,{error:'投票已结束或不存在'});
        if(!Number.isInteger(body.choice)||body.choice<0||body.choice>=JSON.parse(poll.options).length)return send(400,{error:'请选择有效选项'});
        if(!await db.vote(poll.id,owner,body.choice))return send(409,{error:'投票已结束'});
        return send(200,await db.fun(owner,classDay()));
      }
      const listNotes = () => db.notes(owner);
      const listLikes = () => db.likes(owner);
      if (req.method === 'GET' && url.pathname === '/api/state') {
        const [notes,likes,photos]=await Promise.all([listNotes(),listLikes(),db.photos(owner)]);
        return send(200,{notes,likes,photos});
      }
      const photoRoute=/^\/api\/photos\/([a-f0-9]{32})$/.exec(url.pathname);
      if(['GET','HEAD'].includes(req.method)&&photoRoute){
        const photo=await db.photo(photoRoute[1]);
        if(!photo)return send(404,{error:'照片不存在或已删除'});
        res.writeHead(200,{'Content-Type':'image/jpeg','Cache-Control':'private, no-cache','Content-Length':photo.data.length});
        return res.end(req.method==='HEAD'?undefined:Buffer.from(photo.data));
      }
      if(req.method==='DELETE'&&photoRoute){
        if(!await db.removePhoto(photoRoute[1],owner))return send(403,{error:'只能删除此浏览器上传的照片'});
        return send(200,{photos:await db.photos(owner)});
      }
      if(req.method==='POST'&&url.pathname==='/api/photos'){
        if(!/^image\/(jpeg|png|webp)$/i.test(req.headers['content-type']||''))return send(415,{error:'请上传 JPG、PNG 或 WebP 照片'});
        if(processingPhotos>=2)return send(429,{error:'正在处理其他照片，请稍后再试'});
        processingPhotos++;
        try{
          const chunks=[];let size=0;
          for await(const chunk of req){size+=chunk.length;if(size>8*1024*1024)throw Object.assign(new Error('图片过大，请压缩后上传（最大 8MB）'),{status:413});chunks.push(chunk)}
          let data;
          try{
            const image=sharp(Buffer.concat(chunks),{limitInputPixels:40000000,animated:false});
            const meta=await image.metadata();
            if(!['jpeg','png','webp'].includes(meta.format))throw Error();
            data=await image.rotate().resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).jpeg({quality:78}).toBuffer();
          }catch{ return send(400,{error:'图片无法读取，请选择有效的 JPG、PNG 或 WebP 照片'}) }
          if(data.length>1024*1024)return send(413,{error:'压缩后的照片仍超过 1MB，请缩小后重试'});
          const id=randomBytes(16).toString('hex');
          const name=(url.searchParams.get('name')||'班级瞬间').trim().slice(0,100)||'班级瞬间';
          const added=await db.addPhoto({id,owner,name,date:new Date().toISOString(),data});
          if(!added)return send(409,{error:'共享相册已满（最多 200 张、100MB），请先删除部分自己的照片'});
          return send(201,{id,photos:await db.photos(owner)});
        }finally{processingPhotos--}
      }
      if (req.method === 'POST' && url.pathname === '/api/notes') {
        const body=await readJson(req);
        if(typeof body.name!=='string'||typeof body.text!=='string'||!body.name.trim()||!body.text.trim()||body.name.length>16||body.text.length>200) return send(400,{error:'昵称限 1–16 字，留言限 1–200 字'});
        const added=await db.add({id:randomBytes(16).toString('hex'),owner,name:body.name.trim(),text:body.text.trim(),date:new Date().toISOString()});
        if(!added)return send(429,{error:'请间隔 10 秒再发留言'});
        return send(201,{notes:await listNotes()});
      }
      const deletion=/^\/api\/notes\/([a-f0-9]{32})$/.exec(url.pathname);
      if(req.method==='DELETE'&&deletion){
        const removed=await db.remove(deletion[1],owner);
        if(!removed)return send(403,{error:'只能删除此浏览器发布的留言'});
        return send(200,{notes:await listNotes()});
      }
      const like=/^\/api\/likes\/(p[123])$/.exec(url.pathname);
      if(req.method==='PUT'&&like){
        const body=await readJson(req); if(typeof body.liked!=='boolean')return send(400,{error:'点赞状态无效'});
        await db.like(like[1],owner,body.liked);
        return send(200,{likes:await listLikes()});
      }
      return send(404,{error:'接口不存在'});
    } catch(error) {
      if(error.status)return send(error.status,{error:error.message});
      console.error('请求失败：',error.code || error.name); if(!res.headersSent)send(503,{error:'数据库暂时无法连接，请稍后重试'});else res.end();
    }
  });
  server.on('close',()=>{db.close().catch(()=>console.error('关闭数据库时发生错误'))});
  return server;
}
async function readJson(req,limit=4096){
  if(!req.headers['content-type']?.startsWith('application/json'))throw Object.assign(new Error('需要 JSON 请求'),{status:415});
  let size=0;const chunks=[];
  for await(const chunk of req){size+=chunk.length;if(size>limit)throw Object.assign(new Error('请求内容过大'),{status:413});chunks.push(chunk)}
  try{const body=JSON.parse(Buffer.concat(chunks).toString('utf8'));if(!body||Array.isArray(body)||typeof body!=='object')throw Error();return body}catch{throw Object.assign(new Error('请求格式无效'),{status:400})}
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){

  const server=await createApp();server.listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log(`班级网站已启动：http://localhost:${server.address().port}`));
  for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>server.close(()=>process.exit(0)));
}
