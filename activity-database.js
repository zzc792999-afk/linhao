import {socialSchema,socialStore} from './social-database.js';
export const activitySchema=[
 ...socialSchema,
 'CREATE TABLE IF NOT EXISTS class_settings(key TEXT PRIMARY KEY,value TEXT NOT NULL)',
 'CREATE TABLE IF NOT EXISTS polls(id TEXT PRIMARY KEY,title TEXT NOT NULL,options TEXT NOT NULL,is_open INTEGER NOT NULL DEFAULT 1,deleted INTEGER NOT NULL DEFAULT 0,date TEXT NOT NULL)',
 'CREATE TABLE IF NOT EXISTS votes(poll TEXT NOT NULL,owner TEXT NOT NULL,choice INTEGER NOT NULL,PRIMARY KEY(poll,owner))',
 'CREATE TABLE IF NOT EXISTS checkins(day TEXT NOT NULL,owner TEXT NOT NULL,name TEXT NOT NULL,mood TEXT NOT NULL,date TEXT NOT NULL,PRIMARY KEY(day,owner))',
 'CREATE TABLE IF NOT EXISTS admin_sessions(token TEXT PRIMARY KEY,version TEXT NOT NULL,expires BIGINT NOT NULL)',
 'CREATE TABLE IF NOT EXISTS admin_audit(id TEXT PRIMARY KEY,action TEXT NOT NULL,target TEXT NOT NULL,date TEXT NOT NULL)',
 `INSERT INTO polls(id,title,options,is_open,deleted,date) VALUES('welcome','下次班级活动，你更想参加哪一个？','["一起打球","电影之夜","户外野餐","编程小游戏"]',1,0,'2026-10-24T00:00:00.000Z') ON CONFLICT(id) DO NOTHING`
];
export function activityStore(query){
 const rows=async(sql,args=[]) => (await query(sql,args)).rows;
 const setting=async(key,fallback='')=>(await rows('SELECT value FROM class_settings WHERE key=$1',[key]))[0]?.value??fallback;
 const saveSetting=(key,value)=>query('INSERT INTO class_settings(key,value) VALUES($1,$2) ON CONFLICT(key) DO UPDATE SET value=excluded.value',[key,value]);
 return {
  ...socialStore(query),
  setting,saveSetting,
  async fun(owner,day){
   const [polls,votes,mine,checkins,announcement,roster]=await Promise.all([
    rows('SELECT id,title,options,is_open,date FROM polls WHERE deleted=0 ORDER BY date DESC,id DESC'),
    rows('SELECT poll,choice,COUNT(*) AS count FROM votes GROUP BY poll,choice'),
    rows('SELECT poll,choice FROM votes WHERE owner=$1',[owner]),
    rows('SELECT name,mood,date,CASE WHEN owner=$1 THEN 1 ELSE 0 END AS mine FROM checkins WHERE day=$2 ORDER BY date DESC',[owner,day]),
    setting('announcement'),setting('roster')]);
   return {day,announcement,roster:roster.split('\n').filter(Boolean),checkins:checkins.map(c=>({...c,mine:!!c.mine})),polls:polls.map(p=>{const options=JSON.parse(p.options);return {...p,is_open:!!p.is_open,options,counts:options.map((_,i)=>Number(votes.find(v=>v.poll===p.id&&v.choice===i)?.count||0)),choice:mine.find(v=>v.poll===p.id)?.choice??null}})};
  },
  checkin:(day,owner,name,mood,date)=>query('INSERT INTO checkins(day,owner,name,mood,date) VALUES($1,$2,$3,$4,$5) ON CONFLICT(day,owner) DO UPDATE SET name=excluded.name,mood=excluded.mood',[day,owner,name,mood,date]),
  async vote(poll,owner,choice){return !!(await query('INSERT INTO votes(poll,owner,choice) SELECT id,$1,$2 FROM polls WHERE id=$3 AND is_open=1 AND deleted=0 ON CONFLICT(poll,owner) DO UPDATE SET choice=excluded.choice',[owner,choice,poll])).rowCount},
  poll:async id=>(await rows('SELECT * FROM polls WHERE id=$1 AND deleted=0',[id]))[0],
  createPoll:p=>query('INSERT INTO polls(id,title,options,is_open,deleted,date) VALUES($1,$2,$3,1,0,$4)',[p.id,p.title,JSON.stringify(p.options),p.date]),
  pollCount:async()=>Number((await rows('SELECT COUNT(*) AS n FROM polls WHERE deleted=0'))[0].n),
  setPoll:(id,open)=>query('UPDATE polls SET is_open=$1 WHERE id=$2 AND deleted=0',[open?1:0,id]),
  deletePoll:id=>query('UPDATE polls SET deleted=1,is_open=0 WHERE id=$1',[id]),
  session:async(token,version,now)=>(await rows('SELECT token FROM admin_sessions WHERE token=$1 AND version=$2 AND expires>$3',[token,version,now])).length>0,
  async newSession(token,version,expires){await query('DELETE FROM admin_sessions WHERE expires<$1',[Date.now()]);await query('INSERT INTO admin_sessions VALUES($1,$2,$3)',[token,version,expires])},
  deleteSession:token=>query('DELETE FROM admin_sessions WHERE token=$1',[token]),
  audit:(id,action,target,date)=>query('INSERT INTO admin_audit VALUES($1,$2,$3,$4)',[id,action,target,date]),
  async dashboard(page){
   const [stats,notes,photos,audit]=await Promise.all([
    rows('SELECT (SELECT COUNT(*) FROM notes) AS notes,(SELECT COUNT(*) FROM photos) AS photos,(SELECT COUNT(*) FROM likes) AS likes,(SELECT COUNT(*) FROM checkins) AS checkins'),
    rows('SELECT id,name,text,date FROM notes ORDER BY date DESC,id DESC LIMIT 50 OFFSET $1',[page*50]),
    rows('SELECT id,name,date FROM photos ORDER BY date DESC,id DESC'),
    rows('SELECT action,target,date FROM admin_audit ORDER BY date DESC LIMIT 30')]);
   return {stats:Object.fromEntries(Object.entries(stats[0]).map(([k,v])=>[k,Number(v)])),notes,photos,audit,page};
  },
  adminDeleteNote:id=>query('DELETE FROM notes WHERE id=$1',[id]),
  adminDeletePhoto:id=>query('DELETE FROM photos WHERE id=$1',[id])
 };
}
