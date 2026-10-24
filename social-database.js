export const questions=[
 {title:'代码突然报错，第一反应是？',options:['先看报错信息','找同学一起研究','重启试试看','先喝口水冷静']},
 {title:'班级空出半天，你想怎么过？',options:['户外散步野餐','一起打球','看电影吃零食','组队打游戏']},
 {title:'小组作业里，你更像哪种角色？',options:['负责想点子','动手写代码','整理和展示','哪里需要就去哪']},
 {title:'最期待的下课时刻是？',options:['去食堂干饭','和朋友聊聊天','趴桌休息一下','继续捣鼓小项目']},
 {title:'想给未来的班级留下一句话？',options:['愿我们一直热爱','一起变得更厉害','别忘了常常见面','开心比什么都重要']}
];
export const socialSchema=[
 'CREATE TABLE IF NOT EXISTS class_challenges(id TEXT PRIMARY KEY,owner TEXT NOT NULL UNIQUE,name TEXT NOT NULL,answers TEXT NOT NULL,date TEXT NOT NULL)',
 'CREATE TABLE IF NOT EXISTS class_capsules(id TEXT PRIMARY KEY,owner TEXT NOT NULL,name TEXT NOT NULL,title TEXT NOT NULL,content TEXT NOT NULL,unlock_at TEXT NOT NULL,date TEXT NOT NULL)',
 'CREATE TABLE IF NOT EXISTS class_drawings(id TEXT PRIMARY KEY,owner TEXT NOT NULL,name TEXT NOT NULL,title TEXT NOT NULL,strokes TEXT NOT NULL,date TEXT NOT NULL)',
 'CREATE TABLE IF NOT EXISTS class_achievements(id TEXT PRIMARY KEY,title TEXT NOT NULL,description TEXT NOT NULL,icon TEXT NOT NULL,event_day TEXT NOT NULL,date TEXT NOT NULL)'
];
export function socialStore(query){
 const rows=async(sql,args=[])=>(await query(sql,args)).rows;
 const add=async(table,columns,values,owner,limit,personal=5)=>{
  const markers=values.map((_,i)=>'$'+(i+1)).join(',');const n=values.length;
  return !!(await query(`INSERT INTO ${table}(${columns}) SELECT ${markers} WHERE (SELECT COUNT(*) FROM ${table})<$${n+1} AND (SELECT COUNT(*) FROM ${table} WHERE owner=$${n+2})<$${n+3}`,[...values,limit,owner,personal])).rowCount;
 };
 return {
  async extended(owner,now=new Date().toISOString()){
   const [players,capsules,drawings,achievements]=await Promise.all([
    rows('SELECT id,owner,name,answers,date FROM class_challenges ORDER BY date,id'),
    rows('SELECT id,name,title,unlock_at,date,CASE WHEN unlock_at<=$1 THEN content ELSE NULL END AS content,CASE WHEN owner=$2 THEN 1 ELSE 0 END AS mine FROM class_capsules ORDER BY unlock_at,id',[now,owner]),
    rows('SELECT id,name,title,date,CASE WHEN owner=$1 THEN 1 ELSE 0 END AS mine FROM class_drawings ORDER BY date DESC,id DESC',[owner]),
    rows('SELECT id,title,description,icon,event_day,date FROM class_achievements ORDER BY event_day DESC,date DESC,id DESC')]);
   const parsed=players.map(p=>({...p,answers:JSON.parse(p.answers)}));const counts=questions.map((q,i)=>q.options.map((_,j)=>parsed.filter(p=>p.answers[i]===j).length));
   const ranked=parsed.map(p=>({id:p.id,name:p.name,date:p.date,mine:p.owner===owner,score:Math.round(p.answers.filter((a,i)=>counts[i][a]===Math.max(...counts[i])).length/questions.length*100)})).sort((a,b)=>b.score-a.score||a.date.localeCompare(b.date));
   const me=parsed.find(p=>p.owner===owner);
   return {challenge:{questions,participants:parsed.length,myAnswers:me?.answers??null,myScore:ranked.find(p=>p.mine)?.score??null,counts:me?counts:null,leaderboard:ranked.slice(0,20)},capsules:capsules.map(c=>({...c,mine:!!c.mine,locked:c.content===null})),drawings:drawings.map(d=>({...d,mine:!!d.mine})),achievements};
  },
  async submitChallenge(p){return !!(await query('INSERT INTO class_challenges(id,owner,name,answers,date) SELECT $1,$2,$3,$4,$5 WHERE (SELECT COUNT(*) FROM class_challenges)<500 OR EXISTS(SELECT 1 FROM class_challenges WHERE owner=$2) ON CONFLICT(owner) DO UPDATE SET name=excluded.name,answers=excluded.answers',[p.id,p.owner,p.name,JSON.stringify(p.answers),p.date])).rowCount},
  addCapsule:p=>add('class_capsules','id,owner,name,title,content,unlock_at,date',[p.id,p.owner,p.name,p.title,p.content,p.unlockAt,p.date],p.owner,200),
  addDrawing:p=>add('class_drawings','id,owner,name,title,strokes,date',[p.id,p.owner,p.name,p.title,JSON.stringify(p.strokes),p.date],p.owner,100),
  drawing:async id=>(await rows('SELECT strokes FROM class_drawings WHERE id=$1',[id]))[0],
  async removeSocial(type,id,owner){const table={capsules:'class_capsules',drawings:'class_drawings',challenges:'class_challenges',achievements:'class_achievements'}[type];if(!table)return false;const clause=owner===undefined?'':' AND owner=$2';return !!(await query(`DELETE FROM ${table} WHERE id=$1${clause}`,owner===undefined?[id]:[id,owner])).rowCount},
  async addAchievement(p){return !!(await query('INSERT INTO class_achievements(id,title,description,icon,event_day,date) SELECT $1,$2,$3,$4,$5,$6 WHERE (SELECT COUNT(*) FROM class_achievements)<100',[p.id,p.title,p.description,p.icon,p.eventDay,p.date])).rowCount},
  challengeEntries:()=>rows('SELECT id,name,date FROM class_challenges ORDER BY date DESC')
 };
}
