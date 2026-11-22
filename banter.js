import {weeklyClock} from './weekly.js';

function scene(id, tag, title, line, replies) {
  const choices = replies.map(([key, text, reaction]) => ({id:key, text, reaction}));
  return {id, tag, title, line, choices};
}

// Keep existing scene and choice IDs stable so votes from a deployed deck retain their meaning.
const deck = [
  scene('unsaved', '机房现场', '代码跑通了，没保存',
    '报错突然全消失。下一秒，机房电脑弹出「即将重启」。', [
      ['mercy', '已老实，求电脑放过。', '电脑：看得出你急，给你倒计时 3 秒。'],
      ['save', '主包，先按 Ctrl+S！', '保存成功。从今往后 Ctrl+S 是我的护身符。'],
      ['screenshot', '我嘞个豆，先截图留证。', '相册多了一张图，项目少了一个未来。']
    ]),
  scene('free-points', '课堂现场', '老师说这题送分',
    '题目第一眼像送分题，第二眼像它来给我送行。', [
      ['return', '这分有七天无理由退货吗？', '分：谢谢，我还没发货。'],
      ['stable', '内核稳定，先把名字写好。', '姓名栏写完，本卷进度 1%。'],
      ['math', '会的全在草稿纸上。', '草稿纸：你的会，甚至还没到我这里。']
    ]),
  scene('nest', '鸡窝现场', '鸡窝今日主持人',
    '你刚想宣布下课，小鸡先站上讲台，翅膀一拍。', [
      ['grace', '这家伙还挺有班长气质。', '小鸡宣布休息两分钟，前提是每人交一颗玉米。'],
      ['reverse', '倒反天罡，今天轮到鸡点名？', '小鸡开始点名：喔、喔喔、喔喔喔。全员答到。'],
      ['mic', '把麦递给它，我想听原声。', '没有人声，只有讲台边的质感打鸣。']
    ]),
  scene('wifi', '机房现场', '网速突然学会了隐身',
    '作业上传停在 99%，旁边的网页一刷新秒开。', [
      ['net', '你这网速还挺会挑客户。', '提交按钮与校园网已解除好友关系。'],
      ['steady', '内核稳定，让它在 99% 冷静一下。', '它冷静了八分钟，我的鼠标先发烫。'],
      ['surprise', '我嘞个豆，这最后一格住谁啊？', '住着等同学交作业等到端水的大队长。']
    ]),
  scene('eraser', '同桌日常', '橡皮摔成了两半',
    '借来的橡皮落地，分裂成两个大小差不多的方块。', [
      ['clone', '我给它免费做了分身功能。', '同桌接过两半：那我还你双倍利息。'],
      ['undo', '现实世界能 Ctrl+Z 吗？', '你按了一下桌角，桌角并没有反应。'],
      ['sorry', '已老实，我给它俩各画一张身份证。', '频道新增成员：小橡和小皮。']
    ]),
  scene('group-chat', '班群现场', '班群一秒刷出 99+',
    '打开一看，全是「收到」，原消息已经翻不到了。', [
      ['echo', '收到大家的收到。', '下一条：收到你收到的收到。'],
      ['detective', '谁截个图，我来考古。', '翻到原消息：这条不用回复。'],
      ['summarize', '这聊天记录浓缩完还有一个词。', '收到。']
    ]),
  scene('lunch', '食堂现场', '取餐窗口开了分支',
    '排了十分钟，前面的同学举着饭盒去隔壁队了。', [
      ['fork', '这是谁从食堂主干上切了个分支？', '窗口贴了张纸：今日隔壁负责打饭。'],
      ['calm', '内核稳定，去哪条队都要排。', '你刚走，原来的阿姨喊：下一位。'],
      ['expert', '懂了，下次进门先看阿姨锅里。', '阿姨翻起锅铲：别侦查了，今天都有。']
    ]),
  scene('group-photo', '合照现场', '合照倒数卡在 2',
    '拍照的人说「三、二……」，足足停了五秒。', [
      ['smile', '我的微笑快进入待机模式。', '快门刚响，全班整齐放下了嘴角。'],
      ['build', '等一下，拍照在构建。', '构建完成：六个闭眼，八个动了。'],
      ['director', '镜头里面谁还没放松？', '所有人同时点头，照片从合照变成了开会。']
    ]),
  scene('printer', '打印现场', '打印机改演悬疑片',
    '响了四十秒没吐纸，你一走过去，它忽然安静了。', [
      ['contrary', '倒反天罡，机器还会假装忙？', '它只吐了张空白纸，工作痕迹十分完整。'],
      ['paper', '辛苦了，先喝两口 A4。', '新纸进去了，缺纸提示更有底气。'],
      ['timing', '打印全靠气氛，我先转过去。', '身后立刻狂吐五张，每张都是第一页。']
    ]),
  scene('track', '操场现场', '操场全班同频',
    '跑到拐弯才发现，前后四个人都在偷偷数还有几圈。', [
      ['human', '这是一台人工分布式计圈器。', '系统合并数据：我们对圈数的答案各不相同。'],
      ['breath', '主包电量低，但还可以走。', '弯道尽头终于出现比终点更亮的东西：水杯。'],
      ['loop', '谁把这操场写成 while(true) 了？', '哨声响起，小组成功跳出循环。']
    ]),
  scene('drawing', '游戏现场', '灵魂画手给出最后一笔',
    '屏幕上有四条腿和一根线，全班猜「路由器」猜了三次。', [
      ['emoji', '我嘞个豆，这不是凑企鹅吗？', '画手公布答案：雨伞。班里暂时没人说话。'],
      ['socket', '先确认路由器有几只脚。', '画手补上了雨滴，它现在是室外版路由器。'],
      ['style', '画得太抽象，我决定相信第一眼。', '第一眼的答案是插线板。你决定相信第二眼。']
    ]),
  scene('slides', '小组现场', '五个人，五种字号',
    '合并小组 PPT 后，一页像论文，下一页像招商海报。', [
      ['director', '这个从学术频道切到了购物频道。', '配上同款转场，组员决定把特色一路保留。'],
      ['font', '字体意见太多，不如现场开会。', '开会五分钟，最终决定统一用默认字体。'],
      ['reboot', '属实有点水灵灵地合上了。', '鼠标拉了一次全选，组内意见第一次统一。']
    ]),
  scene('panda-host', '吉祥物现场', '熊猫要应聘主持人',
    '它写好的主持词只有两句，第一句是「竹子带了吗」。', [
      ['reply', '带了，第二句是什么？', '「第二捆竹子带了吗？」'],
      ['pay', '先聊待遇，再聊主持词。', '谈成了。薪资按捆计，奖金也是。'],
      ['intro', '第一句挺灵，直接用作开场。', '台下齐声说没带。熊猫考虑了一下，宣布散场。']
    ]),
  scene('test-bell', '考场现场', '监考铃比我先答完',
    '你刚想到最后一题怎么做，熟悉的铃声已经响了。', [
      ['retry', '我申请和交卷键再商量一下。', '交卷键认为你想得很对，但它的工作已经完成。'],
      ['oops', '这就是大脑的延迟到账吧。', '答案晚上十点准时来了，还附带两种解法。'],
      ['found', '答出来了，在我脑子里。', '脑内判卷给自己满分，纸面判卷表示另议。']
    ])
];

