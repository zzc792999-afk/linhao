import pg from 'pg';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {arcadeSchema} from '../arcade-database.js';
export async function migrateArcade(pool){const client=await pool.connect();try{await client.query('BEGIN');for(const statement of arcadeSchema)await client.query(statement);await client.query('COMMIT')}catch(error){await client.query('ROLLBACK').catch(()=>{});throw error}finally{client.release()}}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(!process.env.DATABASE_URL)throw Error('DATABASE_URL is required; no database will be created automatically.');const url=new URL(process.env.DATABASE_URL);if(/(^|\.)neon\.tech$/.test(url.hostname))url.hostname=url.hostname.replace('-pooler','');
 const pool=new pg.Pool({connectionString:url.href,max:1,connectionTimeoutMillis:15000,query_timeout:15000});
 try{await migrateArcade(pool);console.log('Arcade schema ready. Existing tables and records are unchanged.')}
 catch(error){console.error('Arcade migration failed: '+(error.code||String(error.message).replace(/postgres(?:ql)?:\/\/\S+/gi,'[database URL]').slice(0,220)));process.exitCode=1}
 finally{await pool.end()}
}
