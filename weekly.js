import {randomBytes, randomUUID} from 'node:crypto';

const oneDay = 86400000;
const shanghai = 8 * 3600000;
const questions = [
  '用一句话给这周取个标题，你会叫什么？',
  '这周有哪件小事，想留在班级手账里？',
  '班里的哪一刻，让你笑到现在？',
  '如果给本周配一首歌，你会选哪首？',
  '这周有没有一个人，想在这里说声谢谢？',
  '用一个表情或一句话，形容我们班这周的气氛。',
  '如果下周能安排一次课间活动，你想玩什么？',
  '这周发现了什么，值得跟全班分享？'
];
const dateKey = time => new Date(time).toISOString().slice(0, 10);
export function weeklyClock(now = Date.now()) {
  const local = new Date(now + shanghai);
  const midnight = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
  const monday = midnight - ((local.getUTCDay() + 6) % 7) * oneDay;
  return {
    now:new Date(now).toISOString(),
    day:dateKey(midnight),
    dayStart:new Date(midnight - shanghai).toISOString(),
    week:dateKey(monday),
    endsAt:new Date(monday + 7 * oneDay - shanghai).toISOString()
  };
}

function defaultQuestion(week) {
  const elapsed = Math.floor((Date.parse(week) - Date.UTC(2026, 0, 5)) / (7 * oneDay));
  const index = ((elapsed % questions.length) + questions.length) % questions.length;
  return questions[index];
}

function topicFor(week, row) {
  return {week,question:row?.question || defaultQuestion(week),
    goal:Number(row?.goal || 12),closed:Boolean(row?.closed),version:row?.version || ''};
}
function publicTopic(week, row) {
  const {version,...topic} = topicFor(week,row);
  return topic;
}

const pageFrom = url => Math.min(1000, Math.max(0, Number.parseInt(url.searchParams.get('page'), 10) || 0));
const permittedWeek = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value)) && dateKey(Date.parse(value)) === value &&
  new Date(value).getUTCDay() === 1;
const text = (value, min, max) => typeof value === 'string' && value.trim().length >= min &&
  value.trim().length <= max && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value);

export function weeklyRoutes(db, readJson, now = Date.now) {
  return async (req, res, url, owner, send) => {
    if (url.pathname !== '/api/weekly' && url.pathname !== '/api/weekly/archive') return false;
    const clock = weeklyClock(now());
    const page = pageFrom(url);
    const state = async () => {
      const [row, entries, pulse] = await Promise.all([
        db.weeklyTopic(clock.week),
        db.weeklyEntries(clock.week, owner, page),
        db.clubPulse(clock.day, clock.dayStart, clock.now)
      ]);
      return {topic:publicTopic(clock.week,row),endsAt:clock.endsAt,...entries,
        pulse:{notes:pulse.notes,photos:pulse.photos,chicks:pulse.chicks,nextEvent:pulse.nextEvent}};
    };
    if (url.pathname === '/api/weekly/archive' && req.method === 'GET') {
      const week = url.searchParams.get('week');
      if (week === null) {
        const archive = await db.weeklyArchive(clock.week);
        send(200,{weeks:archive.map(item => ({week:item.week,
          question:item.question || defaultQuestion(item.week),total:Number(item.total)}))});
        return true;
      }
      if (!permittedWeek(week) || week >= clock.week) {
        send(400,{error:'请选择已经结束的一周'});
        return true;
      }
      const [row, entries] = await Promise.all([db.weeklyTopic(week),db.weeklyEntries(week,owner,page)]);
      send(200,{topic:publicTopic(week,row),...entries});
      return true;
    }
    if (url.pathname === '/api/weekly' && req.method === 'GET') {
      send(200,await state());
      return true;
    }
    if (url.pathname === '/api/weekly' && ['PUT','DELETE'].includes(req.method)) {
      const body = await readJson(req);
      if (req.method === 'DELETE' && permittedWeek(body.week) && body.week <= clock.week) {
        await db.weeklyWithdraw(body.week,owner);
        send(200,body.week === clock.week ? await state() : {ok:true});
        return true;
      }
      if (body.week !== clock.week) {
        send(409,{error:'新的一周已开始，请刷新话题后再继续'});
        return true;
      }
      if (!text(body.nickname,1,16) || !text(body.body,2,180)) {
        send(400,{error:'请填写 1–16 字昵称和 2–180 字回答'});
        return true;
      }
      const saved = await db.writeWeeklyEntry({id:randomBytes(16).toString('hex'),week:clock.week,
        owner,nickname:body.nickname.trim(),body:body.body.trim(),date:clock.now,version:randomUUID()});
      const result = await state();
      if (!saved && result.topic.closed) {
        send(409,{error:'本周投稿已关闭'});
      } else {
        send(200,result);
      }
      return true;
    }
    send(405,{error:'不支持的请求方式'});
    return true;
  };
}

export function weeklyAdminRoutes(db, readJson, now = Date.now) {
  return async (req, res, url, send, audit) => {
    const path = url.pathname;
    if (path !== '/api/admin/weekly' && !path.startsWith('/api/admin/weekly/')) return false;
    const clock = weeklyClock(now());
    if (path === '/api/admin/weekly' && req.method === 'GET') {
      const status = url.searchParams.get('status') || 'pending';
      if (!['pending','published','hidden'].includes(status)) {
        send(400,{error:'请选择有效的审核状态'});
        return true;
      }
      const [row, queue, pulse] = await Promise.all([
        db.weeklyTopic(clock.week),
        db.weeklyQueue(status,pageFrom(url)),
        db.clubPulse(clock.day,clock.dayStart,clock.now)
      ]);
      send(200,{topic:topicFor(clock.week,row),endsAt:clock.endsAt,pulse,...queue});
      return true;
    }
    if (path === '/api/admin/weekly/topic' && req.method === 'PUT') {
      const body = await readJson(req);
      if (body.week !== clock.week || typeof body.version !== 'string' || body.version.length > 40) {
        send(409,{error:'话题刚更新，请刷新工作台'});
        return true;
      }
      if (!text(body.question,4,100) || !Number.isInteger(body.goal) ||
        body.goal<3 || body.goal>100 || typeof body.closed !== 'boolean') {
        send(400,{error:'话题需要 4–100 字，目标人数为 3–100，投稿状态必须有效'});
        return true;
      }
      const saved = {week:clock.week,question:body.question.trim(),goal:body.goal,
        closed:body.closed ? 1 : 0,version:randomUUID()};
      if (!await db.updateWeeklyTopic(saved,body.version)) {
        send(409,{error:'另一位管理员刚更新了话题，请刷新再编辑'});
        return true;
      }
      await audit('更新每周话题',clock.week);
      send(200,{topic:topicFor(clock.week,saved)});
      return true;
    }
    const review = /^\/api\/admin\/weekly\/entry\/([a-f0-9]{32})$/.exec(path);
    if (review && req.method === 'PUT') {
      const body = await readJson(req);
      if (!['published','hidden'].includes(body.status) ||
        typeof body.version !== 'string' || body.version.length !== 36) {
        send(400,{error:'审核状态或记录版本无效'});
        return true;
      }
      if (!await db.weeklyReview(review[1],body.status,body.version,randomUUID(),clock.now)) {
        send(409,{error:'回答刚被修改或撤回，请刷新审核列表'});
        return true;
      }
      await audit(body.status==='published'?'公开手账回答':'隐藏手账回答',review[1]);
      send(200,{ok:true});
      return true;
    }
    send(405,{error:'不支持的请求方式'});
    return true;
  };
}
