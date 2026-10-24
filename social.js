import {randomBytes} from 'node:crypto';
import {questions} from './social-database.js';
const nameOk=n=>typeof n==='string'&&n.trim()&&n.length<=16;
const titleOk=n=>typeof n==='string'&&n.trim()&&n.length<=60;
export function validateStrokes(strokes){
 if(!Array.isArray(strokes)||!strokes.length||strokes.length>150)return false;let total=0;
 for(const stroke of strokes){if(!stroke||!/^#[0-9a-f]{6}$/i.test(stroke.color)||!Number.isFinite(stroke.width)||stroke.width<1||stroke.width>20||!Array.isArray(stroke.points)||stroke.points.length<1||stroke.points.length>400)return false;total+=stroke.points.length;if(total>6000)return false;for(const p of stroke.points)if(!Array.isArray(p)||p.length!==2||p.some(v=>!Number.isFinite(v)||v<0||v>1))return false}return true;
}
export function socialRoutes(db,readJson){return async(req,res,url,owner,send)=>{
 const now=new Date().toISOString();
 if(req.method==='GET'&&url.pathname==='/api/extended'){send(200,await db.extended(owner,now));return true}
 const base={id:randomBytes(16).toString('hex'),owner,date:now};
 if(req.method==='PUT'&&url.pathname==='/api/challenge'){
  const body=await readJson(req);if(!nameOk(body.name)||!Array.isArray(body.answers)||body.answers.length!==questions.length||body.answers.some((v,i)=>!Number.isInteger(v)||v<0||v>=questions[i].options.length)){send(400,{error:'请填写昵称并完成全部五道题'});return true}
  if(!await db.submitChallenge({...base,name:body.name.trim(),answers:body.answers})){send(409,{error:'挑战已达到 500 人上限'});return true}send(200,await db.extended(owner,now));return true;
 }
 if(req.method==='POST'&&url.pathname==='/api/capsules'){
  const b=await readJson(req);const time=typeof b.unlockAt==='string'?Date.parse(b.unlockAt):NaN;
  if(!nameOk(b.name)||!titleOk(b.title)||typeof b.content!=='string'||!b.content.trim()||b.content.length>1000||!Number.isFinite(time)||time<Date.now()+60000||time>Date.now()+10*366*86400000){send(400,{error:'昵称限 16 字、标题限 60 字、内容限 1000 字；开启时间须在 1 分钟后至 10 年内'});return true}
  if(!await db.addCapsule({...base,name:b.name.trim(),title:b.title.trim(),content:b.content.trim(),unlockAt:new Date(time).toISOString()})){send(409,{error:'最多封存 200 个胶囊，每个浏览器最多 5 个，请先整理旧胶囊'});return true}send(201,await db.extended(owner,now));return true;
 }
 if(req.method==='POST'&&url.pathname==='/api/drawings'){
  const b=await readJson(req);if(!nameOk(b.name)||!titleOk(b.title)||!validateStrokes(b.strokes)){send(400,{error:'请填写昵称和标题，并画一幅画（最多 150 笔、6000 个点）'});return true}
  if(!await db.addDrawing({...base,name:b.name.trim(),title:b.title.trim(),strokes:b.strokes})){send(409,{error:'涂鸦墙最多 100 幅，每个浏览器最多 5 幅，请先删除部分自己的作品'});return true}send(201,await db.extended(owner,now));return true;
 }
 const drawing=/^\/api\/drawings\/([a-f0-9]{32})$/.exec(url.pathname);
 if(drawing&&req.method==='GET'){const row=await db.drawing(drawing[1]);send(row?200:404,row?{strokes:JSON.parse(row.strokes)}:{error:'作品已被删除'});return true}
 const removal=/^\/api\/(capsules|drawings)\/([a-f0-9]{32})$/.exec(url.pathname);
 if(removal&&req.method==='DELETE'){if(!await db.removeSocial(removal[1],removal[2],owner)){send(403,{error:'只能删除当前浏览器发布的内容'});return true}send(200,await db.extended(owner,now));return true}
 return false;
};}
