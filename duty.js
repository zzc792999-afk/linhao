import {randomUUID} from 'node:crypto';

const initialGroups = [
  ...['王莹霖','金荣泽','于金宇','曾德炀','黄诗晴','余子璇','施克冉','白炳相'].map(name=>[name]),
  ['王大亮','刘建豪'],['陈宇','倪协志'],['吴云梵','温庆川'],['王翊臣','林涵'],
  ['卢成德','黄子骞'],['谢雅格','刘子涵'],['陈祖哲','苏立校'],['王建平','庄紫莹'],
  ['彭璇','杨含医'],['陈瑞洋','林佳诚'],['叶其涛','施克铖'],['余晨惜','郑梓琳'],
  ['吴志浚','徐洪博'],['王凯','王峥'],['曾文众','冯于恒'],['毛瑞轩','方如涵'],['王迈','林浩']
];

const key = 'class_duty_v1';
const validPosition = (groups,value) => Array.isArray(value) && value.length === 2 && value.every(Number.isInteger) &&
  Boolean(groups[value[0]]?.[value[1]]);
const publicRequest = ({owner,...request}) => request;
const unchanged = (groups, sides) => sides.every(({position,members})=>{
  const current=groups[position[0]];
  return current?.length===members.length && current.every((name,index)=>name===members[index]);
});
const descriptor = (groups,position) => {
  const members = [...groups[position[0]]];
  const number=groups.slice(0,position[0]+1).filter(group=>group.length===members.length).length;
  const label=(members.length===1?'单人':'双人')+'第 '+number+' 组';
  return {position,members,label,name:members[position[1]]};
};
const fail = (status,error) => ({status,data:{error}});
const ok = (data,status=200) => ({status,data});

function trimHistory(state){
  const history=state.requests.filter(request=>request.status!=='pending')
    .sort((a,b)=>b.reviewedAt.localeCompare(a.reviewedAt)).slice(0,200);
  state.requests=state.requests.filter(request=>request.status==='pending').concat(history);
}

async function readState(db) {
  const raw = await db.setting(key,null);
  const state = raw===null ? {groups:initialGroups.map(group=>[...group]),requests:[]} : JSON.parse(raw);
  return {raw,state};
}

async function change(db, mutate) {
  for(let attempt=0;attempt<8;attempt++){
    const {raw,state} = await readState(db);
    const result = mutate(state);
    if(result.status>=400) return result;
    if(await db.compareSetting(key,raw,JSON.stringify(state))) return result;
  }
  return fail(409,'刚有其他人在操作，请刷新后再试');
}

