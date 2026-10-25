import pg from 'pg';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {boardSchema} from '../board-database.js';
export async function migrateClassDesk(pool){
 const client=await pool.connect();
 try{await client.query('BEGIN');for(const statement of boardSchema)await client.query(statement);await client.query('COMMIT')}
 catch(error){await client.query('ROLLBACK').catch(()=>{});throw error}
 finally{client.release()}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(!process.env.DATABASE_URL)throw Error('DATABASE_URL is required; no database will be created automatically.');
 const url=new URL(process.env.DATABASE_URL);if(/(^|\.)neon\.tech$/.test(url.hostname))url.hostname=url.hostname.replace('-pooler','');
 const pool=new pg.Pool({connectionString:url.href,max:1,connectionTimeoutMillis:15000,query_timeout:15000});
 try{await migrateClassDesk(pool);console.log('Class Desk schema ready: two new tables and one index. Existing tables are unchanged.')}
 catch(error){console.error('Class Desk migration failed: '+(error.code||String(error.message).replace(/postgres(?:ql)?:\/\/\S+/gi,'[database URL]').slice(0,220)));process.exitCode=1}
 finally{await pool.end()}
}
