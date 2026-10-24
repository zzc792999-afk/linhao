import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import pg from 'pg';

export function sqliteStore(directory) {
  mkdirSync(directory, {recursive:true});
  const db = new DatabaseSync(path.join(directory, 'class.db'));
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS notes(id TEXT PRIMARY KEY, owner TEXT NOT NULL, name TEXT NOT NULL, text TEXT NOT NULL, date TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS notes_date ON notes(date DESC);
    CREATE TABLE IF NOT EXISTS likes(person TEXT NOT NULL, owner TEXT NOT NULL, PRIMARY KEY(person,owner));
    CREATE TABLE IF NOT EXISTS note_cooldowns(owner TEXT PRIMARY KEY, posted_at INTEGER NOT NULL);`);
  return {
    health:async()=>db.prepare('SELECT 1 AS ok').get().ok===1,
    notes:async owner=>db.prepare('SELECT id,name,text,date,owner=? AS mine FROM notes ORDER BY date DESC,id DESC LIMIT 200').all(owner).map(n=>({...n,mine:!!n.mine})),
    likes:async owner=>Object.fromEntries(['p1','p2','p3'].map(person=>[person,{count:db.prepare('SELECT COUNT(*) AS n FROM likes WHERE person=?').get(person).n,liked:!!db.prepare('SELECT 1 FROM likes WHERE person=? AND owner=?').get(person,owner)}])),
    async add(note){
      db.exec('BEGIN IMMEDIATE');
      try{
        const recent=db.prepare('SELECT posted_at FROM note_cooldowns WHERE owner=?').get(note.owner);
        if(recent && Date.now()-recent.posted_at<10000){db.exec('ROLLBACK');return false}
        db.prepare('INSERT INTO note_cooldowns VALUES(?,?) ON CONFLICT(owner) DO UPDATE SET posted_at=excluded.posted_at').run(note.owner,Date.now());
        db.prepare('INSERT INTO notes VALUES(?,?,?,?,?)').run(note.id,note.owner,note.name,note.text,note.date);
        db.exec('COMMIT');return true;
      }catch(error){db.exec('ROLLBACK');throw error}
    },
    remove:async(id,owner)=>!!db.prepare('DELETE FROM notes WHERE id=? AND owner=?').run(id,owner).changes,
    async like(person,owner,liked){if(liked)db.prepare('INSERT OR IGNORE INTO likes VALUES(?,?)').run(person,owner);else db.prepare('DELETE FROM likes WHERE person=? AND owner=?').run(person,owner)},
    close:async()=>db.close()
  };
}

export async function postgresStore(pool) {
  for(const statement of [
    'CREATE TABLE IF NOT EXISTS notes(id TEXT PRIMARY KEY,owner TEXT NOT NULL,name TEXT NOT NULL,text TEXT NOT NULL,date TEXT NOT NULL)',
    'CREATE INDEX IF NOT EXISTS notes_date ON notes(date DESC)',
    'CREATE TABLE IF NOT EXISTS likes(person TEXT NOT NULL,owner TEXT NOT NULL,PRIMARY KEY(person,owner))',
    'CREATE TABLE IF NOT EXISTS note_cooldowns(owner TEXT PRIMARY KEY,posted_at BIGINT NOT NULL)'
  ]) await pool.query(statement);
  return {
    health:async()=> (await pool.query('SELECT 1 AS ok')).rows[0].ok===1,
    notes:async owner=>(await pool.query('SELECT id,name,text,date,owner=$1 AS mine FROM notes ORDER BY date DESC,id DESC LIMIT 200',[owner])).rows,
    likes:async owner=>{
      const {rows}=await pool.query('SELECT person,COUNT(*)::int AS count,BOOL_OR(owner=$1) AS liked FROM likes GROUP BY person',[owner]);
      return Object.fromEntries(['p1','p2','p3'].map(person=>[person,rows.find(row=>row.person===person)||{count:0,liked:false}]));
    },
    async add(note){
      const client=await pool.connect();
      try{
        await client.query('BEGIN');
        await client.query('INSERT INTO note_cooldowns(owner,posted_at) VALUES($1,0) ON CONFLICT(owner) DO NOTHING',[note.owner]);
        const {rows}=await client.query('SELECT posted_at FROM note_cooldowns WHERE owner=$1 FOR UPDATE',[note.owner]);
        if(Date.now()-Number(rows[0].posted_at)<10000){await client.query('ROLLBACK');return false}
        await client.query('UPDATE note_cooldowns SET posted_at=$1 WHERE owner=$2',[Date.now(),note.owner]);
        await client.query('INSERT INTO notes VALUES($1,$2,$3,$4,$5)',[note.id,note.owner,note.name,note.text,note.date]);
        await client.query('COMMIT');return true;
      }catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}
    },
    remove:async(id,owner)=>!!(await pool.query('DELETE FROM notes WHERE id=$1 AND owner=$2',[id,owner])).rowCount,
    async like(person,owner,liked){if(liked)await pool.query('INSERT INTO likes VALUES($1,$2) ON CONFLICT DO NOTHING',[person,owner]);else await pool.query('DELETE FROM likes WHERE person=$1 AND owner=$2',[person,owner])},
    close:async()=>pool.end()
  };
}

export async function openStore({directory,databaseUrl,render}) {
  if(databaseUrl){
    const pool=new pg.Pool({connectionString:databaseUrl,max:5,connectionTimeoutMillis:15000,idleTimeoutMillis:30000,query_timeout:15000});
    pool.on('error',()=>console.error('数据库连接暂时中断，后续请求将重试。'));
    try{return await postgresStore(pool)}catch(error){await pool.end();throw error}
  }
  if(render)throw new Error('请在 Render 环境变量中填写 Neon 的 DATABASE_URL。免费服务不能用本地 SQLite 保存线上留言。');
  return sqliteStore(directory);
}
