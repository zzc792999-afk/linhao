const defaultProfile={name:'路过的同学',mascot:'panda'};
export const mascots=[
 {id:'pig',name:'猪',emoji:'🐷'},{id:'turtle',name:'甲鱼',emoji:'🐢'},{id:'chicken',name:'鸡',emoji:'🐔'},
 {id:'cat',name:'野猫',emoji:'🐈'},{id:'owl',name:'猫头鹰',emoji:'🦉'},{id:'dog',name:'狗',emoji:'🐶'},{id:'panda',name:'熊猫',emoji:'🐼'},
 {id:'rednose',name:'红鼻子小伙伴',emoji:'🤡'}
];
export const arcadeSchema=[
 'CREATE TABLE IF NOT EXISTS class_arcade_profiles(owner TEXT PRIMARY KEY,name TEXT NOT NULL,mascot TEXT NOT NULL)',
 'CREATE TABLE IF NOT EXISTS class_arcade_feeds(day TEXT NOT NULL,owner TEXT NOT NULL,mascot TEXT NOT NULL,PRIMARY KEY(day,owner,mascot))',
 'CREATE INDEX IF NOT EXISTS class_arcade_feeds_mascot ON class_arcade_feeds(mascot)',
 'CREATE TABLE IF NOT EXISTS class_arcade_attempts(id TEXT PRIMARY KEY,owner TEXT NOT NULL,rounds TEXT NOT NULL,score INTEGER NOT NULL,day TEXT NOT NULL,date TEXT NOT NULL,revoked INTEGER NOT NULL DEFAULT 0)',
 'CREATE INDEX IF NOT EXISTS class_arcade_attempts_owner_day ON class_arcade_attempts(owner,day)',
 'CREATE TABLE IF NOT EXISTS class_arcade_scores(owner TEXT PRIMARY KEY,id TEXT NOT NULL UNIQUE,score INTEGER NOT NULL,date TEXT NOT NULL)',
 'CREATE TABLE IF NOT EXISTS class_arcade_tickets(owner TEXT PRIMARY KEY,ticket TEXT NOT NULL UNIQUE,choices TEXT NOT NULL,expires_at BIGINT NOT NULL)',
 'CREATE TABLE IF NOT EXISTS class_arcade_drawings(id TEXT PRIMARY KEY,owner TEXT NOT NULL,name TEXT NOT NULL,answer TEXT NOT NULL,hint TEXT NOT NULL,strokes TEXT NOT NULL,fingerprint TEXT NOT NULL,deleted INTEGER NOT NULL DEFAULT 0,date TEXT NOT NULL)',
 'CREATE INDEX IF NOT EXISTS class_arcade_drawings_date ON class_arcade_drawings(deleted,date)',
 'CREATE TABLE IF NOT EXISTS class_arcade_guesses(drawing TEXT NOT NULL,owner TEXT NOT NULL,misses INTEGER NOT NULL,last_try BIGINT NOT NULL,solved INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(drawing,owner))'
];
export function arcadeStore(query){
 const rows=async(sql,args=[])=>(await query(sql,args)).rows;
 const profile=async owner=>(await rows('SELECT name,mascot FROM class_arcade_profiles WHERE owner=$1',[owner]))[0]||{...defaultProfile};
 const mapDrawing=row=>({id:row.id,name:row.name,hint:row.hint,length:Number(row.word_length),solvedCount:Number(row.solved_count),mine:!!row.mine,solved:!!row.solved,answer:row.answer,createdAt:row.date});
 const drawingColumns="d.id,d.name,d.hint,d.date,LENGTH(d.answer) AS word_length,CASE WHEN d.owner=$1 THEN 1 ELSE 0 END AS mine,COALESCE(g.solved,0) AS solved,CASE WHEN d.owner=$1 OR g.solved=1 THEN d.answer ELSE NULL END AS answer,(SELECT COUNT(*) FROM class_arcade_guesses count_guess WHERE count_guess.drawing=d.id AND count_guess.solved=1) AS solved_count";
 const scores=async owner=>(await rows("SELECT s.id,COALESCE(p.name,'路过的同学') AS name,COALESCE(p.mascot,'panda') AS mascot,s.score,CASE WHEN s.owner=$1 THEN 1 ELSE 0 END AS mine FROM class_arcade_scores s LEFT JOIN class_arcade_profiles p ON p.owner=s.owner ORDER BY s.score ASC,s.date ASC,s.id ASC LIMIT 20",[owner])).map(s=>({...s,score:Number(s.score),mine:!!s.mine}));
 return {
  arcadeProfile:profile,
  async arcadeCleanup(day,now){await query('DELETE FROM class_arcade_attempts WHERE day<$1 AND revoked=0',[day]);await query('DELETE FROM class_arcade_tickets WHERE expires_at<$1',[now])},
  arcadeSaveProfile:(owner,name,mascot)=>query('INSERT INTO class_arcade_profiles(owner,name,mascot) VALUES($1,$2,$3) ON CONFLICT(owner) DO UPDATE SET name=excluded.name,mascot=excluded.mascot',[owner,name,mascot]),
  arcadeFeed:(day,owner,mascot)=>query('INSERT INTO class_arcade_feeds(day,owner,mascot) VALUES($1,$2,$3) ON CONFLICT(day,owner,mascot) DO NOTHING',[day,owner,mascot]),
  async arcadeState(owner,day){
   const [me,totals,fed,best,reactionLeaderboard,drawings]=await Promise.all([
    profile(owner),rows('SELECT mascot,COUNT(*) AS n FROM class_arcade_feeds GROUP BY mascot'),
    rows('SELECT mascot FROM class_arcade_feeds WHERE day=$1 AND owner=$2',[day,owner]),
    rows('SELECT score FROM class_arcade_scores WHERE owner=$1',[owner]),scores(owner),
    rows('SELECT '+drawingColumns+' FROM class_arcade_drawings d LEFT JOIN class_arcade_guesses g ON g.drawing=d.id AND g.owner=$1 WHERE d.deleted=0 ORDER BY d.date DESC,d.id DESC LIMIT 100',[owner])
   ]);
   return {day,pets:mascots.map(m=>{const feeds=Number(totals.find(t=>t.mascot===m.id)?.n||0);return {...m,feeds,level:1+Math.floor(feeds/10),progress:feeds%10,needed:10,fed:fed.some(f=>f.mascot===m.id)}}),my:{...me,stickerCount:fed.length,bestReaction:best[0]?Number(best[0].score):null},reactionLeaderboard,drawings:drawings.map(mapDrawing)};
  },
  async arcadeReaction(p){
   await query('INSERT INTO class_arcade_attempts(id,owner,rounds,score,day,date) SELECT $1,$2,$3,$4,$5,$6 WHERE (SELECT COUNT(*) FROM class_arcade_attempts WHERE owner=$2 AND day=$5)<30 ON CONFLICT(id) DO NOTHING',[p.id,p.owner,JSON.stringify(p.rounds),p.score,p.day,p.date]);
   const existing=(await rows('SELECT owner,rounds,score,revoked FROM class_arcade_attempts WHERE id=$1',[p.id]))[0];
   if(!existing)return 'limit';if(existing.owner!==p.owner||existing.rounds!==JSON.stringify(p.rounds))return 'conflict';
   if(existing.revoked)return 'revoked';
   // Repeating an accepted attempt can repair a response lost between these writes.
   await query('INSERT INTO class_arcade_scores(owner,id,score,date) SELECT $1,$2,$3,$4 WHERE EXISTS(SELECT 1 FROM class_arcade_attempts WHERE id=$5 AND owner=$1 AND revoked=0) ON CONFLICT(owner) DO UPDATE SET score=excluded.score,date=excluded.date WHERE excluded.score<class_arcade_scores.score',[p.owner,p.scoreId,Number(existing.score),p.date,p.id]);
   return 'ok';
  },
  arcadeTicket:async(owner,ticket)=>(await rows('SELECT ticket,choices,expires_at FROM class_arcade_tickets WHERE owner=$1'+(ticket?' AND ticket=$2':''),ticket?[owner,ticket]:[owner]))[0],
  arcadeSaveTicket:(owner,ticket,choices,expires)=>query('INSERT INTO class_arcade_tickets(owner,ticket,choices,expires_at) VALUES($1,$2,$3,$4) ON CONFLICT(owner) DO UPDATE SET ticket=excluded.ticket,choices=excluded.choices,expires_at=excluded.expires_at',[owner,ticket,JSON.stringify(choices),expires]),
  arcadeRawDrawing:async id=>(await rows('SELECT * FROM class_arcade_drawings WHERE id=$1',[id]))[0],
  async arcadeCreateDrawing(p){return !!(await query('INSERT INTO class_arcade_drawings(id,owner,name,answer,hint,strokes,fingerprint,date) SELECT $1,$2,$3,$4,$5,$6,$7,$8 WHERE (SELECT COUNT(*) FROM class_arcade_drawings WHERE deleted=0)<100 AND (SELECT COUNT(*) FROM class_arcade_drawings WHERE owner=$2 AND deleted=0)<5 ON CONFLICT(id) DO NOTHING',[p.id,p.owner,p.name,p.answer,p.hint,JSON.stringify(p.strokes),p.fingerprint,p.date])).rowCount},
  async arcadeDrawing(id,owner){const row=(await rows('SELECT '+drawingColumns+',d.strokes FROM class_arcade_drawings d LEFT JOIN class_arcade_guesses g ON g.drawing=d.id AND g.owner=$1 WHERE d.id=$2 AND d.deleted=0',[owner,id]))[0];return row?{...mapDrawing(row),strokes:JSON.parse(row.strokes)}:null},
  arcadeGuessState:async(id,owner)=>(await rows('SELECT misses,last_try,solved FROM class_arcade_guesses WHERE drawing=$1 AND owner=$2',[id,owner]))[0],
  async arcadeRecordGuess(id,owner,correct,now){return !!(await query("INSERT INTO class_arcade_guesses(drawing,owner,misses,last_try,solved) SELECT id,$1,$2,$3,$4 FROM class_arcade_drawings WHERE id=$5 AND owner<>$1 AND deleted=0 ON CONFLICT(drawing,owner) DO UPDATE SET misses=class_arcade_guesses.misses+excluded.misses,last_try=excluded.last_try,solved=excluded.solved WHERE class_arcade_guesses.solved=0 AND class_arcade_guesses.misses<20 AND class_arcade_guesses.last_try<=$6",[owner,correct?0:1,now,correct?1:0,id,now-1000])).rowCount},
  arcadeSolvedCount:async id=>Number((await rows('SELECT COUNT(*) AS n FROM class_arcade_guesses WHERE drawing=$1 AND solved=1',[id]))[0]?.n||0),
  async arcadeDeleteDrawing(id,owner){return !!(await query("UPDATE class_arcade_drawings SET deleted=1,strokes='[]' WHERE id=$1 AND deleted=0"+(owner===undefined?'':' AND owner=$2'),owner===undefined?[id]:[id,owner])).rowCount},
  async arcadeAdmin(){return {drawings:(await rows('SELECT d.id,d.name,d.answer,d.hint,d.date,(SELECT COUNT(*) FROM class_arcade_guesses g WHERE g.drawing=d.id AND g.solved=1) AS solved_count FROM class_arcade_drawings d WHERE d.deleted=0 ORDER BY d.date DESC,d.id DESC')).map(d=>({id:d.id,name:d.name,answer:d.answer,hint:d.hint,createdAt:d.date,solvedCount:Number(d.solved_count)})),scores:await scores('')}},
  async arcadeDeleteScore(id){await query('UPDATE class_arcade_attempts SET revoked=1 WHERE owner=(SELECT owner FROM class_arcade_scores WHERE id=$1)',[id]);return query('DELETE FROM class_arcade_scores WHERE id=$1',[id])}
 };
}
