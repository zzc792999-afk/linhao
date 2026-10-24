import pg from 'pg';
import {randomBytes} from 'node:crypto';
import {postgresStore} from '../database.js';

if(!process.env.DATABASE_URL){console.error('尚未配置 DATABASE_URL。');process.exit(1)}
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,max:2,connectionTimeoutMillis:15000,query_timeout:15000});
const owner=randomBytes(32).toString('hex');
const id=randomBytes(16).toString('hex');
try{
  const store=await postgresStore(pool);
  if(!await store.health())throw Error('Health check failed');
  if(!await store.add({id,owner,name:'连接验证',text:'数据库连接验证，完成后自动清理。',date:new Date().toISOString()}))throw Error('Write failed');
  const own=(await store.notes(owner)).find(n=>n.id===id);
  const other=(await store.notes('verification-other-device')).find(n=>n.id===id);
  if(!own?.mine||other?.mine!==false)throw Error('Ownership check failed');
  if(await store.remove(id,'verification-other-device'))throw Error('Permission check failed');
  await store.like('p1',owner,true);
  if(!(await store.likes(owner)).p1.liked)throw Error('Like write failed');
  await store.like('p1',owner,false);
  if(!await store.remove(id,owner))throw Error('Delete failed');
  console.log('数据库已连接；建表、读写、跨设备读取、删除权限和点赞校验通过。测试数据已清理。');
}catch(error){console.error('数据库验证未完成：'+(error.code||error.name));process.exitCode=1}
finally{
  try{await pool.query('DELETE FROM notes WHERE owner=$1',[owner]);await pool.query('DELETE FROM likes WHERE owner=$1',[owner]);await pool.query('DELETE FROM note_cooldowns WHERE owner=$1',[owner])}catch{}
  await pool.end();
}