export function dutyRoutes(db, readJson, admin=false) {
  const base = admin ? '/api/admin/duty' : '/api/duty';
  return async (req,res,url,owner,send)=>{
    const path=url.pathname;
    if(path!==base && !path.startsWith(base+'/')) return false;
    let result;
    if(path===base && req.method==='GET'){
      const {state:{groups,requests}}=await readState(db);
      const visible=admin ? requests : requests.filter(request=>request.owner===owner);
      result=ok({groups,requests:visible.map(publicRequest)});
    }else if(!admin && path===base+'/requests' && req.method==='POST'){
      const {kind='swap',from,to,reason}=await readJson(req);
      if(!['swap','split','merge'].includes(kind) || typeof reason!=='string' || reason.trim().length<2 || reason.trim().length>200 ||
         typeof from?.name!=='string' || (kind!=='split' && typeof to?.name!=='string')){
        result=fail(400,'请选择申请类型和值日位置，并填写 2–200 字申请理由');
      }else{
        result=await change(db,({groups,requests})=>{
          if(!validPosition(groups,from.position) || (kind!=='split' && !validPosition(groups,to.position))){
            return fail(409,'值日表已更新，请刷新后重新选择');
          }
          const source=descriptor(groups,from.position);
          const target=kind!=='split'?descriptor(groups,to.position):null;
          if(source.name!==from.name || (target && target.name!==to.name)) return fail(409,'值日表已更新，请刷新后重新选择');
          if(target && source.position[0]===target.position[0]) return fail(400,'请选择两个不同值日组的同学');
          if(kind==='merge' && (source.members.length!==1 || target.members.length!==1)){
            return fail(409,'合组需要两位当前单人值日的同学，请刷新后重新选择');
          }
          if(!target && (source.members.length!==2 || !Array.isArray(from.members) ||
             !unchanged(groups,[{position:from.position,members:from.members}]))){
            return fail(409,'请选择成员未变化的双人组');
          }
          const pending=requests.filter(item=>item.status==='pending');
          if(pending.length>=100 || pending.filter(item=>item.owner===owner).length>=4) return fail(429,'待审批申请过多，请等处理后再提交');
          const duplicate=target
            ? pending.some(item=>(item.kind||'swap')===kind && item.to && [item.from.name,item.to.name].includes(source.name) && [item.from.name,item.to.name].includes(target.name))
            : pending.some(item=>item.kind==='split' && item.from.position[0]===source.position[0] && unchanged(groups,[item.from]));
          if(duplicate) return fail(409,'已有相同的待审批申请');
          const item={id:randomUUID(),owner,kind,from:source,to:target,reason:reason.trim(),status:'pending',date:new Date().toISOString()};
          requests.unshift(item);
          return ok(publicRequest(item),201);
        });
      }
    }else if(admin && path===base+'/people' && req.method==='POST'){
      const {name,partner=null}=await readJson(req);
      const normalized=typeof name==='string'?name.trim():'';
      if(!normalized || normalized.length>30 || /[\u0000-\u001f\u007f]/.test(normalized)){
        result=fail(400,'请输入 1–30 字的有效姓名');
      }else{
        result=await change(db,({groups})=>{
          if(groups.some(group=>group.includes(normalized))) return fail(409,'这个姓名已在值日表里');
          if(partner===null){
            groups.push([normalized]);
          }else{
            if(!validPosition(groups,partner?.position)) return fail(409,'搭档的位置已变动，请刷新后重新选择');
            const group=groups[partner.position[0]];
            if(group.length!==1 || group[0]!==partner.name) return fail(409,'该同学已不在原单人组，请刷新后重新选择');
            group.push(normalized);
          }
          return ok({groups},201);
        });
      }
    }else if(admin && path===base+'/people' && req.method==='DELETE'){
      const {position,name,members}=await readJson(req);
      if(typeof name!=='string' || !Array.isArray(members)){
        result=fail(400,'请选择要移出的同学');
      }else{
        result=await change(db,state=>{
          if(!validPosition(state.groups,position) || state.groups[position[0]][position[1]]!==name ||
             !unchanged(state.groups,[{position,members}])){
            return fail(409,'值日组已变动，请刷新后重新选择');
          }
          const [group,slot]=position;
          // Keep group indices stable for earlier requests, including emptied single-person groups.
          state.groups[group].splice(slot,1);
          const affected=state.requests.filter(item=>item.status==='pending' &&
            (item.from.position[0]===group || item.to?.position[0]===group));
          const now=new Date().toISOString();
          for(const item of affected){
            item.status='rejected';
            item.note='原值日组有同学移出，请按最新值日表重新申请。';
            item.reviewedAt=now;
          }
          if(affected.length) trimHistory(state);
          return ok({removed:name,affected:affected.length});
        });
      }
    }else if(admin && req.method==='PUT' && /^\/api\/admin\/duty\/[a-f0-9-]{36}$/.test(path)){
      const id=path.slice(base.length+1);
      const {status,note}=await readJson(req);
      if(!['approved','rejected'].includes(status) || typeof note!=='string' || note.trim().length>200){
        result=fail(400,'请选择有效的审批结果，备注最多 200 字');
      }else{
        result=await change(db,state=>{
          const item=state.requests.find(request=>request.id===id);
          if(!item || item.status!=='pending') return fail(409,'申请已处理，请刷新');
          if(status==='approved'){
            const sides=item.kind==='split'?[item.from]:[item.from,item.to];
            if(!unchanged(state.groups,sides)) return fail(409,'相关值日组已调整，可以驳回并请同学重新申请');
            const [a,b]=item.from.position;
            if(item.kind==='split'){
              const [first,second]=state.groups[a];
              state.groups[a]=[first];
              state.groups.push([second]);
            }else if(item.kind==='merge'){
              const c=item.to.position[0];
              state.groups[a].push(state.groups[c][0]);
              state.groups[c]=[];
            }else{
              const [c,d]=item.to.position;
              [state.groups[a][b],state.groups[c][d]]=[state.groups[c][d],state.groups[a][b]];
            }
          }
          item.status=status;
          item.note=note.trim();
          item.reviewedAt=new Date().toISOString();
          trimHistory(state);
          return ok(publicRequest(item));
        });
      }
    }else{
      result=fail(405,'不支持的请求方式');
    }
    send(result.status,result.data);
    return true;
  };
}
