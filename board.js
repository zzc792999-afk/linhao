const fail=message=>{throw Object.assign(Error(message),{status:400})};
export function boardInput(body){
 const value={};for(const [key,max] of Object.entries({title:80,detail:2000,subject:30,location:80,url:2048})){if(typeof body[key]!=='string'||body[key].length>max)fail('请检查标题、正文、科目、地点和资料链接的长度');value[key]=body[key].trim()}
 if(!value.title||!['notice','task','event','resource'].includes(body.kind)||typeof body.pinned!=='boolean')fail('请选择有效类型并填写标题');value.kind=body.kind;value.pinned=body.pinned;
 if(value.url){let url;try{url=new URL(value.url)}catch{fail('资料链接需要完整的 http:// 或 https:// 地址')}if(!['http:','https:'].includes(url.protocol)||url.username||url.password)fail('只支持不含账号密码的 HTTP 或 HTTPS 链接');value.url=url.href}
 if(value.kind==='resource'&&!value.url)fail('学习资料需要填写链接');
 const parse=key=>{const raw=body[key];if(raw==='')return '';if(typeof raw!=='string'||raw.length>35||!/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d{1,3})?)?(?:Z|[+-]\d\d:\d\d)$/.test(raw)||!Number.isFinite(Date.parse(raw))||new Date(raw.slice(0,10)+'T00:00:00Z').toISOString().slice(0,10)!==raw.slice(0,10))fail('请填写有效的北京时间');const year=Number(raw.slice(0,4));if(year<2020||year>2100)fail('日期需在 2020–2100 年之间');return new Date(raw).toISOString()};
 value.start_at=parse('startAt');value.due_at=parse('dueAt');
 if(value.kind==='task'&&!value.due_at)fail('作业需要填写截止时间');
 if(value.kind==='event'){if(!value.start_at||!value.due_at||value.due_at<=value.start_at)fail('活动需要填写开始和结束时间，结束应晚于开始')}
 else value.start_at='';if(!['task','event'].includes(value.kind))value.due_at='';return value;
}
export function boardRoutes(db,readJson){return async(req,res,url,owner,send)=>{
 if(url.pathname==='/api/board'&&req.method==='GET'){send(200,{items:await db.board(owner),now:new Date().toISOString()});return true}
 const check=/^\/api\/board\/([a-f0-9]{32})\/check$/.exec(url.pathname);
 if(check&&req.method==='PUT'){const b=await readJson(req);if(typeof b.done!=='boolean'){send(400,{error:'进度无效'});return true}if(!await db.taskCheck(check[1],owner,b.done)){send(409,{error:'作业已归档或不存在，请刷新事务台'});return true}send(200,{id:check[1],done:b.done});return true}
 return false;
}}
