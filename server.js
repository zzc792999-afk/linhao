import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, createHash } from 'node:crypto';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const publicRoot = path.join(root, 'public');
const hash = value => createHash('sha256').update(value).digest('hex');
export function createApp(dataDir = process.env.DATA_DIR || path.join(root, 'data')) {
  mkdirSync(dataDir, { recursive: true });
  const db = new DatabaseSync(path.join(dataDir, 'class.db'));
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS notes(id TEXT PRIMARY KEY, owner TEXT NOT NULL, name TEXT NOT NULL, text TEXT NOT NULL, date TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS likes(person TEXT NOT NULL, owner TEXT NOT NULL, PRIMARY KEY(person,owner));`);
  const rates = new Map();
  const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' blob:; style-src 'self'; script-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    const send = (status, body) => { res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}); res.end(JSON.stringify(body)); };
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname === '/healthz') return send(200, {ok: db.prepare('SELECT 1 AS ok').get().ok === 1});
      if (!url.pathname.startsWith('/api/')) {
        if (!['GET','HEAD'].includes(req.method)) return send(405,{error:'不支持的请求方式'});
        const pathname = decodeURIComponent(url.pathname);
        const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
        // Only serve explicit public files, never the database or server source.
        if (!['index.html','app.js','style.css','assets/p1.jpg','assets/p2.jpg','assets/p3.jpg'].includes(relative)) return send(404,{error:'页面不存在'});
        const content = readFileSync(path.join(publicRoot, relative));
        const type = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.jpg':'image/jpeg'}[path.extname(relative)];
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
      const listNotes = () => db.prepare('SELECT id, name, text, date, owner = ? AS mine FROM notes ORDER BY date DESC, id DESC LIMIT 200').all(owner).map(n=>({...n,mine:!!n.mine}));
      const listLikes = () => Object.fromEntries(['p1','p2','p3'].map(person=>[person,{count:db.prepare('SELECT count(*) AS n FROM likes WHERE person=?').get(person).n,liked:!!db.prepare('SELECT 1 FROM likes WHERE person=? AND owner=?').get(person,owner)}]));
      if (req.method === 'GET' && url.pathname === '/api/state') return send(200,{notes:listNotes(),likes:listLikes()});
      if (req.method === 'POST' && url.pathname === '/api/notes') {
        const body=await readJson(req);
        if(typeof body.name!=='string'||typeof body.text!=='string'||!body.name.trim()||!body.text.trim()||body.name.length>16||body.text.length>200) return send(400,{error:'昵称限 1–16 字，留言限 1–200 字'});
        const recent=db.prepare('SELECT date FROM notes WHERE owner=? ORDER BY date DESC LIMIT 1').get(owner);
        if(recent && Date.now()-Date.parse(recent.date)<10000)return send(429,{error:'请间隔 10 秒再发留言'});
        db.prepare('INSERT INTO notes VALUES(?,?,?,?,?)').run(randomBytes(16).toString('hex'),owner,body.name.trim(),body.text.trim(),new Date().toISOString());
        return send(201,{notes:listNotes()});
      }
      const deletion=/^\/api\/notes\/([a-f0-9]{32})$/.exec(url.pathname);
      if(req.method==='DELETE'&&deletion){
        const result=db.prepare('DELETE FROM notes WHERE id=? AND owner=?').run(deletion[1],owner);
        if(!result.changes)return send(403,{error:'只能删除此浏览器发布的留言'});
        return send(200,{notes:listNotes()});
      }
      const like=/^\/api\/likes\/(p[123])$/.exec(url.pathname);
      if(req.method==='PUT'&&like){
        const body=await readJson(req); if(typeof body.liked!=='boolean')return send(400,{error:'点赞状态无效'});
        if(body.liked)db.prepare('INSERT OR IGNORE INTO likes VALUES(?,?)').run(like[1],owner);
        else db.prepare('DELETE FROM likes WHERE person=? AND owner=?').run(like[1],owner);
        return send(200,{likes:listLikes()});
      }
      return send(404,{error:'接口不存在'});
    } catch(error) {
      if(error.status)return send(error.status,{error:error.message});
      console.error(error); if(!res.headersSent)send(500,{error:'服务器暂时繁忙，请稍后重试'});else res.end();
    }
  });
  server.on('close',()=>db.close());
  return server;
}
async function readJson(req){
  if(!req.headers['content-type']?.startsWith('application/json'))throw Object.assign(new Error('需要 JSON 请求'),{status:415});
  let size=0;const chunks=[];
  for await(const chunk of req){size+=chunk.length;if(size>4096)throw Object.assign(new Error('请求内容过大'),{status:413});chunks.push(chunk)}
  try{const body=JSON.parse(Buffer.concat(chunks).toString('utf8'));if(!body||Array.isArray(body)||typeof body!=='object')throw Error();return body}catch{throw Object.assign(new Error('请求格式无效'),{status:400})}
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  if(process.env.RENDER && !process.env.DATA_DIR)throw new Error('Render 部署必须配置 DATA_DIR 并挂载持久磁盘，详见 README.md');
  const server=createApp();server.listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log(`班级网站已启动：http://localhost:${server.address().port}`));
  for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>server.close(()=>process.exit(0)));
}
