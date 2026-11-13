'use strict';
(() => {
  const destinations = [
    ['🏠','班级首页','看看今天的新鲜事','#home','首页 今日 动态'],
    ['💬','留言墙','给全班留一句话','#messages','广场 留言 聊天'],
    ['📸','班级相册','上传和查看共享照片','#album','照片 图片 上传'],
    ['🎮','游戏中心','吉祥物、反应力和你画我猜','#arcade','游乐厅 游戏 投喂 画画'],
    ['🧪','抽象研究所','课间整活和班级梗','#playground','研究所 梗 投稿 投票'],
    ['🎯','解压靶场','选道具，轻松扔一局','#targets','靶子 鸡蛋 拖鞋 番茄'],
    ['👨‍🏫','匿名评教','查看和分享课程体验','#teachers','老师 评价 评分'],
    ['📮','意见箱','向班委提交建议','#suggestions','建议 反馈 bug 悄悄话'],
    ['🐾','吉祥物小院','看看二十一位班级伙伴','#mascots','动物 投喂 小丑先生 鸡'],
    ['🎬','班级影像','播放我们的班级视频','#class-film','视频 电影 回忆'],
    ['🧩','班级记忆','挑战、胶囊、涂鸦和成就','#social-area','时光胶囊 画板 挑战 成就'],
    ['📋','班务工具','公告、任务、活动和资料','#class-tools','班务 学习 资源 作业 公告']
  ];
  const normalize = value => value.toLowerCase().replace(/\s+/g,'');
  const openTarget = href => {
    const target = document.querySelector(href);
    if (!target) return;
    if (target.matches('details')) target.open = true;
    target.closest('details')?.setAttribute('open','');
  };
  const followHash = () => { if (location.hash) openTarget(location.hash); };
  addEventListener('hashchange', followHash);
  followHash();

  document.querySelectorAll('img').forEach((img,index) => {
    img.decoding = 'async';
    if (index > 1 && !img.hasAttribute('loading')) img.loading = 'lazy';
  });

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'site-finder-button';
  trigger.innerHTML = '<span class="finder-icon" aria-hidden="true">⌕</span><span>找功能</span><kbd>Ctrl K</kbd>';
  trigger.setAttribute('aria-label','搜索网站功能');
  document.getElementById('theme')?.before(trigger);

  const dialog = document.createElement('dialog');
  dialog.className = 'site-finder-dialog';
  dialog.setAttribute('aria-label','查找网站功能');
  dialog.innerHTML = '<div class="site-finder-head"><input type="search" autocomplete="off" placeholder="搜索：相册、留言、投票、靶场…" aria-label="输入功能名称"><button type="button" class="site-finder-close" aria-label="关闭">✕</button></div><div class="site-finder-tools"><span>输入关键词，马上到达</span><button type="button" class="site-random-button">🎲 随便逛逛</button></div><div class="site-finder-results"></div>';
  document.body.append(dialog);
  const input = dialog.querySelector('input');
  const results = dialog.querySelector('.site-finder-results');
  const close = () => dialog.close();
  const go = href => { openTarget(href); close(); location.hash = href; };
  const render = query => {
    const term = normalize(query);
    const found = destinations.filter(item => normalize(item.join(' ')).includes(term));
    results.replaceChildren();
    if (!found.length) {
      const empty = document.createElement('p'); empty.className='site-finder-empty'; empty.textContent='没有找到，试试“相册”“游戏”或“意见箱”'; results.append(empty); return;
    }
    found.forEach(([icon,label,description,href]) => {
      const link = document.createElement('a'); link.href=href; link.className='site-finder-item';
      link.innerHTML=`<span class="site-finder-icon" aria-hidden="true">${icon}</span><span class="site-finder-copy"><strong>${label}</strong><small>${description}</small></span><span class="site-finder-arrow" aria-hidden="true">↗</span>`;
      link.addEventListener('click', event => { event.preventDefault(); go(href); });
      results.append(link);
    });
  };
  const show = () => { render(''); dialog.showModal(); setTimeout(() => input.focus(),0); };
  trigger.addEventListener('click',show);
  dialog.querySelector('.site-finder-close').addEventListener('click',close);
  dialog.addEventListener('click',event => { if (event.target===dialog) close(); });
  input.addEventListener('input',() => render(input.value));
  dialog.querySelector('.site-random-button').addEventListener('click',() => go(destinations[Math.floor(Math.random()*destinations.length)][3]));
  addEventListener('keydown',event => {
    if ((event.ctrlKey||event.metaKey) && event.key.toLowerCase()==='k') { event.preventDefault(); dialog.open ? close() : show(); }
  });

  const connection = document.createElement('div');
  connection.className='connection-badge'; connection.setAttribute('role','status'); document.body.append(connection);
  let connectionTimer;
  const reportConnection = online => {
    connection.textContent = online ? '● 网络已恢复' : '● 当前离线，部分共享功能暂不可用';
    connection.classList.toggle('offline',!online); connection.classList.add('visible');
    clearTimeout(connectionTimer); if (online) connectionTimer=setTimeout(()=>connection.classList.remove('visible'),2400);
  };
  addEventListener('online',()=>reportConnection(true)); addEventListener('offline',()=>reportConnection(false));
  if (!navigator.onLine) reportConnection(false);
})();
