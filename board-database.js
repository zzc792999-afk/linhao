export const boardSchema=[
 'CREATE TABLE IF NOT EXISTS class_board(id TEXT PRIMARY KEY,kind TEXT NOT NULL,title TEXT NOT NULL,detail TEXT NOT NULL,subject TEXT NOT NULL,location TEXT NOT NULL,url TEXT NOT NULL,start_at TEXT NOT NULL,due_at TEXT NOT NULL,pinned INTEGER NOT NULL DEFAULT 0,archived INTEGER NOT NULL DEFAULT 0,deleted INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL,updated_at TEXT NOT NULL)',
 'CREATE INDEX IF NOT EXISTS class_board_visible ON class_board(deleted,archived,kind)',
 'CREATE TABLE IF NOT EXISTS class_task_checks(item TEXT NOT NULL,owner TEXT NOT NULL,done INTEGER NOT NULL,PRIMARY KEY(item,owner))'
];
export function boardStore(query){
 const rows=async(sql,args=[])=>(await query(sql,args)).rows;
 return {
  async board(owner,all=false){return (await rows('SELECT b.id,b.kind,b.title,b.detail,b.subject,b.location,b.url,b.start_at,b.due_at,b.pinned,b.archived,b.created_at,b.updated_at,COALESCE(c.done,0) AS done FROM class_board b LEFT JOIN class_task_checks c ON c.item=b.id AND c.owner=$1 WHERE b.deleted=0 AND (b.archived=0 OR $2=1) ORDER BY b.pinned DESC,b.created_at DESC,b.id DESC',[owner,all?1:0])).map(b=>({...b,pinned:!!b.pinned,archived:!!b.archived,done:!!b.done}))},
  boardItem:async id=>(await rows('SELECT * FROM class_board WHERE id=$1 AND deleted=0',[id]))[0],
  async createBoard(b){return !!(await query('INSERT INTO class_board(id,kind,title,detail,subject,location,url,start_at,due_at,pinned,created_at,updated_at) SELECT $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11 WHERE (SELECT COUNT(*) FROM class_board WHERE deleted=0)<300 ON CONFLICT(id) DO NOTHING',[b.id,b.kind,b.title,b.detail,b.subject,b.location,b.url,b.start_at,b.due_at,b.pinned?1:0,b.updated_at])).rowCount},
  async updateBoard(b,version){return !!(await query('UPDATE class_board SET kind=$1,title=$2,detail=$3,subject=$4,location=$5,url=$6,start_at=$7,due_at=$8,pinned=$9,updated_at=$10 WHERE id=$11 AND updated_at=$12 AND deleted=0',[b.kind,b.title,b.detail,b.subject,b.location,b.url,b.start_at,b.due_at,b.pinned?1:0,b.updated_at,b.id,version])).rowCount},
  async archiveBoard(id,archived,version,now){return !!(await query('UPDATE class_board SET archived=$1,updated_at=$2 WHERE id=$3 AND updated_at=$4 AND deleted=0',[archived?1:0,now,id,version])).rowCount},
  deleteBoard:id=>query('UPDATE class_board SET deleted=1,archived=1 WHERE id=$1',[id]),
  async taskCheck(id,owner,done){return !!(await query("INSERT INTO class_task_checks(item,owner,done) SELECT id,$1,$2 FROM class_board WHERE id=$3 AND kind='task' AND archived=0 AND deleted=0 ON CONFLICT(item,owner) DO UPDATE SET done=excluded.done",[owner,done?1:0,id])).rowCount}
 };
}