const firstDay = Date.UTC(2026, 10, 22);
const dayLength = 86400000;

function dailyScene(day) {
  const elapsed = (Date.parse(day) - firstDay) / dayLength;
  return deck[(elapsed % deck.length + deck.length) % deck.length];
}

export function banterRoutes(db, readJson, now = Date.now) {
  return async (req, res, url, owner, send) => {
    if (url.pathname !== '/api/banter') return false;
    if (!['GET', 'PUT'].includes(req.method)) {
      send(405, {error:'不支持的请求方式'});
      return true;
    }

    const {day} = weeklyClock(now());
    const current = dailyScene(day);
    if (req.method === 'PUT') {
      const body = await readJson(req);
      if (body.day !== day || body.scene !== current.id) {
        send(409, {error:'今日场景已更新，请重新打开题目'});
        return true;
      }
      if (!current.choices.some(option => option.id === body.choice)) {
        send(400, {error:'请选择这道题里的一个接梗选项'});
        return true;
      }
      await db.writeBanterVote(day, owner, current.id, body.choice);
    }

    const votes = await db.banterVotes(day, current.id, owner);
    const choice = votes.find(row => Number(row.mine) === 1)?.choice ?? null;
    const counts = choice === null ? null : Object.fromEntries(current.choices.map(option => [
      option.id, Number(votes.find(row => row.choice === option.id)?.count ?? 0)
    ]));
    const total = counts ? Object.values(counts).reduce((sum, count) => sum + count, 0) : 0;
    send(200, {day, scene:current, choice, counts, total});
    return true;
  };
}
