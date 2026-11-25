import {randomUUID} from 'node:crypto';

const initialGroups = [
  ...['王莹霖','金荣泽','于金宇','曾德炀','黄诗晴','余子璇','施克冉','白炳相'].map(name=>[name]),
  ['王大亮','刘建豪'],['陈宇','倪协志'],['吴云梵','温庆川'],['王翊臣','林涵'],
  ['卢成德','黄子骞'],['谢雅格','刘子涵'],['陈祖哲','苏立校'],['王建平','庄紫莹'],
  ['彭璇','杨含医'],['陈瑞洋','林佳诚'],['叶其涛','施克铖'],['余晨惜','郑梓琳'],
  ['吴志浚','徐洪博'],['王凯','王峥'],['曾文众','冯于恒'],['毛瑞轩','方如涵'],['王迈','林浩']
];

const key = 'class_duty_v1';
const validPosition = value => Array.isArray(value) && value.length === 2 && value.every(Number.isInteger) &&
  Boolean(initialGroups[value[0]]?.[value[1]]);
const publicRequest = ({owner,...request}) => request;
const unchanged = (groups, sides) => sides.every(({position,members}) =>
  groups[position[0]].every((name,index)=>name===members[index]));
const descriptor = (groups,position) => {
  const members = [...groups[position[0]]];
  return {position,members,name:members[position[1]]};
};
const fail = (status,error) => ({status,data:{error}});
const ok = (data,status=200) => ({status,data});

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
      const {from,to,reason}=await readJson(req);
      if(!validPosition(from?.position) || !validPosition(to?.position) ||
         from.position[0]===to.position[0] || typeof reason!=='string' || reason.trim().length<2 || reason.trim().length>200 ||
         typeof from.name!=='string' || typeof to.name!=='string'){
        result=fail(400,'请选择两个不同组的同学，并填写 2–200 字申请理由');
      }else{
        result=await change(db,({groups,requests})=>{
          const source=descriptor(groups,from.position), target=descriptor(groups,to.position);
          if(from.name!==source.name || to.name!==target.name) return fail(409,'值日表已更新，请刷新后重新选择');
          const pending=requests.filter(item=>item.status==='pending');
          if(pending.length>=100 || pending.filter(item=>item.owner===owner).length>=4) return fail(429,'待审批申请过多，请等处理后再提交');
          if(pending.some(item=>[item.from.name,item.to.name].includes(source.name) &&
            [item.from.name,item.to.name].includes(target.name))) return fail(409,'这两位同学之间已有待审批的申请');
          const item={id:randomUUID(),owner,from:source,to:target,reason:reason.trim(),status:'pending',date:new Date().toISOString()};
          requests.unshift(item);
          return ok(publicRequest(item),201);
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
            if(!unchanged(state.groups,[item.from,item.to])) return fail(409,'相关值日组已调整，不能按原申请交换。可以驳回并请同学重新申请');
            const [a,b]=item.from.position, [c,d]=item.to.position;
            [state.groups[a][b],state.groups[c][d]]=[state.groups[c][d],state.groups[a][b]];
          }
          item.status=status;
          item.note=note.trim();
          item.reviewedAt=new Date().toISOString();
          const history=state.requests.filter(request=>request.status!=='pending').sort((a,b)=>b.reviewedAt.localeCompare(a.reviewedAt)).slice(0,200);
          state.requests=state.requests.filter(request=>request.status==='pending').concat(history);
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
