const defaultProfile={name:'路过的同学',mascot:'panda'};

export const mascots=[
  {
    id:'pig',baseName:'猪',name:'猪',emoji:'🐷',
    forms:[
      {name:'小猪仔',emoji:'🐷',motto:'快乐加倍，烦恼减半。'},
      {name:'飞天猪',emoji:'🐗',motto:'插上梦想翅膀，快乐起飞。'},
      {name:'黄金脆皮猪',emoji:'🥓',motto:'全班顶流金猪，香气四溢。'},
      {name:'赛博机械猪',emoji:'🤖',motto:'赛博飞天神猪，代码零Bug！'}
    ]
  },
  {
    id:'turtle',baseName:'甲鱼',name:'甲鱼',emoji:'🐢',
    forms:[
      {name:'小甲鱼',emoji:'🐢',motto:'不慌不忙，也在向前。'},
      {name:'旋风忍者甲鱼',emoji:'🥷',motto:'看似慢吞吞，实则身手不凡。'},
      {name:'万年龙龟',emoji:'🐉',motto:'稳如泰山，见证岁月沉淀。'},
      {name:'宇宙玄武',emoji:'✨',motto:'星空守护神，稳坐前茅！'}
    ]
  },
  {
    id:'chicken',baseName:'鸡',name:'鸡',emoji:'🐔',
    forms:[
      {name:'小雏鸡',emoji:'🐥',motto:'元气上线，破壳就发光。'},
      {name:'战斗大公鸡',emoji:'🐔',motto:'雄鸡一唱，早起敲代码。'},
      {name:'凤凰锦雉',emoji:'🦚',motto:'涅槃进阶，一身华羽！'},
      {name:'太阳神鸟',emoji:'🔥',motto:'光芒万丈，全场焦点！'}
    ]
  },
  {
    id:'cat',baseName:'野猫',name:'野猫',emoji:'🐈',
    forms:[
      {name:'软萌奶猫',emoji:'🐱',motto:'自由探索，好奇不打烊。'},
      {name:'街头霸王猫',emoji:'🐈',motto:'巡视校园，霸气外露。'},
      {name:'招财玄猫',emoji:'🐈‍⬛',motto:'灵性通玄，代码全绿。'},
      {name:'喵星大魔王',emoji:'👑',motto:'全宇宙统治者，猫生赢家！'}
    ]
  },
  {
    id:'owl',baseName:'猫头鹰',name:'猫头鹰',emoji:'🦉',
    forms:[
      {name:'大眼雏鹰',emoji:'🦉',motto:'灵感在线，陪你找到答案。'},
      {name:'夜读学者鹰',emoji:'📚',motto:'熬夜敲码，灵感迸发。'},
      {name:'魔法智者鹰',emoji:'🧙',motto:'通晓百家，玄学Debug大师。'},
      {name:'时空之眼',emoji:'🔮',motto:'双眸洞察万物，指引前路！'}
    ]
  },
  {
    id:'dog',baseName:'狗',name:'狗',emoji:'🐶',
    forms:[
      {name:'摇尾奶狗',emoji:'🐶',motto:'一路相伴，快乐有同伙。'},
      {name:'元气柯基',emoji:'🐕',motto:'短腿飞奔，热情不减。'},
      {name:'护班战犬',emoji:'🦮',motto:'风雨无阻，守护全班。'},
      {name:'神犬啸天',emoji:'⚡',motto:'神雷护体，同窗义气拉满！'}
    ]
  },
  {
    id:'panda',baseName:'熊猫',name:'熊猫',emoji:'🐼',
    forms:[
      {name:'滚滚糯米糍',emoji:'🐼',motto:'今天也要，抱抱自己。'},
      {name:'功夫熊猫',emoji:'🥋',motto:'行云流水，深藏不露。'},
      {name:'翠竹仙人',emoji:'🎋',motto:'悠然自得，气定神闲。'},
      {name:'祥瑞国宝尊',emoji:'🎖️',motto:'万千宠爱，全班永恒团宠！'}
    ]
  },
  {
    id:'rednose',baseName:'小丑先生',name:'小丑先生',emoji:'👦',image:'/assets/rednose-classmate.svg',
    forms:[
      {name:'小丑先生',emoji:'👦',image:'/assets/rednose-classmate.svg',motto:'鼻尖一点红，同窗一起笑。'},
      {name:'戏法大师小丑先生',emoji:'🎩',image:'/assets/rednose-classmate.svg',motto:'礼帽变白鸽，欢笑洒满堂。'},
      {name:'狂欢魔术师小丑先生',emoji:'🎪',image:'/assets/rednose-classmate.svg',motto:'舞台中央，带来奇迹与浪漫。'},
      {name:'欢乐守护神小丑先生',emoji:'✨',image:'/assets/rednose-classmate.svg',motto:'红鼻闪耀，愿青春永不谢幕！'}
    ]
  },
  {
    id:'hippo',baseName:'河马',name:'河马',emoji:'🦛',
    forms:[
      {name:'小河马',emoji:'🦛',motto:'小泥巴团，水里冒泡泡。'},
      {name:'大嘴河马',emoji:'🫧',motto:'深渊巨口，吞掉所有烦恼。'},
      {name:'铁甲河马',emoji:'🛡️',motto:'皮糙肉厚，防御力破表。'},
      {name:'碧波巨兽河马',emoji:'🌊',motto:'水下霸主，激起快乐浪花！'}
    ]
  },
  {
    id:'horse',baseName:'马',name:'马',emoji:'🐴',
    forms:[
      {name:'小马驹',emoji:'🐴',motto:'蹄声轻快，对世界充满好奇。'},
      {name:'疾风烈马',emoji:'🐎',motto:'追风逐日，纵横驰骋。'},
      {name:'独角天马',emoji:'🦄',motto:'圣洁双翼，踏云而行。'},
      {name:'赤兔龙驹',emoji:'⚡',motto:'千里神驹，奔向无限前程！'}
    ]
  },
  {
    id:'donkeycat',baseName:'驴猫',name:'驴猫',emoji:'🫏',
    forms:[
      {name:'驴猫宝宝',emoji:'🫏',motto:'驴耳配黑眼圈，呆萌又倔强。'},
      {name:'功夫驴猫',emoji:'🐼',motto:'倔驴脾气配猫猫拳，谁惹踢谁。'},
      {name:'祥瑞驴猫仙',emoji:'🎋',motto:'一边啃竹子一边拉磨，全班最勤奋。'},
      {name:'宇宙混元驴猫',emoji:'🌌',motto:'跨界奇迹，毅力与萌力巅峰！'}
    ]
  },
  {
    id:'wuba',baseName:'胡巴',name:'胡巴',emoji:'🌱',
    forms:[
      {name:'小萝卜',emoji:'🌱',motto:'刚破土而出的小青萝卜，嫩生生的。'},
      {name:'萝卜头',emoji:'🥕',motto:'长出手脚摇头晃脑，到处找水喝。'},
      {name:'萌妖胡巴',emoji:'👶',motto:'Wuba Wuba~ 吐水小妖王诞生！'},
      {name:'妖界至尊胡巴',emoji:'👑',motto:'神仙胡巴，法力无边佑全班好运！'}
    ]
  },
  {
    id:'triangle',baseName:'三角形',name:'三角形',emoji:'📐',
    forms:[
      {name:'小三角',emoji:'📐',motto:'锐角尖尖，三点成面最稳固。'},
      {name:'黄金正三角',emoji:'🔺',motto:'三边对称，棱角分明不服输。'},
      {name:'百慕大魔幻三角',emoji:'🛕',motto:'神秘力场，吸走所有bug与烦恼。'},
      {name:'宇宙三棱镜',emoji:'🌈',motto:'折射无限光谱，折射璀璨未来！'}
    ]
  }
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
      const pets=mascots.map(m=>{
        const feeds=Number(totals.find(t=>t.mascot===m.id)?.n||0);
        const formIdx=Math.min(m.forms.length-1,Math.floor(feeds/10));
        const currentForm=m.forms[formIdx];
        const nextForm=m.forms[formIdx+1]||null;
        return {
          id:m.id,
          baseName:m.baseName,
          name:currentForm.name,
          emoji:currentForm.emoji,
          image:currentForm.image||m.image,
          motto:currentForm.motto,
          feeds,
          formIndex:formIdx,
          level:1+Math.floor(feeds/10),
          progress:feeds%10,
          needed:10,
          fed:fed.some(f=>f.mascot===m.id),
          forms:m.forms,
          nextForm:nextForm?nextForm.name:null
        };
      });
      return {day,pets,my:{...me,stickerCount:fed.length,bestReaction:best[0]?Number(best[0].score):null},reactionLeaderboard,drawings:drawings.map(mapDrawing)};
    },
    async arcadeReaction(p){
      await query('INSERT INTO class_arcade_attempts(id,owner,rounds,score,day,date) SELECT $1,$2,$3,$4,$5,$6 WHERE (SELECT COUNT(*) FROM class_arcade_attempts WHERE owner=$2 AND day=$5)<30 ON CONFLICT(id) DO NOTHING',[p.id,p.owner,JSON.stringify(p.rounds),p.score,p.day,p.date]);
      const existing=(await rows('SELECT owner,rounds,score,revoked FROM class_arcade_attempts WHERE id=$1',[p.id]))[0];
      if(!existing)return 'limit';if(existing.owner!==p.owner||existing.rounds!==JSON.stringify(p.rounds))return 'conflict';
      if(existing.revoked)return 'revoked';
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
